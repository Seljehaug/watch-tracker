import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShowCard } from './show-card';
import type { TrackedShow } from '../tracked-show';

const succession: TrackedShow = {
  id: 1,
  title: 'Succession',
  status: 'finished',
  lastWatched: { season: 4, episode: 10 },
  addedAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
};

describe('ShowCard', () => {
  function render(show: TrackedShow): HTMLElement {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ShowCard);
    fixture.componentRef.setInput('show', show);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const spokenProgress = (card: HTMLElement) =>
    card.querySelector('.visually-hidden')?.textContent?.trim();

  // The store and the server leave these shows alone, so the card must offer no steps.
  it.each([
    ['finished', 'Ended at season 4, episode 10'],
    ['dropped', 'Stopped at season 4, episode 10'],
  ] as const)('shows the progress as text, with no stepper, on %s', (status, spoken) => {
    const card = render({ ...succession, status });

    expect(card.querySelectorAll('button')).toHaveLength(0);
    expect(spokenProgress(card)).toBe(spoken);
  });

  it('says only "Not started" on a finished show with no progress', () => {
    const card = render({ ...succession, lastWatched: undefined });

    expect(spokenProgress(card)).toBe('Not started');
  });
});
