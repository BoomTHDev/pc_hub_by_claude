import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BackofficeReportService, type DailySalesResult } from '../../../core/services/backoffice-report.service';
import { BackofficeAnalyticsService, type AnalyticsSummary } from '../../../core/services/backoffice-analytics.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, ThaiBahtPipe],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-2">
          Welcome, {{ auth.user()?.firstName }}
        </h2>
        <p class="text-gray-600 mb-4">
          You are logged in as
          <span class="font-medium">{{ auth.user()?.role }}</span>.
        </p>
      </div>

      @if (loading()) {
        <p class="text-gray-500">Loading dashboard data...</p>
      } @else {
        <!-- Staff view: daily sales summary -->
        @if (isStaff() && dailySales()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-sm text-gray-500">Today's Orders</p>
              <p class="text-2xl font-bold text-gray-900">{{ dailySales()!.totalOrders }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-sm text-gray-500">Completed Revenue</p>
              <p class="text-2xl font-bold text-green-700">{{ dailySales()!.completedRevenue | thaiBaht }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-sm text-gray-500">Pending Revenue</p>
              <p class="text-2xl font-bold text-yellow-700">{{ dailySales()!.pendingRevenue | thaiBaht }}</p>
            </div>
          </div>
        }

        <!-- Admin view: analytics summary -->
        @if (isAdmin() && analyticsSummary()) {
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-xs text-gray-500">Total Revenue</p>
              <p class="text-lg font-bold text-green-700">{{ analyticsSummary()!.totalRevenue | thaiBaht }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-xs text-gray-500">Total Orders</p>
              <p class="text-lg font-bold text-gray-900">{{ analyticsSummary()!.totalOrders }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-xs text-gray-500">Pending Review</p>
              <p class="text-lg font-bold text-yellow-700">{{ analyticsSummary()!.pendingReviewCount }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-xs text-gray-500">Customers</p>
              <p class="text-lg font-bold text-gray-900">{{ analyticsSummary()!.totalCustomers }}</p>
            </div>
            <div class="bg-white rounded-lg shadow p-4">
              <p class="text-xs text-gray-500">Active Products</p>
              <p class="text-lg font-bold text-gray-900">{{ analyticsSummary()!.totalProducts }}</p>
            </div>
          </div>
        }
      }

      <!-- Quick links -->
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
        <a
          routerLink="/backoffice/reports/daily-sales"
          class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
        >
          Daily Sales Report
        </a>
        @if (isAdmin()) {
          <a
            routerLink="/backoffice/analytics"
            class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
          >
            Analytics
          </a>
          <a
            routerLink="/backoffice/users"
            class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
          >
            Manage Users
          </a>
        }
      </div>
    </div>
  `,
})
export class DashboardPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly reportService = inject(BackofficeReportService);
  private readonly analyticsService = inject(BackofficeAnalyticsService);

  protected readonly dailySales = signal<DailySalesResult | null>(null);
  protected readonly analyticsSummary = signal<AnalyticsSummary | null>(null);
  protected readonly loading = signal(true);

  ngOnInit() {
    const role = this.auth.user()?.role;

    if (role === 'STAFF') {
      this.reportService.getDailySales().subscribe({
        next: (res) => {
          this.dailySales.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else if (role === 'ADMIN') {
      this.analyticsService.getSummary().subscribe({
        next: (res) => {
          this.analyticsSummary.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  protected isStaff(): boolean {
    return this.auth.user()?.role === 'STAFF';
  }

  protected isAdmin(): boolean {
    return this.auth.user()?.role === 'ADMIN';
  }
}
