import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductCard } from '../../../shared/components/product-card/product-card';
import { Pagination } from '../../../shared/components/pagination/pagination';
import type { ProductSummary, ProductFilters } from '../../../shared/models/product.model';
import type { CategorySummary } from '../../../shared/models/category.model';
import type { BrandSummary } from '../../../shared/models/brand.model';
import type { PaginationMeta } from '../../../shared/models/pagination.model';

function buildQueryParams(filters: ProductFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.search) params['search'] = filters.search;
  if (filters.categoryId) params['categoryId'] = String(filters.categoryId);
  if (filters.brandId) params['brandId'] = String(filters.brandId);
  if (filters.minPrice) params['minPrice'] = filters.minPrice;
  if (filters.maxPrice) params['maxPrice'] = filters.maxPrice;
  if (filters.sort && filters.sort !== 'newest') params['sort'] = filters.sort;
  if (filters.page > 1) params['page'] = String(filters.page);
  return params;
}

function parseFilters(
  queryParams: Record<string, string | undefined>,
  presetCategoryId: number | null,
  presetBrandId: number | null,
): ProductFilters {
  return {
    search: queryParams['search'] ?? '',
    categoryId: presetCategoryId ?? (queryParams['categoryId'] ? Number(queryParams['categoryId']) : null),
    brandId: presetBrandId ?? (queryParams['brandId'] ? Number(queryParams['brandId']) : null),
    minPrice: queryParams['minPrice'] ?? '',
    maxPrice: queryParams['maxPrice'] ?? '',
    sort: queryParams['sort'] ?? 'newest',
    page: queryParams['page'] ? Number(queryParams['page']) : 1,
  };
}

