import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <a routerLink="/" class="text-xl font-bold text-gray-900">PC Hub</a>

            <div class="flex items-center gap-6">
              <a
                routerLink="/products"
                class="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Products
              </a>
            </div>

            <div class="flex items-center gap-4">
              @if (auth.isAuthenticated()) {
                <a
                  routerLink="/cart"
                  class="relative text-sm text-gray-600 hover:text-gray-900"
                >
                  Cart
                  @if (cartService.itemCount() > 0) {
                    <span
                      class="absolute -top-2 -right-4 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-600 rounded-full"
                    >
                      {{ cartService.itemCount() }}
                    </span>
                  }
                </a>
                <span class="text-sm text-gray-600">
                  {{ auth.user()?.firstName }}
                </span>
                <a
                  routerLink="/account/orders"
                  class="text-sm text-gray-600 hover:text-gray-900"
                >
                  Orders
                </a>
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
export class StorefrontLayout implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly cartService = inject(CartService);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
    }
  }

  onLogout() {
    this.auth.logout().subscribe(() => {
      this.cartService.clearLocalCart();
    });
  }
}
