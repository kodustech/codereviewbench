import { cn } from '@/lib/utils';
import { formatDelta } from '@/lib/format';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon?: LucideIcon;
  label: string;
  value: string;
  delta?: number;
  className?: string;
}

export default function StatsCard({ icon: Icon, label, value, delta, className }: StatsCardProps) {
  return (
    <div className={cn('flex flex-col gap-3 p-5 border border-[var(--border)] rounded-lg bg-[var(--surface)]', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">{label}</span>
        {Icon && <Icon className="size-4 text-[var(--muted)]" />}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)] font-mono">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              'text-xs font-mono font-bold mb-0.5',
              delta >= 0 ? 'text-[var(--accent)]' : 'text-[#f85149]'
            )}
          >
            {formatDelta(delta)} vs avg
          </span>
        )}
      </div>
    </div>
  );
}
