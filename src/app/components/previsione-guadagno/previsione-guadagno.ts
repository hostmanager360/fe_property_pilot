import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';
import { PrevisioneGuadagnoService } from '../../services/previsioneService/previsione-guadagno-service';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-previsione-guadagno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './previsione-guadagno.html',
  styleUrl: './previsione-guadagno.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrevisioneGuadagno {
  private readonly service = inject(PrevisioneGuadagnoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<PrevisioneGuadagno>, {
    optional: true,
  });
  private readonly snackBar = inject(MatSnackBar);

  previsione: PrevisioneGuadagnoDto = new PrevisioneGuadagnoDto();
  risultato: PrevisioneGuadagnoDto | null = null;

  loading = false;
  downloading = false;
  errorMessage: string | null = null;

  // -----------------------
  // UI helpers
  // -----------------------
  get isProfit(): boolean {
    return (this.risultato?.totaleNettoProprietario ?? 0) >= 0;
  }

  get profitLabel(): string {
    return this.isProfit ? 'Profitto' : 'Perdita';
  }

  /**
   * Se Co-host è realmente usato (percentuale > 0) e siamo in modalità cohost,
   * allora nel risultato mostriamo split Host + Co-host.
   * Se diretta -> mostriamo solo Lordo gestione.
   */
  get showHostSplit(): boolean {
    const isCohost = this.previsione.tipoGestione === 'cohost';
    const cohostPct = Number(this.previsione.commissioneCoHost ?? 0);
    return isCohost && cohostPct > 0;
  }

  // -----------------------
  // Actions
  // -----------------------
  calcola(): void {
    this.loading = true;
    this.errorMessage = null;
    this.risultato = null;
    this.cdr.markForCheck();

    this.ricalcolaTotaleGestione();
    this.normalizeForBackend();
    this.ricalcolaTotaleGestione();
    this.service
      .calcola(this.previsione)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.risultato = data;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Si è verificato un errore durante il calcolo.';
          console.error('Errore chiamata:', err);
          this.cdr.markForCheck();
        },
      });
  }

  onTipoGestioneChange(): void {
    if (this.previsione.tipoGestione === 'diretta') {
      this.previsione.appartamentoDiretto = true;
      // se diretta: cohost non serve
      this.previsione.commissioneCoHost = 0 as any;
      this.cdr.markForCheck();
      return;
    }

    if (this.previsione.tipoGestione === 'cohost') {
      this.previsione.appartamentoDiretto = false;
      this.previsione.commissioneHost = (this.previsione.commissioneHost ?? 0) as any;
      this.previsione.commissioneCoHost = (this.previsione.commissioneCoHost ?? 0) as any;
      this.ricalcolaTotaleGestione();
      this.cdr.markForCheck();
    }
  }

  ricalcolaTotaleGestione(): void {
    if (this.previsione.tipoGestione === 'diretta') {
      this.previsione.appartamentoDiretto = true;
      return;
    }

    const host = Number(this.previsione.commissioneHost ?? 0);
    const cohost = Number(this.previsione.commissioneCoHost ?? 0);
    this.previsione.commissioneGestioneTotale = (host + cohost) as any;
  }

  nuovoCalcolo(): void {
    this.risultato = null;
    this.errorMessage = null;
    this.previsione = new PrevisioneGuadagnoDto();
    this.loading = false;
    this.cdr.markForCheck();
  }

  resetForm(form: any): void {
    form.resetForm();
    this.previsione = new PrevisioneGuadagnoDto();
    this.risultato = null;
    this.errorMessage = null;
    this.loading = false;
    this.cdr.markForCheck();
  }

  close(): void {
    this.dialogRef?.close();
  }

  downloadPdf(): void {
    const id = this.risultato?.id ?? this.previsione?.id;
    if (!id || this.loading || this.downloading) {
      this.snackBar.open('Download non disponibile: id previsione mancante.', 'Chiudi', {
        duration: 3500,
      });
      return;
    }

    this.downloading = true;
    this.cdr.markForCheck();

    this.service
      .downloadPdfById(id)
      .pipe(
        finalize(() => {
          this.downloading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          const body = response.body;
          if (!body || body.size === 0) {
            this.snackBar.open('Il backend ha risposto senza contenuto PDF.', 'Chiudi', {
              duration: 4000,
            });
            return;
          }

          const filename = this.extractFilename(response) ?? `previsione-${id}.pdf`;
          this.saveBlob(body, filename);
        },
        error: (err) => {
          this.snackBar.open(
            err?.message || 'Errore durante il download del PDF.',
            'Chiudi',
            { duration: 5000 }
          );
        },
      });
  }

  private extractFilename(response: HttpResponse<Blob>): string | null {
    const contentDisposition =
      response.headers.get('content-disposition') ??
      response.headers.get('Content-Disposition');

    if (!contentDisposition) {
      return null;
    }

    const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]).replace(/["']/g, '');
    }

    const asciiMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(contentDisposition);
    return asciiMatch?.[2] ?? null;
  }

  private saveBlob(blob: Blob, filename: string): void {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }
  private n(v: number | null | undefined): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

private normalizeForBackend(): void {
  this.previsione.numeroLocali = this.n(this.previsione.numeroLocali);
  this.previsione.numeroBagni = this.n(this.previsione.numeroBagni);
  this.previsione.mutuoAffitto = this.n(this.previsione.mutuoAffitto);
  this.previsione.costoUtenzeMensili = this.n(this.previsione.costoUtenzeMensili);
  this.previsione.costoPulizia = this.n(this.previsione.costoPulizia);

  this.previsione.numeroPrenotazioni = this.n(this.previsione.numeroPrenotazioni);
  this.previsione.numeroNottiMensili = this.n(this.previsione.numeroNottiMensili);
  this.previsione.prezzoMedioPerNotte = this.n(this.previsione.prezzoMedioPerNotte);

  this.previsione.costoTasse = this.n(this.previsione.costoTasse);
  this.previsione.costoPiattaforma = this.n(this.previsione.costoPiattaforma);

  this.previsione.commissioneGestioneTotale = this.n(this.previsione.commissioneGestioneTotale);
  this.previsione.commissioneHost = this.n(this.previsione.commissioneHost);
  this.previsione.commissioneCoHost = this.n(this.previsione.commissioneCoHost);
}
}

