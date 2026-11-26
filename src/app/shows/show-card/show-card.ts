import {Component, input, output} from '@angular/core';
import {
  EpisodeStep,
  TrackedShow
} from '../tracked-show';
import { streamingServiceDisplayName } from '../streaming-service';
import { DatePipe } from '@angular/common';
import {RouterLink} from '@angular/router';
import {EpisodeStepper} from '../episode-stepper/episode-stepper';

@Component({
  imports: [DatePipe, RouterLink, EpisodeStepper],
  selector: 'app-show-card',
  styles: `
    :host {
      display: block;
      --thumbnail-width: 3rem;
      --show-details-separator-size: 3px;
    }

    .show-card {
      display: grid;
      grid-template-columns: var(--thumbnail-width) minmax(0, 1fr);
      gap: var(--spacing-1);
      align-items: center;
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
      background: var(--color-placeholder);
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

    .show-details {
      display: flex;
      align-items: center;
      gap: var(--spacing-half);
      white-space: nowrap;
      color: var(--color-text-muted);
      margin-bottom: var(--spacing-half);
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
  `,
  template: `
    <article class="show-card card">
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

        <div class="show-details">
          @if (show().service; as service) {
            <span class="streaming-service">{{ serviceName(service) }}</span>
          }

          <div class="show-details-separator"></div>

          <time class="updated-at" [dateTime]="show().updatedAt">
            {{ show().updatedAt | date: 'd MMM' }}
          </time>
        </div>

        <app-episode-stepper [show]="show()" (stepped)="stepped.emit($event)"/>
      </div>
    </article>
  `,
})
export class ShowCard {
  readonly show = input.required<TrackedShow>();

  readonly stepped = output<EpisodeStep>();

  protected readonly serviceName = streamingServiceDisplayName;
}
