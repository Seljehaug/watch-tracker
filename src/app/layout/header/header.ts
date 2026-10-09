import { Component } from '@angular/core';
import { SvgIcon } from '../../shared/svg-icon';

@Component({
  imports: [SvgIcon],
  selector: 'app-header',
  template: `
    <app-svg-icon name="tv" size="large" />
    <h1>Watch Tracker</h1>
  `,
})
export class Header {}
