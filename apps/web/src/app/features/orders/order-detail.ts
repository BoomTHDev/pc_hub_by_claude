import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { ThaiBahtPipe } from '../../shared/pipes/thai-baht.pipe';
import type { OrderDetail, PromptPayQR } from '../../shared/models/order.model';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DatePipe, ThaiBahtPipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <a routerLink="/account/orders" class="text-sm text-indigo-600 hover:text-indigo-500 mb-4 inline-block">
        &larr; Back to Orders
      </a>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-red-600">{{ error() }}</p>
        </div>
      } @else if (order(); as o) {
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">{{ o.orderNumber }}</h1>
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
            [class]="getStatusClasses(o.status)"
          >
            {{ formatStatus(o.status) }}
          </span>
        </div>

        <!-- Rejection notice -->
        @if (o.status === 'REJECTED' && o.rejectReason) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-red-800">Order Rejected</p>
            <p class="text-sm text-red-700 mt-1">{{ o.rejectReason }}</p>
          </div>
        }

        <!-- PromptPay QR section -->
        @if (o.paymentMethod === 'PROMPTPAY_QR' && o.status === 'AWAITING_PAYMENT') {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
            <h2 class="text-lg font-semibold text-blue-900 mb-4">Complete Your Payment</h2>

            @if (qrLoading()) {
              <div class="animate-pulse">
                <div class="w-48 h-48 bg-blue-200 rounded mx-auto"></div>
              </div>
            } @else if (qrData(); as qr) {
              <img [src]="qr.qrDataUrl" alt="PromptPay QR Code" class="mx-auto w-48 h-48 mb-3" />
              <p class="text-lg font-bold text-blue-900">{{ qr.amount | thaiBaht }}</p>
              <p class="text-sm text-blue-700 mt-1">PromptPay ID: {{ qr.promptPayId }}</p>
            } @else if (qrError()) {
              <p class="text-sm text-red-600">{{ qrError() }}</p>
            }

            <div class="mt-6 border-t border-blue-200 pt-4">
              <h3 class="text-sm font-medium text-blue-900 mb-2">Upload Payment Slip</h3>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                (change)="onFileSelected($event)"
                class="text-sm"
              />
              @if (selectedFile()) {
                <div class="mt-2">
                  <p class="text-xs text-gray-600">{{ selectedFile()?.name }}</p>
                  <button
                    (click)="onUploadSlip()"
                    [disabled]="uploading()"
                    class="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                  >
                    {{ uploading() ? 'Uploading...' : 'Upload Slip' }}
                  </button>
                </div>
              }
              @if (uploadError()) {
                <p class="mt-2 text-sm text-red-600">{{ uploadError() }}</p>
              }
              @if (uploadSuccess()) {
                <p class="mt-2 text-sm text-green-600">Slip uploaded successfully!</p>
              }
            </div>
          </div>
        }

        <!-- Payment review notice -->
        @if (o.status === 'PAYMENT_REVIEW') {
          <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p class="text-sm font-medium text-purple-800">Payment Under Review</p>
            <p class="text-sm text-purple-700 mt-1">Your payment slip has been submitted and is being reviewed by our team.</p>
          </div>
        }

        <!-- Order info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 class="text-sm font-medium text-gray-500 mb-3">Order Details</h2>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500">Payment Method</dt>
                <dd class="text-gray-900">{{ o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'PromptPay QR' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500">Date</dt>
                <dd class="text-gray-900">{{ o.createdAt | date:'medium' }}</dd>
              </div>
              @if (o.customerNote) {
                <div>
                  <dt class="text-gray-500">Note</dt>
                  <dd class="text-gray-900 mt-1">{{ o.customerNote }}</dd>
                </div>
              }
            </dl>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 class="text-sm font-medium text-gray-500 mb-3">Shipping Address</h2>
            <div class="text-sm text-gray-900">
              <p class="font-medium">{{ o.addressSnapshot['recipientName'] }}</p>
              <p>{{ o.addressSnapshot['phoneNumber'] }}</p>
              <p>{{ o.addressSnapshot['line1'] }}</p>
              @if (o.addressSnapshot['line2']) {
                <p>{{ o.addressSnapshot['line2'] }}</p>
              }
              <p>{{ o.addressSnapshot['subdistrict'] }}, {{ o.addressSnapshot['district'] }}</p>
              <p>{{ o.addressSnapshot['province'] }} {{ o.addressSnapshot['postalCode'] }}</p>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 class="text-sm font-medium text-gray-500 p-4 border-b border-gray-200">Items</h2>
          <div class="divide-y divide-gray-100">
            @for (item of o.items; track item.id) {
              <div class="p-4 flex items-center gap-4">
                @if (item.productSnapshot['image']) {
                  <img
                    [src]="item.productSnapshot['image']"
                    [alt]="item.productSnapshot['name']"
                    class="w-16 h-16 object-cover rounded"
                  />
                } @else {
                  <div class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                    No img
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ item.productSnapshot['name'] }}</p>
                  <p class="text-xs text-gray-500">{{ item.productSnapshot['brandName'] }} · {{ item.productSnapshot['categoryName'] }}</p>
                  <p class="text-xs text-gray-400">SKU: {{ item.productSnapshot['sku'] }}</p>
                </div>
                <div class="text-right text-sm">
                  <p class="text-gray-500">{{ item.quantity }} × {{ item.unitPrice | thaiBaht }}</p>
                  <p class="font-medium text-gray-900">{{ item.lineTotal | thaiBaht }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Totals -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-500">Subtotal</dt>
              <dd class="text-gray-900">{{ o.subtotalAmount | thaiBaht }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-500">Shipping</dt>
              <dd class="text-gray-900">{{ o.shippingAmount === 0 ? 'Free' : (o.shippingAmount | thaiBaht) }}</dd>
            </div>
            <div class="flex justify-between border-t border-gray-200 pt-2">
              <dt class="font-medium text-gray-900">Total</dt>
              <dd class="text-lg font-bold text-indigo-600">{{ o.totalAmount | thaiBaht }}</dd>
            </div>
          </dl>
        </div>

        <!-- Payment slips -->
        @if (o.payment) {
          @if (o.payment.slips.length > 0) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 class="text-sm font-medium text-gray-500 mb-3">Payment Slips</h2>
              <div class="flex gap-4 flex-wrap">
                @for (slip of o.payment.slips; track slip.id) {
                  <div class="text-center">
                    <a [href]="slip.imageUrl" target="_blank">
                      <img
                        [src]="slip.imageUrl"
                        alt="Payment slip"
                        class="w-32 h-32 object-cover rounded border border-gray-200 hover:border-indigo-400"
                      />
                    </a>
                    <p class="text-xs text-gray-500 mt-1">{{ slip.uploadedAt | date:'short' }}</p>
                  </div>
                }
              </div>
            </div>
          }
        }
      }
    </div>
  `,
})
export class OrderDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly order = signal<OrderDetail | null>(null);

  readonly qrLoading = signal(false);
  readonly qrData = signal<PromptPayQR | null>(null);
  readonly qrError = signal('');

  readonly selectedFile = signal<File | null>(null);
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uploadSuccess = signal(false);

  ngOnInit() {
    const orderId = Number(this.route.snapshot.params['orderId']);
    if (!orderId || isNaN(orderId)) {
      this.error.set('Invalid order ID');
      this.loading.set(false);
      return;
    }
    this.loadOrder(orderId);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.uploadError.set('');
    this.uploadSuccess.set(false);
  }

  onUploadSlip() {
    const file = this.selectedFile();
    const o = this.order();
    if (!file || !o) return;

    this.uploading.set(true);
    this.uploadError.set('');

    this.orderService.uploadSlip(o.id, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.uploadSuccess.set(true);
        this.selectedFile.set(null);
        // Reload order to reflect new status
        this.loadOrder(o.id);
      },
      error: () => {
        this.uploading.set(false);
        this.uploadError.set('Failed to upload slip. Please try again.');
      },
    });
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

  private loadOrder(orderId: number) {
    this.loading.set(true);
    this.error.set('');

    this.orderService.getOrder(orderId).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);

        // Load QR if PromptPay and awaiting payment
        if (res.data.paymentMethod === 'PROMPTPAY_QR' && res.data.status === 'AWAITING_PAYMENT') {
          this.loadQR(orderId);
        }
      },
      error: () => {
        this.error.set('Order not found.');
        this.loading.set(false);
      },
    });
  }

  private loadQR(orderId: number) {
    this.qrLoading.set(true);
    this.orderService.getPromptPayQR(orderId).subscribe({
      next: (res) => {
        this.qrData.set(res.data);
        this.qrLoading.set(false);
      },
      error: () => {
        this.qrError.set('Failed to load QR code.');
        this.qrLoading.set(false);
      },
    });
  }
}
