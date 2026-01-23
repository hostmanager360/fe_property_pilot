import { Routes } from '@angular/router';
import { PrevisioneGuadagno } from './components/previsione-guadagno/previsione-guadagno';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
    pathMatch: 'full',
  },
  {
    path: 'registration',
    loadComponent: () => import('./auth/registration/registration').then(m => m.RegistrationComponent),
  },
  { path: 'previsione', component: PrevisioneGuadagno },
  { path: '**', redirectTo: '' },
];
