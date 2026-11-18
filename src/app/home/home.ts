import {Component, computed, ElementRef, inject, linkedSignal} from '@angular/core';
import {ShowStore, ShowStoreStatus} from '../shows/show-store';
import { ShowList } from '../shows/show-list/show-list';
import {ShowListEmpty} from '../shows/show-list-empty/show-list-empty';
import {RouterLink} from '@angular/router';
import {SvgIcon} from '../shared/svg-icon/svg-icon';
import {PageHeader} from '../shared/page-header/page-header';
import {ShowId} from '../shows/tracked-show';

@Component({
  selector: 'app-home',
  template: `
    <app-page-header heading="Continue watching" [description]="watchingText()"></app-page-header>

    @if (displayLoading()) {
      <p>Loading…</p>
    } @else if (displayError()) {
      <app-show-list-empty
        role="alert"
        iconName="alert-circle"
        heading="Couldn't load your shows"
        description="Check your connection and try again."
      >
        <button type="button" class="button button-secondary" (click)="tryAgain()">Try again</button>
      </app-show-list-empty>
    } @else {
      @if (watching().length > 0) {
        <app-show-list [shows]="watching()" (nextEpisodeWatched)="markNextEpisodeAsWatched($event)"/>
      } @else {
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
    }
  `,
  imports: [ShowList, ShowListEmpty, RouterLink, SvgIcon, PageHeader],
})
export class Home {
  private readonly store = inject(ShowStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // The order the first time the list is loaded, null until then, and kept after that. A tapped
  // card stays where it is and moves to the top the next time the page opens.
  private readonly openedOrder = linkedSignal<ShowStoreStatus, ShowId[] | null>({
    source: this.store.status,
    computation: (status, previous) => {
      if (previous?.value) return previous.value;
      if (status === 'loaded') return this.store.watching().map((show) => show.id);
      return null;
    }
  });

  private readonly hasList = computed(() => this.openedOrder() !== null);

  // Only before the page has its list: a list on screen stays while it is fetched again.
  protected readonly displayLoading = computed(() => this.store.status() === 'loading' && !this.hasList());
  protected readonly displayError = computed(() => this.store.status() === 'error' && !this.hasList());

  protected readonly watching = computed(() => {
    const openedOrder = this.openedOrder();

    if (openedOrder === null) return [];

    const known = new Set(openedOrder);

    const current = this.store.watching();
    const showsById = new Map(current.map((show) => [show.id, show]));

    // Started after the page opened, so they are the newest
    const added = current.filter((show) => !known.has(show.id));
    const kept = openedOrder
      .map((id) => showsById.get(id))
      .filter((show) => show !== undefined);

    return [...added, ...kept];
  });

  protected readonly watchingText = computed(() => {
    if (!this.hasList()) return undefined;
    const count = this.watching().length;
    return `${count} ${count === 1 ? 'show' : 'shows'} in progress`;
  });

  protected markNextEpisodeAsWatched(id: ShowId): void {
    this.store.markNextEpisodeAsWatched(id);
  }

  // The button goes away while the list loads, and focus would go with it.
  protected tryAgain(): void {
    this.store.load();
    this.host.nativeElement.querySelector('h1')?.focus();
  }
}
