import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { finalize, Subject, takeUntil } from 'rxjs';

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
import Swal from 'sweetalert2';
import { RoleService } from '../../services/roleService/role-service';
import { MatIcon } from "@angular/material/icon";

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
    MatIcon
],
  templateUrl: './registration.html',
  styleUrls: ['./registration.css'],
})
export class RegistrationComponent implements OnInit, OnDestroy {

  form!: FormGroup;

  isSubmitting = false;
  isLoadingRoles = true;
  errorMessage: string | null = null;

  showPassword = false;
  showConfirmPassword = false;

  roles: { value: string; label: string }[] = [];

  private destroy$ = new Subject<void>();

  private tokenStorage = inject(TokenStorageService);
  private roleService = inject(RoleService);

  private static readonly ROLE_PERMISSIONS: Record<number, string[]> = {
    1: ['ADMIN', 'HOST', 'COHOST', 'OWNER'],
    2: ['ADMIN', 'HOST', 'COHOST'],
    3: ['COHOST'],
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------
  private initForm(): void {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        role: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: [RegistrationComponent.passwordsMatchValidator] }
    );
  }

  get email(): AbstractControl | null {
    return this.form?.get('email') ?? null;
  }

  get role(): AbstractControl | null {
    return this.form?.get('role') ?? null;
  }

  get password(): AbstractControl | null {
    return this.form?.get('password') ?? null;
  }

  get confirmPassword(): AbstractControl | null {
    return this.form?.get('confirmPassword') ?? null;
  }

  private static passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;

    return pass && confirm && pass !== confirm
      ? { passwordsMismatch: true }
      : null;
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordsMismatch') &&
           this.confirmPassword?.touched === true;
  }

  // ---------------------------------------------------------
  // LOAD ROLES
  // ---------------------------------------------------------
  private loadRoles(): void {
    const roleId = Number(this.tokenStorage.getRoleId());

    if (!roleId) {
      this.blockAccess('Accesso negato', 'Effettua il login per continuare.');
      return;
    }

    if (roleId === 4) {
      this.blockAccess(
        'Permesso negato',
        'Non hai i permessi per creare nuove utenze.'
      );
      return;
    }

    this.roleService.getAllRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const allRoles = res.data;
          this.roles = this.filterRolesByPermission(roleId, allRoles);

          if (this.roles.length === 0) {
            this.blockAccess(
              'Permesso negato',
              'Non hai ruoli disponibili per creare nuove utenze.'
            );
            return;
          }

          this.form.patchValue({ role: this.roles[0].value });
          this.isLoadingRoles = false;
        },
        error: () => {
          this.blockAccess('Errore', 'Impossibile caricare i ruoli.');
        }
      });
  }

  private filterRolesByPermission(roleId: number, allRoles: any[]) {
    const allowedCodes = RegistrationComponent.ROLE_PERMISSIONS[roleId] ?? [];

    return allRoles
      .filter(r => allowedCodes.includes(r.code))
      .map(r => ({
        value: r.code,
        label: r.code
      }));
  }

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  onSubmit(): void {
    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: UserDto = {
      email: this.email?.value,
      role: this.role?.value,
      password: this.password?.value,
      confermaPassword: this.confirmPassword?.value,
      tenantKey: this.tokenStorage.getTenantKey() ?? undefined
    };

    const allowed = this.roles.map(r => r.value);
    if (!allowed.includes(payload.role)) {
      Swal.fire({
        title: 'Permesso negato',
        text: 'Non puoi creare un utente con questo ruolo.',
        icon: 'error',
        confirmButtonColor: '#d4af37',
        background: '#121216',
        color: '#fff'
      });
      return;
    }

    const actions: Record<string, () => any> = {
      ADMIN: () => this.auth.createAdmin(payload),
      HOST: () => this.auth.createHost(payload),
      COHOST: () => this.auth.createCohost(payload),
      OWNER: () => this.auth.createOwner(payload),
    };

    const action = actions[payload.role];

    if (!action) {
      this.errorMessage = 'Ruolo non valido.';
      return;
    }

    this.isSubmitting = true;

    action()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Registrazione completata',
            text: 'L’utente è stato creato con successo.',
            icon: 'success',
            confirmButtonColor: '#d4af37',
            background: '#121216',
            color: '#fff'
          }).then(() => {
            this.router.navigateByUrl('/login');
          });
        },
        error: (err: any) => {
          this.errorMessage = err?.error?.message ?? 'Registrazione fallita.';
        },
      });
  }

  // ---------------------------------------------------------
  // UTILS
  // ---------------------------------------------------------
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private blockAccess(title: string, text: string) {
    Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Torna al login',
      confirmButtonColor: '#d4af37',
      background: '#121216',
      color: '#fff'
    }).then(() => {
      this.router.navigateByUrl('/');
    });
  }
}
