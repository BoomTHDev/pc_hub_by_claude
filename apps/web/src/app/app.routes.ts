import { Routes } from '@angular/router';
import { StorefrontLayout } from './layouts/storefront/storefront-layout';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: StorefrontLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/catalog/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./features/catalog/product-detail/product-detail').then(
            (m) => m.ProductDetailPage,
          ),
      },
      {
        path: 'categories/:slug',
        loadComponent: () =>
          import('./features/catalog/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'brands/:slug',
        loadComponent: () =>
          import('./features/catalog/product-list/product-list').then(
            (m) => m.ProductList,
          ),
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/cart/cart-page').then((m) => m.CartPage),
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/checkout-page').then(
            (m) => m.CheckoutPage,
          ),
      },
      {
        path: 'checkout/confirmation',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/order-confirmation').then(
            (m) => m.OrderConfirmationPage,
          ),
      },
      {
        path: 'account/addresses',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/addresses/address-list').then(
            (m) => m.AddressList,
          ),
      },
      {
        path: 'account/addresses/new',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/addresses/address-form').then(
            (m) => m.AddressForm,
          ),
      },
      {
        path: 'account/addresses/:addressId/edit',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/account/addresses/address-form').then(
            (m) => m.AddressForm,
          ),
      },
    ],
  },
];
