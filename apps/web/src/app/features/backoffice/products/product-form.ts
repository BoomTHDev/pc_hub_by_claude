import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  BackofficeCatalogService,
  type AdminProductDetail,
  type AdminCategory,
  type AdminBrand,
} from '../../../core/services/backoffice-catalog.service';
import { extractErrorBody } from '../../../shared/utils/error.utils';
import { AlertBanner } from '../../../shared/components/alert-banner/alert-banner';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-bo-product-form',
  imports: [RouterLink, FormsModule, AlertBanner, ConfirmDialog],
  templateUrl: './product-form.html',
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
  protected readonly serverFieldErrors = signal<Record<string, string>>({});
  protected submitted = false;
  protected readonly product = signal<AdminProductDetail | null>(null);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly brands = signal<AdminBrand[]>([]);

  readonly deleteImageDialog = viewChild<ConfirmDialog>('deleteImageDialog');
  private pendingDeleteImageId: number | null = null;

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

  onSave(formRef: { valid?: boolean | null }) {
    this.submitted = true;
    if (!formRef.valid) return;

    this.saving.set(true);
    this.errorMsg.set('');
    this.serverFieldErrors.set({});

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

    const currentProduct = this.product();
    const request =
      this.isEdit() && currentProduct
        ? this.catalogService.updateProduct(currentProduct.id, body)
        : this.catalogService.createProduct(body);

    request.subscribe({
      next: () => {
        this.router.navigate(['/backoffice/products']);
      },
      error: (err) => {
        this.saving.set(false);
        const body = extractErrorBody(err.error);
        if (body.fieldErrors) {
          this.serverFieldErrors.set(body.fieldErrors);
          this.errorMsg.set('Please fix the errors below.');
        } else {
          this.errorMsg.set(body.message ?? 'Failed to save product');
        }
      },
    });
  }

  onFileSelected(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const file = target.files?.[0];
    const currentProduct = this.product();
    if (!file || !currentProduct) return;

    this.uploading.set(true);
    this.catalogService.uploadProductImage(currentProduct.id, file).subscribe({
      next: () => {
        this.uploading.set(false);
        this.loadProduct(currentProduct.id);
        target.value = '';
      },
      error: () => {
        this.uploading.set(false);
      },
    });
  }

  confirmDeleteImage(imageId: number) {
    this.pendingDeleteImageId = imageId;
    this.deleteImageDialog()?.show();
  }

  onDeleteImageConfirmed() {
    const currentProduct = this.product();
    const imageId = this.pendingDeleteImageId;
    if (!imageId || !currentProduct) return;
    this.catalogService.deleteProductImage(currentProduct.id, imageId).subscribe({
      next: () => {
        this.pendingDeleteImageId = null;
        this.loadProduct(currentProduct.id);
      },
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
