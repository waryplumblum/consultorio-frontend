import { Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AppointmentsResponse } from '../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/appointments';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // --- Métodos que SÍ requieren autenticación (mantienen el comportamiento original) ---

  getAppointmentsSummary(): Observable<{
    totalAppointments: number;
    upcomingAppointments: Appointment[];
  }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{
      totalAppointments: number;
      upcomingAppointments: Appointment[];
    }>(`${this.apiUrl}/summary`, { headers });
  }

  getAllAppointments(params?: any): Observable<AppointmentsResponse> {
    const headers = this.getAuthHeaders();
    let httpParams = new HttpParams();

    if (params) {
      for (const key in params) {
        if (
          params.hasOwnProperty(key) &&
          (params as any)[key] !== null &&
          (params as any)[key] !== undefined &&
          (params as any)[key] !== ''
        ) {
          // Si el valor es un booleano, asegúrate de que se serialice correctamente
          if (typeof (params as any)[key] === 'boolean') {
            httpParams = httpParams.set(key, (params as any)[key].toString());
          } else {
            httpParams = httpParams.set(key, (params as any)[key].toString());
          }
        }
      }
    }
    return this.http.get<AppointmentsResponse>(this.apiUrl, {
      headers,
      params: httpParams,
    });
  }

  getAppointmentById(id: string): Observable<Appointment> {
    const headers = this.getAuthHeaders();
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`, { headers });
  }

  updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    const headers = this.getAuthHeaders();
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}`, appointment, {
      headers,
    });
  }

  softDeleteAppointment(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    // Llama a PATCH para actualizar el campo isDeleted a true
    return this.http.patch<any>(
      `${this.apiUrl}/${id}`,
      { isDeleted: true },
      { headers }
    );
  }

  // --- Métodos que NO requieren autenticación ---

  createAppointment(
    appointment: Partial<Appointment>
  ): Observable<Appointment> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Appointment>(this.apiUrl, appointment, { headers });
  }

  getFutureAppointmentsPublic(): Observable<Appointment[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    // console.log(
    //   'getFutureAppointmentsPublic: Enviando petición GET a /future sin token. Headers:',
    //   headers.keys()
    // );
    return this.http.get<Appointment[]>(`${this.apiUrl}/future`, { headers });
  }
}
