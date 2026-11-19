import { live } from '@/lib/live';
import { SITE_URL } from '@/lib/site';

/**
 * O dado da /live numa URL estavel, no mesmo formato do live.json que o
 * scripts/fetch-live.js grava, mais as definicoes. So taxa e razao por modelo,
 * sem contagem de PR, sugestao ou organizacao.
 */
export function GET() {
    const body = {
        name: 'CodeReviewBench live leaderboard',
        description:
            "Share of each model's AI code review suggestions that real teams applied, from Kodus Cloud production data, as medians across organizations.",
        url: `${SITE_URL}/leaderboard?board=live`,
        pipeline: 'https://github.com/kodustech/codereviewbench/blob/main/scripts/fetch-live.js',
        definitions: {
            window: 'Closed weeks, Monday to Sunday, UTC.',
            applied:
                "Median, across organizations, of the share of a model's suggestions that a later push applied, fully or partly, as judged by the product comparing the new code with the suggestion. The check runs on the organization's own model.",
            reviewsAtLeast: 'Lower bound of the bucket (50, 100, 250, 500, 1000, 2500, 5000, 10000) that the PRs behind the row fall in. Exact counts are not published.',
            suggestionsPerPR: 'Median, across organizations, of suggestions posted per pull request with a completed automated review.',
            model: "The code-review model in the organization's own key configuration. A week counts for a model only when that configuration was last changed before the week began. Aliases, routers and custom names are left out.",
            thresholds: 'A model is listed when it has at least minPRs PRs reviewed and at least minOrganizations organizations received minSuggestionsPerOrganization or more of its suggestions in the window; only those organizations enter the medians. Rows under minPRsToRank PRs reviewed have ranked: false and are shown unranked on the site.',
            benchmark: 'Recall, precision and F2 for the same model are in /api/leaderboard.json.',
            selfHosted: 'Not included. Self-hosted installs do not send per-PR data.',
        },
        ...live,
    };

    return new Response(JSON.stringify(body, null, 2), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
