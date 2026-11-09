import { Component, input, output } from '@angular/core';
import { TrackedShow } from '../tracked-show';
import { ShowCard } from '../show-card/show-card';

@Component({
  imports: [ShowCard],
  selector: 'app-show-list',
  styles: `
    // One column on a phone; on wider screens as many 18rem columns as fit – four at full width.
    .show-list {
      margin-top: var(--spacing-1);
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
      gap: var(--spacing-1);
      list-style: none;
    }
  `,
  template: `
    <!-- role="list": Safari and VoiceOver drop list semantics when list-style is none. -->
    <ul class="show-list" role="list">
      @for (show of shows(); track show.id) {
        <li>
          <app-show-card [show]="show" (nextEpisodeWatched)="nextEpisodeWatched.emit($event)" />
        </li>
      }
    </ul>
  `,
})
export class ShowList {
  readonly shows = input.required<TrackedShow[]>();

  readonly nextEpisodeWatched = output<string>();
}
