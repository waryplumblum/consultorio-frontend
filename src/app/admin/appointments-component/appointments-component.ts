import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Appointment, AppointmentsResponse } from '../../models/appointment.model';
import { AppointmentService } from '../../services/appointment-service';

@Component({
  selector: 'app-appointments-component',
  templateUrl: './appointments-component.html',
  styleUrl: './appointments-component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  providers: [DatePipe]
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

  constructor(
    private appointmentsService: AppointmentService,
    private router: Router
  ) { }

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
      sortOrder: 'desc'
    };

    if (this.filterPatientName) {
      queryParams.patientName = this.filterPatientName;
    }
    if (this.filterStatus) {
      queryParams.status = this.filterStatus;
    }
    if (this.filterDateFrom) {

      queryParams.dateFrom = new Date(this.filterDateFrom).toISOString();
    }
    if (this.filterDateTo) {
      queryParams.dateTo = new Date(this.filterDateTo).toISOString();
    }

    this.appointmentsService.getAllAppointments(queryParams).subscribe({
      next: (response: AppointmentsResponse) => {
        this.appointments = response.data.map(app => ({
          ...app,
          scheduledDateTime: new Date(app.scheduledDateTime),
          preferredDateTime: new Date(app.preferredDateTime)
        }));
        this.totalAppointments = response.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar citas:', err);
        this.errorMessage = 'No se pudieron cargar las citas. Inténtalo de nuevo.';
        this.loading = false;
      }
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
  }

  clearFilters(): void {
    this.filterPatientName = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
    this.loadAppointments();
  }

  editAppointment(id: string): void {
    this.router.navigate(['/admin/appointments/edit', id]);
  }

  deleteAppointment(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      this.appointmentsService.deleteAppointment(id).subscribe({
        next: () => {
          console.log('Cita eliminada:', id);
          this.loadAppointments();
        },
        error: (err) => {
          console.error('Error al eliminar cita:', err);
          this.errorMessage = 'No se pudo eliminar la cita.';
        }
      });
    }
  }
}