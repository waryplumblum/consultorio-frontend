import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment-service';
import { AppointmentForm } from '../../appointment-form/appointment-form';

@Component({
  selector: 'app-admin-appointment-management',
  templateUrl: './admin-appointment-management.component.html',
  styleUrl: './admin-appointment-management.scss',
  standalone: true,
  imports: [CommonModule, AppointmentForm]

})
export class AdminAppointmentManagementComponent implements OnInit {

  isEditMode: boolean = false;
  appointmentId: string | null = null;
  loading: boolean = false; // Estado de carga para el submit
  submitMessage: string | null = null;
  errorMessage: string | null = null;
  initialFormData: Appointment | null = null; // Para pasar los datos de edición al componente hijo

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsService: AppointmentService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.appointmentId = params.get('id');
      if (this.appointmentId) {
        this.isEditMode = true;
        this.loadAppointmentData(this.appointmentId);
      }
    });
  }

  loadAppointmentData(id: string): void {
    this.loading = true; // El loading se controla desde el padre
    this.appointmentsService.getAppointmentById(id).subscribe({
      next: (appointment: Appointment) => {
        // Pasa el objeto appointment completo. El componente hijo se encargará de mapearlo.
        this.initialFormData = appointment;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la cita:', err);
        this.errorMessage = 'No se pudo cargar la cita para edición.';
        this.loading = false;
      }
    });
  }

  // Este método es llamado por el @Output() formSubmit del AppointmentForm
  onFormSubmittedFromChild(event: { isValid: boolean, data: any }): void {
    this.submitMessage = null;
    this.errorMessage = null;

    if (!event.isValid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos y corrige los errores.';
      return;
    }

    this.loading = true; // Activa el loading mientras se realiza la operación
    const formData = event.data; // Los datos ya vienen listos para el backend desde el hijo

    console.log('Admin (onFormSubmittedFromChild): Datos finales a enviar al backend:', formData);

    let operation: Observable<Appointment>;

    if (this.isEditMode && this.appointmentId) {
      operation = this.appointmentsService.updateAppointment(this.appointmentId, formData);
    } else {
      operation = this.appointmentsService.createAppointment(formData);
    }

    operation.subscribe({
      next: (res) => {
        console.log('Admin (onFormSubmittedFromChild): Respuesta del backend (éxito):', res);
        this.submitMessage = `Cita ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`;
        this.loading = false; // Desactiva el loading
        setTimeout(() => {
          this.router.navigate(['/admin/appointments']);
        }, 2000);
      },
      error: (err) => {
        console.error(`Admin (onFormSubmittedFromChild): Error al ${this.isEditMode ? 'actualizar' : 'crear'} la cita:`, err);
        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            this.errorMessage = err.error.message.join(', ');
          } else {
            this.errorMessage = err.error.message;
          }
        } else {
          this.errorMessage = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} la cita. Por favor, inténtalo de nuevo.`;
        }
        this.loading = false; // Desactiva el loading
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/appointments']);
  }
}