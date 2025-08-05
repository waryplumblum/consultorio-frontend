import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user-service';
import { User } from '../../models/user.model';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth-service'; // Para verificar roles
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  // Aquí se mostrarán los usuarios paginados y filtrados
  users: User[] = [];
  // Lista completa de todos los usuarios
  allUsers: User[] = [];
  // Nueva lista para usuarios filtrados antes de la paginación
  filteredUsers: User[] = [];
  
  loading: boolean = true;
  errorMessage: string | null = null;
  isAdmin: boolean = false;

  // Variables para la paginación
  totalUsers: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;

  filterEmail: string = '';
  filterName: string = '';
  filterRole: string = '';

  private filterTextChanged = new Subject<void>();

  constructor(
    private userService: UserService,
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadAllUsers(); // Usamos este nuevo método que carga todo
    this.filterTextChanged
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1; // Resetea la página al aplicar un nuevo filtro
        this.applyFilters();
      });
  }

  onFilterChange(): void {
    this.filterTextChanged.next();
  }

  checkUserRole(): void {
    this.isAdmin = this.authService.hasRole('admin');
  }

  loadAllUsers(): void {
    this.loading = true;
    this.errorMessage = null;

    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.allUsers = users;
        this.loading = false;
        this.applyFilters();
        if (this.allUsers.length === 0) {
          this.notificationService.showInfo('No hay usuarios registrados.');
        }
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.notificationService.showError(
          'No se pudieron cargar los usuarios.'
        );
        this.errorMessage = 'Error al cargar usuarios.';
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    let tempUsers = [...this.allUsers]; // Siempre filtra sobre la lista completa

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
    this.totalUsers = this.filteredUsers.length;

    // Aplicar la paginación a la lista filtrada
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.users = this.filteredUsers.slice(startIndex, endIndex);

    // Si no hay usuarios filtrados, puedes mostrar un mensaje específico
    if (this.users.length === 0 && !this.loading && !this.errorMessage) {
      this.notificationService.showInfo(
        'No se encontraron usuarios que coincidan con los filtros.'
      );
    }
  }

  clearFilters(): void {
    this.filterEmail = '';
    this.filterName = '';
    this.filterRole = '';
    this.currentPage = 1;
    this.applyFilters();
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
          this.loadAllUsers(); // Recargar la lista completa de usuarios para reflejar el cambio
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

  // Nuevos métodos para la paginación
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.applyFilters(); // Vuelve a aplicar filtros y paginación
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalUsers / this.itemsPerPage);
  }

  getPagesArray(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}