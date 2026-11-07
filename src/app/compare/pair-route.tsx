import { notFound, permanentRedirect } from 'next/navigation';
import type { ReviewMode } from '@/lib/types';
import { allPairs, parsePairSlug, pairDiff, buildPerCase, pairHref } from '@/lib/compare';
import { displayNameOf, MODE_LABELS } from '@/lib/constants';
import { entriesOf, entryFor } from '@/lib/entries';
import CompareClient from './CompareClient';

/**
 * Shared body of /compare/<pair> (balanced) and /compare/heavy/<pair>.
 * Both render the same CompareClient; the route adds a stable URL and unique
 * metadata per pair and mode.
 */
export function pairStaticParams(mode: ReviewMode) {
    return allPairs(mode).map((p) => ({ pair: p.slug }));
}

export function pairMetadata(mode: ReviewMode, pair: string) {
    const r = parsePairSlug(mode, pair);
    if (!r) return { title: 'Comparison not found' };
    const { a, b } = r;
    const d = pairDiff(a, b);
    const na = displayNameOf(a.modelId);
    const nb = displayNameOf(b.modelId);
    const suffix = mode === 'heavy' ? ` (${MODE_LABELS.heavy} mode)` : '';
    return {
        title: `${na} vs ${nb} for Code Review${suffix}`,
        description:
            `${MODE_LABELS[mode]} mode: ${na} F2 ${a.f2.toFixed(0)} vs ${nb} F2 ${b.f2.toFixed(0)} on the same ${d.sharedCases} merged PRs. ` +
            `${d.onlyA.length} bugs only ${na} caught, ${d.onlyB.length} only ${nb}.`,
        alternates: { canonical: pairHref(mode, r.canonicalSlug) },
    };
}

export function PairPage({ mode, pair }: { mode: ReviewMode; pair: string }) {
    const r = parsePairSlug(mode, pair);
    if (!r) notFound();
    if (!r.canonical) permanentRedirect(pairHref(mode, r.canonicalSlug));
    const other: ReviewMode = mode === 'heavy' ? 'balanced' : 'heavy';
    const otherModeHref =
        entryFor(r.a.modelId, other) && entryFor(r.b.modelId, other)
            ? pairHref(other, r.canonicalSlug)
            : `/compare?mode=${other}`;
    return (
        <CompareClient
            mode={mode}
            otherModeHref={otherModeHref}
            entries={entriesOf(mode)}
            entryA={r.a}
            entryB={r.b}
            perCase={buildPerCase(r.a, r.b)}
        />
    );
}
