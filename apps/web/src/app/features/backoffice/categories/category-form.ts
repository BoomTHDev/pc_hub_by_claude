import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeCatalogService, type AdminCategory } from '../../../core/services/backoffice-catalog.service';
import { AlertBanner } from '../../../shared/components/alert-banner/alert-banner';

@Component({
  selector: 'app-bo-category-form',
  imports: [RouterLink, FormsModule, AlertBanner],
  templateUrl: './category-form.html',
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
