import { HttpClientModule } from '@angular/common/http';
import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';
import { PrevisioneGuadagnoService } from '../../services/previsioneService/previsione-guadagno-service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-previsione-guadagno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './previsione-guadagno.html',
  styleUrl: './previsione-guadagno.css',
})
export class PrevisioneGuadagno {
  previsione: PrevisioneGuadagnoDto = new PrevisioneGuadagnoDto();
  risultato?: PrevisioneGuadagnoDto;

  loading = false;
  errorMessage: string | null = null;

  constructor(
    private service: PrevisioneGuadagnoService,
    private cdr: ChangeDetectorRef
  ) {}

  calcola(): void {
    this.loading = true;
    this.errorMessage = null;
    this.risultato = undefined;

    // Forzo un primo refresh: fa sparire/mostrare subito la progress bar
    this.cdr.detectChanges();

    // sicurezza: se non diretta, aggiorno totale gestione prima di inviare
    this.ricalcolaTotaleGestione();

    this.service
      .calcola(this.previsione)
      .pipe(
        finalize(() => {
          // finalize gira sia in success che in error: spegne sempre il loading
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.risultato = data;

          // IMPORTANTISSIMO: forza l’aggiornamento immediato della view
          // (evita il “devo cliccare un input per vedere i risultati”)
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage =
            err?.message || 'Si è verificato un errore durante il calcolo.';
          console.error('Errore chiamata:', err);

          this.cdr.detectChanges();
        },
      });
  }

  onTipoGestioneChange(): void {
    // Se diretta: azzero host/cohost (non servono)
    if (this.previsione.tipoGestione === 'diretta') {
      this.previsione.commissioneHost = this.previsione.commissioneGestioneTotale;
      this.previsione.commissioneCoHost = 0 as any;
      return;
    }

    // Se NON diretta: totale = host + cohost (evito NaN)
    this.previsione.commissioneHost = (this.previsione.commissioneHost ?? 0) as any;
    this.previsione.commissioneCoHost = (this.previsione.commissioneCoHost ?? 0) as any;
    this.ricalcolaTotaleGestione();
  }

  ricalcolaTotaleGestione(): void {
    if (this.previsione.tipoGestione === 'diretta') {
      this.previsione.commissioneHost = this.previsione.commissioneGestioneTotale;
      this.previsione.appartamentoDiretto == true;
    }

    const host = Number(this.previsione.commissioneHost ?? 0);
    const cohost = Number(this.previsione.commissioneCoHost ?? 0);

    this.previsione.commissioneGestioneTotale = (host + cohost) as any;
  }

  nuovoCalcolo(): void {
    this.risultato = undefined;
    this.errorMessage = null;
    this.previsione = new PrevisioneGuadagnoDto();
    this.loading = false;
    this.cdr.detectChanges();
  }

  resetForm(form: any): void {
    form.resetForm();
    this.previsione = new PrevisioneGuadagnoDto();
    this.risultato = undefined;
    this.errorMessage = null;
    this.loading = false;
    this.cdr.detectChanges();
  }
}
