import { Component, input, output } from '@angular/core';
import { EpisodeStepRequest, TrackedShow } from '../tracked-show';
import { ShowCard } from '../show-card/show-card';

@Component({
  imports: [ShowCard],
  selector: 'app-show-list',
  styles: `
    .show-list {
      margin-top: var(--spacing-1);
      list-style: none;
    }
  `,
  template: `
    <!-- role="list": Safari and VoiceOver drop list semantics when list-style is none. -->
    <ul class="show-list card-grid" role="list">
      @for (show of shows(); track show.id) {
        <li>
          <app-show-card [show]="show" (stepped)="episodeStepped.emit({ showId: show.id, step: $event })"/>
        </li>
      }
    </ul>
  `,
})
export class ShowList {
  readonly shows = input.required<TrackedShow[]>();

  readonly episodeStepped = output<EpisodeStepRequest>();
}
