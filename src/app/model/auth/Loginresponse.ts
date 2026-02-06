export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  tenantKey: string;
  role: string;
  email: string;
  resetPasswordToken: string;
  passwordResetRequired: boolean;
  firstAccessRequired: boolean;
  firstaccessStep: number;
}
