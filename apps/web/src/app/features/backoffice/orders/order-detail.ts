import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackofficeOrderService, type BackofficeOrderDetail } from '../../../core/services/backoffice-order.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';

@Component({
  selector: 'app-bo-order-detail',
  imports: [RouterLink, DatePipe, FormsModule, ThaiBahtPipe],
  template: `
    <div>
      <a routerLink="/backoffice/orders" class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to Orders
      </a>

      @if (loading()) {
        <p class="text-gray-500">Loading order...</p>
      } @else if (order()) {
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Order {{ order()!.orderNumber }}</h1>
              <p class="text-sm text-gray-500">{{ order()!.createdAt | date:'medium' }}</p>
            </div>
            <span
              class="inline-flex px-3 py-1 text-sm font-medium rounded-full"
              [class]="getStatusClasses(order()!.status)"
            >
              {{ order()!.status }}
            </span>
          </div>

          <!-- Actions -->
          @if (canApprove()) {
            <div class="bg-white rounded-lg shadow p-4 flex items-center gap-4">
              <button
                (click)="onApprove()"
                [disabled]="actionLoading()"
                class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm cursor-pointer disabled:opacity-50"
              >
                Approve
              </button>
              <button
                (click)="showRejectForm.set(true)"
                [disabled]="actionLoading()"
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-sm cursor-pointer disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          }

          @if (canAdvance()) {
            <div class="bg-white rounded-lg shadow p-4 flex items-center gap-4">
              <span class="text-sm text-gray-600">Advance status:</span>
              @if (order()!.status === 'APPROVED' || order()!.status === 'PROCESSING') {
                <button
                  (click)="onAdvance(order()!.status === 'APPROVED' ? 'PROCESSING' : 'SHIPPED')"
                  [disabled]="actionLoading()"
                  class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm cursor-pointer disabled:opacity-50"
                >
                  {{ order()!.status === 'APPROVED' ? 'Mark Processing' : 'Mark Shipped' }}
                </button>
              }
              @if (order()!.status === 'SHIPPED') {
                <button
                  (click)="onAdvance('DELIVERED')"
                  [disabled]="actionLoading()"
                  class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm cursor-pointer disabled:opacity-50"
                >
                  Mark Delivered
                </button>
              }
            </div>
          }

          <!-- Reject Form -->
          @if (showRejectForm()) {
            <div class="bg-white rounded-lg shadow p-4">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Rejection Reason</h3>
              <textarea
                [(ngModel)]="rejectReason"
                rows="3"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="Enter reason for rejection..."
              ></textarea>
              <div class="flex gap-2 mt-2">
                <button
                  (click)="onReject()"
                  [disabled]="!rejectReason.trim() || actionLoading()"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-sm cursor-pointer disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  (click)="showRejectForm.set(false)"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          }

          @if (errorMsg()) {
            <p class="text-sm text-red-600">{{ errorMsg() }}</p>
          }

          <!-- Customer -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Customer</h2>
            <p class="text-sm text-gray-700">{{ order()!.customer.firstName }} {{ order()!.customer.lastName }}</p>
            <p class="text-sm text-gray-500">{{ order()!.customer.email }}</p>
            <p class="text-sm text-gray-500">{{ order()!.customer.phoneNumber }}</p>
          </div>

          <!-- Items -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Items</h2>
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase pb-2">Product</th>
                  <th class="text-right text-xs font-medium text-gray-500 uppercase pb-2">Qty</th>
                  <th class="text-right text-xs font-medium text-gray-500 uppercase pb-2">Unit Price</th>
                  <th class="text-right text-xs font-medium text-gray-500 uppercase pb-2">Line Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (item of order()!.items; track item.id) {
                  <tr>
                    <td class="py-2 text-sm text-gray-700">{{ getProductName(item.productSnapshot) }}</td>
                    <td class="py-2 text-sm text-right text-gray-600">{{ item.quantity }}</td>
                    <td class="py-2 text-sm text-right text-gray-600">{{ item.unitPrice | thaiBaht }}</td>
                    <td class="py-2 text-sm text-right text-gray-700 font-medium">{{ item.lineTotal | thaiBaht }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <div class="border-t border-gray-200 pt-3 mt-3 space-y-1 text-sm text-right">
              <p class="text-gray-600">Subtotal: {{ order()!.subtotalAmount | thaiBaht }}</p>
              <p class="text-gray-600">Shipping: {{ order()!.shippingAmount | thaiBaht }}</p>
              <p class="font-bold text-gray-900">Total: {{ order()!.totalAmount | thaiBaht }}</p>
            </div>
          </div>

          <!-- Payment -->
          @if (order()!.payment) {
            <div class="bg-white rounded-lg shadow p-4">
              <h2 class="text-lg font-semibold text-gray-800 mb-2">Payment</h2>
              <p class="text-sm text-gray-700">Method: {{ order()!.payment!.paymentMethod }}</p>
              <p class="text-sm text-gray-700">Status: {{ order()!.payment!.status }}</p>
              <p class="text-sm text-gray-700">Amount: {{ order()!.payment!.amount | thaiBaht }}</p>

              @if (order()!.payment!.slips.length > 0) {
                <h3 class="text-sm font-medium text-gray-700 mt-3 mb-2">Payment Slips</h3>
                <div class="flex flex-wrap gap-3">
                  @for (slip of order()!.payment!.slips; track slip.id) {
                    <div class="border rounded p-2">
                      <img [src]="slip.imageUrl" alt="Payment slip" class="w-48 h-auto rounded" />
                      <p class="text-xs text-gray-500 mt-1">{{ slip.uploadedAt | date:'short' }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Rejection info -->
          @if (order()!.rejectReason) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 class="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h2>
              <p class="text-sm text-red-700">{{ order()!.rejectReason }}</p>
            </div>
          }

          <!-- Address -->
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold text-gray-800 mb-2">Shipping Address</h2>
            <div class="text-sm text-gray-700 space-y-0.5">
              @for (entry of addressEntries(); track entry[0]) {
                <p><span class="text-gray-500">{{ entry[0] }}:</span> {{ entry[1] }}</p>
              }
            </div>
          </div>
        </div>
      } @else {
        <p class="text-red-600">Order not found.</p>
      }
    </div>
  `,
})
export class BoOrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly orderService = inject(BackofficeOrderService);

  protected readonly order = signal<BackofficeOrderDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly actionLoading = signal(false);
  protected readonly showRejectForm = signal(false);
  protected readonly errorMsg = signal('');
  protected rejectReason = '';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('orderId'));
    if (!id) return;

    this.orderService.getOrder(id).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected canApprove(): boolean {
    const o = this.order();
    if (!o) return false;
    return (
      (o.paymentMethod === 'COD' && o.status === 'PENDING') ||
      (o.paymentMethod === 'PROMPTPAY_QR' && o.status === 'PAYMENT_REVIEW')
    );
  }

  protected canAdvance(): boolean {
    const o = this.order();
    if (!o) return false;
    return ['APPROVED', 'PROCESSING', 'SHIPPED'].includes(o.status);
  }

  protected addressEntries(): [string, string][] {
    const snap = this.order()?.addressSnapshot;
    if (!snap) return [];
    return Object.entries(snap);
  }

  protected getProductName(snapshot: Record<string, unknown>): string {
    return typeof snapshot['name'] === 'string' ? snapshot['name'] : 'Unknown Product';
  }

  onApprove() {
    const o = this.order();
    if (!o) return;
    this.actionLoading.set(true);
    this.errorMsg.set('');
    this.orderService.approveOrder(o.id).subscribe({
      next: () => this.reloadOrder(o.id),
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to approve');
        this.actionLoading.set(false);
      },
    });
  }

  onReject() {
    const o = this.order();
    if (!o || !this.rejectReason.trim()) return;
    this.actionLoading.set(true);
    this.errorMsg.set('');
    this.orderService.rejectOrder(o.id, this.rejectReason.trim()).subscribe({
      next: () => this.reloadOrder(o.id),
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to reject');
        this.actionLoading.set(false);
      },
    });
  }

  onAdvance(status: string) {
    const o = this.order();
    if (!o) return;
    this.actionLoading.set(true);
    this.errorMsg.set('');
    this.orderService.advanceStatus(o.id, status).subscribe({
      next: () => this.reloadOrder(o.id),
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to advance status');
        this.actionLoading.set(false);
      },
    });
  }

  private reloadOrder(id: number) {
    this.orderService.getOrder(id).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.actionLoading.set(false);
        this.showRejectForm.set(false);
        this.rejectReason = '';
      },
      error: () => this.actionLoading.set(false),
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
