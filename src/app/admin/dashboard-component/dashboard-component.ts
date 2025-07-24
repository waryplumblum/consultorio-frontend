import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { AppointmentService } from '../../services/appointment-service';

interface UpcomingAppointment {
  _id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
  preferredDateTime: Date; // O Date, si Mongoose lo convierte
  scheduledDateTime: Date; // O Date
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-dashboard-component',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss',
  providers: [DatePipe],
})
export class DashboardComponent implements OnInit {
  totalAppointments: number = 0;
  upcomingAppointments: UpcomingAppointment[] = [];
  loadingData: boolean = true;
  errorMessage: string | null = null;

  statusTranslations: { [key: string]: string } = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada',
    // Agrega aquí cualquier otro estado que manejes
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loadingData = true;
    this.errorMessage = null;

    this.appointmentService.getAppointmentsSummary().subscribe({
      next: (data) => {
        this.totalAppointments = data.totalAppointments;
        this.upcomingAppointments = data.upcomingAppointments.map((app) => ({
          ...app,
          scheduledDateTime: new Date(app.scheduledDateTime), // Convierte a objeto Date
        }));
        this.loadingData = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard:', err);
        this.errorMessage =
          'No se pudieron cargar los datos del dashboard. Inténtalo de nuevo.';
        this.loadingData = false;
      },
    });
  }

  getTranslatedStatus(status: string): string {
    return this.statusTranslations[status] || status; // Si no encuentra traducción, devuelve el original
  }

  logout(): void {
    this.authService.logout(); // Llama al método de logout del servicio
    this.router.navigate(['/admin/login']); // Redirige al usuario a la página de login
  }
}
