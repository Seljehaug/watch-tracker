import { Service, computed, signal, inject } from '@angular/core';
import type { NewShow, TrackedShow } from './tracked-show';
import { ShowStorage } from './show-storage';

@Service()
export class ShowStore {
  private readonly storage: ShowStorage = inject(ShowStorage);

  private readonly _shows = signal<TrackedShow[]>(this.storage.load());

  readonly shows = this._shows.asReadonly();

  readonly watching = computed(() => {
    const filtered = this.shows().filter((show) => show.status === 'watching');
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  add(newShow: NewShow): TrackedShow {
    const nowAsISO = new Date().toISOString();

    const newTrackedShow: TrackedShow = {
      ...newShow,
      id: crypto.randomUUID(),
      addedAt: nowAsISO,
      updatedAt: nowAsISO,
    };

    this.updateAndSave((shows) => [...shows, newTrackedShow]);

    return newTrackedShow;
  }

  remove(id: string): void {
    this.updateAndSave((shows) => shows.filter((show) => show.id !== id));
  }

  update(id: string, changes: Partial<NewShow>): void {
    this.updateAndSave((shows) => {
      const nowAsISO = new Date().toISOString();
      return shows.map((show) =>
        show.id === id ? { ...show, ...changes, updatedAt: nowAsISO } : show,
      );
    });
  }

  private updateAndSave(updateFunction: (shows: TrackedShow[]) => TrackedShow[]): void {
    this._shows.update(updateFunction);
    this.storage.save(this._shows());
  }
}
