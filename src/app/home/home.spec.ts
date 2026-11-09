import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { ShowStorage } from '../shows/show-storage';
import { ShowStore } from '../shows/show-store';
import type { TrackedShow } from '../shows/tracked-show';

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

const aShow = (title: string, updatedAt: string): TrackedShow => ({
  id: title.toLowerCase(),
  title,
  status: 'watching',
  lastWatched: { season: 1, episode: 1 },
  addedAt: '2026-10-01T00:00:00.000Z',
  updatedAt,
});

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  const titles = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h2'), (heading) =>
      heading.textContent?.trim(),
    );

  const nextEpisodeButtons = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));

  function render(shows: TrackedShow[]): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ShowStorage, useValue: new InMemoryShowStorage(shows) },
      ],
    });
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  }

  const olderAndNewer = () => [
    aShow('Older', '2026-11-01T20:00:00.000Z'),
    aShow('Newer', '2026-11-02T20:00:00.000Z'),
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists the most recently updated show first when the page opens', () => {
    render(olderAndNewer());

    expect(titles()).toEqual(['Newer', 'Older']);
  });

  it('keeps a card in place when its next episode is marked', () => {
    render(olderAndNewer());

    nextEpisodeButtons()[1].click();
    fixture.detectChanges();

    expect(titles()).toEqual(['Newer', 'Older']);
    expect(nextEpisodeButtons()[1].getAttribute('aria-label')).toBe(
      'Mark season 1, episode 3 of Older as watched',
    );
  });

  it('puts a show that starts after the page opened first', () => {
    render(olderAndNewer());

    TestBed.inject(ShowStore).add({ title: 'Brand new', status: 'watching' });
    fixture.detectChanges();

    expect(titles()).toEqual(['Brand new', 'Newer', 'Older']);
  });

  it('shows the empty state instead of the list when no show is being watched', () => {
    render([{ ...aShow('Done', '2026-10-01T00:00:00.000Z'), status: 'finished' }]);

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('.empty-state')).not.toBeNull();
    expect(page.querySelector('app-show-list')).toBeNull();
  });
});
