export class PrevisioneGuadagnoDto {
  id?: number;
  nomeAppartamento = '';
  indirizzo = '';

  numeroLocali: number | null = null;
  numeroBagni: number | null = null;

  mutuoAffitto: number | null = null;
  costoUtenzeMensili: number | null = null;
  costoPulizia: number | null = null;

  numeroPrenotazioni: number | null = null;
  numeroNottiMensili: number | null = null;
  prezzoMedioPerNotte: number | null = null;

  costoTasse: number | null = null;
  costoPiattaforma: number | null = null;

  tipoGestione = '';
  appartamentoDiretto = false;

  commissioneGestioneTotale: number | null = null;
  commissioneCoHost: number | null = null;
  commissioneHost: number | null = null;

  // risultati dal BE ok optional
  totaleCostoTassa?: number;
  totaleCostoPiattaforma?: number;
  totaleLordoPernottamenti?: number;
  totaleLordoGestione?: number;
  totaleCostoPulizia?: number;
  totaleCostoPulizie?: number;
  totaleNettoProprietario?: number;
  totaleCommissioneHost?: number;
  totaleCommissioneCoHost?: number;
}
