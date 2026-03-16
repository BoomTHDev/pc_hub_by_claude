import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BackofficeOrderService, type BackofficeOrderSummary } from '../../../core/services/backoffice-order.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import type { PaginationMeta } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-bo-order-list',
  imports: [RouterLink, FormsModule, DatePipe, ThaiBahtPipe, StatusBadge, PageHeader, Pagination, EmptyState],
  templateUrl: './order-list.html',
})
export class BoOrderListPage implements OnInit {
  private readonly orderService = inject(BackofficeOrderService);

  protected readonly orders = signal<BackofficeOrderSummary[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);

  protected search = '';
  protected statusFilter = '';
  protected paymentFilter = '';
  protected dateFrom = '';
  private currentPage = 1;

  ngOnInit() {
    this.loadOrders();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadOrders();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadOrders();
  }

  private loadOrders() {
    this.loading.set(true);
    this.orderService
      .listOrders({
        page: this.currentPage,
        limit: 20,
        status: this.statusFilter || undefined,
        paymentMethod: this.paymentFilter || undefined,
        search: this.search || undefined,
        dateFrom: this.dateFrom || undefined,
      })
      .subscribe({
        next: (res) => {
          this.orders.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

}
