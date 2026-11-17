import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
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
class EditPage {}

@Component({ template: '' })
class NotFoundPage {}

describe('showExistsGuard', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'shows/:showId/edit', canActivate: [showExistsGuard], component: EditPage },
          { path: '**', component: NotFoundPage },
        ]),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    // The guard reads the list as it is, so it is loaded before the first navigation.
    TestBed.inject(ShowStore);
    httpTesting.expectOne('/api/shows').flush([severance]);

    harness = await RouterTestingHarness.create();
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
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
});
