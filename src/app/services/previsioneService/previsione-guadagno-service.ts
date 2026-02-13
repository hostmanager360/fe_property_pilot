import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, catchError, map, Observable, tap, throwError } from 'rxjs';
import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';
import { ResponseHandler } from '../../model/ResponseHandler';
import { PrevisioneGuadagnoList } from '../../model/PrevisioneGuadagnoList';

@Injectable({
  providedIn: 'root',
})
export class PrevisioneGuadagnoService {
  private apiUrl = 'http://localhost:8080/api/core/private/previsione-guadagno/';
  private readonly _refreshList$ = new BehaviorSubject<void>(undefined);
  readonly refreshList$ = this._refreshList$.asObservable();
  constructor(private http: HttpClient) {}

  calcola(previsione: PrevisioneGuadagnoDto): Observable<PrevisioneGuadagnoDto> {
    return this.http.post<ResponseHandler<PrevisioneGuadagnoDto>>(this.apiUrl + "calcoloPrevisione", previsione)
      .pipe(
        map(res => {
          if (res.type === 'SUCCESS' && res.data) {
            return res.data;
          } else {
            throw new Error(res.message || 'Errore generico dal backend');
          }
        }),
        tap(() => this.notifyRefreshList()),
        catchError(err => {
          console.error('Errore chiamata calcolo previsione:', err);
          return throwError(() => err);
        })
      );
  }
  notifyRefreshList(): void {
    this._refreshList$.next();
  }
  getAll(): Observable<PrevisioneGuadagnoList[]> {
    return this.http.get<any>(this.apiUrl + "getAllPrevisioni").pipe(
      map(res => res.data as PrevisioneGuadagnoList[])
    );
  }
  getById(id: number): Observable<PrevisioneGuadagnoDto> {
    return this.http
      .get<ResponseHandler<PrevisioneGuadagnoDto>>(
        this.apiUrl + 'getPrevisioneById',
      { params: { id } })
      .pipe(
        map(res => {
          if (res.type === 'SUCCESS' && res.data) return res.data;
          throw new Error(res.message || 'Errore generico dal backend');
        }),
        catchError(err => {
          console.error('Errore chiamata getById:', err);
          return throwError(() => err);
        })
      );
  }
  deleteById(id: number): Observable<void> {
  return this.http
    .delete<ResponseHandler<void>>(
        this.apiUrl + 'deletePrevisioneById',
      { params: { id } }) // DELETE /{id}
    .pipe(
      map(res => {
        if (res.type === 'SUCCESS') return;
        throw new Error(res.message || 'Errore generico dal backend');
      }),
      catchError(err => {
        console.error('Errore chiamata deleteById:', err);
        return throwError(() => err);
      })
    );
}
}
