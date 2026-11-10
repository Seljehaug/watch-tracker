import { Component, computed, inject } from '@angular/core';
import { ShowStore } from '../shows/show-store';
import { ShowList } from '../shows/show-list/show-list';
import {ShowListEmpty} from '../shows/show-list-empty/show-list-empty';
import {RouterLink} from '@angular/router';
import {SvgIcon} from '../shared/svg-icon/svg-icon';
import {PageHeader} from '../shared/page-header/page-header';

@Component({
  selector: 'app-home',
  template: `
    <app-page-header heading="Continue watching" [description]="watchingText()"></app-page-header>

    @if (watching().length > 0) {
      <app-show-list [shows]="watching()" (nextEpisodeWatched)="markNextEpisodeAsWatched($event)" />
    }

    @else {
      <app-show-list-empty
        iconName="tv"
        heading="Nothing on the go yet"
        description="Add the shows you're watching, and you'll always know where you stopped – and where to pick up."
      >
        <a routerLink="/shows/add" class="button button-primary">
          <app-svg-icon name="plus"/>
          Add your first show
        </a>
      </app-show-list-empty>
    }
  `,
  imports: [ShowList, ShowListEmpty, RouterLink, SvgIcon, PageHeader],
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

  protected readonly watchingText = computed(() => `${this.watching().length} ${this.watching().length === 1 ? 'show' : 'shows'} in progress`);

  protected markNextEpisodeAsWatched(id: string): void {
    this.store.markNextEpisodeAsWatched(id);
  }
}
