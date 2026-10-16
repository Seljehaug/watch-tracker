import { Service, computed, signal } from '@angular/core';
import type { NewShow, TrackedShow } from './tracked-show';

@Service()
export class ShowStore {
  private readonly _shows = signal<TrackedShow[]>([
    {
      id: 'severance',
      title: 'Severance',
      status: 'watching',
      service: 'apple-tv-plus',
      lastWatched: { season: 2, episode: 5 },
      addedAt: '2026-01-14T19:02:00.000Z',
      updatedAt: '2026-10-08T21:40:00.000Z',
    },
    {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      status: 'watching',
      service: 'hbo-max',
      lastWatched: { season: 2, episode: 3 },
      addedAt: '2026-04-02T18:15:00.000Z',
      updatedAt: '2026-10-05T20:10:00.000Z',
    },
    {
      id: 'andor',
      title: 'Andor',
      status: 'watching',
      service: 'disney-plus',
      lastWatched: { season: 2, episode: 7 },
      addedAt: '2026-05-20T17:30:00.000Z',
      updatedAt: '2026-09-28T22:05:00.000Z',
    },
    {
      id: 'the-bear',
      title: 'The Bear',
      status: 'watching',
      service: 'disney-plus',
      lastWatched: { season: 3, episode: 4 },
      addedAt: '2026-02-11T20:00:00.000Z',
      updatedAt: '2026-09-12T19:25:00.000Z',
    },
    {
      id: 'exit',
      title: 'Exit',
      status: 'watching',
      service: 'nrk-tv',
      lastWatched: { season: 1, episode: 2 },
      addedAt: '2026-09-30T21:00:00.000Z',
      updatedAt: '2026-10-01T21:45:00.000Z',
    },
    {
      id: 'fallout',
      title: 'Fallout',
      status: 'want-to-watch',
      service: 'prime-video',
      addedAt: '2026-08-19T12:00:00.000Z',
      updatedAt: '2026-08-19T12:00:00.000Z',
    },
    {
      id: 'dune-prophecy',
      title: 'Dune: Prophecy',
      status: 'want-to-watch',
      service: 'hbo-max',
      addedAt: '2026-09-25T09:30:00.000Z',
      updatedAt: '2026-09-25T09:30:00.000Z',
    },
    {
      id: 'breaking-bad',
      title: 'Breaking Bad',
      status: 'finished',
      service: 'netflix',
      lastWatched: { season: 5, episode: 16 },
      addedAt: '2025-11-03T18:00:00.000Z',
      updatedAt: '2026-03-21T22:30:00.000Z',
    },
    {
      id: 'succession',
      title: 'Succession',
      status: 'finished',
      service: 'hbo-max',
      lastWatched: { season: 4, episode: 10 },
      addedAt: '2025-12-27T20:20:00.000Z',
      updatedAt: '2026-06-14T23:00:00.000Z',
    },
    {
      id: 'the-rings-of-power',
      title: 'The Lord of the Rings: The Rings of Power',
      status: 'dropped',
      service: 'prime-video',
      lastWatched: { season: 1, episode: 4 },
      addedAt: '2026-01-08T19:45:00.000Z',
      updatedAt: '2026-02-02T20:15:00.000Z',
    },
  ]);

  readonly shows = this._shows.asReadonly();

  readonly watching = computed(() => {
    const filtered = this.shows().filter((show) => show.status === 'watching');
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  add(newShow: NewShow): TrackedShow {
    const nowAsISO = new Date().toISOString();

    const newTrackedShow: TrackedShow = {
      ...newShow,
      id: crypto.randomUUID(),
      addedAt: nowAsISO,
      updatedAt: nowAsISO,
    };

    this._shows.update((shows) => [...shows, newTrackedShow]);

    return newTrackedShow;
  }

  remove(id: string): void {
    this._shows.update((shows) => shows.filter((show) => show.id !== id));
  }

  update(id: string, changes: Partial<NewShow>): void {
    this._shows.update((shows) => {
      const nowAsISO = new Date().toISOString();
      return shows.map((show) =>
        show.id === id ? { ...show, ...changes, updatedAt: nowAsISO } : show,
      );
    });
  }
}
