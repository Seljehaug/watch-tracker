import {booleanAttribute, Component, computed, contentChild, input} from '@angular/core';
import {FormField} from '@angular/forms/signals';
import {FormFieldErrors} from './form-field-errors/form-field-errors';

@Component({
  imports: [
    FormFieldErrors
  ],
  selector: 'app-form-field',
  styles: `
    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-half);
    }
  `,
  template: `
    <div class="form-field">
      <label [for]="fieldId" [class.label-secondary]="labelSecondary()">
        {{ label() }}
        @if (optional()) {
          <span class="text-muted">(optional)</span>
        }
      </label>

      <ng-content></ng-content>

      @if (!errorsRenderedExternally()) {
        <app-form-field-errors [field]="this"></app-form-field-errors>
      }

      @if (!errorsVisible() && hint()) {
        <p class="form-field-hint" [id]="descriptionId()">{{ hint() }}</p>
      }
    </div>
  `,
})
export class FormFieldWrapper {
  // Inputs
  readonly label = input.required<string>();
  readonly labelSecondary = input(false, { transform: booleanAttribute });
  readonly optional = input(false, { transform: booleanAttribute });
  readonly hint = input<string>();
  readonly showErrors = input.required<boolean>();
  readonly errorsRenderedExternally = input(false, { transform: booleanAttribute });

  // Queries
  private readonly control = contentChild.required(FormField);

  // State
  protected readonly state = computed(() => this.control().state());

  readonly errors = computed(() => this.state().errors());

  readonly fieldId = crypto.randomUUID();

  readonly errorsVisible = computed(() => this.showErrors() && this.state().invalid());

  readonly descriptionId = computed(() => {
    if (this.errorsVisible()) return `${this.fieldId}-errors`;
    if (this.hint()) return `${this.fieldId}-hint`;
    return null;
  });
}
