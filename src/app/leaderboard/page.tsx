import { Suspense } from 'react';
import LeaderboardClient from './LeaderboardClient';
import meta from '@/lib/data/meta.json';
import { SITE_TAGLINE } from '@/lib/site';

// A pagina com mais chance de rankear pra "ai code review benchmark" — ate
// agora herdava o metadata do layout e nao tinha titulo/descricao proprios.
export const metadata = {
  title: `${SITE_TAGLINE} Leaderboard`,
  // Cortada pra caber nos ~155 chars que o Google exibe.
  description: `Which AI model finds the most real bugs? ${meta.totalEntries} models ranked on ${meta.totalCases} merged pull requests, scored against ${meta.totalGoldens} human-reported bugs.`,
  alternates: { canonical: '/leaderboard' },
};

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
        <div className="h-8 w-48 bg-zinc-900 rounded animate-pulse mb-8" />
        <div className="h-[600px] bg-zinc-900/30 rounded-2xl animate-pulse" />
      </div>
    }>
      <LeaderboardClient />
    </Suspense>
  );
}
