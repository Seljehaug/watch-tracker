import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-show-list-skeleton',
  styles: `
    :host {
      display: block;
      // Same as ShowCard's, so a placeholder is as tall as a card.
      --thumbnail-width: 3rem;
    }

    .show-list {
      margin-top: var(--spacing-1);
    }

    .skeleton-card {
      display: grid;
      grid-template-columns: var(--thumbnail-width) minmax(0, 1fr);
      gap: var(--spacing-half);
      align-items: center;
    }

    .skeleton-thumbnail,
    .skeleton-line {
      background: var(--color-placeholder);
    }

    .skeleton-thumbnail {
      aspect-ratio: 2 / 3;
      border-radius: calc(var(--border-radius) / 2);
    }

    // As tall as the card's text and spaced like its lines (line height 1.5), so they sit where
    // the text does.
    .skeleton-text {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-half);
    }

    .skeleton-line {
      height: var(--font-size-medium);
      border-radius: 999px;
    }

    .skeleton-title {
      width: 60%;
    }

    .skeleton-progress {
      width: 30%;
    }

    .skeleton-details {
      width: 45%;
    }
  `,
  template: `
    <div class="show-list card-grid" aria-hidden="true">
      @for (_ of skeletonItems; track $index) {
        <div class="skeleton-card card">
          <div class="skeleton-thumbnail"></div>
          <div class="skeleton-text">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-progress"></div>
            <div class="skeleton-line skeleton-details"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ShowListSkeleton {
  protected readonly numberOfItems = 4;
  protected readonly skeletonItems = Array.from({ length: this.numberOfItems });
}
