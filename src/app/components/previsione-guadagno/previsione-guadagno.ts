import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';
import { PrevisioneGuadagnoService } from '../../services/previsioneService/previsione-guadagno-service';
import { ResponseHandler } from '../../model/ResponseHandler';

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
     // Material
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

  constructor(private service: PrevisioneGuadagnoService) {}

  calcola(): void {
    this.loading = true;
    this.errorMessage = null;
    this.risultato = undefined;

    // sicurezza: se non diretta, aggiorno totale gestione prima di inviare
    this.ricalcolaTotaleGestione();

    this.service.calcola(this.previsione).subscribe({
      next: (data) => {
        this.risultato = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.message || 'Si è verificato un errore durante il calcolo.';
        console.error('Errore chiamata:', err);
      },
    });
  }

  onTipoGestioneChange(): void {
    // Se diretta: azzero host/cohost (non servono)
    if (this.previsione.tipoGestione === 'diretta') {
      this.previsione.commissioneHost = 0 as any;
      this.previsione.commissioneCoHost = 0 as any;
      // lascio commissioneGestioneTotale editabile
      return;
    }

    // Se NON diretta: totale diventa somma di host + cohost
    // Se vuoti, li porto a 0 per evitare NaN
    this.previsione.commissioneHost = (this.previsione.commissioneHost ?? 0) as any;
    this.previsione.commissioneCoHost = (this.previsione.commissioneCoHost ?? 0) as any;
    this.ricalcolaTotaleGestione();
  }

  ricalcolaTotaleGestione(): void {
    if (this.previsione.tipoGestione === 'diretta') return;

    const host = Number(this.previsione.commissioneHost ?? 0);
    const cohost = Number(this.previsione.commissioneCoHost ?? 0);

    const totale = host + cohost;
    this.previsione.commissioneGestioneTotale = totale as any;
  }

  nuovoCalcolo(): void {
    // Mostra di nuovo il form mantenendo i dati (se preferisci reset totale dimmelo)
    this.risultato = undefined;
    this.errorMessage = null;
  }

  resetForm(form: any): void {
    form.resetForm();
    this.previsione = new PrevisioneGuadagnoDto();
    this.risultato = undefined;
    this.errorMessage = null;
  }
}