import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BackofficeUserService } from '../../../core/services/backoffice-user.service';
import { AlertBanner } from '../../../shared/components/alert-banner/alert-banner';

@Component({
  selector: 'app-bo-user-form',
  imports: [RouterLink, FormsModule, AlertBanner],
  templateUrl: './user-form.html',
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
