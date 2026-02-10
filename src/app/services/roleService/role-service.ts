import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TokenStorageService } from '../token-storage';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleService {

   private baseUrl = 'http://localhost:8080/api/core/roles/getRoles';

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService
  ) {}

  getAllRoles(): Observable<any> {
    const token = this.tokenStorage.getToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<any>(this.baseUrl, { headers });
  }
}
