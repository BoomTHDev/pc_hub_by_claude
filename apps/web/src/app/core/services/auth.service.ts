import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, AuthResponse, MeResponse } from '../../shared/models/user.model';
import type { ApiResponse } from '../../shared/models/api-response.model';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUser = signal<User | null>(null);
  private readonly accessToken = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.accessToken() !== null);

  constructor() {
    this.restoreToken();
  }

  register(payload: RegisterPayload) {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, payload, {
        withCredentials: true,
      })
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  login(payload: LoginPayload) {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, payload, {
        withCredentials: true,
      })
      .pipe(tap((res) => this.handleAuthResponse(res)));
  }

  refresh() {
    return this.http
      .post<
        ApiResponse<{ accessToken: string }>
      >(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this.accessToken.set(res.data.accessToken);
          localStorage.setItem('access_token', res.data.accessToken);
        }),
      );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => EMPTY),
      tap(() => this.clearSession()),
    );
  }

  fetchMe() {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap((res) => this.currentUser.set(res.data)),
      catchError(() => {
        this.clearSession();
        return EMPTY;
      }),
    );
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  clearSession() {
    this.currentUser.set(null);
    this.accessToken.set(null);
    localStorage.removeItem('access_token');
  }

  private handleAuthResponse(res: AuthResponse) {
    this.currentUser.set(res.data.user);
    this.accessToken.set(res.data.accessToken);
    localStorage.setItem('access_token', res.data.accessToken);
  }

  private restoreToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.accessToken.set(token);
      // Defer fetchMe() to the next microtask to break the circular dependency:
      // constructor → fetchMe → HttpClient → authInterceptor → inject(AuthService)
      queueMicrotask(() => this.fetchMe().subscribe());
    }
  }
}
