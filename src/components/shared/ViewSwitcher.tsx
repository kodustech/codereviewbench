'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ViewOption {
  key: string;
  label: string;
  icon?: LucideIcon;
}

interface ViewSwitcherProps {
  views: ViewOption[];
  active: string;
  onChange: (key: string) => void;
}

export default function ViewSwitcher({ views, active, onChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex p-1 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
      {views.map((v) => {
        const Icon = v.icon;
        return (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all',
              active === v.key
                ? 'bg-[var(--surface-2)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
            )}
          >
            {Icon && <Icon className="size-4" />}
            {v.label}
          </button>
        );
      })}
    </div>
  );
}
