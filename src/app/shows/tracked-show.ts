import { isShowStatus, type ShowStatus } from './show-status';
import { isStreamingService, StreamingService } from './streaming-service';

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

export type NewShow = Omit<TrackedShow, 'id' | 'addedAt' | 'updatedAt'>;

export function isEpisodeRef(value: unknown): value is EpisodeRef {
  if (value === null || typeof value !== 'object') return false;
  const fields = value as Record<string, unknown>;

  if (typeof fields['season'] !== 'number') return false;
  if (typeof fields['episode'] !== 'number') return false;

  return true;
}

export function isTrackedShow(value: unknown): value is TrackedShow {
  if (value === null || typeof value !== 'object') return false;
  const fields = value as Record<string, unknown>;

  if (typeof fields['id'] !== 'string') return false;
  if (typeof fields['title'] !== 'string') return false;
  if (!isShowStatus(fields['status'])) return false;
  if (fields['service'] !== undefined && !isStreamingService(fields['service'])) return false;
  if (fields['lastWatched'] !== undefined && !isEpisodeRef(fields['lastWatched'])) return false;
  if (typeof fields['addedAt'] !== 'string') return false;
  if (typeof fields['updatedAt'] !== 'string') return false;

  return true;
}
