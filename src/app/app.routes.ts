import { Routes } from '@angular/router';

import { AppointmentForm } from './appointment-form/appointment-form';
import { LoginComponent } from './admin/login-component/login-component';
import { DoctorPresentation } from './doctor-presentation/doctor-presentation';
import { DashboardComponent } from './admin/dashboard-component/dashboard-component';

import { AuthGuard } from './guards/auth-guard';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout';

export const routes: Routes = [
  { path: '', redirectTo: '/doctor-info', pathMatch: 'full' },
  { path: 'doctor-info', component: DoctorPresentation },
  { path: 'agendar-cita', component: AppointmentForm },
  { path: 'admin/login', component: LoginComponent },
  {
    path: 'admin', // Ruta principal para el área de administración
    component: AdminLayoutComponent, // Este componente será el layout
    canActivate: [AuthGuard], // Protege todo el área de administración
    children: [ // Las rutas hijas se renderizarán dentro del <router-outlet> del layout
      { path: 'dashboard', component: DashboardComponent },
      // Aquí irán las rutas para Gestión de Citas y Gestión de Usuarios
      // { path: 'appointments', component: AdminAppointmentsComponent },
      // { path: 'users', component: AdminUsersComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' } // Redirige /admin a /admin/dashboard
    ]
  },
  // Aquí puedes añadir una ruta para "No autorizado" si lo deseas
  // { path: 'unauthorized', component: UnauthorizedComponent }
  { path: '**', redirectTo: '/doctor-info' }
];
