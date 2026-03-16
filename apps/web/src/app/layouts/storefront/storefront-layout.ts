import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-storefront-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './storefront-layout.html',
})
export class StorefrontLayout implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly cartService = inject(CartService);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.cartService.loadCart().subscribe();
    }
  }

  protected isStaffOrAdmin(): boolean {
    const role = this.auth.user()?.role;
    return role === 'STAFF' || role === 'ADMIN';
  }

  onLogout() {
    this.auth.logout().subscribe(() => {
      this.cartService.clearLocalCart();
    });
  }
}
