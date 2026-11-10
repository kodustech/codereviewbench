import metaData from '@/lib/data/meta.json';
import type { Meta } from '@/lib/types';
import { displayNameOf, providerOf, modelSlug, judgeLabel } from '@/lib/constants';
import { entriesOf, MODES } from '@/lib/entries';
import { SITE_URL } from '@/lib/site';

const meta = metaData as unknown as Meta;

/**
 * O dado bruto numa URL estavel.
 *
 * O JSON-LD ja declarava `DataDownload` com `encodingFormat: application/json`,
 * mas o `contentUrl` apontava pra pagina do GitHub, que devolve text/html —
 * quem seguisse o link atras de dado recebia HTML. E nao havia URL nenhuma
 * servindo os numeros em JSON, que e justamente o que um motor generativo
 * (ChatGPT, Perplexity, AI Overviews) consegue citar com precisao.
 *
 * Recorte proposital: as metricas de topo por modelo, sem os 30 casos e sem os
 * textos de finding. Quem quer o dado completo vai nos scorecards do repo.
 */
export function GET() {
    const body = {
        $schema: 'https://schema.org/Dataset',
        name: 'CodeReviewBench leaderboard',
        description:
            'How well AI models find real bugs in code review, measured on merged pull requests from production open-source repositories.',
        url: `${SITE_URL}/leaderboard`,
        license: 'https://github.com/kodustech/codereviewbench',
        measuredOn: {
            pullRequests: meta.totalCases,
            confirmedBugs: meta.totalGoldens,
            goldSet: 'gold-v3',
            judge: meta.judges.map(judgeLabel),
            repositories: meta.repos,
            languages: meta.languages,
        },
        generatedAt: meta.generatedAt ?? null,
        pricesCollectedAt: meta.pricesCollectedAt,
        metricDefinitions: {
            recall: 'Valid true positives found / all valid true positives in the gold set, micro-averaged.',
            precision: 'Published comments matching a valid true positive / all published comments. Each true positive counts once.',
            f1: 'Harmonic mean of recall and precision.',
            f2: 'F-score with beta = 2: 5*P*R / (4*P + R). Recall weighs twice precision. Ranking metric within each mode.',
            costPerPR: 'Token cost at vendor list price with prompt cache, divided by pull requests.',
            costPerBugFound: 'Same total cost divided by true positives found.',
        },
        modes: {
            balanced: 'The normal review: one generalist agent.',
            heavy: 'Generalist plus 9 specialist lens agents in parallel, then the same verify/dedup steps.',
        },
        models: MODES.flatMap((mode) =>
            entriesOf(mode).map((e) => ({
                id: e.modelId,
                name: displayNameOf(e.modelId),
                provider: providerOf(e.modelId),
                mode,
                rank: e.rank,
                f2: Number(e.f2.toFixed(1)),
                recall: Number(e.recall.toFixed(1)),
                precision: Number(e.precision.toFixed(1)),
                f1: Number(e.f1.toFixed(1)),
                bugsFound: e.goldensMatched,
                bugsTotal: e.goldensTotal,
                comments: e.comments,
                pullRequests: e.cases,
                costPerPR: e.costPerPR,
                costPerBugFound: e.costPerBugFound,
                costBasis: e.costBasis,
                costNote: e.costNote,
                accessPath: e.accessPath,
                runAt: e.runAt,
                url: `${SITE_URL}/model/${modelSlug(e.modelId)}`,
            })),
        ),
    };

    return new Response(JSON.stringify(body, null, 2), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
