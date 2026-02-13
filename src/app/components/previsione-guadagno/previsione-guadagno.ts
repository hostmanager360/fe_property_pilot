import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject } from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';

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
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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
  private readonly router = inject(Router);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  previsione: PrevisioneGuadagnoDto = new PrevisioneGuadagnoDto();
  risultato: PrevisioneGuadagnoDto | null = null;

  loading = false;
  downloading = false;
  sendingEmail = false;
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

  async inviaEmail(): Promise<void> {
    const previsioneId = this.risultato?.id ?? this.previsione?.id;
    if (!previsioneId || this.loading || this.sendingEmail) {
      return;
    }

    (document.activeElement as HTMLElement | null)?.blur();

    const result = await Swal.fire({
      title: 'Invia previsione via email',
      html: `
        <input id="swal-owner-name" class="swal2-input" placeholder="Nome proprietario" />
        <input id="swal-owner-email" class="swal2-input" type="email" placeholder="Email proprietario" />
      `,
      showCancelButton: true,
      confirmButtonText: 'Invia',
      cancelButtonText: 'Annulla',
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#888888',
      showLoaderOnConfirm: true,
      width: 'auto',
      heightAuto: false,
      scrollbarPadding: false,
      returnFocus: false,
      target: this.getSwalTarget(),
      customClass: {
        popup: 'pp-swal',
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.maxWidth = '92vw';
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        this.sendingEmail = true;
        this.cdr.markForCheck();
        try {
          const popup = Swal.getPopup();
          const ownerName = String(
            (popup?.querySelector('#swal-owner-name') as HTMLInputElement | null)?.value ?? ''
          ).trim();
          const ownerEmail = String(
            (popup?.querySelector('#swal-owner-email') as HTMLInputElement | null)?.value ?? ''
          ).trim();

          if (!ownerName) {
            Swal.showValidationMessage('Nome proprietario obbligatorio.');
            return null;
          }

          if (!ownerEmail) {
            Swal.showValidationMessage('Email obbligatoria.');
            return null;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(ownerEmail)) {
            Swal.showValidationMessage('Inserisci una email valida.');
            return null;
          }

          await firstValueFrom(
            this.service.sendPrevisioneEmail({ previsioneId, ownerEmail, ownerName })
          );
          return { ok: true as const };
        } catch (err) {
          const mapped = await this.mapEmailError(err);
          return { ok: false as const, mapped };
        } finally {
          this.sendingEmail = false;
          this.cdr.markForCheck();
        }
      },
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    if (result.value.ok) {
      await this.showEmailSwal({
        icon: 'success',
        title: 'Email inviata',
        text: 'La previsione è stata inviata al proprietario con il PDF in allegato.',
      });
      return;
    }

    const mapped = result.value.mapped;
    await this.showEmailSwal({
      icon: mapped.icon,
      title: mapped.title,
      text: mapped.text,
    });

    if (mapped.code === 3002) {
      void this.router.navigateByUrl('/');
    }
  }

  private async mapEmailError(err: unknown): Promise<{
    code?: number;
    icon: 'error' | 'warning' | 'info';
    title: string;
    text: string;
  }> {
    const parsed = await this.parseGenericError(err);
    const code = parsed.code;

    if (code === 4101) {
      return {
        code,
        icon: 'error',
        title: 'Previsione non trovata',
        text: 'La previsione richiesta non esiste o è stata rimossa.',
      };
    }

    if (code === 4102) {
      return {
        code,
        icon: 'warning',
        title: 'Accesso non consentito',
        text: 'Non hai i permessi per scaricare questa previsione.',
      };
    }

    if (code === 4103) {
      return {
        code,
        icon: 'error',
        title: 'Email non valida',
        text: parsed.message || 'L’indirizzo email inserito non è valido.',
      };
    }

    if (code === 4104) {
      return {
        code,
        icon: 'error',
        title: 'Invio non riuscito',
        text: parsed.message || 'Impossibile inviare l’email in questo momento.',
      };
    }

    if (code === 3002 || parsed.status === 401) {
      return {
        code: 3002,
        icon: 'info',
        title: 'Sessione scaduta',
        text: "Effettua nuovamente l'accesso.",
      };
    }

    if (code === 3001 || parsed.status === 403) {
      return {
        code,
        icon: 'warning',
        title: 'Accesso non consentito',
        text: parsed.message || 'Non hai i permessi per inviare questa previsione.',
      };
    }

    return {
      code,
      icon: 'error',
      title: 'Errore',
      text: 'Errore durante l’invio email.',
    };
  }

  private async parseGenericError(
    err: unknown
  ): Promise<{ status: number; code?: number; message?: string }> {
    if (!(err instanceof HttpErrorResponse)) {
      return { status: 0, message: (err as { message?: string })?.message };
    }

    const status = err.status;
    const raw = err.error;

    if (raw instanceof Blob) {
      try {
        const text = (await raw.text()).trim();
        if (!text) {
          return { status, message: err.message };
        }
        const json = JSON.parse(text) as { code?: number; message?: string };
        return { status, code: json.code, message: json.message || err.message };
      } catch {
        return { status, message: err.message };
      }
    }

    if (typeof raw === 'object' && raw !== null) {
      const json = raw as { code?: number; message?: string };
      return { status, code: json.code, message: json.message || err.message };
    }

    if (typeof raw === 'string') {
      return { status, message: raw };
    }

    return { status, message: err.message };
  }

  private showEmailSwal(params: {
    icon: 'success' | 'error' | 'warning' | 'info';
    title: string;
    text: string;
  }): Promise<unknown> {
    (document.activeElement as HTMLElement | null)?.blur();

    return Swal.fire({
      icon: params.icon,
      title: params.title,
      text: params.text,
      confirmButtonText: 'Chiudi',
      confirmButtonColor: '#d4af37',
      background: '#ffffff',
      color: '#111111',
      width: 'auto',
      heightAuto: false,
      scrollbarPadding: false,
      returnFocus: false,
      target: this.getSwalTarget(),
      customClass: {
        popup: 'pp-swal',
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.maxWidth = '92vw';
        }
      },
    });
  }

  private getSwalTarget(): HTMLElement {
    const dialogContainer = this.hostRef.nativeElement.closest('.mat-mdc-dialog-container');
    return (dialogContainer as HTMLElement) || document.body;
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

