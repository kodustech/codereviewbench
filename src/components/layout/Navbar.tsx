'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  // O active state usa startsWith, entao /compare/<a>-vs-<b> e /blog/<slug>
  // ja acendem o item pai sem precisar de entrada propria.
  { href: '/compare', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
];

const REPO_URL = 'https://github.com/kodustech/codereviewbench';
const CONTRIBUTE_URL = 'https://github.com/kodustech/kodus-ai/blob/main/evals/scorer/README.md';

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href));
}

/** Barra fixa de 64px sobre o canvas escuro: links pequenos em ardosia, uma
 *  pill clara como unica acao (padrao Linear). */
export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md"
    >
      <div className="max-w-[var(--page-max-width)] mx-auto h-16 px-6 sm:px-12 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark" style={{ ['--brand-h' as string]: '20px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kodus-logo.webp" alt="Kodus" />
            </span>
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-[color:var(--foreground)]">CodeReviewBench</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(pathname, link.href) ? 'page' : undefined}
                className={cn(
                  'px-3 py-1.5 text-[13px] rounded-md transition-colors',
                  isActive(pathname, link.href)
                    ? 'text-[color:var(--foreground)]'
                    : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">
            GitHub
          </a>
          <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
            Contribute
          </a>
        </div>

        <button
          className="md:hidden text-[color:var(--muted)] p-2 -mr-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-6 pb-6 pt-3 flex flex-col gap-1 bg-[var(--background)]">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'text-base py-2 px-3 rounded-md transition-colors',
                isActive(pathname, link.href)
                  ? 'text-[color:var(--foreground)] font-medium bg-[var(--surface-2)]'
                  : 'text-[color:var(--muted)] hover:text-[color:var(--foreground)]',
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">GitHub</a>
            <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                Contribute
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
