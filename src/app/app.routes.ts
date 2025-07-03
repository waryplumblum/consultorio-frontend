import { Routes } from '@angular/router';

import { AppointmentForm } from './appointment-form/appointment-form';
import { LoginComponent } from './admin/login-component/login-component';
import { DoctorPresentation } from './doctor-presentation/doctor-presentation';

export const routes: Routes = [
  { path: '', redirectTo: '/doctor-info', pathMatch: 'full' }, 
  { path: 'doctor-info', component: DoctorPresentation }, 
  { path: 'agendar-cita', component: AppointmentForm }, 
  { path: 'admin/login', component: LoginComponent },
  { path: '**', redirectTo: '/doctor-info' } 
];
