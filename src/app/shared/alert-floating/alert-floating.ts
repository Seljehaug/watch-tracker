import { DestroyRef, Directive, DOCUMENT, ElementRef, inject } from '@angular/core';

// Floats the alert at the bottom of the window and puts its height on <html>, so the page can
// leave as much room at its end, whatever the text, the width or the text size.
@Directive({
  selector: '[appAlertFloating]',
  host: { class: 'alert-floating' },
})
export class AlertFloating {
  private readonly alert = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly root = inject(DOCUMENT).documentElement;

  constructor() {
    const observer = new ResizeObserver(([entry]) => {
      this.root.style.setProperty(
        '--alert-floating-height',
        `${entry.borderBoxSize[0].blockSize}px`,
      );
    });
    observer.observe(this.alert);

    inject(DestroyRef).onDestroy(() => {
      observer.disconnect();
      this.root.style.removeProperty('--alert-floating-height');
    });
  }
}
