import { Component, computed, ElementRef, inject, linkedSignal } from '@angular/core';
import { ShowStore, InitialLoadState } from '../shows/show-store';
import { ShowList } from '../shows/show-list/show-list';
import { ShowListEmpty } from '../shows/show-list-empty/show-list-empty';
import { RouterLink } from '@angular/router';
import { SvgIcon } from '../shared/svg-icon/svg-icon';
import { PageHeader } from '../shared/page-header/page-header';
import {EpisodeStepRequest, ShowId} from '../shows/tracked-show';
import { ShowListSkeleton } from '../shows/show-list-skeleton/show-list-skeleton';
import { AlertError } from '../shared/alert-error/alert-error';
import {AlertFloating} from '../shared/alert-floating/alert-floating';
import { toSpokenSeasonAndEpisode } from '../shows/progress-pipe';

@Component({
  selector: 'app-home',
  template: `
    <app-page-header heading="Continue watching" [description]="watchingText()"></app-page-header>

    @if (displayLoading()) {
      <app-show-list-skeleton />
    } @else if (displayLoadingError()) {
      <app-show-list-empty
        role="alert"
        iconName="alert-circle"
        heading="Couldn't load your shows"
        description="Check your connection and try again."
      >
        <button type="button" class="button button-secondary" (click)="tryAgain()">
          Try again
        </button>
      </app-show-list-empty>
    } @else {
      @if (watching().length > 0) {
        <app-show-list [shows]="watching()" (episodeStepped)="episodeStepped($event)"/>
      } @else {
        <app-show-list-empty
          iconName="tv"
          heading="Nothing on the go yet"
          description="Add the shows you're watching, and you'll always know where you stopped – and where to pick up."
        >
          <a routerLink="/shows/add" class="button button-primary">
            <app-svg-icon name="plus" />
            Add your first show
          </a>
        </app-show-list-empty>
      }

      @if (refreshFailedMessage() || stepEpisodeFailedMessage()) {
        <app-alert-error appAlertFloating dismissible (dismissed)="dismissFailedMessages()">
          @if (refreshFailedMessage(); as message) {
            <p>{{ message }}</p>
          }
          @if (stepEpisodeFailedMessage(); as message) {
            <p>{{ message }}</p>
          }
        </app-alert-error>
      }
    }

    <!-- Outside the @if, so it is in the DOM before its text changes. -->
    <p class="visually-hidden" aria-live="polite">{{ episodeStepAnnouncement() }}</p>
  `,
  imports: [ShowList, ShowListEmpty, RouterLink, SvgIcon, PageHeader, ShowListSkeleton, AlertError, AlertFloating],
})
export class Home {
  private readonly showStore = inject(ShowStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // The order the first time the list is loaded, null until then, and kept after that. A tapped
  // card stays where it is and moves to the top the next time the page opens.
  private readonly openedOrder = linkedSignal<InitialLoadState, ShowId[] | null>({
    source: this.showStore.initialLoad,
    computation: (initialLoadState, previous) => {
      if (previous?.value) return previous.value;
      if (initialLoadState === 'succeeded') return this.showStore.watching().map((show) => show.id);
      return null;
    },
  });

  protected readonly refreshFailedMessage = computed(() =>
    this.showStore.refreshHasFailed() ? "Couldn't refresh your shows." : null,
  );

  protected readonly stepEpisodeFailedMessage = computed(() => {
    const failedEpisodeStep = this.showStore.failedEpisodeStep();
    if (failedEpisodeStep === null) return null;

    const failedShow = this.showStore.getShowById(failedEpisodeStep.showId);

    if (failedEpisodeStep.step === 'next') {
      return failedShow
        ? `Couldn't mark the next episode of ${failedShow.title} as watched.`
        : "Couldn't mark the next episode as watched.";
    }

    return failedShow
      ? `Couldn't mark the last episode of ${failedShow.title} as not watched.`
      : "Couldn't mark the last episode as not watched.";
  });

  // From the step's answer, not the list, so fetching the list again is never read out.
  protected readonly episodeStepAnnouncement = computed(() => {
    const show = this.showStore.lastSteppedShow();
    if (show === null) return '';
    if (!show.lastWatched) return `${show.title}: not started`;
    return `${show.title}: last watched ${toSpokenSeasonAndEpisode(show.lastWatched)}`;
  });

  protected readonly displayLoading = computed(() => this.showStore.initialLoad() === 'loading');
  protected readonly displayLoadingError = computed(() => this.showStore.initialLoad() === 'failed');

  protected readonly watching = computed(() => {
    const openedOrder = this.openedOrder();

    if (openedOrder === null) return [];

    const known = new Set(openedOrder);

    const current = this.showStore.watching();
    const showsById = new Map(current.map((show) => [show.id, show]));

    // Started after the page opened, so they are the newest
    const added = current.filter((show) => !known.has(show.id));
    const kept = openedOrder.map((id) => showsById.get(id)).filter((show) => show !== undefined);

    return [...added, ...kept];
  });

  protected readonly watchingText = computed(() => {
    if (this.displayLoading()) return 'Loading…';
    if (this.showStore.initialLoad() !== 'succeeded') return undefined;
    const count = this.watching().length;
    return `${count} ${count === 1 ? 'show' : 'shows'} in progress`;
  });

  protected episodeStepped(stepRequest: EpisodeStepRequest) {
    this.showStore.stepEpisode(stepRequest);
  }

  // The close button goes with the message, and focus would go with it. The page stays where it
  // was scrolled.
  protected dismissFailedMessages(): void {
    this.showStore.clearRefreshFailed();
    this.showStore.clearFailedEpisodeStep()
    this.host.nativeElement.querySelector('h1')?.focus({ preventScroll: true });
  }

  // The button goes away while the list loads, and focus would go with it.
  protected tryAgain(): void {
    this.showStore.load();
    this.host.nativeElement.querySelector('h1')?.focus();
  }
}
