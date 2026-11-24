import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { showExistsGuard } from './show-exists-guard';
import { ShowStore } from './show-store';
import type { TrackedShow } from './tracked-show';

const severance: TrackedShow = {
  id: 12,
  title: 'Severance',
  status: 'watching',
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt: '2026-10-01T00:00:00+00:00',
};

// Stand-in pages, so the tests are about the guard and not about what the real pages render.
@Component({ template: '' })
class HomePage {}

@Component({ template: '' })
class EditPage {}

@Component({ template: '' })
class NotFoundPage {}

// Lets the router run the guard, which then waits for the list.
function letTheGuardRun(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

describe('showExistsGuard', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: HomePage },
          { path: 'shows/:showId/edit', canActivate: [showExistsGuard], component: EditPage },
          { path: '**', component: NotFoundPage },
        ]),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    // The store asks for the list as soon as it is created and someone is logged in.
    TestBed.inject(AuthStore);
    httpTesting.expectOne('/api/auth/user').flush({ email: 'test@example.com' });
    TestBed.inject(ShowStore);
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    vi.restoreAllMocks();
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  // verify() fails on a request no test answered, so these also check that the guard never
  // asks for a list that is already loaded.
  describe('with the list loaded', () => {
    beforeEach(async () => {
      httpTesting.expectOne('/api/shows').flush([severance]);
      harness = await RouterTestingHarness.create();
    });

    // navigateByUrl throws when the page that opens is not of the given type.
    it('opens the page for a show in the store', async () => {
      await harness.navigateByUrl('/shows/12/edit', EditPage);
    });

    it('opens the not-found page for an unknown id, with the asked-for URL in the address bar', async () => {
      await harness.navigateByUrl('/shows/99/edit', NotFoundPage);

      expect(TestBed.inject(Location).path()).toBe('/shows/99/edit');
      // browserUrl only changes the address bar; the router itself is on the redirect target.
      expect(TestBed.inject(Router).url).not.toBe('/shows/99/edit');
    });

    // The id comes from the URL as text. parseInt would read "12abc" as Severance.
    it.each(['/shows/abc/edit', '/shows/12abc/edit'])(
      'opens the not-found page for an id that is not a number: %s',
      async (url) => {
        await harness.navigateByUrl(url, NotFoundPage);
      },
    );

    // The guard reads the store on every navigation, so a link to a show deleted since the app
    // started (Back after a delete, an old bookmark) no longer opens the editor.
    it('opens the not-found page for a show deleted after the app started', async () => {
      const deleted = firstValueFrom(TestBed.inject(ShowStore).delete(12));
      httpTesting
        .expectOne({ method: 'DELETE', url: '/api/shows/12' })
        .flush(null, { status: 204, statusText: 'No Content' });
      await deleted;

      await harness.navigateByUrl('/shows/12/edit', NotFoundPage);
    });

    // The list is fetched again each time the app comes back (D69). The one there is used.
    it('opens the page at once while the list is fetched again', async () => {
      TestBed.inject(ShowStore).load();

      const navigation = harness.navigateByUrl('/shows/12/edit', EditPage);
      await letTheGuardRun();
      expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(EditPage);

      httpTesting.expectOne('/api/shows').flush([severance]);
      await navigation;
    });

    // On a 401 the interceptor logs out and sends to the login page with the edit URL as
    // returnUrl, and the login page goes there right after the login.
    it("waits for the next login's list, then opens the not-found page for a show it no longer has", async () => {
      const authStore = TestBed.inject(AuthStore);
      authStore.markAsLoggedOut();
      const loggedIn = firstValueFrom(
        authStore.login({ email: 'test@example.com', password: 'a-long-test-password' }),
      );
      httpTesting
        .expectOne({ method: 'POST', url: '/api/auth/login' })
        .flush({ email: 'test@example.com' });
      await loggedIn;

      const navigation = harness.navigateByUrl('/shows/12/edit', NotFoundPage);
      await letTheGuardRun();
      expect(harness.routeDebugElement).toBeNull();

      httpTesting.expectOne('/api/shows').flush([]);
      await navigation;
    });

    it('still opens the page after the list could not be fetched again', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      TestBed.inject(ShowStore).load();
      httpTesting
        .expectOne('/api/shows')
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      await harness.navigateByUrl('/shows/12/edit', EditPage);
    });
  });

  // An edit URL opened directly, or reloaded: the guard runs before the list has arrived.
  describe('before the first load has answered', () => {
    beforeEach(async () => {
      harness = await RouterTestingHarness.create();
    });

    it('waits for the list, then opens the page for a show in it', async () => {
      const navigation = harness.navigateByUrl('/shows/12/edit', EditPage);
      await letTheGuardRun();
      expect(harness.routeDebugElement).toBeNull();

      httpTesting.expectOne('/api/shows').flush([severance]);

      await navigation;
    });

    it('waits for the list, then opens the not-found page for an unknown id', async () => {
      const navigation = harness.navigateByUrl('/shows/99/edit', NotFoundPage);
      await letTheGuardRun();
      expect(harness.routeDebugElement).toBeNull();

      httpTesting.expectOne('/api/shows').flush([severance]);

      await navigation;
    });

    // Not the not-found page: the show may well exist. The address bar keeps the URL, so a
    // reload tries again.
    it('opens Home when the load fails, with the asked-for URL in the address bar', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const navigation = harness.navigateByUrl('/shows/12/edit', HomePage);
      await letTheGuardRun();
      httpTesting
        .expectOne('/api/shows')
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      await navigation;
      expect(TestBed.inject(Location).path()).toBe('/shows/12/edit');
    });
  });
});
