import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PrevisioneGuadagnoDto } from '../../model/PrevisioneGuadagnoDto';
import { PrevisioneGuadagnoService } from '../../services/previsioneService/previsione-guadagno-service';
import { ResponseHandler } from '../../model/ResponseHandler';

@Component({
  selector: 'app-previsione-guadagno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './previsione-guadagno.html',
  styleUrl: './previsione-guadagno.css',
})
export class PrevisioneGuadagno {

  previsione: PrevisioneGuadagnoDto = new PrevisioneGuadagnoDto();
  risultato?: PrevisioneGuadagnoDto;

  constructor(private service: PrevisioneGuadagnoService) {}

  calcola(): void {
  this.service.calcola(this.previsione)
              .subscribe({
                next: res => {
                  console.log('Risultato dal backend:', res);
                  this.risultato = res; // <-- direttamente
                  // Se vuoi salvare il messaggio/type puoi farlo a parte
                },
                error: err => {
                  console.error('Errore chiamata:', err);
                  alert('Si è verificato un errore: ' + err.message);
                }
              });
}
}
