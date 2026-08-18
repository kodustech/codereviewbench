'use client';

import { cn } from '@/lib/utils';
import { formatScore, formatMoney, formatCI, formatDelta } from '@/lib/format';
import { displayNameOf, providerOf, PROVIDER_COLORS, REPO_LABELS, LANGUAGE_LABELS } from '@/lib/constants';
import type { LeaderboardEntry, LeaderboardAverages, CaseSample } from '@/lib/types';
import StatsCard from '@/components/shared/StatsCard';
import Badge from '@/components/shared/Badge';
import Link from 'next/link';
import { ArrowLeft, Target, Shield, DollarSign, Coins, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function ModelDetailClient({ entry, averages, allEntries, cases }: ModelDetailClientProps) {
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const provider = providerOf(entry.modelId);
  const providerColor = PROVIDER_COLORS[provider] || '#71717a';

  const repoRows = Object.entries(entry.byRepo).sort((a, b) => b[1].goldens - a[1].goldens);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="size-4" /> Back to Leaderboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="flex items-center gap-3 min-w-0">
              <span className="size-2.5 rounded-full shrink-0" style={{ background: providerColor }} />
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
          <p className="text-sm text-[var(--foreground-2)] leading-relaxed relative">
            95% bootstrap interval on recall (2000 resamples over the {entry.cases} PRs):
            <span className="text-[var(--foreground)] font-mono font-semibold mx-1">{formatCI(entry.ciLow, entry.ciHigh)}</span>
            points. This measures sampling variance from which PRs are in the set — not run-to-run variance from a
            different pass of the same model (1 run per entry).
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
                  <div className="border-t border-[var(--border)] px-5 py-4 space-y-4">
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
