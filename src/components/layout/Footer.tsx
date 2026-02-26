import { ArrowUpRight } from 'lucide-react';

const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/kodustech' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/kodustech/' },
  { label: 'X / Twitter', href: 'https://twitter.com/kodustech' },
  { label: 'Discord', href: 'https://discord.gg/TFZBRk9fT6' },
  { label: 'Reddit', href: 'https://www.reddit.com/r/Kodus/' },
];

const SITE_LINKS = [
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Trace Explorer', href: '/traces' },
  { label: 'Benchmark Repo', href: 'https://github.com/kodustech/codereviewbench', external: true },
  { label: 'Kodus Engine', href: 'https://kodus.io', external: true },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-12">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Kodus brand */}
          <div className="max-w-sm">
            <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="inline-block mb-4 opacity-80 hover:opacity-100 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kodus-logo.webp" alt="Kodus" className="h-8" />
            </a>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              CodeReviewBench is maintained by Kodus. We build AI code review tools and publish open benchmarks so you can verify the results yourself.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-16">
            <div>
              <h4 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">Site</h4>
              <ul className="space-y-2.5">
                {SITE_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      {link.external && <ArrowUpRight className="size-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">Community</h4>
              <ul className="space-y-2.5">
                {SOCIAL_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
                    >
                      {link.label}
                      <ArrowUpRight className="size-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--muted-dim)] font-mono">
            Deterministic evals · No contamination · No human-in-the-loop
          </p>
          <p className="text-xs text-[var(--muted-dim)] font-mono">
            {new Date().getFullYear()} Kodus
          </p>
        </div>
      </div>
    </footer>
  );
}
