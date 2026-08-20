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
    <div className={cn('card-hairline flex flex-col gap-3 p-5', className)}>
      <div className="flex items-center justify-between relative">
        <span className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">{label}</span>
        {Icon && <Icon className="size-4 text-[color:var(--muted)]" />}
      </div>
      <div className="flex items-end gap-2 relative">
        <span className="font-display text-3xl tabular-nums tracking-tight text-[color:var(--foreground)]">{value}</span>
        {delta !== undefined && (
          <span
            className={cn(
              'text-xs font-mono font-bold mb-0.5',
              delta >= 0 ? 'text-[color:var(--accent)]' : 'text-[color:var(--danger)]'
            )}
          >
            {formatDelta(delta)} vs avg
          </span>
        )}
      </div>
    </div>
  );
}
