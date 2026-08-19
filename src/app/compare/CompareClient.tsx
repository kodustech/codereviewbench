'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftRight, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatScore, formatMoney } from '@/lib/format';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS } from '@/lib/constants';
import type { LeaderboardEntry, CaseSample } from '@/lib/types';
import ProviderLogo from '@/components/shared/ProviderLogo';

interface Props {
  entries: LeaderboardEntry[];
  entryA: LeaderboardEntry;
  entryB: LeaderboardEntry;
  casesA: CaseSample[];
  casesB: CaseSample[];
}

interface GoldenRow {
  text: string;
  severity: string | null;
  foundA: boolean;
  foundB: boolean;
}

function ModelPicker({
  entries,
  value,
  otherValue,
  onChange,
}: {
  entries: LeaderboardEntry[];
  value: string;
  otherValue: string;
  onChange: (modelId: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[var(--surface-2)] border border-[var(--border-bright)] rounded-lg px-4 py-3 text-base font-semibold text-[var(--foreground)] appearance-none cursor-pointer"
    >
      {entries.map((e) => (
        <option key={e.key} value={e.modelId} disabled={e.modelId === otherValue}>
          {displayNameOf(e.modelId)} — F1 {e.f1.toFixed(1)}
        </option>
      ))}
    </select>
  );
}

function StatRow({ label, a, b, fmt, higherIsBetter = true }: { label: string; a: number | null; b: number | null; fmt: (v: number) => string; higherIsBetter?: boolean }) {
  const aWins = a != null && b != null && a !== b && (higherIsBetter ? a > b : a < b);
  const bWins = a != null && b != null && a !== b && (higherIsBetter ? b > a : b < a);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3 border-b border-[var(--border)] last:border-b-0">
      <span className={cn('text-lg font-mono font-bold tabular-nums text-right', aWins ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
        {a == null ? '—' : fmt(a)}
      </span>
      <span className="text-[10px] font-mono text-[var(--muted-dim)] uppercase tracking-widest text-center w-28">{label}</span>
      <span className={cn('text-lg font-mono font-bold tabular-nums', bWins ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
        {b == null ? '—' : fmt(b)}
      </span>
    </div>
  );
}

export default function CompareClient({ entries, entryA, entryB, casesA, casesB }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  const setModels = (a: string, b: string) => router.push(`/compare?a=${a}&b=${b}`);

  const providerA = providerOf(entryA.modelId);
  const providerB = providerOf(entryB.modelId);

  // Um golden por PR, com o veredito dos dois modelos — zipado por texto (a
  // mesma lista de goldens do dataset, dois runs diferentes por cima dela).
  const perCase = useMemo(() => {
    const byCaseB = new Map(casesB.map((c) => [c.caseId, c]));
    return casesA
      .map((ca) => {
        const cb = byCaseB.get(ca.caseId);
        if (!cb) return null;
        const goldens: GoldenRow[] = [];
        if (ca.goldensDetail && cb.goldensDetail) {
          const byTextB = new Map(cb.goldensDetail.map((g) => [g.text, g]));
          for (const ga of ca.goldensDetail) {
            const gb = byTextB.get(ga.text);
            goldens.push({ text: ga.text, severity: ga.severity, foundA: ga.matched, foundB: gb?.matched ?? false });
          }
        }
        return { caseId: ca.caseId, repo: ca.repo, language: ca.language, ca, cb, goldens };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [casesA, casesB]);

  const tally = useMemo(() => {
    let both = 0, onlyA = 0, onlyB = 0, neither = 0;
    for (const { goldens } of perCase) {
      for (const g of goldens) {
        if (g.foundA && g.foundB) both += 1;
        else if (g.foundA) onlyA += 1;
        else if (g.foundB) onlyB += 1;
        else neither += 1;
      }
    }
    return { both, onlyA, onlyB, neither, total: both + onlyA + onlyB + neither };
  }, [perCase]);

  return (
    <div className="max-w-[1200px] mx-auto w-full px-6 sm:px-12 py-12">
      <div className="mb-10">
        <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Head to head</span>
        <h1 className="text-3xl sm:text-4xl font-display text-[var(--foreground)] mb-3">Compare two models</h1>
        <p className="text-[15px] text-[var(--muted)] max-w-2xl leading-relaxed">
          Same {perCase.length} PRs, same goldens — which bugs did one find that the other missed?
        </p>
      </div>

      {/* Picker */}
      <div className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 mb-10">
        <div className="flex items-center gap-3 w-full">
          <ProviderLogo provider={providerA} className="size-4" />
          <ModelPicker entries={entries} value={entryA.modelId} otherValue={entryB.modelId} onChange={(v) => setModels(v, entryB.modelId)} />
        </div>
        <button
          onClick={() => setModels(entryB.modelId, entryA.modelId)}
          className="size-10 rounded-full border border-[var(--border-bright)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors shrink-0 rotate-90 sm:rotate-0"
          aria-label="Swap models"
        >
          <ArrowLeftRight className="size-4" />
        </button>
        <div className="flex items-center gap-3 w-full">
          <ModelPicker entries={entries} value={entryB.modelId} otherValue={entryA.modelId} onChange={(v) => setModels(entryA.modelId, v)} />
          <ProviderLogo provider={providerB} className="size-4" />
        </div>
      </div>

      {/* Stats */}
      <div className="card-hairline p-6 mb-6">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-2">
          <Link href={`/model/${modelSlug(entryA.modelId)}`} className="text-sm font-semibold text-right text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
            {displayNameOf(entryA.modelId)}
          </Link>
          <span className="w-28" />
          <Link href={`/model/${modelSlug(entryB.modelId)}`} className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
            {displayNameOf(entryB.modelId)}
          </Link>
        </div>
        <StatRow label="F1" a={entryA.f1} b={entryB.f1} fmt={(v) => v.toFixed(1)} />
        <StatRow label="Recall" a={entryA.score} b={entryB.score} fmt={formatScore} />
        <StatRow label="Precision" a={entryA.precision} b={entryB.precision} fmt={formatScore} />
        <StatRow label="Cost / PR" a={entryA.costPerPR} b={entryB.costPerPR} fmt={(v) => formatMoney(v, 3)} higherIsBetter={false} />
      </div>

      {/* Golden tally */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="card-hairline p-4 text-center">
          <span className="text-2xl font-mono font-bold text-[var(--foreground)] tabular-nums block">{tally.both}</span>
          <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest">both found</span>
        </div>
        <div className="card-hairline p-4 text-center">
          <span className="text-2xl font-mono font-bold text-[var(--accent)] tabular-nums block">{tally.onlyA}</span>
          <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest">only {displayNameOf(entryA.modelId)}</span>
        </div>
        <div className="card-hairline p-4 text-center">
          <span className="text-2xl font-mono font-bold text-[var(--accent-2)] tabular-nums block">{tally.onlyB}</span>
          <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest">only {displayNameOf(entryB.modelId)}</span>
        </div>
        <div className="card-hairline p-4 text-center">
          <span className="text-2xl font-mono font-bold text-[var(--muted-dim)] tabular-nums block">{tally.neither}</span>
          <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest">neither found</span>
        </div>
      </div>

      {/* Per-PR diff */}
      <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">Per-PR diff ({perCase.length})</h3>
      <div className="flex flex-col gap-2">
        {perCase.map(({ caseId, repo, language, goldens }) => {
          const isOpen = expanded === caseId;
          const diffCount = goldens.filter((g) => g.foundA !== g.foundB).length;
          return (
            <div key={caseId} className="card-hairline overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : caseId)}
                className="relative w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] font-mono text-[var(--muted-dim)] uppercase tracking-widest shrink-0">
                    {REPO_LABELS[repo] || repo} · {LANGUAGE_LABELS[language] || language}
                  </span>
                  <span className="text-sm text-[var(--foreground)] truncate font-mono">{caseId}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="text-xs font-mono text-[var(--muted)]">
                    {diffCount > 0 ? <span className="text-[var(--accent)]">{diffCount} disagree</span> : 'agree'} · {goldens.length} goldens
                  </span>
                  {isOpen ? <ChevronUp className="size-4 text-[var(--muted)]" /> : <ChevronDown className="size-4 text-[var(--muted)]" />}
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-[var(--border)] px-5 py-4">
                  {goldens.length === 0 ? (
                    <p className="text-sm text-[var(--muted-dim)]">No golden detail for this PR.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {goldens.map((g, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3">
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            {g.foundA ? <Check className="size-4 text-[var(--success)]" /> : <X className="size-4 text-[var(--muted-dim)]" />}
                            {g.foundB ? <Check className="size-4 text-[var(--success)]" /> : <X className="size-4 text-[var(--muted-dim)]" />}
                          </div>
                          <div className="min-w-0">
                            {g.severity && <span className="text-[10px] font-mono text-[var(--muted-dim)] uppercase tracking-widest block mb-1">{g.severity}</span>}
                            <span className="text-[var(--foreground-2)] leading-relaxed">{g.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
