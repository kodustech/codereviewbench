'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GitPullRequest } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/traces', label: 'Traces' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kodus-logo.webp"
            alt="Kodus"
            className="h-6 opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="w-px h-5 bg-[var(--border)]" />
          <span className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            CodeReviewBench
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 text-sm rounded-md transition-all',
                  isActive
                    ? 'text-[var(--foreground)] bg-[var(--surface-2)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="w-px h-4 bg-[var(--border)] mx-1.5" />
          <a
            href="https://github.com/kodustech/kodus-ai/blob/main/evals/promptfoo/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:brightness-110 transition-all"
          >
            <GitPullRequest className="size-3.5" />
            Contribute
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="sm:hidden text-[var(--muted)] p-2"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-[var(--border)] bg-[var(--background)] px-6 pb-6 pt-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'text-base font-medium py-2 px-3 rounded-md transition-colors',
                  isActive
                    ? 'text-[var(--foreground)] bg-[var(--surface)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="https://github.com/kodustech/kodus-ai/blob/main/evals/promptfoo/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-base font-medium py-2 px-3 rounded-md text-[var(--accent)] hover:bg-[var(--surface)]"
          >
            <GitPullRequest className="size-4" />
            Contribute
          </a>
        </div>
      )}
    </nav>
  );
}
