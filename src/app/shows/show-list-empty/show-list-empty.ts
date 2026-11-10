import {Component, input} from '@angular/core';
import {IconName, SvgIcon} from '../../shared/svg-icon/svg-icon';

@Component({
  imports: [
    SvgIcon
  ],
  selector: 'app-show-list-empty',
  styles: `
    .show-list-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-1);
      margin-top: var(--spacing-2);
      text-align: center;
    }

    .show-list-empty-icon-wrapper {
      display: flex;
      padding: var(--spacing-1);
      border-radius: var(--border-radius);
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }

    .show-list-empty h2 {
      font-size: var(--font-size-medium);
    }

    .show-list-empty p {
      color: var(--color-text-muted);
      text-wrap: balance;
    }
  `,
  template: `
    <div class="show-list-empty">
      <div class="show-list-empty-icon-wrapper">
        <app-svg-icon [name]="iconName()" size="big"/>
      </div>

      <h2>{{ heading() }}</h2>

      @if (description()) {
        <p>{{ description() }}</p>
      }

      <ng-content select="a, button"></ng-content>
    </div>
  `,
})
export class ShowListEmpty {
  readonly iconName = input.required<IconName>();
  readonly heading = input.required<string>();
  readonly description = input<string>('');
}
