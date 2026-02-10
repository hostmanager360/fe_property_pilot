import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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
    CommonModule, 
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
            this.router.navigateByUrl('/home');
          }
          
          return;
        } else {
          this.router.navigateByUrl('/home');
        }

        
      },
      error: (err) => {
        this.isSubmitting = false;
        this.handleLoginError(err);
      },
    });
  }

  onRegisterClick() {
  const loggedIn = this.tokenStorage.isLogged(); 

  if (!loggedIn) {
    Swal.fire({
      title: 'Accesso richiesto',
      text: 'Effettua il login per poter registrare una nuova utenza.',
      icon: 'warning',
      confirmButtonText: 'Ok',
      confirmButtonColor: '#d4af37',
      background: '#121216',
      color: '#fff'
    });
    return;
  }

  // Se è loggato → procedi normalmente
    this.router.navigate(['/registration']);
  }
  private handleLoginError(err: any) {
  const code = err.error?.code;

  switch (code) {

    case 1001: // Utente non trovato
      Swal.fire({
        title: 'Utente non trovato',
        text: 'L’email inserita non risulta registrata.',
        icon: 'warning',
        confirmButtonColor: '#d4af37',
        background: '#121216',
        color: '#fff'
      });
      break;

    case 1002: // Credenziali errate
      Swal.fire({
        title: 'Credenziali non valide',
        text: 'La password inserita non è corretta.',
        icon: 'error',
        confirmButtonColor: '#d4af37',
        background: '#121216',
        color: '#fff'
      });
      break;

    case 1003: // Password reset obbligatorio
      Swal.fire({
        title: 'Reimpostazione necessaria',
        text: 'Per continuare devi reimpostare la password.',
        icon: 'info',
        confirmButtonColor: '#d4af37',
        background: '#121216',
        color: '#fff'
      }).then(() => {
        this.router.navigateByUrl('/reset-password');
      });
      break;

    case 1999: // Errore interno
    default:
      Swal.fire({
        title: 'Errore interno',
        text: 'Si è verificato un errore inatteso. Riprova più tardi.',
        icon: 'error',
        confirmButtonColor: '#d4af37',
        background: '#121216',
        color: '#fff'
      });
      break;
  }
}

}
