import { Service, computed, signal, inject } from '@angular/core';
import { ShowId, ShowPostModel, TrackedShow } from './tracked-show';
import { ShowApi } from './show-api';
import { catchError, concatMap, EMPTY, Observable, of, Subject, tap, throwError } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';

export type ShowStoreStatus = 'loading' | 'loaded' | 'error';

@Service()
export class ShowStore {
  private readonly showApi = inject(ShowApi);

  private readonly _shows = signal<TrackedShow[]>([]);
  readonly shows = this._shows.asReadonly();

  private readonly _status = signal<ShowStoreStatus>('loading');
  readonly status = this._status.asReadonly();
  readonly status$ = toObservable(this.status);

  private readonly _nextEpisodeFailedFor = signal<ShowId | null>(null);
  readonly nextEpisodeFailedFor = this._nextEpisodeFailedFor.asReadonly();

  private readonly nextEpisodeQueue = new Subject<ShowId>();

  readonly watching = computed(() => {
    const filtered = this.shows().filter((show) => show.status === 'watching');
    return [...filtered].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  });

  constructor() {
    this.load();

    this.nextEpisodeQueue
      .pipe(
        concatMap((showId) =>
          this.showApi.markNextEpisodeAsWatched(showId).pipe(
            catchError((error: unknown) => {
              const show = this.getShowById(showId);
              this._nextEpisodeFailedFor.set(showId);
              console.error(
                `Could not mark next episode as watched for ${show?.title ?? 'show'} (id: ${showId})`,
                error,
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (updatedShow) => {
          this.replaceShow(updatedShow);
        },
      });
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
    return this.showApi.deleteShow(id).pipe(
      // A 404 means the show is already gone/deleted, so it counts as deleted.
      catchError((error: unknown) => {
        return error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound
          ? of(undefined)
          : throwError(() => error);
      }),
      tap(() => this._shows.update((shows) => shows.filter((show) => show.id !== id))),
    );
  }

  markNextEpisodeAsWatched(showId: ShowId): void {
    this.clearNextEpisodeFailure();
    this.nextEpisodeQueue.next(showId);
  }

  clearNextEpisodeFailure(): void {
    this._nextEpisodeFailedFor.set(null);
  }
}
