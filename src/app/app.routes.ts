import { Routes } from '@angular/router';

import { AppointmentForm } from './appointment-form/appointment-form';
import { LoginComponent } from './admin/login-component/login-component';
import { DoctorPresentation } from './doctor-presentation/doctor-presentation';
import { DashboardComponent } from './admin/dashboard-component/dashboard-component';

import { AuthGuard } from './guards/auth-guard';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout';
import { AppointmentsComponent } from './admin/appointments-component/appointments-component';

export const routes: Routes = [
  { path: '', redirectTo: '/doctor-info', pathMatch: 'full' },
  { path: 'doctor-info', component: DoctorPresentation },
  { path: 'agendar-cita', component: AppointmentForm },
  { path: 'admin/login', component: LoginComponent },
  {
    path: 'admin', 
    component: AdminLayoutComponent, 
    canActivate: [AuthGuard],
    children: [ 
      { path: 'dashboard', component: DashboardComponent },
     { path: 'appointments', component: AppointmentsComponent },
      // { path: 'users', component: AdminUsersComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // Aquí puedes añadir una ruta para "No autorizado" si lo deseas
  // { path: 'unauthorized', component: UnauthorizedComponent }
  { path: '**', redirectTo: '/doctor-info' }
];
