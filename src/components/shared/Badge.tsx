import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'blue' | 'amber';
  className?: string;
}

const VARIANTS = {
  default: 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]',
  success: 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30',
  error: 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30',
  blue: 'bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/30',
  amber: 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
