import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';

import { PasswordService } from '../../services/auth/password-service';
import { ForgotPasswordRequestDTO } from '../../model/auth/ForgotPasswordRequestDTO';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css'],
})
export class ResetPassword {

  private fb = inject(FormBuilder);
  private passwordService = inject(PasswordService);

  loading = false;
  emailSent = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.form.get('email');
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Email non valida',
        text: 'Inserisci un indirizzo email corretto.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    this.loading = true;

    const dto: ForgotPasswordRequestDTO = {
      email: this.email?.value ?? '',
    };

    this.passwordService.forgotPassword(dto).subscribe({
      next: () => {
        this.loading = false;
        this.emailSent = true;

        Swal.fire({
          icon: 'success',
          title: 'Email inviata!',
          text: 'Controlla la tua casella di posta per completare il reset della password.',
          confirmButtonColor: '#00d46a',
        });
      },
      error: () => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Errore',
          text: 'Si è verificato un problema durante l’invio dell’email.',
          confirmButtonColor: '#d4af37',
        });
      }
    });
  }
}