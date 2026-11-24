import {HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {AuthStore, isUnauthorized} from './auth-store';
import {inject} from '@angular/core';
import {Router} from '@angular/router';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {

  // The auth requests handle their own 401s.
  // This must come before inject(AuthStore): the store sends one of them while it is being created.
  if (req.url.startsWith('/api/auth/')) {
    return next(req);
  }

  const router = inject(Router);
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: unknown) => {
      // Skip if an earlier 401 has already sent the user to the login page:
      // router.url is then the login page, and it would become the returnUrl.
      if (isUnauthorized(error) && authStore.authState().status !== 'loggedOut') {
        authStore.markAsLoggedOut();
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url }});
      }

      return throwError(() => error);
    }),
  );
};
