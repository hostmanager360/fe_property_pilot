export interface ResetPasswordRequestDTO {
  token: string;
  newPassword: string;
  repeatPassword: string;
}