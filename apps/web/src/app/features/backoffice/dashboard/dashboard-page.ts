import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BackofficeReportService, type DailySalesResult } from '../../../core/services/backoffice-report.service';
import { BackofficeAnalyticsService, type AnalyticsSummary } from '../../../core/services/backoffice-analytics.service';
import { ThaiBahtPipe } from '../../../shared/pipes/thai-baht.pipe';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { AlertBanner } from '../../../shared/components/alert-banner/alert-banner';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, ThaiBahtPipe, PageHeader, AlertBanner],
  templateUrl: './dashboard-page.html',
})
export class DashboardPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly reportService = inject(BackofficeReportService);
  private readonly analyticsService = inject(BackofficeAnalyticsService);

  protected readonly dailySales = signal<DailySalesResult | null>(null);
  protected readonly analyticsSummary = signal<AnalyticsSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit() {
    this.loadData();
  }

  protected retry() {
    this.error.set('');
    this.loadData();
  }

  private loadData() {
    const role = this.auth.user()?.role;
    this.loading.set(true);

    if (role === 'STAFF') {
      this.reportService.getDailySales().subscribe({
        next: (res) => {
          this.dailySales.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load daily sales data.');
          this.loading.set(false);
        },
      });
    } else if (role === 'ADMIN') {
      this.analyticsService.getSummary().subscribe({
        next: (res) => {
          this.analyticsSummary.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load analytics data.');
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  protected isStaff(): boolean {
    return this.auth.user()?.role === 'STAFF';
  }

  protected isAdmin(): boolean {
    return this.auth.user()?.role === 'ADMIN';
  }
}
