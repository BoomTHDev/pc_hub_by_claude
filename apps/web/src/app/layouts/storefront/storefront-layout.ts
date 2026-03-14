import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <a routerLink="/" class="text-xl font-bold text-gray-900">PC Hub</a>

            <div class="flex items-center gap-4">
              @if (auth.isAuthenticated()) {
                <span class="text-sm text-gray-600">
                  {{ auth.user()?.firstName }}
                </span>
                <a
                  routerLink="/account/addresses"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  Addresses
                </a>
                <button
                  (click)="onLogout()"
                  class="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                >
                  Logout
                </button>
              } @else {
                <a
                  routerLink="/login"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  Login
                </a>
                <a
                  routerLink="/register"
                  class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Register
                </a>
              }
            </div>
          </div>
        </div>
      </nav>

      <main class="flex-1">
        <router-outlet />
      </main>
    </div>
  `,
})
export class StorefrontLayout {
  protected readonly auth = inject(AuthService);

  onLogout() {
    this.auth.logout().subscribe();
  }
}
