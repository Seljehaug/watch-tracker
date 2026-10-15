// The id is stored on the show and used as the route segment: /shows/want-to-watch.
export const SHOW_STATUSES = [
  { id: 'watching', label: 'Watching' },
  { id: 'want-to-watch', label: 'Want to watch' },
  { id: 'finished', label: 'Finished' },
  { id: 'dropped', label: 'Dropped' },
] as const;

export type ShowStatus = (typeof SHOW_STATUSES)[number]['id'];
