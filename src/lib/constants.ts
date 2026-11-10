import type { ReviewMode } from './types';

/** v3 roster: site id → display name and vendor. Models without a scorecard
 *  yet show up as "running" on the leaderboard (see pendingModels). */
export const DISPLAY_NAMES: Record<string, { name: string; provider: string }> = {
  'deepseek-v4-pro': { name: 'DeepSeek V4 Pro', provider: 'DeepSeek' },
  'deepseek-v4.1-flash': { name: 'DeepSeek V4.1 Flash', provider: 'DeepSeek' },
  'kimi-k3.1-pro': { name: 'Kimi K3.1 Pro', provider: 'Moonshot' },
  'glm-5.3': { name: 'GLM-5.3', provider: 'Zhipu' },
  'glm-5.3-flash': { name: 'GLM-5.3 Flash', provider: 'Zhipu' },
  'minimax-m3': { name: 'MiniMax M3', provider: 'MiniMax' },
  'gemini-3.8-flash': { name: 'Gemini 3.8 Flash', provider: 'Google' },
  'muse-spark-1.2': { name: 'Muse Spark 1.2', provider: 'Meta' },
  'gpt-6.1-sol': { name: 'GPT-6.1 Sol', provider: 'OpenAI' },
  'gpt-6-luna': { name: 'GPT-6 Luna', provider: 'OpenAI' },
  'claude-sonnet-5.5': { name: 'Claude Sonnet 5.5', provider: 'Anthropic' },
  'claude-opus-5.5': { name: 'Claude Opus 5.5', provider: 'Anthropic' },
  'qwen3.8-27b': { name: 'Qwen3.8 27B', provider: 'Alibaba' },
};

export const V3_ROSTER = Object.keys(DISPLAY_NAMES);

/** Roster models with no published row yet in any mode. */
export function pendingModels(publishedModelIds: string[]): string[] {
  const have = new Set(publishedModelIds);
  return V3_ROSTER.filter((id) => !have.has(id));
}

export const MODE_LABELS: Record<ReviewMode, string> = {
  balanced: 'Balanced',
  heavy: 'Heavy',
};

export const MODE_DESCRIPTIONS: Record<ReviewMode, string> = {
  balanced: 'The normal review, with one generalist agent.',
  heavy: 'The generalist plus 9 specialist lens agents in parallel, then the same verify and dedup steps.',
};

/** Judge model id (as in the scorecard) → display name. */
export const JUDGE_LABELS: Record<string, string> = {
  'claude-haiku-5-5': 'Claude Haiku 5.5',
};

export function judgeLabel(id: string | null | undefined): string {
  if (!id) return 'unknown';
  return JUDGE_LABELS[id] || id;
}

export const COST_BASIS_LABELS: Record<string, string> = {
  api: 'API list price',
  'api-equivalent': 'API-equivalent',
  unpriced: 'no published price',
};

/** modelId → segmento de URL seguro.
 *
 *  O sufixo de rota (`@fireworks`, `@nvidia`) e convencao do harness e precisa
 *  ficar no DADO — e o que distingue "GLM-5.2 pela Z.ai" de "GLM-5.2 por
 *  gateway", e o que indexa o pricing.json. Mas `@` quebra o roteamento do
 *  Next (rota 404 mesmo com o HTML gerado no build, testado), entao a URL usa
 *  `--`. Sempre comparar via slug; nunca reconstruir o id de volta na mao. */
export function modelSlug(modelId: string): string {
  return modelId.replace('@', '--');
}

export function displayNameOf(modelId: string): string {
  return DISPLAY_NAMES[modelId]?.name || modelId;
}

export function providerOf(modelId: string): string {
  return DISPLAY_NAMES[modelId]?.provider || 'Unknown';
}

/** As 6 primeiras foram validadas com scripts/validate_palette.js (skill
 *  dataviz) nos modos claro e escuro: banda de luminância, piso de croma,
 *  separação CVD (ΔE ≥ 8 nos pares adjacentes) e contraste contra a
 *  superfície. Ordem fixa — nunca ciclar. xAI/Zhipu NÃO estão validadas
 *  (nenhum modelo desses fornecedores está publicado ainda) — rodar o
 *  validador com o conjunto completo antes de publicar algo que os use. */
export const PROVIDER_COLORS: Record<string, string> = {
  // Anthropic (2026-11-07): marca oficial e quase-preta; no tema claro ela le
  //   bem e nao colide com nenhuma cor da paleta. NAO validada no script.
  Anthropic: '#262626',
  Alibaba: '#2b6cb0',
  DeepSeek: '#dd6b20',
  Moonshot: '#38a169',
  Meta: '#805ad5',
  OpenAI: '#c53030',
  Google: '#0987a0',
  // MiniMax (2026-08-20): escolhida rodando simulação de protanopia,
  //   deuteranopia e tritanopia (Brettel/Viénot) contra as 8 cores já em uso.
  //   Pior caso ΔE = 15,8 — a melhor separação da paleta inteira.
  // ACHADO ao fazer isso: o "ΔE ≥ 8" prometido no comentário acima vale para
  //   VISÃO NORMAL, não sob daltonismo. Sob CVD a paleta atual não cumpre o
  //   próprio critério — Meta (#805ad5) e xAI (#71717a) ficam a ΔE 3,2 um do
  //   outro, praticamente indistinguíveis. Vale revisar esses dois.
  MiniMax: '#883848',
  // não validadas:
  xAI: '#71717a',
  Zhipu: '#b45309',
};

export const REPO_LABELS: Record<string, string> = {
  'cal.com': 'cal.com',
  discourse: 'Discourse',
  grafana: 'Grafana',
  keycloak: 'Keycloak',
  sentry: 'Sentry',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  ruby: 'Ruby',
  java: 'Java',
  go: 'Go',
};

export const ACCESS_PATH_LABELS: Record<string, string> = {
  api: 'API',
  subscription: 'Subscription',
  local: 'Local',
  unknown: 'Unknown',
};

export const ALL_LANGUAGES = Object.keys(LANGUAGE_LABELS);
export const ALL_REPOS = Object.keys(REPO_LABELS);

/** sizeBucket (pr-size.json) → rótulo com a faixa real em linhas alteradas. */
export const SIZE_LABELS: Record<string, string> = {
  XS: 'XS · <30 lines',
  S: 'S · 30–99 lines',
  M: 'M · 100–299 lines',
  L: 'L · 300–799 lines',
  XL: 'XL · 800+ lines',
};
