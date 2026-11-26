import {
  canStepToPreviousEpisode,
  getNextEpisodeRef,
  type EpisodeRef,
  type TrackedShow,
} from './tracked-show';
import type { ShowStatus } from './show-status';

describe('getNextEpisodeRef', () => {
  it('starts at S01 E01 when nothing has been watched', () => {
    expect(getNextEpisodeRef(undefined)).toEqual({ season: 1, episode: 1 });
  });

  it('moves to the next episode in the same season', () => {
    expect(getNextEpisodeRef({ season: 2, episode: 5 })).toEqual({ season: 2, episode: 6 });
  });
});

// The server has the same rule (D146); this one decides whether − is aria-disabled.
describe('canStepToPreviousEpisode', () => {
  const aShow = (status: ShowStatus, lastWatched?: EpisodeRef): TrackedShow => ({
    id: 1,
    title: 'Severance',
    status,
    ...(lastWatched && { lastWatched }),
    addedAt: '2026-11-01T12:00:00+00:00',
    updatedAt: '2026-11-01T12:00:00+00:00',
  });

  it.each([
    ['S01 E01, which goes to not started', aShow('watching', { season: 1, episode: 1 })],
    ['an episode after E01', aShow('watching', { season: 2, episode: 5 })],
    ['a Want to watch show with progress', aShow('want-to-watch', { season: 1, episode: 3 })],
  ])('can go back from %s', (_, show) => {
    expect(canStepToPreviousEpisode(show)).toBe(true);
  });

  it.each([
    ['a show not started', aShow('watching')],
    // The earlier season's length is unknown.
    ['E01 of a later season', aShow('watching', { season: 2, episode: 1 })],
    ['a Finished show', aShow('finished', { season: 2, episode: 5 })],
    ['a Dropped show', aShow('dropped', { season: 2, episode: 5 })],
  ])('cannot go back from %s', (_, show) => {
    expect(canStepToPreviousEpisode(show)).toBe(false);
  });
});
