'use client';

import { cn } from '@/lib/utils';
import { formatScore, formatMoney, formatCI, formatDelta } from '@/lib/format';
import {
  displayNameOf,
  providerOf,
  modelSlug,
  REPO_LABELS,
  LANGUAGE_LABELS,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  COST_BASIS_LABELS,
  judgeLabel,
} from '@/lib/constants';
import { pairSlug } from '@/lib/pair-slug';
import type { LeaderboardEntry, LeaderboardAverages, ReviewMode } from '@/lib/types';
import Badge from '@/components/shared/Badge';
import ProviderLogo from '@/components/shared/ProviderLogo';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, Code2, Check, X } from 'lucide-react';
import { useState } from 'react';

const MODES: ReviewMode[] = ['balanced', 'heavy'];

export interface ModeRun {
  matched: number;
  goldens: number;
  comments: number;
  tp: number;
  fp: number;
  costUsd: number | null;
}

export interface ModelCaseRow {
  caseId: string;
  repo: string;
  language: string;
  sizeBucket: string | null;
  runs: Partial<Record<ReviewMode, ModeRun>>;
  goldens: { issueId: string; text: string; severity: string | null; found: Partial<Record<ReviewMode, boolean>> }[];
}

interface ModelDetailClientProps {
  modelId: string;
  entries: Record<ReviewMode, LeaderboardEntry | null | undefined>;
  averages: Record<ReviewMode, LeaderboardAverages>;
  modeTotals: Record<ReviewMode, number>;
  /** Other models with a row in each mode, for compare links. */
  others: Record<ReviewMode, string[]>;
  cases: ModelCaseRow[];
}

/** Where a pair lives: balanced keeps /compare/<pair>, heavy is under /compare/heavy. */
function pairHref(mode: ReviewMode, a: string, b: string): string {
  const slug = pairSlug(modelSlug(a), modelSlug(b));
  return mode === 'heavy' ? `/compare/heavy/${slug}` : `/compare/${slug}`;
}

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

const SITE_URL = 'https://codereviewbench.com';

