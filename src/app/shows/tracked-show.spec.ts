import { getNextEpisodeRef } from './tracked-show';

describe('getNextEpisodeRef', () => {
  it('starts at S01 E01 when nothing has been watched', () => {
    expect(getNextEpisodeRef(undefined)).toEqual({ season: 1, episode: 1 });
  });

  it('moves to the next episode in the same season', () => {
    expect(getNextEpisodeRef({ season: 2, episode: 5 })).toEqual({ season: 2, episode: 6 });
  });
});
