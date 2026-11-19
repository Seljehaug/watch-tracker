import { Component } from '@angular/core';
import {SvgIcon} from '../svg-icon/svg-icon';

@Component({
  imports: [
    SvgIcon
  ],
  selector: 'app-alert-error',
  host: {
    role: 'alert',
  },
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-half);
      margin: 0 auto;
      width: fit-content;
      min-width: 200px;

      border: 1px solid var(--color-danger);
      padding: var(--spacing-1);
      color: var(--color-danger);
      border-radius: var(--border-radius);
      font-size: var(--font-size-medium);
    }
  `,
  template: `
    <app-svg-icon name="alert-circle" size="big"/>
    <ng-content/>
  `,
})
export class AlertError {}
