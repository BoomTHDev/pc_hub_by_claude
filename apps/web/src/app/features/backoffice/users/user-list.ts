import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BackofficeUserService, type AdminUser } from '../../../core/services/backoffice-user.service';
import { AuthService } from '../../../core/services/auth.service';
import type { PaginationMeta } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-bo-user-list',
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
        <div class="flex gap-2">
          <a
            routerLink="/backoffice/users/new/staff"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm"
          >
            Create Staff
          </a>
          <a
            routerLink="/backoffice/users/new/admin"
            class="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
          >
            Create Admin
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            [(ngModel)]="search"
            (ngModelChange)="onFilterChange()"
            placeholder="Search by name or email..."
            class="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <select
            [(ngModel)]="roleFilter"
            (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="STAFF">Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <p class="text-gray-500">Loading users...</p>
      } @else if (users().length === 0) {
        <p class="text-gray-500">No users found.</p>
      } @else {
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-700 font-medium">
                    {{ user.firstName }} {{ user.lastName }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ user.email }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ user.phoneNumber }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'"
                    >
                      {{ user.role }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ user.isActive ? 'Active' : 'Disabled' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-500">{{ user.createdAt | date:'short' }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <button
                        (click)="onStartEdit(user)"
                        class="text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        Edit
                      </button>
                      @if (user.isActive && user.id !== currentUserId()) {
                        <button
                          (click)="onDisable(user)"
                          class="text-sm text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          Disable
                        </button>
                      }
                    </div>
                  </td>
                </tr>

                <!-- Inline edit row -->
                @if (editingUserId() === user.id) {
                  <tr class="bg-gray-50">
                    <td colspan="7" class="px-4 py-3">
                      <div class="flex flex-wrap items-end gap-3">
                        <div>
                          <label for="edit-fn" class="block text-xs text-gray-500 mb-1">First Name</label>
                          <input
                            id="edit-fn"
                            type="text"
                            [(ngModel)]="editForm.firstName"
                            class="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                          />
                        </div>
                        <div>
                          <label for="edit-ln" class="block text-xs text-gray-500 mb-1">Last Name</label>
                          <input
                            id="edit-ln"
                            type="text"
                            [(ngModel)]="editForm.lastName"
                            class="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                          />
                        </div>
                        <div>
                          <label for="edit-ph" class="block text-xs text-gray-500 mb-1">Phone</label>
                          <input
                            id="edit-ph"
                            type="text"
                            [(ngModel)]="editForm.phoneNumber"
                            class="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                          />
                        </div>
                        <button
                          (click)="onSaveEdit()"
                          [disabled]="editSaving()"
                          class="px-3 py-1 bg-indigo-600 text-white rounded text-sm cursor-pointer disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          (click)="editingUserId.set(null)"
                          class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                        @if (editError()) {
                          <span class="text-sm text-red-600">{{ editError() }}</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination()) {
          <div class="flex items-center justify-between mt-4">
            <p class="text-sm text-gray-600">
              Page {{ pagination()!.page }} of {{ pagination()!.totalPages }}
              ({{ pagination()!.total }} total)
            </p>
            <div class="flex gap-2">
              <button
                (click)="goToPage(pagination()!.page - 1)"
                [disabled]="pagination()!.page <= 1"
                class="px-3 py-1 text-sm border rounded disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                Previous
              </button>
              <button
                (click)="goToPage(pagination()!.page + 1)"
                [disabled]="pagination()!.page >= pagination()!.totalPages"
                class="px-3 py-1 text-sm border rounded disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                Next
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class BoUserListPage implements OnInit {
  private readonly userService = inject(BackofficeUserService);
  private readonly auth = inject(AuthService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly pagination = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly editingUserId = signal<number | null>(null);
  protected readonly editSaving = signal(false);
  protected readonly editError = signal('');
  protected readonly currentUserId = signal<number | null>(null);

  protected search = '';
  protected roleFilter = '';
  private currentPage = 1;

  protected editForm = { firstName: '', lastName: '', phoneNumber: '' };

  ngOnInit() {
    this.currentUserId.set(this.auth.user()?.id ?? null);
    this.loadUsers();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadUsers();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadUsers();
  }

  onStartEdit(user: AdminUser) {
    this.editingUserId.set(user.id);
    this.editError.set('');
    this.editForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
    };
  }

  onSaveEdit() {
    const userId = this.editingUserId();
    if (!userId) return;
    this.editSaving.set(true);
    this.editError.set('');

    this.userService.updateUser(userId, {
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      phoneNumber: this.editForm.phoneNumber,
    }).subscribe({
      next: (res) => {
        const updated = this.users().map((u) =>
          u.id === userId ? { ...u, ...res.data } : u,
        );
        this.users.set(updated);
        this.editingUserId.set(null);
        this.editSaving.set(false);
      },
      error: (err) => {
        this.editError.set(err.error?.message ?? 'Failed to update user');
        this.editSaving.set(false);
      },
    });
  }

  onDisable(user: AdminUser) {
    if (!confirm(`Disable "${user.firstName} ${user.lastName}"?`)) return;
    this.userService.disableUser(user.id).subscribe({
      next: (res) => {
        const updated = this.users().map((u) =>
          u.id === user.id ? { ...u, isActive: res.data.isActive } : u,
        );
        this.users.set(updated);
      },
    });
  }

  private loadUsers() {
    this.loading.set(true);
    this.userService
      .listUsers({
        page: this.currentPage,
        limit: 20,
        search: this.search || undefined,
        role: (this.roleFilter as 'STAFF' | 'ADMIN') || undefined,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.pagination.set(res.pagination);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
