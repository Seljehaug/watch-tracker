import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthStore } from '../../auth/auth-store';
import { ShowStore } from '../show-store';
import type { TrackedShow } from '../tracked-show';
import { DeleteShowDialog } from './delete-show-dialog';

const severance: TrackedShow = {
  id: 12,
  title: 'Severance',
  status: 'watching',
  lastWatched: { season: 2, episode: 7 },
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt: '2026-10-01T00:00:00+00:00',
};

const slowHorses: TrackedShow = {
  id: 1,
  title: 'Slow Horses',
  status: 'finished',
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt: '2026-10-01T00:00:00+00:00',
};

describe('DeleteShowDialog', () => {
  let httpTesting: HttpTestingController;

  // jsdom has no showModal() or close(). These stand-ins keep the `open` attribute, which is all
  // the tests look at. Nor scrollIntoView(): a no-op the tests can spy on.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    Element.prototype.scrollIntoView = () => undefined;
  });

  afterAll(() => {
    const prototype = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
    delete prototype.showModal;
    delete prototype.close;
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    vi.restoreAllMocks();
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  // Renders the dialog for Severance and opens it, as the editor does.
  function open(): ComponentFixture<DeleteShowDialog> {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthStore);
    httpTesting.expectOne('/api/auth/user').flush({ email: 'test@example.com' });
    TestBed.inject(ShowStore);
    httpTesting.expectOne('/api/shows').flush([severance, slowHorses]);

    const fixture = TestBed.createComponent(DeleteShowDialog);
    fixture.componentRef.setInput('show', severance);
    fixture.detectChanges();
    fixture.componentInstance.open();
    return fixture;
  }

  const dialog = (fixture: ComponentFixture<DeleteShowDialog>) =>
    (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;

  // The text without the label that is hidden, as a screen reader reads it.
  function visibleText(element: HTMLElement): string {
    const copy = element.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('.button-label-hidden').forEach((hidden) => hidden.remove());
    return copy.textContent?.trim() ?? '';
  }

  // Finds a button by what a screen reader calls it: its aria-label, or else its text.
  function button(fixture: ComponentFixture<DeleteShowDialog>, name: string): HTMLButtonElement {
    const buttons = Array.from(dialog(fixture).querySelectorAll('button'));
    const found = buttons.find(
      (element) => (element.getAttribute('aria-label') ?? visibleText(element)) === name,
    );
    if (!found) throw new Error(`No button named "${name}"`);
    return found;
  }

  const deleteError = (fixture: ComponentFixture<DeleteShowDialog>) =>
    dialog(fixture).querySelector('[role="alert"]');

  function countDeletedEvents(fixture: ComponentFixture<DeleteShowDialog>): () => number {
    let count = 0;
    fixture.componentInstance.deleted.subscribe(() => count++);
    return () => count;
  }

  const storedIds = () =>
    TestBed.inject(ShowStore)
      .shows()
      .map((show) => show.id);

  function startDeleting(fixture: ComponentFixture<DeleteShowDialog>): void {
    button(fixture, 'Delete show').click();
    fixture.detectChanges();
  }

  const expectDelete = () => httpTesting.expectOne({ method: 'DELETE', url: '/api/shows/12' });

  async function answerDeleted(fixture: ComponentFixture<DeleteShowDialog>): Promise<void> {
    expectDelete().flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();
  }

  // One macrotask lets deleteShow() finish its catch and finally before rendering.
  async function failTheDelete(fixture: ComponentFixture<DeleteShowDialog>): Promise<void> {
    expectDelete().flush(null, { status: 500, statusText: 'Internal Server Error' });
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  // D59: the dialog deletes, and the parent only decides where to go afterwards.
  it('deletes the show, then closes and emits deleted once the server has deleted it', async () => {
    const fixture = open();
    const deletedEvents = countDeletedEvents(fixture);

    startDeleting(fixture);
    expect(dialog(fixture).hasAttribute('open')).toBe(true);
    expect(deletedEvents()).toBe(0);

    await answerDeleted(fixture);

    expect(storedIds()).toEqual([1]);
    expect(dialog(fixture).hasAttribute('open')).toBe(false);
    expect(deletedEvents()).toBe(1);
  });

  it.each(['Cancel', 'Close'])('closes without deleting when %s is pressed', (name) => {
    const fixture = open();
    const deletedEvents = countDeletedEvents(fixture);

    button(fixture, name).click();

    expect(storedIds()).toEqual([12, 1]);
    expect(dialog(fixture).hasAttribute('open')).toBe(false);
    expect(deletedEvents()).toBe(0);
  });

  // The ids are made per instance, so a typo in one of them would silently leave the dialog
  // without a name for screen readers.
  it('is named by its title and described by its text', () => {
    const fixture = open();
    const element = dialog(fixture);
    const textOf = (id: string | null) =>
      id ? document.getElementById(id)?.textContent?.trim() : undefined;

    expect(textOf(element.getAttribute('aria-labelledby'))).toBe('Delete Severance?');
    expect(textOf(element.getAttribute('aria-describedby'))).toBe("This can't be undone.");
  });

  describe('while the server deletes', () => {
    // deleteShow() refuses the press itself; aria-disabled stops no click (D118).
    it('sends nothing on a second press', async () => {
      const fixture = open();
      const deleteButton = button(fixture, 'Delete show');

      deleteButton.click();
      fixture.detectChanges();
      deleteButton.click();

      await answerDeleted(fixture);
    });

    // A sent delete can't be called back (D118). jsdom has no Escape: closedby="none" is what
    // keeps the browser from closing the dialog on it.
    it('stays open on Cancel, Close and Escape until the server has answered', async () => {
      const fixture = open();
      const deletedEvents = countDeletedEvents(fixture);

      startDeleting(fixture);
      button(fixture, 'Cancel').click();
      button(fixture, 'Close').click();

      expect(dialog(fixture).hasAttribute('open')).toBe(true);
      expect(button(fixture, 'Cancel').getAttribute('aria-disabled')).toBe('true');
      expect(button(fixture, 'Close').getAttribute('aria-disabled')).toBe('true');
      expect(dialog(fixture).getAttribute('closedby')).toBe('none');

      await answerDeleted(fixture);

      expect(dialog(fixture).hasAttribute('open')).toBe(false);
      expect(deletedEvents()).toBe(1);
    });
  });

  describe('when the delete fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('stays open with the show kept, and shows the error in view', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      const fixture = open();
      const deletedEvents = countDeletedEvents(fixture);

      startDeleting(fixture);
      await failTheDelete(fixture);

      expect(dialog(fixture).hasAttribute('open')).toBe(true);
      expect(deletedEvents()).toBe(0);
      expect(storedIds()).toEqual([12, 1]);
      expect(deleteError(fixture)?.textContent?.trim()).toBe("Couldn't delete the show.");
      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts[0]).toBe(deleteError(fixture));
      expect(button(fixture, 'Delete show').hasAttribute('aria-disabled')).toBe(false);
      expect(button(fixture, 'Cancel').hasAttribute('aria-disabled')).toBe(false);
      expect(dialog(fixture).hasAttribute('closedby')).toBe(false);
    });

    // "Delete show" is also "Try again".
    it('deletes on the next try, without the error while it deletes', async () => {
      const fixture = open();
      const deletedEvents = countDeletedEvents(fixture);
      startDeleting(fixture);
      await failTheDelete(fixture);
      expect(deleteError(fixture)).not.toBeNull();

      startDeleting(fixture);
      expect(deleteError(fixture)).toBeNull();
      await answerDeleted(fixture);

      expect(dialog(fixture).hasAttribute('open')).toBe(false);
      expect(deletedEvents()).toBe(1);
    });

    it('has no error when it is opened again', async () => {
      const fixture = open();
      startDeleting(fixture);
      await failTheDelete(fixture);
      expect(deleteError(fixture)).not.toBeNull();

      button(fixture, 'Cancel').click();
      fixture.componentInstance.open();
      fixture.detectChanges();

      expect(dialog(fixture).hasAttribute('open')).toBe(true);
      expect(deleteError(fixture)).toBeNull();
    });
  });
});
