import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-backoffice-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-100">
      <!-- Sidebar -->
      <aside
        class="w-64 bg-gray-900 text-white flex flex-col shrink-0"
        [class.max-md:hidden]="!sidebarOpen()"
        [class.max-md:fixed]="sidebarOpen()"
        [class.max-md:inset-0]="sidebarOpen()"
        [class.max-md:z-40]="sidebarOpen()"
      >
        <div class="p-4 border-b border-gray-700">
          <a routerLink="/" class="text-lg font-bold text-white hover:text-gray-300">
            PC Hub
          </a>
          <span class="ml-2 text-xs text-gray-400">Back Office</span>
        </div>

        <nav class="flex-1 p-4 space-y-1">
          <a
            routerLink="/backoffice"
            routerLinkActive="bg-gray-700"
            [routerLinkActiveOptions]="{ exact: true }"
            class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Dashboard
          </a>
          <a
            routerLink="/backoffice/orders"
            routerLinkActive="bg-gray-700"
            class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Orders
          </a>
          <a
            routerLink="/backoffice/products"
            routerLinkActive="bg-gray-700"
            class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Products
          </a>
          <a
            routerLink="/backoffice/categories"
            routerLinkActive="bg-gray-700"
            class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Categories
          </a>
          <a
            routerLink="/backoffice/brands"
            routerLinkActive="bg-gray-700"
            class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Brands
          </a>
          <a
            routerLink="/backoffice/reports/daily-sales"
            routerLinkActive="bg-gray-700"
            class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
          >
            Daily Sales
          </a>
          @if (isAdmin()) {
            <div class="pt-3 mt-3 border-t border-gray-700">
              <span class="px-3 text-xs uppercase text-gray-500">Admin</span>
            </div>
            <a
              routerLink="/backoffice/analytics"
              routerLinkActive="bg-gray-700"
              class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
            >
              Analytics
            </a>
            <a
              routerLink="/backoffice/users"
              routerLinkActive="bg-gray-700"
              class="block px-3 py-2 rounded text-sm hover:bg-gray-700"
            >
              Users
            </a>
          }
        </nav>

        <div class="p-4 border-t border-gray-700">
          <div class="text-sm text-gray-300">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</div>
          <div class="text-xs text-gray-500">{{ auth.user()?.role }}</div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top bar -->
        <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <button
            (click)="sidebarOpen.set(!sidebarOpen())"
            class="md:hidden text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="flex-1"></div>
          <div class="flex items-center gap-4">
            <a routerLink="/" class="text-sm text-gray-500 hover:text-gray-700">
              View Storefront
            </a>
            <button
              (click)="onLogout()"
              class="text-sm text-red-600 hover:text-red-800 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
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
