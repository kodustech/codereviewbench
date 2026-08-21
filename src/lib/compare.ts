import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import type { LeaderboardData, LeaderboardEntry, CaseSample, GoldenDetail } from '@/lib/types';
import { modelSlug, displayNameOf } from '@/lib/constants';
import { PAIR_SEPARATOR, canonicalPair, pairSlug } from '@/lib/pair-slug';

export { PAIR_SEPARATOR, canonicalPair, pairSlug };

const lb = leaderboardData as unknown as LeaderboardData;
const allSamples = samplesData as unknown as CaseSample[];




/** Os 45 pares (C(10,2)) em ordem canonica. Fonte do generateStaticParams e do
 *  sitemap — os dois LEEM daqui pra nao divergirem. */
export function allPairs(): { a: LeaderboardEntry; b: LeaderboardEntry; slug: string }[] {
    const out: { a: LeaderboardEntry; b: LeaderboardEntry; slug: string }[] = [];
    const es = lb.entries;
    for (let i = 0; i < es.length; i += 1) {
        for (let j = i + 1; j < es.length; j += 1) {
            const [sa, sb] = canonicalPair(modelSlug(es[i].modelId), modelSlug(es[j].modelId));
            const a = es.find((e) => modelSlug(e.modelId) === sa)!;
            const b = es.find((e) => modelSlug(e.modelId) === sb)!;
            out.push({ a, b, slug: `${sa}${PAIR_SEPARATOR}${sb}` });
        }
    }
    return out;
}

/** Resolve um slug de par. Casa contra o conjunto conhecido em vez de dar split
 *  no separador — imune a slug que contenha `-vs-`. `canonical` diz se a URL
 *  pedida ja esta na ordem canonica; se nao, a rota redireciona 308. */
export function parsePairSlug(
    slug: string,
): { a: LeaderboardEntry; b: LeaderboardEntry; canonicalSlug: string; canonical: boolean } | null {
    const pairs = allPairs();
    const hit = pairs.find((p) => p.slug === slug);
    if (hit) return { a: hit.a, b: hit.b, canonicalSlug: hit.slug, canonical: true };

    // Ordem invertida: `b-vs-a` resolve pro mesmo par, mas nao e canonico.
    const flipped = pairs.find((p) => {
        const [x, y] = p.slug.split(PAIR_SEPARATOR);
        return `${y}${PAIR_SEPARATOR}${x}` === slug;
    });
    if (flipped) return { a: flipped.a, b: flipped.b, canonicalSlug: flipped.slug, canonical: false };

    return null;
}

export interface GoldenSplit {
    caseId: string;
    repo: string;
    language: string;
    text: string;
    severity: string | null;
}

export interface PairDiff {
    /** Bugs reais que A achou e B perdeu (e vice-versa). E o conteudo que torna
     *  cada uma das 45 paginas diferente das outras — sem isso viram doorway
     *  pages com a mesma tabela trocada. */
    onlyA: GoldenSplit[];
    onlyB: GoldenSplit[];
    both: number;
    neither: number;
    /** Casos que os dois rodaram E tem goldensDetail dos dois lados. */
    sharedCases: number;
    /** Casos que os dois rodaram mas ficaram de fora do diff por falta de
     *  goldensDetail (goldens.json nao cobre o caso). Exposto pra pagina poder
     *  declarar a cobertura em vez de fingir que o diff viu tudo. */
    uncoveredCases: number;
}

/** Diff de goldens entre dois modelos, casado por (caseId, texto do golden).
 *  `goldensDetail` e null quando goldens.json nao cobre o caso — esses casos
 *  contam em `uncoveredCases`, nunca entram como "os dois perderam". */
export function pairDiff(a: LeaderboardEntry, b: LeaderboardEntry): PairDiff {
    const byCase = (key: string) => {
        const m = new Map<string, CaseSample>();
        for (const s of allSamples) if (s.entryKey === key) m.set(s.caseId, s);
        return m;
    };
    const ca = byCase(a.key);
    const cb = byCase(b.key);

    const onlyA: GoldenSplit[] = [];
    const onlyB: GoldenSplit[] = [];
    let both = 0;
    let neither = 0;
    let sharedCases = 0;
    let uncoveredCases = 0;

    for (const [caseId, sa] of ca) {
        const sb = cb.get(caseId);
        if (!sb) continue;
        if (!sa.goldensDetail || !sb.goldensDetail) {
            uncoveredCases += 1;
            continue;
        }
        sharedCases += 1;

        const bByText = new Map<string, GoldenDetail>();
        for (const g of sb.goldensDetail) bByText.set(g.text, g);

        for (const ga of sa.goldensDetail) {
            const gb = bByText.get(ga.text);
            if (!gb) continue; // golden so existe de um lado — nao e comparavel
            const meta = { caseId, repo: sa.repo, language: sa.language, text: ga.text, severity: ga.severity };
            if (ga.matched && !gb.matched) onlyA.push(meta);
            else if (!ga.matched && gb.matched) onlyB.push(meta);
            else if (ga.matched && gb.matched) both += 1;
            else neither += 1;
        }
    }

    const sev = (s: string | null) => (s?.toLowerCase() === 'critical' ? 0 : s?.toLowerCase() === 'high' ? 1 : 2);
    onlyA.sort((x, y) => sev(x.severity) - sev(y.severity));
    onlyB.sort((x, y) => sev(x.severity) - sev(y.severity));

    return { onlyA, onlyB, both, neither, sharedCases, uncoveredCases };
}

export function pairTitle(a: LeaderboardEntry, b: LeaderboardEntry): string {
    return `${displayNameOf(a.modelId)} vs ${displayNameOf(b.modelId)}`;
}
