import metaData from '@/lib/data/meta.json';
import type { Meta } from '@/lib/types';
import { displayNameOf, modelSlug, MODE_LABELS, MODE_DESCRIPTIONS, judgeLabel } from '@/lib/constants';
import { entriesOf, MODES } from '@/lib/entries';
import { SITE_URL } from '@/lib/site';
import { publishedPosts } from '@/lib/blog';

const meta = metaData as unknown as Meta;

/**
 * /llms.txt — markdown summary for generative-engine crawlers. Generated from
 * the same leaderboard.json the pages use, never written by hand.
 */
export function GET() {
    const tables = MODES.filter((m) => entriesOf(m).length)
        .map((m) => {
            const rows = entriesOf(m)
                .map(
                    (e) =>
                        `${e.rank}. [${displayNameOf(e.modelId)}](${SITE_URL}/model/${modelSlug(e.modelId)}): F2 ${e.f2.toFixed(1)}, recall ${e.recall.toFixed(1)}%, precision ${e.precision.toFixed(1)}%, F1 ${e.f1.toFixed(1)}; found ${e.goldensMatched}/${e.goldensTotal} confirmed bugs with ${e.comments} comments${e.costPerPR != null ? `; $${e.costPerPR.toFixed(3)}/PR, $${e.costPerBugFound?.toFixed(3) ?? 'n/a'}/bug found${e.costBasis === 'api-equivalent' ? ' (API-equivalent)' : ''}` : ''}.`,
                )
                .join('\n');
            return `### ${MODE_LABELS[m]} mode\n\n${MODE_DESCRIPTIONS[m]}\n\n${rows}`;
        })
        .join('\n\n');

    const notes = [...new Set(MODES.flatMap((m) => entriesOf(m).map((e) => e.costNote)).filter(Boolean))]
        .map((n) => `- ${n}`)
        .join('\n');

    const posts = publishedPosts()
        .map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`)
        .join('\n');

    const top = entriesOf('balanced')[0] ?? entriesOf('heavy')[0];

    const body = `# CodeReviewBench

> An open benchmark measuring how well AI models find real bugs in code review.
> Models review merged pull requests from production open-source repositories,
> inside the Kodus review harness, in two review modes, and are scored against a
> labelled set of the real bugs in those PRs.

Maintained by Kodus. Every submission and scorecard is versioned in the public repo.

## What is measured

${meta.totalModels} models, ${meta.totalCases} merged pull requests, ${meta.totalGoldens} confirmed bugs (gold v3).
Repositories: ${meta.repos.join(', ')}.
Languages: ${meta.languages.join(', ')}.
Review modes: balanced (${MODE_DESCRIPTIONS.balanced.toLowerCase()}) and heavy (${MODE_DESCRIPTIONS.heavy.toLowerCase()})
Judge: ${meta.judges.map(judgeLabel).join(', ')}, validated against Claude Opus 5.5 (agreed on 249 of 252 comments).
Runs: ${meta.firstRunAt?.slice(0, 10)} to ${meta.lastRunAt?.slice(0, 10)}. Data generated ${meta.generatedAt}.

Gold v3: the same 30 PRs as the earlier version of this benchmark, with the real
problems re-labelled by Kodus (Claude Opus plus a second reviewer, debated where
they disagreed): ${meta.totalGoldens} valid true positives.

Recall is valid true positives found divided by ${meta.totalGoldens}. Precision is
published comments that match a valid true positive divided by all published
comments; each true positive counts once, and a second comment on the same one is
a false positive. F1 is the harmonic mean. F2 is the F-score with beta = 2
(popularized for code review by Martian's benchmark): F2 = 5·P·R / (4·P + R). It
weighs recall twice as much as precision, because a missed bug costs more than a
comment you dismiss. Results are ranked by F2 within each mode.

Cost uses each vendor's list price (read ${meta.pricesCollectedAt}) with prompt cache:
(input - cacheRead - cacheWrite) x input price + cacheRead x cache-read price +
cacheWrite x cache-write price + output x output price.
${notes}

## Current results

${tables}

## Interpretation limits

One run per model and mode. With ${meta.totalCases} PRs, small gaps between models are
within sampling noise; each model page shows a 95% bootstrap interval on recall.
Kodus runs the benchmark, built the harness and labelled the gold set.

## Canonical sources

- [Machine-readable leaderboard data](${SITE_URL}/api/leaderboard.json): metrics per model and mode. Prefer this or a model page for numerical claims.
- [Leaderboard](${SITE_URL}/leaderboard): balanced mode; [heavy mode](${SITE_URL}/leaderboard?mode=heavy).
- [Compare two models](${SITE_URL}/compare): side by side within one mode.
- [Blog and analysis](${SITE_URL}/blog): posts written on the earlier v1 benchmark (Aug–Sep 2026); their numbers predate gold v3.
- [XML sitemap](${SITE_URL}/sitemap.xml).
- [Public repository](https://github.com/kodustech/codereviewbench): scorecards, submissions, pipeline.
- [Full site content](${SITE_URL}/llms-full.txt).
${posts ? `\n## Writing (v1 numbers)\n\n${posts}\n` : ''}
## Citation

Name the model, the review mode, the metric and the data date. Example:
${top ? `"${displayNameOf(top.modelId)} (${MODE_LABELS[top.mode].toLowerCase()} mode) scored F2 ${top.f2.toFixed(1)}, recall ${top.recall.toFixed(1)}%, finding ${top.goldensMatched}/${top.goldensTotal} confirmed bugs on CodeReviewBench (${(meta.generatedAt || '').slice(0, 10)})."` : ''}
`;

    return new Response(body, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
