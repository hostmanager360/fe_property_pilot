import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage';

const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/users/register',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/public/**'
];

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const isPublic = PUBLIC_ENDPOINTS.some(url => req.url.includes(url));

  // Se la chiamata è pubblica → passa senza token
  if (isPublic) {
    return next(req);
  }

  const token = tokenStorage.getToken();

  // Se la chiamata è protetta ma non c’è token → blocco e rimando al login
  if (!token) {
    alert('Sessione scaduta. Effettua nuovamente il login.');
    router.navigateByUrl('/');
    throw new Error('Token mancante per endpoint protetto');
  }

  // Clono la richiesta aggiungendo il token
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Gestione errori 401 → token scaduto
  return next(authReq).pipe(
    tap({
      error: (err) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          alert('Sessione scaduta. Effettua nuovamente il login.');
          tokenStorage.clear();
          router.navigateByUrl('/');
        }
      }
    })
  );
};