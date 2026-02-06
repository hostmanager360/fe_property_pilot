import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FirstAccessStatusResponse } from '../../model/auth/FirstAccessStatusResponse';
import { CreateTenantDTO } from '../../model/auth/CreateTenantDTO';
import { UserDetailDto } from '../../model/auth/UserDetailDTO';

@Injectable({
  providedIn: 'root',
})
export class FirstAccessService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:8080/api/core/private/first-access';

  getStatus(): Observable<FirstAccessStatusResponse> {
    return this.http.get<FirstAccessStatusResponse>(`${this.baseUrl}/status`);
  }

  createTenant(dto: CreateTenantDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-tenant`, dto);
  }

  completeUserDetail(dto: UserDetailDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/user-detail`, dto);
  }

  completeFirstAccess(): Observable<any> {
    return this.http.post(`${this.baseUrl}/complete`, {});
  }
}