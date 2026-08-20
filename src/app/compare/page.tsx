import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import type { LeaderboardData, CaseSample, CompareCase } from '@/lib/types';
import CompareClient from './CompareClient';

const lb = leaderboardData as unknown as LeaderboardData;
const allSamples = samplesData as unknown as CaseSample[];

export const metadata = {
  // O layout ja aplica o template "%s | CodeReviewBench" — repetir aqui
  // duplicaria o nome do site no title.
  title: 'Compare AI Code Review Models',
  description:
    'Compare two AI code review models side by side on the same real pull requests: which bugs one found that the other missed, per PR, with recall, precision and cost.',
  alternates: { canonical: '/compare' },
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

  // Fatia antes de virar prop: o que nao for lido pelo cliente nao precisa
  // atravessar o payload RSC. `findings` sozinho e 66% do samples.json.
  const slim = (c: CaseSample): CompareCase => {
    const { findings: _f, missedGoldens: _m, usage: _u, latencyMs: _l, ...rest } = c;
    void _f; void _m; void _u; void _l;
    return rest;
  };
  const casesA = allSamples.filter((s) => s.entryKey === entryA.key).map(slim);
  const casesB = allSamples.filter((s) => s.entryKey === entryB.key).map(slim);

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
