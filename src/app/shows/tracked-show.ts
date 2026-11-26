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

export type EpisodeStep = 'next' | 'previous';

export interface EpisodeStepRequest {
  showId: ShowId;
  step: EpisodeStep;
}


export function getNextEpisodeRef(lastWatched?: EpisodeRef): EpisodeRef {
  if (!lastWatched) return { season: 1, episode: 1 };
  return { season: lastWatched.season, episode: lastWatched.episode + 1 };
}

// E01 of a later season would need the earlier season's length, which isn't known.
export function canStepToPreviousEpisode(show: TrackedShow): boolean {
  if (!statusAllowsSteps(show)) return false;
  const lastWatched = show.lastWatched;
  if (!lastWatched) return false;
  return lastWatched.season === 1 || lastWatched.episode > 1;
}

export function statusAllowsSteps(show: TrackedShow): boolean {
  const status = show.status;
  return status === 'watching' || status === 'want-to-watch';
}
