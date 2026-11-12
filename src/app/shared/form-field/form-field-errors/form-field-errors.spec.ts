import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { FormFieldWrapper } from '../form-field';
import { FormFieldControl } from '../form-field-control';
import { FormFieldErrors } from './form-field-errors';

// The page renders the errors after the field, as the editor does under the steppers (D83).
@Component({
  imports: [FormField, FormFieldWrapper, FormFieldControl, FormFieldErrors],
  template: `
    <app-form-field
      #titleField
      label="Title"
      [hint]="hint()"
      [showErrors]="showErrors()"
      errorsRenderedExternally
    >
      <input [formField]="testForm.title" appFormFieldControl />
    </app-form-field>
    <app-form-field-errors [field]="titleField" />
  `,
})
class TestHost {
  readonly hint = signal('');
  readonly showErrors = signal(false);
  readonly model = signal({ title: '' });
  readonly testForm = form(this.model, (path) => {
    required(path.title, { message: 'Title is required.' });
  });
}

describe('FormFieldErrors', () => {
  let fixture: ComponentFixture<TestHost>;

  const root = () => fixture.nativeElement as HTMLElement;
  const titleInput = () => root().querySelector('input') as HTMLInputElement;
  const fieldElement = () => root().querySelector('app-form-field') as HTMLElement;
  const errorsElement = () => root().querySelector('app-form-field-errors') as HTMLElement;

  // What a screen reader reads as the control's description: the element aria-describedby points to.
  const description = (input: HTMLInputElement) => {
    const id = input.getAttribute('aria-describedby');
    return id === null ? null : root().querySelector(`[id="${id}"]`);
  };

  function render(changes: { hint?: string; showErrors?: boolean } = {}): void {
    fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.hint.set(changes.hint ?? '');
    fixture.componentInstance.showErrors.set(changes.showErrors ?? false);
    fixture.detectChanges();
  }

  it('renders nothing until the field shows its errors', () => {
    render({ showErrors: false });

    expect(errorsElement().children).toHaveLength(0);
    expect(titleInput().hasAttribute('aria-describedby')).toBe(false);
  });

  it('shows the errors outside the field and describes the control with them (D83)', () => {
    render({ showErrors: true });

    expect(description(titleInput())?.textContent?.trim()).toBe('Title is required.');
    expect(errorsElement().contains(description(titleInput()))).toBe(true);
    expect(fieldElement().textContent).not.toContain('Title is required.');
    expect(titleInput().getAttribute('aria-invalid')).toBe('true');
  });

  // The control is described by the errors or the hint, never both (D41). A hint left in the
  // field while the errors show elsewhere would also take the errors' id.
  it('hides the hint while the errors show and brings it back once the field is valid', () => {
    render({ hint: 'As it is written on the poster.', showErrors: true });

    expect(root().textContent).not.toContain('As it is written on the poster.');
    expect(description(titleInput())?.textContent?.trim()).toBe('Title is required.');

    fixture.componentInstance.model.set({ title: 'Severance' });
    fixture.detectChanges();

    expect(errorsElement().children).toHaveLength(0);
    expect(description(titleInput())?.textContent?.trim()).toBe('As it is written on the poster.');
  });
});
