import { Component, input } from '@angular/core';

export type IconSize = 'small' | 'medium' | 'large';

export type IconName =
  'alert-circle' | 'check' | 'chevron-down' | 'chevron-left' | 'minus' | 'plus' | 'trash' | 'tv';

@Component({
  selector: 'app-svg-icon',
  host: {
    'aria-hidden': 'true',
    '[class]': 'size()',
  },
  template: `
    @let icon = name();
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      @switch (icon) {
        @case ('alert-circle') {
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5v.01" />
        }
        @case ('check') {
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        }
        @case ('chevron-down') {
          <path d="M6 9l6 6 6-6" />
        }
        @case ('chevron-left') {
          <path d="M15 5l-7 7 7 7" />
        }
        @case ('minus') {
          <path d="M5 12h14" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('trash') {
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        }
        @case ('tv') {
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M10.5 9v4l3-2z" />
        }
        @default never;
      }
    </svg>
  `,
  styles: `
    :host {
      --size: var(--icon-size-md);

      display: inline-flex;
      flex-shrink: 0;
      width: var(--size);
      height: var(--size);
    }

    :host(.small) {
      --size: var(--icon-size-sm);
    }
    :host(.large) {
      --size: var(--icon-size-lg);
    }

    svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class SvgIcon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('medium');
}
