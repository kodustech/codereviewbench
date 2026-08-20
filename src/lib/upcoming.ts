/**
 * Modelos ainda nao medidos, mostrados no fim do leaderboard.
 *
 * So nome e fornecedor. A primeira versao trazia, por modelo, o motivo de nao
 * estar publicado ("Anthropic allows this benchmark over an API key, the
 * subscription path does not..."). Isso e um problema NOSSO de caminho de
 * acesso: quem le nao tem esse contexto e nao muda nada pra ele. A lista
 * responde a unica pergunta que o leitor faz aqui, que e quais modelos vem.
 *
 * O motivo real de cada um continua registrado, com clausula e fonte, no
 * quadro-resumo (secao 7) de docs/adr-model-access-paths.md. E la que se olha
 * antes de mexer nesta lista.
 */
export interface UpcomingModel {
  name: string;
  provider: string;
}

export const UPCOMING_MODELS: UpcomingModel[] = [
  { name: 'Claude Opus 5', provider: 'Anthropic' },
  { name: 'Claude Fable 5', provider: 'Anthropic' },
  { name: 'GPT-5.6', provider: 'OpenAI' },
];
