import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BackofficeAnalyticsService,
  type AnalyticsSummary,
  type RevenueTrendPoint,
  type TopProduct,
} from '../../../core/services/backoffice-analytics.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';

@Component({
  selector: 'app-bo-analytics',
  imports: [FormsModule, ThaiBahtPipe],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>

      @if (loading()) {
        <p class="text-gray-500">Loading...</p>
      } @else if (summaryError()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-700">{{ summaryError() }}</p>
          <button
            (click)="retrySummary()"
            class="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500 cursor-pointer"
          >
            Retry
          </button>
        </div>
      } @else if (summary()) {
        <!-- Summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-xs text-gray-500">Total Revenue</p>
            <p class="text-lg font-bold text-green-700">{{ summary()!.totalRevenue | thaiBaht }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-xs text-gray-500">Total Orders</p>
            <p class="text-lg font-bold text-gray-900">{{ summary()!.totalOrders }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-xs text-gray-500">Pending Review</p>
            <p class="text-lg font-bold text-yellow-700">{{ summary()!.pendingReviewCount }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-xs text-gray-500">Customers</p>
            <p class="text-lg font-bold text-gray-900">{{ summary()!.totalCustomers }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-xs text-gray-500">Active Products</p>
            <p class="text-lg font-bold text-gray-900">{{ summary()!.totalProducts }}</p>
          </div>
        </div>

        <!-- Orders by status -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Orders by Status</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            @for (s of summary()!.ordersByStatus; track s.status) {
              <div class="flex justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                <span class="text-gray-600">{{ s.status }}</span>
                <span class="font-medium text-gray-900">{{ s.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Revenue trend -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">Revenue Trend</h3>
            <select
              [(ngModel)]="trendPeriod"
              (ngModelChange)="onTrendPeriodChange()"
              class="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          @if (trendLoading()) {
            <p class="text-sm text-gray-400">Loading trend...</p>
          } @else if (trendError()) {
            <div class="text-sm">
              <p class="text-red-600">{{ trendError() }}</p>
              <button
                (click)="onTrendPeriodChange()"
                class="mt-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Retry
              </button>
            </div>
          } @else if (trendData().length === 0) {
            <p class="text-sm text-gray-400">No revenue data for this period.</p>
          } @else {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (point of trendData(); track point.date) {
                    <tr>
                      <td class="px-3 py-2 text-sm text-gray-700">{{ point.date }}</td>
                      <td class="px-3 py-2 text-sm text-right text-gray-700">{{ point.revenue | thaiBaht }}</td>
                      <td class="px-3 py-2 text-sm text-right text-gray-600">{{ point.orderCount }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Top products -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">Top Products</h3>
            <select
              [(ngModel)]="topLimit"
              (ngModelChange)="onTopLimitChange()"
              class="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option [ngValue]="5">Top 5</option>
              <option [ngValue]="10">Top 10</option>
              <option [ngValue]="25">Top 25</option>
            </select>
          </div>
          @if (topLoading()) {
            <p class="text-sm text-gray-400">Loading...</p>
          } @else if (topError()) {
            <div class="text-sm">
              <p class="text-red-600">{{ topError() }}</p>
              <button
                (click)="onTopLimitChange()"
                class="mt-1 text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Retry
              </button>
            </div>
          } @else if (topProducts().length === 0) {
            <p class="text-sm text-gray-400">No product sales data.</p>
          } @else {
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (p of topProducts(); track p.productId; let i = $index) {
                  <tr>
                    <td class="px-3 py-2 text-sm text-gray-500">{{ i + 1 }}</td>
                    <td class="px-3 py-2 text-sm text-gray-700 font-medium">{{ p.productName }}</td>
                    <td class="px-3 py-2 text-sm text-gray-500">{{ p.sku }}</td>
                    <td class="px-3 py-2 text-sm text-right text-gray-700">{{ p.totalQuantitySold }}</td>
                    <td class="px-3 py-2 text-sm text-right text-gray-700">{{ p.totalRevenue | thaiBaht }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `,
})
export class BoAnalyticsPage implements OnInit {
  private readonly analyticsService = inject(BackofficeAnalyticsService);

  protected readonly summary = signal<AnalyticsSummary | null>(null);
  protected readonly trendData = signal<RevenueTrendPoint[]>([]);
  protected readonly topProducts = signal<TopProduct[]>([]);
  protected readonly loading = signal(true);
  protected readonly summaryError = signal('');
  protected readonly trendLoading = signal(false);
  protected readonly trendError = signal('');
  protected readonly topLoading = signal(false);
  protected readonly topError = signal('');

  protected trendPeriod: '7d' | '30d' | '90d' = '30d';
  protected topLimit = 10;

  ngOnInit() {
    this.loadSummary();
    this.loadTrend();
    this.loadTopProducts();
  }

  protected retrySummary() {
    this.summaryError.set('');
    this.loadSummary();
  }

  private loadSummary() {
    this.loading.set(true);
    this.analyticsService.getSummary().subscribe({
      next: (res) => {
        this.summary.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.summaryError.set('Failed to load analytics summary.');
        this.loading.set(false);
      },
    });
  }

  onTrendPeriodChange() {
    this.loadTrend();
  }

  onTopLimitChange() {
    this.loadTopProducts();
  }

  private loadTrend() {
    this.trendLoading.set(true);
    this.trendError.set('');
    this.analyticsService.getRevenueTrend(this.trendPeriod).subscribe({
      next: (res) => {
        this.trendData.set(res.data);
        this.trendLoading.set(false);
      },
      error: () => {
        this.trendError.set('Failed to load revenue trend.');
        this.trendLoading.set(false);
      },
    });
  }

  private loadTopProducts() {
    this.topLoading.set(true);
    this.topError.set('');
    this.analyticsService.getTopProducts(this.topLimit).subscribe({
      next: (res) => {
        this.topProducts.set(res.data);
        this.topLoading.set(false);
      },
      error: () => {
        this.topError.set('Failed to load top products.');
        this.topLoading.set(false);
      },
    });
  }
}
