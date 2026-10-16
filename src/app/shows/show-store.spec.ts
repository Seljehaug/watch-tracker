import { TestBed } from '@angular/core/testing';
import { ShowStorage } from './show-storage';
import { ShowStore } from './show-store';
import type { NewShow, TrackedShow } from './tracked-show';

// Stands in for localStorage: the tests never touch the real browser storage,
// and each test starts from an empty, isolated store.
class InMemoryShowStorage extends ShowStorage {
  saved: TrackedShow[] = [];

  load(): TrackedShow[] {
    return this.saved;
  }

  save(shows: TrackedShow[]): void {
    this.saved = shows;
  }
}

const aShow = (overrides: Partial<NewShow> = {}): NewShow => ({
  title: 'Test Show',
  status: 'watching',
  ...overrides,
});

describe('ShowStore', () => {
  let store: ShowStore;
  let storage: InMemoryShowStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    TestBed.configureTestingModule({
      providers: [{ provide: ShowStorage, useClass: InMemoryShowStorage }],
    });
    store = TestBed.inject(ShowStore);
    storage = TestBed.inject(ShowStorage) as InMemoryShowStorage;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('add', () => {
    it('generates an id and sets both timestamps to now', () => {
      const added = store.add(aShow());

      expect(added.id).toBeTruthy();
      expect(added.addedAt).toBe('2026-11-01T12:00:00.000Z');
      expect(added.updatedAt).toBe(added.addedAt);
    });

    it('gives each show its own id', () => {
      const first = store.add(aShow());
      const second = store.add(aShow());

      expect(first.id).not.toBe(second.id);
    });

    it('keeps the fields the caller provided', () => {
      const added = store.add(
        aShow({
          title: 'Severance',
          status: 'want-to-watch',
          service: 'apple-tv-plus',
          lastWatched: { season: 2, episode: 5 },
        }),
      );

      expect(added.title).toBe('Severance');
      expect(added.status).toBe('want-to-watch');
      expect(added.service).toBe('apple-tv-plus');
      expect(added.lastWatched).toEqual({ season: 2, episode: 5 });
    });

    it('puts the show in the list', () => {
      const added = store.add(aShow());

      expect(store.shows()).toContainEqual(added);
    });
  });

  describe('remove', () => {
    it('removes only the show with that id', () => {
      const kept = store.add(aShow({ title: 'Kept' }));
      const removed = store.add(aShow({ title: 'Removed' }));

      store.remove(removed.id);

      expect(store.shows()).toContainEqual(kept);
      expect(store.shows().some((show) => show.id === removed.id)).toBe(false);
    });

    it('leaves the list alone when the id is unknown', () => {
      store.add(aShow());
      const before = store.shows();

      store.remove('no-such-id');

      expect(store.shows()).toEqual(before);
    });
  });

  describe('update', () => {
    it('applies the changes to that show', () => {
      const added = store.add(aShow({ title: 'Old title' }));

      store.update(added.id, { title: 'New title', status: 'finished' });

      const updated = store.shows().find((show) => show.id === added.id);
      expect(updated?.title).toBe('New title');
      expect(updated?.status).toBe('finished');
    });

    it('bumps updatedAt but keeps addedAt and id', () => {
      const added = store.add(aShow());
      vi.setSystemTime(new Date('2026-11-02T08:30:00.000Z'));

      store.update(added.id, { title: 'Renamed' });

      const updated = store.shows().find((show) => show.id === added.id);
      expect(updated?.updatedAt).toBe('2026-11-02T08:30:00.000Z');
      expect(updated?.addedAt).toBe(added.addedAt);
      expect(updated?.id).toBe(added.id);
    });

    it('leaves fields that were not in the changes', () => {
      const added = store.add(aShow({ title: 'Keep me', service: 'netflix' }));

      store.update(added.id, { status: 'dropped' });

      const updated = store.shows().find((show) => show.id === added.id);
      expect(updated?.title).toBe('Keep me');
      expect(updated?.service).toBe('netflix');
    });

    it('does not touch the other shows', () => {
      const untouched = store.add(aShow({ title: 'Untouched' }));
      const target = store.add(aShow({ title: 'Target' }));

      store.update(target.id, { title: 'Changed' });

      expect(store.shows()).toContainEqual(untouched);
    });

    it('changes nothing when the id is unknown', () => {
      store.add(aShow());
      const before = store.shows();

      store.update('no-such-id', { title: 'Nope' });

      expect(store.shows()).toEqual(before);
    });
  });

  describe('watching', () => {
    it('only includes shows with status watching', () => {
      store.add(aShow({ title: 'Watching it', status: 'watching' }));
      store.add(aShow({ title: 'Want to', status: 'want-to-watch' }));
      store.add(aShow({ title: 'Done', status: 'finished' }));

      expect(store.watching().every((show) => show.status === 'watching')).toBe(true);
      expect(store.watching().some((show) => show.title === 'Want to')).toBe(false);
    });

    it('sorts by updatedAt, most recent first', () => {
      const oldest = store.add(aShow({ title: 'Oldest' }));
      vi.setSystemTime(new Date('2026-11-01T13:00:00.000Z'));
      const middle = store.add(aShow({ title: 'Middle' }));
      vi.setSystemTime(new Date('2026-11-01T14:00:00.000Z'));
      const newest = store.add(aShow({ title: 'Newest' }));

      expect(store.watching().map((show) => show.id)).toEqual([newest.id, middle.id, oldest.id]);
    });

    it('moves a show to the front when it is updated', () => {
      const first = store.add(aShow({ title: 'First' }));
      vi.setSystemTime(new Date('2026-11-01T13:00:00.000Z'));
      const second = store.add(aShow({ title: 'Second' }));

      expect(store.watching()[0].id).toBe(second.id);

      vi.setSystemTime(new Date('2026-11-01T14:00:00.000Z'));
      store.update(first.id, { status: 'watching' });

      expect(store.watching()[0].id).toBe(first.id);
    });
  });

  describe('persistence', () => {
    it('starts from whatever storage returns', () => {
      const stored: TrackedShow = {
        id: 'from-storage',
        title: 'Loaded from storage',
        status: 'finished',
        addedAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      };
      const seeded = new InMemoryShowStorage();
      seeded.saved = [stored];

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: ShowStorage, useValue: seeded }],
      });

      expect(TestBed.inject(ShowStore).shows()).toEqual([stored]);
    });

    it('saves the new list after add', () => {
      const added = store.add(aShow());

      expect(storage.saved).toContainEqual(added);
    });

    it('saves the new list after remove', () => {
      const added = store.add(aShow());

      store.remove(added.id);

      expect(storage.saved).toEqual([]);
    });

    it('saves the new list after update', () => {
      const added = store.add(aShow({ title: 'Before' }));

      store.update(added.id, { title: 'After' });

      expect(storage.saved[0].title).toBe('After');
    });
  });
});
