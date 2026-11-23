import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, type FieldTree } from '@angular/forms/signals';
import {
  EMPTY_SHOW_FORM_MODEL,
  showFormModelSchema,
  toShowPostModel,
  toShowEditorFormModel,
  type ShowEditorFormModel,
} from './show-form-model';
import type { ShowPostModel, TrackedShow } from './tracked-show';

const aFormModel = (overrides: Partial<ShowEditorFormModel> = {}): ShowEditorFormModel => ({
  ...EMPTY_SHOW_FORM_MODEL,
  title: 'Severance',
  ...overrides,
});

const aTrackedShow = (fields: ShowPostModel): TrackedShow => ({
  ...fields,
  id: 1,
  addedAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
});

describe('showFormModelSchema', () => {
  const showForm = (model: ShowEditorFormModel) =>
    TestBed.runInInjectionContext(() => form(signal(model), showFormModelSchema));

  const errorKinds = <T>(field: FieldTree<T>) =>
    field()
      .errors()
      .map((error) => error.kind);

  // D44: the error goes on the field that is missing, so only that one turns red.
  it.each([
    { season: 2, episode: null, seasonErrors: [], episodeErrors: ['required'] },
    { season: null, episode: 5, seasonErrors: ['required'], episodeErrors: [] },
  ])(
    'puts the error on the missing field for season $season, episode $episode',
    ({ season, episode, seasonErrors, episodeErrors }) => {
      const lastWatched = showForm(aFormModel({ lastWatched: { season, episode } })).lastWatched;

      expect(errorKinds(lastWatched.season)).toEqual(seasonErrors);
      expect(errorKinds(lastWatched.episode)).toEqual(episodeErrors);
    },
  );

  it.each([
    { season: null, episode: null },
    { season: 2, episode: 5 },
  ])('accepts season $season, episode $episode', (lastWatched) => {
    expect(showForm(aFormModel({ lastWatched }))().valid()).toBe(true);
  });

  it('rejects a season or episode that is not a whole number', () => {
    const lastWatched = showForm(
      aFormModel({ lastWatched: { season: 1.5, episode: 2 } }),
    ).lastWatched;

    expect(errorKinds(lastWatched.season)).toEqual(['notAnInteger']);
    expect(errorKinds(lastWatched.episode)).toEqual([]);
  });

  it('rejects a title of only spaces', () => {
    expect(errorKinds(showForm(aFormModel({ title: '   ' })).title)).toEqual(['emptyTitle']);
  });
});

describe('toShowEditorFormModel', () => {
  it('uses the empty values of the controls for a show without service and progress', () => {
    const model = toShowEditorFormModel(aTrackedShow({ title: 'Ripley', status: 'want-to-watch' }));

    expect(model.service).toBe('');
    expect(model.lastWatched).toEqual({ season: null, episode: null });
  });
});

describe('toShowPostModel', () => {
  it('builds the last watched episode from season and episode', () => {
    const fields = toShowPostModel(aFormModel({ lastWatched: { season: 2, episode: 5 } }));

    expect(fields.lastWatched).toEqual({ season: 2, episode: 5 });
  });

  it.each([
    { season: 2, episode: null },
    { season: null, episode: 5 },
  ])('treats season $season, episode $episode as not started', (lastWatched) => {
    expect(toShowPostModel(aFormModel({ lastWatched })).lastWatched).toBeUndefined();
  });

  // The API refuses '' with a 400; no service is a field left out.
  it('turns "Not set" into no service', () => {
    expect(toShowPostModel(aFormModel({ service: '' })).service).toBeUndefined();
  });

  it('trims the title', () => {
    expect(toShowPostModel(aFormModel({ title: '  Severance ' })).title).toBe('Severance');
  });
});

describe('a round trip through the form', () => {
  it.each<ShowPostModel>([
    {
      title: 'Severance',
      status: 'watching',
      service: 'apple-tv-plus',
      lastWatched: { season: 2, episode: 5 },
    },
    { title: 'Ripley', status: 'want-to-watch' },
  ])('gives back $title unchanged', (fields) => {
    expect(toShowPostModel(toShowEditorFormModel(aTrackedShow(fields)))).toEqual(fields);
  });
});
