import type { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Home } from './home/home';
import { PageNotFound } from './page-not-found/page-not-found';
import { ShowEditor } from './shows/show-editor/show-editor';
import { ShowStorage } from './shows/show-storage';
import type { TrackedShow } from './shows/tracked-show';

class InMemoryShowStorage extends ShowStorage {
  constructor(private shows: TrackedShow[]) {
    super();
  }

  load(): TrackedShow[] {
    return this.shows;
  }

  save(shows: TrackedShow[]): void {
    this.shows = shows;
  }
}

const severance: TrackedShow = {
  id: 'severance',
  title: 'Severance',
  status: 'watching',
  addedAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

// The router takes the first route that matches, so these also catch a `**` that has moved up
// the list and swallows the real pages.
describe('routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: ShowStorage, useValue: new InMemoryShowStorage([severance]) },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  // navigateByUrl throws when the page that opens is not of the given type.
  it.each(['/unknown', '/shows', '/shows/severance', '/shows/add/more'])(
    'shows the not-found page at %s and keeps the URL',
    async (url) => {
      await harness.navigateByUrl(url, PageNotFound);

      expect(TestBed.inject(Router).url).toBe(url);
    },
  );

  it.each<[string, Type<unknown>]>([
    ['/', Home],
    ['/shows/add', ShowEditor],
    ['/shows/severance/edit', ShowEditor],
  ])('still opens the real page at %s', async (url, page) => {
    await harness.navigateByUrl(url, page);
  });
});
