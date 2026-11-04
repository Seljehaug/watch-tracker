import { Component, computed, inject } from '@angular/core';
import { ShowStore } from '../shows/show-store';
import { ShowList } from '../shows/show-list/show-list';
import { SvgIcon } from '../shared/svg-icon/svg-icon';

@Component({
  selector: 'app-home',
  template: `
    <h1>Continue watching</h1>
    @if (watching().length > 0) {
      <app-show-list [shows]="watching()" (nextEpisodeWatched)="markNextEpisodeAsWatched($event)" />
    } @else {
      <div class="empty-state">
        <div class="empty-state-icon">
          <app-svg-icon name="tv" size="big" />
        </div>
        <h2>Nothing on the go yet</h2>
        <p>
          Add the shows you're watching, and you'll always know where you stopped – and where to
          pick up.
        </p>
      </div>
    }
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-1);
      margin-top: var(--spacing-2);
      text-align: center;
    }

    .empty-state-icon {
      display: flex;
      padding: var(--spacing-1);
      border-radius: var(--radius);
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }

    .empty-state h2 {
      font-size: var(--font-size-medium);
    }

    .empty-state p {
      color: var(--color-text-muted);
      text-wrap: balance;
    }
  `,
  imports: [ShowList, SvgIcon],
})
export class Home {
  private readonly store = inject(ShowStore);

  // Read once when the page opens – a field initializer is not reactive. A tapped card stays
  // where it is and moves to the top the next time the page opens.
  private readonly openedOrder = this.store.watching().map((show) => show.id);

  protected readonly watching = computed(() => {
    const current = this.store.watching();
    const showsById = new Map(current.map((show) => [show.id, show]));
    const known = new Set(this.openedOrder);

    // Started after the page opened, so they are the newest
    const added = current.filter((show) => !known.has(show.id));
    const kept = this.openedOrder
      .map((id) => showsById.get(id))
      .filter((show) => show !== undefined);

    return [...added, ...kept];
  });

  protected markNextEpisodeAsWatched(id: string): void {
    this.store.markNextEpisodeAsWatched(id);
  }
}
