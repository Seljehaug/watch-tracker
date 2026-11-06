import {booleanAttribute, Component, computed, contentChild, input} from '@angular/core';
import {SvgIcon} from '../svg-icon/svg-icon';
import {FormField} from '@angular/forms/signals';

@Component({
  imports: [
    SvgIcon
  ],
  selector: 'app-form-field',
  styles: `
    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-half);
    }

    .form-field-error {
      display: flex;
      align-items: center;
      gap: var(--spacing-half);
      color: var(--color-danger);
    }
  `,
  template: `
    <div class="form-field">
      <label [for]="fieldId" [class.label-secondary]="labelSecondary()">
        {{ label() }}
        @if(optional()) {
          <span class="text-muted">(optional)</span>
        }
      </label>

      <ng-content></ng-content>

      @if (errorsVisible()) {
        <div class="form-field-errors" [id]="descriptionId()">
          @for (error of errors(); track error.kind) {
            <p class="form-field-error">
              <app-svg-icon name="alert-circle"/>
              {{ error.message }}
            </p>
          }
        </div>
      }

      @else if (hint()) {
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

  // Queries
  private readonly control = contentChild.required(FormField);

  // State
  protected readonly state = computed(() => this.control().state());
  protected readonly errors = computed(() => this.state().errors());

  // Public because FormFieldControl reads them too
  readonly fieldId = crypto.randomUUID();

  readonly errorsVisible = computed(() => this.showErrors() && this.state().invalid());

  readonly descriptionId = computed(() => {
    if (this.errorsVisible()) return `${this.fieldId}-errors`;
    if (this.hint()) return `${this.fieldId}-hint`;
    return null;
  });
}
