import { Service, computed, signal, inject, DOCUMENT } from '@angular/core';
import {EpisodeStepRequest, ShowId, ShowPostModel, TrackedShow} from './tracked-show';
import { ShowApi } from './show-api';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  EMPTY,
  filter,
  fromEvent,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { AuthStore } from '../auth/auth-store';

export type InitialLoadState = 'loading' | 'failed' | 'succeeded';

type LoadRequest = 'fetch' | 'stop';

@Service()
export class ShowStore {
  private readonly document = inject(DOCUMENT);
  private readonly showApi = inject(ShowApi);
  private readonly authStore = inject(AuthStore);

  private readonly _shows = signal<TrackedShow[]>([]);
  readonly shows = this._shows.asReadonly();

  // A BehaviorSubject hands the current state to a new subscriber at once, and toSignal updates
  // the signal in the same call, so showExistsGuard sees a change made just before it runs.
  private readonly initialLoadSubject = new BehaviorSubject<InitialLoadState>('loading');
  readonly initialLoad$ = this.initialLoadSubject.asObservable();
  readonly initialLoad = toSignal(this.initialLoad$, { requireSync: true });

  private readonly _failedEpisodeStep = signal<EpisodeStepRequest | null>(null);
  readonly failedEpisodeStep = this._failedEpisodeStep.asReadonly();

  private readonly _lastSteppedShow = signal<TrackedShow | null>(null);
  readonly lastSteppedShow = this._lastSteppedShow.asReadonly();

  private readonly _refreshHasFailed = signal(false);
  readonly refreshHasFailed = this._refreshHasFailed.asReadonly();

  private readonly isFetching = signal(false);

  private readonly episodeStepQueue = new Subject<EpisodeStepRequest>();

  private readonly loadRequests = new Subject<LoadRequest>();

  readonly watching = computed(() => {
    const filtered = this.shows().filter((show) => show.status === 'watching');
    return [...filtered].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  });

  constructor() {
    this.loadRequests
      .pipe(
        switchMap((request) => {
          if (request === 'stop') return EMPTY;

          return this.showApi.getShows().pipe(
            catchError((error: unknown) => {
              if (this.initialLoad() === 'succeeded') {
                this._refreshHasFailed.set(true);
              } else {
                this.initialLoadSubject.next('failed');
              }
              console.error('Could not load shows', error);
              this.isFetching.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (shows) => {
          this._refreshHasFailed.set(false);
          this._shows.set(shows);
          this.initialLoadSubject.next('succeeded');
          this.isFetching.set(false);
        },
      });

    this.episodeStepQueue
      .pipe(
        concatMap((stepRequest) => {
          const save$ =
            stepRequest.step === 'next'
              ? this.showApi.stepToNextEpisode(stepRequest.showId)
              : this.showApi.stepToPreviousEpisode(stepRequest.showId);

          return save$.pipe(
            catchError((error: unknown) => {
              const show = this.getShowById(stepRequest.showId);
              this._failedEpisodeStep.set(stepRequest);
              console.error(
                `Could not step to the ${stepRequest.step} episode of ${show?.title ?? 'show'} (id: ${stepRequest.showId})`,
                error,
              );
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (updatedShow) => {
          this.replaceShow(updatedShow);
          this._lastSteppedShow.set(updatedShow);
        },
      });

    fromEvent(this.document, 'visibilitychange')
      .pipe(
        filter(() => this.document.visibilityState === 'visible'),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: () => {
          this.load();
        },
      });

    this.authStore.authState$.pipe(takeUntilDestroyed()).subscribe({
      next: (authState) => {
        switch (authState.status) {
          // The guard lets a failed check through, so the list is fetched and Home shows its error.
          case 'loggedIn':
          case 'failed':
            this.load();
            break;
          case 'checking':
            break;
          case 'loggedOut':
            this.reset();
            break;
        }
      },
    });
  }

  load(): void {
    if (this.authStore.authState().status === 'loggedOut') return;

    if (this.initialLoad() !== 'succeeded') {
      this.initialLoadSubject.next('loading');
    }

    this.isFetching.set(true);

    this.loadRequests.next('fetch');
  }

  private reset(): void {
    this._shows.set([]);
    this.initialLoadSubject.next('loading');
    this.clearRefreshFailed();
    this.clearFailedEpisodeStep();
    this._lastSteppedShow.set(null);
    this.loadRequests.next('stop');
    this.isFetching.set(false);
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
        this.restartFetchIfRunning();
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
    this.restartFetchIfRunning();
  }

  delete(id: ShowId): Observable<void> {
    return this.showApi.deleteShow(id).pipe(
      // A 404 means the show is already gone/deleted, so it counts as deleted.
      catchError((error: unknown) => {
        return error instanceof HttpErrorResponse && error.status === HttpStatusCode.NotFound
          ? of(undefined)
          : throwError(() => error);
      }),
      tap(() => {
        this._shows.update((shows) => shows.filter((show) => show.id !== id));
        this.restartFetchIfRunning();
      }),
    );
  }

  stepEpisode(stepRequest: EpisodeStepRequest): void {
    this.clearFailedEpisodeStep();
    // Emptied, so an answer with the same text as the last one is still read out.
    this._lastSteppedShow.set(null);
    this.episodeStepQueue.next(stepRequest);
  }

  clearFailedEpisodeStep(): void {
    this._failedEpisodeStep.set(null);
  }

  clearRefreshFailed(): void {
    this._refreshHasFailed.set(false);
  }

  // Called once a write's answer is in the list. A fetch already on its way may have read the
  // shows before that write was saved, and its answer would put the old version back.
  private restartFetchIfRunning(): void {
    if (this.isFetching()) {
      this.load();
    }
  }
}
