import { Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AppointmentsResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private apiUrl = 'http://localhost:3000/appointments';

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Método para obtener el token del AuthService y construir los headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' }); // Sin token si no está logeado
  }

  // Método para obtener el resumen del dashboard
  getAppointmentsSummary(): Observable<{ totalAppointments: number, upcomingAppointments: Appointment[] }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ totalAppointments: number, upcomingAppointments: Appointment[] }>(`${this.apiUrl}/summary`, { headers });
  }
  // Si decides tener un método para obtener TODAS las citas para la tabla, aquí iría:
  getAllAppointments(params?: any): Observable<AppointmentsResponse> {
    const headers = this.getAuthHeaders();
    let httpParams = new HttpParams();

    if (params) {
      for (const key in params) {
        if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined && params[key] !== '') {
          // Si es una fecha, asegúrate de que sea un string ISO
          if (params[key] instanceof Date) {
            httpParams = httpParams.set(key, params[key].toISOString());
          } else {
            httpParams = httpParams.set(key, params[key].toString());
          }
        }
      }
    }
    return this.http.get<AppointmentsResponse>(this.apiUrl, { headers, params: httpParams });
  }

  getAppointmentById(id: string): Observable<Appointment> {
    const headers = this.getAuthHeaders();
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`, { headers });
  }

  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    const headers = this.getAuthHeaders();
    return this.http.post<Appointment>(this.apiUrl, appointment, { headers });
  }

  updateAppointment(id: string, appointment: Partial<Appointment>): Observable<Appointment> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, appointment, { headers });
  }

  deleteAppointment(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
  }
  // --- FIN NUEVOS MÉTODOS ---
}