import metaData from './data/meta.json';
import type { Meta } from './types';

const meta = metaData as unknown as Meta;

/** Config canônica do site. Um lugar só — metadataBase, canonical, sitemap,
 *  JSON-LD e a URL de embed do badge derivam daqui. */
export const SITE_URL = 'https://codereviewbench.com';
export const SITE_NAME = 'CodeReviewBench';

/** Frase-alvo de busca. Aparece no title, no H1 do /leaderboard e no JSON-LD —
 *  não é keyword stuffing, é a descrição literal do que o site é. */
export const SITE_TAGLINE = 'AI Code Review Benchmark';

// Google corta a description em ~155 caracteres; a anterior tinha 298 e o corte
// caia no meio de "Recall, precision", perdendo justamente os termos de busca.
// `totalEntries`/`totalCases` vem do meta.json pra nao envelhecer igual o "10
// modelos" fixo que ficou errado assim que o 11o modelo entrou na leaderboard.
export const SITE_DESCRIPTION = `An open benchmark of AI code review: ${meta.totalEntries} models run against ${meta.totalCases} real merged pull requests, scored on the bugs human reviewers actually caught.`;
