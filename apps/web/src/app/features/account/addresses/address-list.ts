import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AddressService } from '../../../core/services/address.service';
import type { Address } from '../../../shared/models/address.model';

@Component({
  selector: 'app-address-list',
  imports: [RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">My Addresses</h1>
        <a
          routerLink="/account/addresses/new"
          class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Add Address
        </a>
      </div>

      @if (loading()) {
        <p class="text-gray-500">Loading...</p>
      } @else if (addresses().length === 0) {
        <div class="text-center py-12 bg-white rounded-lg shadow-sm">
          <p class="text-gray-500">No addresses yet.</p>
          <a
            routerLink="/account/addresses/new"
            class="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Add your first address
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (addr of addresses(); track addr.id) {
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-900">{{ addr.label }}</span>
                    @if (addr.isDefault) {
                      <span
                        class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                      >
                        Default
                      </span>
                    }
                  </div>
                  <p class="mt-1 text-sm text-gray-700">{{ addr.recipientName }}</p>
                  <p class="text-sm text-gray-600">{{ addr.phoneNumber }}</p>
                  <p class="mt-1 text-sm text-gray-600">
                    {{ addr.line1 }}{{ addr.line2 ? ', ' + addr.line2 : '' }}
                  </p>
                  <p class="text-sm text-gray-600">
                    {{ addr.subdistrict }}, {{ addr.district }}, {{ addr.province }}
                    {{ addr.postalCode }}
                  </p>
                </div>

                <div class="flex gap-2">
                  @if (!addr.isDefault) {
                    <button
                      (click)="onSetDefault(addr.id)"
                      class="text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer"
                    >
                      Set Default
                    </button>
                  }
                  <a
                    [routerLink]="['/account/addresses', addr.id, 'edit']"
                    class="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </a>
                  <button
                    (click)="onDelete(addr.id)"
                    class="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AddressList implements OnInit {
  private readonly addressService = inject(AddressService);

  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(true);

  ngOnInit() {
    this.loadAddresses();
  }

  onSetDefault(addressId: number) {
    this.addressService.setDefault(addressId).subscribe(() => {
      this.loadAddresses();
    });
  }

  onDelete(addressId: number) {
    this.addressService.delete(addressId).subscribe(() => {
      this.loadAddresses();
    });
  }

  private loadAddresses() {
    this.loading.set(true);
    this.addressService.list().subscribe((res) => {
      this.addresses.set(res.data);
      this.loading.set(false);
    });
  }
}
