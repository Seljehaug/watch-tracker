import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ShowCard } from './show-card';
import type { TrackedShow } from '../tracked-show';

const aShow = (overrides: Partial<TrackedShow> = {}): TrackedShow => ({
  id: 'show-1',
  title: 'Severance',
  status: 'watching',
  lastWatched: { season: 2, episode: 5 },
  addedAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
  ...overrides,
});

describe('ShowCard', () => {
  function render(show: TrackedShow): ComponentFixture<ShowCard> {
    const fixture = TestBed.createComponent(ShowCard);
    fixture.componentRef.setInput('show', show);
    fixture.detectChanges();
    return fixture;
  }

  const nextEpisodeButton = (fixture: ComponentFixture<ShowCard>) =>
    (fixture.nativeElement as HTMLElement).querySelector('button');

  it('emits the show id when the next episode button is clicked', () => {
    const fixture = render(aShow({ id: 'abc' }));
    const emitted: string[] = [];
    fixture.componentInstance.nextEpisodeWatched.subscribe((id) => emitted.push(id));

    nextEpisodeButton(fixture)?.click();

    expect(emitted).toEqual(['abc']);
  });

  it('names the next episode and the show in the button label', () => {
    const fixture = render(aShow());

    expect(nextEpisodeButton(fixture)?.getAttribute('aria-label')).toBe(
      'Mark season 2, episode 6 of Severance as watched',
    );
  });

  it('offers season 1, episode 1 for a show that has not been started', () => {
    const fixture = render(aShow({ status: 'want-to-watch', lastWatched: undefined }));

    expect(nextEpisodeButton(fixture)?.getAttribute('aria-label')).toBe(
      'Mark season 1, episode 1 of Severance as watched',
    );
  });

  it.each(['finished', 'dropped'] as const)(
    'has no next episode button for a %s show',
    (status) => {
      const fixture = render(aShow({ status }));

      expect(nextEpisodeButton(fixture)).toBeNull();
    },
  );

  it('tells screen readers what the progress number means', () => {
    const fixture = render(aShow());
    const hidden = (fixture.nativeElement as HTMLElement).querySelector('.visually-hidden');

    expect(hidden?.textContent?.trim()).toBe('Last watched: season 2, episode 5');
  });
});
