import samplesData from '@/lib/data/samples.json';
import type { LeaderboardEntry, CaseSample, ReviewMode } from '@/lib/types';
import { modelSlug } from '@/lib/constants';
import { entriesOf, MODES } from '@/lib/entries';
import { PAIR_SEPARATOR, canonicalPair, pairSlug } from '@/lib/pair-slug';

export { PAIR_SEPARATOR, canonicalPair, pairSlug };

const allSamples = samplesData as unknown as CaseSample[];

/** URL of a pair inside a mode. Balanced keeps the historical /compare/<pair>
 *  path; heavy lives under /compare/heavy/<pair>. */
export function pairHref(mode: ReviewMode, slug: string): string {
    return mode === 'heavy' ? `/compare/heavy/${slug}` : `/compare/${slug}`;
}

export interface Pair {
    mode: ReviewMode;
    a: LeaderboardEntry;
    b: LeaderboardEntry;
    slug: string;
}

/** Every pair of models that both have a row in `mode`, in canonical order.
 *  Source of generateStaticParams and of the sitemap, so they never diverge. */
export function allPairs(mode: ReviewMode): Pair[] {
    const out: Pair[] = [];
    const es = entriesOf(mode);
    for (let i = 0; i < es.length; i += 1) {
        for (let j = i + 1; j < es.length; j += 1) {
            const [sa, sb] = canonicalPair(modelSlug(es[i].modelId), modelSlug(es[j].modelId));
            const a = es.find((e) => modelSlug(e.modelId) === sa)!;
            const b = es.find((e) => modelSlug(e.modelId) === sb)!;
            out.push({ mode, a, b, slug: `${sa}${PAIR_SEPARATOR}${sb}` });
        }
    }
    return out;
}

export function allPairsEveryMode(): Pair[] {
    return MODES.flatMap((m) => allPairs(m));
}

/** Resolves a pair slug within a mode. `canonical` tells whether the order
 *  requested is the canonical one; if not, the route redirects 308. */
export function parsePairSlug(
    mode: ReviewMode,
    slug: string,
): { a: LeaderboardEntry; b: LeaderboardEntry; canonicalSlug: string; canonical: boolean } | null {
    const pairs = allPairs(mode);
    const hit = pairs.find((p) => p.slug === slug);
    if (hit) return { a: hit.a, b: hit.b, canonicalSlug: hit.slug, canonical: true };
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
    /** Gold bugs A found and B missed (and vice versa). */
    onlyA: GoldenSplit[];
    onlyB: GoldenSplit[];
    both: number;
    neither: number;
    sharedCases: number;
}

function casesOf(key: string): Map<string, CaseSample> {
    const m = new Map<string, CaseSample>();
    for (const s of allSamples) if (s.entryKey === key) m.set(s.caseId, s);
    return m;
}

/** Gold diff between two runs, matched by gold issueId on the same PR. */
export function pairDiff(a: LeaderboardEntry, b: LeaderboardEntry): PairDiff {
    const ca = casesOf(a.key);
    const cb = casesOf(b.key);
    const onlyA: GoldenSplit[] = [];
    const onlyB: GoldenSplit[] = [];
    let both = 0;
    let neither = 0;
    let sharedCases = 0;

    for (const [caseId, sa] of ca) {
        const sb = cb.get(caseId);
        if (!sb) continue;
        sharedCases += 1;
        const bById = new Map(sb.goldensDetail.map((g) => [g.issueId, g]));
        for (const ga of sa.goldensDetail) {
            const gb = bById.get(ga.issueId);
            if (!gb) continue;
            const meta = { caseId, repo: sa.repo, language: sa.language, text: ga.text, severity: ga.severity };
            if (ga.matched && !gb.matched) onlyA.push(meta);
            else if (!ga.matched && gb.matched) onlyB.push(meta);
            else if (ga.matched && gb.matched) both += 1;
            else neither += 1;
        }
    }

    const sev = (s: string | null) => {
        const i = ['critical', 'high', 'medium', 'low'].indexOf(s?.toLowerCase() ?? '');
        return i === -1 ? 4 : i;
    };
    const bySev = (x: GoldenSplit, y: GoldenSplit) => sev(x.severity) - sev(y.severity);
    onlyA.sort(bySev);
    onlyB.sort(bySev);
    return { onlyA, onlyB, both, neither, sharedCases };
}

export interface GoldenRow {
    text: string;
    severity: string | null;
    foundA: boolean;
    foundB: boolean;
}

export interface PerCaseRow {
    caseId: string;
    repo: string;
    language: string;
    goldens: GoldenRow[];
}

/** Both sides zipped on the server, so gold text crosses the RSC payload once. */
export function buildPerCase(a: LeaderboardEntry, b: LeaderboardEntry): PerCaseRow[] {
    const cb = casesOf(b.key);
    const out: PerCaseRow[] = [];
    for (const ca of [...casesOf(a.key).values()].sort((x, y) => x.caseId.localeCompare(y.caseId))) {
        const sb = cb.get(ca.caseId);
        if (!sb) continue;
        const bById = new Map(sb.goldensDetail.map((g) => [g.issueId, g]));
        out.push({
            caseId: ca.caseId,
            repo: ca.repo,
            language: ca.language,
            goldens: ca.goldensDetail.map((g) => ({
                text: g.text,
                severity: g.severity,
                foundA: g.matched,
                foundB: bById.get(g.issueId)?.matched ?? false,
            })),
        });
    }
    return out;
}
