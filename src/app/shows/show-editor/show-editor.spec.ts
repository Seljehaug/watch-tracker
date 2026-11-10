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
});
