import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, FormField, min } from '@angular/forms/signals';
import { FormFieldWrapper } from '../form-field/form-field';
import { NumberStepper } from './number-stepper';

// The stepper as the editor uses it: inside a wrapper, with its minimum coming from the schema.
@Component({
  imports: [FormField, FormFieldWrapper, NumberStepper],
  template: `
    <app-form-field label="Season" [showErrors]="false">
      <app-number-stepper
        [formField]="testForm.season"
        decreaseAriaLabel="Decrease season"
        increaseAriaLabel="Increase season"
      />
    </app-form-field>
  `,
})
class TestHost {
  readonly model = signal<{ season: number | null }>({ season: null });
  readonly testForm = form(this.model, (path) => {
    min(path.season, 1);
  });
}

describe('NumberStepper', () => {
  let fixture: ComponentFixture<TestHost>;

  const root = () => fixture.nativeElement as HTMLElement;
  const input = () => root().querySelector('input') as HTMLInputElement;
  const button = (label: string) =>
    root().querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const decreaseButton = () => button('Decrease season');
  const increaseButton = () => button('Increase season');
  const value = () => fixture.componentInstance.model().season;
  const announcement = () => root().querySelector('[aria-live]')?.textContent?.trim();

  function render(season: number | null = null): void {
    fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.model.set({ season });
    fixture.detectChanges();
  }

  function click(target: HTMLButtonElement): void {
    target.click();
    fixture.detectChanges();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true });
    input().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  function type(text: string): void {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  // Empty sits one step below the minimum (D43).
  it.each([
    { start: null, action: 'increase', expected: 1 },
    { start: 3, action: 'increase', expected: 4 },
    { start: 3, action: 'decrease', expected: 2 },
    { start: 1, action: 'decrease', expected: null },
    { start: null, action: 'decrease', expected: null },
  ])('$action from $start gives $expected', ({ start, action, expected }) => {
    render(start);

    click(action === 'increase' ? increaseButton() : decreaseButton());

    expect(value()).toBe(expected);
  });

  it.each([
    { start: null, key: 'ArrowUp', expected: 1 },
    { start: 3, key: 'ArrowUp', expected: 4 },
    { start: 1, key: 'ArrowDown', expected: null },
    { start: null, key: 'PageUp', expected: 1 },
    { start: 3, key: 'PageUp', expected: 8 },
    { start: 8, key: 'PageDown', expected: 3 },
    { start: 3, key: 'PageDown', expected: 1 },
    { start: 1, key: 'PageDown', expected: null },
    { start: 7, key: 'Home', expected: 1 },
    { start: null, key: 'Home', expected: 1 },
    { start: 7, key: 'End', expected: 7 },
  ])('$key from $start gives $expected', ({ start, key, expected }) => {
    render(start);

    press(key);

    expect(value()).toBe(expected);
  });

  // Otherwise Page Up/Down scroll the page and Home moves the caret as well.
  it.each(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home'])(
    'stops the browser default for %s',
    (key) => {
      render(3);

      expect(press(key).defaultPrevented).toBe(true);
    },
  );

  it.each(['5', 'Backspace', 'Tab', 'End'])(
    'lets %s through, so typing and Tab still work',
    (key) => {
      render(3);

      expect(press(key).defaultPrevented).toBe(false);
    },
  );

  it.each([
    { text: '4', expected: 4 },
    { text: ' 12 ', expected: 12 },
    { text: '', expected: null },
    { text: '  ', expected: null },
  ])('turns the typed text "$text" into $expected', ({ text, expected }) => {
    render(3);

    type(text);

    expect(value()).toBe(expected);
  });

  it('reports text that is not a number as an error and keeps the last valid value', () => {
    render(3);
    const season = fixture.componentInstance.testForm.season;

    type('3a');

    expect(value()).toBe(3);
    expect(
      season()
        .errors()
        .map((error) => error.kind),
    ).toEqual(['notANumber']);

    type('4');

    expect(value()).toBe(4);
    expect(season().errors()).toEqual([]);
  });

  it('shows a value set from outside, as when an existing show is loaded', () => {
    render();

    fixture.componentInstance.model.set({ season: 7 });
    fixture.detectChanges();

    expect(input().value).toBe('7');
  });

  it('gives the spinbutton its value and the schema minimum, and no value when empty', () => {
    render(1);

    expect(input().getAttribute('aria-valuenow')).toBe('1');
    expect(input().getAttribute('aria-valuemin')).toBe('1');

    click(decreaseButton());

    expect(input().hasAttribute('aria-valuenow')).toBe(false);
  });

  // A disabled button drops focus to <body> when it becomes disabled under the user (D43).
  it('marks decrease as unavailable when empty without disabling it', () => {
    render();

    expect(decreaseButton().getAttribute('aria-disabled')).toBe('true');
    expect(decreaseButton().disabled).toBe(false);

    click(increaseButton());

    expect(decreaseButton().hasAttribute('aria-disabled')).toBe(false);
  });

  it('announces the new value with the label after a button press', () => {
    render();

    click(increaseButton());
    expect(announcement()).toBe('Season 1');

    click(decreaseButton());
    expect(announcement()).toBe('Season empty');
  });

  it('announces nothing when decrease has nothing to do', () => {
    render();

    click(decreaseButton());

    expect(announcement()).toBe('');
  });

  // A live region only speaks when its text changes, so a stale "Season 2" would swallow the next one.
  it('clears the announcement on a key press, so the next button press is read out', () => {
    render(1);
    click(increaseButton());

    press('ArrowDown');

    expect(announcement()).toBe('');
  });

  // The directive on the inner input finds the wrapper through the stepper's host (D43).
  it('is labelled by the wrapper around it', () => {
    render();

    expect(input().labels?.[0]?.textContent?.trim()).toBe('Season');
  });

  // A failed save focuses the first field with an error (D41, D44). Without focus() Signal Forms
  // would focus the host element, which cannot take focus.
  it('moves focus to its input when the form focuses the field', () => {
    render();

    fixture.componentInstance.testForm.season().focusBoundControl();

    expect(document.activeElement).toBe(input());
  });
});
