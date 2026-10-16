import {Component, inject} from '@angular/core';
import {streamingServiceDisplayName} from '../shows/streaming-service';
import {ShowStore} from '../shows/show-store';

@Component({
  selector: 'app-home',
  template: `
    <h1>Continue watching</h1>
    @for (show of watching(); track show.id) {
      <article>
        <h2>{{ show.title }}</h2>
        <p>
          @if (show.lastWatched; as lastWatched) {
            Season {{ lastWatched.season }} Episode {{ lastWatched.episode }}
          } @else {
            Not started
          }
        </p>
        @if (show.service; as service) {
          <p>{{ serviceName(service) }}</p>
        }
      </article>
    }
  `,
  imports: [],
})
export class Home {
  protected readonly serviceName = streamingServiceDisplayName;

  private readonly store = inject(ShowStore);
  protected readonly shows = this.store.shows;
  protected readonly watching = this.store.watching;
}
