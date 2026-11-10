import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {SvgIcon} from '../shared/svg-icon/svg-icon';

@Component({
  imports: [
    RouterLink,
    SvgIcon
  ],
  selector: 'app-page-not-found',
  styles: `
    :host {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-1);
    }

    .page-not-found-icon-wrapper {
      display: flex;
      padding: var(--spacing-1);
      border-radius: var(--border-radius);
      background: var(--color-accent-soft);
      color: var(--color-accent);
    }
  `,
  template: `
    <div class="page-not-found-icon-wrapper">
        <app-svg-icon name="page-not-found" size="big"></app-svg-icon>
    </div>

    <h1 tabindex="-1">
      Page not found
    </h1>

    <p class="text-muted">
      This show never made it past the pilot – or the link is broken.
    </p>

    <a routerLink="/" class="button button-primary">
      Go to the home page
    </a>
  `,
})
export class PageNotFound {}
