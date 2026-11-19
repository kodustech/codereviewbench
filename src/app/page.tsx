import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import meta from '@/lib/data/meta.json';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, judgeLabel, MODE_DESCRIPTIONS } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { entriesOf, entryFor } from '@/lib/entries';
import { live } from '@/lib/live';
import ProviderLogo from '@/components/shared/ProviderLogo';

/** What heavy mode changes, over the models that have both modes. Null until
 *  at least one model has both. */
function heavyLift() {
  const pairs = entriesOf('balanced')
    .map((b) => ({ b, h: entryFor(b.modelId, 'heavy') }))
    .filter((x): x is { b: typeof x.b; h: NonNullable<typeof x.h> } => !!x.h);
  if (!pairs.length) return null;
  const mean = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / xs.length;
  const costRatios = pairs.filter((x) => x.b.costPerPR && x.h.costPerPR).map((x) => x.h.costPerPR! / x.b.costPerPR!);
  return {
    n: pairs.length,
    recall: mean(pairs.map((x) => x.h.recall - x.b.recall)),
    precision: mean(pairs.map((x) => x.h.precision - x.b.precision)),
    costRatio: costRatios.length ? mean(costRatios) : null,
  };
}

const th = 'px-5 py-3 text-[11px] font-mono font-normal text-[color:var(--muted-dim)] uppercase';

/** Titulo a esquerda, apoio a direita: o par de colunas do Linear. */
function HeadingPair({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-14">
      <h2 className="font-display text-[2rem] sm:text-[length:var(--text-heading)] text-[color:var(--foreground)]">{title}</h2>
      {children && <div className="text-[15px] leading-[1.6] text-[color:var(--muted)] lg:pt-2 max-w-xl">{children}</div>}
    </div>
  );
}

