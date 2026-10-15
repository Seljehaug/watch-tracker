export const STREAMING_SERVICES = [
  { id: 'netflix', label: 'Netflix' },
  { id: 'prime-video', label: 'Prime Video' },
  { id: 'hbo-max', label: 'HBO Max' },
  { id: 'disney-plus', label: 'Disney+' },
  { id: 'apple-tv-plus', label: 'Apple TV+' },
  { id: 'viaplay', label: 'Viaplay' },
  { id: 'skyshowtime', label: 'SkyShowtime' },
  { id: 'nrk-tv', label: 'NRK TV' },
  { id: 'tv2-play', label: 'TV 2 Play' },
  { id: 'other', label: 'Other' },
] as const;

export type StreamingService = (typeof STREAMING_SERVICES)[number]['id'];

export function streamingServiceDisplayName(id: StreamingService): string {
  return STREAMING_SERVICES.find((sc) => sc.id === id)?.label ?? id;
}
