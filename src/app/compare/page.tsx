import type { ReviewMode } from '@/lib/types';
import { buildPerCase, pairHref, pairSlug } from '@/lib/compare';
import { entriesOf, entryFor, isMode } from '@/lib/entries';
import { modelSlug } from '@/lib/constants';
import CompareClient from './CompareClient';

export const metadata = {
  title: 'Compare AI Code Review Models',
  description:
    'Compare two AI code review models side by side on the same real pull requests, in the same review mode: which bugs one found that the other missed, with F2, recall, precision and cost.',
  alternates: { canonical: '/compare' },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; mode?: string }>;
}) {
  const { a, b, mode: modeParam } = await searchParams;
  const mode: ReviewMode = isMode(modeParam) ? modeParam : 'balanced';
  const ranked = entriesOf(mode);
  if (ranked.length < 2) {
    return (
      <div className="max-w-[1200px] mx-auto w-full px-6 sm:px-12 py-12">
        <h1 className="text-3xl font-display mb-3">Compare two models</h1>
        <p className="text-[color:var(--muted)]">Fewer than two models have results in this mode yet.</p>
      </div>
    );
  }
  const entryA = ranked.find((e) => e.modelId === a) || ranked[0];
  const entryB = ranked.find((e) => e.modelId === b && e.modelId !== entryA.modelId) || ranked.find((e) => e.modelId !== entryA.modelId)!;
  const other: ReviewMode = mode === 'heavy' ? 'balanced' : 'heavy';
  const otherModeHref =
    entryFor(entryA.modelId, other) && entryFor(entryB.modelId, other)
      ? pairHref(other, pairSlug(modelSlug(entryA.modelId), modelSlug(entryB.modelId)))
      : `/compare?mode=${other}`;

  return (
    <CompareClient
      mode={mode}
      otherModeHref={otherModeHref}
      entries={ranked}
      entryA={entryA}
      entryB={entryB}
      perCase={buildPerCase(entryA, entryB)}
    />
  );
}
