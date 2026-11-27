import {Component, computed, input, output} from '@angular/core';
import {
  EpisodeStep, statusAllowsSteps,
  TrackedShow
} from '../tracked-show';
import { streamingServiceDisplayName } from '../streaming-service';
import { DatePipe } from '@angular/common';
import {RouterLink} from '@angular/router';
import {EpisodeStepper} from '../episode-stepper/episode-stepper';
import {ProgressPipe, toSpokenSeasonAndEpisode} from '../progress-pipe';

@Component({
  imports: [DatePipe, RouterLink, EpisodeStepper, ProgressPipe],
  selector: 'app-show-card',
  styles: `
    @use '../show-card-sizes' as card;

    @include card.layout;

    :host {
      display: block;
      height: 100%;
      --show-details-separator-size: 3px;
    }

    .show-card {
      position: relative;
      height: 100%;

      &:has(a:focus-visible) {
        border-color: var(--color-accent);

        a:focus {
          outline: none;
        }
      }

    }

    .show-card {
      transition: background-color 150ms ease-out, border-color 150ms ease-out;
    }

    @media (hover: hover) {
      .show-card:has(.show-title a:hover) {
        background-color: color-mix(in srgb, var(--color-surface), var(--color-text) 6%);
      }
    }

    // As tall as the stepper, so the value sits at the same height on every card.
    .progress {
      display: flex;
      align-items: center;
      min-height: var(--touch-target);
      font-variant-numeric: tabular-nums;
    }

    .show-thumbnail {
      color: var(--color-text-muted);
      font-size: var(--font-size-small);
      font-weight: 700;
    }

    .show-title {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
      font-size: var(--font-size-medium);
      font-weight: 600;
      line-height: card.$title-line-height;

      a::after {
        display: block;
        content: '';
        position: absolute;
        inset: 0;
      }
    }

    .show-details {
      display: flex;
      align-items: center;
      gap: var(--spacing-half);
      white-space: nowrap;
      font-size: var(--font-size-small);
      line-height: card.$details-line-height;
      color: var(--color-text-muted);
    }

    .show-details-separator {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      width: var(--show-details-separator-size);
      height: var(--show-details-separator-size);
      border-radius: 50%;
      background: var(--color-text-muted);
    }

    // Truncate the service, not the date – the date is the shorter, fixed-length part.
    .streaming-service {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
  template: `
    <article class="show-card card">
      <!-- TODO: the show's TMDB poster in M3 (D115). -->
      <div class="show-thumbnail" [attr.aria-hidden]="true">N/A</div>

      <div class="show-info">
        <div class="show-heading">
          <h2 class="show-title">
            <a [routerLink]="['/shows', show().id, 'edit']">
              {{ show().title }}
            </a>
          </h2>

          <div class="show-details">
            @if (show().service; as service) {
              <span class="streaming-service">{{ serviceName(service) }}</span>
              <div class="show-details-separator"></div>
            }

            <time class="updated-at" [dateTime]="show().updatedAt">
              {{ show().updatedAt | date: 'd MMM' }}
            </time>
          </div>
        </div>

        @if (showEpisodeStepper()) {
          <app-episode-stepper [show]="show()" (stepped)="stepped.emit($event)"/>
        } @else {
          <p class="progress">
            <span class="visually-hidden">{{ lastWatchedSpoken() }}</span>
            <span [attr.aria-hidden]="true">{{ show().lastWatched | progress }}</span>
          </p>
        }
      </div>
    </article>
  `,
})
export class ShowCard {
  readonly show = input.required<TrackedShow>();

  readonly stepped = output<EpisodeStep>();

  protected readonly serviceName = streamingServiceDisplayName;

  protected readonly showEpisodeStepper = computed(() => statusAllowsSteps(this.show()));

  // Only shown on Finished and Dropped cards, which have text instead of the stepper.
  protected readonly lastWatchedSpoken = computed(() => {
    const { status, lastWatched } = this.show();
    if (!lastWatched) return 'Not started';
    const prefix = status === 'finished' ? 'Ended at' : 'Stopped at';
    return `${prefix} ${toSpokenSeasonAndEpisode(lastWatched)}`;
  });
}
