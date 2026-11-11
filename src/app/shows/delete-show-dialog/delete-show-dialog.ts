import {Component, computed, ElementRef, inject, input, output, viewChild} from '@angular/core';
import {ShowStore} from '../show-store';
import {TrackedShow} from '../tracked-show';
import {SvgIcon} from '../../shared/svg-icon/svg-icon';

@Component({
  imports: [
    SvgIcon
  ],
  selector: 'app-delete-show-dialog',
  template: `
    <dialog #dialogElement [attr.aria-labelledby]="headingId" [attr.aria-describedby]="descriptionId">
      <div class="dialog-header">
        <h2 [id]="headingId">{{ headerText() }}</h2>
        <button type="button" class="button-close" aria-label="Close" (click)="close()">
          <app-svg-icon name="close"/>
        </button>
      </div>

      <p class="text-muted" [id]="descriptionId">This can't be undone.</p>

      <div class="dialog-buttons">
        <button type="button" class="button button-secondary" (click)="close()" autofocus>Cancel</button>
        <button type="button" class="button button-delete" (click)="deleteShow()">Delete show</button>
      </div>
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
  private readonly store = inject(ShowStore);

  readonly show = input.required<TrackedShow>();
  readonly deleted = output<void>();


  // State
  protected readonly headerText = computed(() => `Delete ${this.show().title}?`);

  // The dialog's name and description for screen readers, unique per instance.
  private readonly dialogId = crypto.randomUUID();
  protected readonly headingId = `${this.dialogId}-heading`;
  protected readonly descriptionId = `${this.dialogId}-description`;

  // Queries
  private readonly dialogElement = viewChild.required<ElementRef<HTMLDialogElement>>('dialogElement');

  open() {
    this.dialogElement().nativeElement.showModal();
  }

  protected close() {
    this.dialogElement().nativeElement.close();
  }

  protected deleteShow() {
    this.store.remove(this.show().id);
    this.close();
    this.deleted.emit();
  }
}
