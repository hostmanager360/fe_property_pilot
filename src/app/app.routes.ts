import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';
import { OnboardingGuard } from './auth/OnboardingGuard';

// Rotte pubbliche (senza layout principale)
const publicRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./auth/loginComponent/login').then(m => m.LoginComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password').then(m => m.ResetPassword),
  },
  {
    path: 'reset-password-final',
    loadComponent: () =>
      import('./auth/reset-password-final/reset-password-final')
        .then(m => m.ResetPasswordFinalComponent),
  },
];

// Rotte di onboarding / first access (protette ma senza layout principale)
const onboardingRoutes: Routes = [
  {
    path: 'tenant-first-access',
    canActivate: [AuthGuard, OnboardingGuard],
    loadComponent: () =>
      import('./auth/tenant-first-access/tenant-first-access')
        .then(m => m.TenantFirstAccessComponent),
  },
  {
    path: 'user-first-access',
    canActivate: [AuthGuard, OnboardingGuard],
    loadComponent: () =>
      import('./auth/user-first-access/user-first-access')
        .then(m => m.UserFirstAccess),
  },
];

// Rotte protette con layout principale
const protectedWithLayoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [AuthGuard, OnboardingGuard],
    children: [
      {
        path: 'registration',
        loadComponent: () =>
          import('./auth/registrationComponent/registration')
            .then(m => m.RegistrationComponent),
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./components/home/home')
            .then(m => m.HomeComponent),
      },
      {
        path: 'previsione',
        loadComponent: () =>
          import('./components/previsione-guadagno/previsione-guadagno')
            .then(m => m.PrevisioneGuadagno),
        canActivate: [RoleGuard],
        data: {
          allowedRoles: [1, 2], // 1 = OWNER, 2 = ADMIN (esempio)
          feature: 'previsione-guadagno',
        },
      },
      {
        path: 'not-authorized',
        loadComponent: () =>
          import('./auth/not-authorized/not-authorized')
            .then(m => m.NotAuthorizedComponent),
      },
    ],
  },
];

// Configurazione principale delle rotte
export const routes: Routes = [
  ...publicRoutes,
  ...onboardingRoutes,
  ...protectedWithLayoutRoutes,
  {
    path: '**',
    redirectTo: '',
  },
];