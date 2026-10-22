import leaderboardData from '@/lib/data/leaderboard.json';
import metaData from '@/lib/data/meta.json';
import type { LeaderboardData, LeaderboardEntry, Meta } from '@/lib/types';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { allPairs, pairDiff, type GoldenSplit } from '@/lib/compare';
import { publishedPosts, postBody } from '@/lib/blog';
import { SITE_URL, SITE_DESCRIPTION } from '@/lib/site';

const lb = leaderboardData as unknown as LeaderboardData;
const meta = metaData as unknown as Meta;

/**
 * /llms-full.txt — convencao irma do llms.txt (ja usada em aicodereview.io,
 * agentwrotethis.dev e mergerequests.dev): nao um indice, o CONTEUDO inteiro
 * das paginas que um crawler precisaria renderizar e seguir link a link pra
 * reconstruir, tudo numa resposta so, marcado com `<!-- source: url -->`
 * antes de cada secao.
 *
 * Gerado do MESMO leaderboard.json/samples.json/*.mdx que as paginas usam —
 * ver a nota em llms.txt/route.ts sobre por que isto nunca e escrito a mao.
 */
function goldenLine(g: GoldenSplit): string {
    const sev = g.severity ? g.severity.toUpperCase() : 'UNRATED';
    const repo = REPO_LABELS[g.repo] || g.repo;
    const lang = LANGUAGE_LABELS[g.language] || g.language;
    return `- [${sev}] ${g.text} (${repo}, ${lang}, case ${g.caseId})`;
}

function modelSection(e: LeaderboardEntry, rank: number, total: number): string {
    const name = displayNameOf(e.modelId);
    const provider = providerOf(e.modelId);

    const byLanguage = Object.entries(e.byLanguage)
        .map(([lang, s]) => `- ${LANGUAGE_LABELS[lang] || lang}: recall ${formatScore(s.recall)}, precision ${formatScore(s.precision)} (${s.goldens} goldens, ${s.count} cases)`)
        .join('\n');

    const byRepo = Object.entries(e.byRepo)
        .map(([repo, s]) => `- ${REPO_LABELS[repo] || repo}: recall ${formatScore(s.recall)}, precision ${formatScore(s.precision)} (${s.goldens} goldens, ${s.count} cases)`)
        .join('\n');

    const bySize = Object.entries(e.bySize)
        .map(([size, s]) => `- ${size}: recall ${formatScore(s.recall)}, precision ${formatScore(s.precision)} (${s.goldens} goldens, ${s.count} cases)`)
        .join('\n');

    const fs = e.findingsBySeverity;
    const fc = e.findingsByCategory;

    return `<!-- source: ${SITE_URL}/model/${modelSlug(e.modelId)} -->

# ${name} — AI Code Review Benchmark Results

> How well does ${name} review code? Measured on ${e.cases} real merged pull requests: ${formatScore(e.score)} recall, ${formatScore(e.precision)} precision, F1 ${e.f1.toFixed(1)}, finding ${e.goldensMatched} of ${e.goldensTotal} human-reported bugs.

${name} (${provider}) ranks #${rank} of ${total} models on CodeReviewBench, with ${formatScore(e.score)} recall (macro ${formatScore(e.recallMacro)}), ${formatScore(e.precision)} precision (macro ${formatScore(e.precisionMacro)}) and F1 ${e.f1.toFixed(1)}. It found ${e.goldensMatched} of ${e.goldensTotal} confirmed human-reported bugs across ${e.cases} pull requests. Judge: ${e.judge ?? 'unknown'}. Execution mode: ${e.executionMode}. Harness: ${e.harness}${e.harnessVersion ? ` (${e.harnessVersion})` : ''}. Run at: ${e.runAt ?? 'unknown'}.

## By language
${byLanguage}

## By repository
${byRepo}

## By pull request size
${bySize}

## Findings reported
By severity — low: ${fs.low}, medium: ${fs.medium}, high: ${fs.high}, critical: ${fs.critical}.
By category — bug: ${fc.bug}, performance: ${fc.performance}, security: ${fc.security}, other: ${fc.other}.

## Cost
Total ${formatMoney(e.costTotal, 2)}, ${formatMoney(e.costPerPR, 2)}/PR, ${formatMoney(e.costPerBugFound, 2)}/bug found. Basis: ${e.costBasis}.
`;
}

