import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AddressService } from '../../../core/services/address.service';
import { extractErrorBody } from '../../../shared/utils/error.utils';
import type { CreateAddressPayload } from '../../../shared/models/address.model';

@Component({
  selector: 'app-address-form',
  imports: [FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        {{ isEdit() ? 'Edit Address' : 'New Address' }}
      </h1>

      @if (errorMessage()) {
        <div class="rounded-md bg-red-50 p-4 mb-6">
          <p class="text-sm text-red-700">{{ errorMessage() }}</p>
        </div>
      }

      <form (ngSubmit)="onSubmit()" class="space-y-4 bg-white p-6 rounded-lg shadow-sm">
        <div>
          <label for="label" class="block text-sm font-medium text-gray-700">Label</label>
          <input
            id="label"
            type="text"
            [(ngModel)]="form.label"
            name="label"
            required
            placeholder="e.g. Home, Office"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="recipientName" class="block text-sm font-medium text-gray-700">
              Recipient Name
            </label>
            <input
              id="recipientName"
              type="text"
              [(ngModel)]="form.recipientName"
              name="recipientName"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="phoneNumber" class="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              [(ngModel)]="form.phoneNumber"
              name="phoneNumber"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label for="line1" class="block text-sm font-medium text-gray-700">
            Address Line 1
          </label>
          <input
            id="line1"
            type="text"
            [(ngModel)]="form.line1"
            name="line1"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="line2" class="block text-sm font-medium text-gray-700">
            Address Line 2 (optional)
          </label>
          <input
            id="line2"
            type="text"
            [(ngModel)]="form.line2"
            name="line2"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="subdistrict" class="block text-sm font-medium text-gray-700">
              Subdistrict
            </label>
            <input
              id="subdistrict"
              type="text"
              [(ngModel)]="form.subdistrict"
              name="subdistrict"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="district" class="block text-sm font-medium text-gray-700">
              District
            </label>
            <input
              id="district"
              type="text"
              [(ngModel)]="form.district"
              name="district"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="province" class="block text-sm font-medium text-gray-700">
              Province
            </label>
            <input
              id="province"
              type="text"
              [(ngModel)]="form.province"
              name="province"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="postalCode" class="block text-sm font-medium text-gray-700">
              Postal Code
            </label>
            <input
              id="postalCode"
              type="text"
              [(ngModel)]="form.postalCode"
              name="postalCode"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="isDefault"
            type="checkbox"
            [(ngModel)]="form.isDefault"
            name="isDefault"
            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label for="isDefault" class="ml-2 text-sm text-gray-700">
            Set as default address
          </label>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            [disabled]="saving()"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Saving...' : isEdit() ? 'Update' : 'Create' }}
          </button>
          <button
            type="button"
            (click)="onCancel()"
            class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
})
export class AddressForm implements OnInit {
  private readonly addressService = inject(AddressService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  form: CreateAddressPayload & { line2: string } = {
    label: '',
    recipientName: '',
    phoneNumber: '',
    line1: '',
    line2: '',
    district: '',
    subdistrict: '',
    province: '',
    postalCode: '',
    isDefault: false,
  };

  private addressId: number | null = null;

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('addressId');
    if (idParam) {
      this.addressId = Number(idParam);
      this.isEdit.set(true);
      this.loadAddress();
    }
  }

  onSubmit() {
    this.saving.set(true);
    this.errorMessage.set('');

    const payload: CreateAddressPayload = {
      ...this.form,
      line2: this.form.line2 || undefined,
    };

    const request$ = this.isEdit()
      ? this.addressService.update(this.addressId!, payload)
      : this.addressService.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/account/addresses']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const body = extractErrorBody(err.error);
        this.errorMessage.set(body.message ?? 'Something went wrong.');
      },
    });
  }

  onCancel() {
    void this.router.navigate(['/account/addresses']);
  }

  private loadAddress() {
    this.addressService.list().subscribe((res) => {
      const addr = res.data.find((a) => a.id === this.addressId);
      if (addr) {
        this.form = {
          label: addr.label,
          recipientName: addr.recipientName,
          phoneNumber: addr.phoneNumber,
          line1: addr.line1,
          line2: addr.line2 ?? '',
          district: addr.district,
          subdistrict: addr.subdistrict,
          province: addr.province,
          postalCode: addr.postalCode,
          isDefault: addr.isDefault,
        };
      }
    });
  }
}
