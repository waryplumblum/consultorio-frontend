import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importar HttpHeaders
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode'; // Importar jwt-decode

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Base URL de tu API de autenticación
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken()); // Estado de login
  currentLoginStatus = this.loggedIn.asObservable(); // Observable para suscribirse

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token'); // Verifica si hay un token en localStorage
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<{ access_token: string }> {
    return this.http
      .post<{ access_token: string }>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem('access_token', response.access_token); // Guarda el token
          this.loggedIn.next(true); // Actualiza el estado de login
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token'); // Elimina el token
    this.loggedIn.next(false); // Actualiza el estado de login
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): Observable<boolean> {
    return this.currentLoginStatus;
  }

  // Decodificar token para obtener información del usuario
  getDecodedToken(): any | null {
    const token = this.getToken();
    if (token) {
      try {
        // Usar jwt-decode para una decodificación segura
        return jwtDecode(token);
      } catch (e) {
        console.error('Error al decodificar el token:', e);
        return null;
      }
    }
    return null;
  }

  // ¡NUEVO MÉTODO! Para verificar el rol del usuario
  hasRole(requiredRole: 'admin' | 'secretary'): boolean {
    const decodedToken = this.getDecodedToken();
    if (decodedToken && decodedToken.role) {
      // Si el rol requerido es 'admin', solo 'admin' puede pasar.
      // Si el rol requerido es 'secretary', tanto 'admin' como 'secretary' pueden pasar.
      if (requiredRole === 'admin') {
        return decodedToken.role === 'admin';
      } else if (requiredRole === 'secretary') {
        return decodedToken.role === 'admin' || decodedToken.role === 'secretary';
      }
    }
    return false;
  }
}