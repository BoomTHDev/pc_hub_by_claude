import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AddressService } from '../../core/services/address.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ThaiBahtPipe } from '../../shared/pipes/thai-baht.pipe';
import type { Address } from '../../shared/models/address.model';
import type { CartItem, CheckoutInvalidItem } from '../../shared/models/cart.model';

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink, FormsModule, ThaiBahtPipe],
  template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      @if (loading()) {
        <div class="animate-pulse space-y-6">
          <div class="h-32 bg-gray-200 rounded-lg"></div>
          <div class="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      } @else if (loadError()) {
        <div class="text-center py-12">
          <p class="text-red-600 mb-4">{{ loadError() }}</p>
          <a routerLink="/products" class="text-indigo-600 hover:text-indigo-500 font-medium">
            Back to Products
          </a>
        </div>
      } @else {
        <!-- Order Items -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div class="space-y-3">
            @for (item of checkoutItems(); track item.name) {
              <div class="flex items-center gap-4">
                <img
                  [src]="item.image ?? '/images/no-image.svg'"
                  [alt]="item.name"
                  class="w-12 h-12 object-cover rounded"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
                  <p class="text-sm text-gray-500">Qty: {{ item.quantity }}</p>
                </div>
                <p class="text-sm font-semibold text-gray-900">
                  {{ item.price * item.quantity | thaiBaht }}
                </p>
              </div>
            }
          </div>
          <div class="border-t border-gray-200 mt-4 pt-4 flex justify-between">
            <span class="font-medium text-gray-600">Subtotal</span>
            <span class="font-bold text-gray-900">{{ subtotal() | thaiBaht }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-500 mt-1">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div class="flex justify-between mt-2 pt-2 border-t border-gray-100">
            <span class="font-semibold text-gray-900">Total</span>
            <span class="text-lg font-bold text-indigo-600">{{ subtotal() | thaiBaht }}</span>
          </div>
        </div>

        <!-- Address Selection -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>

          @if (addresses().length === 0) {
            <p class="text-gray-500 mb-4">You have no saved addresses.</p>
            <a
              routerLink="/account/addresses/new"
              class="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
            >
              Add an address
            </a>
          } @else {
            <div class="space-y-3">
              @for (addr of addresses(); track addr.id) {
                <label
                  class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer"
                  [class]="selectedAddressId() === addr.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'"
                >
                  <input
                    type="radio"
                    name="address"
                    [value]="addr.id"
                    [checked]="selectedAddressId() === addr.id"
                    (change)="selectedAddressId.set(addr.id)"
                    class="mt-1"
                  />
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ addr.label }}
                      @if (addr.isDefault) {
                        <span class="text-xs text-indigo-600 ml-1">(Default)</span>
                      }
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ addr.recipientName }} · {{ addr.phoneNumber }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ addr.line1 }}{{ addr.line2 ? ', ' + addr.line2 : '' }},
                      {{ addr.subdistrict }}, {{ addr.district }},
                      {{ addr.province }} {{ addr.postalCode }}
                    </p>
                  </div>
                </label>
              }
            </div>
          }
        </div>

        <!-- Payment Method -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div class="space-y-3">
            <label
              class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
              [class]="paymentMethod() === 'COD'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                type="radio"
                name="payment"
                value="COD"
                [checked]="paymentMethod() === 'COD'"
                (change)="paymentMethod.set('COD')"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">Cash on Delivery</p>
                <p class="text-xs text-gray-500">Pay when you receive your order</p>
              </div>
            </label>
            <label
              class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer"
              [class]="paymentMethod() === 'PROMPTPAY_QR'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                type="radio"
                name="payment"
                value="PROMPTPAY_QR"
                [checked]="paymentMethod() === 'PROMPTPAY_QR'"
                (change)="paymentMethod.set('PROMPTPAY_QR')"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">PromptPay QR</p>
                <p class="text-xs text-gray-500">Transfer and upload payment slip</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Customer Note -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Order Note (Optional)</h2>
          <textarea
            [(ngModel)]="customerNote"
            maxlength="500"
            rows="3"
            placeholder="Add a note for your order..."
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        <!-- Error -->
        @if (checkoutError()) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p class="text-red-700 text-sm font-medium mb-2">{{ checkoutError() }}</p>
            @if (invalidItems().length > 0) {
              <ul class="list-disc list-inside text-sm text-red-600 space-y-1">
                @for (inv of invalidItems(); track inv.productId) {
                  <li>{{ inv.productName }}: {{ inv.reason }}</li>
                }
              </ul>
            }
          </div>
        }

        <!-- Place Order -->
        <button
          (click)="placeOrder()"
          [disabled]="submitting() || !canSubmit()"
          class="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          @if (submitting()) {
            Placing Order...
          } @else {
            Place Order
          }
        </button>
      }
    </div>
  `,
})
export class CheckoutPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly addressService = inject(AddressService);
  private readonly catalogService = inject(CatalogService);

  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly submitting = signal(false);
  readonly checkoutError = signal('');
  readonly invalidItems = signal<CheckoutInvalidItem[]>([]);

  readonly addresses = signal<Address[]>([]);
  readonly selectedAddressId = signal<number | null>(null);
  readonly paymentMethod = signal<'COD' | 'PROMPTPAY_QR'>('COD');
  readonly checkoutItems = signal<CheckoutItem[]>([]);
  readonly subtotal = signal(0);

  customerNote = '';

  private isBuyNow = false;
  private buyNowProductId = 0;
  private buyNowQuantity = 0;

  readonly canSubmit = computed(() => {
    return (
      this.selectedAddressId() !== null &&
      this.checkoutItems().length > 0 &&
      !this.submitting()
    );
  });

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    this.isBuyNow = params['mode'] === 'buy-now';

    if (this.isBuyNow) {
      const pid = Number(params['productId']);
      const qty = Number(params['quantity']);
      if (!pid || pid <= 0 || !qty || qty <= 0) {
        this.router.navigate(['/products']);
        return;
      }
      this.buyNowProductId = pid;
      this.buyNowQuantity = qty;
    }

    this.loadData();
  }

  placeOrder() {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.checkoutError.set('');
    this.invalidItems.set([]);

    const addressId = this.selectedAddressId();
    if (addressId === null) return;
    const note = this.customerNote.trim() || undefined;

    const obs = this.isBuyNow
      ? this.cartService.buyNow({
          productId: this.buyNowProductId,
          quantity: this.buyNowQuantity,
          addressId,
          paymentMethod: this.paymentMethod(),
          customerNote: note,
        })
      : this.cartService.checkoutFromCart({
          addressId,
          paymentMethod: this.paymentMethod(),
          customerNote: note,
        });

    obs.subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.router.navigate(['/checkout/confirmation'], {
          queryParams: { orderNumber: res.data.orderNumber },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const body = err.error as Record<string, unknown>;
        const msg = typeof body['message'] === 'string' ? body['message'] : 'Checkout failed. Please try again.';
        this.checkoutError.set(msg);

        if (Array.isArray(body['invalidItems'])) {
          this.invalidItems.set(body['invalidItems'] as CheckoutInvalidItem[]);
        }
      },
    });
  }

  private loadData() {
    this.loading.set(true);

    // Load addresses
    this.addressService.list().subscribe({
      next: (res) => {
        this.addresses.set(res.data);
        const defaultAddr = res.data.find((a) => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId.set(defaultAddr.id);
        } else if (res.data.length > 0) {
          this.selectedAddressId.set(res.data[0]!.id);
        }

        // Load items
        if (this.isBuyNow) {
          this.loadBuyNowProduct();
        } else {
          this.loadCartItems();
        }
      },
      error: () => {
        this.loadError.set('Failed to load addresses.');
        this.loading.set(false);
      },
    });
  }

  private loadCartItems() {
    this.cartService.loadCart().subscribe({
      next: (res) => {
        if (res.data.items.length === 0) {
          this.loadError.set('Your cart is empty.');
          this.loading.set(false);
          return;
        }

        const items: CheckoutItem[] = res.data.items.map((ci: CartItem) => ({
          name: ci.product.name,
          price: ci.product.price,
          quantity: ci.quantity,
          image: ci.product.image,
        }));

        this.checkoutItems.set(items);
        this.subtotal.set(
          items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        );
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Failed to load cart.');
        this.loading.set(false);
      },
    });
  }

  private loadBuyNowProduct() {
    this.catalogService.getProductById(this.buyNowProductId).subscribe({
      next: (res) => {
        const p = res.data;
        this.checkoutItems.set([
          {
            name: p.name,
            price: p.price,
            quantity: this.buyNowQuantity,
            image: p.images[0]?.imageUrl ?? null,
          },
        ]);
        this.subtotal.set(p.price * this.buyNowQuantity);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Product not found.');
        this.loading.set(false);
      },
    });
  }
}
