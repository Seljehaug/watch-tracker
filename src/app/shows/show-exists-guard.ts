import {CanActivateFn, RedirectCommand, Router} from '@angular/router';
import {inject} from '@angular/core';
import {ShowStore} from './show-store';
import {filter, map} from 'rxjs';

export const showExistsGuard: CanActivateFn = (route, state) => {
  const store = inject(ShowStore);
  const router = inject(Router);

  const showId = Number(route.paramMap.get('showId'));

  return store.status$.pipe(
    filter(status => status !== 'loading'),
    map((status) => {

      if (status === 'error') {
        return new RedirectCommand(router.parseUrl('/'), {
          browserUrl: state.url
        })
      }

      if (!showId || !store.showExists(showId)) {
        const pageNotFound = router.parseUrl('/page-not-found');
        return new RedirectCommand(pageNotFound, {
          browserUrl: state.url
        });
      }

      return true;
    })
  );
};
