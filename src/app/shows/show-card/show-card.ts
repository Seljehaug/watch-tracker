import { Component, computed, input, output } from '@angular/core';
import { canMarkNextEpisodeAsWatched, getNextEpisodeRef, TrackedShow } from '../tracked-show';
import { streamingServiceDisplayName } from '../streaming-service';
import { SvgIcon } from '../../shared/svg-icon/svg-icon';
import { DatePipe } from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  imports: [SvgIcon, DatePipe, RouterLink],
  selector: 'app-show-card',
  styles: `
    :host {
      display: block;
      --thumbnail-width: 3rem;
      --increment-button-size: var(--touch-target);
      --show-details-separator-size: 3px;
    }

    .show-card {
      display: grid;
      grid-template-columns: var(--thumbnail-width) minmax(0, 1fr) auto;
      gap: var(--spacing-half);
      align-items: center;
      padding: var(--spacing-1);
      background: var(--color-surface);
      border: 1px solid var(--color-divider);
      border-radius: var(--border-radius);
      position: relative;

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

    // 2:3 like a TMDB poster, so nothing moves when real posters arrive (M3).
    .show-thumbnail {
      aspect-ratio: 2 / 3;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: calc(var(--border-radius) / 2);
      background: var(--color-divider);
      color: var(--color-text-muted);
      font-size: var(--font-size-small);
      font-weight: 700;
    }

    .show-title {
      font-size: var(--font-size-medium);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      a::after {
        display: block;
        content: '';
        position: absolute;
        inset: 0;
      }
    }

    .show-last-watched {
      font-size: var(--font-size-medium);
    }

    .show-details {
      display: flex;
      align-items: center;
      gap: var(--spacing-half);
      white-space: nowrap;
      color: var(--color-text-muted);
    }

    .show-details-separator {
      display: flex;
      justify-content: center;
      align-items: center;
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

    .show-increment-button {
      // TODO should have a button component with common styles?
      width: var(--increment-button-size);
      aspect-ratio: 1;
      border-radius: var(--border-radius);
      border: 1px solid var(--color-accent-border);
      color: var(--color-accent);
      background: var(--color-accent-soft);
      z-index: 1;
      position: relative;
    }
  `,
  template: `
    <article class="show-card">
      <div class="show-image" [attr.aria-hidden]="true">
        <!-- TODO get the actual thumbnail for the tv show and show as image -->
        <div class="show-thumbnail">N/A</div>
      </div>

      <div class="show-info">
        <h2 class="show-title">
          <a [routerLink]="['/shows', show().id, 'edit']">
            {{ show().title }}
          </a>
        </h2>

        <p class="show-last-watched">
          <span class="visually-hidden">
            {{ lastWatchedSpoken() }}
          </span>
          <span class="show-last-watched" [attr.aria-hidden]="true">
            {{ lastWatchedDisplay() }}
          </span>
        </p>

        <div class="show-details">
          @if (show().service; as service) {
            <span class="streaming-service">{{ serviceName(service) }}</span>
          }

          <div class="show-details-separator"></div>

          <time class="updated-at" [dateTime]="show().updatedAt">{{
            show().updatedAt | date: 'd MMM'
          }}</time>
        </div>
      </div>

      @if (canMarkNextEpisode(show())) {
        <button
          type="button"
          (click)="nextEpisodeWatched.emit(show().id)"
          [attr.aria-label]="nextEpisodeLabel()"
          class="show-increment-button"
        >
          <app-svg-icon name="plus" />
        </button>
      }
    </article>
  `,
})
export class ShowCard {
  // Inputs
  readonly show = input.required<TrackedShow>();

  // Outputs
  readonly nextEpisodeWatched = output<string>();

  // State
  protected readonly lastWatchedDisplay = computed(() => {
    const lastWatched = this.show().lastWatched;
    if (!lastWatched) return 'Not started';
    return `S${lastWatched.season.toString().padStart(2, '0')} E${lastWatched.episode.toString().padStart(2, '0')}`;
  });

  // "S02 E05" read aloud says neither what it is nor which season and episode.
  protected readonly lastWatchedSpoken = computed(() => {
    const lastWatched = this.show().lastWatched;
    if (!lastWatched) return 'Not started';
    return `Last watched: season ${lastWatched.season}, episode ${lastWatched.episode}`;
  });

  protected readonly nextEpisodeLabel = computed(() => {
    const next = getNextEpisodeRef(this.show().lastWatched);
    return `Mark season ${next.season}, episode ${next.episode} of ${this.show().title} as watched`;
  });

  // Functions for the template
  protected readonly serviceName = streamingServiceDisplayName;
  protected readonly canMarkNextEpisode = canMarkNextEpisodeAsWatched;
}
