import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ThaiBahtPipe } from '../../shared/pipes/thai-baht.pipe';
import type { OrderConfirmation } from '../../shared/models/cart.model';

@Component({
  selector: 'app-order-confirmation',
  imports: [RouterLink, ThaiBahtPipe],
  template: `
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      @if (loading()) {
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div class="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-red-600 mb-4">{{ error() }}</p>
          <a routerLink="/products" class="text-indigo-600 hover:text-indigo-500 font-medium">
            Back to Products
          </a>
        </div>
      } @else if (order(); as o) {
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p class="text-gray-500">Thank you for your order.</p>
        </div>

        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Order Number</dt>
              <dd class="text-sm font-mono font-semibold text-gray-900">{{ o.orderNumber }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Status</dt>
              <dd class="text-sm font-medium">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  [class]="o.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'"
                >
                  {{ o.status === 'AWAITING_PAYMENT' ? 'Awaiting Payment' : o.status }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-gray-500">Payment Method</dt>
              <dd class="text-sm text-gray-900">
                {{ o.paymentMethod === 'COD' ? 'Cash on Delivery' : 'PromptPay QR' }}
              </dd>
            </div>
            <div class="flex justify-between border-t border-gray-100 pt-3">
              <dt class="text-sm font-medium text-gray-900">Total</dt>
              <dd class="text-lg font-bold text-indigo-600">{{ o.totalAmount | thaiBaht }}</dd>
            </div>
          </dl>

          @if (o.paymentMethod === 'PROMPTPAY_QR') {
            <div class="mt-4 p-3 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-700">
                Please complete your PromptPay payment and upload the payment slip.
              </p>
              <a
                [routerLink]="['/account/orders', o.id]"
                class="inline-block mt-2 text-sm font-medium text-blue-700 hover:text-blue-600 underline"
              >
                Complete Payment &rarr;
              </a>
            </div>
          }
        </div>

        <div class="mt-8 flex justify-center gap-4">
          <a
            [routerLink]="['/account/orders', o.id]"
            class="inline-block rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            View Order
          </a>
          <a
            routerLink="/products"
            class="inline-block rounded-md border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Continue Shopping
          </a>
        </div>
      }
    </div>
  `,
})
export class OrderConfirmationPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly order = signal<OrderConfirmation | null>(null);

  ngOnInit() {
    const orderNumber = this.route.snapshot.queryParams['orderNumber'] as string | undefined;

    if (!orderNumber) {
      this.router.navigate(['/products']);
      return;
    }

    this.cartService.getConfirmation(orderNumber).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Order not found.');
        this.loading.set(false);
      },
    });
  }
}
