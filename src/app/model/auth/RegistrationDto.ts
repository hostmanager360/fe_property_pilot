export interface UserDto {
  email: string;
  password: string;
  confermaPassword: string;
  role: string;      // per register base
  tenantKey?: string; // opzionale per admin creato da OWNER
}