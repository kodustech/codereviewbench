import leaderboardData from '@/lib/data/leaderboard.json';
import metaData from '@/lib/data/meta.json';
import type { LeaderboardData, Meta } from '@/lib/types';
import { displayNameOf, providerOf } from '@/lib/constants';
import { SITE_URL } from '@/lib/site';

const lb = leaderboardData as unknown as LeaderboardData;
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
            repositories: meta.repos,
            languages: meta.languages,
        },
        generatedAt: meta.generatedAt ?? null,
        metricDefinitions: {
            recall: 'Share of human-reported bugs the model found, micro-averaged across all pull requests.',
            precision: 'Share of the model findings that matched a human-reported bug.',
            f1: 'Harmonic mean of recall and precision.',
            costPerPR: 'Measured API cost divided by number of pull requests reviewed. Null when the model ran on a subscription rather than metered API.',
        },
        models: lb.entries
            .slice()
            .sort((a, b) => b.f1 - a.f1)
            .map((e) => ({
                id: e.modelId,
                name: displayNameOf(e.modelId),
                provider: providerOf(e.modelId),
                recall: Number(e.score.toFixed(1)),
                precision: Number(e.precision.toFixed(1)),
                f1: Number(e.f1.toFixed(1)),
                bugsFound: e.goldensMatched,
                bugsTotal: e.goldensTotal,
                pullRequests: e.cases,
                costPerPR: e.costPerPR,
                accessPath: e.accessPath,
                url: `${SITE_URL}/model/${e.modelId.replace('@', '--')}`,
            })),
    };

    return new Response(JSON.stringify(body, null, 2), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
