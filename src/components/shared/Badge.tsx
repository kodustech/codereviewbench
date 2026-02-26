import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'blue' | 'amber';
  className?: string;
}

const VARIANTS = {
  default: 'bg-[var(--surface-2)] text-[var(--muted)] border-[var(--border)]',
  success: 'bg-[#12261e] text-[#3fb950] border-[#2ea04366]',
  error: 'bg-[#2d1214] text-[#f85149] border-[#f8514966]',
  blue: 'bg-[#0d2239] text-[#79c0ff] border-[#1f6feb66]',
  amber: 'bg-[#2d2204] text-[#d29922] border-[#d2992266]',
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
