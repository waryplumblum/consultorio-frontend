import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment-service';
import { AppointmentForm } from '../../appointment-form/appointment-form';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-appointment-management',
  templateUrl: './admin-appointment-management.component.html',
  styleUrl: './admin-appointment-management.scss',
  standalone: true,
  imports: [CommonModule, AppointmentForm],
})
export class AdminAppointmentManagementComponent implements OnInit {
  isEditMode: boolean = false;
  appointmentId: string | null = null;
  loading: boolean = false;
  initialFormData: Appointment | null = null;

  private originalAppointmentData: Appointment | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentsService: AppointmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
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
        this.initialFormData = appointment;

        this.originalAppointmentData = { ...appointment };
        // console.log(
        //   'Admin (loadAppointmentData): Cita original cargada y guardada:',
        //   this.originalAppointmentData
        // );

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar la cita:', err);
        this.notificationService.showError(
          'No se pudo cargar la cita para edición.'
        );
        this.loading = false;
      },
    });
  }

  onFormSubmittedFromChild(event: { isValid: boolean; data: any }): void {
    if (!event.isValid) {
      this.notificationService.showError(
        'Por favor, completa todos los campos requeridos y corrige los errores.'
      );
      return;
    }

    this.loading = true;
    const formData = event.data;

    // console.log(
    //   'Admin (onFormSubmittedFromChild): Datos finales a enviar al backend:',
    //   formData
    // );

    let operation: Observable<Appointment>;

    if (this.isEditMode && this.appointmentId && this.originalAppointmentData) {
      const changedData: Partial<Appointment> = {};

      // patientName
      if (formData.patientName !== this.originalAppointmentData.patientName) {
        changedData.patientName = formData.patientName;
      }
      // patientPhone
      if (formData.patientPhone !== this.originalAppointmentData.patientPhone) {
        changedData.patientPhone = formData.patientPhone;
      }
      // patientEmail
      if (formData.patientEmail !== this.originalAppointmentData.patientEmail) {
        changedData.patientEmail = formData.patientEmail;
      }
      // reason
      if (formData.reason !== this.originalAppointmentData.reason) {
        changedData.reason = formData.reason;
      }

      // preferredDateTime y scheduledDateTime
      const originalPreferredDateTimeISO =
        this.originalAppointmentData.preferredDateTime;
      const originalScheduledDateTimeISO =
        this.originalAppointmentData.scheduledDateTime ||
        originalPreferredDateTimeISO;

      if (formData.preferredDateTime !== originalPreferredDateTimeISO) {
        changedData.preferredDateTime = formData.preferredDateTime;
      }
      if (formData.scheduledDateTime !== originalScheduledDateTimeISO) {
        changedData.scheduledDateTime = formData.scheduledDateTime;
      }
      // status
      if (
        formData.status &&
        formData.status !== this.originalAppointmentData.status
      ) {
        changedData.status = formData.status;
      }

      // console.log(
      //   'Admin (onFormSubmittedFromChild): Campos modificados detectados:',
      //   changedData
      // );

      if (Object.keys(changedData).length === 0) {
        this.notificationService.showInfo(
          'No se detectaron cambios para guardar.'
        );
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin/appointments']);
        }, 1000);
        return;
      }

      // Si hay cambios, usa changedData para la operación de actualización
      operation = this.appointmentsService.updateAppointment(
        this.appointmentId,
        changedData
      );
    } else {
      operation = this.appointmentsService.createAppointment(formData);
    }

    operation.subscribe({
      next: (res) => {
        // console.log(
        //   'Admin (onFormSubmittedFromChild): Respuesta del backend (éxito):',
        //   res
        // );

        this.notificationService.showSuccess(
          `Cita ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente.`
        );
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin/appointments']);
        }, 1000);
      },
      error: (err) => {
        console.error(
          `Admin (onFormSubmittedFromChild): Error al ${
            this.isEditMode ? 'actualizar' : 'crear'
          } la cita:`,
          err
        );

        let errorMsg = `No se pudo ${
          this.isEditMode ? 'actualizar' : 'crear'
        } la cita. Por favor, inténtalo de nuevo.`;

        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            errorMsg = err.error.message.join(', ');
          } else {
            errorMsg = err.error.message;
          }
        }

        this.notificationService.showError(errorMsg);

        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/appointments']);
  }
}
