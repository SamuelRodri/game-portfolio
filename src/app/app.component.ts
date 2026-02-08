import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Manejar redirecciones desde 404.html de GitHub Pages
    this.handleGitHubPagesRedirect();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const fragment = this.router.parseUrl(this.router.url).fragment;
        if (fragment) {
          setTimeout(() => {
            const element = document.getElementById(fragment);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      });
  }

  private handleGitHubPagesRedirect(): void {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');

    if (p) {
      // Restaurar la ruta original desde el parámetro 'p'
      const path = p.replace(/~and~/g, '&');
      window.history.replaceState(null, '', window.location.pathname.replace(/\/$/, '') + '/' + path);
      this.router.navigateByUrl(path);
    }
  }
}
