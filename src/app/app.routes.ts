import { Routes } from '@angular/router';
import { PrevisioneGuadagno } from './components/previsione-guadagno/previsione-guadagno';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';
import { OnboardingGuard } from './auth/OnboardingGuard';

export const routes: Routes = [
 {
    path: '',
    loadComponent: () => import('./auth/loginComponent/login').then(m => m.LoginComponent),
    pathMatch: 'full',
  },
  {
    path: 'registration',
    loadComponent: () => import('./auth/registrationComponent/registration').then(m => m.RegistrationComponent),
  },

  // RESET PASSWORD
  {
    path: 'reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword),
  },

  // FIRST ACCESS ADMIN → TENANT DETAILS
 {
  path: 'tenant-first-access',
  canActivate: [AuthGuard, OnboardingGuard],
  loadComponent: () => import('./auth/tenant-first-access/tenant-first-access').then(m => m.TenantFirstAccessComponent)
},


  // FIRST ACCESS HOST/COHOST → USER DETAILS
  {
    path: 'user-first-access',
    canActivate: [AuthGuard, OnboardingGuard],
    loadComponent: () => import('./auth/user-first-access/user-first-access').then(m => m.UserFirstAccess)
  },


  // PAGINA PROTETTA
  {
    path: 'previsione',
    component: PrevisioneGuadagno,
    canActivate: [AuthGuard, RoleGuard, OnboardingGuard],
    data: { roleId: [2,1]}, // ADMIN
  },

  // NOT AUTHORIZED
  {
    path: 'not-authorized',
    loadComponent: () => import('./auth/not-authorized/not-authorized').then(m => m.NotAuthorizedComponent),
  },
  {
  path: 'reset-password-final',
  loadComponent: () =>
    import('./auth/reset-password-final/reset-password-final')
      .then(m => m.ResetPasswordFinalComponent),
},

  { path: '**', redirectTo: '' },
];
