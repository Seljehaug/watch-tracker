import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { showExistsGuard } from './show-exists-guard';
import { ShowStorage } from './show-storage';
import { ShowStore } from './show-store';
import type { TrackedShow } from './tracked-show';

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

// Stand-in pages, so the tests are about the guard and not about what the real pages render.
@Component({ template: '' })
class EditPage {}

@Component({ template: '' })
class NotFoundPage {}

describe('showExistsGuard', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'shows/:showId/edit', canActivate: [showExistsGuard], component: EditPage },
          { path: '**', component: NotFoundPage },
        ]),
        { provide: ShowStorage, useValue: new InMemoryShowStorage([severance]) },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  // navigateByUrl throws when the page that opens is not of the given type.
  it('opens the page for a show in the store', async () => {
    await harness.navigateByUrl('/shows/severance/edit', EditPage);
  });

  it('opens the not-found page for an unknown id, with the asked-for URL in the address bar', async () => {
    await harness.navigateByUrl('/shows/unknown/edit', NotFoundPage);

    expect(TestBed.inject(Location).path()).toBe('/shows/unknown/edit');
    // browserUrl only changes the address bar; the router itself is on the redirect target.
    expect(TestBed.inject(Router).url).not.toBe('/shows/unknown/edit');
  });

  // The guard reads the store on every navigation, so a link to a show deleted since the app
  // started (Back after a delete, an old bookmark) no longer opens the editor.
  it('opens the not-found page for a show removed after the app started', async () => {
    TestBed.inject(ShowStore).remove('severance');

    await harness.navigateByUrl('/shows/severance/edit', NotFoundPage);
  });
});
