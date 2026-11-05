import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, FormField, required } from '@angular/forms/signals';
import { FormFieldWrapper } from './form-field';
import { FormFieldControl } from './form-field-control';

// Two fields, so the tests can tell that each control is wired to its own wrapper.
@Component({
  imports: [FormField, FormFieldWrapper, FormFieldControl],
  template: `
    <app-form-field label="Title" [hint]="hint()" [showErrors]="showErrors()">
      <input [formField]="testForm.title" appFormFieldControl />
    </app-form-field>
    <app-form-field label="Note" [showErrors]="showErrors()">
      <input [formField]="testForm.note" appFormFieldControl />
    </app-form-field>
  `,
})
class TestHost {
  readonly hint = signal('');
  readonly showErrors = signal(false);
  readonly model = signal({ title: '', note: '' });
  readonly testForm = form(this.model, (path) => {
    required(path.title, { message: 'Title is required.' });
    required(path.note, { message: 'Note is required.' });
  });
}

describe('FormFieldWrapper', () => {
  let fixture: ComponentFixture<TestHost>;

  const root = () => fixture.nativeElement as HTMLElement;
  const inputs = () => Array.from(root().querySelectorAll('input'));
  const titleInput = () => inputs()[0];

  // What a screen reader reads as the control's description: the element aria-describedby points to.
  const description = (input: HTMLInputElement) => {
    const id = input.getAttribute('aria-describedby');
    return id === null ? null : (root().querySelector(`[id="${id}"]`)?.textContent?.trim() ?? '');
  };

  function render(changes: { hint?: string; showErrors?: boolean } = {}): void {
    fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.hint.set(changes.hint ?? '');
    fixture.componentInstance.showErrors.set(changes.showErrors ?? false);
    fixture.detectChanges();
  }

  it('links the label to its control', () => {
    render();

    expect(titleInput().labels?.[0]?.textContent?.trim()).toBe('Title');
  });

  it('keeps an invalid field quiet until it is told to show errors', () => {
    render({ showErrors: false });

    expect(root().textContent).not.toContain('Title is required.');
    expect(titleInput().hasAttribute('aria-invalid')).toBe(false);
    expect(titleInput().hasAttribute('aria-describedby')).toBe(false);
  });

  it('shows the errors and describes the control with them', () => {
    render({ showErrors: true });

    expect(titleInput().getAttribute('aria-invalid')).toBe('true');
    expect(description(titleInput())).toBe('Title is required.');
  });

  it('replaces the hint with the errors (D41)', () => {
    render({ hint: 'As it is written on the poster.' });
    expect(description(titleInput())).toBe('As it is written on the poster.');

    fixture.componentInstance.showErrors.set(true);
    fixture.detectChanges();

    expect(root().textContent).not.toContain('As it is written on the poster.');
    expect(description(titleInput())).toBe('Title is required.');
  });

  it('clears the error state once the field is valid', () => {
    render({ showErrors: true });

    fixture.componentInstance.model.update((model) => ({ ...model, title: 'Severance' }));
    fixture.detectChanges();

    expect(root().textContent).not.toContain('Title is required.');
    expect(titleInput().hasAttribute('aria-invalid')).toBe(false);
    expect(titleInput().hasAttribute('aria-describedby')).toBe(false);
  });

  it('gives every field its own ids', () => {
    render({ showErrors: true });
    const [title, note] = inputs();

    expect(title.id).not.toBe(note.id);
    expect(description(title)).toBe('Title is required.');
    expect(description(note)).toBe('Note is required.');
  });
});
