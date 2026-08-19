import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import { displayNameOf, modelSlug } from '@/lib/constants';
import type { LeaderboardData, CaseSample } from '@/lib/types';
import { notFound } from 'next/navigation';
import ModelDetailClient from './ModelDetailClient';

const lb = leaderboardData as unknown as LeaderboardData;
const allCases = samplesData as unknown as CaseSample[];

// A rota usa o slug (`--`), nao o id cru — `@` no path 404a no Next mesmo com
// o HTML gerado no build. Sempre resolver comparando slug com slug.
export function generateStaticParams() {
  return lb.entries.map((e) => ({ id: modelSlug(e.modelId) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = lb.entries.find((e) => modelSlug(e.modelId) === id);
  return { title: `${displayNameOf(entry?.modelId ?? id)} | CodeReviewBench` };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = lb.entries.find((e) => modelSlug(e.modelId) === id);
  if (!entry) notFound();

  const cases = allCases
    .filter((c) => c.entryKey === entry.key)
    .sort((a, b) => a.caseId.localeCompare(b.caseId));

  return (
    <ModelDetailClient
      entry={entry}
      averages={lb.averages}
      allEntries={lb.entries}
      cases={cases}
    />
  );
}
