import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeCatalogService, type AdminCategory } from '../../../core/services/backoffice-catalog.service';

@Component({
  selector: 'app-bo-category-form',
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <a routerLink="/backoffice/categories" class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to Categories
      </a>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ isEdit() ? 'Edit Category' : 'New Category' }}</h1>

      @if (loading()) {
        <p class="text-gray-500">Loading...</p>
      } @else {
        <div class="bg-white rounded-lg shadow p-6">
          <div class="space-y-4 max-w-lg">
            <div>
              <label for="cf-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                id="cf-name"
                type="text"
                [(ngModel)]="form.name"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label for="cf-slug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                id="cf-slug"
                type="text"
                [(ngModel)]="form.slug"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label for="cf-desc" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="cf-desc"
                [(ngModel)]="form.description"
                rows="3"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              ></textarea>
            </div>
            <div>
              <label for="cf-parent" class="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
              <select
                id="cf-parent"
                [(ngModel)]="form.parentId"
                class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option [ngValue]="null">None (top-level)</option>
                @for (cat of parentCategories(); track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
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
              routerLink="/backoffice/categories"
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
export class BoCategoryFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(BackofficeCatalogService);

  protected readonly isEdit = signal(false);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMsg = signal('');
  protected readonly parentCategories = signal<AdminCategory[]>([]);

  private editId = 0;

  protected form = {
    name: '',
    slug: '',
    description: '',
    parentId: null as number | null,
  };

  ngOnInit() {
    const catId = this.route.snapshot.paramMap.get('categoryId');
    if (catId) {
      this.isEdit.set(true);
      this.editId = Number(catId);
      this.loading.set(true);
      this.loadCategory(this.editId);
    }
    this.loadParentCategories();
  }

  onSave() {
    this.saving.set(true);
    this.errorMsg.set('');

    const body: Record<string, unknown> = {
      name: this.form.name,
      slug: this.form.slug,
      description: this.form.description || null,
      parentId: this.form.parentId,
    };

    const request = this.isEdit()
      ? this.catalogService.updateCategory(this.editId, body)
      : this.catalogService.createCategory(body);

    request.subscribe({
      next: () => {
        this.router.navigate(['/backoffice/categories']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to save category');
        this.saving.set(false);
      },
    });
  }

  private loadCategory(id: number) {
    this.catalogService.listCategories({ limit: 100 }).subscribe({
      next: (res) => {
        const cat = res.data.find((c) => c.id === id);
        if (cat) {
          this.form = {
            name: cat.name,
            slug: cat.slug,
            description: cat.description ?? '',
            parentId: cat.parentId,
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadParentCategories() {
    this.catalogService.listCategories({ limit: 100 }).subscribe({
      next: (res) => {
        const filtered = this.isEdit()
          ? res.data.filter((c) => c.id !== this.editId)
          : res.data;
        this.parentCategories.set(filtered);
      },
    });
  }
}
