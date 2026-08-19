'use client';

import { cn } from '@/lib/utils';
import { formatScore, formatMoney, formatCI, formatDelta } from '@/lib/format';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS } from '@/lib/constants';
import type { LeaderboardEntry, LeaderboardAverages, CaseSample } from '@/lib/types';
import StatsCard from '@/components/shared/StatsCard';
import Badge from '@/components/shared/Badge';
import ProviderLogo from '@/components/shared/ProviderLogo';
import Link from 'next/link';
import { ArrowLeft, Target, Shield, DollarSign, Coins, ChevronDown, ChevronUp, Code2, Check } from 'lucide-react';
import { useState } from 'react';

interface ModelDetailClientProps {
  entry: LeaderboardEntry;
  averages: LeaderboardAverages;
  allEntries: LeaderboardEntry[];
  cases: CaseSample[];
}

function classificationLabel(c: string): { label: string; variant: 'default' | 'amber' | 'error' } {
  if (c === 'realMiss') return { label: 'missed — code was available', variant: 'error' };
  if (c === 'artifact') return { label: 'outside replay corpus', variant: 'default' };
  return { label: 'unverifiable', variant: 'amber' };
}

// Cores reaproveitadas dos tokens do tema (neutro → âmbar da marca → coral →
// perigo), sem inventar uma nova cor só pra essa faixa de severidade.
const SEVERITY_ORDER = [
  { key: 'low' as const, label: 'Low', color: 'var(--muted)' },
  { key: 'medium' as const, label: 'Medium', color: 'var(--accent)' },
  { key: 'high' as const, label: 'High', color: 'var(--accent-2)' },
  { key: 'critical' as const, label: 'Critical', color: 'var(--danger)' },
];

