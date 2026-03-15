import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeCatalogService, type AdminBrand } from '../../../core/services/backoffice-catalog.service';

@Component({
  selector: 'app-bo-brand-form',
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <a routerLink="/backoffice/brands" class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to Brands
      </a>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ isEdit() ? 'Edit Brand' : 'New Brand' }}</h1>

      @if (loading()) {
        <p class="text-gray-500">Loading...</p>
      } @else {
        <div class="bg-white rounded-lg shadow p-6">
          <div class="space-y-4 max-w-lg">
            <div>
              <label for="bf-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                id="bf-name"
                type="text"
                [(ngModel)]="form.name"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label for="bf-slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                id="bf-slug"
                type="text"
                [(ngModel)]="form.slug"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label for="bf-logo" class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                id="bf-logo"
                type="text"
                [(ngModel)]="form.logoUrl"
                placeholder="https://..."
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
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
              {{ saving() ? 'Saving...' : (isEdit() ? 'Update' : 'Create') }}
            </button>
            <a
              routerLink="/backoffice/brands"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Cancel
            </a>
          </div>
        </div>
      }
    </div>
  `,
})
export class BoBrandFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(BackofficeCatalogService);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMsg = signal('');

  private editId = 0;

  protected form = {
    name: '',
    slug: '',
    logoUrl: '',
  };

  ngOnInit() {
    const brandId = this.route.snapshot.paramMap.get('brandId');
    if (brandId) {
      this.isEdit.set(true);
      this.editId = Number(brandId);
      this.loading.set(true);
      this.loadBrand(this.editId);
    }
  }

  onSave() {
    this.saving.set(true);
    this.errorMsg.set('');

    const body: Record<string, unknown> = {
      name: this.form.name,
      slug: this.form.slug,
      logoUrl: this.form.logoUrl || null,
    };

    const request = this.isEdit()
      ? this.catalogService.updateBrand(this.editId, body)
      : this.catalogService.createBrand(body);

    request.subscribe({
      next: () => {
        this.router.navigate(['/backoffice/brands']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to save brand');
        this.saving.set(false);
      },
    });
  }

  private loadBrand(id: number) {
    this.catalogService.listBrands({ limit: 100 }).subscribe({
      next: (res) => {
        const brand = res.data.find((b: AdminBrand) => b.id === id);
        if (brand) {
          this.form = {
            name: brand.name,
            slug: brand.slug,
            logoUrl: brand.logoUrl ?? '',
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
