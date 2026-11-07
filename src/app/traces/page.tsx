import { redirect } from 'next/navigation';

// Per-PR traces live at /traces/<model>/<mode>/<caseId>, linked from each
// model page's per-PR breakdown. The bare index has nothing to list on its own.
export default function TracesPage() {
  redirect('/leaderboard');
}
