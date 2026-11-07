// ── Modes ──
/** balanced = the normal review (one generalist agent). heavy = generalist +
 *  9 specialist lens agents in parallel, then the same verify/dedup steps.
 *  On disk the balanced runs live under `light/`. */
export type ReviewMode = 'balanced' | 'heavy';

// ── Meta ──
export interface Meta {
  totalEntries: number;
  totalModels: number;
  modes: ReviewMode[];
  entriesByMode: Record<ReviewMode, number>;
  models: string[];
  harnesses: string[];
  languages: string[];
  repos: string[];
  /** Ordered by size (XS→XL), not alphabetically. */
  sizes: string[];
  accessPaths: string[];
  judges: string[];
  gold: string[];
  benchmarkVersion: string | null;
  totalCases: number;
  totalGoldens: number;
  pricesCollectedAt: string | null;
  firstRunAt: string | null;
  lastRunAt: string | null;
  generatedAt: string;
}

// ── Leaderboard ──
export interface BucketStat {
  recall: number;
  /** Micro TP/(TP+FP) over the bucket; null when the model published nothing there. */
  precision: number | null;
  goldens: number;
  matched: number;
  count: number;
}

export interface SeverityStat {
  matched: number;
  goldens: number;
  recall: number | null;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

export interface Price {
  input: number;
  cacheRead: number | null;
  cacheWrite: number | null;
  output: number;
}

export type AccessPath = 'api' | 'subscription' | 'local' | 'unknown';
/** 'api-equivalent' = ran on a subscription, priced at API list price. */
export type CostBasis = 'api' | 'api-equivalent' | 'unpriced';

export interface LeaderboardEntry {
  /** `${mode}::${modelId}` */
  key: string;
  mode: ReviewMode;
  modelId: string;
  /** Transport type, NOT the commercial vendor; use DISPLAY_NAMES for display. */
  provider: string | null;
  accessPath: AccessPath;
  harness: string;
  harnessVersion: string | null;
  executionMode: string;
  reasoningConfig: string;
  reasoningEffort: string | null;
  judge: string | null;
  gold: string | null;
  benchmarkVersion: string | null;
  runAt: string | null;

  /** Micro: valid TPs found / all valid TPs. */
  recall: number;
  /** Micro: comments matching a valid TP / all published comments. */
  precision: number;
  f1: number;
  /** F-beta with beta = 2: recall weighs twice precision. Ranking metric. */
  f2: number;
  recallMacro: number;
  precisionMacro: number;
  /** 95% bootstrap interval on recall, resampling PRs. */
  ciLow: number | null;
  ciHigh: number | null;

  goldensTotal: number;
  goldensMatched: number;
  comments: number;
  cases: number;
  calls: number | null;
  usage: Usage;

  byLanguage: Record<string, BucketStat>;
  byRepo: Record<string, BucketStat>;
  bySize: Record<string, BucketStat>;
  /** Recall by the gold bug's severity. */
  bySeverity: Record<'critical' | 'high' | 'medium' | 'low', SeverityStat>;
  /** Severity/category the model gave its own comments. */
  findingsBySeverity: { low: number; medium: number; high: number; critical: number };
  findingsByCategory: { bug: number; performance: number; security: number; other: number };

  costTotal: number | null;
  costPerPR: number | null;
  costPerBugFound: number | null;
  costBasis: CostBasis;
  costNote: string | null;
  priceSource: string | null;
  price: Price | null;

  /** Rank within its mode, by F2. */
  rank: number;
}

export interface LeaderboardAverages {
  recall: number | null;
  precision: number | null;
  f1: number | null;
  f2: number | null;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  averages: Record<ReviewMode, LeaderboardAverages>;
}

// ── Case samples (per model × mode × PR) ──
export interface Finding {
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  severity: string | null;
  category: string | null;
  description: string;
}

/** One gold-v3 true positive, found or not by this run. */
export interface GoldenDetail {
  issueId: string;
  text: string;
  severity: string | null;
  matched: boolean;
}

/** Light per-case index (no text) for client-side filtering. */
export interface CaseIndexRow {
  entryKey: string;
  caseId: string;
  repo: string;
  language: string;
  sizeBucket: string | null;
  goldens: number;
  matched: number;
  tpFindings: number;
  fpFindings: number;
  costUsd: number | null;
}

export interface CaseSample {
  id: string;
  entryKey: string;
  mode: ReviewMode;
  modelId: string;
  caseId: string;
  repo: string;
  language: string;
  filesChanged: number | null;
  linesChanged: number | null;
  sizeBucket: string | null;
  recall: number;
  precision: number;
  goldens: number;
  matched: number;
  comments: number;
  tpFindings: number;
  fpFindings: number;
  findings: Finding[];
  goldensDetail: GoldenDetail[];
  usage: Usage | null;
  calls: number | null;
  costUsd: number | null;
}

/** Per-page slices of CaseSample, so the server-side cut is type-checked. */
export type ModelDetailCase = Omit<CaseSample, 'findings' | 'usage'>;
