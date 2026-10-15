import { Component } from '@angular/core';
import type { TrackedShow } from '../shows/tracked-show';
import { streamingServiceDisplayName } from '../shows/streaming-service';

@Component({
  selector: 'app-home',
  template: `
    <h1>Continue watching</h1>
    @for (show of shows; track show.id) {
      <article>
        <h2>{{ show.title }}</h2>
        <p>
          @if (show.lastWatched; as lastWatched) {
            Season {{ lastWatched.season }} Episode {{ lastWatched.episode }}
          } @else {
            Not started
          }
        </p>
        @if (show.service; as service) {
          <p>{{ serviceName(service) }}</p>
        }
      </article>
    }
  `,
  imports: [],
})
export class Home {
  protected readonly serviceName = streamingServiceDisplayName;

  // Scaffolding so there is something on screen – replaced by the store in the next task.
  protected readonly shows: TrackedShow[] = [
    {
      id: 'severance',
      title: 'Severance',
      status: 'watching',
      service: 'apple-tv-plus',
      lastWatched: { season: 2, episode: 5 },
      addedAt: '2026-01-14T19:02:00.000Z',
      updatedAt: '2026-10-08T21:40:00.000Z',
    },
    {
      id: 'the-last-of-us',
      title: 'The Last of Us',
      status: 'watching',
      service: 'hbo-max',
      lastWatched: { season: 2, episode: 3 },
      addedAt: '2026-04-02T18:15:00.000Z',
      updatedAt: '2026-10-05T20:10:00.000Z',
    },
    {
      id: 'andor',
      title: 'Andor',
      status: 'watching',
      service: 'disney-plus',
      lastWatched: { season: 2, episode: 7 },
      addedAt: '2026-05-20T17:30:00.000Z',
      updatedAt: '2026-09-28T22:05:00.000Z',
    },
    {
      id: 'the-bear',
      title: 'The Bear',
      status: 'watching',
      service: 'disney-plus',
      lastWatched: { season: 3, episode: 4 },
      addedAt: '2026-02-11T20:00:00.000Z',
      updatedAt: '2026-09-12T19:25:00.000Z',
    },
    {
      id: 'exit',
      title: 'Exit',
      status: 'watching',
      service: 'nrk-tv',
      lastWatched: { season: 1, episode: 2 },
      addedAt: '2026-09-30T21:00:00.000Z',
      updatedAt: '2026-10-01T21:45:00.000Z',
    },
    {
      id: 'fallout',
      title: 'Fallout',
      status: 'want-to-watch',
      service: 'prime-video',
      addedAt: '2026-08-19T12:00:00.000Z',
      updatedAt: '2026-08-19T12:00:00.000Z',
    },
    {
      id: 'dune-prophecy',
      title: 'Dune: Prophecy',
      status: 'want-to-watch',
      service: 'hbo-max',
      addedAt: '2026-09-25T09:30:00.000Z',
      updatedAt: '2026-09-25T09:30:00.000Z',
    },
    {
      id: 'breaking-bad',
      title: 'Breaking Bad',
      status: 'finished',
      service: 'netflix',
      lastWatched: { season: 5, episode: 16 },
      addedAt: '2025-11-03T18:00:00.000Z',
      updatedAt: '2026-03-21T22:30:00.000Z',
    },
    {
      id: 'succession',
      title: 'Succession',
      status: 'finished',
      service: 'hbo-max',
      lastWatched: { season: 4, episode: 10 },
      addedAt: '2025-12-27T20:20:00.000Z',
      updatedAt: '2026-06-14T23:00:00.000Z',
    },
    {
      id: 'the-rings-of-power',
      title: 'The Lord of the Rings: The Rings of Power',
      status: 'dropped',
      service: 'prime-video',
      lastWatched: { season: 1, episode: 4 },
      addedAt: '2026-01-08T19:45:00.000Z',
      updatedAt: '2026-02-02T20:15:00.000Z',
    },
  ];
}
