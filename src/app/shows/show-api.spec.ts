import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ShowApi } from './show-api';
import type { ShowPostModel, TrackedShow } from './tracked-show';

// As the server sends it: microseconds and +00:00.
const savedShow: TrackedShow = {
  id: 12,
  title: 'Severance',
  status: 'watching',
  service: 'apple-tv-plus',
  lastWatched: { season: 2, episode: 5 },
  addedAt: '2026-11-15T12:31:17.971748+00:00',
  updatedAt: '2026-11-16T08:02:44.5+00:00',
};

describe('ShowApi', () => {
  let api: ShowApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    api = TestBed.inject(ShowApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // Reset also when verify() throws, or every later test fails with "already instantiated".
  afterEach(() => {
    try {
      httpTesting.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('gets the list with GET /api/shows', async () => {
    const shows = firstValueFrom(api.getShows());

    httpTesting.expectOne({ method: 'GET', url: '/api/shows' }).flush([savedShow]);

    expect(await shows).toEqual([savedShow]);
  });

  it('adds a show with POST /api/shows, sending the fields as they are', async () => {
    // Not started and no service: the fields are left out, never '' or null as in the form.
    const fields: ShowPostModel = { title: 'Severance', status: 'want-to-watch' };
    const added = firstValueFrom(api.addShow(fields));

    const request = httpTesting.expectOne({ method: 'POST', url: '/api/shows' });
    expect(request.request.body).toEqual(fields);
    request.flush(savedShow, { status: 201, statusText: 'Created' });

    expect(await added).toEqual(savedShow);
  });

  it('saves every field with PUT /api/shows/{id}', async () => {
    const fields: ShowPostModel = {
      title: 'Severance',
      status: 'watching',
      service: 'apple-tv-plus',
      lastWatched: { season: 2, episode: 5 },
    };
    const saved = firstValueFrom(api.updateShow(12, fields));

    const request = httpTesting.expectOne({ method: 'PUT', url: '/api/shows/12' });
    expect(request.request.body).toEqual(fields);
    request.flush(savedShow);

    expect(await saved).toEqual(savedShow);
  });

  it('deletes with DELETE /api/shows/{id}', async () => {
    const deleted = firstValueFrom(api.deleteShow(12));

    httpTesting
      .expectOne({ method: 'DELETE', url: '/api/shows/12' })
      .flush(null, { status: 204, statusText: 'No Content' });

    await expect(deleted).resolves.toBeNull();
  });

  it('marks the next episode with POST /api/shows/{id}/next-episode, without a body', async () => {
    const marked = firstValueFrom(api.markNextEpisodeAsWatched(12));

    const request = httpTesting.expectOne({ method: 'POST', url: '/api/shows/12/next-episode' });
    expect(request.request.body).toBeNull();
    request.flush(savedShow);

    expect(await marked).toEqual(savedShow);
  });

  // The caller decides when a request goes, e.g. one at a time for quick taps.
  it('sends nothing until someone subscribes', () => {
    api.markNextEpisodeAsWatched(12);

    httpTesting.expectNone('/api/shows/12/next-episode');
  });

  // Errors are for the caller to handle, not for ShowApi.
  it('passes a failed request on as an error', async () => {
    const deleted = firstValueFrom(api.deleteShow(12));

    httpTesting.expectOne('/api/shows/12').flush(null, { status: 404, statusText: 'Not Found' });

    await expect(deleted).rejects.toMatchObject({ status: 404 });
  });
});
