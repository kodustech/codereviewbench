'use client';

import { useState, useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import leaderboardData from '@/lib/data/leaderboard.json';
import caseIndexData from '@/lib/data/case-index.json';
import meta from '@/lib/data/meta.json';
import { cn } from '@/lib/utils';
import { formatScore, formatMoney, formatCI } from '@/lib/format';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS, SIZE_LABELS } from '@/lib/constants';
import { bootstrapCI } from '@/lib/bootstrap';
import CostFrontier, { type FrontierPoint } from '@/components/charts/CostFrontier';
import ViewSwitcher from '@/components/shared/ViewSwitcher';
import ProviderLogo from '@/components/shared/ProviderLogo';
import { List, LineChart, ArrowUpDown, ChevronDown, Scale, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { LeaderboardData, LeaderboardEntry, CaseIndexRow } from '@/lib/types';

const data = leaderboardData as unknown as LeaderboardData;
const caseIndex = caseIndexData as unknown as CaseIndexRow[];

const VIEWS = [
  { key: 'table', label: 'Table', icon: List },
  { key: 'frontier', label: 'Pareto Frontier', icon: LineChart },
];

type SortKey = 'rank' | 'f1' | 'precision' | 'recall' | 'costPerPR' | 'costPerBugFound';

function SortHeader({
  label,
  sortKeyName,
  className,
  activeKey,
  onSort,
}: {
  label: string;
  sortKeyName: SortKey;
  className?: string;
  activeKey: SortKey;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className={cn('px-5 py-3.5 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest cursor-pointer hover:text-[var(--foreground)] transition-colors select-none font-bold', className)}
      onClick={() => onSort(sortKeyName)}
    >
      <div className="flex items-center gap-1.5 justify-end">
        {label}
        {activeKey === sortKeyName && <ArrowUpDown className="size-3" />}
      </div>
    </th>
  );
}

/** Métricas recomputadas de um subconjunto filtrado de casos — não vêm do
 *  leaderboard.json (que só tem o bench inteiro). null = sem caso nenhum
 *  no subconjunto pra essa entrada, não 0 — 0 mentiria "testado e zerou". */
interface FilteredMetrics {
  n: number;
  goldens: number;
  recall: number | null;
  precision: number | null;
  f1: number | null;
  ciLow: number | null;
  ciHigh: number | null;
}

function computeFiltered(rows: CaseIndexRow[]): FilteredMetrics {
  if (!rows.length) return { n: 0, goldens: 0, recall: null, precision: null, f1: null, ciLow: null, ciHigh: null };
  const goldens = rows.reduce((s, r) => s + r.goldens, 0);
  const matched = rows.reduce((s, r) => s + r.matched, 0);
  const tp = rows.reduce((s, r) => s + r.tpFindings, 0);
  const fp = rows.reduce((s, r) => s + r.fpFindings, 0);
  const recall = goldens ? (matched / goldens) * 100 : null;
  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : null;
  const f1 = precision == null || recall == null ? null : recall + precision > 0 ? (2 * recall * precision) / (recall + precision) : 0;
  const { lo, hi } = bootstrapCI(rows.map((r) => [r.matched, r.goldens] as [number, number]));
  return { n: rows.length, goldens, recall, precision, f1, ciLow: lo, ciHigh: hi };
}

function FilterGroup({
  label,
  options,
  labelOf,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  labelOf: (v: string) => string;
  selected: Set<string>;
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.has(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-mono border transition-colors',
                active
                  ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted-dim)] hover:text-[var(--muted)] hover:border-[var(--border-bright)]',
              )}
            >
              {labelOf(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LeaderboardClient() {
  const [view, setView] = useState('table');
  const [sortKey, setSortKey] = useState<SortKey>('f1');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selLangs, setSelLangs] = useState<Set<string>>(new Set(meta.languages));
  const [selRepos, setSelRepos] = useState<Set<string>>(new Set(meta.repos));
  const [selSizes, setSelSizes] = useState<Set<string>>(new Set(meta.sizes));

  const isFiltered =
    selLangs.size !== meta.languages.length || selRepos.size !== meta.repos.length || selSizes.size !== meta.sizes.length;

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const resetFilters = () => {
    setSelLangs(new Set(meta.languages));
    setSelRepos(new Set(meta.repos));
    setSelSizes(new Set(meta.sizes));
  };

  // Um FilteredMetrics por entrada, recomputado do case-index (não do
  // leaderboard.json) sempre que os filtros mudam. Sem filtro ativo isso
  // ainda roda, mas dá exatamente os números publicados — dá pra usar sempre.
  const filteredByKey = useMemo(() => {
    const map = new Map<string, FilteredMetrics>();
    for (const e of data.entries) {
      const rows = caseIndex.filter(
        (r) => r.entryKey === e.key && selLangs.has(r.language) && selRepos.has(r.repo) && (r.sizeBucket == null || selSizes.has(r.sizeBucket)),
      );
      map.set(e.key, computeFiltered(rows));
    }
    return map;
  }, [selLangs, selRepos, selSizes]);

  const entries = useMemo(() => {
    const sorted = [...data.entries].sort((a, b) => {
      const fa = filteredByKey.get(a.key);
      const fb = filteredByKey.get(b.key);
      let av: number, bv: number;
      switch (sortKey) {
        case 'f1':
          av = (isFiltered ? fa?.f1 : a.f1) ?? -Infinity; bv = (isFiltered ? fb?.f1 : b.f1) ?? -Infinity; break;
        case 'precision':
          av = (isFiltered ? fa?.precision : a.precision) ?? -Infinity; bv = (isFiltered ? fb?.precision : b.precision) ?? -Infinity; break;
        case 'recall':
          av = (isFiltered ? fa?.recall : a.score) ?? -Infinity; bv = (isFiltered ? fb?.recall : b.score) ?? -Infinity; break;
        case 'costPerPR':
          // custo n/a vai sempre pro fim, nos dois sentidos — nao e "gratis"
          av = a.costPerPR ?? Infinity; bv = b.costPerPR ?? Infinity; break;
        case 'costPerBugFound':
          av = a.costPerBugFound ?? Infinity; bv = b.costPerBugFound ?? Infinity; break;
        default:
          av = a.rank; bv = b.rank; break;
      }
      const dir = sortKey === 'rank' ? 1 : sortDir === 'asc' ? 1 : -1;
      return (av - bv) * dir;
    });
    return sorted;
  }, [sortKey, sortDir, filteredByKey, isFiltered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  };

  // Filtrado, o eixo Y do Pareto usa o subconjunto (recall/CI recomputados);
  // custo por PR continua o do bench inteiro — não dá pra fatiar tokens por
  // caso sem inflar o bundle, então o eixo X nunca muda com o filtro.
  const frontierData: FrontierPoint[] = data.entries
    .filter((e) => e.costPerPR != null && (filteredByKey.get(e.key)?.n ?? 0) > 0)
    .map((e) => {
      const f = filteredByKey.get(e.key);
      const recall = (isFiltered ? f?.recall : e.score) ?? 0;
      const ciLow = (isFiltered ? f?.ciLow : e.ciLow) ?? recall;
      const ciHigh = (isFiltered ? f?.ciHigh : e.ciHigh) ?? recall;
      return {
        name: displayNameOf(e.modelId),
        provider: providerOf(e.modelId),
        costPerPR: e.costPerPR as number,
        recall,
        ciLow,
        ciHigh,
        costPerBug: e.costPerBugFound,
        tokensOut: Math.round(e.usage.outputTokens / e.cases),
      };
    });

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="eyebrow block mb-3">Rankings</span>
        <h1 className="text-3xl sm:text-4xl font-display text-[var(--foreground)] mb-3">AI Code Review Benchmark Leaderboard</h1>
        <p className="text-[15px] text-[var(--foreground-2)] max-w-2xl leading-relaxed">
          {meta.totalCases} real pull requests, {meta.totalGoldens} human-authored golden bugs, judged by {meta.judges[0]}.
          Ranked by F1 — recall alone rewards whoever talks most.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-4 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
            {meta.repos.length} repos
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
            harness: {meta.harnesses.join(', ')}
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
            1 run per model
          </span>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border transition-colors',
              isFiltered
                ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-bright)]',
            )}
          >
            <SlidersHorizontal className="size-3" />
            Filters
            {isFiltered && <span className="font-bold">· active</span>}
          </button>
        </div>
        <ViewSwitcher views={VIEWS} active={view} onChange={setView} />
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mb-8 p-5 card-hairline panel-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
            <FilterGroup label="Language" options={meta.languages} labelOf={(v) => LANGUAGE_LABELS[v] || v} selected={selLangs} onToggle={toggleIn(setSelLangs)} />
            <FilterGroup label="Repo" options={meta.repos} labelOf={(v) => REPO_LABELS[v] || v} selected={selRepos} onToggle={toggleIn(setSelRepos)} />
            <FilterGroup label="PR size" options={meta.sizes} labelOf={(v) => SIZE_LABELS[v] || v} selected={selSizes} onToggle={toggleIn(setSelSizes)} />
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--muted-dim)] max-w-lg">
              Recomputed from the filtered PRs — not the published headline numbers. With only {meta.totalCases} PRs total, a
              narrow filter can leave very few cases per model; watch the <span className="text-[var(--muted)]">n=</span> count
              and the CI. $/PR and $/bug always reflect the full run — cost isn&apos;t tracked per PR.
            </p>
            {isFiltered && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs font-mono text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0 ml-4">
                <RotateCcw className="size-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Methodology panel */}
      <div className="mb-8 card-hairline overflow-hidden">
        <button
          onClick={() => setMethodologyOpen((v) => !v)}
          className="relative w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-2)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center">
              <Scale className="size-4 text-[var(--accent)]" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-[var(--foreground)]">How to read this table</span>
              <span className="text-xs text-[var(--muted-dim)] block">What F1/precision/recall mean here, tiers, and what this benchmark doesn&apos;t measure</span>
            </div>
          </div>
          <ChevronDown className={cn('size-4 text-[var(--muted)] transition-transform', methodologyOpen && 'rotate-180')} />
        </button>

        {methodologyOpen && (
          <div className="border-t border-[var(--border)] px-6 py-6 space-y-6 panel-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Metrics</h3>
                <p className="text-sm text-[var(--muted)] mb-3">
                  Micro-averaged: true/false positives and false negatives are summed across all {meta.totalCases} PRs, then
                  precision and recall are computed once from the totals — not averaged per-PR. Same convention published by
                  the Martian and Alibaba code review benchmarks.
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <p><span className="text-[var(--foreground)] font-medium">Recall</span> — <span className="text-[var(--muted)]">golden bugs the model actually found</span></p>
                  <p><span className="text-[var(--foreground)] font-medium">Precision</span> — <span className="text-[var(--muted)]">of what it reported, how much was real</span></p>
                  <p><span className="text-[var(--foreground)] font-medium">F1</span> — <span className="text-[var(--muted)]">harmonic mean of both, equal weight</span></p>
                  <p><span className="text-[var(--foreground)] font-medium">Tier</span> — <span className="text-[var(--muted)]">models whose recall confidence intervals overlap the tier leader&apos;s</span></p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">What this run does not measure</h3>
                <ul className="text-sm text-[var(--muted)] space-y-2 leading-relaxed list-disc list-inside">
                  <li><span className="text-[var(--foreground)]">Model run-to-run variance.</span> One pass per model — re-running the review agent itself isn&apos;t measured. Judge run-to-run (re-scoring the same submission) is measured separately where available — see each model&apos;s page.</li>
                  <li><span className="text-[var(--foreground)]">Claude or GPT via API.</span> Anthropic was excluded on subscription-terms grounds; GPT models were measured but ran on a ChatGPT subscription (a different quota regime) and are held back pending an API re-run.</li>
                  <li><span className="text-[var(--foreground)]">Large PRs.</span> Median diff size in this set is ~13K characters; the largest is ~38K. Some commercial reviewers decline PRs above 200K characters — this benchmark says nothing about that regime.</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border)] text-sm text-[var(--muted)]">
              <span className="text-[var(--foreground)] font-medium">Conflict of interest: </span>
              this benchmark is run and published by Kodus, which sells an AI code review product, on Kodus&apos;s own harness.
              It measures models inside one fixed harness — it is not a comparison of review products, and the same harness
              running a different model can score very differently than the numbers here.
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {view === 'table' && (
        <div className="w-full card-hairline overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3.5 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">#</th>
                  <th className="px-5 py-3.5 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest min-w-[220px] font-bold">Model</th>
                  <SortHeader label="F1" sortKeyName="f1" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="Precision" sortKeyName="precision" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="Recall" sortKeyName="recall" activeKey={sortKey} onSort={toggleSort} />
                  <th className="px-5 py-3.5 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold text-right">95% CI</th>
                  <SortHeader label="$/PR" sortKeyName="costPerPR" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="$/bug" sortKeyName="costPerBugFound" activeKey={sortKey} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {entries.map((e: LeaderboardEntry, idx) => {
                  const showTierDivider = !isFiltered && idx > 0 && entries[idx - 1].tier !== e.tier;
                  const provider = providerOf(e.modelId);
                  const f = filteredByKey.get(e.key);
                  const f1 = isFiltered ? f?.f1 ?? null : e.f1;
                  const precision = isFiltered ? f?.precision ?? null : e.precision;
                  const recall = isFiltered ? f?.recall ?? null : e.score;
                  const ciLow = isFiltered ? f?.ciLow ?? null : e.ciLow;
                  const ciHigh = isFiltered ? f?.ciHigh ?? null : e.ciHigh;
                  const isTop = idx === 0 && (!isFiltered || (f?.n ?? 0) > 0);
                  return (
                    <Fragment key={e.key}>
                      {showTierDivider && (
                        <tr key={`tier-${e.tier}`} className="bg-[var(--background)]">
                          <td colSpan={8} className="px-5 py-1.5 text-[10px] font-mono text-[var(--muted-dim)] uppercase tracking-widest">
                            Tier {e.tier} — not statistically distinguishable from the entries above within this group
                          </td>
                        </tr>
                      )}
                      {/* layout: ao reordenar (clique no cabecalho), a linha
                          DESLIZA ate a nova posicao em vez de pular. Isso
                          carrega informacao — da pra ver quem subiu e quem
                          desceu — nao e enfeite. */}
                      <motion.tr
                        key={e.key}
                        layout
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <span className={cn('text-sm font-mono tabular-nums', isTop ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]')}>
                            {(isFiltered ? idx + 1 : e.rank).toString().padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/model/${modelSlug(e.modelId)}`} className="flex items-center gap-2.5 group/link">
                            <ProviderLogo provider={provider} />
                            <span className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-semibold tracking-tight text-[var(--foreground)] group-hover/link:text-[var(--accent)] transition-colors truncate">
                                {displayNameOf(e.modelId)}
                              </span>
                              <span className="text-[11px] text-[var(--muted)] font-mono uppercase tracking-widest">{provider}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={cn('text-base tabular-nums font-mono font-bold', isTop ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
                            {f1 == null ? '—' : f1.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{precision == null ? '—' : formatScore(precision)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{recall == null ? '—' : formatScore(recall)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs tabular-nums font-mono text-[var(--muted-dim)]">
                            {formatCI(ciLow, ciHigh)}
                            {isFiltered && <span className="ml-1.5 text-[var(--muted-dim)]">n={f?.n ?? 0}</span>}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {e.costPerPR != null ? (
                            <span className="text-sm tabular-nums font-mono text-[var(--foreground)]">{formatMoney(e.costPerPR, 3)}</span>
                          ) : (
                            <span className="text-xs font-mono text-[var(--muted-dim)]">subscription</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatMoney(e.costPerBugFound, 2)}</span>
                        </td>
                      </motion.tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Frontier */}
      {view === 'frontier' && (
        <div>
          <p className="text-sm text-[var(--muted)] mb-4 max-w-2xl">
            Recall against measured cost per PR, log scale. The dashed line connects only the Pareto frontier — models where
            nothing is both cheaper and better. Whiskers are the 95% bootstrap interval on recall.
            {isFiltered && ' Recall and CI reflect the active filters; cost per PR is always from the full run.'}
          </p>
          <CostFrontier data={frontierData} height={560} />
        </div>
      )}
    </div>
  );
}
