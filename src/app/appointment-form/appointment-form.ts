import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { AppointmentService } from '../services/appointment-service';
import { Appointment, AppointmentsResponse } from '../models/appointment.model';


@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule,],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.scss',
  standalone: true,
})
export class AppointmentForm implements OnInit {

  appointmentForm!: FormGroup;
  formSubmitted = false;
  submissionSuccess = false;
  submissionError = false;
  errorMessage: string = '';

  // Propiedades para manejar disponibilidad
  availableDates: string[] = []; // Fechas con al menos un horario disponible
  availableTimesForSelectedDate: string[] = []; // Horarios disponibles para la fecha seleccionada
  allPossibleTimes: string[] = []; // Todos los horarios que el doctor ofrece en un día
  bookedSlots: { [date: string]: string[] } = {}; // Horarios ya tomados por fecha
  minDate: string; // Para deshabilitar fechas pasadas

  // Inyectar AppointmentService en lugar de HttpClient
  constructor(private fb: FormBuilder, private appointmentService: AppointmentService) {
    // Establecer la fecha mínima para el input de fecha (hoy o mañana si hoy ya pasó la hora)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }

  ngOnInit(): void {
    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      patientEmail: ['', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required]
    });

    this.generateAllPossibleTimes(); // Generar los horarios base
    this.fetchBookedAppointments(); // Cargar las citas existentes al iniciar

