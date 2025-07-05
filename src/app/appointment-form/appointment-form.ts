import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, throwError } from 'rxjs';


@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.scss',
  standalone: true,
})
export class AppointmentForm {

  appointmentForm!: FormGroup;
  formSubmitted = false;
  submissionSuccess = false;
  submissionError = false;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient) { }

  ngOnInit(): void {
    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], 
      patientEmail: ['', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required]
    });
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

      const combinedDateTimeString = `${datePart}T${timePart}:00`;
      const preferredDateTime = new Date(combinedDateTimeString);

      const preferredDateTimeISO = preferredDateTime.toISOString();
      const scheduledDateTimeISO = preferredDateTimeISO;

      const appointmentData = {
        patientName: formValue.patientName,
        patientPhone: formValue.patientPhone,
        patientEmail: formValue.patientEmail,
        reason: formValue.reason,
        preferredDateTime: preferredDateTimeISO,
        scheduledDateTime: scheduledDateTimeISO
      };

      //console.log(appointmentData);

      // URL de tu backend NestJS
      const apiUrl = 'http://localhost:3000/appointments';

      this.http.post(apiUrl, appointmentData)
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