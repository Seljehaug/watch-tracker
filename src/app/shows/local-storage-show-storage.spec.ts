import { TestBed } from '@angular/core/testing';
import { LocalStorageShowStorage } from './local-storage-show-storage';
import type { TrackedShow } from './tracked-show';

const STORAGE_KEY = 'watch-tracker.shows';

const aStoredShow = (overrides: Partial<TrackedShow> = {}): TrackedShow => ({
  id: 'severance',
  title: 'Severance',
  status: 'watching',
  addedAt: '2026-01-14T19:02:00.000Z',
  updatedAt: '2026-10-08T21:40:00.000Z',
  ...overrides,
});

const write = (value: unknown) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));

const readBack = (): { version: unknown; shows: unknown[] } =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');

describe('LocalStorageShowStorage', () => {
  let storage: LocalStorageShowStorage;

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({});
    storage = TestBed.inject(LocalStorageShowStorage);
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('save', () => {
    it('writes the shows inside a versioned envelope', () => {
      const show = aStoredShow();

      storage.save([show]);

      expect(readBack()).toEqual({ version: 1, shows: [show] });
    });

    it('replaces what was there before', () => {
      storage.save([aStoredShow({ id: 'first' })]);
      storage.save([aStoredShow({ id: 'second' })]);

      expect(readBack().shows).toHaveLength(1);
    });
  });

  describe('load', () => {
    it('returns what save wrote', () => {
      const shows = [aStoredShow(), aStoredShow({ id: 'andor', title: 'Andor' })];

      storage.save(shows);

      expect(storage.load()).toEqual(shows);
    });

    it('returns an empty list when nothing is stored', () => {
      expect(storage.load()).toEqual([]);
    });

    it('returns an empty list when the stored value is not valid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not json {');

      expect(storage.load()).toEqual([]);
    });

    it('returns an empty list when the envelope is the wrong shape', () => {
      write(['just', 'an', 'array']);

      expect(storage.load()).toEqual([]);
    });

    it('returns an empty list when the version is unknown', () => {
      write({ version: 2, shows: [aStoredShow()] });

      expect(storage.load()).toEqual([]);
    });

    it('returns an empty list when shows is not an array', () => {
      write({ version: 1, shows: 'nope' });

      expect(storage.load()).toEqual([]);
    });

    it('keeps the valid shows and drops the invalid ones', () => {
      const valid = aStoredShow();
      write({
        version: 1,
        shows: [valid, { id: 'broken' }, null, 'a string', { ...valid, status: 'paused' }],
      });

      expect(storage.load()).toEqual([valid]);
    });

    it('warns when it drops a show, so data does not disappear silently', () => {
      write({ version: 1, shows: [aStoredShow(), { id: 'broken' }] });

      storage.load();

      expect(console.warn).toHaveBeenCalled();
    });

    it('keeps a show without the optional fields', () => {
      const minimal = aStoredShow();
      write({ version: 1, shows: [minimal] });

      expect(storage.load()).toEqual([minimal]);
    });

    it('keeps a show with the optional fields filled in', () => {
      const full = aStoredShow({
        service: 'apple-tv-plus',
        lastWatched: { season: 2, episode: 5 },
      });
      write({ version: 1, shows: [full] });

      expect(storage.load()).toEqual([full]);
    });

    it('drops a show whose service is not a known id', () => {
      write({ version: 1, shows: [{ ...aStoredShow(), service: 'blockbuster' }] });

      expect(storage.load()).toEqual([]);
    });

    it('drops a show whose lastWatched is malformed', () => {
      write({ version: 1, shows: [{ ...aStoredShow(), lastWatched: { season: '2' } }] });

      expect(storage.load()).toEqual([]);
    });
  });
});
