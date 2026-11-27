import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../auth/auth-store';
import { ShowStore } from './show-store';
import type { ShowPostModel, TrackedShow } from './tracked-show';

const aShow = (id: number, overrides: Partial<TrackedShow> = {}): TrackedShow => ({
  id,
  title: `Show ${id}`,
  status: 'watching',
  addedAt: '2026-11-01T12:00:00+00:00',
  updatedAt: '2026-11-01T12:00:00+00:00',
  ...overrides,
});

describe('ShowStore', () => {
  let store: ShowStore;
  let authStore: AuthStore;
  let httpTesting: HttpTestingController;

  // The store fetches only once someone is logged in, so the login check is answered first.
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpTesting = TestBed.inject(HttpTestingController);
    authStore = TestBed.inject(AuthStore);
    httpTesting.expectOne('/api/auth/user').flush({ email: 'test@example.com' });
    store = TestBed.inject(ShowStore);
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

  // Answers the load the store starts when it is created.
  function loadShows(shows: TrackedShow[]): void {
    httpTesting.expectOne({ method: 'GET', url: '/api/shows' }).flush(shows);
  }

  function failToLoad(): void {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpTesting
      .expectOne('/api/shows')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
  }

  const ids = (shows: readonly TrackedShow[]) => shows.map((show) => show.id);

  function changeVisibility(state: DocumentVisibilityState): void {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
    document.dispatchEvent(new Event('visibilitychange'));
  }

  describe('load', () => {
    it('loads the list when it is created', () => {
      expect(store.initialLoad()).toBe('loading');

      loadShows([aShow(2), aShow(1)]);

      expect(ids(store.shows())).toEqual([2, 1]);
      expect(store.initialLoad()).toBe('succeeded');
    });

    it('has failed, with no shows, when the list cannot be loaded', () => {
      failToLoad();

      expect(store.initialLoad()).toBe('failed');
      expect(store.shows()).toEqual([]);
      expect(store.refreshHasFailed()).toBe(false);
    });

    // A failed fetch must not end the stream every fetch goes through.
    it('is loading again when it tries again after a failed first load', () => {
      failToLoad();

      store.load();
      expect(store.initialLoad()).toBe('loading');
      loadShows([aShow(1)]);

      expect(store.initialLoad()).toBe('succeeded');
      expect(ids(store.shows())).toEqual([1]);
    });

    // Only the first load is waited for: the guard and Home let a list that is there be used
    // while it is fetched again (D69).
    it('stays loaded while the list is fetched again, then replaces it', () => {
      loadShows([aShow(1)]);

      store.load();
      expect(store.initialLoad()).toBe('succeeded');
      expect(store.shows()).toEqual([aShow(1)]);
      loadShows([aShow(2), aShow(1, { title: 'Renamed on the Mac' })]);

      expect(store.shows()).toEqual([aShow(2), aShow(1, { title: 'Renamed on the Mac' })]);
    });

    it('keeps the list, and says the refresh failed, when it cannot be fetched again', () => {
      loadShows([aShow(1)]);

      store.load();
      failToLoad();

      expect(store.initialLoad()).toBe('succeeded');
      expect(store.shows()).toEqual([aShow(1)]);
      expect(store.refreshHasFailed()).toBe(true);
    });

    it('forgets a failed refresh once the list is fetched, and when it is cleared', () => {
      loadShows([aShow(1)]);
      store.load();
      failToLoad();

      store.load();
      loadShows([aShow(1)]);
      expect(store.refreshHasFailed()).toBe(false);

      store.load();
      failToLoad();
      store.clearRefreshFailed();
      expect(store.refreshHasFailed()).toBe(false);
    });

    // The answer to the older fetch may come last, and it may be older than the newer one.
    it('cancels a fetch still on its way when a new one starts', () => {
      loadShows([aShow(1)]);

      store.load();
      store.load();

      const [older, newer] = httpTesting.match('/api/shows');
      expect(older.cancelled).toBe(true);
      newer.flush([aShow(2)]);
      expect(ids(store.shows())).toEqual([2]);
    });
  });

  // Another device may have changed the list while the app was in the background (D69).
  describe('when the app comes to the foreground', () => {
    it('fetches the list again', () => {
      loadShows([aShow(1)]);

      changeVisibility('visible');

      loadShows([aShow(1), aShow(2)]);
      expect(ids(store.shows())).toEqual([1, 2]);
    });

    it('fetches nothing when the app goes to the background', () => {
      loadShows([aShow(1)]);

      changeVisibility('hidden');

      httpTesting.expectNone('/api/shows');
    });
  });

  // The next login may be someone else's.
  describe('after a logout', () => {
    async function logout(): Promise<void> {
      const loggedOut = firstValueFrom(authStore.logout());
      httpTesting
        .expectOne({ method: 'POST', url: '/api/auth/logout' })
        .flush(null, { status: 204, statusText: 'No Content' });
      await loggedOut;
    }

    it("forgets the list, its failures and the last step, and waits for the next login's first load", async () => {
      loadShows([aShow(1)]);
      store.load();
      failToLoad();
      // Two quick taps: the first is answered, the second fails.
      store.stepEpisode({ showId: 1, step: 'next' });
      store.stepEpisode({ showId: 1, step: 'next' });
      httpTesting
        .expectOne({ method: 'POST', url: '/api/shows/1/next-episode' })
        .flush(aShow(1, { lastWatched: { season: 1, episode: 1 } }));
      httpTesting
        .expectOne({ method: 'POST', url: '/api/shows/1/next-episode' })
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      await logout();

      expect(store.shows()).toEqual([]);
      expect(store.initialLoad()).toBe('loading');
      expect(store.refreshHasFailed()).toBe(false);
      expect(store.failedEpisodeStep()).toBeNull();
      expect(store.lastSteppedShow()).toBeNull();
    });

    // A late answer would put the list back for the next login.
    it('cancels a fetch still on its way', async () => {
      loadShows([aShow(1)]);
      store.load();
      const fetch = httpTesting.expectOne('/api/shows');

      await logout();

      expect(fetch.cancelled).toBe(true);
    });

    // The login page is open, and every fetch would get a 401.
    it('fetches nothing when the app comes to the foreground', async () => {
      loadShows([aShow(1)]);
      await logout();

      changeVisibility('visible');

      httpTesting.expectNone('/api/shows');
    });
  });

  // A fetch on its way may have read the shows before the write was saved, and its answer would
  // put the old version back (D125).
  describe('a write answered while the list is being fetched', () => {
    it.each([
      [
        'adding a show',
        () => {
          store.add({ title: 'Andor', status: 'watching' }).subscribe();
          httpTesting
            .expectOne({ method: 'POST', url: '/api/shows' })
            .flush(aShow(2), { status: 201, statusText: 'Created' });
        },
      ],
      [
        'saving a show',
        () => {
          store.update(1, { title: 'Renamed', status: 'watching' }).subscribe();
          httpTesting.expectOne({ method: 'PUT', url: '/api/shows/1' }).flush(aShow(1));
        },
      ],
      [
        'deleting a show',
        () => {
          store.delete(1).subscribe();
          httpTesting
            .expectOne({ method: 'DELETE', url: '/api/shows/1' })
            .flush(null, { status: 204, statusText: 'No Content' });
        },
      ],
      [
        'stepping an episode',
        () => {
          store.stepEpisode({ showId: 1, step: 'next' });
          httpTesting
            .expectOne({ method: 'POST', url: '/api/shows/1/next-episode' })
            .flush(aShow(1));
        },
      ],
    ])('fetches the list again after %s', (_, writeAndAnswer) => {
      loadShows([aShow(1)]);
      store.load();

      writeAndAnswer();

      const [stale, fresh] = httpTesting.match('/api/shows');
      expect(stale.cancelled).toBe(true);
      fresh.flush([aShow(3)]);
      expect(ids(store.shows())).toEqual([3]);
    });

    // verify() in afterEach also fails on a GET no test answered.
    it('fetches nothing more when the fetch has already failed', () => {
      loadShows([aShow(1)]);
      store.load();
      failToLoad();

      store.stepEpisode({ showId: 1, step: 'next' });
      httpTesting.expectOne({ method: 'POST', url: '/api/shows/1/next-episode' }).flush(aShow(1));

      httpTesting.expectNone('/api/shows');
    });
  });

  describe('add', () => {
    const fields: ShowPostModel = { title: 'Andor', status: 'want-to-watch' };

    // If the store subscribed too, the caller's subscription would send a second POST.
    it('sends nothing until the caller subscribes', () => {
      loadShows([]);

      store.add(fields);

      httpTesting.expectNone({ method: 'POST', url: '/api/shows' });
    });

    it('puts the show the server returns in the list, and hands it to the caller', async () => {
      loadShows([aShow(1)]);
      const fromServer = aShow(2, { title: 'Andor', status: 'want-to-watch' });
      const added = firstValueFrom(store.add(fields));

      const request = httpTesting.expectOne({ method: 'POST', url: '/api/shows' });
      expect(request.request.body).toEqual(fields);
      request.flush(fromServer, { status: 201, statusText: 'Created' });

      expect(await added).toEqual(fromServer);
      expect(store.shows()).toHaveLength(2);
      expect(store.shows()).toContainEqual(fromServer);
    });

    it('leaves the list as it was when the server refuses, and passes the error on', async () => {
      loadShows([aShow(1)]);
      const added = firstValueFrom(store.add(fields));

      httpTesting
        .expectOne({ method: 'POST', url: '/api/shows' })
        .flush(null, { status: 400, statusText: 'Bad Request' });

      await expect(added).rejects.toMatchObject({ status: 400 });
      expect(store.shows()).toEqual([aShow(1)]);
    });
  });

  describe('update', () => {
    it('puts the version the server returns in place of the show, and leaves the others', async () => {
      loadShows([aShow(2), aShow(1)]);
      const fields: ShowPostModel = { title: 'Severance', status: 'finished' };
      const fromServer = aShow(1, {
        title: 'Severance',
        status: 'finished',
        updatedAt: '2026-11-16T08:02:44.5+00:00',
      });
      const saved = firstValueFrom(store.update(1, fields));

      const request = httpTesting.expectOne({ method: 'PUT', url: '/api/shows/1' });
      expect(request.request.body).toEqual(fields);
      request.flush(fromServer);

      expect(await saved).toEqual(fromServer);
      expect(store.shows()).toEqual([aShow(2), fromServer]);
    });
  });

  describe('delete', () => {
    it('removes only that show once the server has deleted it', async () => {
      loadShows([aShow(2), aShow(1)]);
      const deleted = firstValueFrom(store.delete(1));

      httpTesting
        .expectOne({ method: 'DELETE', url: '/api/shows/1' })
        .flush(null, { status: 204, statusText: 'No Content' });
      await deleted;

      expect(store.shows()).toEqual([aShow(2)]);
    });

    it('keeps the show when the delete fails, and passes the error on', async () => {
      loadShows([aShow(2), aShow(1)]);
      const deleted = firstValueFrom(store.delete(1));

      httpTesting
        .expectOne({ method: 'DELETE', url: '/api/shows/1' })
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      await expect(deleted).rejects.toMatchObject({ status: 500 });
      expect(store.shows()).toEqual([aShow(2), aShow(1)]);
    });

    // Deleted on another device: the user has what they asked for (D119).
    it('counts a 404 as deleted, and removes the show', async () => {
      loadShows([aShow(2), aShow(1)]);
      const deleted = firstValueFrom(store.delete(1));

      httpTesting
        .expectOne({ method: 'DELETE', url: '/api/shows/1' })
        .flush(null, { status: 404, statusText: 'Not Found' });

      await expect(deleted).resolves.toBeUndefined();
      expect(store.shows()).toEqual([aShow(2)]);
    });
  });

  describe('stepEpisode', () => {
    // No caller subscribes: the card only needs the list to change.
    it.each([
      ['next', '/api/shows/1/next-episode', { season: 2, episode: 6 }],
      ['previous', '/api/shows/1/previous-episode', { season: 2, episode: 4 }],
    ] as const)(
      'sends a %s step as its own command and puts the show the server returns in the list',
      (step, url, lastWatched) => {
        loadShows([aShow(2), aShow(1, { lastWatched: { season: 2, episode: 5 } })]);
        const fromServer = aShow(1, { lastWatched, updatedAt: '2026-11-16T08:02:44.5+00:00' });

        store.stepEpisode({ showId: 1, step });

        httpTesting.expectOne({ method: 'POST', url }).flush(fromServer);
        expect(store.shows()).toEqual([aShow(2), fromServer]);
      },
    );

    // Sent at once, a + and a − could reach the server in either order, and the answers could
    // come back in either order (D69, D146).
    it('sends quick taps one at a time, each after the answer to the one before', () => {
      loadShows([aShow(1, { lastWatched: { season: 2, episode: 5 } })]);
      const afterNext = aShow(1, { lastWatched: { season: 2, episode: 6 } });
      const afterPrevious = aShow(1, { lastWatched: { season: 2, episode: 5 } });

      store.stepEpisode({ showId: 1, step: 'next' });
      store.stepEpisode({ showId: 1, step: 'previous' });

      const first = expectNextEpisodeOf(1);
      httpTesting.expectNone({ method: 'POST', url: '/api/shows/1/previous-episode' });
      first.flush(afterNext);
      expectPreviousEpisodeOf(1).flush(afterPrevious);
      expect(store.shows()).toEqual([afterPrevious]);
    });

    // A retry could count an episode twice: the server may have saved before the answer was lost.
    it('never sends a failed command again, and still sends the taps after it', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      loadShows([aShow(1), aShow(2)]);
      const show2After = aShow(2, { lastWatched: { season: 1, episode: 1 } });

      store.stepEpisode({ showId: 1, step: 'next' });
      store.stepEpisode({ showId: 2, step: 'next' });
      failNextEpisodeOf(1);
      expectNextEpisodeOf(2).flush(show2After);
      httpTesting.expectNone({ method: 'POST', url: '/api/shows/1/next-episode' });

      store.stepEpisode({ showId: 1, step: 'next' });
      expectNextEpisodeOf(1).flush(aShow(1, { lastWatched: { season: 1, episode: 1 } }));
    });

    it('leaves the show as it was when the command fails, and says which show and which way', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const show2 = aShow(2, { lastWatched: { season: 1, episode: 3 } });
      loadShows([aShow(1), show2]);

      store.stepEpisode({ showId: 2, step: 'previous' });
      expectPreviousEpisodeOf(2).flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(store.shows()).toEqual([aShow(1), show2]);
      expect(store.failedEpisodeStep()).toEqual({ showId: 2, step: 'previous' });
    });

    it('forgets the failure on the next tap, and when it is cleared', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      loadShows([aShow(1), aShow(2)]);
      store.stepEpisode({ showId: 1, step: 'next' });
      failNextEpisodeOf(1);

      store.stepEpisode({ showId: 2, step: 'next' });
      expect(store.failedEpisodeStep()).toBeNull();
      failNextEpisodeOf(2);

      store.clearFailedEpisodeStep();
      expect(store.failedEpisodeStep()).toBeNull();
    });

    // The list is loaded again often (D69); the queue must not be subscribed to again with it.
    it('sends one command per tap after the list has been loaded again', () => {
      loadShows([aShow(1)]);
      store.load();
      loadShows([aShow(1)]);

      store.stepEpisode({ showId: 1, step: 'next' });

      expectNextEpisodeOf(1).flush(aShow(1, { lastWatched: { season: 1, episode: 1 } }));
    });

    function expectNextEpisodeOf(id: number) {
      return httpTesting.expectOne({ method: 'POST', url: `/api/shows/${id}/next-episode` });
    }

    function expectPreviousEpisodeOf(id: number) {
      return httpTesting.expectOne({ method: 'POST', url: `/api/shows/${id}/previous-episode` });
    }

    function failNextEpisodeOf(id: number): void {
      expectNextEpisodeOf(id).flush(null, { status: 500, statusText: 'Internal Server Error' });
    }
  });

  describe('watching', () => {
    it('only has the shows being watched', () => {
      loadShows([
        aShow(1),
        aShow(2, { status: 'want-to-watch' }),
        aShow(3, { status: 'finished' }),
        aShow(4, { status: 'dropped' }),
      ]);

      expect(ids(store.watching())).toEqual([1]);
    });

    it('lists the most recently updated show first', () => {
      loadShows([
        aShow(1, { updatedAt: '2026-11-01T12:00:00+00:00' }),
        aShow(2, { updatedAt: '2026-11-03T12:00:00+00:00' }),
        aShow(3, { updatedAt: '2026-11-02T12:00:00+00:00' }),
      ]);

      expect(ids(store.watching())).toEqual([2, 3, 1]);
    });

    // The server leaves out trailing zeros, so a show updated on a whole second has no decimals.
    // Compared as text, it sorts wrongly against one updated later in the same second.
    it('compares the times, not the text', () => {
      loadShows([
        aShow(1, { updatedAt: '2026-11-16T08:00:00+00:00' }),
        aShow(2, { updatedAt: '2026-11-16T08:00:00.5+00:00' }),
      ]);

      expect(ids(store.watching())).toEqual([2, 1]);
    });
  });
});
