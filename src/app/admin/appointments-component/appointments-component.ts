import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  Appointment,
  AppointmentsResponse,
} from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment-service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-appointments-component',
  templateUrl: './appointments-component.html',
  styleUrl: './appointments-component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DatePipe],
})
export class AppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  totalAppointments: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loading: boolean = true;
  errorMessage: string | null = null;

  filterPatientName: string = '';
  filterStatus: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';

  statusOptions: string[] = ['pending', 'confirmed', 'cancelled', 'completed'];

  statusTranslations: { [key: string]: string } = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
  };

  constructor(
    private appointmentsService: AppointmentService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = null;

    const queryParams: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'scheduledDateTime',
      sortOrder: 'desc',
    };

    if (this.filterPatientName) {
      queryParams.patientName = this.filterPatientName;
    }
    if (this.filterStatus) {
      queryParams.status = this.filterStatus;
    }
    if (this.filterDateFrom) {
      const dateFromParts = this.filterDateFrom.split('-').map(Number);
      const localDateFrom = new Date(
        dateFromParts[0],
        dateFromParts[1] - 1,
        dateFromParts[2],
        0,
        0,
        0,
        0
      );
      queryParams.dateFrom = localDateFrom.toISOString();
    }
    if (this.filterDateTo) {
      const dateToParts = this.filterDateTo.split('-').map(Number);

      const localDateTo = new Date(
        dateToParts[0],
        dateToParts[1] - 1,
        dateToParts[2],
        23,
        59,
        59,
        999
      );
      queryParams.dateTo = localDateTo.toISOString();
    }

    this.appointmentsService.getAllAppointments(queryParams).subscribe({
      next: (response: AppointmentsResponse) => {
        this.appointments = response.data.map((app) => ({
          ...app,
          scheduledDateTime: new Date(app.scheduledDateTime),
          preferredDateTime: new Date(app.preferredDateTime),
        }));
        this.totalAppointments = response.total;
        this.loading = false;
        if (
          this.appointments.length === 0 &&
          !this.filterPatientName &&
          !this.filterStatus &&
          !this.filterDateFrom &&
          !this.filterDateTo
        ) {
          this.notificationService.showInfo('No hay citas registradas.');
        } else if (this.appointments.length === 0) {
          this.notificationService.showInfo(
            'No se encontraron citas con los filtros aplicados.'
          );
        }
      },
      error: (err) => {
        console.error('Error al cargar citas:', err);
        this.notificationService.showError(
          'No se pudieron cargar las citas. Inténtalo de nuevo.'
        );
        this.loading = false;
      },
    });
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadAppointments();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalAppointments / this.itemsPerPage);
  }

  getPagesArray(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAppointments();
    this.notificationService.showInfo('Filtros aplicados.');
  }

  clearFilters(): void {
    this.filterPatientName = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
    this.loadAppointments();
    this.notificationService.showInfo('Filtros limpiados.');
  }

  editAppointment(id: string): void {
    this.router.navigate(['/admin/appointments/edit', id]);
  }

  deleteAppointment(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      this.appointmentsService.softDeleteAppointment(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Cita eliminada lógicamente.');
          console.log('Cita eliminada:', id);
          this.loadAppointments();
        },
        error: (err) => {
          console.error('Error al eliminar cita:', err);
          this.notificationService.showError(
            'No se pudo eliminar la cita. Inténtalo de nuevo.'
          );
        },
      });
    } else {
      this.notificationService.showInfo('Eliminación de cita cancelada.');
    }
  }

  getTranslatedStatus(status: string): string {
    return this.statusTranslations[status] || status;
  }
}