    // Suscribirse a cambios en la fecha preferida para actualizar los horarios disponibles
    this.appointmentForm.get('preferredDate')?.valueChanges.subscribe(date => {
      this.onDateChange(date);
    });
  }

  /**
   * Genera una lista de todos los posibles horarios de cita en intervalos de 30 minutos.
   * Asume un horario de 9:00 a 17:00.
   */
  private generateAllPossibleTimes(): void {
    for (let hour = 14; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 60) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        // No incluir 17:30 si la última cita es a las 17:00 (ajusta según el último horario disponible real)
        if (hour === 17 && minute > 0) {
          continue;
        }
        this.allPossibleTimes.push(time);
      }
    }
  }

  /**
   * Obtiene las citas agendadas desde el backend usando el AppointmentService
   * y las procesa para determinar la disponibilidad.
   */
  private fetchBookedAppointments(): void {
    this.appointmentService.getAllAppointments() // Usar el servicio para obtener todas las citas
      .pipe(
        catchError(error => {
          console.error('Error al cargar las citas existentes:', error);
          this.errorMessage = 'No se pudieron cargar los horarios disponibles. Por favor, intente de nuevo más tarde.';
          this.submissionError = true;
          return throwError(() => new Error(this.errorMessage));
        })
      )
      .subscribe((response: AppointmentsResponse) => { // Especificar el tipo de respuesta
        this.bookedSlots = {}; // Reiniciar los slots reservados

        // Procesar solo las citas que NO estén canceladas
        // Corrección 1: Usar response.data
        // Corrección 2: Tipar 'app' como Appointment
        response.data.filter((app: Appointment) => app.status !== 'cancelled').forEach((app: Appointment) => {
          // preferredDateTime ahora es directamente un objeto Date
          // Asegurarse de que app.preferredDateTime sea un objeto Date válido
          const date = new Date(app.preferredDateTime).toISOString().split('T')[0];
          // Usar toLocaleTimeString con opciones para asegurar el formato HH:MM (24 horas)
          const time = new Date(app.preferredDateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

          if (!this.bookedSlots[date]) {
            this.bookedSlots[date] = [];
          }
          this.bookedSlots[date].push(time);
        });

        this.updateAvailableDates(); // Actualizar las fechas disponibles después de cargar las citas
        // Si ya hay una fecha seleccionada, actualizar los horarios para esa fecha
        const selectedDate = this.appointmentForm.get('preferredDate')?.value;
        if (selectedDate) {
          this.onDateChange(selectedDate);
        }
      });
  }

  /**
   * Actualiza la lista de fechas disponibles basándose en los horarios reservados.
   * Solo incluye fechas futuras que tengan al menos un horario disponible.
   */
  private updateAvailableDates(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día

    this.availableDates = [];
    // Generar un rango de fechas futuras (ej. los próximos 60 días)
    for (let i = 0; i < 60; i++) { // Generar fechas para los próximos 60 días
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateString = futureDate.toISOString().split('T')[0];

      // Filtrar los horarios para esta fecha y ver si hay alguno disponible
      const bookedTimesForDate = this.bookedSlots[dateString] || [];
      const hasAvailableTime = this.allPossibleTimes.some(time => {
        // Si es hoy, solo considerar horarios futuros
        if (dateString === this.minDate) { // Usar this.minDate para comparar con la fecha actual
          const [hour, minute] = time.split(':').map(Number);
          const currentTime = new Date();
          const slotTime = new Date();
          slotTime.setHours(hour, minute, 0, 0);
          return slotTime > currentTime && !bookedTimesForDate.includes(time);
        }
        return !bookedTimesForDate.includes(time);
      });

      if (hasAvailableTime) {
        this.availableDates.push(dateString);
      }
    }
  }


  /**
   * Se llama cuando la fecha preferida cambia.
   * Filtra los horarios disponibles para la fecha seleccionada.
   * @param selectedDate La fecha seleccionada en formato YYYY-MM-DD.
   */
  onDateChange(selectedDate: string): void {
    if (!selectedDate) {
      this.availableTimesForSelectedDate = [];
      this.appointmentForm.get('preferredTime')?.setValue(''); // Limpiar el horario si no hay fecha
      return;
    }

    const bookedTimesForSelectedDate = this.bookedSlots[selectedDate] || [];
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    this.availableTimesForSelectedDate = this.allPossibleTimes.filter(time => {
      // Si la fecha seleccionada es hoy, solo mostrar horarios futuros
      if (selectedDate === todayString) {
        const [hour, minute] = time.split(':').map(Number);
        const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
        return slotDateTime > now && !bookedTimesForSelectedDate.includes(time);
      }
      // Para fechas futuras, solo filtrar por los horarios ya reservados
      return !bookedTimesForSelectedDate.includes(time);
    });

    // Si el horario previamente seleccionado ya no está disponible, resetearlo
    const currentSelectedTime = this.appointmentForm.get('preferredTime')?.value;
    if (currentSelectedTime && !this.availableTimesForSelectedDate.includes(currentSelectedTime)) {
      this.appointmentForm.get('preferredTime')?.setValue('');
    }
  }


  onSubmit(): void {
    this.formSubmitted = true;
    this.submissionSuccess = false;
    this.submissionError = false;
    this.errorMessage = '';

    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;

      const datePart = formValue.preferredDate; // Ej: "2024-07-10"
      const timePart = formValue.preferredTime; // Ej: "15:30"

      // Crear la fecha y hora combinadas como objeto Date
      const preferredDateTime = new Date(`${datePart}T${timePart}:00`);

      const appointmentData: Partial<Appointment> = { // Tipar appointmentData
        patientName: formValue.patientName,
        patientPhone: formValue.patientPhone,
        patientEmail: formValue.patientEmail,
        reason: formValue.reason,
        preferredDateTime: preferredDateTime, // Asignar el objeto Date directamente
        scheduledDateTime: preferredDateTime, // Asignar el objeto Date directamente
        status: 'pending' // Asegurarse de que el status inicial sea 'pending'
      };

      console.log('Datos de la cita a enviar:', appointmentData);

      // Usar el servicio para crear la cita
      this.appointmentService.createAppointment(appointmentData)
        .pipe(
          catchError(error => {
            console.error('Error al enviar la cita:', error);
            this.submissionError = true;
            this.errorMessage = 'Hubo un error al agendar su cita. Por favor, intente de nuevo.';
            if (error.error && error.error.message) {
              if (Array.isArray(error.error.message)) {
                this.errorMessage = error.error.message.join(', ');
              } else {
                this.errorMessage = error.error.message;
              }
            }
            return throwError(() => new Error(this.errorMessage));
          })
        )
        .subscribe(response => {
          console.log('Cita agendada con éxito:', response);
          this.submissionSuccess = true;
          this.appointmentForm.reset();
          this.formSubmitted = false;
          // Volver a cargar las citas para actualizar la disponibilidad
          this.fetchBookedAppointments();
          setTimeout(() => {
            this.submissionSuccess = false;
          }, 5000);
        });
    } else {
      console.log('Formulario inválido. Revise los campos.');
      this.submissionError = true;
      this.errorMessage = 'Por favor, complete todos los campos obligatorios y corrija los errores.';
    }
  }
}