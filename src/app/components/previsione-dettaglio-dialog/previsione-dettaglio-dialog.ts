import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  inject,
} from '@angular/core';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import { PrevisioneGuadagnoService } from '../../services/previsioneService/previsione-guadagno-service';
import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';

type DialogData = { id: number };
type BackendErrorPayload = {
  success?: boolean;
  code?: number;
  message?: string;
};

@Component({
  standalone: true,
  selector: 'app-previsione-dettaglio-dialog',
  templateUrl: './previsione-dettaglio-dialog.html',
  styleUrls: ['./previsione-dettaglio-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CurrencyPipe, NgClass],
})
export class PrevisioneDettaglioDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<PrevisioneDettaglioDialogComponent>);
  private readonly service = inject(PrevisioneGuadagnoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  readonly input = inject<DialogData>(MAT_DIALOG_DATA);

  loading = true;
  downloading = false;
  sendingEmail = false;
  error: string | null = null;
  dto: PrevisioneGuadagnoDto | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.dto = null;
    this.cdr.markForCheck();

    this.service
      .getById(this.input.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.dto = data;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = this.getFriendlyLoadError(err);
          this.cdr.markForCheck();
        },
      });
  }

  asNumber(v: unknown): number {
    return typeof v === 'number' ? v : Number(v ?? 0);
  }

  get netto(): number {
    return this.asNumber(this.dto?.totaleNettoProprietario);
  }

  get lordo(): number {
    return this.asNumber(this.dto?.totaleLordoPernottamenti);
  }

  get isProfit(): boolean {
    return this.netto >= 0;
  }

  get profitLabel(): string {
    return this.isProfit ? 'Profitto' : 'Perdita';
  }

  get showHostSplit(): boolean {
    const isCohost = this.dto?.tipoGestione === 'cohost';
    const cohostPct = Number(this.dto?.commissioneCoHost ?? 0);
    return !!isCohost && cohostPct > 0;
  }

  close(): void {
    this.dialogRef.close();
  }

  downloadPdf(): void {
    if (this.loading || this.downloading || this.error) {
      return;
    }

    this.downloading = true;
    this.cdr.markForCheck();

    this.service
      .downloadPdfById(this.input.id)
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
            void this.showSwal({
              icon: 'warning',
              title: 'PDF non disponibile',
              text: 'Il backend ha risposto senza contenuto PDF.',
            });
            return;
          }

          const filename = this.extractFilename(response) ?? `previsione-${this.input.id}.pdf`;
          this.saveBlob(body, filename);
        },
        error: (err) => {
          void this.handleDownloadError(err);
        },
      });
  }

  async inviaEmail(): Promise<void> {
    if (this.loading || this.sendingEmail || this.error) {
      return;
    }

    const previsioneId = this.dto?.id ?? this.input.id;
    if (!previsioneId) {
      await this.showSwal({
        icon: 'error',
        title: 'Errore',
        text: 'ID previsione non disponibile.',
      });
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
      await this.showSwal({
        icon: 'success',
        title: 'Email inviata',
        text: 'La previsione è stata inviata al proprietario con il PDF in allegato.',
      });
      return;
    }

    const mapped = result.value.mapped;
    await this.showSwal({
      icon: mapped.icon,
      title: mapped.title,
      text: mapped.text,
    });

    if (mapped.code === 3002) {
      void this.router.navigateByUrl('/');
    }
  }

  private async handleDownloadError(err: unknown): Promise<void> {
    const parsed = await this.parseBackendError(err);
    const code = parsed.code;

    if (parsed.status === 0) {
      await this.showSwal({
        icon: 'error',
        title: 'Backend non raggiungibile',
        text: 'Impossibile contattare il server. Verifica che il backend sia avviato.',
      });
      return;
    }

    if (code === 4101 || parsed.status === 404) {
      await this.showSwal({
        icon: 'error',
        title: 'Previsione non trovata',
        text: 'La previsione richiesta non esiste o è stata rimossa.',
      });
      return;
    }

    if (code === 4102 || code === 3001 || parsed.status === 403) {
      await this.showSwal({
        icon: 'warning',
        title: 'Accesso non consentito',
        text: 'Non hai i permessi per scaricare questa previsione.',
      });
      return;
    }

    if (code === 3002 || parsed.status === 401) {
      await this.showSwal({
        icon: 'info',
        title: 'Sessione scaduta',
        text: "Effettua nuovamente l'accesso.",
      });
      void this.router.navigateByUrl('/');
      return;
    }

    await this.showSwal({
      icon: 'error',
      title: 'Errore',
      text: 'Si è verificato un errore durante la generazione del PDF.',
    });
  }

  private async parseBackendError(
    err: unknown
  ): Promise<{ status: number; code?: number; message?: string }> {
    if (!(err instanceof HttpErrorResponse)) {
      return { status: 0, message: this.getErrorMessage(err, '') };
    }

    const status = err.status;
    const raw = err.error;

    if (raw instanceof Blob) {
      try {
        const text = (await raw.text()).trim();
        if (!text) {
          return { status, message: err.message };
        }
        const json = JSON.parse(text) as BackendErrorPayload;
        return { status, code: json.code, message: json.message };
      } catch {
        return { status, message: err.message };
      }
    }

    if (typeof raw === 'object' && raw !== null) {
      const json = raw as BackendErrorPayload;
      return { status, code: json.code, message: json.message || err.message };
    }

    if (typeof raw === 'string') {
      return { status, message: raw };
    }

    return { status, message: err.message };
  }

  private async mapEmailError(err: unknown): Promise<{
    code?: number;
    icon: 'error' | 'warning' | 'info';
    title: string;
    text: string;
  }> {
    const parsed = await this.parseBackendError(err);
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

  private getFriendlyLoadError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Server non raggiungibile. Verifica che il backend sia avviato e riprova.';
      }
      if (err.status === 401) {
        return "Sessione scaduta. Effettua nuovamente l'accesso.";
      }
      if (err.status === 403) {
        return 'Non hai i permessi per visualizzare questa previsione.';
      }
      if (err.status === 404) {
        return 'La previsione richiesta non esiste o è stata rimossa.';
      }
      if (err.status >= 500) {
        return 'Il backend è momentaneamente non disponibile. Riprova tra poco.';
      }
    }

    return this.getErrorMessage(err, 'Impossibile caricare il dettaglio.');
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    const maybeErr = err as { error?: unknown; message?: string };
    if (typeof maybeErr?.error === 'string' && maybeErr.error.trim()) {
      return maybeErr.error;
    }
    if (typeof maybeErr?.message === 'string' && maybeErr.message.trim()) {
      return maybeErr.message;
    }
    return fallback;
  }

  private showSwal(params: {
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
      width: 'min(92vw, 420px)',
      heightAuto: false,
      scrollbarPadding: false,
      returnFocus: false,
      target: this.getSwalTarget(),
      customClass: {
        popup: 'pp-swal',
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
}
