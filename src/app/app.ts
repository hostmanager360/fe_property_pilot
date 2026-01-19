import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrevisioneGuadagno } from './components/previsione-guadagno/previsione-guadagno';

@Component({
  selector: 'app-root',
  imports: [PrevisioneGuadagno],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fe_propertyPilot');
}
