import type { TrackedShow } from './tracked-show';

export abstract class ShowStorage {
  abstract load(): TrackedShow[];
  abstract save(shows: TrackedShow[]): void;
}
