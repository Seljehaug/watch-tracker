import {Component, input} from '@angular/core';
import {SvgIcon} from '../../svg-icon/svg-icon';
import type {FormFieldWrapper} from '../form-field';

@Component({
  imports: [
    SvgIcon
  ],
  selector: 'app-form-field-errors',
  styles: `
    :host {
      display: contents;
    }

    .form-field-error {
      display: flex;
      align-items: center;
      gap: var(--spacing-half);
      color: var(--color-danger);
    }
  `,
  template: `
    @if (field().errorsVisible()) {
      <div class="form-field-errors" [id]="field().descriptionId()">
        @for (error of field().errors(); track error.kind) {
          <p class="form-field-error">
            <app-svg-icon name="alert-circle"/>
            {{ error.message }}
          </p>
        }
      </div>
    }
  `
})
export class FormFieldErrors {
  readonly field = input.required<FormFieldWrapper>();
}
