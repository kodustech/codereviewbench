'use client';

import { cn } from '@/lib/utils';

export type Board = 'bench' | 'live';

interface BoardTabsProps {
  active: Board;
  onChange: (board: Board) => void;
  benchHint: string;
  liveHint: string;
}

/** As duas fontes do ranking, no topo da leaderboard: o benchmark controlado
 *  (PRs fixos, bugs conhecidos) e o live (PRs reais em producao). Mesmo
 *  arranjo do Martian (Online Tracker / Offline Benchmark): rotulo + uma linha
 *  dizendo de onde vem o dado. */
export default function BoardTabs({ active, onChange, benchHint, liveHint }: BoardTabsProps) {
  const tabs: { key: Board; label: string; hint: string }[] = [
    { key: 'bench', label: 'Benchmark', hint: benchHint },
    { key: 'live', label: 'Live', hint: liveHint },
  ];
  return (
    <div role="tablist" aria-label="Leaderboard source" className="inline-flex p-1 rounded-[var(--radius-buttons)] bg-[var(--surface-2)] border border-[var(--border)]">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex flex-col items-start px-5 py-2 rounded-[var(--radius-buttons)] text-left transition-colors border',
              isActive
                ? 'bg-[var(--surface)] border-[var(--border-bright)] shadow-sm'
                : 'border-transparent hover:bg-[var(--surface)]/60',
            )}
          >
            <span className={cn('text-sm font-semibold', isActive ? 'text-[color:var(--foreground)]' : 'text-[color:var(--muted)]')}>{t.label}</span>
            <span className="text-[length:var(--text-micro)] font-mono text-[color:var(--muted-dim)]">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
