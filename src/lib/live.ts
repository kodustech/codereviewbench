import liveData from './data/live.json';
import type { LiveData } from './types';

/** Typed view over live.json (written by scripts/fetch-live.js). */
export const live = liveData as unknown as LiveData;

/** "2026-11-09" → "Nov 9, 2026". Parsed as UTC so the day never shifts by timezone. */
export function formatDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
