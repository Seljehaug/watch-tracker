import {afterNextRender, Component, DOCUMENT, inject, Injector} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {Header} from './layout/header/header';
import {filter, skip} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  imports: [RouterOutlet, Header],
  selector: 'app-root',
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `,
  template: `
    <app-header />

    <main class="container">
      <router-outlet />
    </main>
  `
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        afterNextRender(() => {
          this.document.querySelector<HTMLHeadingElement>('main h1')?.focus({ preventScroll: true});
        }, { injector: this.injector });
      });
  }
}
