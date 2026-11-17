import { Location } from '@angular/common';
import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Home } from './home/home';
import { PageNotFound } from './page-not-found/page-not-found';
import { ShowEditor } from './shows/show-editor/show-editor';
import { ShowStore } from './shows/show-store';
import type { TrackedShow } from './shows/tracked-show';

const severance: TrackedShow = {
  id: 12,
  title: 'Severance',
  status: 'watching',
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt: '2026-10-01T00:00:00+00:00',
};

// The router takes the first route that matches, so these also catch a `**` that has moved up
// the list and swallows the real pages.
describe('routes', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    // The edit route's guard reads the list as it is, so it is loaded before the first navigation.
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

  // navigateByUrl throws when the page that opens is not of the given type. The last URL matches
  // the edit route, so it only reaches the not-found page through the route's guard (D53).
  it.each(['/unknown', '/shows', '/shows/12', '/shows/add/more', '/shows/99/edit'])(
    'shows the not-found page at %s and keeps the URL in the address bar',
    async (url) => {
      await harness.navigateByUrl(url, PageNotFound);

      expect(TestBed.inject(Location).path()).toBe(url);
    },
  );

  it.each<[string, Type<unknown>]>([
    ['/', Home],
    ['/shows/add', ShowEditor],
    ['/shows/12/edit', ShowEditor],
  ])('still opens the real page at %s', async (url, page) => {
    await harness.navigateByUrl(url, page);
  });
});
