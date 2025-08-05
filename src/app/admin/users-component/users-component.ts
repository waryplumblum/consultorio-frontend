import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth-service'; // Para verificar roles
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; // Para optimizar la búsqueda en inputs
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users-component',
  templateUrl: './users-component.html',
  styleUrls: ['./users-component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // RouterModule para routerLink
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  loading: boolean = true;
  errorMessage: string | null = null;
  isAdmin: boolean = false; // Para habilitar/deshabilitar acciones solo para admins
  filteredUsers: User[] = []; // Nueva lista para usuarios filtrados

  filterEmail: string = '';
  filterName: string = ''; // Combina firstName y lastName para el filtro
  filterRole: string = '';

  // Para optimizar el filtrado en tiempo real de los inputs
  private filterTextChanged = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService // Para roles
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadUsers();
    this.filterTextChanged
      .pipe(
        debounceTime(300), // Espera 300ms después de la última pulsación
        distinctUntilChanged() // Solo emite si el valor es diferente al anterior
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }
  onFilterChange(): void {
    this.filterTextChanged.next();
  }

  checkUserRole(): void {
    this.isAdmin = this.authService.hasRole('admin');
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = null;

    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.loading = false;
        this.applyFilters(); // Aplica filtros iniciales después de cargar
        if (this.users.length === 0) {
          this.notificationService.showInfo('No hay usuarios registrados.');
        }
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.notificationService.showError(
          'No se pudieron cargar los usuarios.'
        );
        this.errorMessage = 'Error al cargar usuarios.'; // Mantener para mostrar en UI si es un error crítico
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let tempUsers = [...this.users]; // Siempre filtra sobre la lista completa

    if (this.filterEmail) {
      tempUsers = tempUsers.filter((user) =>
        user.email.toLowerCase().includes(this.filterEmail.toLowerCase())
      );
    }

    if (this.filterName) {
      const filterTerm = this.filterName.toLowerCase();
      tempUsers = tempUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(filterTerm) ||
          user.lastName.toLowerCase().includes(filterTerm)
      );
    }

    if (this.filterRole) {
      tempUsers = tempUsers.filter(
        (user) => user.role.toLowerCase() === this.filterRole.toLowerCase()
      );
    }

    this.filteredUsers = tempUsers;
    // Si no hay usuarios filtrados, puedes mostrar un mensaje específico
    if (
      this.filteredUsers.length === 0 &&
      !this.loading &&
      !this.errorMessage
    ) {
      this.notificationService.showInfo(
        'No se encontraron usuarios que coincidan con los filtros.'
      );
    }
  }

  clearFilters(): void {
    this.filterEmail = '';
    this.filterName = '';
    this.filterRole = '';
    this.applyFilters(); // Vuelve a aplicar los filtros (sin ninguno activo)
    this.notificationService.showInfo('Filtros limpiados.');
  }

  editUser(id: string): void {
    this.router.navigate(['/admin/users/edit', id]);
  }

  deleteUser(id: string): void {
    if (!this.isAdmin) {
      this.notificationService.showWarning(
        'No tienes permisos para eliminar usuarios.'
      );
      return;
    }

    if (
      confirm(
        '¿Estás seguro de que quieres eliminar lógicamente este usuario? No será visible y no podrá iniciar sesión.'
      )
    ) {
      this.userService.softDeleteUser(id).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Usuario eliminado lógicamente.'
          );
          this.loadUsers(); // Recargar la lista de usuarios
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          this.notificationService.showError('No se pudo eliminar el usuario.');
        },
      });
    } else {
      this.notificationService.showInfo('Eliminación de usuario cancelada.');
    }
  }

}
