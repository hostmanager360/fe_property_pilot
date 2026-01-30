import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserDto } from '../../model/auth/RegistrationDto';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  register(dto: UserDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, dto);
  }
}
