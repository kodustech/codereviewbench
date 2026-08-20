/** modelId (o mesmo que TIER0 no kodus-ai) → nome e fornecedor pra exibição. */
export const DISPLAY_NAMES: Record<string, { name: string; provider: string }> = {
  'deepseek-v4-pro': { name: 'DeepSeek V4 Pro', provider: 'DeepSeek' },
  'deepseek-v4-flash': { name: 'DeepSeek V4 Flash', provider: 'DeepSeek' },
  'qwen3.8-max': { name: 'Qwen3.8 Max', provider: 'Alibaba' },
  'qwen3.8-27b': { name: 'Qwen3.8 27B', provider: 'Alibaba' },
  'kimi-k3': { name: 'Kimi K3', provider: 'Moonshot' },
  'kimi-k2.7-code': { name: 'Kimi K2.7 Code', provider: 'Moonshot' },
  'muse-spark-1.2': { name: 'Muse Spark 1.2', provider: 'Meta' },
  'gemini-3.7-flash': { name: 'Gemini 3.7 Flash', provider: 'Google' },
  'gpt-5.6-luna': { name: 'GPT-5.6 Luna', provider: 'OpenAI' },
  'gpt-5.6-terra': { name: 'GPT-5.6 Terra', provider: 'OpenAI' },
  'grok-4.5': { name: 'Grok 4.5', provider: 'xAI' },
  'grok-4.6': { name: 'Grok 4.6', provider: 'xAI' },
  'glm-5.2': { name: 'GLM-5.2', provider: 'Zhipu' },
  // Rodado via Fireworks (gateway), nao pela API nativa da Z.ai — o sufixo
  // fica no id (e no scorecard), mas o nome exibido e do MODELO, nao da rota.
  // A rota aparece no campo `harness`/nota de custo, nao no nome.
  'glm-5.2@fireworks': { name: 'GLM-5.2', provider: 'Zhipu' },
  'minimax-m3@fireworks': { name: 'MiniMax M3', provider: 'MiniMax' },
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
  Alibaba: '#2b6cb0',
  DeepSeek: '#dd6b20',
  Moonshot: '#38a169',
  Meta: '#805ad5',
  OpenAI: '#c53030',
  Google: '#0987a0',
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
