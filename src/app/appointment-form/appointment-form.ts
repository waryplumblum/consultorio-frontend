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

import { PhoneNumberFormatterDirective } from '../shared/phone-number-formatter';

@Component({
  selector: 'app-appointment-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PhoneNumberFormatterDirective,
    TitleCasePipe,
  ],
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
  statusOptions: string[] = ['pending', 'confirmed', 'cancelled', 'completed'];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService
  ) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      patientEmail: ['', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required],
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
          this.onDateChange(date);
          // Resetear la hora si la fecha cambia y la hora seleccionada ya no es válida
          if (
            this.appointmentForm.get('preferredTime')?.value &&
            !this.availableTimesForSelectedDate.includes(
              this.appointmentForm.get('preferredTime')?.value
            )
          ) {
            this.appointmentForm.get('preferredTime')?.setValue('');
          }
        });
    }

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
      return;
    }

    const rawData = this.appointmentForm.value;

    const datePart = rawData.preferredDate;
    const timePart = rawData.preferredTime;
    const combinedDateTime = new Date(`${datePart}T${timePart}:00`);

    const formattedData = {
      ...rawData,
      preferredDateTime: combinedDateTime.toISOString(),
      scheduledDateTime: combinedDateTime.toISOString(),
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
        this.onDateChange(
          this.appointmentForm.get('preferredDate')?.value || this.minDate
        );
      });
  }

  private updateAvailableDates(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.availableDates = [];
    for (let i = 0; i < 60; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookedTimesForDate = this.bookedSlots[dateString] || [];
      const hasAvailableTime = this.allPossibleTimes.some((time) => {
        if (dateString === this.minDate) {
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
      return;
    }

    const bookedTimesForSelectedDate = this.bookedSlots[selectedDate] || [];
    const now = new Date();
    const todayString = now.toISOString().split('T')[0];

    this.availableTimesForSelectedDate = this.allPossibleTimes.filter(
      (time) => {
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
        return !bookedTimesForSelectedDate.includes(time);
      }
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
