import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { catchError, map, Observable, throwError } from 'rxjs';
import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';
import { ResponseHandler } from '../../model/ResponseHandler';

@Injectable({
  providedIn: 'root',
})
export class PrevisioneGuadagnoService {
  private apiUrl = 'http://localhost:8080/api/core/public/calcoloPrevisioneGudagno';

  constructor(private http: HttpClient) {}

  calcola(previsione: PrevisioneGuadagnoDto): Observable<PrevisioneGuadagnoDto> {
    return this.http.post<ResponseHandler<PrevisioneGuadagnoDto>>(this.apiUrl, previsione)
      .pipe(
        map(res => {
          if (res.type === 'SUCCESS' && res.data) {
            return res.data;
          } else {
            throw new Error(res.message || 'Errore generico dal backend');
          }
        }),
        catchError(err => {
          console.error('Errore chiamata calcolo previsione:', err);
          return throwError(() => err);
        })
      );
  }
}
