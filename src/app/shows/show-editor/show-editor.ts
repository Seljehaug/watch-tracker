import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  input,
  linkedSignal,
  signal,
  viewChild
} from '@angular/core';
import {ShowStore} from '../show-store';
import {
  EMPTY_SHOW_FORM_MODEL,
  showFormModelSchema, toEditableShowFields, toShowEditorFormModel,
} from '../show-form-model';
import {form, FormField, FormRoot} from '@angular/forms/signals';
import {FormFieldWrapper} from '../../shared/form-field/form-field';
import {FormFieldControl} from '../../shared/form-field/form-field-control';
import {SHOW_STATUSES} from '../show-status';
import {STREAMING_SERVICES} from '../streaming-service';
import {NumberStepper} from '../../shared/number-stepper/number-stepper';
import {Router, RouterLink} from '@angular/router';
import {DeleteShowDialog} from '../delete-show-dialog/delete-show-dialog';
import {SvgIcon} from '../../shared/svg-icon/svg-icon';
import {FormFieldErrors} from '../../shared/form-field/form-field-errors/form-field-errors';

@Component({
  imports: [
    FormRoot,
    FormField,
    FormFieldWrapper,
    FormFieldControl,
    NumberStepper,
    RouterLink,
    DeleteShowDialog,
    SvgIcon,
    FormFieldErrors
  ],
  selector: 'app-show-editor',
  styles: `
    .show-editor {
      max-width: 600px;
      display: flex;
      flex-direction: column;
      margin: 0 auto;
      gap: var(--spacing-1);
    }

    .show-editor-form {
      display: inline-flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .last-watched-episode {
      border: none;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-half);
    }

    .season-and-episode-steppers {
      display: flex;
      gap: var(--spacing-1);
    }
  `,
  template: `
    <div class="show-editor">
      <h1 tabindex="-1">{{ pageTitle() }}</h1>
      <form [formRoot]="form" class="show-editor-form">
        <app-form-field label="Title" [showErrors]="hasTriedToSave()">
          <input type="text" [formField]="form.title" appFormFieldControl/>
        </app-form-field>

        <app-form-field label="Status" [showErrors]="hasTriedToSave()">
          <select [formField]="form.status" appFormFieldControl>
            @for (status of SHOW_STATUSES; track status.id) {
              <option [value]="status.id">{{ status.label }}</option>
            }
          </select>
        </app-form-field>

        <app-form-field label="Where I watch it" optional [showErrors]="hasTriedToSave()">
          <select [formField]="form.service" appFormFieldControl>
            <option value="">Not set</option>
            @for (service of STREAMING_SERVICES; track service.id) {
              <option [value]="service.id">{{ service.label }}</option>
            }
          </select>
        </app-form-field>

        <fieldset class="last-watched-episode">
          <legend>Last watched episode <span class="text-muted">(optional)</span></legend>

          <div class="season-and-episode-steppers">
            <app-form-field
              #seasonField
              label="Season"
              labelSecondary
              [showErrors]="hasTriedToSave()"
              errorsRenderedExternally>
              <app-number-stepper [formField]="form.lastWatched.season" decreaseAriaLabel="Decrease season" increaseAriaLabel="Increase season"/>
            </app-form-field>

            <app-form-field
              #episodeField
              label="Episode"
              labelSecondary
              [showErrors]="hasTriedToSave()"
              errorsRenderedExternally>
              <app-number-stepper [formField]="form.lastWatched.episode" decreaseAriaLabel="Decrease episode" increaseAriaLabel="Increase episode"/>
            </app-form-field>
          </div>

          <app-form-field-errors [field]="seasonField"/>
          <app-form-field-errors [field]="episodeField"/>
        </fieldset>

        @if (storedShow()) {
          <button type="button" class="button button-danger-text" (click)="openDeleteShowDialog()">
            <app-svg-icon name="delete"/>
            Delete show
          </button>
        }

        <div class="button-group">
          <a routerLink="/" class="button button-secondary">Cancel</a>
          <button type="submit">Save changes</button>
        </div>
      </form>

      @if (storedShow(); as show) {
        <app-delete-show-dialog #deleteShowDialog [show]="show" (deleted)="onShowDeleted()"></app-delete-show-dialog>
      }
    </div>
  `,
})
export class ShowEditor {
  // Dependencies
  private readonly store = inject(ShowStore);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  // Inputs
  readonly showId = input<string>();

  // State
  protected readonly isNewShow = computed(() => !this.showId());

  protected readonly storedShow = computed(() => {
    const id = this.showId();
    return id ? this.store.getShowById(id) : null;
  });

  protected readonly pageTitle = computed(() => this.isNewShow() ? 'Add show' : 'Edit show');

  // The form's editable copy of the show, empty when there is none. Starts over when the show changes.
  protected readonly model = linkedSignal(() => {
    const show = this.storedShow();
    return show ? toShowEditorFormModel(show) : EMPTY_SHOW_FORM_MODEL;
  });

  protected readonly hasTriedToSave = signal(false);

  protected readonly form = form(this.model, showFormModelSchema, {
    submission: {
      action: async (fieldTree) => {
        const model = fieldTree().value();

        const editableShowFields = toEditableShowFields(model);

        if (this.isNewShow()) {
          this.store.add(editableShowFields);
        }
        else {
          this.store.update(this.showId() as string, editableShowFields);
        }

        await this.router.navigateByUrl('/');
      },
      onInvalid: (fieldTree) => {
        // Wait until the errors are rendered, so a screen reader reads them out with the field.
        this.hasTriedToSave.set(true);
        afterNextRender(
          () => fieldTree().errorSummary()[0]?.fieldTree().focusBoundControl(),
          { injector: this.injector },
        );
      },
    }
  });

  // Constants
  protected readonly SHOW_STATUSES = SHOW_STATUSES;
  protected readonly STREAMING_SERVICES = STREAMING_SERVICES;

  // Queries
  private readonly deleteShowDialog = viewChild<DeleteShowDialog>('deleteShowDialog');

  // Methods
  protected openDeleteShowDialog() {
    this.deleteShowDialog()?.open();
  }

  protected async onShowDeleted(): Promise<void> {
    await this.router.navigateByUrl('/');
  }
}
