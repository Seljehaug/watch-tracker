import { Component } from '@angular/core';
import { SvgIcon } from '../../shared/svg-icon';

@Component({
  imports: [SvgIcon],
  selector: 'app-header',
  template: `
    <header class="app-header">
      <app-svg-icon name="tv" size="big" />
      <h1>Watch Tracker</h1>
    </header>
  `,
})
export class Header {}