function compareSection(pair: { a: LeaderboardEntry; b: LeaderboardEntry; slug: string }): string {
    const { a, b, slug } = pair;
    const nameA = displayNameOf(a.modelId);
    const nameB = displayNameOf(b.modelId);
    const diff = pairDiff(a, b);

    const onlyA = diff.onlyA.length ? diff.onlyA.map(goldenLine).join('\n') : '(none)';
    const onlyB = diff.onlyB.length ? diff.onlyB.map(goldenLine).join('\n') : '(none)';

    return `<!-- source: ${SITE_URL}/compare/${slug} -->

# ${nameA} vs ${nameB}

> Head-to-head on the same merged pull requests: ${diff.sharedCases} shared cases compared${diff.uncoveredCases ? `, ${diff.uncoveredCases} excluded for missing golden coverage` : ''}.

${nameA}: ${formatScore(a.score)} recall, ${formatScore(a.precision)} precision, F1 ${a.f1.toFixed(1)}, ${a.goldensMatched}/${a.goldensTotal} bugs found.
${nameB}: ${formatScore(b.score)} recall, ${formatScore(b.precision)} precision, F1 ${b.f1.toFixed(1)}, ${b.goldensMatched}/${b.goldensTotal} bugs found.

Both found: ${diff.both}. Neither found: ${diff.neither}.

## Bugs only ${nameA} found (${diff.onlyA.length})
${onlyA}

## Bugs only ${nameB} found (${diff.onlyB.length})
${onlyB}
`;
}

function blogSection(slug: string, title: string, description: string): string {
    const body = postBody(slug) ?? '';
    return `<!-- source: ${SITE_URL}/blog/${slug} -->

# ${title}

> ${description}

${body}
`;
}

export function GET() {
    const ranked = lb.entries.slice().sort((a, b) => b.f1 - a.f1);

    const leaderboardRows = ranked
        .map(
            (e, i) =>
                `| ${i + 1} | ${displayNameOf(e.modelId)} | ${providerOf(e.modelId)} | ${formatScore(e.score)} | ${formatScore(e.precision)} | ${e.f1.toFixed(1)} | ${e.goldensMatched}/${e.goldensTotal} | ${formatMoney(e.costPerPR, 2)} |`,
        )
        .join('\n');

    const leaderboardSection = `<!-- source: ${SITE_URL}/leaderboard -->

# CodeReviewBench Leaderboard

> Current results, ranked by F1. ${meta.totalEntries} models evaluated on ${meta.totalCases} merged pull requests across ${meta.repos.join(', ')}, covering ${meta.languages.join(', ')}. ${meta.totalGoldens} confirmed human-reported bugs form the ground truth. Judge: ${meta.judges.join(', ')}. Harness: ${meta.harnesses.join(', ')}. Data generated ${meta.generatedAt}.

| Rank | Model | Provider | Recall | Precision | F1 | Bugs found | Cost/PR |
| --- | --- | --- | --- | --- | --- | --- | --- |
${leaderboardRows}

Averages across all ${meta.totalEntries} models: recall ${lb.averages.score != null ? formatScore(lb.averages.score) : '—'}, precision ${lb.averages.precision != null ? formatScore(lb.averages.precision) : '—'}, F1 ${lb.averages.f1 != null ? lb.averages.f1.toFixed(1) : '—'}.
`;

    const modelSections = ranked.map((e, i) => modelSection(e, i + 1, ranked.length)).join('\n');

    const compareSections = allPairs()
        .map(compareSection)
        .join('\n');

    const posts = publishedPosts();
    const blogSections = posts.map((p) => blogSection(p.slug, p.title, p.description)).join('\n');

    const body = `# codereviewbench.com — full content

> ${SITE_DESCRIPTION} Maintained by Kodus (https://kodus.io); every submission and scorecard is versioned in the public repo (https://github.com/kodustech/codereviewbench). Summary index: ${SITE_URL}/llms.txt.

---

# Part 1: Leaderboard

${leaderboardSection}
---

# Part 2: Model pages (${ranked.length})

${modelSections}
---

# Part 3: Compare pages (${allPairs().length})

${compareSections}
---

# Part 4: Blog posts (${posts.length})

${blogSections}`;

    return new Response(body, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
