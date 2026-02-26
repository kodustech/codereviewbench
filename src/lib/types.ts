// ── Meta ──
export interface Meta {
  totalResults: number;
  totalModels: number;
  totalTestCases: number;
  languages: string[];
  categories: string[];
  judges: string[];
  generatedAt: string;
}

// ── Leaderboard ──
export interface JudgeBreakdown {
  coverage: number;
  validity: number;
}

export interface HistogramBucket {
  min: number;
  max: number;
  count: number;
}

export interface LatencyStats {
  p50: number;
  p90: number;
  p99: number;
}

export interface LeaderboardModel {
  slug: string;
  displayName: string;
  provider: string;
  rank: number;
  score: number;
  coverage: number;
  validity: number;
  localScore: number;
  crossFileScore: number;
  byLanguage: Record<string, { score: number; coverage: number; validity: number; count: number }>;
  byCategory: Record<string, { score: number; coverage: number; validity: number; count: number }>;
  judges: {
    sonnet: JudgeBreakdown;
    gpt: JudgeBreakdown;
  };
  histogram: HistogramBucket[];
  latency: LatencyStats;
  parseRate: number;
  lineMetrics: {
    lineAccuracy: number;
    avgIou: number;
    exactMatch: number;
    within3: number;
  };
  tests: number;
  errors: number;
  passRate: number;
}

export interface LeaderboardData {
  models: LeaderboardModel[];
  averages: {
    score: number;
    coverage: number;
    validity: number;
    localScore: number;
    crossFileScore: number;
  };
}

// ── Samples ──
export interface ReferenceBug {
  relevantFile: string;
  relevantLinesStart: number;
  relevantLinesEnd: number;
}

export interface CodeSuggestion {
  relevantFile: string;
  language?: string;
  suggestionContent: string;
  existingCode: string;
  improvedCode: string;
}

export interface JudgeResult {
  score: number;
  coverage: number;
  validity: number;
  reasoning: string;
}

export interface LineMetrics {
  lineAccuracy: number;
  avgIou: number;
  exactMatch: number;
  within3: number;
  matched: string;
}

export interface Sample {
  id: string;
  modelSlug: string;
  modelDisplayName: string;
  provider: string;
  testDescription: string;
  lang: string;
  category: string;
  pass: boolean;
  score: number;
  latencyMs: number;
  parseOk: boolean;
  prSummary: string;
  fileContent: string;
  patch: string;
  referenceBugs: ReferenceBug[];
  response: CodeSuggestion[];
  responseRaw: string;
  judges: {
    sonnet: JudgeResult;
    gpt: JudgeResult;
  };
  lineMetrics: LineMetrics | null;
  crossFileContext: string | null;
}
