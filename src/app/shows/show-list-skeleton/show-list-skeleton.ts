import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-show-list-skeleton',
  styles: `
    @use '../show-card-sizes' as card;

    // The card's layout, so a placeholder has its shape.
    @include card.layout;

    :host {
      display: block;
    }

    .show-list {
      margin-top: var(--spacing-1);
    }

    .skeleton-line {
      border-radius: 999px;
      background: var(--color-placeholder);
    }

    // As tall as the text and centred in its line, so the bars sit where the text does.
    .skeleton-title {
      width: 60%;
      height: var(--font-size-medium);
      margin-block: calc((card.$title-line-height - 1) * var(--font-size-medium) / 2);
    }

    .skeleton-details {
      width: 45%;
      height: var(--font-size-small);
      margin-block: calc((card.$details-line-height - 1) * var(--font-size-small) / 2);
    }

    // Where the stepper goes, as big as its pill.
    .skeleton-progress {
      width: card.$stepper-width;
      height: var(--touch-target);
    }
  `,
  template: `
    <div class="show-list card-grid" aria-hidden="true">
      @for (_ of skeletonItems; track $index) {
        <div class="show-card card">
          <div class="show-thumbnail"></div>
          <div class="show-info">
            <div class="show-heading">
              <div class="skeleton-line skeleton-title"></div>
              <div class="skeleton-line skeleton-details"></div>
            </div>
            <div class="skeleton-line skeleton-progress"></div>
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
