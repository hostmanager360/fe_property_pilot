import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CurrencyPipe, NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { PrevisioneGuadagnoService } from '../../services/previsioneService/previsione-guadagno-service';
import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';

type DialogData = { id: number };

@Component({
  standalone: true,
  selector: 'app-previsione-dettaglio-dialog',
  templateUrl: './previsione-dettaglio-dialog.html',
  styleUrls: ['./previsione-dettaglio-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CurrencyPipe, NgClass],
})
export class PrevisioneDettaglioDialogComponent implements OnInit {
  private readonly dialogRef =
    inject(MatDialogRef<PrevisioneDettaglioDialogComponent>);
  private readonly service = inject(PrevisioneGuadagnoService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly input = inject<DialogData>(MAT_DIALOG_DATA);

  loading = true;
  error: string | null = null;
  dto: PrevisioneGuadagnoDto | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.dto = null;

    // forza il refresh immediato (mostra skeleton/loading)
    this.cdr.markForCheck();

    this.service
      .getById(this.input.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          // forza refresh anche a fine chiamata
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (data) => {
          this.dto = data;
          // forza refresh quando arrivano i dati (fix del “vedo solo quando salvo”)
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.message || 'Impossibile caricare il dettaglio.';
          this.cdr.markForCheck();
        },
      });
  }

  // helpers
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

  close(): void {
    this.dialogRef.close();
  }

  downloadPdf(): void {
    // TODO: endpoint BE PDF
    console.log('TODO download PDF', this.input.id);
  }
}
