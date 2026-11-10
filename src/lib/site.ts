import metaData from './data/meta.json';
import type { Meta } from './types';

const meta = metaData as unknown as Meta;

/** Config canônica do site. Um lugar só — metadataBase, canonical, sitemap,
 *  JSON-LD e a URL de embed do badge derivam daqui. */
export const SITE_URL = 'https://codereviewbench.com';
export const SITE_NAME = 'CodeReviewBench';

/** Frase-alvo de busca. Aparece no title, no H1 do /leaderboard e no JSON-LD. */
export const SITE_TAGLINE = 'AI Code Review Benchmark';

// Google corta a description em ~155 caracteres. Contagens vem do meta.json
// pra nao envelhecer quando entra modelo novo.
export const SITE_DESCRIPTION = `An open AI code review benchmark: ${meta.totalModels} models in two review modes on ${meta.totalCases} real merged PRs, scored against ${meta.totalGoldens} confirmed bugs.`;
