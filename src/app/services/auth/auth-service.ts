import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserDto } from '../../model/auth/RegistrationDto';
import { LoginRequest } from '../../model/auth/LoginRequest';
import { LoginResponse } from '../../model/auth/Loginresponse';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly usersUrl = 'http://localhost:8080/api/users';
  private readonly loginUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  register(dto: UserDto): Observable<any> {
    return this.http.post(`${this.usersUrl}/register`, dto);
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.loginUrl}/login`, loginRequest);
  }

  // 🔹 CREA ADMIN (solo OWNER)
  createAdmin(dto: UserDto): Observable<any> {
    return this.http.post(`${this.usersUrl}/create-admin`, dto);
  }

  // 🔹 CREA HOST (OWNER, ADMIN)
  createHost(dto: UserDto): Observable<any> {
    return this.http.post(`${this.usersUrl}/create-host`, dto);
  }

  // 🔹 CREA CO-HOST (OWNER, ADMIN, HOST)
  createCohost(dto: UserDto): Observable<any> {
    return this.http.post(`${this.usersUrl}/create-cohost`, dto);
  }
  // 🔹 CREA CO-HOST (OWNER, ADMIN, HOST)
  createOwner(dto: UserDto): Observable<any> {
    return this.http.post(`${this.usersUrl}/register`, dto);
  }
}
