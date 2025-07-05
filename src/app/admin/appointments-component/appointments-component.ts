import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

  // Propiedades para los filtros
  filterPatientName: string = '';
  filterStatus: string = '';
  filterDateFrom: string = ''; // Usar string para input type="date"
  filterDateTo: string = '';   // Usar string para input type="date"

  // Opciones para el filtro de estado
  statusOptions: string[] = ['pending', 'confirmed', 'cancelled', 'completed'];

  constructor(private appointmentsService: AppointmentService) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.errorMessage = null;

    // Construir los parámetros de la consulta
    const queryParams: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'scheduledDateTime', // O el campo que quieras por defecto
      sortOrder: 'desc' // O el orden que quieras por defecto
    };

    if (this.filterPatientName) {
      queryParams.patientName = this.filterPatientName;
    }
    if (this.filterStatus) {
      queryParams.status = this.filterStatus;
    }
    if (this.filterDateFrom) {
      // Convertir la fecha a formato ISO string UTC para el backend
      // El backend esperará un string ISO 8601 que pueda convertir a Date
      // Aquí solo tomamos la fecha sin hora, el backend se encargará del $gte para el día completo
      queryParams.dateFrom = new Date(this.filterDateFrom).toISOString();
    }
    if (this.filterDateTo) {
      // Igual para dateTo
      queryParams.dateTo = new Date(this.filterDateTo).toISOString();
    }

    this.appointmentsService.getAllAppointments(queryParams).subscribe({
      next: (response: AppointmentsResponse) => {
        this.appointments = response.data.map(app => ({
          ...app,
          // Convertir los strings de fecha/hora a objetos Date para el frontend si se necesita manipulación de fecha
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

  // Manejar el cambio de página
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadAppointments();
    }
  }

  // Obtener el número total de páginas
  getTotalPages(): number {
    return Math.ceil(this.totalAppointments / this.itemsPerPage);
  }

  // Crear un array para iterar en la paginación (ej. [1, 2, 3, ...])
  getPagesArray(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Aplicar filtros
  applyFilters(): void {
    this.currentPage = 1; // Reiniciar a la primera página al aplicar nuevos filtros
    this.loadAppointments();
  }

  // Limpiar filtros
  clearFilters(): void {
    this.filterPatientName = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1;
    this.loadAppointments();
  }

  // Métodos para acciones de la tabla (futuras)
  editAppointment(id: string): void {
    // Implementar lógica de navegación a la página de edición
    console.log('Editar cita con ID:', id);
    // this.router.navigate(['/admin/appointments/edit', id]); // Cuando tengamos la ruta de edición
  }

  deleteAppointment(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      this.appointmentsService.deleteAppointment(id).subscribe({
        next: () => {
          console.log('Cita eliminada:', id);
          this.loadAppointments(); // Recargar la lista después de eliminar
        },
        error: (err) => {
          console.error('Error al eliminar cita:', err);
          this.errorMessage = 'No se pudo eliminar la cita.';
        }
      });
    }
  }
}