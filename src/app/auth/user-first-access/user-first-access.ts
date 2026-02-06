import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FirstAccessService } from '../../services/auth/first-access-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-first-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-first-access.html',
  styleUrls: ['./user-first-access.css'],
})
export class UserFirstAccess {

  private fb = inject(FormBuilder);
  private firstAccessService = inject(FirstAccessService);
  private router = inject(Router);

  loading = false;

  form = this.fb.group({
    nome: ['', Validators.required],
    cognome: ['', Validators.required],
    telefono: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(15)],
    ],
    dataNascita: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;

    this.loading = true;

    const raw = this.form.value;

    const dto = {
      nome: raw.nome ?? '',
      cognome: raw.cognome ?? '',
      telefono: raw.telefono ?? '',
      dataNascita: raw.dataNascita
        ? new Date(raw.dataNascita).toISOString().substring(0, 10)
        : '',
    };

    this.firstAccessService.completeUserDetail(dto).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('Successo', 'Dati utente salvati', 'success').then(() => {
          this.router.navigateByUrl('/previsione');
        });
      },
      error: () => {
        this.loading = false;
        Swal.fire('Errore', 'Errore durante il salvataggio dei dati utente', 'error');
      },
    });
  }
}