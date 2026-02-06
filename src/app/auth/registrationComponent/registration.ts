import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { finalize } from 'rxjs/operators';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth/auth-service';
import { UserDto } from '../../model/auth/RegistrationDto';
import { TokenStorageService } from '../../services/token-storage';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './registration.html',
  styleUrls: ['./registration.css'],
})
export class RegistrationComponent {
  form: FormGroup;

  isSubmitting = false;
  errorMessage: string | null = null;

  showPassword = false;
  showConfirmPassword = false;
private tokenStorage = inject(TokenStorageService);
  roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'HOST', label: 'Host' },
    { value: 'CO_HOST', label: 'Co-Host' },
    { value: 'OWNER', label: 'Owner' },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        role: ['ADMIN', [Validators.required]], // default modificabile
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: [this.passwordsMatchValidator] }
    );
  }

  get email() { return this.form.get('email'); }
  get role() { return this.form.get('role'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pass || !confirm) return null;
    return pass === confirm ? null : { passwordsMismatch: true };
  }

  get passwordsMismatch(): boolean {
    return this.form.touched && this.form.hasError('passwordsMismatch');
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const payload: UserDto = {
      email: this.email?.value,
      role: this.role?.value,
      password: this.password?.value,
      confermaPassword: this.confirmPassword?.value,
      tenantKey: this.tokenStorage.getTenantKey() ?? undefined
    };
    let request$;

    switch (payload.role) {
    case 'ADMIN':
      request$ = this.auth.createAdmin(payload);
      break;

    case 'HOST':
      request$ = this.auth.createHost(payload);
      break;

    case 'CO_HOST':
      request$ = this.auth.createCohost(payload);
      break;
    case 'OWNER':
      request$ = this.auth.createOwner(payload);
      break;
    default:
      this.errorMessage = 'Ruolo non valido.';
      this.isSubmitting = false;
      return;
  }
  
    request$
      .pipe(
        finalize(() => {
          // ✅ garantito: torna sempre false a fine chiamata (ok o errore)
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login');
        },
        error: (err) => {
          // ✅ messaggio più utile se il BE lo manda
          const backendMsg =
            err?.error?.message ||
            err?.error?.error ||
            (typeof err?.error === 'string' ? err.error : null);

          this.errorMessage = backendMsg ?? 'Registrazione fallita. Controlla i dati e riprova.';
        },
      });
  }
}
