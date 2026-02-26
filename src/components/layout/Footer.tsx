import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kodus-logo.webp" alt="Kodus" className="h-5" />
          </a>
          <p className="text-sm text-[var(--muted)] font-mono tracking-wide">
            Deterministic evals · No contamination · No human-in-the-loop
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <a
            href="https://github.com/nicholaskodus/codereviewbench"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            GitHub <ArrowUpRight className="size-3" />
          </a>
          <a
            href="https://kodus.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            Kodus Engine <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
