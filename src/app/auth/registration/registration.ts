import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';


import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
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

  roles = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'HOST', label: 'Host' },
    { value: 'CO_HOST', label: 'Co-Host' },
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        role: ['HOST', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: [this.passwordsMatchValidator] }
    );
  }

  get email() {
    return this.form.get('email');
  }
  get role() {
    return this.form.get('role');
  }
  get password() {
    return this.form.get('password');
  }
  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

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

    const payload = {
      email: this.email?.value,
      role: this.role?.value,
      password: this.password?.value,
    };

    // TODO: chiamata reale al backend (hash lato backend).
    setTimeout(() => {
      this.isSubmitting = false;

      // Simulazione: email già usata
      if (payload.email === 'error@mail.com') {
        this.errorMessage = 'Email già utilizzata. Prova con un’altra.';
        return;
      }

      // Dopo registrazione: torna al login
      this.router.navigateByUrl('/');
    }, 700);
  }
}
