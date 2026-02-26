import { Suspense } from 'react';
import LeaderboardClient from './LeaderboardClient';

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
        <div className="h-8 w-48 bg-zinc-900 rounded animate-pulse mb-8" />
        <div className="h-[600px] bg-zinc-900/30 rounded-2xl animate-pulse" />
      </div>
    }>
      <LeaderboardClient />
    </Suspense>
  );
}
