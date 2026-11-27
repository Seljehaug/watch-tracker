import {Component, computed, input, output} from '@angular/core';
import {
  canStepToPreviousEpisode,
  EpisodeStep,
  getNextEpisodeRef,
  statusAllowsSteps,
  TrackedShow
} from '../tracked-show';
import {ProgressPipe, toSpokenSeasonAndEpisode} from '../progress-pipe';
import {SvgIcon} from '../../shared/svg-icon/svg-icon';

@Component({
  imports: [
    ProgressPipe,
    SvgIcon
  ],
  selector: 'app-episode-stepper',
  styles: `
    @use '../show-card-sizes' as card;

    :host {
      // Above the title link, which is stretched over the whole card.
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: var(--color-text-soft);
    }

    .episode-stepper-button {
      flex-shrink: 0;
      height: var(--touch-target);
      min-width: var(--touch-target);
      padding: 0;
      border: none;
      border-radius: 999px;
      color: var(--color-text-muted);
      background: transparent;

      @media (hover: hover) {
        &:hover:not([aria-disabled='true']) {
          background: var(--color-text-soft);
        }
      }

      &:active:not([aria-disabled='true']) {
        background: var(--color-text-soft);
      }

      &[aria-disabled='true'] {
        opacity: 0.4;
      }
    }

    .increase {
      color: var(--color-accent);
    }

    // One width in every state, so + stays put when "Not started" becomes "S01 E01", and wide
    // enough to keep the buttons' focus rings off the text. A rare wider value grows it.
    .progress-text {
      min-width: card.$stepper-value-width;
      text-align: center;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;

      &.not-started {
        font-size: var(--font-size-small);
        color: var(--color-text-muted);
      }
    }
  `,
  template: `
    <button
      type="button"
      class="episode-stepper-button"
      (click)="stepToPreviousEpisode()"
      [attr.aria-label]="previousEpisodeLabel()"
      [attr.aria-disabled]="!canStepToPrevious() || null"
    >
      <app-svg-icon name="minus"></app-svg-icon>
    </button>

    <span class="progress-text" [class.not-started]="!show().lastWatched">
      <span class="visually-hidden">{{ lastWatchedSpoken() }}</span>
      <span [attr.aria-hidden]="true">{{ show().lastWatched | progress }}</span>
    </span>

    <button
      type="button"
      class="episode-stepper-button increase"
      (click)="stepToNextEpisode()"
      [attr.aria-label]="nextEpisodeLabel()"
      [attr.aria-disabled]="!canStepToNext() || null"
    >
      <app-svg-icon name="plus"></app-svg-icon>
    </button>
  `,
})
export class EpisodeStepper {
  readonly show = input.required<TrackedShow>();

  readonly stepped = output<EpisodeStep>()

  protected readonly canStepToPrevious = computed(() => canStepToPreviousEpisode(this.show()));
  protected readonly canStepToNext = computed(() => statusAllowsSteps(this.show()));

  protected readonly previousEpisodeLabel = computed(() => {
    const { title, lastWatched } = this.show();

    // Not started: − is disabled, but it can still get focus, so it still needs a name.
    if (!lastWatched) return `Mark the last watched episode of ${title} as not watched`;

    return `Mark ${toSpokenSeasonAndEpisode(lastWatched)} of ${title} as not watched`;
  });

  protected readonly lastWatchedSpoken = computed(() => {
    const lastWatched = this.show().lastWatched;
    if (!lastWatched) return 'Not started';
    return `Last watched: ${toSpokenSeasonAndEpisode(lastWatched)}`;
  });

  protected readonly nextEpisodeLabel = computed(() => {
    const { title, status, lastWatched } = this.show();
    const next = toSpokenSeasonAndEpisode(getNextEpisodeRef(lastWatched));
    if (status === 'want-to-watch') {
      return `Start ${title}: mark ${next} as watched`;
    }
    return `Mark ${next} of ${title} as watched`;
  });

  stepToPreviousEpisode() {
    if (!this.canStepToPrevious()) return;
    this.stepped.emit('previous');
  }

  stepToNextEpisode() {
    if (!this.canStepToNext()) return;
    this.stepped.emit('next');
  }
}
