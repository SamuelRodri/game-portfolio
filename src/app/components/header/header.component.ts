import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  name = 'Samuel Rodríguez';
  title = 'Game Developer';
  isAdmin$!: Observable<boolean>;
  isAuthenticated$!: Observable<boolean>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin$ = this.authService.isAdmin();
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
