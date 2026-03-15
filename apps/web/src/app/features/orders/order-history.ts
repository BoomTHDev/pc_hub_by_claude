import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { ThaiBahtPipe } from '../../shared/pipes/thai-baht.pipe';
import type { OrderSummary } from '../../shared/models/order.model';
import type { PaginationMeta } from '../../shared/models/pagination.model';

@Component({
  selector: 'app-order-history',
  imports: [RouterLink, DatePipe, FormsModule, ThaiBahtPipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div class="mb-6">
        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="onFilterChange($event)"
          class="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
          <option value="PAYMENT_REVIEW">Payment Review</option>
          <option value="APPROVED">Approved</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          @for (_ of [1, 2, 3]; track $index) {
            <div class="h-24 bg-gray-200 rounded-lg"></div>
          }
        </div>
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-red-600">{{ error() }}</p>
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-12">
          <p class="text-gray-500 mb-4">No orders found.</p>
          <a routerLink="/products" class="text-indigo-600 hover:text-indigo-500 font-medium">
            Start Shopping
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <a
              [routerLink]="['/account/orders', order.id]"
              class="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-indigo-300 transition-colors"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-mono text-sm font-semibold text-gray-900">{{ order.orderNumber }}</p>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ order.createdAt | date:'medium' }}
                  </p>
                </div>
                <div class="text-right">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class]="getStatusClasses(order.status)"
                  >
                    {{ formatStatus(order.status) }}
                  </span>
                  <p class="text-sm font-bold text-gray-900 mt-2">{{ order.totalAmount | thaiBaht }}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ order.paymentMethod === 'COD' ? 'COD' : 'PromptPay' }}
                  </p>
                </div>
              </div>
            </a>
          }
        </div>

        @if (pagination(); as p) {
          @if (p.totalPages > 1) {
            <div class="mt-6 flex justify-center gap-2">
              <button
                (click)="goToPage(p.page - 1)"
                [disabled]="p.page <= 1"
                class="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Previous
              </button>
              <span class="px-3 py-1 text-sm text-gray-600">
                Page {{ p.page }} of {{ p.totalPages }}
              </span>
              <button
                (click)="goToPage(p.page + 1)"
                [disabled]="p.page >= p.totalPages"
                class="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          }
        }
      }
    </div>
  `,
})
export class OrderHistoryPage implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly orders = signal<OrderSummary[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly statusFilter = signal('');
  private currentPage = 1;

  ngOnInit() {
    this.loadOrders();
  }

  onFilterChange(status: string) {
    this.statusFilter.set(status);
    this.currentPage = 1;
    this.loadOrders();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadOrders();
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      AWAITING_PAYMENT: 'bg-blue-100 text-blue-800',
      PAYMENT_REVIEW: 'bg-purple-100 text-purple-800',
      APPROVED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private loadOrders() {
    this.loading.set(true);
    this.error.set('');

    const filter = this.statusFilter();
    this.orderService.getOrders(this.currentPage, 10, filter || undefined).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load orders.');
        this.loading.set(false);
      },
    });
  }
}
