import { booleanAttribute, Component, input, output } from '@angular/core';
import { SvgIcon } from '../svg-icon/svg-icon';

@Component({
  imports: [SvgIcon],
  selector: 'app-alert-error',
  host: {
    role: 'alert',
  },
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-1);
      margin-inline: auto;
      width: fit-content;
      min-width: 200px;

      border: 1px solid var(--color-danger);
      padding: var(--spacing-1);
      color: var(--color-danger);
      border-radius: var(--border-radius);
      font-size: var(--font-size-medium);
    }

    .messages {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-half);
    }
  `,
  template: `
    <app-svg-icon name="alert-circle" size="big" />
    <div class="messages">
      <ng-content />
    </div>
    @if (dismissible()) {
      <button type="button" class="button-close" aria-label="Dismiss" (click)="dismissed.emit()">
        <app-svg-icon name="close" />
      </button>
    }
  `,
})
export class AlertError {
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissed = output();
}
