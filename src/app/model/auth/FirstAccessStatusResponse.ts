export interface FirstAccessStatusResponse {
  stepCode: string;
  roleCode: string;
  tenantKey: string | null;
  completed: boolean;
}