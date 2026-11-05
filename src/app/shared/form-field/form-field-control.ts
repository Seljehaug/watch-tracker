import {Directive, inject} from '@angular/core';
import {FormFieldWrapper} from './form-field';

@Directive({
  selector: '[appFormFieldControl]',
  host: {
    '[id]': 'wrapper.fieldId',
    '[attr.aria-invalid]': 'wrapper.errorsVisible() || null',
    '[attr.aria-describedby]': 'wrapper.descriptionId()'
  }
})
export class FormFieldControl {
  protected readonly wrapper = inject(FormFieldWrapper);
}
