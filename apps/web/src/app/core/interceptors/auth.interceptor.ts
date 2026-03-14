import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authedReq = addToken(req, authService);

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
      ) {
        return handleUnauthorized(req, next, authService, router);
      }
      return throwError(() => error);
    }),
  );
};

function addToken(req: HttpRequest<unknown>, authService: AuthService): HttpRequest<unknown> {
  const token = authService.getAccessToken();
  if (token) {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return req;
}

function handleUnauthorized(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
) {
  if (isRefreshing) {
    authService.clearSession();
    void router.navigate(['/login']);
    return throwError(() => new HttpErrorResponse({ status: 401 }));
  }

  isRefreshing = true;

  return authService.refresh().pipe(
    switchMap(() => {
      isRefreshing = false;
      return next(addToken(req, authService));
    }),
    catchError((err) => {
      isRefreshing = false;
      authService.clearSession();
      void router.navigate(['/login']);
      return throwError(() => err);
    }),
  );
}
