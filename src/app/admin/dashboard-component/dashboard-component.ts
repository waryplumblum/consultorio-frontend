import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-dashboard-component',
  standalone: true, // Asegura que sea standalone
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard-component.html',
  styleUrl: './dashboard-component.scss'
})
export class DashboardComponent implements OnInit {

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    // Aquí podrías cargar datos del dashboard, como el número de citas pendientes, etc.
  }

  logout(): void {
    this.authService.logout(); // Llama al método de logout del servicio
    this.router.navigate(['/admin/login']); // Redirige al usuario a la página de login
  }

}
