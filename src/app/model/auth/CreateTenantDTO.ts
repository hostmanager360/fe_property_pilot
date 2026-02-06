export type TipoSoggetto = 'PERSONA_FISICA' | 'AZIENDA';

export interface CreateTenantDTO {
  tipoSoggetto: TipoSoggetto;

  // persona fisica
  nome?: string;
  cognome?: string;
  codiceFiscale?: string;

  // azienda
  ragioneSociale?: string;

  partitaIva: string;

  // residenza (solo persona fisica)
  viaResidenza?: string;
  civicoResidenza?: string;
  cittaResidenza?: string;
  capResidenza?: string;

  // sede fisica (entrambi)
  viaSedeFisica: string;
  cittaSedeFisica: string;
  capSedeFisica: string;

  dataIscrizione: string;
  dataScadenza?: string | null;
  tipoLicenzaId: number;
  statusId: number;
}