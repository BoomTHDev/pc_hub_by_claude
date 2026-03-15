import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  BackofficeReportService,
  type DailySalesResult,
} from '../../../core/services/backoffice-report.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';

@Component({
  selector: 'app-bo-daily-sales',
  imports: [FormsModule, DatePipe, ThaiBahtPipe],
  template: `
    <div>
      <h1 class="text-2xl font-bold text-gray-900 mb-6">Daily Sales Report</h1>

      <!-- Date picker + export -->
      <div class="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label for="ds-date" class="block text-xs text-gray-500 mb-1">Date</label>
          <input
            id="ds-date"
            type="date"
            [(ngModel)]="selectedDate"
            (ngModelChange)="onDateChange()"
            class="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div class="flex gap-2 ml-auto">
          <button
            (click)="onExportExcel()"
            [disabled]="exporting()"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 text-sm cursor-pointer disabled:opacity-50"
          >
            Export Excel
          </button>
          <button
            (click)="onExportPdf()"
            [disabled]="exporting()"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500 text-sm cursor-pointer disabled:opacity-50"
          >
            Export PDF
          </button>
        </div>
      </div>

      @if (loading()) {
        <p class="text-gray-500">Loading...</p>
      } @else if (sales()) {
        <!-- Summary cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-500">Total Orders</p>
            <p class="text-2xl font-bold text-gray-900">{{ sales()!.totalOrders }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-500">Completed Revenue</p>
            <p class="text-2xl font-bold text-green-700">{{ sales()!.completedRevenue | thaiBaht }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm text-gray-500">Pending Revenue</p>
            <p class="text-2xl font-bold text-yellow-700">{{ sales()!.pendingRevenue | thaiBaht }}</p>
          </div>
        </div>

        <!-- Breakdowns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">By Status</h3>
            @for (s of sales()!.ordersByStatus; track s.status) {
              <div class="flex justify-between text-sm py-1">
                <span class="text-gray-600">{{ s.status }}</span>
                <span class="font-medium text-gray-900">{{ s.count }}</span>
              </div>
            }
            @if (sales()!.ordersByStatus.length === 0) {
              <p class="text-sm text-gray-400">No orders</p>
            }
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">By Payment Method</h3>
            @for (m of sales()!.ordersByPaymentMethod; track m.paymentMethod) {
              <div class="flex justify-between text-sm py-1">
                <span class="text-gray-600">{{ m.paymentMethod }}</span>
                <span class="font-medium text-gray-900">{{ m.count }}</span>
              </div>
            }
            @if (sales()!.ordersByPaymentMethod.length === 0) {
              <p class="text-sm text-gray-400">No orders</p>
            }
          </div>
        </div>

        <!-- Items table -->
        @if (sales()!.items.length > 0) {
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (item of sales()!.items; track item.orderId) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-indigo-600">{{ item.orderNumber }}</td>
                    <td class="px-4 py-3 text-sm text-gray-700">{{ item.customerName }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ item.paymentMethod }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ item.status }}</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-700">{{ item.totalAmount | thaiBaht }}</td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ item.createdAt | date:'shortTime' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-gray-500">No orders for this date.</p>
        }
      }
    </div>
  `,
})
export class BoDailySalesPage implements OnInit {
  private readonly reportService = inject(BackofficeReportService);

  protected readonly sales = signal<DailySalesResult | null>(null);
  protected readonly loading = signal(true);
  protected readonly exporting = signal(false);
  protected selectedDate = '';

  ngOnInit() {
    this.loadSales();
  }

  onDateChange() {
    this.loadSales();
  }

  onExportExcel() {
    this.exporting.set(true);
    this.reportService.downloadExcel(this.selectedDate || undefined).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `daily-sales-${this.selectedDate || 'today'}.xlsx`);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  onExportPdf() {
    this.exporting.set(true);
    this.reportService.downloadPdf(this.selectedDate || undefined).subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `daily-sales-${this.selectedDate || 'today'}.pdf`);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  private loadSales() {
    this.loading.set(true);
    this.reportService.getDailySales(this.selectedDate || undefined).subscribe({
      next: (res) => {
        this.sales.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
