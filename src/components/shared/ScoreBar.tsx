import { cn } from '@/lib/utils';

interface ScoreBarProps {
  value: number;
  max?: number;
  className?: string;
  colorClass?: string;
}

export default function ScoreBar({ value, max = 100, className, colorClass }: ScoreBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={cn('h-2 bg-[var(--surface-2)] rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', colorClass || (pct > 80 ? 'bg-[var(--accent)]' : 'bg-[var(--border-bright)]'))}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
