import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { SvgIcon } from '../../shared/svg-icon/svg-icon';

@Component({
  imports: [RouterLink, RouterLinkActive, SvgIcon],
  selector: 'app-header',
  template: `
    <header class="app-header container">
      <a routerLink="/" class="app-header-link">
        <app-svg-icon name="logo" size="logo" class="app-header-logo-icon spacing-right-half"/>
        <span class="app-header-text">Watch Tracker</span>
      </a>

      @if (linksVisible()) {
        <div>
          <a routerLink="/shows/add" class="app-header-link button button-primary spacing-right-1">
            <app-svg-icon name="plus"/>
            Add show
          </a>

          <a routerLink="/account" routerLinkActive ariaCurrentWhenActive="page" aria-label="Account"
             class="app-header-link account-link">
            <app-svg-icon name="account"/>
          </a>
        </div>
      }
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
      position: relative;
      top: -1px;
    }

    .app-header-text {
      font-size: var(--font-size-medium);
      font-weight: 700;
    }

    .app-header-link {
      height: var(--touch-target);
      min-width: var(--touch-target);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .account-link {
      position: relative;
      right: calc(4px - var(--spacing-1)); // adjusted by 4px to make sure the focus outline is visible
    }
  `
})
export class Header {
  private readonly router = inject(Router);

  // Hidden until the first page is shown, so they don't flash before the login page at start-up.
  protected readonly linksVisible = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.data['hideHeaderLinks'] !== true;
      }),
    ),
    { initialValue: false },
  );
}
