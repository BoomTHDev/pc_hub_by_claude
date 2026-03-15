import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../../shared/models/api-response.model';

export interface StatusCount {
  status: string;
  count: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  pendingReviewCount: number;
  ordersByStatus: StatusCount[];
  totalCustomers: number;
  totalProducts: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

@Injectable({ providedIn: 'root' })
export class BackofficeAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSummary() {
    return this.http.get<ApiResponse<AnalyticsSummary>>(
      `${this.apiUrl}/backoffice/analytics/summary`,
    );
  }

  getRevenueTrend(period: '7d' | '30d' | '90d' = '30d') {
    return this.http.get<ApiResponse<RevenueTrendPoint[]>>(
      `${this.apiUrl}/backoffice/analytics/revenue-trend`,
      { params: { period } },
    );
  }

  getTopProducts(limit = 10) {
    return this.http.get<ApiResponse<TopProduct[]>>(
      `${this.apiUrl}/backoffice/analytics/top-products`,
      { params: { limit: String(limit) } },
    );
  }
}
