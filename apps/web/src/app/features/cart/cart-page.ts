import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { ThaiBahtPipe } from '../../shared/pipes/thai-baht.pipe';
import type { CartItem } from '../../shared/models/cart.model';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, ThaiBahtPipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      @if (loading()) {
        <div class="animate-pulse space-y-4">
          @for (_ of [1, 2]; track _) {
            <div class="flex gap-4 p-4 bg-white rounded-lg">
              <div class="w-20 h-20 bg-gray-200 rounded"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="text-center py-12">
          <p class="text-red-600 mb-4">{{ error() }}</p>
          <button (click)="loadCart()" class="text-indigo-600 hover:text-indigo-500 font-medium">
            Retry
          </button>
        </div>
      } @else if (items().length === 0) {
        <div class="text-center py-16">
          <p class="text-gray-500 mb-6">Your cart is empty.</p>
          <a
            routerLink="/products"
            class="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Browse Products
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (item of items(); track item.id) {
            <div class="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <a [routerLink]="['/products', item.product.slug]" class="shrink-0">
                <img
                  [src]="item.product.image ?? '/images/no-image.svg'"
                  [alt]="item.product.name"
                  class="w-20 h-20 object-cover rounded"
                />
              </a>

              <div class="flex-1 min-w-0">
                <a
                  [routerLink]="['/products', item.product.slug]"
                  class="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block"
                >
                  {{ item.product.name }}
                </a>
                <p class="text-sm text-gray-500">
                  {{ item.product.brand.name }} · {{ item.product.category.name }}
                </p>
                <p class="text-sm font-semibold text-indigo-600 mt-1">
                  {{ item.product.price | thaiBaht }}
                </p>

                @if (!item.product.isActive || !item.product.category.isActive || !item.product.brand.isActive) {
                  <p class="text-xs text-red-600 mt-1">This product is currently unavailable</p>
                } @else if (item.quantity > item.product.stock) {
                  <p class="text-xs text-amber-600 mt-1">
                    Only {{ item.product.stock }} in stock
                  </p>
                }
              </div>

              <div class="flex items-center gap-2">
                <button
                  (click)="decrementQuantity(item)"
                  [disabled]="item.quantity <= 1 || updatingItemId() === item.id"
                  class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                <button
                  (click)="incrementQuantity(item)"
                  [disabled]="item.quantity >= item.product.stock || updatingItemId() === item.id"
                  class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <p class="text-sm font-semibold text-gray-900 w-28 text-right">
                {{ item.product.price * item.quantity | thaiBaht }}
              </p>

              <button
                (click)="removeItem(item.id)"
                [disabled]="updatingItemId() === item.id"
                class="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          }
        </div>

        <!-- Summary -->
        <div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="flex justify-between items-center mb-4">
            <span class="text-gray-600">Subtotal ({{ cartService.itemCount() }} items)</span>
            <span class="text-lg font-bold text-gray-900">{{ subtotal() | thaiBaht }}</span>
          </div>
          <div class="flex gap-4">
            <button
              (click)="clearAll()"
              class="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50"
            >
              Clear Cart
            </button>
            <a
              routerLink="/checkout"
              class="flex-1 text-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Proceed to Checkout
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartPage implements OnInit {
  protected readonly cartService = inject(CartService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly updatingItemId = signal<number | null>(null);

  readonly items = signal<CartItem[]>([]);
  readonly subtotal = signal(0);

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.loading.set(true);
    this.error.set('');

    this.cartService.loadCart().subscribe({
      next: (res) => {
        this.items.set(res.data.items);
        this.recalcSubtotal(res.data.items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load cart. Please try again.');
        this.loading.set(false);
      },
    });
  }

  incrementQuantity(item: CartItem) {
    this.updatingItemId.set(item.id);
    this.cartService.updateItem(item.id, item.quantity + 1).subscribe({
      next: (res) => {
        this.items.set(res.data.items);
        this.recalcSubtotal(res.data.items);
        this.updatingItemId.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.updatingItemId.set(null);
        if (err.status === 400) {
          this.error.set('Cannot increase quantity. Stock limit reached.');
        }
      },
    });
  }

  decrementQuantity(item: CartItem) {
    if (item.quantity <= 1) return;
    this.updatingItemId.set(item.id);
    this.cartService.updateItem(item.id, item.quantity - 1).subscribe({
      next: (res) => {
        this.items.set(res.data.items);
        this.recalcSubtotal(res.data.items);
        this.updatingItemId.set(null);
      },
      error: () => {
        this.updatingItemId.set(null);
      },
    });
  }

  removeItem(cartItemId: number) {
    this.updatingItemId.set(cartItemId);
    this.cartService.removeItem(cartItemId).subscribe({
      next: (res) => {
        this.items.set(res.data.items);
        this.recalcSubtotal(res.data.items);
        this.updatingItemId.set(null);
      },
      error: () => {
        this.updatingItemId.set(null);
      },
    });
  }

  clearAll() {
    this.cartService.clearCart().subscribe({
      next: (res) => {
        this.items.set(res.data.items);
        this.recalcSubtotal(res.data.items);
      },
    });
  }

  private recalcSubtotal(cartItems: CartItem[]) {
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    this.subtotal.set(total);
  }
}
