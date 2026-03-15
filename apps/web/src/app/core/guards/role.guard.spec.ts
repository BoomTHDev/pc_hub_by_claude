import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  it('returns true when user has an allowed role', () => {
    // Simulate an authenticated admin user
    Object.defineProperty(authService, 'user', {
      value: () => ({ id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'ADMIN' as const, isActive: true }),
    });

    const guard = roleGuard('STAFF', 'ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(result).toBe(true);
  });

  it('redirects to / when user role is not in allowed list', () => {
    Object.defineProperty(authService, 'user', {
      value: () => ({ id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'CUSTOMER' as const, isActive: true }),
    });

    const guard = roleGuard('STAFF', 'ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(result).toEqual(router.createUrlTree(['/']));
  });

  it('redirects to /login when user is null', () => {
    Object.defineProperty(authService, 'user', {
      value: () => null,
    });

    const guard = roleGuard('STAFF', 'ADMIN');
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});
