import metaData from '@/lib/data/meta.json';
import type { LeaderboardEntry, Meta, ReviewMode } from '@/lib/types';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS, MODE_LABELS, COST_BASIS_LABELS, judgeLabel } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { allPairsEveryMode, pairDiff, pairHref, type GoldenSplit, type Pair } from '@/lib/compare';
import { entriesOf, entryFor, publishedModelIds, lb, MODES } from '@/lib/entries';
import { publishedPosts, postBody } from '@/lib/blog';
import { SITE_URL, SITE_DESCRIPTION } from '@/lib/site';

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

function modeBlock(e: LeaderboardEntry, total: number): string {
    const line = (o: Record<string, { recall: number; precision: number | null; goldens: number; matched: number; count: number }>, label: (k: string) => string) =>
        Object.entries(o)
            .map(([k, v]) => `- ${label(k)}: recall ${formatScore(v.recall)} (${v.matched}/${v.goldens}), precision ${v.precision == null ? 'n/a' : formatScore(v.precision)}, ${v.count} PRs`)
            .join('\n');
    const sev = (['critical', 'high', 'medium', 'low'] as const)
        .map((k) => `${k} ${e.bySeverity[k].matched}/${e.bySeverity[k].goldens}`)
        .join(', ');
    return `## ${MODE_LABELS[e.mode]} mode

Rank #${e.rank} of ${total} by F2. F2 ${e.f2.toFixed(1)}, F1 ${e.f1.toFixed(1)}, recall ${formatScore(e.recall)} (95% CI ${e.ciLow?.toFixed(1)}–${e.ciHigh?.toFixed(1)}), precision ${formatScore(e.precision)}. Found ${e.goldensMatched} of ${e.goldensTotal} confirmed bugs with ${e.comments} published comments. Run at ${e.runAt ?? 'unknown'}.

Recall by bug severity: ${sev}.

By language:
${line(e.byLanguage, (k) => LANGUAGE_LABELS[k] || k)}

By repository:
${line(e.byRepo, (k) => REPO_LABELS[k] || k)}

Cost (${COST_BASIS_LABELS[e.costBasis]}, with prompt cache): total ${formatMoney(e.costTotal, 2)}, ${formatMoney(e.costPerPR, 3)}/PR, ${formatMoney(e.costPerBugFound, 3)}/bug found.${e.costNote ? ` ${e.costNote}` : ''}
`;
}

function modelSection(modelId: string): string {
    const name = displayNameOf(modelId);
    const provider = providerOf(modelId);
    const blocks = MODES.map((m) => {
        const e = entryFor(modelId, m);
        return e ? modeBlock(e, entriesOf(m).length) : `## ${MODE_LABELS[m]} mode

Not run yet.
`;
    }).join('\n');
    const any = entryFor(modelId, 'balanced') ?? entryFor(modelId, 'heavy')!;
    return `<!-- source: ${SITE_URL}/model/${modelSlug(modelId)} -->

# ${name} — AI Code Review Benchmark Results

${name} (${provider}) on CodeReviewBench: ${any.cases} merged pull requests, ${any.goldensTotal} confirmed bugs, judge ${judgeLabel(any.judge)}, harness ${any.harness}, access ${any.accessPath}.

${blocks}`;
}

function compareSection(pair: Pair): string {
    const { a, b, slug, mode } = pair;
    const nameA = displayNameOf(a.modelId);
    const nameB = displayNameOf(b.modelId);
    const diff = pairDiff(a, b);
    const onlyA = diff.onlyA.length ? diff.onlyA.map(goldenLine).join('\n') : '(none)';
    const onlyB = diff.onlyB.length ? diff.onlyB.map(goldenLine).join('\n') : '(none)';
    return `<!-- source: ${SITE_URL}${pairHref(mode, slug)} -->

# ${nameA} vs ${nameB} (${MODE_LABELS[mode]} mode)

> Head-to-head on the same ${diff.sharedCases} merged pull requests, same review mode.

${nameA}: F2 ${a.f2.toFixed(1)}, ${formatScore(a.recall)} recall, ${formatScore(a.precision)} precision, ${a.goldensMatched}/${a.goldensTotal} bugs found, ${formatMoney(a.costPerPR, 3)}/PR.
${nameB}: F2 ${b.f2.toFixed(1)}, ${formatScore(b.recall)} recall, ${formatScore(b.precision)} precision, ${b.goldensMatched}/${b.goldensTotal} bugs found, ${formatMoney(b.costPerPR, 3)}/PR.

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

function leaderboardTable(mode: ReviewMode): string {
    const rows = entriesOf(mode)
        .map(
            (e) =>
                `| ${e.rank} | ${displayNameOf(e.modelId)} | ${providerOf(e.modelId)} | ${e.f2.toFixed(1)} | ${formatScore(e.recall)} | ${formatScore(e.precision)} | ${e.f1.toFixed(1)} | ${e.goldensMatched}/${e.goldensTotal} | ${formatMoney(e.costPerPR, 3)} | ${formatMoney(e.costPerBugFound, 3)} |`,
        )
        .join('\n');
    const avg = lb.averages[mode];
    return `## ${MODE_LABELS[mode]} mode

| Rank | Model | Provider | F2 | Recall | Precision | F1 | Bugs found | Cost/PR | Cost/bug |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

Averages: F2 ${avg.f2?.toFixed(1) ?? '—'}, recall ${avg.recall != null ? formatScore(avg.recall) : '—'}, precision ${avg.precision != null ? formatScore(avg.precision) : '—'}.
`;
}

export function GET() {
    const notes = [...new Set(lb.entries.map((e) => e.costNote).filter(Boolean))].map((n) => `- ${n}`).join('\n');
    const leaderboardSection = `<!-- source: ${SITE_URL}/leaderboard -->

# CodeReviewBench Leaderboard

> Ranked by F2 within each review mode. ${meta.totalModels} models on ${meta.totalCases} merged pull requests across ${meta.repos.join(', ')}, covering ${meta.languages.join(', ')}. ${meta.totalGoldens} confirmed bugs form the ground truth. Judge: ${meta.judges.map(judgeLabel).join(', ')}. Harness: ${meta.harnesses.join(', ')}. Data generated ${meta.generatedAt}.

F2 = 5·P·R / (4·P + R): recall weighs twice precision, because a missed bug costs more than a comment you dismiss. Cost is list price with prompt cache.
${notes}

${MODES.filter((m) => entriesOf(m).length).map(leaderboardTable).join('\n')}`;

    const models = publishedModelIds();
    const modelSections = models.map(modelSection).join('\n');
    const pairs = allPairsEveryMode();
    const compareSections = pairs.map(compareSection).join('\n');
    const posts = publishedPosts();
    const blogSections = posts.map((p) => blogSection(p.slug, p.title, p.description)).join('\n');

    const body = `# codereviewbench.com — full content

> ${SITE_DESCRIPTION} Maintained by Kodus (https://kodus.io); every submission and scorecard is versioned in the public repo (https://github.com/kodustech/codereviewbench). Summary index: ${SITE_URL}/llms.txt.

---

# Part 1: Leaderboard

${leaderboardSection}
---

# Part 2: Model pages (${models.length})

${modelSections}
---

# Part 3: Compare pages (${pairs.length})

${compareSections}
---

# Part 4: Blog posts (${posts.length}, numbers from the v1 benchmark, Aug–Sep 2026)

${blogSections}`;

    return new Response(body, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
