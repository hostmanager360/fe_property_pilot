import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';
import { PasswordService } from '../../services/auth/password-service';

@Component({
  selector: 'app-reset-password-final',
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
  templateUrl: './reset-password-final.html',
  styleUrls: ['./reset-password-final.css'],
})
export class ResetPasswordFinalComponent {

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private passwordService = inject(PasswordService);

  loading = false;
  token: string = '';

  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    repeatPassword: ['', Validators.required],
  }, {
    validators: this.passwordMatchValidator
  });

  constructor() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  passwordMatchValidator(group: AbstractControl) {
    const pass = group.get('newPassword')?.value;
    const repeat = group.get('repeatPassword')?.value;
    return pass === repeat ? null : { passwordMismatch: true };
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Campi non validi',
        text: 'Controlla i campi inseriti.',
        confirmButtonColor: '#d4af37',
      });
      return;
    }

    this.loading = true;

    const dto = {
      token: this.token,
      newPassword: this.form.value.newPassword ?? '',
      repeatPassword: this.form.value.repeatPassword ?? '',
    };

    this.passwordService.resetPassword(dto).subscribe({
      next: () => {
        this.loading = false;

        Swal.fire({
          icon: 'success',
          title: 'Password aggiornata!',
          text: 'Ora puoi accedere con la nuova password.',
          confirmButtonColor: '#00d46a',
        });

        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Token non valido o scaduto',
          text: 'Richiedi un nuovo reset password.',
          confirmButtonColor: '#d4af37',
        });

        this.router.navigateByUrl('/forgot-password');
      }
    });
  }
}