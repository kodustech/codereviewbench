import Link from 'next/link';
import { ArrowRight, FlaskConical, Layers, Scale, GitPullRequest, Bug, FileCode2, Cpu, ShieldCheck } from 'lucide-react';
import meta from '@/lib/data/meta.json';
import leaderboardData from '@/lib/data/leaderboard.json';
import caseIndexData from '@/lib/data/case-index.json';
import type { LeaderboardData, CaseIndexRow } from '@/lib/types';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import Apparatus from '@/components/hero/Apparatus';
import MeterStrip from '@/components/hero/MeterStrip';
import ProviderLogo from '@/components/shared/ProviderLogo';

const lb = leaderboardData as unknown as LeaderboardData;
const caseIndex = caseIndexData as unknown as CaseIndexRow[];

function apparatusNodes() {
  const seen = new Set<string>();
  const byRepo: Record<string, { goldens: number; cases: number; language: string }> = {};
  for (const row of caseIndex) {
    if (seen.has(row.caseId)) continue;
    seen.add(row.caseId);
    byRepo[row.repo] = byRepo[row.repo] || { goldens: 0, cases: 0, language: row.language };
    byRepo[row.repo].goldens += row.goldens;
    byRepo[row.repo].cases += 1;
  }
  return meta.repos.map((repo) => ({
    repo,
    label: REPO_LABELS[repo] || repo,
    language: LANGUAGE_LABELS[byRepo[repo]?.language] || byRepo[repo]?.language || '',
    goldens: byRepo[repo]?.goldens ?? 0,
    cases: byRepo[repo]?.cases ?? 0,
  }));
}

function meterValues() {
  return caseIndex
    .map((r) => (r.goldens ? (r.matched / r.goldens) * 100 : 0))
    .sort((a, b) => a - b);
}

