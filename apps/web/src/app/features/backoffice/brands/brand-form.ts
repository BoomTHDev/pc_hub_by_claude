import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeCatalogService, type AdminBrand } from '../../../core/services/backoffice-catalog.service';
import { AlertBanner } from '../../../shared/components/alert-banner/alert-banner';

@Component({
  selector: 'app-bo-brand-form',
  imports: [RouterLink, FormsModule, AlertBanner],
  templateUrl: './brand-form.html',
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
