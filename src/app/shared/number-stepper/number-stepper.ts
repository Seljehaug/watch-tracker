import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import {FormValueControl, transformedValue} from '@angular/forms/signals';
import {SvgIcon} from '../svg-icon/svg-icon';
import {FormFieldControl} from '../form-field/form-field-control';
import {FormFieldWrapper} from '../form-field/form-field';

@Component({
  imports: [
    SvgIcon,
    FormFieldControl
  ],
  selector: 'app-number-stepper',
  styles: `
    button {
      height: var(--touch-target);
      width: var(--touch-target);
    }
  `,
  template: `
    <button
      type="button"
      tabindex="-1"
      [attr.aria-label]="decreaseAriaLabel()"
      [attr.aria-disabled]="value() === null || null"
      (click)="decreaseAndAnnounce()">
      <app-svg-icon name="minus" size="small"></app-svg-icon>
    </button>

    <input
      #inputField
      type="text"
      inputmode="numeric"
      [value]="rawValue()"
      (input)="rawValue.set(inputField.value)"
      (keydown)="handleKeydown($event)"
      (blur)="touch.emit()"
      role="spinbutton"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuemin]="effectiveMin()"
      appFormFieldControl>

    <button
      type="button"
      tabindex="-1"
      (click)="increaseAndAnnounce()"
      [attr.aria-label]="increaseAriaLabel()">
      <app-svg-icon name="plus" size="small"></app-svg-icon>
    </button>

    <span class="visually-hidden" aria-live="polite">
      {{ announcement() }}
    </span>
  `,
})
export class NumberStepper implements FormValueControl<number | null>{
  // Dependencies
  private readonly formFieldWrapper = inject(FormFieldWrapper);

  // Input and models
  readonly value = model<number | null>(null);
  readonly min = input<number | undefined>();
  readonly decreaseAriaLabel = input<string>('Decrease');
  readonly increaseAriaLabel = input<string>('Increase');

  // Outputs
  readonly touch = output<void>();

  // Queries
  private readonly inputField = viewChild.required<ElementRef<HTMLInputElement>>('inputField')

  // State
  protected readonly effectiveMin = computed(() => this.min() ?? 0);

  protected readonly rawValue = transformedValue(this.value, {
    format: (inputValue: number | null) => inputValue === null ? '' : inputValue.toString(),
    parse: (rawValue: string) => {
      const trimmedValue = rawValue.trim();
      if (trimmedValue === '') return { value: null };

      const parsedValue = Number(trimmedValue);
      if (Number.isNaN(parsedValue)) return { error: { kind: 'notANumber', message: `${trimmedValue} is not a valid number` } };

      return { value: parsedValue };
    }
  });

  // Read out after a button press. The arrow keys don't need it: the focused input reads its own value.
  protected readonly announcement = signal('');

  // Constants
  private readonly defaultStep = 1;
  private readonly largeStep = 5;

  // Public API - Signal Forms calls this
  focus(options?: FocusOptions): void {
    this.inputField().nativeElement.focus(options);
  }

  // Template event handlers
  protected decreaseAndAnnounce(): void {
    if (this.value() === null) return;
    this.decrease();
    this.announceValue();
  }

  protected increaseAndAnnounce(): void {
    this.increase();
    this.announceValue();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this.announcement.set('');

    switch (event.key) {
      case 'ArrowUp':
        this.increase();
        break;
      case 'ArrowDown':
        this.decrease();
        break;
      case 'PageUp':
        this.increase(this.largeStep);
        break;
      case 'PageDown':
        this.decrease(this.largeStep);
        break;
      case 'Home':
        this.value.set(this.effectiveMin());
        break;
      default:
        return;
    }

    event.preventDefault();
  }

  // Helpers
  private decrease(step: number = this.defaultStep): void {
    this.value.update(current => {
      if (current === null) return null;
      if (current <= this.effectiveMin()) return null;
      return Math.max(current - step, this.effectiveMin());
    });
  }

  private increase(step: number = this.defaultStep): void {
    this.value.update(current => current === null ? this.effectiveMin() : current + step)
  }

  private announceValue(): void {
    const value = this.value();
    const labelText = this.formFieldWrapper.label();
    if (value === null) {
      this.announcement.set(`${labelText} empty`);
      return;
    }
    this.announcement.set(`${labelText} ${value}`);
  }
}
