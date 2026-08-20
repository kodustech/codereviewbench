// ── Meta ──
export interface VarianceCaveat {
  measured: string;
  notMeasured: string;
  runsPerEntry: number;
  judgeRunsAvailable: number;
  judgeRunsTotal: number;
}

export interface Meta {
  totalEntries: number;
  harnesses: string[];
  models: string[];
  languages: string[];
  repos: string[];
  /** Ordem por tamanho (XS→XL), não alfabética. */
  sizes: string[];
  executionModes: string[];
  accessPaths: string[];
  judges: string[];
  totalCases: number;
  totalGoldens: number;
  varianceCaveat: VarianceCaveat;
  generatedAt: string;
}

// ── Leaderboard ──
export interface BucketStat {
  recall: number;
  precision: number;
  goldens: number;
  count: number;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export type AccessPath = 'api' | 'subscription' | 'local' | 'unknown';
export type ExecutionMode = 'replay' | 'live' | 'unknown';

export interface LeaderboardEntry {
  key: string;
  harness: string;
  harnessVersion: string | null;
  modelId: string;
  /** Tipo de transporte (openai_compatible/anthropic/google/...), NÃO o
   *  fornecedor comercial — usar DISPLAY_NAMES em constants.ts para exibição. */
  provider: string;
  accessPath: AccessPath;
  executionMode: ExecutionMode;
  reasoningConfig: string;
  reasoningEffort: string | null;
  reasoningTokens: number | null;
  finishReasons: Record<string, number>;
  maxFindingsInCase: number;
  judge: string | null;
  runAt: string | null;

  /** Recall micro (headline, usado para ranking). */
  score: number;
  recallMacro: number;
  /** Precisão micro — TP/(TP+FP) agregado no bench inteiro. */
  precision: number;
  precisionMacro: number;
  /** F1 micro. */
  f1: number;
  fairRecall: number;
  loopFidelity: number | null;

  goldensTotal: number;
  goldensMatched: number;
  cases: number;
  usage: Usage;

  byLanguage: Record<string, BucketStat>;
  byRepo: Record<string, BucketStat>;
  bySize: Record<string, BucketStat>;
  /** Severidade/categoria dos findings REPORTADOS — sinal de calibração do
   *  modelo (grita "critical" pra tudo, ou é conservador?), não recall por
   *  severidade — goldens não têm severidade anotada. */
  findingsBySeverity: { low: number; medium: number; high: number; critical: number };
  findingsByCategory: { bug: number; performance: number; security: number; other: number };

  costTotal: number | null;
  costPerPR: number | null;
  costPerBugFound: number | null;
  costBasis: string;

  ciHalfWidth: number;
  ciLow: number | null;
  ciHigh: number | null;
  ciHalfWidthBootstrap: number;

  /** Judge re-scored 3x sobre a MESMA submission — ruído do judge, não do
   *  modelo. null quando as rodadas extras ainda não existem pra essa
   *  entrada (parcial não é publicado — ver process-scorecards.js). */
  runToRunVariance: RunToRunVariance | null;

  rank: number;
}

export interface VarianceStat {
  mean: number;
  stdev: number | null;
  values: number[];
}

export interface RunToRunVariance {
  runs: number;
  recall: VarianceStat;
  precision: VarianceStat;
  f1: VarianceStat;
}

export interface LeaderboardAverages {
  score: number | null;
  precision: number | null;
  f1: number | null;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  averages: LeaderboardAverages;
}

// ── Case samples (per model × PR) ──
export interface Finding {
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  severity: string | null;
  category: string | null;
  description: string;
}

export interface MissedGolden {
  text: string;
  /** 'realMiss' = código estava disponível, modelo não achou.
   *  'artifact' = golden aponta pra código fora do corpus de replay.
   *  'untestable' = não dá pra verificar se o código estava disponível. */
  classification: 'realMiss' | 'artifact' | 'untestable';
}

/** Golden completo (achado ou não) — pra diff entre dois modelos no mesmo
 *  caso. null no CaseSample quando goldens.json não cobre esse caseId. */
export interface GoldenDetail {
  text: string;
  severity: string | null;
  matched: boolean;
}

/** Índice leve por caso — sem findings/texto — pra filtro combinado
 *  (linguagem + repo + tamanho) client-side sem embarcar o samples.json
 *  inteiro (que carrega descrições de finding) no bundle. */
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
}

export interface CaseSample {
  id: string;
  entryKey: string;
  harness: string;
  modelId: string | null;
  caseId: string;
  repo: string;
  language: string;
  filesChanged: number | null;
  linesChanged: number | null;
  sizeBucket: string | null;
  recall: number;
  precision: number;
  f1: number | null;
  goldens: number;
  matched: number;
  findings: Finding[];
  missedGoldens: MissedGolden[];
  goldensDetail: GoldenDetail[] | null;
  usage: Usage | null;
  latencyMs: number | null;
}

/**
 * Recortes de CaseSample por pagina.
 *
 * O samples.json tem 1,1MB e `findings` sozinho e 66% dele. Passar o objeto
 * inteiro como prop joga tudo no payload RSC mesmo quando a pagina nao le o
 * campo: /compare mandava `findings` (que nao usa) e /model mandava
 * `goldensDetail` (que nao usa). Estes tipos existem pra que a fatia feita no
 * servidor seja verificada pelo compilador, e nao um cast otimista.
 */
export type CompareCase = Omit<CaseSample, 'findings' | 'missedGoldens' | 'usage' | 'latencyMs'>;
export type ModelDetailCase = Omit<CaseSample, 'goldensDetail' | 'usage'>;
