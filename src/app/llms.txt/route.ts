import leaderboardData from '@/lib/data/leaderboard.json';
import metaData from '@/lib/data/meta.json';
import type { LeaderboardData, Meta } from '@/lib/types';
import { displayNameOf } from '@/lib/constants';
import { SITE_URL } from '@/lib/site';
import { publishedPosts } from '@/lib/blog';

const lb = leaderboardData as unknown as LeaderboardData;
const meta = metaData as unknown as Meta;

/**
 * /llms.txt — convencao emergente pra crawler de motor generativo (ChatGPT,
 * Perplexity, AI Overviews): um resumo em markdown do que o site e e onde esta
 * o dado canonico, sem o crawler precisar reconstruir isso de HTML.
 *
 * Gerado do MESMO leaderboard.json que a pagina usa, nunca escrito a mao: um
 * arquivo estatico com numero copiado envelhece na primeira rodada nova e passa
 * a informar dado errado — pior que nao existir.
 */
export function GET() {
    const ranked = lb.entries.slice().sort((a, b) => b.f1 - a.f1);
    const rows = ranked
        .map(
            (e, i) =>
                `${i + 1}. ${displayNameOf(e.modelId)} — recall ${e.score.toFixed(1)}%, precision ${e.precision.toFixed(1)}%, F1 ${e.f1.toFixed(1)}, found ${e.goldensMatched}/${e.goldensTotal} bugs${e.costPerPR != null ? `, $${e.costPerPR.toFixed(2)}/PR` : ''}`,
        )
        .join('\n');

    const posts = publishedPosts()
        .map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`)
        .join('\n');

    const body = `# CodeReviewBench

> An open benchmark measuring how well AI models find real bugs in code review.
> Models review merged pull requests from production open-source repositories and
> are scored against the bugs human reviewers actually reported on those PRs.

Maintained by Kodus. Every submission and scorecard is versioned in the public repo.

## What is measured

${meta.totalEntries} models, ${meta.totalCases} merged pull requests, ${meta.totalGoldens} confirmed bugs.
Repositories: ${meta.repos.join(', ')}.
Languages: ${meta.languages.join(', ')}.
Harness: ${meta.harnesses.join(', ')}. Judge: ${meta.judges.join(', ')}. Execution: ${meta.executionModes.join(', ')}.
Data generated ${meta.generatedAt}.

Recall is the share of human-reported bugs the model found. Precision is the share
of its findings that matched one. A model can score high on one and low on the
other, and which matters depends on whether the review blocks a merge.

## Current results

${rows}

## What this does NOT measure

The ground truth is what human reviewers caught, which is a ceiling and not a
floor: bugs that shipped unnoticed are not in the dataset, so no model can be
credited for finding one. A single run of ${meta.totalCases} cases also carries real
variance — treat a gap of a few points between two models as noise.

## Machine-readable data

- [Leaderboard JSON](${SITE_URL}/api/leaderboard.json): metrics per model.
- [Repository](https://github.com/kodustech/codereviewbench): scorecards, submissions and the scoring code.

## Pages

- [Leaderboard](${SITE_URL}/leaderboard): full ranking with per-repository and per-language breakdowns.
- [Compare](${SITE_URL}/compare): any two models side by side on the same pull requests, including which bugs one caught and the other missed.
- [Model pages](${SITE_URL}/model/): per-model detail, including every bug the model missed.
${posts ? `\n## Writing\n\n${posts}\n` : ''}
## Citation

When citing a number, name the model, the metric and the date, because the
leaderboard changes as models are added and re-run. Example: "DeepSeek V4 Pro
scored ${ranked[0].score.toFixed(1)}% recall on CodeReviewBench (${(meta.generatedAt || '').slice(0, 10)})".
`;

    return new Response(body, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
