// The id is stored on the show and used as the route segment: /shows/want-to-watch.
// The API allows the same ids (ShowStatuses and ShowPostModel in server/WatchTracker.Api/Shows);
// AngularListsTests in server/WatchTracker.Api.Tests fails when the two differ.
export const SHOW_STATUSES = [
  { id: 'watching', label: 'Watching' },
  { id: 'want-to-watch', label: 'Want to watch' },
  { id: 'finished', label: 'Finished' },
  { id: 'dropped', label: 'Dropped' },
] as const;

export type ShowStatus = (typeof SHOW_STATUSES)[number]['id'];

export function isShowStatus(value: unknown): value is ShowStatus {
  return SHOW_STATUSES.some((item) => item.id === value);
}
