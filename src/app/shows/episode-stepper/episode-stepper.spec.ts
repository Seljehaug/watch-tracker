import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { EpisodeStepper } from './episode-stepper';
import type { TrackedShow } from '../tracked-show';

const severance: TrackedShow = {
  id: 1,
  title: 'Severance',
  status: 'watching',
  lastWatched: { season: 2, episode: 5 },
  addedAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
};

const ripley: TrackedShow = {
  id: 2,
  title: 'Ripley',
  status: 'want-to-watch',
  addedAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
};

describe('EpisodeStepper', () => {
  function render(show: TrackedShow): ComponentFixture<EpisodeStepper> {
    const fixture = TestBed.createComponent(EpisodeStepper);
    fixture.componentRef.setInput('show', show);
    fixture.detectChanges();
    return fixture;
  }

  const minus = (fixture: ComponentFixture<EpisodeStepper>) =>
    (fixture.nativeElement as HTMLElement).querySelectorAll('button')[0];
  const plus = (fixture: ComponentFixture<EpisodeStepper>) =>
    (fixture.nativeElement as HTMLElement).querySelectorAll('button')[1];

  // The icons say nothing on their own, and every card in a list has the same two buttons.
  it.each([
    ['+', severance, plus, 'Mark season 2, episode 6 of Severance as watched'],
    ['+ on Want to watch', ripley, plus, 'Start Ripley: mark season 1, episode 1 as watched'],
    ['−', severance, minus, 'Mark season 2, episode 5 of Severance as not watched'],
    ['− on not started', ripley, minus, 'Mark the last watched episode of Ripley as not watched'],
  ])('names the episode and the show in the label of %s', (_, show, button, label) => {
    const fixture = render(show);

    expect(button(fixture).getAttribute('aria-label')).toBe(label);
  });

  it('tells screen readers what the progress number means', () => {
    const fixture = render(severance);
    const hidden = (fixture.nativeElement as HTMLElement).querySelector('.visually-hidden');

    expect(hidden?.textContent?.trim()).toBe('Last watched: season 2, episode 5');
  });

  // aria-disabled keeps − focusable, so it doesn't stop a click.
  it('marks − as disabled, and sends nothing, when it cannot go back', () => {
    const fixture = render({ ...severance, lastWatched: { season: 2, episode: 1 } });
    const stepped = vi.fn();
    fixture.componentInstance.stepped.subscribe(stepped);

    minus(fixture).click();

    expect(minus(fixture).getAttribute('aria-disabled')).toBe('true');
    expect(stepped).not.toHaveBeenCalled();
  });
});
