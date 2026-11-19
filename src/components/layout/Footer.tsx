import Link from 'next/link';

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Benchmark',
    links: [
      { label: 'Leaderboard', href: '/leaderboard' },
      { label: 'Live', href: '/leaderboard?board=live' },
      { label: 'Compare models', href: '/compare' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Data',
    links: [
      { label: 'leaderboard.json', href: '/api/leaderboard.json' },
      { label: 'live.json', href: '/api/live.json' },
      { label: 'llms.txt', href: '/llms.txt' },
      { label: 'Benchmark repo', href: 'https://github.com/kodustech/codereviewbench', external: true },
    ],
  },
  {
    title: 'Contribute',
    links: [
      { label: 'Add test cases', href: 'https://github.com/kodustech/kodus-ai/blob/main/evals/scorer/README.md', external: true },
      { label: 'AI tools benchmark', href: 'https://kodus.io/benchmark-ai-code-review/', external: true },
    ],
  },
  {
    title: 'Kodus',
    links: [
      { label: 'kodus.io', href: 'https://kodus.io', external: true },
      { label: 'GitHub', href: 'https://github.com/kodustech', external: true },
      { label: 'Discord', href: 'https://discord.gg/TFZBRk9fT6', external: true },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/kodustech/', external: true },
      { label: 'X / Twitter', href: 'https://twitter.com/kodustech', external: true },
    ],
  },
];

/** Fechamento monumental (frase centralizada, maior que o titulo do topo,
 *  com muito ar em volta) e depois o diretorio compacto, sem newsletter. */
export default function Footer() {
  return (
    <footer className="w-full mt-auto">
      <div className="max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 py-32 sm:py-48 flex flex-col items-center text-center">
        {/* Uma frase por linha: o par so funciona se cada metade fica inteira. */}
        <p className="font-display text-[2.25rem] sm:text-[length:var(--text-monument)] text-[color:var(--foreground)]">
          <span className="block">Vendors publish claims.</span>
          <span className="block">We publish the run.</span>
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Link href="/leaderboard" className="btn-primary">Open the leaderboard</Link>
          <a href="https://github.com/kodustech/codereviewbench" target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Check the artifacts
          </a>
        </div>
      </div>

      <div className="border-t border-[var(--color-rule)]">
        <div className="max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 py-14 grid grid-cols-2 md:grid-cols-[1.2fr_repeat(4,1fr)] gap-8">
          <span className="col-span-2 md:col-span-1 flex items-start gap-2.5">
            <span className="brand-mark mt-0.5" style={{ ['--brand-h' as string]: '18px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kodus-logo.webp" alt="Kodus" />
            </span>
            <span className="text-[13px] font-semibold text-[color:var(--foreground)]">CodeReviewBench</span>
          </span>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-[13px] font-medium text-[color:var(--foreground)] mb-4">{col.title}</h2>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-[13px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pb-10">
          <p className="text-xs text-[color:var(--muted-dim)] font-mono">maintained by Kodus · {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
