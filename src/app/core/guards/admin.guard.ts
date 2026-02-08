import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map, take, filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Espera a que la autenticación se haya inicializado
    await firstValueFrom(
      authService.authInitialized$.pipe(
        filter(initialized => initialized === true),
        take(1)
      )
    );

    // Ahora verifica si es admin
    const isAdmin = await firstValueFrom(
      authService.isAdmin().pipe(take(1))
    );

    if (isAdmin) {
      return true;
    } else {
      console.warn('Usuario autenticado pero no es admin');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  } catch (error) {
    console.error('Error en admin guard:', error);
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};
