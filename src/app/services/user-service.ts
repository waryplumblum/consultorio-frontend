import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UsersResponse } from '../models/user.model';
import { AuthService } from './auth-service'; // Asumiendo que ya tienes AuthService

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000/users'; // Asegúrate de que esta URL sea correcta

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

  // Obtener todos los usuarios (filtrados por isDeleted = false en el backend)
  // Podrías añadir paginación aquí si lo deseas en el futuro, similar a getAllAppointments
  getAllUsers(): Observable<User[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<User[]>(this.apiUrl, { headers });
  }

  getUserById(id: string): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers });
  }

  createUser(userData: Partial<User & { password: string }>): Observable<User> {
    const headers = this.getAuthHeaders(); // Se requiere autenticación para crear usuarios admin/secretary
    return this.http.post<User>(this.apiUrl, userData, { headers });
  }

  updateUser(id: string, userData: Partial<User & { password?: string }>): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.patch<User>(`${this.apiUrl}/${id}`, userData, { headers });
  }

  // Método para el borrado lógico (similar a softDeleteAppointment)
  softDeleteUser(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers });
    // Alternativa: Si quisieras usar PATCH para el borrado lógico (aunque DELETE es más idiomático para 'eliminar')
    // return this.http.patch<any>(`${this.apiUrl}/${id}`, { isDeleted: true }, { headers });
  }
}