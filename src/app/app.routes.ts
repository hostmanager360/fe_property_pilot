import { Routes } from '@angular/router';
import { PrevisioneGuadagno } from './components/previsione-guadagno/previsione-guadagno';

export const routes: Routes = [
     { path: '', component: PrevisioneGuadagno, pathMatch: 'full'},
     { path: 'previsione', component: PrevisioneGuadagno },
     { path: '**', redirectTo: '' }
];
