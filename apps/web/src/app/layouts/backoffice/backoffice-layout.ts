import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-backoffice-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './backoffice-layout.html',
})
export class BackofficeLayout {
  protected readonly auth = inject(AuthService);
  protected readonly sidebarOpen = signal(false);

  protected isAdmin(): boolean {
    return this.auth.user()?.role === 'ADMIN';
  }

  onLogout() {
    this.auth.logout().subscribe();
  }
}
