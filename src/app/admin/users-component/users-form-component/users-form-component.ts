import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Importar ReactiveFormsModule y FormBuilder
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Observable } from 'rxjs'; // Para el tipo de operación
import { User } from '../../../models/user.model';
import { NotificationService } from '../../../services/notification.service';
import { UserService } from '../../../services/user-service';

@Component({
  selector: 'app-users-form-component',
  templateUrl: './users-form-component.html',
  styleUrls: ['./users-form-component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule], // RouterModule para routerLink
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup; // Usamos '!' para indicar que se inicializará en ngOnInit
  isEditMode: boolean = false;
  userId: string | null = null;
  loading: boolean = false;
  initialUserData: User | null = null; // Para guardar los datos iniciales en modo edición

  // Opciones de rol (deben coincidir con tu backend)
  roleOptions: ('admin' | 'secretary')[] = ['admin', 'secretary'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initForm(); // Inicializar el formulario

    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('id');
      if (this.userId) {
        this.isEditMode = true;
        this.loadUserData(this.userId);
      }
    });
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      role: ['secretary', Validators.required], // Valor por defecto
      // isDeleted no se gestiona directamente en el formulario de creación/edición,
      // se gestiona en el borrado lógico.
    });

    // Si estamos en modo edición, la contraseña no es obligatoria a menos que se cambie
    if (this.isEditMode) {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  loadUserData(id: string): void {
    this.loading = true;
    this.userService.getUserById(id).subscribe({
      next: (user: User) => {
        this.initialUserData = user; // Guardar los datos originales
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          // No parchear la contraseña por seguridad
          role: user.role,
        });
        // Deshabilitar el campo de email en modo edición si no quieres que se cambie
        this.userForm.get('email')?.disable();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario:', err);
        this.notificationService.showError('No se pudo cargar el usuario para edición.');
        this.loading = false;
        this.router.navigate(['/admin/users']); // Redirigir si no se encuentra el usuario
      },
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.notificationService.showError('Por favor, completa todos los campos requeridos y corrige los errores.');
      return;
    }

    this.loading = true;
    const formData = this.userForm.getRawValue(); // Usar getRawValue para incluir campos deshabilitados (como email)

    let operation: Observable<User>;

    if (this.isEditMode && this.userId) {
      const changedData: Partial<User & { password?: string }> = {};

      // Comparar solo los campos que pueden ser modificados
      if (formData.firstName !== this.initialUserData?.firstName) {
        changedData.firstName = formData.firstName;
      }
      if (formData.lastName !== this.initialUserData?.lastName) {
        changedData.lastName = formData.lastName;
      }
      // El email está deshabilitado, así que no se espera que cambie desde el formulario.
      // Si se permitiera cambiar, también se compararía.

      if (formData.password) { // Solo si el usuario ingresó una nueva contraseña
        changedData.password = formData.password;
      }
      if (formData.role !== this.initialUserData?.role) {
        changedData.role = formData.role;
      }

      if (Object.keys(changedData).length === 0) {
        this.notificationService.showInfo('No se detectaron cambios para actualizar.');
        this.loading = false;
        setTimeout(() => this.router.navigate(['/admin/users']), 1000);
        return;
      }

      operation = this.userService.updateUser(this.userId, changedData);
    } else {
      // Modo creación, se envían todos los datos del formulario
      operation = this.userService.createUser(formData);
    }

    operation.subscribe({
      next: (res) => {
        this.notificationService.showSuccess(`Usuario ${this.isEditMode ? 'actualizado' : 'creado'} exitosamente.`);
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 1000);
      },
      error: (err) => {
        console.error(`Error al ${this.isEditMode ? 'actualizar' : 'crear'} usuario:`, err);
        let errorMsg = `No se pudo ${this.isEditMode ? 'actualizar' : 'crear'} el usuario.`;

        if (err.error && err.error.message) {
          if (Array.isArray(err.error.message)) {
            errorMsg = err.error.message.join(', ');
          } else {
            errorMsg = err.error.message;
          }
        }
        this.notificationService.showError(errorMsg);
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }
}