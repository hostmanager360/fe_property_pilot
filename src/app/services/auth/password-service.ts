import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForgotPasswordRequestDTO } from '../../model/auth/ForgotPasswordRequestDTO';
import { ResetPasswordRequestDTO } from '../../model/auth/ResetPasswordRequestDTO';

@Injectable({
  providedIn: 'root',
})
export class PasswordService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:8080/api/users';

  forgotPassword(dto: ForgotPasswordRequestDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, dto);
  }

  resetPassword(dto: ResetPasswordRequestDTO): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, dto);
  }

  verifyResetToken(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/resetPasswordVerifyToken?token=${token}`);
  }
}