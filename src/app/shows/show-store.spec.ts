import { TestBed } from '@angular/core/testing';
import { ShowStore } from './show-store';
import type { NewShow } from './tracked-show';

const aShow = (overrides: Partial<NewShow> = {}): NewShow => ({
  title: 'Test Show',
  status: 'watching',
  ...overrides,
});

describe('ShowStore', () => {
  let store: ShowStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00.000Z'));
    TestBed.configureTestingModule({});
    store = TestBed.inject(ShowStore);
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
      const timestamps = store.watching().map((show) => show.updatedAt);
      const sorted = [...timestamps].sort((a, b) => b.localeCompare(a));

      expect(timestamps).toEqual(sorted);
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
});
