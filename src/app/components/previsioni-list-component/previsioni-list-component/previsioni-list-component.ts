import { AsyncPipe, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  BehaviorSubject,
  Subject,
  catchError,
  map,
  merge,
  of,
  startWith,
  switchMap,
  timeout,
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { PrevisioneGuadagnoList } from '../../../model/PrevisioneGuadagnoList';
import { PrevisioneGuadagnoService } from '../../../services/previsioneService/previsione-guadagno-service';
import { PrevisioneDettaglioDialogComponent } from '../../previsione-dettaglio-dialog/previsione-dettaglio-dialog';
import { PrevisioneGuadagno } from '../../previsione-guadagno/previsione-guadagno';

type ViewState = {
  loading: boolean;
  error: string | null;
  data: PrevisioneGuadagnoList[];
};

@Component({
  selector: 'app-previsioni-list',
  standalone: true,
  templateUrl: './previsioni-list-component.html',
  styleUrls: ['./previsioni-list-component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    AsyncPipe,
    MatProgressBarModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    CurrencyPipe,
  ],
})
export class PrevisioniListComponent implements OnInit, OnDestroy {
  private readonly service = inject(PrevisioneGuadagnoService);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  readonly displayedColumns: (
    | keyof PrevisioneGuadagnoList
    | 'dettaglio'
    | 'elimina'
  )[] = [
    'nomeAppartamento',
    'indirizzo',
    'numeroLocali',
    'numeroBagni',
    'totaleLordoPernottamenti',
    'totaleNettoProprietario',
    'dettaglio',
    'elimina',
  ];

  readonly pageSize = 5;
  searchTerm = '';
  currentPage = 0;

  private readonly reload$ = new BehaviorSubject<void>(undefined);
  private readonly autoReload$ = this.service.refreshList$;

  readonly state$ = merge(this.reload$, this.autoReload$).pipe(
    switchMap(() =>
      this.service.getAll().pipe(
        timeout(10000),
        map((data): ViewState => ({ loading: false, error: null, data })),
        startWith({ loading: true, error: null, data: [] } as ViewState),
        catchError((err) => {
          console.error('Errore getAll():', err);
          Swal.fire({
            icon: 'error',
            title: 'Errore caricamento',
            text: 'Impossibile caricare le previsioni. Controlla la connessione o il server.',
            confirmButtonText: 'Ok',
          });

          return of({
            loading: false,
            error: 'Impossibile caricare le previsioni.',
            data: [],
          } as ViewState);
        })
      )
    )
  );

  ngOnInit(): void {
    this.load();
    this.service.refreshList$.pipe(takeUntil(this.destroy$)).subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.reload$.next();
  }

  onSearchTermChange(): void {
    this.currentPage = 0;
  }

  getFilteredData(data: PrevisioneGuadagnoList[]): PrevisioneGuadagnoList[] {
    const term = this.normalizeText(this.searchTerm);
    if (!term) {
      return data;
    }

    return data.filter((row) => {
      const searchable = [
        row.nomeAppartamento,
        row.indirizzo,
        String(row.numeroLocali ?? ''),
        String(row.numeroBagni ?? ''),
        String(row.totaleLordoPernottamenti ?? ''),
        String(row.totaleNettoProprietario ?? ''),
      ]
        .map((v) => this.normalizeText(v))
        .join(' ');
      return searchable.includes(term);
    });
  }

  getPagedData(data: PrevisioneGuadagnoList[]): PrevisioneGuadagnoList[] {
    const filtered = this.getFilteredData(data);
    const page = this.getSafeCurrentPage(filtered.length);
    const start = page * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  hasFilteredResults(data: PrevisioneGuadagnoList[]): boolean {
    return this.getFilteredData(data).length > 0;
  }

  canGoPrev(data: PrevisioneGuadagnoList[]): boolean {
    return this.getSafeCurrentPage(this.getFilteredData(data).length) > 0;
  }

  canGoNext(data: PrevisioneGuadagnoList[]): boolean {
    const filteredCount = this.getFilteredData(data).length;
    const totalPages = Math.max(1, Math.ceil(filteredCount / this.pageSize));
    return this.getSafeCurrentPage(filteredCount) < totalPages - 1;
  }

  prevPage(data: PrevisioneGuadagnoList[]): void {
    const filteredCount = this.getFilteredData(data).length;
    const safePage = this.getSafeCurrentPage(filteredCount);
    if (safePage > 0) {
      this.currentPage = safePage - 1;
    }
  }

  nextPage(data: PrevisioneGuadagnoList[]): void {
    const filteredCount = this.getFilteredData(data).length;
    const safePage = this.getSafeCurrentPage(filteredCount);
    const totalPages = Math.max(1, Math.ceil(filteredCount / this.pageSize));
    if (safePage < totalPages - 1) {
      this.currentPage = safePage + 1;
    }
  }

  getCurrentPageLabel(data: PrevisioneGuadagnoList[]): string {
    const filteredCount = this.getFilteredData(data).length;
    if (filteredCount === 0) {
      return '0/0';
    }
    const current = this.getSafeCurrentPage(filteredCount) + 1;
    const total = Math.max(1, Math.ceil(filteredCount / this.pageSize));
    return `${current}/${total}`;
  }

  getResultsLabel(data: PrevisioneGuadagnoList[]): string {
    const filteredCount = this.getFilteredData(data).length;
    if (filteredCount === 0) {
      return 'Nessun risultato';
    }
    const page = this.getSafeCurrentPage(filteredCount);
    const start = page * this.pageSize + 1;
    const end = Math.min((page + 1) * this.pageSize, filteredCount);
    return `${start}-${end} di ${filteredCount}`;
  }

  trackById = (_: number, row: PrevisioneGuadagnoList): string =>
    `${row.id}-${row.nomeAppartamento}-${row.indirizzo}`;

  nuovaPrevisione(): void {
    this.openPrevisioneForm(null);
  }

  apriDettaglio(row: PrevisioneGuadagnoList): void {
    this.dialog.open(PrevisioneDettaglioDialogComponent, {
      data: { id: row.id },
      panelClass: 'dialog-responsive',
      maxWidth: '95vw',
      width: '1100px',
      maxHeight: '90vh',
      autoFocus: false,
    });
  }

  modificaPrevisione(row: PrevisioneGuadagnoList): void {
    this.openPrevisioneForm(row);
  }

  eliminaPrevisione(row: PrevisioneGuadagnoList): void {
    Swal.fire({
      title: 'Eliminare la previsione?',
      text: 'Operazione irreversibile.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, elimina',
      cancelButtonText: 'Annulla',
      confirmButtonColor: '#d4af37',
      cancelButtonColor: '#999',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }
      this.service.deleteById(row.id).subscribe({
        next: () => {
          Swal.fire({
            title: 'Eliminata',
            icon: 'success',
            timer: 1200,
            showConfirmButton: false,
          });
          this.load();
        },
        error: (err) => {
          Swal.fire({
            title: 'Errore',
            text: err?.message || 'Impossibile eliminare la previsione.',
            icon: 'error',
          });
        },
      });
    });
  }

  private openPrevisioneForm(row: PrevisioneGuadagnoList | null): void {
    this.dialog
      .open(PrevisioneGuadagno, {
        data: row,
        panelClass: 'dialog-responsive',
        maxWidth: '95vw',
        width: '900px',
        maxHeight: '90vh',
        autoFocus: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'refresh') {
          this.load();
        }
      });
  }

  private getSafeCurrentPage(filteredCount: number): number {
    const totalPages = Math.max(1, Math.ceil(filteredCount / this.pageSize));
    return Math.min(this.currentPage, totalPages - 1);
  }

  private normalizeText(value: unknown): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
