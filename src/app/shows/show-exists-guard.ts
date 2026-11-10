import {CanActivateFn, RedirectCommand, Router} from '@angular/router';
import {inject} from '@angular/core';
import {ShowStore} from './show-store';

export const showExistsGuard: CanActivateFn = (route, state) => {
  const store = inject(ShowStore);
  const router = inject(Router);

  const showId = route.paramMap.get('showId');

  if (!showId || !store.showExists(showId)) {
    const pageNotFound = router.parseUrl('/page-not-found');
    return new RedirectCommand(pageNotFound, {
      browserUrl: state.url
    });
  }

  return true;
};
