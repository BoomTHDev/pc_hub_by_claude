import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeCatalogService, type AdminBrand } from '../../../core/services/backoffice-catalog.service';
import { AuthService } from '../../../core/services/auth.service';
import type { PaginationMeta } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-bo-brand-list',
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Brands</h1>
        @if (isAdmin()) {
          <a
            routerLink="/backoffice/brands/new"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
          >
            Add Brand
          </a>
        }
      </div>

      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <input
          type="text"
          [(ngModel)]="search"
          (ngModelChange)="onFilterChange()"
          placeholder="Search brands..."
          class="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-1/3"
        />
      </div>

      @if (loading()) {
        <p class="text-gray-500">Loading brands...</p>
      } @else if (brands().length === 0) {
        <p class="text-gray-500">No brands found.</p>
      } @else {
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (brand of brands(); track brand.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    @if (brand.logoUrl) {
                      <img [src]="brand.logoUrl" alt="" class="w-10 h-10 object-contain rounded" />
                    } @else {
                      <div class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">N/A</div>
                    }
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-700 font-medium">{{ brand.name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ brand.slug }}</td>
                  <td class="px-4 py-3 text-sm text-right text-gray-600">{{ brand._count?.products ?? 0 }}</td>
                  <td class="px-4 py-3">
                    <button
                      (click)="onToggleActive(brand)"
                      class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full cursor-pointer"
                      [class]="brand.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ brand.isActive ? 'Active' : 'Inactive' }}
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      @if (isAdmin()) {
                        <a
                          [routerLink]="['/backoffice/brands', brand.id, 'edit']"
                          class="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </a>
                        <button
                          (click)="onDelete(brand)"
                          class="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          Delete
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

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
export class BoBrandListPage implements OnInit {
  private readonly catalogService = inject(BackofficeCatalogService);
  private readonly auth = inject(AuthService);

  protected readonly brands = signal<AdminBrand[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);

  protected search = '';
  private currentPage = 1;

  ngOnInit() {
    this.loadBrands();
  }

  protected isAdmin(): boolean {
    return this.auth.user()?.role === 'ADMIN';
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadBrands();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadBrands();
  }

  onToggleActive(brand: AdminBrand) {
    this.catalogService.toggleBrandActive(brand.id).subscribe({
      next: (res) => {
        const updated = this.brands().map((b) =>
          b.id === brand.id ? { ...b, isActive: res.data.isActive } : b,
        );
        this.brands.set(updated);
      },
    });
  }

  onDelete(brand: AdminBrand) {
    if (!confirm(`Delete "${brand.name}"?`)) return;
    this.catalogService.deleteBrand(brand.id).subscribe({
      next: () => this.loadBrands(),
    });
  }

  private loadBrands() {
    this.loading.set(true);
    this.catalogService
      .listBrands({
        page: this.currentPage,
        limit: 20,
        search: this.search || undefined,
      })
      .subscribe({
        next: (res) => {
          this.brands.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
