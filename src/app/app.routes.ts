import { Routes } from '@angular/router';
import { PrevisioneGuadagno } from './components/previsione-guadagno/previsione-guadagno';

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
  { path: 'previsione', component: PrevisioneGuadagno },
  { path: '**', redirectTo: '' },
];
