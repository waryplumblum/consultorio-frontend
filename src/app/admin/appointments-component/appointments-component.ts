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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
  allAppointments: Appointment[] = []; // Lista para guardar TODAS las citas sin filtrar
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

  private filterTextChanged = new Subject<void>();

  constructor(
    private appointmentsService: AppointmentService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // console.log('ngOnInit: Inicializando componente de citas.');
    // Suscribirse a los cambios de filtro una vez al inicio
    this.filterTextChanged
      .pipe(
        debounceTime(300) // Espera 300ms después de la última pulsación
        // distinctUntilChanged() // Solo emite si el valor es diferente al anterior
      )
      .subscribe(() => {
        // console.log(
        //   'filterTextChanged: Se detectó un cambio en el filtro. Llamando applyFilters().'
        // );
        this.currentPage = 1; // Importante para que los filtros se apliquen desde la primera página
        this.applyFilters();
      });

    // Cargar TODAS las citas una sola vez al inicio
    this.loadAllAppointments();
  }

  loadAllAppointments(): void {
    // console.log(
    //   'loadAllAppointments: Iniciando carga de TODAS las citas desde el backend.'
    // );
    this.loading = true;
    this.errorMessage = null;

    this.appointmentsService.getAllAppointments().subscribe({
      next: (response: Appointment[]) => {
        // console.log(
        //   'loadAllAppointments: Citas recibidas del backend:',
        //   response
        // );
        this.allAppointments = response.map((app: Appointment) => ({
          ...app,
          scheduledDateTime: new Date(app.scheduledDateTime),
          preferredDateTime: new Date(app.preferredDateTime),
        }));
        // console.log(
        //   'loadAllAppointments: allAppointments (después de mapear fechas):',
        //   this.allAppointments
        // );
        this.loading = false;
        this.applyFilters(); // Aplica los filtros iniciales (que estarán vacíos)
        if (this.allAppointments.length === 0) {
          this.notificationService.showInfo('No hay citas registradas.');
        }
      },
      error: (err) => {
        // console.error('loadAllAppointments: Error al cargar citas:', err);
        this.notificationService.showError('No se pudieron cargar las citas.');
        this.loading = false;
        this.errorMessage = 'Error al cargar citas.';
      },
    });
  }

  onFilterChange(): void {
    // console.log(
    //   'onFilterChange: Valor de filtro cambiado. Disparando Subject.'
    // );
    this.filterTextChanged.next();
  }

  applyFilters(): void {
    // console.log('applyFilters: Iniciando aplicación de filtros locales.');
    // console.log(
    //   'applyFilters: allAppointments (lista completa antes de filtrar):',
    //   this.allAppointments
    // );
    // console.log('applyFilters: Valores de filtro actuales:', {
    //   patientName: this.filterPatientName,
    //   status: this.filterStatus,
    //   dateFrom: this.filterDateFrom,
    //   dateTo: this.filterDateTo,
    // });

    let tempAppointments = [...this.allAppointments]; // Siempre filtra sobre la lista completa

    // Aplicar filtro por nombre del paciente (insensible a mayúsculas/minúsculas)
    if (this.filterPatientName) {
      const filterTerm = this.filterPatientName.toLowerCase();
      tempAppointments = tempAppointments.filter((appointment) =>
        appointment.patientName.toLowerCase().includes(filterTerm)
      );
      // console.log(
      //   'applyFilters: Después de filtrar por nombre:',
      //   tempAppointments
      // );
    }

    // Aplicar filtro por estado
    if (this.filterStatus) {
      tempAppointments = tempAppointments.filter(
        (appointment) => appointment.status === this.filterStatus
      );
      // console.log(
      //   'applyFilters: Después de filtrar por estado:',
      //   tempAppointments
      // );
    }

    // Aplicar filtro por rango de fechas
    if (this.filterDateFrom) {
      const dateFrom = new Date(this.filterDateFrom);
      dateFrom.setHours(0, 0, 0, 0); // Ajustar para que la fecha de inicio sea el comienzo del día
      tempAppointments = tempAppointments.filter(
        (appointment) => appointment.scheduledDateTime >= dateFrom
      );
      // console.log(
      //   'applyFilters: Después de filtrar por fecha DESDE:',
      //   tempAppointments
      // );
    }
    if (this.filterDateTo) {
      const dateTo = new Date(this.filterDateTo);
      dateTo.setHours(23, 59, 59, 999); // Ajustar la fecha "hasta" para incluir todo el día
      tempAppointments = tempAppointments.filter(
        (appointment) => appointment.scheduledDateTime <= dateTo
      );
      // console.log(
      //   'applyFilters: Después de filtrar por fecha HASTA:',
      //   tempAppointments
      // );
    }

    // Actualizar el total de citas filtradas
    this.totalAppointments = tempAppointments.length;
    // console.log(
    //   'applyFilters: Total de citas filtradas:',
    //   this.totalAppointments
    // );

    // Aplicar la paginación local a la lista filtrada
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.appointments = tempAppointments.slice(startIndex, endIndex);
    // console.log(
    //   'applyFilters: Citas mostradas (paginadas):',
    //   this.appointments
    // );

    // Notificaciones (ajustadas para ser más consistentes con el users-component)
    const hasActiveFilters =
      this.filterPatientName ||
      this.filterStatus ||
      this.filterDateFrom ||
      this.filterDateTo;

    if (this.appointments.length === 0 && hasActiveFilters) {
      this.notificationService.showInfo(
        'No se encontraron citas que coincidan con los filtros aplicados.'
      );
    } else if (this.appointments.length > 0 && hasActiveFilters) {
      this.notificationService.showInfo('Filtros aplicados.');
    }
    // Si no hay filtros activos y hay citas, no se muestra notificación.
    // Si no hay filtros activos y no hay citas, la notificación se maneja en loadAllAppointments.
  }

  onPageChange(page: number): void {
    // console.log('onPageChange: Cambiando a página:', page);
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.applyFilters(); // Se llama a applyFilters para actualizar la paginación de la lista filtrada
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalAppointments / this.itemsPerPage);
  }

  getPagesArray(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  clearFilters(): void {
    // console.log('clearFilters: Limpiando todos los filtros.');
    this.filterPatientName = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.currentPage = 1; // Reiniciar a la primera página
    this.applyFilters(); // Vuelve a aplicar los filtros (sin ninguno activo)
    this.notificationService.showInfo('Filtros limpiados.');
  }

  editAppointment(id: string): void {
    this.router.navigate(['/admin/appointments/edit', id]);
  }

  deleteAppointment(id: string): void {
    // console.log('deleteAppointment: Intentando eliminar cita con ID:', id);
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      this.appointmentsService.softDeleteAppointment(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Cita eliminada lógicamente.');
          // console.log(
          //   'deleteAppointment: Cita eliminada exitosamente. Recargando todas las citas.'
          // );
          this.loadAllAppointments(); // Después de eliminar, recargar TODAS las citas para actualizar la lista local
        },
        error: (err) => {
          // console.error('deleteAppointment: Error al eliminar cita:', err);
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
