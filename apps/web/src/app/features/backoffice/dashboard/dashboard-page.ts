import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">
          Welcome, {{ auth.user()?.firstName }}
        </h2>
        <p class="text-gray-600 mb-4">
          You are logged in as
          <span class="font-medium">{{ auth.user()?.role }}</span>.
        </p>

        <div class="flex flex-wrap gap-3">
          <a
            routerLink="/backoffice/orders"
            class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
          >
            View Orders
          </a>
          <a
            routerLink="/backoffice/products"
            class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
          >
            View Products
          </a>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPage {
  protected readonly auth = inject(AuthService);
}
