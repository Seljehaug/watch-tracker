import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ShowStorage } from '../show-storage';
import { ShowStore } from '../show-store';
import type { TrackedShow } from '../tracked-show';
import { ShowEditor } from './show-editor';

class InMemoryShowStorage extends ShowStorage {
  constructor(private shows: TrackedShow[]) {
    super();
  }

  load(): TrackedShow[] {
    return this.shows;
  }

  save(shows: TrackedShow[]): void {
    this.shows = shows;
  }
}

const slowHorses: TrackedShow = {
  id: 'slow-horses',
  title: 'Slow Horses',
  status: 'finished',
  service: 'apple-tv-plus',
  lastWatched: { season: 3, episode: 6 },
  addedAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const severance: TrackedShow = {
  id: 'severance',
  title: 'Severance',
  status: 'watching',
  addedAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const EMPTY_FORM = { title: '', status: 'watching', service: '', season: '', episode: '' };

// Uses the app's real routes, so the tests also catch a route parameter that no longer matches
// the `showId` input (D38).
describe('ShowEditor', () => {
  let harness: RouterTestingHarness;

  // jsdom has no showModal() or close(). These stand-ins keep the `open` attribute, enough for the
  // delete dialog to be opened and closed.
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
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: ShowStorage, useValue: new InMemoryShowStorage(shows) },
      ],
    });
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

  function save(): void {
    (root().querySelector('button[type="submit"]') as HTMLButtonElement).click();
    harness.detectChanges();
  }

  // The page's own "Delete show", which opens the dialog – not the one inside it.
  const pageDeleteButton = () =>
    Array.from(root().querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete show' && !button.closest('dialog'),
    );

  it('fills the form with the show in the URL', async () => {
    await open('/shows/slow-horses/edit');

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
    const editor = await open('/shows/slow-horses/edit');
    type('Title', 'Slow Horses (edited)');

    const editorAfterNavigation = await navigate('/shows/severance/edit');

    // The router reuses the page for the new id, so only the input changes.
    expect(editorAfterNavigation).toBe(editor);
    expect(fieldValues()).toEqual({ ...EMPTY_FORM, title: 'Severance' });
  });

  it('saves changes to the show it opened and keeps the fields that were not edited', async () => {
    await open('/shows/slow-horses/edit');
    type('Title', 'Slow Horses: Season 4');

    save();

    const shows = TestBed.inject(ShowStore).shows();
    expect(shows).toHaveLength(2);
    expect(shows.find((show) => show.id === 'slow-horses')).toMatchObject({
      title: 'Slow Horses: Season 4',
      status: 'finished',
      service: 'apple-tv-plus',
      lastWatched: { season: 3, episode: 6 },
    });
  });

  it('adds a new show when saving in add mode', async () => {
    await open('/shows/add', []);
    type('Title', 'Andor');

    save();

    expect(TestBed.inject(ShowStore).shows()).toEqual([
      expect.objectContaining({ title: 'Andor', status: 'watching' }),
    ]);
  });

  // D49: Home after a successful save, and only then.
  it('goes to Home after saving', async () => {
    await open('/shows/slow-horses/edit');

    save();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('stays on the form when the save is invalid', async () => {
    await open('/shows/add', []);

    save();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/shows/add');
    expect(TestBed.inject(ShowStore).shows()).toEqual([]);
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

    await navigate('/shows/severance/edit');
    expect(pageDeleteButton()).toBeDefined();
  });

  // D59: the dialog deletes and emits `deleted`; the editor then goes to Home (D49).
  it('goes to Home after the show is deleted in the dialog', async () => {
    await open('/shows/severance/edit');

    pageDeleteButton()?.click();
    harness.detectChanges();
    const dialog = root().querySelector('dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);

    const confirmButton = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete show',
    );
    confirmButton?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(ShowStore).shows().map((show) => show.id)).toEqual(['slow-horses']);
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
