import { Pipe, PipeTransform } from '@angular/core';
import {EpisodeRef} from './tracked-show';

@Pipe({
  name: 'progress',
})
export class ProgressPipe implements PipeTransform {
  transform(lastWatched: EpisodeRef | undefined): string {
    return toProgress(lastWatched);
  }
}

export function toProgress(progress: EpisodeRef | undefined): string {
  if (!progress) return 'Not started';
  return toSeasonAndEpisode(progress);
}

export function toSeasonAndEpisode(progress: EpisodeRef): string {
  return `S${progress.season.toString().padStart(2, '0')} E${progress.episode.toString().padStart(2, '0')}`;
}

export function toSpokenSeasonAndEpisode(progress: EpisodeRef): string {
  return `season ${progress.season}, episode ${progress.episode}`;
}
