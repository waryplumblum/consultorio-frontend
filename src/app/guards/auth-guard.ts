import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.authService.isLoggedIn().pipe(
      take(1), // Toma el primer valor y luego completa
      map((isLoggedIn) => {
        if (isLoggedIn) {
          // Opcional: Si quieres añadir lógica basada en roles (ej. solo admin puede acceder)
          // const userRole = this.authService.getDecodedToken()?.role;
          // if (route.data['roles'] && !route.data['roles'].includes(userRole)) {
          //   this.router.navigate(['/unauthorized']); // Redirigir a página de no autorizado
          //   return false;
          // }
          return true; // Si está logueado, permite el acceso
        } else {
          // Si no está logueado, redirige a la página de login
          this.router.navigate(['/admin/login']);
          return false;
        }
      })
    );
  }
}
