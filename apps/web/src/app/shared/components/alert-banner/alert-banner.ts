import { Component, computed, input, output, signal } from '@angular/core';

type AlertType = 'error' | 'warning' | 'success' | 'info';

const TYPE_STYLES: Record<AlertType, { container: string; icon: string }> = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-500',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'text-amber-500',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-500',
  },
};

@Component({
  selector: 'app-alert-banner',
  templateUrl: './alert-banner.html',
})
export class AlertBanner {
  readonly type = input<AlertType>('error');
  readonly message = input.required<string>();
  readonly dismissible = input(false);
  readonly dismissed = output<void>();

  readonly visible = signal(true);

  readonly styles = computed(() => TYPE_STYLES[this.type()]);

  dismiss() {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
