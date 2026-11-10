import {Component, input} from '@angular/core';

@Component({
  imports: [],
  selector: 'app-page-header',
  styles: ``,
  template: `
    <h1 tabindex="-1">
      {{ heading() }}
    </h1>
    @if (description()) {
      <p class="text-muted">
        {{ description() }}
      </p>
    }
  `,
})
export class PageHeader {
  readonly heading = input.required<string>();
  readonly description = input<string>();
}
