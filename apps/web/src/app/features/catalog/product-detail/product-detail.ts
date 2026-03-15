import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';
import type { ProductDetail as ProductDetailModel } from '../../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ThaiBahtPipe],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      @if (loading()) {
        <div class="animate-pulse">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="aspect-square bg-gray-200 rounded-lg"></div>
            <div class="space-y-4">
              <div class="h-4 bg-gray-200 rounded w-1/4"></div>
              <div class="h-8 bg-gray-200 rounded w-3/4"></div>
              <div class="h-6 bg-gray-200 rounded w-1/3"></div>
              <div class="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      } @else if (notFound()) {
        <div class="text-center py-16">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p class="text-gray-500 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <a
            routerLink="/products"
            class="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Browse Products
          </a>
        </div>
      } @else if (error()) {
        <div class="text-center py-16">
          <p class="text-red-600 mb-4">{{ error() }}</p>
          <button
            (click)="loadProduct()"
            class="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Retry
          </button>
        </div>
      } @else if (product(); as p) {
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <a routerLink="/products" class="hover:text-gray-900">Products</a>
          <span>/</span>
          <a [routerLink]="['/categories', p.category.slug]" class="hover:text-gray-900">
            {{ p.category.name }}
          </a>
          <span>/</span>
          <span class="text-gray-900">{{ p.name }}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Image Gallery -->
          <div>
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                [src]="selectedImage() ?? '/images/no-image.svg'"
                [alt]="p.name"
                class="w-full h-full object-cover"
              />
            </div>

            @if (p.images.length > 1) {
              <div class="grid grid-cols-4 gap-2">
                @for (img of p.images; track img.id) {
                  <button
                    (click)="selectImage(img.imageUrl)"
                    [class]="
                      selectedImage() === img.imageUrl
                        ? 'aspect-square rounded-md overflow-hidden ring-2 ring-indigo-600'
                        : 'aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-gray-400'
                    "
                  >
                    <img
                      [src]="img.imageUrl"
                      [alt]="img.altText ?? p.name"
                      class="w-full h-full object-cover"
                    />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Product Info -->
          <div>
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <a [routerLink]="['/brands', p.brand.slug]" class="hover:text-gray-900">
                {{ p.brand.name }}
              </a>
              <span class="text-gray-300">|</span>
              <span>SKU: {{ p.sku }}</span>
            </div>

            <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ p.name }}</h1>

            <p class="text-3xl font-bold text-indigo-600 mb-4">
              {{ p.price | thaiBaht }}
            </p>

            @if (p.stock > 0) {
              <p class="text-sm text-green-600 mb-2">In stock ({{ p.stock }} available)</p>
            } @else {
              <p class="text-sm text-red-600 mb-2">Out of stock</p>
            }

            @if (p.warrantyMonths) {
              <p class="text-sm text-gray-600 mb-4">
                Warranty: {{ p.warrantyMonths }} months
              </p>
            }

            <!-- Quantity selector -->
            <div class="flex items-center gap-3 mb-4">
              <span class="text-sm font-medium text-gray-700">Qty:</span>
              <div class="flex items-center gap-2">
                <button
                  (click)="decrementQty()"
                  [disabled]="quantity() <= 1"
                  class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <span class="w-8 text-center text-sm font-medium">{{ quantity() }}</span>
                <button
                  (click)="incrementQty(p.stock)"
                  [disabled]="quantity() >= p.stock"
                  class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            @if (cartMessage()) {
              <p class="text-sm text-green-600 mb-3">{{ cartMessage() }}</p>
            }
            @if (cartError()) {
              <p class="text-sm text-red-600 mb-3">{{ cartError() }}</p>
            }

            <!-- Action buttons -->
            <div class="flex gap-3 mb-6">
              <button
                (click)="addToCart(p.id)"
                [disabled]="p.stock === 0 || addingToCart()"
                class="flex-1 rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                @if (addingToCart()) {
                  Adding...
                } @else {
                  Add to Cart
                }
              </button>
              <button
                (click)="buyNow(p.id)"
                [disabled]="p.stock === 0"
                class="flex-1 rounded-md border border-indigo-600 px-4 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            <!-- Description -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p class="text-gray-600 leading-relaxed whitespace-pre-line">{{ p.description }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductDetailPage implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly product = signal<ProductDetailModel | null>(null);
  readonly selectedImage = signal<string | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal('');
  readonly quantity = signal(1);
  readonly addingToCart = signal(false);
  readonly cartMessage = signal('');
  readonly cartError = signal('');

  private slug = '';

  ngOnInit() {
    this.slug = this.route.snapshot.params['slug'] as string;
    this.loadProduct();
  }

  loadProduct() {
    this.loading.set(true);
    this.error.set('');
    this.notFound.set(false);

    this.catalog.getProductBySlug(this.slug).subscribe({
      next: (res) => {
        this.product.set(res.data);
        const firstImage = res.data.images[0]?.imageUrl ?? null;
        this.selectedImage.set(firstImage);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.notFound.set(true);
        } else {
          this.error.set('Failed to load product. Please try again.');
        }
        this.loading.set(false);
      },
    });
  }

  selectImage(url: string) {
    this.selectedImage.set(url);
  }

  incrementQty(maxStock: number) {
    if (this.quantity() < maxStock) {
      this.quantity.update((q) => q + 1);
    }
  }

  decrementQty() {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  addToCart(productId: number) {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.addingToCart.set(true);
    this.cartMessage.set('');
    this.cartError.set('');

    this.cartService.addItem(productId, this.quantity()).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.cartMessage.set('Added to cart!');
        setTimeout(() => this.cartMessage.set(''), 3000);
      },
      error: (err: HttpErrorResponse) => {
        this.addingToCart.set(false);
        const body = err.error as Record<string, unknown>;
        this.cartError.set(
          typeof body['message'] === 'string' ? body['message'] : 'Failed to add to cart.',
        );
      },
    });
  }

  buyNow(productId: number) {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.router.navigate(['/checkout'], {
      queryParams: {
        mode: 'buy-now',
        productId,
        quantity: this.quantity(),
      },
    });
  }
}
