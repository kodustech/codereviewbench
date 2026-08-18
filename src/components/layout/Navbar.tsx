'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, GitPullRequest } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/compare', label: 'Compare' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* N5 · Floating pill — detached, content-sized, blur backdrop */}
      <nav
        aria-label="Primary"
        className="hidden sm:inline-flex fixed top-4 left-1/2 -translate-x-1/2 z-20 items-center gap-6 pl-4 pr-2 py-2 rounded-full border border-[var(--border)] shadow-[0_8px_24px_-12px_oklch(0%_0_0_/_0.4)]"
        style={{ background: 'color-mix(in oklch, var(--background) 78%, transparent)', backdropFilter: 'blur(14px) saturate(120%)' }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kodus-logo.webp"
            alt="Kodus"
            className="h-5 opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="w-px h-4 bg-[var(--border-bright)]" />
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            CodeReviewBench
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-colors',
                  isActive
                    ? 'text-[var(--foreground)] bg-[var(--surface-2)]'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <a
          href="https://github.com/kodustech/kodus-ai/blob/main/evals/scorer/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full bg-[var(--accent)] text-[var(--background)] hover:brightness-110 transition-[filter]"
        >
          <GitPullRequest className="size-3.5" />
          Contribute
        </a>
      </nav>

      {/* Mobile nav — same content, edge-aligned bar (the pill only fits ≥sm) */}
      <nav aria-label="Primary" className="sm:hidden w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/kodus-logo.webp" alt="Kodus" className="h-5" />
            <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">CodeReviewBench</span>
          </Link>
          <button className="text-[var(--muted)] p-2" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-[var(--border)] px-6 pb-6 pt-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'text-base font-medium py-2 px-3 rounded-md transition-colors',
                    isActive ? 'text-[var(--foreground)] bg-[var(--surface)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <a
              href="https://github.com/kodustech/kodus-ai/blob/main/evals/scorer/README.md"
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

      {/* Spacer so fixed pill nav doesn't overlap page content on desktop */}
      <div className="hidden sm:block h-20" aria-hidden="true" />
    </>
  );
}
