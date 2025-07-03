import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Base URL de tu API de autenticación
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken()); // Estado de login
  currentLoginStatus = this.loggedIn.asObservable(); // Observable para suscribirse

  constructor(private http: HttpClient) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('access_token'); // Verifica si hay un token en localStorage
  }

  login(credentials: { email: string; password: string }): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
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

  // Opcional: Decodificar token para obtener información del usuario
  getDecodedToken(): any {
    const token = this.getToken();
    if (token) {
      try {
        // En un proyecto real, usarías una librería JWT como jwt-decode para esto
        // npm install jwt-decode
        // import jwt_decode from "jwt-decode";
        // return jwt_decode(token);

        // Para este ejemplo simple, una decodificación básica (NO SEGURA para producción)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);

      } catch (e) {
        console.error('Error al decodificar el token:', e);
        return null;
      }
    }
    return null;
  }
}