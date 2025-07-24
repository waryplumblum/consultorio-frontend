import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Para la navegación después del login
import { HttpClientModule } from '@angular/common/http'; // Asegúrate de importarlo aquí si es standalone
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login-component',
  imports: [ReactiveFormsModule, CommonModule, HttpClientModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss',
  standalone: true,
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null; // Para mostrar errores
  loading = false; // Para indicar que la petición está en curso

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.errorMessage = null; // Limpiar mensajes de error anteriores
    this.loading = true;

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: (response) => {
          console.log('Login exitoso:', response);
          this.loading = false;
          // Redirigir al usuario al panel de administración o a una ruta protegida
          this.router.navigate(['/admin/dashboard']); // Crearemos esta ruta más adelante
        },
        error: (err) => {
          this.loading = false;
          console.error('Error en el login:', err);
          if (err.status === 401) {
            this.errorMessage =
              'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
          } else {
            this.errorMessage =
              'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.';
          }
        },
      });
    } else {
      this.loading = false;
      this.errorMessage = 'Por favor, introduce un email y contraseña válidos.';
    }
  }
}
