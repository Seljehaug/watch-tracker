import {ShowStatus} from './show-status';
import {StreamingService} from './streaming-service';
import {EditableShowFields, TrackedShow} from './tracked-show';
import {min, required, schema, SchemaPath, validate} from '@angular/forms/signals';

export interface ShowEditorFormModel {
  title: string;
  status: ShowStatus;
  service: StreamingService | '';
  lastWatched: {
    season: number | null;
    episode: number | null;
  }
}

export const EMPTY_SHOW_FORM_MODEL: ShowEditorFormModel = {
  title: '',
  status: 'watching',
  service: '',
  lastWatched: {
    season: null,
    episode: null
  }
};

export function toShowEditorFormModel(show: TrackedShow): ShowEditorFormModel {
  return {
    title: show.title,
    status: show.status,
    service: show.service ?? '',
    lastWatched: {
      season: show.lastWatched?.season ?? null,
      episode: show.lastWatched?.episode ?? null
    }
  }
}

export function toEditableShowFields(model: ShowEditorFormModel): EditableShowFields {
  return {
    title: model.title.trim(),
    status: model.status,
    service: model.service === ''
      ? undefined
      : model.service,
    lastWatched: model.lastWatched.season === null || model.lastWatched.episode === null
      ? undefined
      : {
        season: model.lastWatched.season,
        episode: model.lastWatched.episode
      }
  }
}

function integer(path: SchemaPath<number | null>, { message }: { message: string }): void {
  validate(path, ({ value }) => {
    const current = value();
    if (current === null || Number.isInteger(current)) return null;
    return { kind: 'notAnInteger', message };
  });
}

export const showFormModelSchema = schema<ShowEditorFormModel>((path) => {
  required(path.title, { message: 'Title is required.' });

  validate(path.title, ({ value }) => {
    if (value().length > 0 && value().trim().length === 0) // Contains only spaces
      return { kind: 'emptyTitle', message: 'Title is required.' };

    return null;
  });

  min(path.lastWatched.season, 1, { message: 'Season cannot be lower than 1.' });

  integer(path.lastWatched.season, { message: 'Season must be an integer.' });

  min(path.lastWatched.episode, 1, { message: 'Episode cannot be lower than 1.' });

  integer(path.lastWatched.episode, { message: 'Episode must be an integer.' });

  validate(path.lastWatched, ({ value }) => {
    if ((value().season === null && value().episode !== null) || (value().episode === null && value().season !== null))
      return { kind: 'unspecifiedSeasonOrEpisode', message: 'Either specify both season and episode or leave both empty.'};

    return null;
  });
})
