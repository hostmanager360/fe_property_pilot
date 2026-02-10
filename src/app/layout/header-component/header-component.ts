import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { TokenStorageService } from '../../services/token-storage';
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatDivider
],
  templateUrl: './header-component.html',
  styleUrls: ['./header-component.css'],
})
export class HeaderComponent {
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);

  email = this.tokenStorage.getMailStorage();

  goHome() {
    this.router.navigateByUrl('/home');
  }

  goUserInfo() {
    this.router.navigateByUrl('/user-info');
  }

  goCreateUser() {
    this.router.navigateByUrl('/registration');
  }

  logout() {
    this.tokenStorage.clear();
    this.router.navigateByUrl('/login');
  }
}