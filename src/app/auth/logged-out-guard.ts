import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthStore} from './auth-store';
import {filter, map} from 'rxjs';

export const loggedOutGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  return store.authState$.pipe(
    filter((authState) => authState.status !== 'checking'),
    map((authState) => {
      if (authState.status === 'loggedIn') {
        return router.parseUrl('/');
      }

      return true;
    }),
  );
};
