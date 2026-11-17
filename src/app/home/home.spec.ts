import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { ShowStore } from '../shows/show-store';
import type { TrackedShow } from '../shows/tracked-show';

const aShow = (id: number, title: string, updatedAt: string): TrackedShow => ({
  id,
  title,
  status: 'watching',
  lastWatched: { season: 1, episode: 1 },
  addedAt: '2026-10-01T00:00:00+00:00',
  updatedAt,
});

const older = aShow(1, 'Older', '2026-11-01T20:00:00+00:00');
const newer = aShow(2, 'Newer', '2026-11-02T20:00:00+00:00');

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let httpTesting: HttpTestingController;

  const titles = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h2'), (heading) =>
      heading.textContent?.trim(),
    );

  const nextEpisodeButtons = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));

  // The list is loaded before the page opens, as when coming back to Home from the editor.
  function render(shows: TrackedShow[]): void {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClientTesting()] });
    httpTesting = TestBed.inject(HttpTestingController);
    TestBed.inject(ShowStore);
    httpTesting.expectOne('/api/shows').flush(shows);

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  }

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('lists the most recently updated show first when the page opens', () => {
    render([older, newer]);

    expect(titles()).toEqual(['Newer', 'Older']);
  });

  it('keeps a card in place when its next episode is marked', () => {
    render([older, newer]);

    nextEpisodeButtons()[1].click();
    httpTesting
      .expectOne({ method: 'POST', url: '/api/shows/1/next-episode' })
      .flush({
        ...older,
        lastWatched: { season: 1, episode: 2 },
        updatedAt: '2026-11-03T12:00:00+00:00',
      });
    fixture.detectChanges();

    expect(titles()).toEqual(['Newer', 'Older']);
    expect(nextEpisodeButtons()[1].getAttribute('aria-label')).toBe(
      'Mark season 1, episode 3 of Older as watched',
    );
  });

  it('puts a show that starts after the page opened first', () => {
    render([older, newer]);

    TestBed.inject(ShowStore).add({ title: 'Brand new', status: 'watching' }).subscribe();
    httpTesting
      .expectOne({ method: 'POST', url: '/api/shows' })
      .flush(aShow(3, 'Brand new', '2026-11-03T12:00:00+00:00'));
    fixture.detectChanges();

    expect(titles()).toEqual(['Brand new', 'Newer', 'Older']);
  });

  it('shows the empty state instead of the list when no show is being watched', () => {
    render([{ ...older, status: 'finished' }]);

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('app-show-list-empty')).not.toBeNull();
    expect(page.querySelector('app-show-list')).toBeNull();
  });

  it('projects the link to add a show into the empty state', () => {
    render([]);

    // Content that matches no <ng-content select> is dropped without a warning
    const emptyState = (fixture.nativeElement as HTMLElement).querySelector('app-show-list-empty');
    expect(emptyState?.querySelector('a[href="/shows/add"]')).not.toBeNull();
  });
});
