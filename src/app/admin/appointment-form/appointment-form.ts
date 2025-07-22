import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment-service';

@Component({
  selector: 'app-admin-appointment-form',
  templateUrl: './appointment-form.html',
  styleUrl: './appointment-form.scss',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]

})
export class AdminAppointmentForm implements OnInit {

  appointmentForm: FormGroup;
  isEditMode: boolean = false;
  appointmentId: string | null = null;
  loading: boolean = false;
  submitMessage: string | null = null;
  errorMessage: string | null = null;

  statusOptions: string[] = ['pending', 'confirmed', 'cancelled', 'completed'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsService: AppointmentService
  ) {
    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      patientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], // 10 dígitos
      patientEmail: ['', [Validators.required, Validators.email]],
      reason: ['', Validators.required],
      preferredDateTime: ['', Validators.required],
      scheduledDateTime: ['', Validators.required],
      status: ['pending', Validators.required]
    });
  }

  ngOnInit(): void {
    // Suscribirse a los parámetros de la ruta para detectar modo edición
    this.route.paramMap.subscribe(params => {
      this.appointmentId = params.get('id');
      if (this.appointmentId) {
        this.isEditMode = true;
        this.loadAppointmentData(this.appointmentId);
      }
    });
  }

  loadAppointmentData(id: string): void {
    this.loading = true;
    this.appointmentsService.getAppointmentById(id).subscribe({
      next: (appointment: Appointment) => {
        // --- CONSOLE.LOG PARA VER DATOS RECIBIDOS DEL BACKEND ---
        console.log('Frontend (loadAppointmentData): Datos de la cita recibidos del backend:', appointment);
        console.log('Frontend (loadAppointmentData): Tipo de preferredDateTime recibido:', typeof appointment.preferredDateTime, appointment.preferredDateTime);
        console.log('Frontend (loadAppointmentData): Tipo de scheduledDateTime recibido:', typeof appointment.scheduledDateTime, appointment.scheduledDateTime);
        // --- FIN CONSOLE.LOG ---

        const preferredDateTime = new Date(appointment.preferredDateTime).toISOString().slice(0, 16);
        const scheduledDateTime = new Date(appointment.scheduledDateTime).toISOString().slice(0, 16);

        // --- CONSOLE.LOG PARA VER DATOS FORMATEADOS PARA EL INPUT HTML ---
        console.log('Frontend (loadAppointmentData): preferredDateTime formateado para input:', preferredDateTime);
        console.log('Frontend (loadAppointmentData): scheduledDateTime formateado para input:', scheduledDateTime);
        // --- FIN CONSOLE.LOG ---

        this.appointmentForm.patchValue({
          patientName: appointment.patientName,
          patientPhone: appointment.patientPhone,
          patientEmail: appointment.patientEmail,
          reason: appointment.reason,
          preferredDateTime: preferredDateTime,
          scheduledDateTime: scheduledDateTime,
          status: appointment.status
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la cita:', err);
        this.errorMessage = 'No se pudo cargar la cita para edición.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitMessage = null;
    this.errorMessage = null;

    if (this.appointmentForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos y corrige los errores.';
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.appointmentForm.value;


      const datePart = formData.preferredDateTime; // Ej: "2024-07-10"
      const timePart = formData.scheduledDateTime; // Ej: "15:30"

      const combinedDateTimeString = `${datePart}T${timePart}:00`;
      const preferredDateTime = new Date(combinedDateTimeString);

      const preferredDateTimeISO = preferredDateTime.toISOString();
      const scheduledDateTimeISO = preferredDateTimeISO;

      console.log("preferredDateTimeISO: ", preferredDateTimeISO);
      console.log("scheduledDateTimeISO: ", scheduledDateTimeISO);

      formData.preferredDateTime = preferredDateTimeISO;
      formData.scheduledDateTime = scheduledDateTimeISO;

    // --- CONSOLE.LOG PARA VER LOS DATOS ENVIADOS AL BACKEND ---
    console.log('Frontend (onSubmit): Datos finales a enviar al backend:', formData);
    console.log('Frontend (onSubmit): Tipo de preferredDateTime a enviar:', typeof formData.preferredDateTime, formData.preferredDateTime);
    console.log('Frontend (onSubmit): Tipo de scheduledDateTime a enviar:', typeof formData.scheduledDateTime, formData.scheduledDateTime);
    // --- FIN CONSOLE.LOG ---

    let operation: Observable<Appointment>;

    if (this.isEditMode && this.appointmentId) {
      operation = this.appointmentsService.updateAppointment(this.appointmentId, formData);
    } else {
      operation = this.appointmentsService.createAppointment(formData);
    }

    operation.subscribe({
      next: (res) => {
        console.log('Frontend (onSubmit): Respuesta del backend (éxito):', res); // Log de la respuesta del backend
        this.submitMessage = `Cita ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`;
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin/appointments']);
        }, 2000);
      },
      error: (err) => {
        console.error(`Frontend (onSubmit): Error al ${this.isEditMode ? 'actualizar' : 'crear'} la cita:`, err); // Log del error
        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            this.errorMessage = err.error.message.join(', ');
          } else {
            this.errorMessage = err.error.message;
          }
        } else {
          this.errorMessage = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la cita. Por favor, inténtalo de nuevo.`;
        }
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/appointments']);
  }

  // Método para obtener el mensaje de error de un campo específico
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
}