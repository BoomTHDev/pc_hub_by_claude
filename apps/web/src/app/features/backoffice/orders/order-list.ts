import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BackofficeOrderService, type BackofficeOrderSummary } from '../../../core/services/backoffice-order.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';
import type { PaginationMeta } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-bo-order-list',
  imports: [RouterLink, FormsModule, DatePipe, ThaiBahtPipe],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            [(ngModel)]="search"
            (ngModelChange)="onFilterChange()"
            placeholder="Search customer..."
            class="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <select
            [(ngModel)]="statusFilter"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded px-3 py-2 text-sm"
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
          <select
            [(ngModel)]="paymentFilter"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Payment Methods</option>
            <option value="COD">COD</option>
            <option value="PROMPTPAY_QR">PromptPay QR</option>
          </select>
          <input
            type="date"
            [(ngModel)]="dateFrom"
            (ngModelChange)="onFilterChange()"
            placeholder="Date from"
            class="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      @if (loading()) {
        <p class="text-gray-500">Loading orders...</p>
      } @else if (orders().length === 0) {
        <p class="text-gray-500">No orders found.</p>
      } @else {
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-gray-50 cursor-pointer" [routerLink]="['/backoffice/orders', order.id]">
                  <td class="px-4 py-3 text-sm font-medium text-indigo-600">{{ order.orderNumber }}</td>
                  <td class="px-4 py-3 text-sm text-gray-700">
                    {{ order.customer.firstName }} {{ order.customer.lastName }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ order.paymentMethod }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="getStatusClasses(order.status)"
                    >
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-gray-700">{{ order.totalAmount | thaiBaht }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ order.createdAt | date:'short' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination()) {
          <div class="flex items-center justify-between mt-4">
            <p class="text-sm text-gray-600">
              Showing page {{ pagination()!.page }} of {{ pagination()!.totalPages }}
              ({{ pagination()!.total }} total)
            </p>
            <div class="flex gap-2">
              <button
                (click)="goToPage(pagination()!.page - 1)"
                [disabled]="pagination()!.page <= 1"
                class="px-3 py-1 text-sm border rounded disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                Previous
              </button>
              <button
                (click)="goToPage(pagination()!.page + 1)"
                [disabled]="pagination()!.page >= pagination()!.totalPages"
                class="px-3 py-1 text-sm border rounded disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                Next
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class BoOrderListPage implements OnInit {
  private readonly orderService = inject(BackofficeOrderService);

  protected readonly orders = signal<BackofficeOrderSummary[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);

  protected search = '';
  protected statusFilter = '';
  protected paymentFilter = '';
  protected dateFrom = '';
  private currentPage = 1;

  ngOnInit() {
    this.loadOrders();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadOrders();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadOrders();
  }

  private loadOrders() {
    this.loading.set(true);
    this.orderService
      .listOrders({
        page: this.currentPage,
        limit: 20,
        status: this.statusFilter || undefined,
        paymentMethod: this.paymentFilter || undefined,
        search: this.search || undefined,
        dateFrom: this.dateFrom || undefined,
      })
      .subscribe({
        next: (res) => {
          this.orders.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  protected getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      AWAITING_PAYMENT: 'bg-blue-100 text-blue-800',
      PAYMENT_REVIEW: 'bg-purple-100 text-purple-800',
      APPROVED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-cyan-100 text-cyan-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800';
  }
}
