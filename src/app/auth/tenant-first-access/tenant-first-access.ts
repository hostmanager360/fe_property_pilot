import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2';
import { FirstAccessService } from '../../services/auth/first-access-service';
import { CreateTenantDTO, TipoSoggetto } from '../../model/auth/CreateTenantDTO';

@Component({
  selector: 'app-tenant-first-access',
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
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tenant-first-access.html',
  styleUrls: ['./tenant-first-access.css'],
})
export class TenantFirstAccessComponent {
  private fb = inject(FormBuilder);
  private firstAccessService = inject(FirstAccessService);
  private router = inject(Router);

  loading = false;

  form = this.fb.group(
    {
      tipoSoggetto: [null as TipoSoggetto | null, Validators.required],

      // persona fisica
      nome: [''],
      cognome: [''],
      codiceFiscale: [''],

      // azienda
      ragioneSociale: [''],

      partitaIva: ['', [Validators.required, this.partitaIvaValidator]],

      // residenza persona fisica
      viaResidenza: [''],
      civicoResidenza: [''],
      cittaResidenza: [''],
      capResidenza: [''],

      // sede fisica (entrambi)
      viaSedeFisica: ['', Validators.required],
      cittaSedeFisica: ['', Validators.required],
      capSedeFisica: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],

      dataIscrizione: ['', Validators.required],
      dataScadenza: [''],
      tipoLicenzaId: [1, Validators.required],
      statusId: [1, Validators.required],
    },
    {
      validators: this.dateValidator,
    }
  );

  constructor() {
    this.setupTipoSoggettoLogic();
  }

  private setupTipoSoggettoLogic() {
    this.form.get('tipoSoggetto')?.valueChanges.subscribe((tipo) => {
      const nome = this.form.get('nome');
      const cognome = this.form.get('cognome');
      const codiceFiscale = this.form.get('codiceFiscale');
      const ragioneSociale = this.form.get('ragioneSociale');
      const viaResidenza = this.form.get('viaResidenza');
      const civicoResidenza = this.form.get('civicoResidenza');
      const cittaResidenza = this.form.get('cittaResidenza');
      const capResidenza = this.form.get('capResidenza');

      if (tipo === 'PERSONA_FISICA') {
        nome?.setValidators([Validators.required]);
        cognome?.setValidators([Validators.required]);
        codiceFiscale?.setValidators([
          Validators.required,
          this.codiceFiscaleValidator,
        ]);
        ragioneSociale?.setValidators([Validators.required]);
        viaResidenza?.setValidators([Validators.required]);
        civicoResidenza?.setValidators([Validators.required]);
        cittaResidenza?.setValidators([Validators.required]);
        capResidenza?.setValidators([
          Validators.required,
          Validators.pattern(/^[0-9]{5}$/),
        ]);
      } else if (tipo === 'AZIENDA') {
        nome?.clearValidators();
        cognome?.clearValidators();
        codiceFiscale?.clearValidators();
        viaResidenza?.clearValidators();
        civicoResidenza?.clearValidators();
        cittaResidenza?.clearValidators();
        capResidenza?.clearValidators();

        ragioneSociale?.setValidators([Validators.required]);
      }

      nome?.updateValueAndValidity();
      cognome?.updateValueAndValidity();
      codiceFiscale?.updateValueAndValidity();
      ragioneSociale?.updateValueAndValidity();
      viaResidenza?.updateValueAndValidity();
      civicoResidenza?.updateValueAndValidity();
      cittaResidenza?.updateValueAndValidity();
      capResidenza?.updateValueAndValidity();
    });
  }

  dateValidator(group: AbstractControl) {
    const start = group.get('dataIscrizione')?.value as Date | null;
    const end = group.get('dataScadenza')?.value as Date | null;

    if (!start || !end) return null;
    return end >= start ? null : { invalidDateRange: true };
  }

  codiceFiscaleValidator(control: AbstractControl) {
    const value = (control.value || '').toUpperCase();
    const regex = /^[A-Z0-9]{16}$/;
    if (!value) return null;
    return regex.test(value) ? null : { codiceFiscaleInvalid: true };
  }

  partitaIvaValidator(control: AbstractControl) {
    const value: string = (control.value || '').trim();
    if (!value) return null;
    if (!/^[0-9]{11}$/.test(value)) return { partitaIvaInvalid: true };

    // semplice checksum
    let s = 0;
    for (let i = 0; i <= 9; i++) {
      let n = parseInt(value.charAt(i), 10);
      if (i % 2 === 0) {
        s += n;
      } else {
        n = n * 2;
        if (n > 9) n = n - 9;
        s += n;
      }
    }
    const check = (10 - (s % 10)) % 10;
    return check === parseInt(value.charAt(10), 10)
      ? null
      : { partitaIvaInvalid: true };
  }

  hasError(field: string, error: string) {
    return this.form.get(field)?.hasError(error);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const raw = this.form.value;

    const dto: CreateTenantDTO = {
      tipoSoggetto: raw.tipoSoggetto as TipoSoggetto,
      nome: raw.nome || undefined,
      cognome: raw.cognome || undefined,
      codiceFiscale: raw.codiceFiscale || undefined,
      ragioneSociale: raw.ragioneSociale || undefined,
      partitaIva: raw.partitaIva!,
      viaResidenza: raw.viaResidenza || undefined,
      civicoResidenza: raw.civicoResidenza || undefined,
      cittaResidenza: raw.cittaResidenza || undefined,
      capResidenza: raw.capResidenza || undefined,
      viaSedeFisica: raw.viaSedeFisica!,
      cittaSedeFisica: raw.cittaSedeFisica!,
      capSedeFisica: raw.capSedeFisica!,
      dataIscrizione: new Date(raw.dataIscrizione!).toISOString().substring(0, 10),
      dataScadenza: raw.dataScadenza
        ? new Date(raw.dataScadenza).toISOString().substring(0, 10)
        : null,
      tipoLicenzaId: raw.tipoLicenzaId ?? 1,
      statusId: raw.statusId ?? 1,
    };

    this.firstAccessService.createTenant(dto).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Tenant creato',
          text: 'Tenant creato correttamente',
          confirmButtonColor: '#d4af37',
          background: '#1e1e1e',
          color: '#ffffff',
        }).then(() => {
          this.router.navigateByUrl('/previsione');
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Errore',
          text:
            err?.error?.message ||
            'Errore durante la creazione del tenant',
          confirmButtonColor: '#d4af37',
          background: '#1e1e1e',
          color: '#ffffff',
        });
      },
    });
  }
}