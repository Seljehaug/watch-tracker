import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIcon } from '../../shared/svg-icon/svg-icon';

@Component({
  imports: [RouterLink, SvgIcon],
  selector: 'app-header',
  template: `
    <header class="app-header container">
      <a routerLink="/" class="app-header-link">
        <app-svg-icon name="tv" size="big" class="app-header-logo-icon spacing-right-half"/>
        <span class="app-header-text">Watch Tracker</span>
      </a>
      <a routerLink="/shows/add" class="app-header-link button button-primary">
        <app-svg-icon name="plus"/>
        Add show
      </a>
    </header>
  `,
  styles: `
    :host {
      display: block;
      border-bottom: 1px solid var(--color-divider);
    }

    .app-header {
      padding-top: var(--spacing-1);
      padding-bottom: var(--spacing-1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-header-logo-icon {
      color: var(--color-accent);
    }

    .app-header-text {
      font-size: var(--font-size-medium);
      font-weight: 700;
    }

    .app-header-link {
      height: var(--touch-target);
      display: inline-flex;
      align-items: center;
    }
  `
})
export class Header {}
