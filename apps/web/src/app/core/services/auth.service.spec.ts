import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import type { AuthResponse, MeResponse } from '../../shared/models/user.model';
import type { ApiResponse } from '../../shared/models/api-response.model';

const MOCK_USER = {
  id: 1,
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER' as const,
  isActive: true,
};

const MOCK_AUTH_RESPONSE: AuthResponse = {
  success: true,
  data: {
    user: MOCK_USER,
    accessToken: 'mock-access-token',
  },
};

const MOCK_REFRESH_RESPONSE: ApiResponse<{ accessToken: string }> = {
  success: true,
  data: { accessToken: 'refreshed-access-token' },
};

const MOCK_ME_RESPONSE: MeResponse = {
  success: true,
  data: MOCK_USER,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  let removeItemSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear localStorage and set up spies
    localStorage.clear();

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);

    // The constructor calls restoreToken which reads from localStorage.
    // Since getItem returns null, no fetchMe call is made.
  });

  afterEach(() => {
    httpTesting.verify();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('sends POST, stores token in signal and localStorage, sets user', () => {
      service.login({ email: 'test@test.com', password: 'pw' }).subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/login') && r.method === 'POST',
      );
      expect(req.request.withCredentials).toBe(true);
      req.flush(MOCK_AUTH_RESPONSE);

      expect(service.getAccessToken()).toBe('mock-access-token');
      expect(service.user()).toEqual(MOCK_USER);
      expect(service.isAuthenticated()).toBe(true);
      expect(setItemSpy).toHaveBeenCalledWith('access_token', 'mock-access-token');
    });
  });

  describe('register', () => {
    it('sends POST, stores token in signal and localStorage, sets user', () => {
      service
        .register({
          firstName: 'T',
          lastName: 'U',
          email: 'test@test.com',
          phoneNumber: '0800000000',
          password: 'password123',
        })
        .subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/register') && r.method === 'POST',
      );
      expect(req.request.withCredentials).toBe(true);
      req.flush(MOCK_AUTH_RESPONSE);

      expect(service.getAccessToken()).toBe('mock-access-token');
      expect(service.user()).toEqual(MOCK_USER);
      expect(setItemSpy).toHaveBeenCalledWith('access_token', 'mock-access-token');
    });
  });

  describe('refresh', () => {
    it('sends POST with credentials, updates accessToken in signal and localStorage', () => {
      service.refresh().subscribe();

      const req = httpTesting.expectOne(
        (r) => r.url.includes('/auth/refresh') && r.method === 'POST',
      );
      expect(req.request.withCredentials).toBe(true);
      req.flush(MOCK_REFRESH_RESPONSE);

      expect(service.getAccessToken()).toBe('refreshed-access-token');
      expect(setItemSpy).toHaveBeenCalledWith('access_token', 'refreshed-access-token');
    });
  });

  describe('logout', () => {
    it('sends POST, clears session signal and localStorage', () => {
      // First login to have state
      service.login({ email: 'test@test.com', password: 'pw' }).subscribe();
      const loginReq = httpTesting.expectOne((r) => r.url.includes('/auth/login'));
      loginReq.flush(MOCK_AUTH_RESPONSE);

      // Now logout
      service.logout().subscribe();
      const logoutReq = httpTesting.expectOne(
        (r) => r.url.includes('/auth/logout') && r.method === 'POST',
      );
      logoutReq.flush({ success: true });

      expect(service.getAccessToken()).toBeNull();
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(removeItemSpy).toHaveBeenCalledWith('access_token');
    });
  });

  describe('fetchMe', () => {
    it('sends GET and sets currentUser', () => {
      service.fetchMe().subscribe();

      const req = httpTesting.expectOne((r) => r.url.includes('/auth/me'));
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_ME_RESPONSE);

      expect(service.user()).toEqual(MOCK_USER);
    });

    it('clears session on error', () => {
      // Set up some state first
      service.login({ email: 'test@test.com', password: 'pw' }).subscribe();
      const loginReq = httpTesting.expectOne((r) => r.url.includes('/auth/login'));
      loginReq.flush(MOCK_AUTH_RESPONSE);

      service.fetchMe().subscribe();
      const meReq = httpTesting.expectOne((r) => r.url.includes('/auth/me'));
      meReq.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(service.user()).toBeNull();
      expect(service.getAccessToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no user', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('returns true after login', () => {
      service.login({ email: 'test@test.com', password: 'pw' }).subscribe();
      const req = httpTesting.expectOne((r) => r.url.includes('/auth/login'));
      req.flush(MOCK_AUTH_RESPONSE);

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('restoreToken (constructor behavior)', () => {
    it('reads token from localStorage on construction and calls fetchMe', async () => {
      vi.restoreAllMocks();

      // Pre-seed localStorage
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('stored-token');
      vi.spyOn(Storage.prototype, 'setItem');
      vi.spyOn(Storage.prototype, 'removeItem');

      // Reset TestBed to trigger new constructor
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      });

      const freshService = TestBed.inject(AuthService);
      const freshHttp = TestBed.inject(HttpTestingController);

      // fetchMe is deferred via queueMicrotask — flush the microtask queue
      await Promise.resolve();

      // Constructor should have called fetchMe
      const meReq = freshHttp.expectOne((r) => r.url.includes('/auth/me'));
      expect(meReq.request.method).toBe('GET');
      meReq.flush(MOCK_ME_RESPONSE);

      expect(freshService.getAccessToken()).toBe('stored-token');
      expect(freshService.user()).toEqual(MOCK_USER);

      freshHttp.verify();
    });

    it('does not call fetchMe when localStorage is empty', () => {
      // Service was already created in beforeEach with getItem returning null
      // No fetchMe request should have been made
      httpTesting.expectNone((r) => r.url.includes('/auth/me'));
    });
  });
});
