import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject, Injector,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import {ShowStore} from '../show-store';
import {TrackedShow} from '../tracked-show';
import {SvgIcon} from '../../shared/svg-icon/svg-icon';
import {firstValueFrom} from 'rxjs';
import {AlertError} from '../../shared/alert-error/alert-error';

@Component({
  imports: [
    SvgIcon,
    AlertError
  ],
  selector: 'app-delete-show-dialog',
  template: `
    <dialog #dialogElement [attr.aria-labelledby]="headingId" [attr.aria-describedby]="descriptionId" [attr.closedby]="isDeleting() ? 'none' : null">
      <div class="dialog-header">
        <h2 [id]="headingId">{{ headerText() }}</h2>
        <button type="button" class="button-close" aria-label="Close" (click)="cancel()" [attr.aria-disabled]="isDeleting() || null">
          <app-svg-icon name="close"/>
        </button>
      </div>

      <p class="text-muted" [id]="descriptionId">This can't be undone.</p>

      <div class="dialog-buttons">
        <button type="button" class="button button-secondary" (click)="cancel()" autofocus [attr.aria-disabled]="isDeleting() || null">Cancel</button>
        <button type="button" class="button button-delete" (click)="deleteShow()" [attr.aria-disabled]="isDeleting() || null">
          <span class="button-labels">
            <span [class.button-label-hidden]="isDeleting()">Delete show</span>
            <span [class.button-label-hidden]="!isDeleting()">Deleting…</span>
          </span>
        </button>
      </div>

      @if (deleteHasFailed()) {
        <app-alert-error class="spacing-top-1">
          <p>Couldn't delete the show.</p>
        </app-alert-error>
      }
    </dialog>
  `,
  styles: `
    dialog {
      container-type: inline-size;

      &[open] {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-half);
      }
    }

    .dialog-buttons {
      display: flex;
      justify-content: center;
      gap: var(--spacing-half);
      margin-block-start: var(--spacing-1);

      @container (width < 22rem) {
        flex-direction: column;

        .button {
          width: 100%;
        }
      }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-1);
    }

    .button-close {
      padding: 0;
      margin-block-start: calc((var(--icon-size-medium) - var(--touch-target)) / 2);
      margin-inline-end: calc((var(--icon-size-medium) - var(--touch-target)) / 2);
      color: var(--color-text);
      background: transparent;
      border: none;

      @media (hover: hover) {
        &:hover {
          background: var(--color-text-soft);
        }
      }

      &:active {
        background: var(--color-text-soft);
      }
    }
  `
})
export class DeleteShowDialog {
  // Dependencies
  private readonly store = inject(ShowStore);
  private readonly injector = inject(Injector);

  // Inputs/outputs
  readonly show = input.required<TrackedShow>();
  readonly deleted = output<void>();

  // State
  protected readonly headerText = computed(() => `Delete ${this.show().title}?`);
  protected readonly isDeleting = signal(false);
  protected readonly deleteHasFailed = signal(false);

  // The dialog's name and description for screen readers, unique per instance.
  private readonly dialogId = crypto.randomUUID();
  protected readonly headingId = `${this.dialogId}-heading`;
  protected readonly descriptionId = `${this.dialogId}-description`;

  // Queries
  private readonly dialogElement = viewChild.required<ElementRef<HTMLDialogElement>>('dialogElement');
  private readonly alertError = viewChild<AlertError, ElementRef<HTMLElement>>(AlertError, { read: ElementRef });

  // Methods
  open() {
    this.deleteHasFailed.set(false);
    this.dialogElement().nativeElement.showModal();
  }

  // A sent delete can't be called back, so Cancel and Close wait for the answer, as Escape does.
  protected cancel() {
    if (this.isDeleting()) return;
    this.close();
  }

  private close() {
    this.dialogElement().nativeElement.close();
  }

  protected async deleteShow() {
    if (this.isDeleting()) return;

    this.deleteHasFailed.set(false);
    this.isDeleting.set(true);

    try {
      await firstValueFrom(this.store.delete(this.show().id));

      this.close();
      this.deleted.emit();
    }
    catch (error: unknown) {
      console.error('could not delete show', error);

      this.deleteHasFailed.set(true);

      afterNextRender(
        () => { this.alertError()?.nativeElement.scrollIntoView({ block: 'nearest' }) },
        { injector: this.injector }
      );

    }
    finally {
      this.isDeleting.set(false);
    }
  }
}
