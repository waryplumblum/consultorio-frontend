import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.scss',
})
export class AdminNavComponent implements OnInit {
  isAdmin: boolean = false;
  isLoggedIn: boolean = false; // Para ocultar/mostrar si no está logeado

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Suscribirse al estado de login para saber cuándo mostrar el menú
    this.authService.isLoggedIn().subscribe((status) => {
      this.isLoggedIn = status;
      if (status) {
        this.checkUserRole(); // Si está logeado, verificar el rol
      } else {
        this.isAdmin = false; // Si no está logeado, no es admin
      }
    });

    // También verificar el rol al inicio si ya hay un token
    if (this.authService.getToken()) {
      this.checkUserRole();
    }
  }

  private checkUserRole(): void {
    const decodedToken = this.authService.getDecodedToken();
    if (decodedToken && decodedToken.role === 'admin') {
      this.isAdmin = true;
    } else {
      this.isAdmin = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
