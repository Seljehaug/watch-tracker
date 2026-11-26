import {Component, computed, input, output} from '@angular/core';
import {
  canStepToPreviousEpisode,
  EpisodeStep,
  getNextEpisodeRef,
  statusAllowsSteps,
  TrackedShow
} from '../tracked-show';
import {ProgressPipe} from '../progress-pipe';
import {SvgIcon} from '../../shared/svg-icon/svg-icon';

@Component({
  imports: [
    ProgressPipe,
    SvgIcon
  ],
  selector: 'app-episode-stepper',
  styles: `
    :host {
      --pill-height: 2rem;
      --button-width: 2.25rem;

      // Above the title link, which is stretched over the whole card.
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      width: fit-content;
      height: var(--pill-height);
      border-radius: 999px;
      background: var(--color-text-soft);
    }

    .episode-stepper-button {
      position: relative;
      flex-shrink: 0;
      width: var(--button-width);
      height: var(--pill-height);
      // The pill is smaller than --touch-target; the touch area below makes up for it.
      min-width: 0;
      min-height: 0;
      padding: 0;
      border: none;
      border-radius: 999px;
      color: var(--color-text-muted);
      background: transparent;

      // The invisible touch area, --touch-target square.
      &::after {
        content: '';
        position: absolute;
        inset: calc((var(--pill-height) - var(--touch-target)) / 2)
          calc((var(--button-width) - var(--touch-target)) / 2);
      }

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

    // The padding keeps a button's focus ring off the text.
    .progress-text {
      padding-inline: var(--spacing-half);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;

      &.not-started {
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
      <app-svg-icon name="minus" size="small"></app-svg-icon>
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
      <app-svg-icon name="plus" size="small"></app-svg-icon>
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

    return `Mark season ${lastWatched.season}, episode ${lastWatched.episode} of ${title} as not watched`;
  });

  protected readonly lastWatchedSpoken = computed(() => {
    const lastWatched = this.show().lastWatched;
    if (!lastWatched) return 'Not started';
    return `Last watched: season ${lastWatched.season}, episode ${lastWatched.episode}`;
  });

  protected readonly nextEpisodeLabel = computed(() => {
    const { title, status, lastWatched } = this.show();
    const next = getNextEpisodeRef(lastWatched);
    if (status === 'want-to-watch') {
      return `Start ${title}: mark season ${next.season}, episode ${next.episode} as watched`;
    }
    return `Mark season ${next.season}, episode ${next.episode} of ${title} as watched`;
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
