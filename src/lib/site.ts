/** Config canônica do site. Um lugar só — metadataBase, canonical, sitemap,
 *  JSON-LD e a URL de embed do badge derivam daqui. */
export const SITE_URL = 'https://codereviewbench.com';
export const SITE_NAME = 'CodeReviewBench';

/** Frase-alvo de busca. Aparece no title, no H1 do /leaderboard e no JSON-LD —
 *  não é keyword stuffing, é a descrição literal do que o site é. */
export const SITE_TAGLINE = 'AI Code Review Benchmark';

export const SITE_DESCRIPTION =
  'An open AI code review benchmark: we run real review agents against real merged pull requests from production open-source repos and measure how many human-reported bugs they actually find. Recall, precision, and cost per bug for every model — every submission and scorecard versioned in the repo.';
