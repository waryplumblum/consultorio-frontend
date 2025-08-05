import { Routes } from '@angular/router';

import { AppointmentForm } from './appointment-form/appointment-form';
import { LoginComponent } from './admin/login-component/login-component';
import { DoctorPresentation } from './doctor-presentation/doctor-presentation';
import { DashboardComponent } from './admin/dashboard-component/dashboard-component';

import { AuthGuard } from './guards/auth-guard';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout';
import { AppointmentsComponent } from './admin/appointments-component/appointments-component';
import { AdminAppointmentManagementComponent } from './admin/appointment-form/appointment-form';
import { AdminUsersComponent } from './admin/users-component/users-component';
import { UserFormComponent } from './admin/users-component/users-form-component/users-form-component';

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
      {
        path: 'appointments/new',
        component: AdminAppointmentManagementComponent,
      },
      {
        path: 'appointments/edit/:id',
        component: AdminAppointmentManagementComponent,
      },
      { path: 'users', component: AdminUsersComponent },
      { path: 'users/new', component: UserFormComponent },
      { path: 'users/edit/:id', component: UserFormComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/doctor-info' },
];
