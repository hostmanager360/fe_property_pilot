import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private TOKEN_KEY = 'pp_token';
  private TENANT_KEY = 'pp_tenant';
  private ROLE_KEY = 'pp_role_id';
  private FIRST_ACCESS_KEY = 'pp_first_access';
  private RESET_REQUIRED_KEY = 'pp_reset_required';
  private EMAIL = 'pp_email';
  private RESET_PASSWORD_TOKEN = 'pp_reset_password_token';
  private FIRST_ACCESS_STEP = 'pp_first_access_step';

  saveLoginData(response: any): void {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.TENANT_KEY, response.tenantKey);
    localStorage.setItem(this.ROLE_KEY, response.role);
    localStorage.setItem(this.FIRST_ACCESS_KEY, String(response.firstAccessRequired));
    localStorage.setItem(this.RESET_REQUIRED_KEY, String(response.passwordResetRequired));
    localStorage.setItem(this.EMAIL, String(response.email));
    localStorage.setItem(this.RESET_PASSWORD_TOKEN, String(response.resetPasswordToken));
    localStorage.setItem(this.FIRST_ACCESS_STEP, response.firstAccessStep);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getTenantKey(): string | null {
    return localStorage.getItem(this.TENANT_KEY);
  }

  getRoleId(): number | null {
  const value = localStorage.getItem('pp_role_id');
  return value ? Number(value) : null;
}

getFirstAccess(): boolean {
  return localStorage.getItem('pp_first_access') === 'true';
}

getPasswordResetRequired(): boolean {
  return localStorage.getItem('pp_reset_required') === 'true';
}


  clear(): void {
    localStorage.clear();
  }

  setEmailStorage(email: string): void{
        localStorage.setItem(this.EMAIL, email);
  }

  getMailStorage(): string | null {
    return localStorage.getItem(this.EMAIL) ;
  }
  setResetPasswordToken(resetPasswordToken: string): void{
        localStorage.setItem(this.RESET_PASSWORD_TOKEN, resetPasswordToken);
  }

  getOnboardingStep(): string | null {
    return localStorage.getItem(this.FIRST_ACCESS_STEP) ;
  }
   setnboardingStep(firstaccessStep: any): void{
        localStorage.setItem(this.FIRST_ACCESS_STEP, firstaccessStep);
  }
}
