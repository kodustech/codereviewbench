import { notFound, permanentRedirect } from 'next/navigation';
import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import type { LeaderboardData, CaseSample, CompareCase } from '@/lib/types';
import { allPairs, parsePairSlug, pairDiff } from '@/lib/compare';
import { displayNameOf } from '@/lib/constants';
import CompareClient from '../CompareClient';

const lb = leaderboardData as unknown as LeaderboardData;
const allSamples = samplesData as unknown as CaseSample[];

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
        description:
            `${na} and ${nb} reviewed the same ${d.sharedCases} merged pull requests. ` +
            `${na} found ${a.score.toFixed(1)}% of known bugs at ${a.precision.toFixed(1)}% precision; ` +
            `${nb} found ${b.score.toFixed(1)}% at ${b.precision.toFixed(1)}%. ` +
            `${d.onlyA.length} real bugs were caught only by ${na}, ${d.onlyB.length} only by ${nb}.`,
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

    // Mesma fatia da /compare: `findings` sozinho e 66% do samples.json e o
    // cliente nao le. Sem isso o dataset inteiro atravessa o payload RSC.
    const slim = (c: CaseSample): CompareCase => {
        const { findings: _f, missedGoldens: _m, usage: _u, latencyMs: _l, ...rest } = c;
        void _f; void _m; void _u; void _l;
        return rest;
    };

    return (
        <CompareClient
            entries={lb.entries}
            entryA={r.a}
            entryB={r.b}
            casesA={allSamples.filter((s) => s.entryKey === r.a.key).map(slim)}
            casesB={allSamples.filter((s) => s.entryKey === r.b.key).map(slim)}
        />
    );
}
