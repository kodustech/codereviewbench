import leaderboardData from './data/leaderboard.json';
import type { LeaderboardData, LeaderboardEntry, ReviewMode } from './types';

/** Single typed view over leaderboard.json, shared by server pages. */
export const lb = leaderboardData as unknown as LeaderboardData;

export const MODES: ReviewMode[] = ['balanced', 'heavy'];

export function isMode(v: unknown): v is ReviewMode {
  return v === 'balanced' || v === 'heavy';
}

/** Entries of one mode, ranked by F2. */
export function entriesOf(mode: ReviewMode): LeaderboardEntry[] {
  return lb.entries.filter((e) => e.mode === mode).sort((a, b) => a.rank - b.rank);
}

export function entryFor(modelId: string, mode: ReviewMode): LeaderboardEntry | undefined {
  return lb.entries.find((e) => e.modelId === modelId && e.mode === mode);
}

/** Every published model id once, best balanced F2 first, then heavy-only ones. */
export function publishedModelIds(): string[] {
  const out: string[] = [];
  for (const mode of MODES) for (const e of entriesOf(mode)) if (!out.includes(e.modelId)) out.push(e.modelId);
  return out;
}

/** The mode a model page opens on: balanced when it exists. */
export function defaultModeFor(modelId: string): ReviewMode {
  return entryFor(modelId, 'balanced') ? 'balanced' : 'heavy';
}
