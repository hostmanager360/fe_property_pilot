import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private API = 'http://localhost:8080/api'; // <-- adegua al tuo BE

  getUserDetail(): Observable<any> {
    return this.http.get(`${this.API}/user/detail`);
  }

  getTenantDetail(): Observable<any> {
    return this.http.get(`${this.API}/tenant/detail`);
  }
}
