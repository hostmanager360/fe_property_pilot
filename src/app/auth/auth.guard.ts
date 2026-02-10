import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage';

export const AuthGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const token = tokenStorage.getToken();
  const resetRequired = tokenStorage.getPasswordResetRequired();

  // 1. Non loggato
  if (!token) {
    tokenStorage.clear();
    router.navigateByUrl('/');
    return false;
  }

  // 2. Reset password obbligatorio
  if (resetRequired) {
    router.navigateByUrl('/reset-password');
    return false;
  }

  return true;
};