const CATEGORY_ORDER = [
  { key: 'bug' as const, label: 'Bug' },
  { key: 'performance' as const, label: 'Performance' },
  { key: 'security' as const, label: 'Security' },
  { key: 'other' as const, label: 'Other' },
];

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
        className="flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-mono"
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
            <p className="text-xs text-[var(--muted-dim)] mb-3">Drop this in your README to link back to this result.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${slug}.svg`} alt="CodeReviewBench badge" className="block max-w-full h-auto mb-3" />
            <div className="flex items-center gap-2 min-w-0">
              <code className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-mono bg-[var(--background)] border border-[var(--border)] rounded-md px-2.5 py-2 text-[var(--foreground-2)]">
                {markdown}
              </code>
              <button
                onClick={copy}
                className="shrink-0 size-8 rounded-md border border-[var(--border-bright)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Copy embed markdown"
              >
                {copied ? <Check className="size-3.5 text-[var(--success)]" /> : <Code2 className="size-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ModelDetailClient({ entry, averages, allEntries, cases }: ModelDetailClientProps) {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const provider = providerOf(entry.modelId);
  const severityTotal = Object.values(entry.findingsBySeverity).reduce((a, b) => a + b, 0);

  const repoRows = Object.entries(entry.byRepo).sort((a, b) => b[1].goldens - a[1].goldens);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Leaderboard
        </Link>
        <EmbedButton modelId={entry.modelId} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-3 min-w-0">
              <ProviderLogo provider={provider} className="size-6" />
              <h1 className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">{displayNameOf(entry.modelId)}</h1>
            </span>
            <span className="flex items-center gap-2">
              <Badge variant="default">{provider}</Badge>
              <Badge variant={entry.tier === 1 ? 'success' : 'default'}>Tier {entry.tier}</Badge>
            </span>
          </div>
          <p className="text-[var(--muted)] font-mono text-sm">
            Rank #{entry.rank} of {allEntries.length} · {entry.cases} PRs · {entry.goldensMatched}/{entry.goldensTotal} golden bugs found
          </p>
        </div>
        <div className="text-center">
          <span className="font-display text-5xl tabular-nums text-[var(--accent)]">{entry.f1.toFixed(1)}</span>
          <p className="text-xs text-[var(--muted)] font-mono uppercase mt-1">
            F1 · {averages.f1 != null ? formatDelta(entry.f1 - averages.f1) : '—'} vs avg
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={Target}
          label="Recall"
          value={formatScore(entry.score)}
          delta={averages.score != null ? entry.score - averages.score : undefined}
        />
        <StatsCard
          icon={Shield}
          label="Precision"
          value={formatScore(entry.precision)}
          delta={averages.precision != null ? entry.precision - averages.precision : undefined}
        />
        <StatsCard icon={DollarSign} label="Cost / PR" value={formatMoney(entry.costPerPR, 3)} />
        <StatsCard icon={Coins} label="Cost / bug found" value={formatMoney(entry.costPerBugFound, 2)} />
      </div>

      {/* Regime + CI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="card-hairline p-6">
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4 relative">Confidence</h3>
          <p className="text-sm text-[var(--foreground-2)] leading-relaxed relative mb-3">
            95% bootstrap interval on recall (2000 resamples over the {entry.cases} PRs):
            <span className="text-[var(--foreground)] font-mono font-semibold mx-1">{formatCI(entry.ciLow, entry.ciHigh)}</span>
            points. This measures sampling variance from which PRs are in the set.
          </p>
          {entry.runToRunVariance ? (
            <p className="text-sm text-[var(--foreground-2)] leading-relaxed relative mb-3">
              Judge noise (same submission, {entry.runToRunVariance.runs} independent re-scores): recall
              <span className="text-[var(--foreground)] font-mono font-semibold mx-1">
                {entry.runToRunVariance.recall.mean.toFixed(1)} ± {entry.runToRunVariance.recall.stdev?.toFixed(1) ?? '—'}
              </span>
              pts (n={entry.runToRunVariance.runs}). This is the judge alone — the exact same findings, scored again.
            </p>
          ) : (
            <p className="text-sm text-[var(--muted-dim)] leading-relaxed relative mb-3">Judge run-to-run variance not yet measured for this model.</p>
          )}
          <p className="text-xs text-[var(--muted-dim)] leading-relaxed relative">
            Neither measures model run-to-run variance — re-running the review agent itself, not just the judge. One pass per entry.
          </p>
        </div>
        <div className="card-hairline p-6">
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4 relative">Run configuration</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm relative">
            <span className="text-[var(--muted)]">Harness</span>
            <span className="text-[var(--foreground)] font-mono">{entry.harness}</span>
            <span className="text-[var(--muted)]">Access path</span>
            <span className="text-[var(--foreground)] font-mono">{entry.accessPath}</span>
            <span className="text-[var(--muted)]">Execution mode</span>
            <span className="text-[var(--foreground)] font-mono">{entry.executionMode}</span>
            <span className="text-[var(--muted)]">Reasoning</span>
            <span className="text-[var(--foreground)] font-mono">
              {entry.reasoningConfig}{entry.reasoningEffort ? ` (${entry.reasoningEffort})` : ''}
            </span>
            <span className="text-[var(--muted)]">Judge</span>
            <span className="text-[var(--foreground)] font-mono">{entry.judge}</span>
          </div>
        </div>
      </div>

      {/* Severity/category mix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="card-hairline p-6">
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-1 relative">Severity mix</h3>
          <p className="text-xs text-[var(--muted-dim)] mb-4 relative">
            What the model called its own findings — not recall by severity, goldens aren&apos;t severity-tagged.
          </p>
          {severityTotal > 0 ? (
            <div className="relative">
              <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[var(--surface-2)]">
                {SEVERITY_ORDER.map(({ key, color }) => {
                  const count = entry.findingsBySeverity[key];
                  if (!count) return null;
                  return <div key={key} style={{ width: `${(count / severityTotal) * 100}%`, background: color }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {SEVERITY_ORDER.map(({ key, color, label }) => (
                  <span key={key} className="flex items-center gap-1.5 text-xs font-mono text-[var(--muted)]">
                    <span className="size-2 rounded-full shrink-0" style={{ background: color }} />
                    {label} <span className="text-[var(--foreground-2)]">{entry.findingsBySeverity[key]}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-dim)] relative">No findings reported.</p>
          )}
        </div>
        <div className="card-hairline p-6">
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-1 relative">Category mix</h3>
          <p className="text-xs text-[var(--muted-dim)] mb-4 relative">
            Only bug/performance/security are consistent across models — the rest is free text, bucketed as other.
          </p>
          <div className="flex flex-wrap gap-2 relative">
            {CATEGORY_ORDER.map(({ key, label }) => (
              <span key={key} className="inline-flex items-baseline gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--surface-2)] text-xs font-mono">
                <span className="text-[var(--muted)]">{label}</span>
                <span className="text-[var(--foreground)] font-semibold">{entry.findingsByCategory[key]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* By repo */}
      <div className="mb-12">
        <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">By repository</h3>
        <div className="card-hairline overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Repo</th>
                  <th className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold text-right">Recall</th>
                  <th className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold text-right">Precision</th>
                  <th className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold text-right">Goldens</th>
                  <th className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold text-right">PRs</th>
                </tr>
              </thead>
              <tbody>
                {repoRows.map(([repo, stat]) => (
                  <tr key={repo} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-5 py-3 text-sm text-[var(--foreground)] font-medium">{REPO_LABELS[repo] || repo}</td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums text-[var(--muted)] text-right">{formatScore(stat.recall)}</td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums text-[var(--muted)] text-right">{formatScore(stat.precision)}</td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums text-[var(--muted)] text-right">{stat.goldens}</td>
                    <td className="px-5 py-3 text-sm font-mono tabular-nums text-[var(--muted)] text-right">{stat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Per-PR breakdown */}
      <div className="mb-8">
        <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
          Per-PR breakdown ({cases.length})
        </h3>
        <div className="flex flex-col gap-2">
          {cases.map((c) => {
            const isOpen = expandedCase === c.id;
            return (
              <div key={c.id} className="card-hairline overflow-hidden">
                <button
                  onClick={() => setExpandedCase(isOpen ? null : c.id)}
                  className="relative w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[var(--muted-dim)] uppercase tracking-widest shrink-0">
                      {REPO_LABELS[c.repo] || c.repo} · {LANGUAGE_LABELS[c.language] || c.language}
                    </span>
                    <span className="text-sm text-[var(--foreground)] truncate font-mono">{c.caseId}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="text-xs font-mono text-[var(--muted)]">
                      {c.matched}/{c.goldens} found · {c.findings.length} reported
                    </span>
                    {isOpen ? <ChevronUp className="size-4 text-[var(--muted)]" /> : <ChevronDown className="size-4 text-[var(--muted)]" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border)] px-5 py-4 space-y-4 panel-in">
                    {c.findings.length > 0 && (
                      <div>
                        <span className="text-[11px] font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold block mb-2">
                          Reported ({c.findings.length})
                        </span>
                        <div className="space-y-2">
                          {c.findings.map((f, i) => (
                            <div key={i} className="text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3">
                              {f.path && (
                                <span className="block text-xs font-mono text-[var(--muted-dim)] mb-1 truncate">
                                  {f.path}{f.startLine ? `:${f.startLine}` : ''}
                                </span>
                              )}
                              <span className="text-[var(--foreground-2)] leading-relaxed">{f.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {c.missedGoldens.length > 0 && (
                      <div>
                        <span className="text-[11px] font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold block mb-2">
                          Missed golden bugs ({c.missedGoldens.length})
                        </span>
                        <div className="space-y-2">
                          {c.missedGoldens.map((g, i) => {
                            const cls = classificationLabel(g.classification);
                            return (
                              <div key={i} className="text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3 flex items-start gap-3">
                                <Badge variant={cls.variant} className="shrink-0 mt-0.5">{cls.label}</Badge>
                                <span className="text-[var(--foreground-2)] leading-relaxed">{g.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {c.findings.length === 0 && c.missedGoldens.length === 0 && (
                      <p className="text-sm text-[var(--muted)]">No findings reported, no golden bugs in this PR.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {cases.length === 0 && (
            <p className={cn('text-[var(--muted)] text-center py-12 font-mono text-sm')}>No case data available for this model.</p>
          )}
        </div>
      </div>
    </div>
  );
}
