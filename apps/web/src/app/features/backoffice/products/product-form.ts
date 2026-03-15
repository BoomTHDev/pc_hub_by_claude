import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  BackofficeCatalogService,
  type AdminProductDetail,
  type AdminCategory,
  type AdminBrand,
} from '../../../core/services/backoffice-catalog.service';

@Component({
  selector: 'app-bo-product-form',
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <a routerLink="/backoffice/products" class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to Products
      </a>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ isEdit() ? 'Edit Product' : 'New Product' }}</h1>

      @if (loading()) {
        <p class="text-gray-500">Loading...</p>
      } @else {
        <div class="space-y-6">
          <!-- Form -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="pf-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="pf-name"
                  type="text"
                  [(ngModel)]="form.name"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label for="pf-sku" class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  id="pf-sku"
                  type="text"
                  [(ngModel)]="form.sku"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label for="pf-price" class="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  id="pf-price"
                  type="number"
                  [(ngModel)]="form.price"
                  min="0"
                  step="0.01"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label for="pf-stock" class="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  id="pf-stock"
                  type="number"
                  [(ngModel)]="form.stock"
                  min="0"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label for="pf-category" class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="pf-category"
                  [(ngModel)]="form.categoryId"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option [ngValue]="0">Select category</option>
                  @for (cat of categories(); track cat.id) {
                    <option [ngValue]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="pf-brand" class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  id="pf-brand"
                  [(ngModel)]="form.brandId"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option [ngValue]="0">Select brand</option>
                  @for (brand of brands(); track brand.id) {
                    <option [ngValue]="brand.id">{{ brand.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="pf-warranty" class="block text-sm font-medium text-gray-700 mb-1">Warranty (months)</label>
                <input
                  id="pf-warranty"
                  type="number"
                  [(ngModel)]="form.warrantyMonths"
                  min="0"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div class="md:col-span-2">
                <label for="pf-desc" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="pf-desc"
                  [(ngModel)]="form.description"
                  rows="4"
                  class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                ></textarea>
              </div>
            </div>

            @if (errorMsg()) {
              <p class="text-sm text-red-600 mt-3">{{ errorMsg() }}</p>
            }

            <div class="flex gap-3 mt-6">
              <button
                (click)="onSave()"
                [disabled]="saving()"
                class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm cursor-pointer disabled:opacity-50"
              >
                {{ saving() ? 'Saving...' : (isEdit() ? 'Update Product' : 'Create Product') }}
              </button>
              <a
                routerLink="/backoffice/products"
                class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              >
                Cancel
              </a>
            </div>
          </div>

          <!-- Images (edit mode only) -->
          @if (isEdit() && product()) {
            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-lg font-semibold text-gray-800 mb-4">Images</h2>

              <div class="flex flex-wrap gap-4 mb-4">
                @for (img of product()!.images; track img.id) {
                  <div class="relative border rounded p-2">
                    <img [src]="img.imageUrl" [alt]="img.altText || ''" class="w-32 h-32 object-cover rounded" />
                    <button
                      (click)="onDeleteImage(img.id)"
                      class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs cursor-pointer hover:bg-red-500"
                    >
                      X
                    </button>
                  </div>
                }
              </div>

              <div>
                <label for="pf-image" class="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                <input
                  id="pf-image"
                  type="file"
                  accept="image/*"
                  (change)="onFileSelected($event)"
                  class="text-sm"
                />
                @if (uploading()) {
                  <p class="text-sm text-gray-500 mt-1">Uploading...</p>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BoProductFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(BackofficeCatalogService);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly errorMsg = signal('');
  protected readonly product = signal<AdminProductDetail | null>(null);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly brands = signal<AdminBrand[]>([]);

  protected form = {
    name: '',
    sku: '',
    description: '',
    price: 0,
    stock: 0,
    categoryId: 0,
    brandId: 0,
    warrantyMonths: 0,
  };

  ngOnInit() {
    const productId = this.route.snapshot.paramMap.get('productId');
    if (productId) {
      this.isEdit.set(true);
      this.loadProduct(Number(productId));
    } else {
      this.loading.set(false);
    }
    this.loadDropdowns();
  }

  onSave() {
    this.saving.set(true);
    this.errorMsg.set('');

    const body: Record<string, unknown> = {
      name: this.form.name,
      sku: this.form.sku,
      description: this.form.description,
      price: this.form.price,
      stock: this.form.stock,
      categoryId: this.form.categoryId,
      brandId: this.form.brandId,
      warrantyMonths: this.form.warrantyMonths || null,
    };

    const request = this.isEdit()
      ? this.catalogService.updateProduct(this.product()!.id, body)
      : this.catalogService.createProduct(body);

    request.subscribe({
      next: () => {
        this.router.navigate(['/backoffice/products']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to save product');
        this.saving.set(false);
      },
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.product()) return;

    this.uploading.set(true);
    this.catalogService.uploadProductImage(this.product()!.id, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadProduct(this.product()!.id);
        input.value = '';
      },
      error: () => {
        this.uploading.set(false);
      },
    });
  }

  onDeleteImage(imageId: number) {
    if (!confirm('Delete this image?')) return;
    this.catalogService.deleteProductImage(this.product()!.id, imageId).subscribe({
      next: () => this.loadProduct(this.product()!.id),
    });
  }

  private loadProduct(id: number) {
    this.catalogService.getProduct(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.form = {
          name: res.data.name,
          sku: res.data.sku,
          description: res.data.description,
          price: res.data.price,
          stock: res.data.stock,
          categoryId: res.data.category.id,
          brandId: res.data.brand.id,
          warrantyMonths: res.data.warrantyMonths ?? 0,
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadDropdowns() {
    this.catalogService.listCategories({ limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.data),
    });
    this.catalogService.listBrands({ limit: 100 }).subscribe({
      next: (res) => this.brands.set(res.data),
    });
  }
}
