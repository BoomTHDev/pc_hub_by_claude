import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogService } from '../../../core/services/catalog.service';
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
              <p class="text-sm text-gray-600 mb-6">
                Warranty: {{ p.warrantyMonths }} months
              </p>
            }

            <!-- Add to cart placeholder -->
            <button
              disabled
              class="w-full rounded-md bg-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed mb-6"
            >
              Add to Cart (Coming Soon)
            </button>

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
  private readonly route = inject(ActivatedRoute);

  readonly product = signal<ProductDetailModel | null>(null);
  readonly selectedImage = signal<string | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal('');

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
}
