import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TokenStorageService } from '../../services/token-storage';
import { AuthService } from '../../services/auth/auth-service';
import { LoginRequest } from '../../model/auth/LoginRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,        // NECESSARIO per @if
    RouterLink,
    ReactiveFormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {

  loginForm: FormGroup;
  loginRequest: LoginRequest = { email: '', password: '' }; // FIX
  isSubmitting = false;
  errorMessage: string | null = null;
  onBoardingStep: any;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private tokenStorage: TokenStorageService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.loginRequest.email = this.username?.value;
    this.loginRequest.password = this.password?.value;

    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        this.tokenStorage.saveLoginData(response);

        if (response.passwordResetRequired) {
          this.router.navigateByUrl('/reset-password');
          return;
        }

        if (response.firstAccessRequired != null && response.firstAccessRequired === true) {
          this.onBoardingStep = this.tokenStorage.getOnboardingStep();
          if(this.onBoardingStep === "1") {
            this.router.navigateByUrl('/tenant-first-access');
          } else if(this.onBoardingStep === "2") {
            this.router.navigateByUrl('/user-first-access');
          } else if(this.onBoardingStep === "3") {
            this.router.navigateByUrl('/previsione');
          }
          
          return;
        } else {
          this.router.navigateByUrl('/previsione');
        }

        
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Credenziali non valide.';
      },
    });
  }
}
