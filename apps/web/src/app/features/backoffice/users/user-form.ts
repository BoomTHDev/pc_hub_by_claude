import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeUserService } from '../../../core/services/backoffice-user.service';

@Component({
  selector: 'app-bo-user-form',
  imports: [RouterLink, FormsModule],
  template: `
    @if (!validRole()) {
      <p class="text-gray-500">Redirecting...</p>
    } @else {
    <div>
      <a routerLink="/backoffice/users" class="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
        &larr; Back to Users
      </a>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">Create {{ roleLabel() }}</h1>

      <div class="bg-white rounded-lg shadow p-6 max-w-lg">
        <div class="space-y-4">
          <div>
            <label for="uf-fn" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              id="uf-fn"
              type="text"
              [(ngModel)]="form.firstName"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="uf-ln" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              id="uf-ln"
              type="text"
              [(ngModel)]="form.lastName"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="uf-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="uf-email"
              type="email"
              [(ngModel)]="form.email"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="uf-phone" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              id="uf-phone"
              type="text"
              [(ngModel)]="form.phoneNumber"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label for="uf-pass" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="uf-pass"
              type="password"
              [(ngModel)]="form.password"
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <p class="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
          </div>
        </div>

        @if (errorMsg()) {
          <p class="text-sm text-red-600 mt-3">{{ errorMsg() }}</p>
        }

        <div class="flex gap-3 mt-6">
          <button
            (click)="onSubmit()"
            [disabled]="saving()"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 text-sm cursor-pointer disabled:opacity-50"
          >
            {{ saving() ? 'Creating...' : 'Create ' + roleLabel() }}
          </button>
          <a
            routerLink="/backoffice/users"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
    }
  `,
})
export class BoUserFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userService = inject(BackofficeUserService);

  protected readonly saving = signal(false);
  protected readonly errorMsg = signal('');
  protected readonly roleLabel = signal('Staff');
  protected readonly validRole = signal(false);

  private role: 'staff' | 'admin' = 'staff';

  protected form = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  };

  ngOnInit() {
    const roleParam = this.route.snapshot.paramMap.get('role');
    if (roleParam !== 'staff' && roleParam !== 'admin') {
      this.router.navigate(['/backoffice/users']);
      return;
    }
    this.validRole.set(true);
    if (roleParam === 'admin') {
      this.role = 'admin';
      this.roleLabel.set('Admin');
    }
  }

  onSubmit() {
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
      this.errorMsg.set('First name and last name are required');
      return;
    }
    if (!this.form.email.trim()) {
      this.errorMsg.set('Email is required');
      return;
    }
    if (!this.form.phoneNumber.trim() || this.form.phoneNumber.trim().length < 9) {
      this.errorMsg.set('Phone number must be at least 9 characters');
      return;
    }
    if (this.form.password.length < 8) {
      this.errorMsg.set('Password must be at least 8 characters');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set('');

    this.userService.createUser(this.role, {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
      password: this.form.password,
    }).subscribe({
      next: () => {
        this.router.navigate(['/backoffice/users']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Failed to create user');
        this.saving.set(false);
      },
    });
  }
}
