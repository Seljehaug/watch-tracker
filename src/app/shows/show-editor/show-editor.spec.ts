import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ShowStore } from '../show-store';
import type { TrackedShow } from '../tracked-show';
import { ShowEditor } from './show-editor';

const slowHorses: TrackedShow = {
  id: 1,
  title: 'Slow Horses',
  status: 'finished',
  service: 'apple-tv-plus',
  lastWatched: { season: 3, episode: 6 },
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt: '2026-10-01T00:00:00+00:00',
};

const severance: TrackedShow = {
  id: 2,
  title: 'Severance',
  status: 'watching',
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt: '2026-10-01T00:00:00+00:00',
};

const EMPTY_FORM = { title: '', status: 'watching', service: '', season: '', episode: '' };

// Uses the app's real routes, so the tests also catch a route parameter that no longer matches
// the `showId` input (D38).
describe('ShowEditor', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  // jsdom has no showModal() or close(). These stand-ins keep the `open` attribute, enough for the
  // delete dialog to be opened and closed. Nor scrollIntoView(): a no-op the tests can spy on.
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

  const root = () => harness.routeNativeElement as HTMLElement;

  // Finds a control through its label, as a user does.
  function field(label: string): HTMLInputElement | HTMLSelectElement {
    const labelElement = Array.from(root().querySelectorAll('label')).find((element) =>
      element.textContent?.trim().startsWith(label),
    );
    return root().querySelector(`[id="${labelElement?.htmlFor}"]`) as HTMLInputElement;
  }

  const fieldValues = () => ({
    title: field('Title').value,
    status: field('Status').value,
    service: field('Where I watch it').value,
    season: field('Season').value,
    episode: field('Episode').value,
  });

  async function open(
    url: string,
    shows: TrackedShow[] = [slowHorses, severance],
  ): Promise<ShowEditor> {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    // The edit route's guard reads the list as it is, so it is loaded before the first navigation.
    TestBed.inject(ShowStore);
    httpTesting.expectOne('/api/shows').flush(shows);

    harness = await RouterTestingHarness.create();
    return navigate(url);
  }

  async function navigate(url: string): Promise<ShowEditor> {
    const editor = await harness.navigateByUrl(url, ShowEditor);
    harness.detectChanges();
    return editor;
  }

  function type(label: string, text: string): void {
    const input = field(label);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  const saveButton = () => root().querySelector('button[type="submit"]') as HTMLButtonElement;

  // The label on show; the other one only keeps the button as wide.
  const saveButtonLabel = () =>
    Array.from(saveButton().querySelectorAll('.button-labels > span'))
      .find((label) => !label.classList.contains('button-label-hidden'))
      ?.textContent?.trim();

  const saveError = () => root().querySelector('[role="alert"]');

  function save(): void {
    saveButton().click();
    harness.detectChanges();
  }

  // One macrotask lets the form finish its submit, so submitting() is false again before rendering.
  async function failTheSave(): Promise<void> {
    httpTesting
      .expectOne({ method: 'PUT', url: '/api/shows/1' })
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();
  }

  // The page's own "Delete show", which opens the dialog – not the one inside it.
  const pageDeleteButton = () =>
    Array.from(root().querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete show' && !button.closest('dialog'),
    );

  // The id comes from the URL as text and is found in the store as a number.
  it('fills the form with the show in the URL', async () => {
    await open('/shows/1/edit');

    expect(fieldValues()).toEqual({
      title: 'Slow Horses',
      status: 'finished',
      service: 'apple-tv-plus',
      season: '3',
      episode: '6',
    });
  });

  // An unknown id never gets here: the route's guard sends it to the not-found page (D53).
  it('starts with an empty form in add mode', async () => {
    await open('/shows/add');

    expect(fieldValues()).toEqual(EMPTY_FORM);
  });

  it('follows the URL to another show, leaving unsaved edits behind', async () => {
    const editor = await open('/shows/1/edit');
    type('Title', 'Slow Horses (edited)');

    const editorAfterNavigation = await navigate('/shows/2/edit');

    // The router reuses the page for the new id, so only the input changes.
    expect(editorAfterNavigation).toBe(editor);
    expect(fieldValues()).toEqual({ ...EMPTY_FORM, title: 'Severance' });
  });

  // PUT overwrites every field (D69), so the fields that were not edited are sent too.
  it('saves every field of the show it opened, and puts the saved show in the store', async () => {
    await open('/shows/1/edit');
    type('Title', 'Slow Horses: Season 4');

    save();

    const request = httpTesting.expectOne({ method: 'PUT', url: '/api/shows/1' });
    expect(request.request.body).toEqual({
      title: 'Slow Horses: Season 4',
      status: 'finished',
      service: 'apple-tv-plus',
      lastWatched: { season: 3, episode: 6 },
    });
    const saved = { ...slowHorses, title: 'Slow Horses: Season 4' };
    request.flush(saved);
    await harness.fixture.whenStable();

    expect(TestBed.inject(ShowStore).shows()).toEqual([saved, severance]);
  });

  it('adds a new show when saving in add mode', async () => {
    await open('/shows/add', []);
    type('Title', 'Andor');

    save();

    const request = httpTesting.expectOne({ method: 'POST', url: '/api/shows' });
    expect(request.request.body).toEqual({ title: 'Andor', status: 'watching' });
    const added: TrackedShow = { ...severance, id: 3, title: 'Andor' };
    request.flush(added, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(ShowStore).shows()).toEqual([added]);
  });

  // D49: Home once the server has saved the show, and only then.
  it('goes to Home after the server has saved', async () => {
    await open('/shows/1/edit');

    save();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/shows/1/edit');

    httpTesting.expectOne({ method: 'PUT', url: '/api/shows/1' }).flush(slowHorses);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('says "Saving…" on the button while the server saves', async () => {
    await open('/shows/1/edit');
    expect(saveButtonLabel()).toBe('Save changes');

    save();

    expect(saveButtonLabel()).toBe('Saving…');
    expect(saveButton().getAttribute('aria-disabled')).toBe('true');
    httpTesting.expectOne({ method: 'PUT', url: '/api/shows/1' }).flush(slowHorses);
    await harness.fixture.whenStable();
  });

  describe('when the save fails', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    // D114: the message goes below the buttons, so it is scrolled into view on short screens.
    it('stays on the form with the values kept, and shows the error in view', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      await open('/shows/1/edit');
      type('Title', 'Slow Horses: Season 4');

      save();
      await failTheSave();

      expect(TestBed.inject(Router).url).toBe('/shows/1/edit');
      expect(field('Title').value).toBe('Slow Horses: Season 4');
      expect(saveError()?.textContent?.trim()).toBe("Couldn't save your changes.");
      expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
      expect(scrollIntoView.mock.contexts[0]).toBe(saveError());
      expect(saveButtonLabel()).toBe('Save changes');
      expect(saveButton().hasAttribute('aria-disabled')).toBe(false);
    });

    // Save is also "Try again", with the very same values (D114).
    it('sends the same values again, without the error while it saves', async () => {
      await open('/shows/1/edit');
      save();
      await failTheSave();
      expect(saveError()).not.toBeNull();

      save();

      const retry = httpTesting.expectOne({ method: 'PUT', url: '/api/shows/1' });
      expect(saveError()).toBeNull();
      retry.flush(slowHorses);
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/');
    });

    it('drops the error when the next try stops at an invalid field', async () => {
      await open('/shows/1/edit');
      save();
      await failTheSave();
      expect(saveError()).not.toBeNull();

      type('Title', '');
      save();
      await harness.fixture.whenStable();

      expect(saveError()).toBeNull();
    });
  });

  it('stays on the form, and sends nothing, when the save is invalid', async () => {
    await open('/shows/add', []);

    save();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/shows/add');
    httpTesting.expectNone({ method: 'POST', url: '/api/shows' });
  });

  // D44 puts the error on the missing field; D83 shows it once, under both steppers.
  it('shows a season/episode error under the steppers and focuses the missing field', async () => {
    await open('/shows/add', []);
    type('Title', 'Andor');
    type('Season', '2');

    save();
    await harness.fixture.whenStable();

    const episode = field('Episode');
    const description = root().querySelector(`[id="${episode.getAttribute('aria-describedby')}"]`);
    expect(description?.textContent?.trim()).toBe('Enter the episode too, or clear the season.');
    expect(description?.closest('app-form-field')).toBeNull();
    expect(root().textContent?.match(/Enter the episode too/g)).toHaveLength(1);
    expect(episode.getAttribute('aria-invalid')).toBe('true');
    expect(field('Season').hasAttribute('aria-invalid')).toBe(false);
    expect(document.activeElement).toBe(episode);
  });

  it('offers Delete show in edit mode only', async () => {
    await open('/shows/add');
    expect(pageDeleteButton()).toBeUndefined();

    await navigate('/shows/2/edit');
    expect(pageDeleteButton()).toBeDefined();
  });

  // D59: the dialog deletes and emits `deleted`; the editor then goes to Home (D49).
  it('goes to Home after the show is deleted in the dialog', async () => {
    await open('/shows/2/edit');

    pageDeleteButton()?.click();
    harness.detectChanges();
    const dialog = root().querySelector('dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);

    const confirmButton = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete show',
    );
    confirmButton?.click();
    httpTesting
      .expectOne({ method: 'DELETE', url: '/api/shows/2' })
      .flush(null, { status: 204, statusText: 'No Content' });
    await harness.fixture.whenStable();

    expect(
      TestBed.inject(ShowStore)
        .shows()
        .map((show) => show.id),
    ).toEqual([1]);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
