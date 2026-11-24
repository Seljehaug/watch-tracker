import {CanActivateChildFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthStore} from './auth-store';
import {filter, map} from 'rxjs';

export const loggedInGuard: CanActivateChildFn = (_childRoute, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  return store.authState$.pipe(
    filter((authState) => authState.status !== 'checking'),
    map((authState) => {
      if (authState.status === 'loggedOut') {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }

      // 'failed' too: the server gave no usable answer, which a login can't fix, so the page shows
      // its own error.
      return true;
    }),
  );
};
