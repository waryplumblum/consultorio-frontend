import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { AppointmentService } from '../services/appointment-service';
import { Appointment, AppointmentsResponse } from '../models/appointment.model';

import { PhoneNumberFormatterDirective } from '../shared/phone-number-formatter';

@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule, PhoneNumberFormatterDirective,],
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
  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService
  ) {
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
      preferredTime: ['', Validators.required],
    });

    this.generateAllPossibleTimes(); // Generar los horarios base
    this.fetchBookedAppointments(); // Cargar las citas existentes al iniciar

    // Suscribirse a cambios en la fecha preferida para actualizar los horarios disponibles
    this.appointmentForm
      .get('preferredDate')
      ?.valueChanges.subscribe((date) => {
        this.onDateChange(date);
      });
  }

  /**
   * Permite solo la entrada de dígitos numéricos y controla el largo del campo.
   * @param event El evento de teclado.
   */
  onPhoneKeyPress(event: KeyboardEvent): void {
    const inputChar = String.fromCharCode(event.charCode);
    const phoneNumberControl = this.appointmentForm.get('patientPhone');
    const currentValue = phoneNumberControl?.value || '';

    // Permitir solo dígitos (0-9)
    const isNumeric = /^[0-9]$/.test(inputChar);

    // Permitir teclas de control (backspace, delete, flechas, tab, etc.)
    const isControlKey =
      event.keyCode === 8 ||
      event.keyCode === 46 || // Backspace, Delete
      event.keyCode === 37 ||
      event.keyCode === 39 || // Left, Right arrows
      event.keyCode === 9; // Tab

    // Si no es numérico y no es una tecla de control, prevenir la entrada
    if (!isNumeric && !isControlKey) {
      event.preventDefault();
      return;
    }

    // Limitar a 10 dígitos (aunque maxlength="10" ya lo hace en HTML, esto es una capa extra)
    // Solo si la tecla presionada es un número y ya tenemos 10 dígitos
    if (isNumeric && currentValue.length >= 10) {
      event.preventDefault();
    }
  }

  /**
   * Genera una lista de todos los posibles horarios de cita en intervalos de 30 minutos.
   * Asume un horario de 9:00 a 17:00.
   */
  private generateAllPossibleTimes(): void {
    this.allPossibleTimes = []; // Limpiar horarios existentes
    const startHour = 16; // 4 PM
    const startMinute = 30; // 4:30 PM
    const endHour = 20; // 8 PM
    const endMinute = 0; // 8:00 PM

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (true) {
      const time = `${String(currentHour).padStart(2, '0')}:${String(
        currentMinute
      ).padStart(2, '0')}`;
      this.allPossibleTimes.push(time);

      currentMinute += 30;

      if (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour++;
      }

      if (
        currentHour > endHour ||
        (currentHour === endHour && currentMinute > endMinute)
      ) {
        break;
      }
    }
  }

  private fetchBookedAppointments(): void {
    this.appointmentService
      .getFutureAppointmentsPublic()
      .pipe(
        catchError((error) => {
          console.error('Error al cargar las citas existentes:', error);
          this.errorMessage =
            'No se pudieron cargar los horarios disponibles. Por favor, intente de nuevo más tarde.';
          this.submissionError = true;
          return throwError(() => new Error(this.errorMessage));
        })
      )
      .subscribe((appointments: Appointment[]) => {
        this.bookedSlots = {};

        appointments
          .filter((app: Appointment) => app.status !== 'cancelled')
          .forEach((app: Appointment) => {
            const date = new Date(app.preferredDateTime)
              .toISOString()
              .split('T')[0];
            const time = new Date(app.preferredDateTime).toLocaleTimeString(
              'es-MX',
              { hour: '2-digit', minute: '2-digit', hour12: false }
            );

            if (!this.bookedSlots[date]) {
              this.bookedSlots[date] = [];
            }
            this.bookedSlots[date].push(time);
          });

        this.updateAvailableDates();
        const selectedDate = this.appointmentForm.get('preferredDate')?.value;
        if (selectedDate) {
          this.onDateChange(selectedDate);
        }
      });
  }

  private updateAvailableDates(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.availableDates = [];
    // Generar un rango de fechas futuras (ej. los próximos 60 días)
    for (let i = 0; i < 60; i++) {
      // Generar fechas para los próximos 60 días
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateString = futureDate.toISOString().split('T')[0];

      // Filtrar los horarios para esta fecha y ver si hay alguno disponible
      const bookedTimesForDate = this.bookedSlots[dateString] || [];
      const hasAvailableTime = this.allPossibleTimes.some((time) => {
        // Si es hoy, solo considerar horarios futuros
        if (dateString === this.minDate) {
          // Usar this.minDate para comparar con la fecha actual
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

  onDateChange(selectedDate: string): void {
    if (!selectedDate) {
      this.availableTimesForSelectedDate = [];
      this.appointmentForm.get('preferredTime')?.setValue(''); // Limpiar el horario si no hay fecha
      return;
    }

    const bookedTimesForSelectedDate = this.bookedSlots[selectedDate] || [];
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    this.availableTimesForSelectedDate = this.allPossibleTimes.filter(
      (time) => {
        // Si la fecha seleccionada es hoy, solo mostrar horarios futuros
        if (selectedDate === todayString) {
          const [hour, minute] = time.split(':').map(Number);
          const slotDateTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute
          );
          return (
            slotDateTime > now && !bookedTimesForSelectedDate.includes(time)
          );
        }
        // Para fechas futuras, solo filtrar por los horarios ya reservados
        return !bookedTimesForSelectedDate.includes(time);
      }
    );

    // Si el horario previamente seleccionado ya no está disponible, resetearlo
    const currentSelectedTime =
      this.appointmentForm.get('preferredTime')?.value;
    if (
      currentSelectedTime &&
      !this.availableTimesForSelectedDate.includes(currentSelectedTime)
    ) {
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

      const appointmentData: Partial<Appointment> = {
        // Tipar appointmentData
        patientName: formValue.patientName,
        patientPhone: formValue.patientPhone,
        patientEmail: formValue.patientEmail,
        reason: formValue.reason,
        preferredDateTime: preferredDateTime, // Asignar el objeto Date directamente
        scheduledDateTime: preferredDateTime, // Asignar el objeto Date directamente
        status: 'pending', // Asegurarse de que el status inicial sea 'pending'
      };

      console.log('Datos de la cita a enviar:', appointmentData);

      // Usar el servicio para crear la cita
      this.appointmentService
        .createAppointment(appointmentData)
        .pipe(
          catchError((error) => {
            console.error('Error al enviar la cita:', error);
            this.submissionError = true;
            this.errorMessage =
              'Hubo un error al agendar su cita. Por favor, intente de nuevo.';
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
        .subscribe((response) => {
          console.log('Cita agendada con éxito:', response);
          this.submissionSuccess = true;
          this.appointmentForm.reset();
          this.formSubmitted = false;
          this.fetchBookedAppointments();
          setTimeout(() => {
            this.submissionSuccess = false;
          }, 5000);
        });
    } else {
      console.log('Formulario inválido. Revise los campos.');
      this.submissionError = true;
      this.errorMessage =
        'Por favor, complete todos los campos obligatorios y corrija los errores.';
    }
  }
}
