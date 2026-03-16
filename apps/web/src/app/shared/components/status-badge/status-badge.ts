import { Component, computed, input } from '@angular/core';

const STATUS_STYLES: Record<string, string> = {
  // Order statuses
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  AWAITING_PAYMENT: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  PAYMENT_REVIEW: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  APPROVED: 'bg-green-50 text-green-700 ring-green-600/20',
  PROCESSING: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  SHIPPED: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  DELIVERED: 'bg-green-50 text-green-700 ring-green-600/20',
  REJECTED: 'bg-red-50 text-red-700 ring-red-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/10',

  // Generic / toggleable statuses
  ACTIVE: 'bg-green-50 text-green-700 ring-green-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/10',

  // Payment methods
  COD: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  PROMPTPAY_QR: 'bg-blue-50 text-blue-700 ring-blue-600/20',

  // Roles
  ADMIN: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  STAFF: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  CUSTOMER: 'bg-slate-100 text-slate-600 ring-slate-500/10',
};

const FALLBACK_STYLE = 'bg-slate-100 text-slate-600 ring-slate-500/10';

function formatLabel(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = input<string>();

  readonly displayLabel = computed(() => this.label() ?? formatLabel(this.status()));
  readonly badgeClasses = computed(() => STATUS_STYLES[this.status()] ?? FALLBACK_STYLE);
}
