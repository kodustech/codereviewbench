import { redirect } from 'next/navigation';

// O dado de producao mora na aba Live da leaderboard; /live so leva pra la.
export default function LivePage() {
  redirect('/leaderboard?board=live');
}
