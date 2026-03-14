import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    @if (totalPages() > 1) {
      <nav class="flex items-center justify-center gap-1 mt-8">
        <button
          (click)="onPage(page() - 1)"
          [disabled]="page() <= 1"
          class="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        @for (p of pages(); track p) {
          @if (p === -1) {
            <span class="px-2 py-2 text-sm text-gray-400">...</span>
          } @else {
            <button
              (click)="onPage(p)"
              [class]="
                p === page()
                  ? 'px-3 py-2 text-sm rounded-md bg-indigo-600 text-white font-medium'
                  : 'px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50'
              "
            >
              {{ p }}
            </button>
          }
        }

        <button
          (click)="onPage(page() + 1)"
          [disabled]="page() >= totalPages()"
          class="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const result: number[] = [1];

    if (current > 3) {
      result.push(-1); // ellipsis
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (current < total - 2) {
      result.push(-1); // ellipsis
    }

    result.push(total);
    return result;
  });

  onPage(p: number) {
    if (p >= 1 && p <= this.totalPages() && p !== this.page()) {
      this.pageChange.emit(p);
    }
  }
}
