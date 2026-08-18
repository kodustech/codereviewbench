const LINKS = [
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Benchmark repo', href: 'https://github.com/kodustech/codereviewbench', external: true },
  { label: 'Contribute test cases', href: 'https://github.com/kodustech/kodus-ai/blob/main/evals/scorer/README.md', external: true },
  { label: 'GitHub', href: 'https://github.com/kodustech' },
  { label: 'Discord', href: 'https://discord.gg/TFZBRk9fT6' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/kodustech/' },
  { label: 'X / Twitter', href: 'https://twitter.com/kodustech' },
  { label: 'AI tools benchmark', href: 'https://kodus.io/benchmark-ai-code-review/', external: true },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)]">
      {/* Ft5 Statement, extended with a condensed real link row — this is an
          open benchmark that wants contributions, so "minimal links only"
          would drop the links that actually matter (see design.md). */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-16 sm:py-20">
        <p className="font-display text-2xl sm:text-4xl text-[var(--foreground)] leading-[1.1] max-w-2xl mb-10 lowercase">
          if your harness can review a diff, it can be&nbsp;<span className="verb-landmark">measured</span>.
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-6 border-t border-[var(--border)]">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 mt-6 border-t border-[var(--border)]">
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">CodeReviewBench</span>
          <p className="text-xs text-[var(--muted-dim)] font-mono">
            maintained by Kodus &middot; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
