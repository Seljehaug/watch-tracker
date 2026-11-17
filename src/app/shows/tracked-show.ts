import { type ShowStatus } from './show-status';
import { StreamingService } from './streaming-service';

// Absent on a show means not started.
export interface EpisodeRef {
  readonly season: number;
  readonly episode: number;
}

// A show as the API sends it. Timestamps are ISO strings.
export interface TrackedShow {
  readonly id: number;
  readonly title: string;
  readonly status: ShowStatus;
  readonly service?: StreamingService;
  readonly lastWatched?: EpisodeRef;
  readonly addedAt: string;
  readonly updatedAt: string;
}

export type ShowId = TrackedShow['id'];

export type ShowPostModel = Omit<TrackedShow, 'id' | 'addedAt' | 'updatedAt'>;

export function getNextEpisodeRef(lastWatched?: EpisodeRef): EpisodeRef {
  if (!lastWatched) return { season: 1, episode: 1 };
  return { season: lastWatched.season, episode: lastWatched.episode + 1 };
}

export function canMarkNextEpisodeAsWatched(show: TrackedShow): boolean {
  const status = show.status;
  return status === 'watching' || status === 'want-to-watch';
}
