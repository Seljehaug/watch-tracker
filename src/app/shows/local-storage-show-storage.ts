import { Service } from '@angular/core';
import { ShowStorage } from './show-storage';
import { isTrackedShow, TrackedShow } from './tracked-show';

interface StoredShows {
  version: number;
  shows: unknown[];
}

function isStoredShows(value: unknown): value is StoredShows {
  if (value === null || typeof value !== 'object') return false;
  const fields = value as Record<string, unknown>;

  if (typeof fields['version'] !== 'number') return false;
  if (!Array.isArray(fields['shows'])) return false;

  return true;
}

const STORAGE_KEY = 'watch-tracker.shows';

@Service()
export class LocalStorageShowStorage extends ShowStorage {
  load(): TrackedShow[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    let parsed: unknown;

    try {
      parsed = JSON.parse(data);
    } catch (error) {
      console.warn('Could not parse stored shows', error);
      return [];
    }

    if (!isStoredShows(parsed)) return [];
    if (parsed.version !== 1) return [];

    const valid = parsed.shows.filter((show) => isTrackedShow(show));

    if (valid.length !== parsed.shows.length) {
      console.warn(`Discarded ${parsed.shows.length - valid.length} invalid shows`);
    }

    return valid;
  }

  save(shows: TrackedShow[]): void {
    const data = JSON.stringify({
      version: 1,
      shows: shows,
    });

    localStorage.setItem(STORAGE_KEY, data);
  }
}
