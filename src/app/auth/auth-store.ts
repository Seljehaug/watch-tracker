import { inject, Service, signal } from '@angular/core';
import { UserModel } from './user-model';
import { AuthApi } from './auth-api';
import {catchError, map, Observable, of, tap, throwError} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {LoginPostModel} from './login-post-model';

// 'failed': the first check got no usable answer, so who is logged in is unknown.
export type AuthState =
  | { readonly status: 'checking' }
  | { readonly status: 'loggedIn'; readonly user: UserModel }
  | { readonly status: 'loggedOut' }
  | { readonly status: 'failed' };

@Service()
export class AuthStore {
  private readonly authApi = inject(AuthApi);

  private readonly _authState = signal<AuthState>({ status: 'checking' });
  readonly authState = this._authState.asReadonly();

  constructor() {
    this.authApi
      .getUser()
      .pipe(
        map((user): AuthState => ({ status: 'loggedIn', user })),
        catchError((error: unknown) => {
          if (isUnauthorized(error)) {
            return of<AuthState>({ status: 'loggedOut' });
          }

          console.error('Could not fetch the user', error);

          return of<AuthState>({ status: 'failed' });
        }),
        takeUntilDestroyed(),
      )
      .subscribe((newAuthState) => this._authState.set(newAuthState));
  }

  login(postModel: LoginPostModel): Observable<UserModel> {
    return this.authApi
      .login(postModel)
      .pipe(
        tap(user => {
          this._authState.set({ status: 'loggedIn', user });
        })
      );
  }

  logout(): Observable<void> {
    return this.authApi
      .logout()
      .pipe(
        // A 401 means the cookie has expired (user is already logged out)
        catchError((error: unknown) => {
          return isUnauthorized(error)
            ? of(undefined)
            : throwError(() => error);
        }),
        tap(() => {
          this._authState.set({ status: 'loggedOut' });
        })
      );
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized;
}
