import {
  EMPTY_SHOW_FORM_MODEL,
  toEditableShowFields,
  toShowEditorFormModel,
  type ShowEditorFormModel,
} from './show-form-model';
import type { EditableShowFields, TrackedShow } from './tracked-show';

const aFormModel = (overrides: Partial<ShowEditorFormModel> = {}): ShowEditorFormModel => ({
  ...EMPTY_SHOW_FORM_MODEL,
  title: 'Severance',
  ...overrides,
});

const aTrackedShow = (fields: EditableShowFields): TrackedShow => ({
  ...fields,
  id: 'show-1',
  addedAt: '2026-11-01T12:00:00.000Z',
  updatedAt: '2026-11-01T12:00:00.000Z',
});

describe('toShowEditorFormModel', () => {
  it('uses the empty values of the controls for a show without service and progress', () => {
    const model = toShowEditorFormModel(aTrackedShow({ title: 'Ripley', status: 'want-to-watch' }));

    expect(model.service).toBe('');
    expect(model.lastWatched).toEqual({ season: null, episode: null });
  });
});

describe('toEditableShowFields', () => {
  it('builds the last watched episode from season and episode', () => {
    const fields = toEditableShowFields(aFormModel({ lastWatched: { season: 2, episode: 5 } }));

    expect(fields.lastWatched).toEqual({ season: 2, episode: 5 });
  });

  it.each([
    { season: 2, episode: null },
    { season: null, episode: 5 },
  ])('treats season $season, episode $episode as not started', (lastWatched) => {
    expect(toEditableShowFields(aFormModel({ lastWatched })).lastWatched).toBeUndefined();
  });

  // ShowStore.update spreads the changes over the stored show, so a missing key would keep the
  // old service. Choosing "Not set" in the form has to clear it.
  it('turns "Not set" into an undefined service, keeping the key so an update clears it', () => {
    const fields = toEditableShowFields(aFormModel({ service: '' }));

    expect(Object.hasOwn(fields, 'service')).toBe(true);
    expect(fields.service).toBeUndefined();
  });

  it('trims the title', () => {
    expect(toEditableShowFields(aFormModel({ title: '  Severance ' })).title).toBe('Severance');
  });
});

describe('a round trip through the form', () => {
  it.each<EditableShowFields>([
    {
      title: 'Severance',
      status: 'watching',
      service: 'apple-tv-plus',
      lastWatched: { season: 2, episode: 5 },
    },
    { title: 'Ripley', status: 'want-to-watch' },
  ])('gives back $title unchanged', (fields) => {
    expect(toEditableShowFields(toShowEditorFormModel(aTrackedShow(fields)))).toEqual(fields);
  });
});
