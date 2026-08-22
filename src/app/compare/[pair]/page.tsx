import { notFound, permanentRedirect } from 'next/navigation';
import leaderboardData from '@/lib/data/leaderboard.json';
import type { LeaderboardData } from '@/lib/types';
import { allPairs, parsePairSlug, pairDiff, buildPerCase } from '@/lib/compare';
import { displayNameOf } from '@/lib/constants';
import CompareClient from '../CompareClient';

const lb = leaderboardData as unknown as LeaderboardData;

export function generateStaticParams() {
    return allPairs().map((p) => ({ pair: p.slug }));
}

// PRECISA ser true. Com `false`, o Next 404a qualquer slug fora do
// generateStaticParams ANTES de a pagina rodar — e a ordem invertida
// (`b-vs-a`) nao esta la, entao o 308 pro canonico nunca disparava.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    const r = parsePairSlug(pair);
    if (!r) return { title: 'Comparison not found' };
    const { a, b } = r;
    const d = pairDiff(a, b);
    const na = displayNameOf(a.modelId);
    const nb = displayNameOf(b.modelId);

    // Unico por par: numeros reais dos dois lados + quantos bugs cada um pegou
    // que o outro perdeu. Nunca o mesmo texto em duas paginas.
    return {
        title: `${na} vs ${nb} for Code Review`,
        // ~150 chars: a versao anterior tinha 230 e era cortada antes de chegar
        // no numero de bugs exclusivos, que e o gancho da pagina.
        description:
            `${na} ${a.score.toFixed(0)}% recall vs ${nb} ${b.score.toFixed(0)}%, on the same ${d.sharedCases} merged PRs. ` +
            `${d.onlyA.length} bugs only ${na} caught, ${d.onlyB.length} only ${nb}.`,
        alternates: { canonical: `/compare/${r.canonicalSlug}` },
    };
}

/**
 * Rota canonica de um par.
 *
 * Renderiza o MESMO CompareClient que a `/compare` — nao uma segunda versao da
 * tela. A primeira tentativa reconstruiu a comparacao a mao (H1 proprio, linhas
 * de stat proprias) e saiu pior que a tela que ja existia: texto escuro sobre o
 * gradiente, numeros colapsados no centro, escala de tipo arbitraria. O que esta
 * rota adiciona e URL estavel + metadata unica, nao um layout novo.
 */
export default async function PairPage({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    const r = parsePairSlug(pair);
    if (!r) notFound();
    // `b-vs-a` resolve pro mesmo par mas duplicaria conteudo — 308 pro canonico.
    if (!r.canonical) permanentRedirect(`/compare/${r.canonicalSlug}`);


    return (
        <CompareClient
            entries={lb.entries}
            entryA={r.a}
            entryB={r.b}
            perCase={buildPerCase(r.a, r.b)}
        />
    );
}