export default function Home() {
  const topEntries = [...lb.entries].sort((a, b) => b.f1 - a.f1).slice(0, 5);
  const nodes = apparatusNodes();
  const meterVals = meterValues();
  const meanRecall = meterVals.reduce((a, b) => a + b, 0) / meterVals.length;

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero — Marquee: apparatus at hero-right, verb-landmark headline at hero-left */}
      <header className="w-full blueprint-grid relative overflow-clip">
        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 pt-8 sm:pt-12 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-8 items-center">
            <div className="reveal" style={{ ['--i' as string]: 0 }}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] text-[var(--foreground)] leading-[1.08] mb-7 max-w-2xl lowercase">
                we check what the model actually&nbsp;<span className="verb-landmark">finds</span>.
              </h1>

              <p className="text-lg text-[var(--foreground-2)] max-w-xl leading-relaxed mb-12">
                We run real AI review agents against real pull requests from real open-source
                projects, and check how many of the known bugs they actually find. No synthetic
                regressions, no cherry-picking.
              </p>

              <div className="flex flex-wrap gap-10 mb-12">
                {[
                  { value: meta.totalCases.toString(), label: 'real pull requests' },
                  { value: meta.totalGoldens.toString(), label: 'golden bugs' },
                  { value: meta.models.length.toString().padStart(2, '0'), label: 'models' },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="font-display text-3xl sm:text-4xl tabular-nums text-[var(--foreground)]">
                      {stat.value}
                    </span>
                    <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest mt-1">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-[var(--accent)] text-[var(--background)] hover:brightness-110 transition-[filter]"
              >
                View rankings
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="hidden lg:block reveal" style={{ ['--i' as string]: 1 }}>
              <Apparatus judgeLabel={meta.judges[0] || 'judge'} nodes={nodes} />
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
          <MeterStrip
            values={meterVals}
            leftLabel={`RECALL · ${meterVals.length} SAMPLES`}
            rightLabel={`μ ${meanRecall.toFixed(1)}%`}
          />
        </div>
      </header>

      {/* Methodology */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
        <span className="eyebrow block mb-3">Methodology</span>
        <h2 className="font-display text-3xl sm:text-4xl text-[var(--foreground)] mb-4">How it works</h2>
        <p className="text-base text-[var(--foreground-2)] max-w-2xl mb-14 leading-[1.75]">
          Every model reviews the same {meta.totalCases} real PRs, against the same human-authored golden comments, judged the
          same way. One run per model, at vendor defaults — the numbers are what you get out of the box.
        </p>

        {/* Pipeline — a flowing numbered list, not a 4-up icon-tile grid */}
        <div className="flex flex-col mb-20 border-t border-[var(--border)]">
          {[
            {
              step: '01',
              icon: FileCode2,
              title: 'Real PRs, real bugs',
              desc: `${meta.totalCases} merged pull requests from ${meta.repos.length} production OSS repos, each with human-authored review comments as ground truth — ${meta.totalGoldens} golden bugs in total.`,
              wide: true,
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
              wide: true,
            },
            {
              step: '04',
              icon: ShieldCheck,
              title: 'Publish the artifacts',
              desc: 'Every submission and scorecard is versioned in the repo. Re-scoring never requires re-running a model — only the judge call is repeated.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className={cn(
                'grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 py-7 border-b border-[var(--border)]',
                item.wide ? 'sm:pr-0' : 'sm:pr-24',
              )}
            >
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[13px] text-[var(--accent)] font-bold tabular-nums">{item.step}</span>
                <item.icon className="size-4 text-[var(--muted)]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--foreground)] mb-1.5">{item.title}</h3>
                <p className="text-sm text-[var(--foreground-2)] leading-[1.75] max-w-2xl">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two columns: What we measure + What we don't */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
          <div className="card-hairline overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] relative">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Metrics</h3>
            </div>
            <div className="divide-y divide-[var(--border)] relative">
              {[
                { metric: 'Recall', desc: 'How many of the known bugs the model actually found.' },
                { metric: 'Precision', desc: 'Of what it reported, how much was real — a model that talks more finds more but also misfires more.' },
                { metric: 'F1', desc: 'Harmonic mean of both, equal weight. What the leaderboard ranks by, so talking more is never free.' },
                { metric: 'Tier', desc: 'Models whose recall confidence interval overlaps the tier leader’s. The exact rank inside a tier is noise, not signal.' },
              ].map((m) => (
                <div key={m.metric} className="px-6 py-4 flex items-start gap-4">
                  <span className="text-sm font-semibold text-[var(--foreground)] font-mono w-24 shrink-0">{m.metric}</span>
                  <p className="text-sm text-[var(--foreground-2)] leading-[1.75]">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-hairline overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3 relative">
              <FlaskConical className="size-4 text-[var(--accent)]" />
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">What this doesn&apos;t measure</h3>
            </div>
            <div className="p-6 flex flex-col gap-4 relative">
              <p className="text-sm text-[var(--foreground-2)] leading-[1.75]">
                <span className="text-[var(--foreground)] font-medium">Model run-to-run variance.</span> One pass per model — the
                review agent itself only runs once per entry. Judge noise (re-scoring the same submission) is measured
                separately where available — treat close scores as tied either way.
              </p>
              <p className="text-sm text-[var(--foreground-2)] leading-[1.75]">
                <span className="text-[var(--foreground)] font-medium">Claude or GPT via API.</span> Anthropic is excluded on
                subscription-terms grounds; GPT models were measured on a ChatGPT subscription and held back pending an API run.
              </p>
              <p className="text-sm text-[var(--foreground-2)] leading-[1.75]">
                <span className="text-[var(--foreground)] font-medium">A comparison of review products.</span> This is one harness
                (Kodus&apos;s own) reviewing models inside it — not a comparison between Kodus and other code review tools.
              </p>
            </div>
          </div>
        </div>

        {/* Repos + Powered by Kodus */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 card-hairline overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] relative">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Source repositories</h3>
            </div>
            <div className="p-6 flex flex-wrap gap-2 relative">
              {meta.repos.map((repo) => (
                <span key={repo} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)]">
                  <Layers className="size-3.5 text-[var(--muted)]" />
                  {REPO_LABELS[repo] || repo}
                </span>
              ))}
            </div>
            <div className="px-6 pb-6 relative">
              <p className="text-sm text-[var(--foreground-2)] leading-[1.75]">
                Merged PRs across {meta.languages.length} languages ({meta.languages.join(', ')}). Same set, same golden
                comments, for every model — the comparison is fair even when the result isn&apos;t flattering.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 card-hairline overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border)] relative">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Powered by</h3>
            </div>
            <div className="p-6 flex flex-col gap-5 flex-1 relative">
              <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kodus-logo.webp" alt="Kodus" className="h-6" />
              </a>
              <p className="text-sm text-[var(--foreground-2)] leading-[1.75]">
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
                className="mt-auto inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium group w-fit"
              >
                Learn about Kodus <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Leaderboard */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24 border-t border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <span className="eyebrow block mb-3">Rankings</span>
            <h2 className="font-display text-3xl sm:text-4xl text-[var(--foreground)]">Global leaderboard</h2>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors group"
          >
            Full ranking <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="card-hairline overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar relative">
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
                      <Link href={`/model/${modelSlug(e.modelId)}`} className="group/link flex items-center gap-2.5">
                        <ProviderLogo provider={providerOf(e.modelId)} />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold tracking-tight transition-colors group-hover/link:text-[var(--accent)] text-[var(--foreground)]">
                            {displayNameOf(e.modelId)}
                          </span>
                          <span className="text-xs text-[var(--muted-dim)] font-mono uppercase tracking-widest">{providerOf(e.modelId)}</span>
                        </span>
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

      {/* Explainer — unequal spans, icon inline with heading, not a 3-up icon-tile grid */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24 border-t border-[var(--border)]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_0.9fr] gap-6">
          <div className="card-hairline p-7 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 relative">
              <Bug className="size-4 text-[var(--muted)]" />
              <h3 className="text-[15px] font-semibold text-[var(--foreground)]">No model finds even half</h3>
            </div>
            <p className="text-sm text-[var(--foreground-2)] leading-[1.75] relative">The best recall in this benchmark is under 45%. Code review has a lot of headroom left.</p>
          </div>
          <div className="card-hairline p-7 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 relative">
              <Scale className="size-4 text-[var(--accent)]" />
              <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Precision and recall trade off</h3>
            </div>
            <p className="text-sm text-[var(--foreground-2)] leading-[1.75] relative">The model that talks the least is often the most precise — different products, not different quality.</p>
          </div>
          <div className="card-hairline p-7 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 relative">
              <GitPullRequest className="size-4 text-[var(--muted)]" />
              <h3 className="text-[15px] font-semibold text-[var(--foreground)]">Bring your own harness</h3>
            </div>
            <p className="text-sm text-[var(--foreground-2)] leading-[1.75] relative">Submissions are a documented JSON contract. Submit a PR against the same cases.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
