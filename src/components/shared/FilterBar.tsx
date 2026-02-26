'use client';

import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  groups: FilterGroup[];
  className?: string;
}

export default function FilterBar({ groups, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-6', className)}>
      {groups.map((group) => (
        <div key={group.key} className={cn('flex items-center gap-2', group.disabled && 'opacity-30 pointer-events-none')}>
          <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold shrink-0">
            {group.label}:
          </span>
          <div className="flex flex-wrap gap-0.5">
            {group.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => group.onChange(opt.value)}
                disabled={group.disabled}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                  group.value === opt.value
                    ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