@Component({
  selector: 'app-product-list',
  imports: [FormsModule, ProductCard, Pagination],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ pageTitle() }}</h1>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <input
              type="text"
              placeholder="Search products..."
              [ngModel]="searchInput()"
              (ngModelChange)="onSearchInput($event)"
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <!-- Category -->
          @if (!presetCategoryId()) {
            <select
              [ngModel]="filters().categoryId ?? ''"
              (ngModelChange)="onCategoryChange($event)"
              class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          }

          <!-- Brand -->
          @if (!presetBrandId()) {
            <select
              [ngModel]="filters().brandId ?? ''"
              (ngModelChange)="onBrandChange($event)"
              class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Brands</option>
              @for (brand of brands(); track brand.id) {
                <option [value]="brand.id">{{ brand.name }}</option>
              }
            </select>
          }

          <!-- Price Range -->
          <input
            type="number"
            placeholder="Min Price"
            [ngModel]="filters().minPrice"
            (ngModelChange)="onFilterChange('minPrice', $event)"
            min="0"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="number"
            placeholder="Max Price"
            [ngModel]="filters().maxPrice"
            (ngModelChange)="onFilterChange('maxPrice', $event)"
            min="0"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="flex items-center justify-between mt-4">
          <!-- Sort -->
          <select
            [ngModel]="filters().sort"
            (ngModelChange)="onFilterChange('sort', $event)"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="name_desc">Name: Z-A</option>
          </select>

          <button
            (click)="onClearFilters()"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Clear filters
          </button>
        </div>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (_ of skeletons; track $index) {
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div class="aspect-square bg-gray-200"></div>
              <div class="p-4 space-y-2">
                <div class="h-3 bg-gray-200 rounded w-1/3"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3"></div>
                <div class="h-5 bg-gray-200 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
          <p class="text-red-600 mb-4">{{ error() }}</p>
          <button
            (click)="loadProducts()"
            class="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Retry
          </button>
        </div>
      } @else if (notFound()) {
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
          <p class="text-gray-500 text-lg mb-4">{{ notFound() }}</p>
          <a href="/products" class="text-indigo-600 hover:text-indigo-500 font-medium">
            Browse all products
          </a>
        </div>
      } @else if (products().length === 0) {
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
          <p class="text-gray-500 text-lg mb-4">No products found</p>
          <button
            (click)="onClearFilters()"
            class="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Clear filters
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (product of products(); track product.id) {
            <app-product-card [product]="product" />
          }
        </div>

        <app-pagination
          [page]="pagination().page"
          [totalPages]="pagination().totalPages"
          (pageChange)="onPageChange($event)"
        />
      }
    </div>
  `,
})
export class ProductList implements OnInit, OnDestroy {
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  readonly products = signal<ProductSummary[]>([]);
  readonly categories = signal<CategorySummary[]>([]);
  readonly brands = signal<BrandSummary[]>([]);
  readonly filters = signal<ProductFilters>({
    search: '',
    categoryId: null,
    brandId: null,
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    page: 1,
  });
  readonly pagination = signal<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notFound = signal('');
  readonly searchInput = signal('');
  readonly pageTitle = signal('Products');

  readonly presetCategoryId = signal<number | null>(null);
  readonly presetBrandId = signal<number | null>(null);

  readonly skeletons = Array.from({ length: 8 });

  ngOnInit() {
    // Debounce search input
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.onFilterChange('search', value);
      });

    // Load categories and brands for dropdowns, then resolve route
    this.catalog.listCategories().subscribe((res) => {
      this.categories.set(res.data);
      this.catalog.listBrands().subscribe((brandRes) => {
        this.brands.set(brandRes.data);
        this.initFromRoute();
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFromRoute() {
    // Check if this is a category or brand slug route
    const routeParams = this.route.snapshot.params;
    const slug = routeParams['slug'] as string | undefined;
    const routePath = this.route.snapshot.url.map((s) => s.path).join('/');

    if (slug && routePath.startsWith('categories')) {
      const category = this.categories().find((c) => c.slug === slug);
      if (!category) {
        this.notFound.set(`Category "${slug}" not found`);
        this.loading.set(false);
        return;
      }
      this.presetCategoryId.set(category.id);
      this.pageTitle.set(category.name);
    } else if (slug && routePath.startsWith('brands')) {
      const brand = this.brands().find((b) => b.slug === slug);
      if (!brand) {
        this.notFound.set(`Brand "${slug}" not found`);
        this.loading.set(false);
        return;
      }
      this.presetBrandId.set(brand.id);
      this.pageTitle.set(brand.name);
    }

    // Subscribe to query param changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const params = qp as Record<string, string | undefined>;
      const filters = parseFilters(params, this.presetCategoryId(), this.presetBrandId());
      this.filters.set(filters);
      this.searchInput.set(filters.search);
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.error.set('');

    const f = this.filters();
    const apiParams: Record<string, string> = {};
    if (f.search) apiParams['search'] = f.search;
    if (f.categoryId) apiParams['categoryId'] = String(f.categoryId);
    if (f.brandId) apiParams['brandId'] = String(f.brandId);
    if (f.minPrice) apiParams['minPrice'] = f.minPrice;
    if (f.maxPrice) apiParams['maxPrice'] = f.maxPrice;
    if (f.sort) apiParams['sort'] = f.sort;
    if (f.page > 1) apiParams['page'] = String(f.page);

    this.catalog.listProducts(apiParams).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load products. Please try again.');
        this.loading.set(false);
      },
    });
  }

  onSearchInput(value: string) {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  onCategoryChange(value: string) {
    const id = value ? Number(value) : null;
    this.updateFilters({ categoryId: id });
  }

  onBrandChange(value: string) {
    const id = value ? Number(value) : null;
    this.updateFilters({ brandId: id });
  }

  onFilterChange(key: keyof ProductFilters, value: string) {
    this.updateFilters({ [key]: value });
  }

  onPageChange(page: number) {
    const f = this.filters();
    const params = buildQueryParams({ ...f, page });
    void this.router.navigate([], { queryParams: params });
  }

  onClearFilters() {
    this.searchInput.set('');
    const params: Record<string, string> = {};
    if (this.presetCategoryId()) {
      // keep preset — don't add to URL since it comes from route
    }
    if (this.presetBrandId()) {
      // keep preset — don't add to URL since it comes from route
    }
    void this.router.navigate([], { queryParams: params });
  }

  private updateFilters(partial: Partial<ProductFilters>) {
    const current = this.filters();
    const updated = { ...current, ...partial, page: 1 };
    const params = buildQueryParams(updated);
    void this.router.navigate([], { queryParams: params });
  }
}
