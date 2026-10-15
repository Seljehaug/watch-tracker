import type { ShowStatus } from './show-status';
import type { StreamingService } from './streaming-service';

// Absent on a show means not started.
export interface EpisodeRef {
  readonly season: number;
  readonly episode: number;
}

// Timestamps are ISO strings – they survive the JSON round trip to storage.
export interface TrackedShow {
  readonly id: string;
  readonly title: string;
  readonly status: ShowStatus;
  readonly service?: StreamingService;
  readonly lastWatched?: EpisodeRef;
  readonly addedAt: string;
  readonly updatedAt: string;
}
