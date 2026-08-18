import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import type { LeaderboardData, CaseSample } from '@/lib/types';
import CompareClient from './CompareClient';

const lb = leaderboardData as unknown as LeaderboardData;
const allSamples = samplesData as unknown as CaseSample[];

export const metadata = {
  title: 'Compare Models | CodeReviewBench',
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const byF1 = [...lb.entries].sort((x, y) => y.f1 - x.f1);

  const entryA = byF1.find((e) => e.modelId === a) || byF1[0];
  // Segundo modelo: pega o próximo da lista que não seja o mesmo do primeiro,
  // nunca deixa A e B iguais mesmo se a URL pedir isso.
  const entryB = byF1.find((e) => e.modelId === b && e.modelId !== entryA.modelId) || byF1.find((e) => e.modelId !== entryA.modelId) || byF1[1];

  const casesA = allSamples.filter((s) => s.entryKey === entryA.key);
  const casesB = allSamples.filter((s) => s.entryKey === entryB.key);

  return (
    <CompareClient
      entries={lb.entries}
      entryA={entryA}
      entryB={entryB}
      casesA={casesA}
      casesB={casesB}
    />
  );
}
