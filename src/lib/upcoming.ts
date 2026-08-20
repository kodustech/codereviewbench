/**
 * Modelos ainda nao publicados no leaderboard.
 *
 * Cada linha diz o motivo REAL de nao estar la, tirado do
 * `docs/adr-model-access-paths.md` (quadro-resumo, secao 7). Nada aqui e
 * promessa de data: num site cujo produto e auditabilidade, "em breve" sem
 * motivo e a mesma classe de afirmacao nao verificavel que o bench existe pra
 * combater.
 *
 * Achado do ADR que define a redacao: NENHUM dos fornecedores proibe publicar
 * benchmark. O que bloqueia e o CAMINHO DE ACESSO. Via API key, Anthropic e
 * OpenAI sao explicitamente permitidos — entao estes nao estao "excluidos",
 * estao na fila esperando rodada por API.
 */
export interface UpcomingModel {
  name: string;
  provider: string;
  /** Estado curto, mostrado como badge. */
  status: 'queued' | 'measured';
  /** Por que ainda nao esta publicado. Uma frase, verificavel. */
  note: string;
}

export const UPCOMING_MODELS: UpcomingModel[] = [
  {
    name: 'Claude Opus 5',
    provider: 'Anthropic',
    status: 'queued',
    note: 'Anthropic allows this benchmark over an API key. The subscription path does not, so this one waits on an API run.',
  },
  {
    name: 'Claude Fable 5',
    provider: 'Anthropic',
    status: 'queued',
    note: 'Same access path as Opus 5, same queue.',
  },
  {
    name: 'GPT-5.6',
    provider: 'OpenAI',
    status: 'measured',
    note: 'Already measured, but over a ChatGPT subscription, which the terms do not allow for this. Held back until it is re-run over the API.',
  },
];
