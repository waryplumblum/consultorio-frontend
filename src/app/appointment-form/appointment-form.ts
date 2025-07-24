import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, throwError } from 'rxjs';
import { AppointmentService } from '../services/appointment-service';
import { Appointment } from '../models/appointment.model';

import { PhoneNumberFormatterDirective } from '../shared/components/formatter/phone-number-formatter';

@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule, PhoneNumberFormatterDirective],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.scss',
  standalone: true,
})
export class AppointmentForm implements OnInit, OnChanges {
  @Input() formTitle: string = '';
  @Input() submitButtonText: string = 'Agendar Cita';
  @Input() isEditMode: boolean = false;
  @Input() showStatusField: boolean = false;
  @Input() initialData: Appointment | null = null;
  @Input() externalLoading: boolean = false;

  @Output() formReset = new EventEmitter<void>();
  @Output() formSubmit = new EventEmitter<{ isValid: boolean; data: any }>();

  appointmentForm!: FormGroup;
  submissionSuccess = false;
  submissionError = false;
  errorMessage: string = '';

  availableDates: string[] = [];
  availableTimesForSelectedDate: string[] = [];
  allPossibleTimes: string[] = [];
  bookedSlots: { [date: string]: string[] } = {};
  minDate: string;

  statusOptionsTranslated: { value: string; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'completed', label: 'Completada' },
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService
  ) {
    const today = new Date();
    // Aseguramos que minDate sea la fecha local de hoy al inicio del día
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    this.minDate = localToday.toISOString().split('T')[0];
    console.log('Constructor - minDate (today - LOCAL):', this.minDate);

    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      patientEmail: ['', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: [{ value: '', disabled: true }],
      status: ['pending'],
    });
  }

  ngOnInit(): void {
    if (!this.isEditMode) {
      this.generateAllPossibleTimes();
      this.fetchBookedAppointments();

      this.appointmentForm
        .get('preferredDate')
        ?.valueChanges.subscribe((date) => {
          console.log('preferredDate changed to:', date);

          const preferredTimeControl =
            this.appointmentForm.get('preferredTime');

          if (date) {
            // Si hay una fecha seleccionada, habilitar el control de tiempo
            preferredTimeControl?.enable();
            // Y establecer el validador requerido
            preferredTimeControl?.setValidators(Validators.required);
          } else {
            // Si no hay fecha, deshabilitar el control de tiempo
            preferredTimeControl?.disable();
            // Limpiar el valor y los validadores si se borra la fecha
            preferredTimeControl?.setValue('');
            preferredTimeControl?.clearValidators();
          }
          preferredTimeControl?.updateValueAndValidity(); // Asegurarse de que los validadores se actualicen

          this.onDateChange(date); // Tu lógica existente para actualizar los tiempos disponibles

          // Restablecer preferredTime si el valor actual no está en los tiempos disponibles
          // Esto ya lo tienes, pero es bueno revisarlo si el control estaba deshabilitado
          if (
            preferredTimeControl?.value &&
            !this.availableTimesForSelectedDate.includes(
              preferredTimeControl.value
            )
          ) {
            console.log(
              'Resetting preferredTime due to date change or disable.'
            );
            preferredTimeControl.setValue('');
          }
        });
    }

    // ... (resto de tu ngOnInit, sin cambios significativos aquí)
    if (this.showStatusField) {
      this.appointmentForm.get('status')?.setValidators(Validators.required);
    } else {
      this.appointmentForm.get('status')?.clearValidators();
    }
    this.appointmentForm.get('status')?.updateValueAndValidity();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData && this.appointmentForm) {
      const data = this.initialData;
      this.appointmentForm.patchValue({
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail,
        reason: data.reason,
        preferredDate: data.preferredDateTime
          ? new Date(data.preferredDateTime).toISOString().split('T')[0]
          : '',
        preferredTime: data.preferredDateTime
          ? new Date(data.preferredDateTime).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : '',
        status: data.status || 'pending',
      });
      console.log(
        'ngOnChanges - initialData patched:',
        this.appointmentForm.value
      );

      // AÑADE ESTE BLOQUE DE CÓDIGO AQUÍ:
      if (this.isEditMode) {
        const preferredTimeControl = this.appointmentForm.get('preferredTime');
        // Si hay una fecha en initialData, habilita el control de tiempo
        if (this.appointmentForm.get('preferredDate')?.value) {
          preferredTimeControl?.enable();
          preferredTimeControl?.setValidators(Validators.required);
          preferredTimeControl?.updateValueAndValidity();
          console.log('ngOnChanges - preferredTime ENABLED for edit mode');
        } else {
          // Si por alguna razón no hay fecha en initialData (ej. nuevo registro o error), deshabilitarlo
          preferredTimeControl?.disable();
          preferredTimeControl?.clearValidators();
          preferredTimeControl?.updateValueAndValidity();
          console.log(
            'ngOnChanges - preferredTime DISABLED for edit mode (no initial date)'
          );
        }
      }
    }

    if (changes['showStatusField'] && this.appointmentForm) {
      if (changes['showStatusField'].currentValue) {
        this.appointmentForm.get('status')?.setValidators(Validators.required);
      } else {
        this.appointmentForm.get('status')?.clearValidators();
      }
      this.appointmentForm.get('status')?.updateValueAndValidity();
    }
  }

  onInternalSubmit(): void {
    this.submissionSuccess = false;
    this.submissionError = false;
    this.errorMessage = '';

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      this.errorMessage =
        'Por favor, completa todos los campos requeridos y corrige los errores.';
      this.formSubmit.emit({ isValid: false, data: null });
      console.log('Form is invalid. Errors:', this.appointmentForm.errors);
      return;
    }

    const rawData = this.appointmentForm.value;

    const datePart = rawData.preferredDate; // Ej: "2025-07-24"
    const timePart = rawData.preferredTime; // Ej: "18:00"

    // Crear una fecha/hora en la zona horaria LOCAL del usuario
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    // Los meses en Date son 0-indexados (0=Enero, 6=Julio)
    const localDateTime = new Date(year, month - 1, day, hour, minute);

    console.log('onInternalSubmit - raw preferredDate:', datePart);
    console.log('onInternalSubmit - raw preferredTime:', timePart);
    console.log(
      'onInternalSubmit - localDateTime (LOCAL):',
      localDateTime.toLocaleString() // Muestra la fecha/hora en formato local legible
    );
    console.log(
      'onInternalSubmit - localDateTime (ISO, which is UTC):',
      localDateTime.toISOString() // Esta es la que se enviará, es en UTC
    );

    const formattedData = {
      ...rawData,
      preferredDateTime: localDateTime.toISOString(), // Envía en ISO (UTC) al backend
      scheduledDateTime: localDateTime.toISOString(), // Envía en ISO (UTC) al backend
    };

    delete formattedData.preferredDate;
    delete formattedData.preferredTime;

    if (!this.showStatusField) {
      delete formattedData.status;
    }

    this.formSubmit.emit({ isValid: true, data: formattedData });
  }

  resetForm(): void {
    this.appointmentForm.reset();
    this.appointmentForm.get('status')?.setValue('pending');

    Object.keys(this.appointmentForm.controls).forEach((key) => {
      this.appointmentForm.get(key)?.setErrors(null);
    });

    if (!this.isEditMode) {
      this.fetchBookedAppointments();
    }

    console.log('Form has been reset.');
    this.formReset.emit();
  }

  getControlErrorMessage(controlName: string): string | null {
    const control = this.appointmentForm.get(controlName);
    if (control?.touched && control?.invalid) {
      if (control.errors?.['required']) {
        return 'Este campo es requerido.';
      }
      if (control.errors?.['email']) {
        return 'Por favor, introduce un correo electrónico válido.';
      }
      if (control.errors?.['pattern']) {
        return 'El teléfono debe tener 10 dígitos numéricos.';
      }
    }
    return null;
  }

  private generateAllPossibleTimes(): void {
    this.allPossibleTimes = [];
    const startHour = 16;
    const startMinute = 30;
    const endHour = 20;
    const endMinute = 0;

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
    console.log('Generated all possible times:', this.allPossibleTimes);
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
        console.log('Fetched appointments (raw from backend):', appointments);

        appointments
          .filter((app: Appointment) => app.status !== 'cancelled')
          .forEach((app: Appointment) => {
            // Convertir la fecha/hora de UTC (del backend) a LOCAL para la lógica del frontend
            const appDateTime = new Date(app.preferredDateTime); // Esto crea un Date object en la zona horaria LOCAL del cliente

            const date = `${appDateTime.getFullYear()}-${String(
              appDateTime.getMonth() + 1
            ).padStart(2, '0')}-${String(appDateTime.getDate()).padStart(
              2,
              '0'
            )}`;
            const time = `${String(appDateTime.getHours()).padStart(
              2,
              '0'
            )}:${String(appDateTime.getMinutes()).padStart(2, '0')}`;

            if (!this.bookedSlots[date]) {
              this.bookedSlots[date] = [];
            }
            this.bookedSlots[date].push(time);
          });
        console.log(
          'Booked slots after processing (LOCAL dates/times):',
          this.bookedSlots
        );

        this.updateAvailableDates();
        this.onDateChange(
          this.appointmentForm.get('preferredDate')?.value || this.minDate
        );
      });
  }

  private updateAvailableDates(): void {
    const today = new Date();
    // Obtener la fecha de HOY al inicio del día en la zona horaria local
    const todayStartOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayString = `${todayStartOfDay.getFullYear()}-${String(
      todayStartOfDay.getMonth() + 1
    ).padStart(2, '0')}-${String(todayStartOfDay.getDate()).padStart(2, '0')}`;

    console.log(
      'updateAvailableDates - Current date (start of day - LOCAL):',
      todayStartOfDay.toLocaleString()
    );
    console.log(
      'updateAvailableDates - todayString for comparison (LOCAL):',
      todayString
    );

    this.availableDates = [];
    for (let i = 0; i < 60; i++) {
      const futureDate = new Date(todayStartOfDay);
      futureDate.setDate(todayStartOfDay.getDate() + i);
      // Formatear la fecha futura para que coincida con el formato de `bookedSlots`
      const dateString = `${futureDate.getFullYear()}-${String(
        futureDate.getMonth() + 1
      ).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

      const bookedTimesForDate = this.bookedSlots[dateString] || [];
      const hasAvailableTime = this.allPossibleTimes.some((time) => {
        if (dateString === todayString) {
          const [hour, minute] = time.split(':').map(Number);
          const currentTime = new Date(); // Hora actual LOCAL

          const slotTime = new Date(
            currentTime.getFullYear(),
            currentTime.getMonth(),
            currentTime.getDate(),
            hour,
            minute,
            0,
            0
          );

          console.log(
            `Checking slot ${time} for today (${dateString}): currentTime=${currentTime.toLocaleTimeString()}, slotTime=${slotTime.toLocaleTimeString()}, booked=${bookedTimesForDate.includes(
              time
            )}`
          );
          return slotTime > currentTime && !bookedTimesForDate.includes(time);
        }
        return !bookedTimesForDate.includes(time);
      });

      if (hasAvailableTime) {
        this.availableDates.push(dateString);
      }
    }
    console.log(
      'updateAvailableDates - Available Dates (LOCAL):',
      this.availableDates
    );
  }

  onDateChange(selectedDate: string): void {
    console.log('onDateChange called with selectedDate:', selectedDate);
    if (!selectedDate) {
      this.availableTimesForSelectedDate = [];
      console.log('onDateChange - No selected date, clearing times.');
      return;
    }

    const bookedTimesForSelectedDate = this.bookedSlots[selectedDate] || [];
    const now = new Date(); // La hora actual del cliente

    // Obtener la fecha de HOY sin la hora (inicio del día, LOCAL)
    const todayStartOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Crear objeto Date para la fecha seleccionada al inicio del día (LOCAL).
    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
    const selectedDateObject = new Date(selYear, selMonth - 1, selDay);

    console.log(
      'onDateChange - current time (now - LOCAL):',
      now.toLocaleTimeString()
    );
    console.log(
      'onDateChange - todayStartOfDay (LOCAL):',
      todayStartOfDay.toLocaleString()
    );
    console.log(
      'onDateChange - selectedDateObject (LOCAL):',
      selectedDateObject.toLocaleString()
    );
    console.log(
      'onDateChange - bookedTimesForSelectedDate:',
      bookedTimesForSelectedDate
    );

    this.availableTimesForSelectedDate = this.allPossibleTimes.filter(
      (time) => {
        // Comparamos si la fecha seleccionada es el MISMO DÍA que "hoy" (sin importar la hora)
        // Usamos getTime() para comparar los milisegundos desde el epoch para fechas limpias LOCALES
        if (selectedDateObject.getTime() === todayStartOfDay.getTime()) {
          const [hour, minute] = time.split(':').map(Number);
          const slotDateTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute
          );
          console.log(
            `onDateChange - Checking slot ${time} for selected date (TODAY - ${selectedDate}): slotDateTime=${slotDateTime.toLocaleTimeString()}, now=${now.toLocaleTimeString()}, booked=${bookedTimesForSelectedDate.includes(
              time
            )}`
          );
          // Si es hoy, solo mostramos los slots futuros y no reservados
          return (
            slotDateTime > now && !bookedTimesForSelectedDate.includes(time)
          );
        } else {
          // Si es CUALQUIER OTRO DÍA (futuro), mostramos todos los slots no reservados
          console.log(
            `onDateChange - Checking slot ${time} for future date (${selectedDate}): booked=${bookedTimesForSelectedDate.includes(
              time
            )}`
          );
          return !bookedTimesForSelectedDate.includes(time);
        }
      }
    );
    console.log(
      'onDateChange - Available times for selected date:',
      this.availableTimesForSelectedDate
    );
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const inputChar = String.fromCharCode(event.charCode);
    const phoneNumberControl = this.appointmentForm.get('patientPhone');
    const currentValue = phoneNumberControl?.value || '';

    const isNumeric = /^[0-9]$/.test(inputChar);
    const isControlKey =
      event.keyCode === 8 ||
      event.keyCode === 46 ||
      event.keyCode === 37 ||
      event.keyCode === 39 ||
      event.keyCode === 9;

    if (!isNumeric && !isControlKey) {
      event.preventDefault();
      return;
    }

    if (isNumeric && currentValue.length >= 10) {
      event.preventDefault();
    }
  }
}
