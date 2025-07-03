import { Routes } from '@angular/router';

import { AppointmentForm } from './appointment-form/appointment-form';
import { LoginComponent } from './admin/login-component/login-component';
import { DoctorPresentation } from './doctor-presentation/doctor-presentation';
import { DashboardComponent } from './admin/dashboard-component/dashboard-component';

import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/doctor-info', pathMatch: 'full' }, 
  { path: 'doctor-info', component: DoctorPresentation }, 
  { path: 'agendar-cita', component: AppointmentForm }, 
  { path: 'admin/login', component: LoginComponent },
    {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/doctor-info' } 
];
