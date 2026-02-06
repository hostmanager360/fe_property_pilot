import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage';
import Swal from 'sweetalert2';

export const OnboardingGuard: CanActivateFn = (route) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const firstAccess = tokenStorage.getFirstAccess();
  const step = tokenStorage.getOnboardingStep();

  if (!firstAccess) return true;

  switch (step) {
    case '1':
      if (route.routeConfig?.path !== 'tenant-first-access') {
        Swal.fire('Accesso non permesso', 'Completa prima la creazione del tenant.', 'warning');
        router.navigateByUrl('/tenant-first-access');
        return false;
      }
      break;

    case '2':
      if (route.routeConfig?.path !== 'user-first-access') {
        Swal.fire('Accesso non permesso', 'Completa prima i tuoi dati personali.', 'warning');
        router.navigateByUrl('/user-first-access');
        return false;
      }
      break;

    case '3':
      if (route.routeConfig?.path !== 'previsione') {
        Swal.fire('Accesso non necessario', 'Hai già completato il primo accesso.', 'info');
        router.navigateByUrl('/previsione');
        return false;
      }
      break;

    default:
      Swal.fire('Errore', 'Percorso non valido o sessione corrotta.', 'error');
      tokenStorage.clear();
      router.navigateByUrl('/');
      return false;
  }

  return true;
};