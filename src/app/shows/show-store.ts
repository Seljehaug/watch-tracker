import { Service, computed, signal, inject } from '@angular/core';
import { ShowId, ShowPostModel, TrackedShow } from './tracked-show';
import { ShowApi } from './show-api';
import { Observable, tap } from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';

export type ShowStoreStatus = 'loading' | 'loaded' | 'error';

@Service()
export class ShowStore {
  private readonly showApi = inject(ShowApi);

  private readonly _shows = signal<TrackedShow[]>([]);
  readonly shows = this._shows.asReadonly();

  private readonly _status = signal<ShowStoreStatus>('loading');
  readonly status = this._status.asReadonly();
  readonly status$ = toObservable(this.status);

  readonly watching = computed(() => {
    const filtered = this.shows().filter((show) => show.status === 'watching');
    return [...filtered].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this._status.set('loading');

    this.showApi.getShows().subscribe({
      next: (shows) => {
        this._shows.set(shows);
        this._status.set('loaded');
      },
      error: (error: unknown) => {
        this._status.set('error');
        console.error('Could not load shows', error);
      },
    });
  }

  getShowById(showId: ShowId): TrackedShow | null {
    return this._shows().find((show) => show.id === showId) ?? null;
  }

  showExists(showId: ShowId): boolean {
    return this.getShowById(showId) !== null;
  }

  add(postModel: ShowPostModel): Observable<TrackedShow> {
    return this.showApi.addShow(postModel).pipe(
      tap((addedShow) => {
        this._shows.update((shows) => [addedShow, ...shows]);
      }),
    );
  }

  update(id: ShowId, postModel: ShowPostModel): Observable<TrackedShow> {
    return this.showApi
      .updateShow(id, postModel)
      .pipe(tap((updatedShow) => this.replaceShow(updatedShow)));
  }

  private replaceShow(updatedShow: TrackedShow): void {
    this._shows.update((shows) => {
      return shows.map((show) => (show.id === updatedShow.id ? updatedShow : show));
    });
  }

  delete(id: ShowId): Observable<void> {
    return this.showApi
      .deleteShow(id)
      .pipe(tap(() => this._shows.update((shows) => shows.filter((show) => show.id !== id))));
  }

  markNextEpisodeAsWatched(id: ShowId): void {
    this.showApi.markNextEpisodeAsWatched(id).subscribe({
      next: (updatedShow) => {
        this.replaceShow(updatedShow);
      },
      error: (error: unknown) => {
        console.error('Could not mark the next episode', error);
      },
    });
  }
}
