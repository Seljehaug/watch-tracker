import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
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
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpTesting = TestBed.inject(HttpTestingController);
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

  const ids = (shows: readonly TrackedShow[]) => shows.map((show) => show.id);

  describe('load', () => {
    it('loads the list when it is created', () => {
      expect(store.status()).toBe('loading');

      loadShows([aShow(2), aShow(1)]);

      expect(ids(store.shows())).toEqual([2, 1]);
      expect(store.status()).toBe('loaded');
    });

    it('is in error, with no shows, when the list cannot be loaded', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      httpTesting
        .expectOne('/api/shows')
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(store.status()).toBe('error');
      expect(store.shows()).toEqual([]);
    });

    // Loaded again when the app comes to the foreground (D69) and after a login.
    it('is loading again while it reloads, then replaces the list', () => {
      loadShows([aShow(1)]);

      store.load();
      expect(store.status()).toBe('loading');
      loadShows([aShow(2), aShow(1, { title: 'Renamed on the Mac' })]);

      expect(store.shows()).toEqual([aShow(2), aShow(1, { title: 'Renamed on the Mac' })]);
      expect(store.status()).toBe('loaded');
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

  describe('markNextEpisodeAsWatched', () => {
    // No caller subscribes: the card only needs the list to change.
    it('sends the command itself and puts the show the server returns in the list', () => {
      loadShows([aShow(2), aShow(1, { lastWatched: { season: 2, episode: 5 } })]);
      const fromServer = aShow(1, {
        lastWatched: { season: 2, episode: 6 },
        updatedAt: '2026-11-16T08:02:44.5+00:00',
      });

      store.markNextEpisodeAsWatched(1);

      httpTesting.expectOne({ method: 'POST', url: '/api/shows/1/next-episode' }).flush(fromServer);
      expect(store.shows()).toEqual([aShow(2), fromServer]);
    });

    // Two at once could both read E05 on the server and save E06, and the answers could come
    // back in either order (D69).
    it('sends quick taps one at a time, each after the answer to the one before', () => {
      loadShows([aShow(1, { lastWatched: { season: 2, episode: 5 } })]);
      const afterFirst = aShow(1, { lastWatched: { season: 2, episode: 6 } });
      const afterSecond = aShow(1, { lastWatched: { season: 2, episode: 7 } });

      store.markNextEpisodeAsWatched(1);
      store.markNextEpisodeAsWatched(1);

      // expectOne fails when both have been sent.
      expectNextEpisodeOf(1).flush(afterFirst);
      expectNextEpisodeOf(1).flush(afterSecond);
      expect(store.shows()).toEqual([afterSecond]);
    });

    // A retry could count an episode twice: the server may have saved before the answer was lost.
    it('never sends a failed command again, and still sends the taps after it', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      loadShows([aShow(1), aShow(2)]);
      const show2After = aShow(2, { lastWatched: { season: 1, episode: 1 } });

      store.markNextEpisodeAsWatched(1);
      store.markNextEpisodeAsWatched(2);
      failNextEpisodeOf(1);
      expectNextEpisodeOf(2).flush(show2After);
      httpTesting.expectNone({ method: 'POST', url: '/api/shows/1/next-episode' });

      store.markNextEpisodeAsWatched(1);
      expectNextEpisodeOf(1).flush(aShow(1, { lastWatched: { season: 1, episode: 1 } }));
    });

    it('leaves the show as it was when the command fails, and says which show failed', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      loadShows([aShow(1), aShow(2)]);

      store.markNextEpisodeAsWatched(2);
      failNextEpisodeOf(2);

      expect(store.shows()).toEqual([aShow(1), aShow(2)]);
      expect(store.nextEpisodeFailedFor()).toBe(2);
    });

    it('forgets the failure on the next tap, and when it is cleared', () => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      loadShows([aShow(1), aShow(2)]);
      store.markNextEpisodeAsWatched(1);
      failNextEpisodeOf(1);

      store.markNextEpisodeAsWatched(2);
      expect(store.nextEpisodeFailedFor()).toBeNull();
      failNextEpisodeOf(2);

      store.clearNextEpisodeFailure();
      expect(store.nextEpisodeFailedFor()).toBeNull();
    });

    // The list is loaded again often (D69); the queue must not be subscribed to again with it.
    it('sends one command per tap after the list has been loaded again', () => {
      loadShows([aShow(1)]);
      store.load();
      loadShows([aShow(1)]);

      store.markNextEpisodeAsWatched(1);

      expectNextEpisodeOf(1).flush(aShow(1, { lastWatched: { season: 1, episode: 1 } }));
    });

    function expectNextEpisodeOf(id: number) {
      return httpTesting.expectOne({ method: 'POST', url: `/api/shows/${id}/next-episode` });
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
