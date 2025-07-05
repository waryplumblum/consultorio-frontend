import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment-service';

@Component({
  selector: 'app-appointment-form',
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
      preferredDate: ['', Validators.required],
      preferredTime: ['', Validators.required],
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
        // Formatear las fechas a 'YYYY-MM-DDTHH:mm' para los inputs datetime-local
        const preferredDateObj = new Date(appointment.preferredDateTime);
        const preferredDate = preferredDateObj.toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const preferredTime = preferredDateObj.toISOString().slice(11, 16); // 'HH:mm'


        //const preferredDate = new Date(appointment.preferredDate).toISOString().slice(0, 16);
        //const preferredTime = new Date(appointment.preferredTime).toISOString().slice(0, 16);

        this.appointmentForm.patchValue({
          patientName: appointment.patientName,
          patientPhone: appointment.patientPhone,
          patientEmail: appointment.patientEmail,
          reason: appointment.reason,
          preferredDate: preferredDate,
          preferredTime: preferredTime,
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
      this.appointmentForm.markAllAsTouched(); // Marca todos los campos como tocados para mostrar validación
      return;
    }

    this.loading = true;
    const formData = this.appointmentForm.value;

    // Convertir los strings de fecha/hora de los inputs a objetos Date
    // Es CRÍTICO que estos sean objetos Date para el backend
    formData.preferredDate = new Date(formData.preferredDate);
    formData.preferredTime = new Date(formData.preferredTime);

    let operation: Observable<Appointment>;

    if (this.isEditMode && this.appointmentId) {
      operation = this.appointmentsService.updateAppointment(this.appointmentId, formData);
    } else {
      operation = this.appointmentsService.createAppointment(formData);
    }

    operation.subscribe({
      next: (res) => {
        this.submitMessage = `Cita ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`;
        this.loading = false;
        // Redirigir al listado de citas después de un breve mensaje
        setTimeout(() => {
          this.router.navigate(['/admin/appointments']);
        }, 2000);
      },
      error: (err) => {
        console.error(`Error al ${this.isEditMode ? 'actualizar' : 'crear'} la cita:`, err);
        this.errorMessage = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la cita. Por favor, inténtalo de nuevo.`;
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