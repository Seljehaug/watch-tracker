import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
  // the tests look at.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  afterAll(() => {
    const prototype = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
    delete prototype.showModal;
    delete prototype.close;
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
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

  // Finds a button by what a screen reader calls it: its aria-label, or else its text.
  function button(fixture: ComponentFixture<DeleteShowDialog>, name: string): HTMLButtonElement {
    const buttons = Array.from(dialog(fixture).querySelectorAll('button'));
    const found = buttons.find(
      (element) => (element.getAttribute('aria-label') ?? element.textContent?.trim()) === name,
    );
    if (!found) throw new Error(`No button named "${name}"`);
    return found;
  }

  function countDeletedEvents(fixture: ComponentFixture<DeleteShowDialog>): () => number {
    let count = 0;
    fixture.componentInstance.deleted.subscribe(() => count++);
    return () => count;
  }

  const storedIds = () =>
    TestBed.inject(ShowStore)
      .shows()
      .map((show) => show.id);

  // D59: the dialog deletes, and the parent only decides where to go afterwards.
  it('deletes the show, then closes and emits deleted once the server has deleted it', async () => {
    const fixture = open();
    const deletedEvents = countDeletedEvents(fixture);

    button(fixture, 'Delete show').click();
    expect(dialog(fixture).hasAttribute('open')).toBe(true);
    expect(deletedEvents()).toBe(0);

    httpTesting
      .expectOne({ method: 'DELETE', url: '/api/shows/12' })
      .flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

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
});
