import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DatePipe, MatIcon],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {

  today = new Date();

  constructor(private router: Router) {}

  goTo(path: string) {
    this.router.navigate([path]);
  }
}