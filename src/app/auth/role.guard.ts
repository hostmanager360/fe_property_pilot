import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage';

export const RoleGuard: CanActivateFn = (route) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const requiredRoles = route.data['roleId'];
  const userRoleId = tokenStorage.getRoleId();

  if (!requiredRoles) return true;

  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  if (!rolesArray.includes(userRoleId)) {
    router.navigateByUrl('/not-authorized');
    return false;
  }

  return true;
};