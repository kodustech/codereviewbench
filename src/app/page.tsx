import Link from 'next/link';
import { ArrowRight, FlaskConical, Layers, Scale, GitPullRequest, Bug, FileCode2, Cpu, ShieldCheck, ChevronRight } from 'lucide-react';
import meta from '@/lib/data/meta.json';
import leaderboardData from '@/lib/data/leaderboard.json';
import type { LeaderboardData } from '@/lib/types';
import { displayNameOf, providerOf, REPO_LABELS } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import CodeScanAnimation from '@/components/hero/CodeScanAnimation';

const lb = leaderboardData as unknown as LeaderboardData;

export default function Home() {
  const topEntries = [...lb.entries].sort((a, b) => b.f1 - a.f1).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero */}
      <header className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 pt-20 sm:pt-32 pb-32 grid-bg relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 lg:gap-16 items-center">
          <div>
            <h1 className="animate-fade-up text-5xl sm:text-7xl lg:text-[5.5rem] font-display tracking-tight text-[var(--foreground)] leading-[1.05] mb-8" style={{ animationDelay: '0ms' }}>
              AI Code Review<br />Benchmark.
            </h1>

            <p className="animate-fade-up text-lg sm:text-xl text-[var(--muted)] max-w-2xl leading-relaxed mb-16" style={{ animationDelay: '80ms' }}>
              We run real AI review agents against real pull requests from real open-source projects, and check how many of the
              known bugs they actually find. No synthetic regressions, no cherry-picking.
            </p>

            <div className="animate-fade-up flex flex-wrap gap-12 sm:gap-16 mb-12" style={{ animationDelay: '160ms' }}>
              {[
                { value: meta.totalCases.toString(), label: 'real pull requests' },
                { value: meta.totalGoldens.toString(), label: 'golden bugs' },
                { value: meta.models.length.toString().padStart(2, '0'), label: 'models' },
                { value: meta.repos.length.toString().padStart(2, '0'), label: 'OSS repos' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-3xl sm:text-4xl font-mono font-bold tabular-nums text-[var(--foreground)]">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="animate-fade-up flex flex-wrap items-center gap-4" style={{ animationDelay: '240ms' }}>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
              >
                View Rankings
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="https://github.com/kodustech/kodus-ai/blob/main/evals/scorer/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-bright)] transition-all"
              >
                <GitPullRequest className="size-4" />
                Submit a model
              </a>
            </div>
          </div>

          <div className="hidden lg:block h-[520px] animate-fade-up" style={{ animationDelay: '200ms' }}>
            <CodeScanAnimation />
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent" />
      </div>

      {/* Methodology */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
        <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Methodology</span>
        <h2 className="text-3xl sm:text-4xl font-display text-[var(--foreground)] mb-4">How It Works</h2>
        <p className="text-base text-[var(--muted)] max-w-2xl mb-16 leading-[1.75]">
          Every model reviews the same {meta.totalCases} real PRs, against the same human-authored golden comments, judged the
          same way. One run per model, at vendor defaults — the numbers are what you get out of the box.
        </p>

        {/* Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          {[
            {
              step: '01',
              icon: FileCode2,
              title: 'Real PRs, real bugs',
              desc: `${meta.totalCases} merged pull requests from ${meta.repos.length} production OSS repos, each with human-authored review comments as ground truth — ${meta.totalGoldens} golden bugs in total.`,
            },
            {
              step: '02',
              icon: Cpu,
              title: 'Deterministic replay',
              desc: 'Each model runs the same production review agent, with tool calls replayed against a frozen snapshot of the repo — no live network, no non-determinism from the codebase changing under it.',
            },
            {
              step: '03',
              icon: Scale,
              title: 'One judge, every finding',
              desc: `${meta.judges[0]} decides whether each reported finding describes the same underlying issue as a golden comment. Micro-averaged: true/false positives are summed across all PRs before computing precision and recall.`,
            },
            {
              step: '04',
              icon: ShieldCheck,
              title: 'Publish the artifacts',
              desc: 'Every submission and scorecard is versioned in the repo. Re-scoring never requires re-running a model — only the judge call is repeated.',
            },
          ].map((item, i) => (
            <div key={item.step} className="relative flex flex-col gap-4 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[var(--accent)] font-bold">{item.step}</span>
                <item.icon className="size-4 text-[var(--muted)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-[1.75]">{item.desc}</p>
              {i < 3 && (
                <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 size-4 text-[var(--border-bright)] z-10" />
              )}
            </div>
          ))}
        </div>

        {/* Two columns: What we measure + What we don't */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Metrics</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                { metric: 'Recall', desc: 'How many of the known bugs the model actually found.' },
                { metric: 'Precision', desc: 'Of what it reported, how much was real — a model that talks more finds more but also misfires more.' },
                { metric: 'F1', desc: 'Harmonic mean of both, equal weight. What the leaderboard ranks by, so talking more is never free.' },
                { metric: 'Tier', desc: 'Models whose recall confidence interval overlaps the tier leader’s. The exact rank inside a tier is noise, not signal.' },
              ].map((m) => (
                <div key={m.metric} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-sm font-semibold text-[var(--foreground)] font-mono w-24 shrink-0">{m.metric}</span>
                  <p className="text-sm text-[var(--muted)] leading-[1.75]">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
              <FlaskConical className="size-4 text-[var(--accent)]" />
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">What this doesn&apos;t measure</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                <span className="text-[var(--foreground)] font-medium">Run-to-run variance.</span> One pass per model. Re-scoring
                the same submission twice already moves recall by a few points from judge noise alone — treat close scores as tied.
              </p>
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                <span className="text-[var(--foreground)] font-medium">Claude or GPT via API.</span> Anthropic is excluded on
                subscription-terms grounds; GPT models were measured on a ChatGPT subscription and held back pending an API run.
              </p>
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                <span className="text-[var(--foreground)] font-medium">A comparison of review products.</span> This is one harness
                (Kodus&apos;s own) reviewing models inside it — not a comparison between Kodus and other code review tools.
              </p>
            </div>
          </div>
        </div>

        {/* Repos + Powered by Kodus */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Source repositories</h3>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {meta.repos.map((repo) => (
                <span key={repo} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)]">
                  <Layers className="size-3.5 text-[var(--muted)]" />
                  {REPO_LABELS[repo] || repo}
                </span>
              ))}
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                Merged PRs across {meta.languages.length} languages ({meta.languages.join(', ')}). Same set, same golden
                comments, for every model — the comparison is fair even when the result isn&apos;t flattering.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Powered By</h3>
            </div>
            <div className="p-6 flex flex-col gap-5 flex-1">
              <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kodus-logo.webp" alt="Kodus" className="h-6" />
              </a>
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                This benchmark is run and published by
                <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors mx-1 font-medium">Kodus</a>,
                an AI code review company, on Kodus&apos;s own harness. It measures models, not review products — see the
                <Link href="/leaderboard" className="text-[var(--accent)] hover:underline mx-1">leaderboard</Link>
                for the full disclosure.
              </p>
              <a
                href="https://kodus.io"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium group"
              >
                Learn about Kodus <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent" />
      </div>

      {/* Mini Leaderboard */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Rankings</span>
            <h2 className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">Global Leaderboard</h2>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors group"
          >
            Full ranking <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['#', 'Model', 'F1', 'Precision', 'Recall', 'Cost/PR'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEntries.map((e, idx) => (
                  <tr
                    key={e.key}
                    className={cn('border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface-2)]')}
                  >
                    <td className="px-5 py-4">
                      <span className={cn('text-sm font-mono tabular-nums', idx === 0 ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]')}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/model/${e.modelId}`} className="group/link flex flex-col gap-0.5">
                        <span className={cn('text-sm font-semibold tracking-tight transition-colors group-hover/link:text-[var(--accent)]', idx === 0 ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]/80')}>
                          {displayNameOf(e.modelId)}
                        </span>
                        <span className="text-xs text-[var(--muted-dim)] font-mono uppercase tracking-widest">{providerOf(e.modelId)}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('text-base tabular-nums font-mono font-bold', idx === 0 ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
                        {e.f1.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(e.precision)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(e.score)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatMoney(e.costPerPR, 3)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent" />
      </div>

      {/* Explainer */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden">
          <div className="flex flex-col gap-3 p-6 bg-[var(--surface)]">
            <Bug className="size-5 text-[var(--muted)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">No model finds even half</h3>
            <p className="text-sm text-[var(--muted)] leading-[1.75]">The best recall in this benchmark is under 45%. Code review has a lot of headroom left.</p>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-[var(--surface)]">
            <Scale className="size-5 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Precision and recall trade off</h3>
            <p className="text-sm text-[var(--muted)] leading-[1.75]">The model that talks the least is often the most precise. Neither end of that curve is wrong — they&apos;re different products.</p>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-[var(--surface)]">
            <GitPullRequest className="size-5 text-[var(--muted)]" />
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Bring your own harness</h3>
            <p className="text-sm text-[var(--muted)] leading-[1.75]">Submissions are a documented JSON contract. Run your own harness against the same PRs and submit a PR.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