function EmbedButton({ modelId }: { modelId: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const slug = modelSlug(modelId);
  const badgeUrl = `${SITE_URL}/badge/${slug}.svg`;
  const pageUrl = `${SITE_URL}/model/${slug}`;
  const markdown = `[![CodeReviewBench](${badgeUrl})](${pageUrl})`;

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors font-mono"
      >
        <Code2 className="size-4" /> Embed
      </button>
      {/* card-hairline sets position:relative on itself (unlayered CSS beats
          the Tailwind `absolute` utility in the cascade regardless of source
          order) — so positioning lives on this outer div, card-hairline only
          on the inner one. Learned by measuring a real overflow in Playwright:
          the popover rendered position:relative, not absolute, at any width. */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-10 w-[min(20rem,calc(100vw-3rem))] panel-in">
          <div className="card-hairline overflow-hidden p-4">
            <p className="text-xs text-[color:var(--muted-dim)] mb-3">Drop this in your README to link back to this result.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${slug}.svg`} alt="CodeReviewBench badge" className="block max-w-full h-auto mb-3" />
            <div className="flex items-center gap-2 min-w-0">
              <code className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md px-2.5 py-2 text-[color:var(--foreground-2)]">
                {markdown}
              </code>
              <button
                onClick={copy}
                className="shrink-0 size-8 rounded-md border border-[var(--border-bright)] flex items-center justify-center text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
                aria-label="Copy embed markdown"
              >
                {copied ? <Check className="size-3.5 text-[color:var(--success)]" /> : <Code2 className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModelDetailClient({ modelId, entries, averages, modeTotals, others, cases }: ModelDetailClientProps) {
  const provider = providerOf(modelId);
  const modes = MODES.filter((m) => entries[m]);
  const headline = entries.balanced ?? entries.heavy!;
  const headlineMode: ReviewMode = entries.balanced ? 'balanced' : 'heavy';
  const avgF2 = averages[headlineMode]?.f2;

  type Row = { label: string; value: (e: LeaderboardEntry) => string; strong?: boolean };
  const rows: Row[] = [
    { label: 'Rank (by F2)', value: (e) => `#${e.rank} of ${modeTotals[e.mode]}` },
    { label: 'F2', value: (e) => e.f2.toFixed(1), strong: true },
    { label: 'F1', value: (e) => e.f1.toFixed(1) },
    { label: 'Recall', value: (e) => formatScore(e.recall) },
    { label: 'Recall 95% CI', value: (e) => formatCI(e.ciLow, e.ciHigh) },
    { label: 'Precision', value: (e) => formatScore(e.precision) },
    { label: 'Bugs found', value: (e) => `${e.goldensMatched} of ${e.goldensTotal}` },
    { label: 'Comments published', value: (e) => String(e.comments) },
    { label: 'Cost / PR', value: (e) => formatMoney(e.costPerPR, 3) },
    { label: 'Cost / bug found', value: (e) => formatMoney(e.costPerBugFound, 3) },
    { label: 'Total cost (30 PRs)', value: (e) => formatMoney(e.costTotal, 2) },
  ];

  const repos = [...new Set(MODES.flatMap((m) => Object.keys(entries[m]?.byRepo ?? {})))];
  const costNote = headline.costNote;
  const costBasis = headline.costBasis;

  return (
    <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Leaderboard
        </Link>
        <EmbedButton modelId={modelId} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-3 min-w-0">
              <ProviderLogo provider={provider} className="size-6" />
              <h1 className="text-3xl sm:text-4xl font-display text-[color:var(--foreground)]">{displayNameOf(modelId)}</h1>
            </span>
            <Badge variant="default">{provider}</Badge>
          </div>
          <p className="text-[color:var(--muted)] font-mono text-sm">
            {modes.map((m) => `${MODE_LABELS[m]} #${entries[m]!.rank} of ${modeTotals[m]}`).join(' · ')} · {headline.cases} PRs
          </p>
        </div>
        <div className="text-center">
          <span className="font-display text-5xl tabular-nums text-[color:var(--accent)]">{headline.f2.toFixed(1)}</span>
          <p className="text-xs text-[color:var(--muted)] font-mono uppercase mt-1">
            F2 {MODE_LABELS[headlineMode].toLowerCase()} · {avgF2 != null ? formatDelta(headline.f2 - avgF2) : '—'} vs avg
          </p>
        </div>
      </div>

      {/* Both modes side by side */}
      <div className="mb-4">
        <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">Balanced vs heavy</h2>
        <div className="card-hairline overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">Metric</th>
                  {MODES.map((m) => (
                    <th key={m} className="px-5 py-3 text-right">
                      <span className="block text-xs font-mono text-[color:var(--foreground)] uppercase tracking-widest font-bold">{MODE_LABELS[m]}</span>
                      <span className="block text-[11px] font-normal normal-case text-[color:var(--muted-dim)] whitespace-normal max-w-[16rem] ml-auto">{MODE_DESCRIPTIONS[m]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-5 py-3 text-sm text-[color:var(--muted)]">{r.label}</td>
                    {MODES.map((m) => {
                      const e = entries[m];
                      return (
                        <td key={m} className="px-5 py-3 text-right">
                          {e ? (
                            <span className={cn('font-mono tabular-nums', r.strong ? 'text-base font-bold text-[color:var(--accent)]' : 'text-sm text-[color:var(--foreground)]')}>
                              {r.value(e)}
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-[color:var(--muted-dim)]">not run yet</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-3 leading-relaxed">
          Cost: {COST_BASIS_LABELS[costBasis]}, with prompt cache.{costNote ? ` ${costNote}` : ''}
          {headline.priceSource && (
            <>
              {' '}Prices from{' '}
              <a href={headline.priceSource} target="_blank" rel="noopener noreferrer" className="underline hover:text-[color:var(--foreground)]">
                the vendor&apos;s pricing page
              </a>
              .
            </>
          )}
        </p>
      </div>

      {/* Run configuration */}
      <div className="card-hairline p-6 mb-12 mt-8">
        <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4 relative">Run configuration</h2>
        <div className="grid grid-cols-2 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm relative">
          <span className="text-[color:var(--muted)]">Harness</span>
          <span className="text-[color:var(--foreground)] font-mono">{headline.harness}</span>
          <span className="text-[color:var(--muted)]">Access path</span>
          <span className="text-[color:var(--foreground)] font-mono">{headline.accessPath}</span>
          <span className="text-[color:var(--muted)]">Reasoning</span>
          <span className="text-[color:var(--foreground)] font-mono">
            {headline.reasoningConfig}{headline.reasoningEffort ? ` (${headline.reasoningEffort})` : ''}
          </span>
          <span className="text-[color:var(--muted)]">Judge</span>
          <span className="text-[color:var(--foreground)] font-mono">{judgeLabel(headline.judge)}</span>
          <span className="text-[color:var(--muted)]">Gold set</span>
          <span className="text-[color:var(--foreground)] font-mono">{headline.gold ?? '—'} ({headline.goldensTotal} bugs)</span>
          {modes.map((m) => (
            <span key={m} className="contents">
              <span className="text-[color:var(--muted)]">Run at ({MODE_LABELS[m].toLowerCase()})</span>
              <span className="text-[color:var(--foreground)] font-mono">{entries[m]!.runAt?.slice(0, 16).replace('T', ' ') ?? '—'} UTC</span>
            </span>
          ))}
        </div>
      </div>

      {/* Recall by gold severity + by repo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div>
          <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">Recall by bug severity</h2>
          <div className="card-hairline overflow-hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">Severity</th>
                  {MODES.map((m) => (
                    <th key={m} className="px-5 py-3 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold text-right">{MODE_LABELS[m]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEVERITY_ORDER.map((sev) => (
                  <tr key={sev} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-5 py-3 text-sm text-[color:var(--foreground)] capitalize">{sev}</td>
                    {MODES.map((m) => {
                      const st = entries[m]?.bySeverity[sev];
                      return (
                        <td key={m} className="px-5 py-3 text-sm font-mono tabular-nums text-[color:var(--muted)] text-right">
                          {st ? `${st.matched}/${st.goldens}` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">Recall by repository</h2>
          <div className="card-hairline overflow-hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">Repo</th>
                  {MODES.map((m) => (
                    <th key={m} className="px-5 py-3 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold text-right">{MODE_LABELS[m]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {repos.map((repo) => (
                  <tr key={repo} className="border-b border-[var(--border)] last:border-b-0">
                    <td className="px-5 py-3 text-sm text-[color:var(--foreground)]">{REPO_LABELS[repo] || repo}</td>
                    {MODES.map((m) => {
                      const st = entries[m]?.byRepo[repo];
                      return (
                        <td key={m} className="px-5 py-3 text-sm font-mono tabular-nums text-[color:var(--muted)] text-right">
                          {st ? `${formatScore(st.recall)} (${st.matched}/${st.goldens})` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Per-PR breakdown, both modes */}
      <div className="mb-8">
        <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
          Per-PR breakdown ({cases.length})
        </h2>
        <div className="flex flex-col gap-2">
          {cases.map((c) => (
            // <details>: gold text stays in the DOM for crawlers, hidden by CSS.
            <details key={c.caseId} className="card-hairline overflow-hidden group">
              <summary className="relative w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest shrink-0">
                    {REPO_LABELS[c.repo] || c.repo} · {LANGUAGE_LABELS[c.language] || c.language}
                  </span>
                  <span className="text-sm text-[color:var(--foreground)] truncate font-mono">{c.caseId}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="text-xs font-mono text-[color:var(--muted)]">
                    {MODES.map((m) => {
                      const r = c.runs[m];
                      return r ? `${MODE_LABELS[m].toLowerCase()} ${r.matched}/${r.goldens} found` : null;
                    })
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <ChevronDown className="size-4 text-[color:var(--muted)] group-open:hidden" />
                  <ChevronUp className="size-4 text-[color:var(--muted)] hidden group-open:block" />
                </div>
              </summary>
              <div className="border-t border-[var(--border)] px-5 py-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {MODES.filter((m) => c.runs[m]).map((m) => {
                    const r = c.runs[m]!;
                    return (
                      <Link
                        key={m}
                        href={`/traces/${modelSlug(modelId)}/${m}/${c.caseId}`}
                        className="inline-flex items-center gap-2 card-hairline px-3 py-1.5 text-xs font-mono text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors"
                      >
                        {MODE_LABELS[m]} trace: {r.comments} comments ({r.tp} matched a bug, {r.fp} did not) · {formatMoney(r.costUsd, 3)}
                      </Link>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {c.goldens.map((g) => (
                    <div key={g.issueId} className="text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3 flex items-start gap-3">
                      <div className="min-w-0">
                        {g.severity && (
                          <span className="text-[10px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest block mb-1">{g.severity}</span>
                        )}
                        <span className="text-[color:var(--foreground-2)] leading-relaxed">{g.text}</span>
                        <span className="flex flex-wrap gap-x-4 mt-1.5 text-[11px] font-mono text-[color:var(--muted-dim)]">
                          {MODES.filter((m) => c.runs[m]).map((m) => (
                            <span key={m} className="inline-flex items-center gap-1">
                              {g.found[m] ? (
                                <Check className="size-3.5 text-[color:var(--success)]" aria-hidden />
                              ) : (
                                <X className="size-3.5" aria-hidden />
                              )}
                              {MODE_LABELS[m]} {g.found[m] ? 'found it' : 'missed it'}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  ))}
                  {c.goldens.length === 0 && <p className="text-sm text-[color:var(--muted)]">No gold bugs in this PR.</p>}
                </div>
              </div>
            </details>
          ))}
          {cases.length === 0 && (
            <p className="text-[color:var(--muted)] text-center py-12 font-mono text-sm">No case data available for this model.</p>
          )}
        </div>

        {/* Links to the pair routes, so every /compare page has an internal link. */}
        {MODES.filter((m) => others[m].length && entries[m]).map((m) => (
          <div key={m} className="mt-12 pt-8 border-t border-[var(--border)]">
            <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-5">
              Compare {displayNameOf(modelId)} ({MODE_LABELS[m].toLowerCase()}) with
            </h2>
            <ul className="flex flex-wrap gap-2">
              {others[m].map((other) => (
                <li key={other}>
                  <Link
                    href={pairHref(m, modelId, other)}
                    className="inline-block card-hairline px-3.5 py-2 text-sm text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors"
                  >
                    {displayNameOf(other)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