export default function Home() {
  const balanced = entriesOf('balanced');
  const bestBalanced = [...balanced].sort((a, b) => b.recall - a.recall)[0];
  const bestHeavy = [...entriesOf('heavy')].sort((a, b) => b.recall - a.recall)[0];
  const lift = heavyLift();
  const judge = judgeLabel(meta.judges[0]);

  const steps = [
    {
      title: 'Real PRs, re-labelled bugs',
      body: `${meta.totalCases} merged pull requests from ${meta.repos.length} production OSS repos. Kodus re-labelled the real problems in each PR (Opus plus a second reviewer, debated where they disagreed) into a gold set of ${meta.totalGoldens} valid true positives.`,
    },
    {
      title: 'Two review modes',
      body: `Balanced: ${MODE_DESCRIPTIONS.balanced.toLowerCase()} Heavy: ${MODE_DESCRIPTIONS.heavy.toLowerCase()} Every model gets a row in each mode.`,
    },
    {
      title: 'One judge, every comment',
      body: `${judge} decides whether each published comment is the same problem, at the same place, as a gold bug. Each gold bug counts once; anything else is a false positive. Checked against Opus 5.5, the two agreed on 249 of 252 comments.`,
    },
    {
      title: 'Publish the artifacts',
      body: 'Every submission and scorecard is versioned in the repo, and every PR has a trace page with the comments the model published next to the gold bugs it found and missed.',
    },
  ];

  const metrics = [
    { metric: 'Recall', desc: `Gold bugs the model found, out of ${meta.totalGoldens}.` },
    { metric: 'Precision', desc: 'Published comments that match a gold bug, out of all published comments. A second comment on the same bug is a false positive.' },
    { metric: 'F1', desc: 'Harmonic mean of precision and recall, equal weight.' },
    { metric: 'F2', desc: "The F-score with beta = 2, popularized for code review by Martian's benchmark: 5·P·R / (4·P + R). It weighs recall twice as much as precision, because a missed bug costs more than a comment you dismiss. The leaderboard ranks by it." },
    { metric: '95% CI', desc: `How much recall would move on a different sample of ${meta.totalCases} PRs. Where intervals overlap, the exact rank is noise, not signal.` },
    { metric: 'Cost', desc: "Measured tokens times the vendor's list price, with prompt cache: cached reads and cache writes at their own rates. Shown per PR and per bug found." },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero: frase a esquerda, link de novidade a direita, e logo abaixo o
          instrumento, que e a propria tabela saindo do escuro. */}
      <header className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end mb-12 reveal" style={{ ['--i' as string]: 0 }}>
          <div>
            <h1 className="font-display text-[2.75rem] sm:text-[length:var(--text-display)] text-[color:var(--foreground)] mb-5 max-w-3xl">
              AI code review benchmark
            </h1>
            <p className="text-[15px] sm:text-base leading-[1.6] text-[color:var(--muted)] max-w-xl mb-8">
              Which models actually catch real bugs, measured on {meta.totalCases} merged pull requests from production
              open-source projects against {meta.totalGoldens} confirmed bugs, in two review modes. Every run is versioned,
              so you can check the numbers or re-score them yourself.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/leaderboard" className="btn-primary">View the leaderboard</Link>
              <Link href="/leaderboard?board=live" className="btn-secondary">Live from production</Link>
            </div>
          </div>
          <Link href="/leaderboard?board=live" className="group text-[13px] text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">
            {live.models.length} models measured in production{' '}
            <ArrowRight className="inline size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="reveal" style={{ ['--i' as string]: 1 }}>
          <div className="stage-fade rounded-t-[var(--radius-cards)] border border-b-0 border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex items-center gap-1 px-3 py-2.5 border-b border-[var(--border)] text-[13px]">
              <Link href="/leaderboard" className="px-3 py-1.5 rounded-md bg-[var(--surface-2)] text-[color:var(--foreground)]">Benchmark</Link>
              <Link href="/leaderboard?board=live" className="px-3 py-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">Live</Link>
              <Link href="/leaderboard?mode=heavy" className="px-3 py-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors">Heavy mode</Link>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <caption className="sr-only">Balanced mode, ranked by F2</caption>
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['#', 'Model', 'F2', 'Recall', 'Precision', '$/PR'].map((h) => (
                      <th key={h} className={cn(th, h !== '#' && h !== 'Model' && 'text-right')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {balanced.slice(0, 8).map((e, idx) => (
                    <tr
                      key={e.key}
                      className={cn(
                        'border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]',
                        idx === 0 && 'shadow-[inset_2px_0_0_var(--accent)]',
                      )}
                    >
                      <td className="px-5 py-3.5 w-14 font-mono text-[13px] tabular-nums text-[color:var(--muted-dim)]">
                        {(idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/model/${modelSlug(e.modelId)}`} className="group/link flex items-center gap-2.5">
                          <ProviderLogo provider={providerOf(e.modelId)} />
                          <span className="text-sm text-[color:var(--foreground)] transition-colors group-hover/link:text-[color:var(--accent)]">
                            {displayNameOf(e.modelId)}
                          </span>
                          <span className="hidden sm:inline text-xs text-[color:var(--muted-dim)]">{providerOf(e.modelId)}</span>
                        </Link>
                      </td>
                      <td className={cn('px-5 py-3.5 text-right font-mono text-[13px] tabular-nums', idx === 0 ? 'text-[color:var(--accent)]' : 'text-[color:var(--foreground)]')}>
                        {e.f2.toFixed(1)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] tabular-nums text-[color:var(--foreground-2)]">{formatScore(e.recall)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] tabular-nums text-[color:var(--foreground-2)]">{formatScore(e.precision)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-[13px] tabular-nums text-[color:var(--foreground-2)]">{formatMoney(e.costPerPR, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-4">
            <span className="text-[13px] text-[color:var(--muted-dim)]">Balanced mode, ranked by F2</span>
            <Link href="/leaderboard" className="text-[13px] text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors whitespace-nowrap">
              Full ranking →
            </Link>
          </div>
        </div>
      </header>

      {/* Metodo: quatro colunas encostadas, separadas so por regua vertical. */}
      <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-32">
        <HeadingPair title="How the benchmark works">
          Every model reviews the same {meta.totalCases} PRs against one gold set and one judge, once per mode, at vendor
          defaults.
        </HeadingPair>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-[var(--border)]">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className={cn(
                'pt-6 pb-2 sm:pr-8 lg:px-8',
                i > 0 && 'lg:border-l border-[var(--border)]',
                i === 0 && 'lg:pl-0',
              )}
            >
              <h3 className="text-[15px] font-medium text-[color:var(--foreground)] mb-2">{s.title}</h3>
              <p className="text-sm leading-[1.6] text-[color:var(--muted)]">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-32">
        <HeadingPair title="What the numbers mean" />
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
          {metrics.map((m) => (
            <div key={m.metric} className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 border-t border-[var(--border)]">
              <dt className="font-mono text-[13px] text-[color:var(--foreground)]">{m.metric}</dt>
              <dd className="text-sm leading-[1.6] text-[color:var(--muted)]">{m.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-32 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-[2rem] text-[color:var(--foreground)] mb-6">What the results say so far</h2>
          <div className="flex flex-col gap-5 text-[15px] leading-[1.65] text-[color:var(--muted)]">
            {bestBalanced && (
              <p>
                <span className="text-[color:var(--foreground)]">Most bugs still get through.</span>{' '}
                The best balanced recall is {formatScore(bestBalanced.recall)} ({displayNameOf(bestBalanced.modelId)})
                {bestHeavy ? `, and the best heavy recall is ${formatScore(bestHeavy.recall)} (${displayNameOf(bestHeavy.modelId)})` : ''}.
                Code review has a lot of headroom left.
              </p>
            )}
            {lift && (
              <p>
                <span className="text-[color:var(--foreground)]">Heavy mode buys recall.</span>{' '}
                Across the {lift.n} model{lift.n === 1 ? '' : 's'} measured in both modes so far, heavy finds{' '}
                {lift.recall >= 0 ? `${lift.recall.toFixed(1)} points more` : `${(-lift.recall).toFixed(1)} points less`} recall
                {' '}with precision {lift.precision >= 0 ? 'up' : 'down'} {Math.abs(lift.precision).toFixed(1)} points
                {lift.costRatio ? `, at ${lift.costRatio.toFixed(1)}x the cost per PR` : ''}.
              </p>
            )}
            <p>
              <span className="text-[color:var(--foreground)]">Bring your own harness.</span>{' '}
              Submissions are a documented JSON contract. Submit a PR against the same cases.
            </p>
          </div>
        </div>
        <div>
          <h2 className="font-display text-[2rem] text-[color:var(--foreground)] mb-6">What this doesn&apos;t measure</h2>
          <div className="flex flex-col gap-5 text-[15px] leading-[1.65] text-[color:var(--muted)]">
            <p>
              <span className="text-[color:var(--foreground)]">Run-to-run variance.</span>{' '}
              One pass per model and mode, so the review agent itself only runs once per entry. Treat close scores as tied.
            </p>
            <p>
              <span className="text-[color:var(--foreground)]">Harnesses other than Kodus&apos;s, so far.</span>{' '}
              Every entry to date runs on the same harness, so what you are comparing is models inside one review agent.
              The submission contract is open, and other harnesses get measured the same way once they are submitted.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 border-t border-[var(--border)]">
          <div>
            <h2 className="text-[15px] font-medium text-[color:var(--foreground)] mb-4">Source repositories</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {meta.repos.map((repo) => (
                <span key={repo} className="inline-flex items-center h-7 px-3 rounded-[var(--radius-badges)] bg-[var(--surface-2)] shadow-[var(--shadow-control)] text-xs text-[color:var(--foreground-2)]">
                  {REPO_LABELS[repo] || repo}
                </span>
              ))}
            </div>
            <p className="text-sm leading-[1.6] text-[color:var(--muted)]">
              Merged PRs across {meta.languages.length} languages ({meta.languages.join(', ')}). Same set, same gold bugs, for
              every model, so the comparison is fair even when the result isn&apos;t flattering.
            </p>
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-[color:var(--foreground)] mb-4">Who runs this</h2>
            <p className="text-sm leading-[1.6] text-[color:var(--muted)]">
              This benchmark is run and published by{' '}
              <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="text-[color:var(--foreground)] hover:text-[color:var(--accent)]">Kodus</a>,
              an AI code review company, on Kodus&apos;s own harness, and Kodus labelled the gold set. Every entry runs on that
              harness, so what the ranking compares is models inside it. See the{' '}
              <Link href="/leaderboard" className="text-[color:var(--foreground)] underline decoration-[var(--border-bright)] underline-offset-4 hover:decoration-[var(--accent)]">leaderboard</Link> for the full
              disclosure.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
