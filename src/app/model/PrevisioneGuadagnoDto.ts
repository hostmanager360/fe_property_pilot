export class PrevisioneGuadagnoDto {
 nomeAppartamento = '';
  indirizzo = '';
  numeroLocali = 0;
  numeroBagni = 0;
  mutuoAffitto = 0;
  tipoGestione = '';
  costoUtenzeMensili = 0;
  costoPulizia = 0;
  numeroPrenotazioni = 0;
  numeroNottiMensili = 0;
  prezzoMedioPerNotte = 0;

  costoTasse = 0;
  costoPiattaforma = 0;
  appartamentoDiretto = false;
  commissioneGestioneTotale = 0;
  commissioneCoHost = 0;
  commissioneHost = 0;

  totaleCostoTasse?: number;
  totaleCostoPiattaforma?: number;
  totaleLordoPernottamenti?: number;
  totaleLordoGestione?: number;
  totaleCostoPulizia?: number;
  totaleNettoProprietario?: number;
  totaleCommissioneHost?: number;
  totaleCommissioneCoHost?: number;
}
