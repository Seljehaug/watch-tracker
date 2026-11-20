import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AlertFloating } from './alert-floating';

// jsdom has no ResizeObserver. This one records what it observes and reports a height on demand.
class FakeResizeObserver {
  static last: FakeResizeObserver | undefined;
  observed: Element[] = [];
  disconnected = false;

  constructor(private readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.last = this;
  }

  observe(element: Element): void {
    this.observed.push(element);
  }

  unobserve = (): void => undefined;

  disconnect(): void {
    this.disconnected = true;
  }

  resize(height: number): void {
    const entry = { borderBoxSize: [{ blockSize: height, inlineSize: 0 }] };
    this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

@Component({
  imports: [AlertFloating],
  template: `
    @if (shown()) {
      <div appAlertFloating></div>
    }
  `,
})
class Host {
  readonly shown = signal(true);
}

describe('AlertFloating', () => {
  const height = () => document.documentElement.style.getPropertyValue('--alert-floating-height');

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty('--alert-floating-height');
  });

  // The page's room at its end is calculated from it (_base.scss).
  it('puts the height of the alert on <html>, and follows it', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const observer = FakeResizeObserver.last;
    expect(observer?.observed).toEqual([
      (fixture.nativeElement as HTMLElement).querySelector('[appAlertFloating]'),
    ]);

    observer?.resize(210);
    expect(height()).toBe('210px');

    observer?.resize(130);
    expect(height()).toBe('130px');
  });

  // Left behind, the page would keep the room after the alert has gone.
  it('takes the height away and stops observing when the alert goes', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const observer = FakeResizeObserver.last;
    observer?.resize(210);

    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();

    expect(height()).toBe('');
    expect(observer?.disconnected).toBe(true);
  });
});
