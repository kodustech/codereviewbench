'use client';

import { useState, useMemo, Fragment, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import leaderboardData from '@/lib/data/leaderboard.json';
import caseIndexData from '@/lib/data/case-index.json';
import meta from '@/lib/data/meta.json';
import { cn } from '@/lib/utils';
import { formatScore, formatMoney, formatCI } from '@/lib/format';
import {
  displayNameOf,
  providerOf,
  modelSlug,
  REPO_LABELS,
  LANGUAGE_LABELS,
  SIZE_LABELS,
  MODE_LABELS,
  MODE_DESCRIPTIONS,
  judgeLabel,
  pendingModels,
} from '@/lib/constants';
import { bootstrapCI } from '@/lib/bootstrap';
import dynamic from 'next/dynamic';
import type { FrontierPoint } from '@/components/charts/CostFrontier';

// O recharts so e usado na aba "Pareto Frontier", que e opt-in — mas o import
// estatico fazia TODO visitante da leaderboard baixar a biblioteca inteira.
// Carregado sob demanda, ele sai do bundle inicial. ssr:false porque o grafico
// mede o container pra desenhar; nao ha nada util pra renderizar no servidor.
const CostFrontier = dynamic(() => import('@/components/charts/CostFrontier'), {
  ssr: false,
  loading: () => <div className="h-[560px] rounded-[22px] bg-[var(--surface-2)] animate-pulse" aria-hidden />,
});
import ViewSwitcher from '@/components/shared/ViewSwitcher';
import ProviderLogo from '@/components/shared/ProviderLogo';
import { List, LineChart, ArrowUpDown, ChevronDown, Scale, SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { LeaderboardData, LeaderboardEntry, CaseIndexRow, ReviewMode } from '@/lib/types';

const data = leaderboardData as unknown as LeaderboardData;
const caseIndex = caseIndexData as unknown as CaseIndexRow[];

const VIEWS = [
  { key: 'table', label: 'Table', icon: List },
  { key: 'frontier', label: 'Pareto Frontier', icon: LineChart },
];

const MODE_VIEWS = [
  { key: 'balanced', label: MODE_LABELS.balanced },
  { key: 'heavy', label: MODE_LABELS.heavy },
];

type SortKey = 'rank' | 'f2' | 'f1' | 'precision' | 'recall' | 'costPerPR' | 'costPerBugFound';

/** F-beta from percentages. */
function fBeta(p: number, r: number, beta: number): number {
  const b2 = beta * beta;
  return p + r > 0 ? ((1 + b2) * p * r) / (b2 * p + r) : 0;
}

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
      className={cn('px-5 py-3.5 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest cursor-pointer hover:text-[color:var(--foreground)] transition-colors select-none font-bold', className)}
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
  f2: number | null;
  ciLow: number | null;
  ciHigh: number | null;
  costPerPR: number | null;
  costPerBugFound: number | null;
}

function computeFiltered(rows: CaseIndexRow[]): FilteredMetrics {
  if (!rows.length) {
    return { n: 0, goldens: 0, recall: null, precision: null, f1: null, f2: null, ciLow: null, ciHigh: null, costPerPR: null, costPerBugFound: null };
  }
  const goldens = rows.reduce((s, r) => s + r.goldens, 0);
  const matched = rows.reduce((s, r) => s + r.matched, 0);
  const tp = rows.reduce((s, r) => s + r.tpFindings, 0);
  const fp = rows.reduce((s, r) => s + r.fpFindings, 0);
  const recall = goldens ? (matched / goldens) * 100 : null;
  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : null;
  const f1 = precision == null || recall == null ? null : fBeta(precision, recall, 1);
  const f2 = precision == null || recall == null ? null : fBeta(precision, recall, 2);
  const { lo, hi } = bootstrapCI(rows.map((r) => [r.matched, r.goldens] as [number, number]));
  // Cost is tracked per PR, so the filtered subset has its own $/PR and $/bug.
  const priced = rows.every((r) => r.costUsd != null);
  const cost = priced ? rows.reduce((s, r) => s + (r.costUsd as number), 0) : null;
  return {
    n: rows.length,
    goldens,
    recall,
    precision,
    f1,
    f2,
    ciLow: lo,
    ciHigh: hi,
    costPerPR: cost == null ? null : cost / rows.length,
    costPerBugFound: cost == null || !matched ? null : cost / matched,
  };
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
      <span className="text-[10px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">{label}</span>
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
                  ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[color:var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[color:var(--muted-dim)] hover:text-[color:var(--muted)] hover:border-[var(--border-bright)]',
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

// Mode lives in the URL (?mode=heavy) so a link to the heavy table is
// shareable. Read through useSyncExternalStore, NOT useSearchParams: that hook
// makes a static page bail out to client rendering, and the table (the whole
// point of the page) would vanish from the server HTML. The server snapshot is
// balanced; a ?mode=heavy visit re-renders right after hydration.
const MODE_EVENT = 'crb:mode';
function subscribeMode(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener(MODE_EVENT, cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener(MODE_EVENT, cb);
  };
}
const readMode = () => new URLSearchParams(window.location.search).get('mode');

export default function LeaderboardClient() {
  const modeParam = useSyncExternalStore(subscribeMode, readMode, () => null);
  const mode: ReviewMode = modeParam === 'heavy' ? 'heavy' : 'balanced';
  const setMode = (m: string) => {
    window.history.replaceState(null, '', m === 'heavy' ? '/leaderboard?mode=heavy' : '/leaderboard');
    window.dispatchEvent(new Event(MODE_EVENT));
  };
  const modeEntries = useMemo(() => data.entries.filter((e) => e.mode === mode), [mode]);

  const [view, setView] = useState('table');
  const [sortKey, setSortKey] = useState<SortKey>('f2');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Conjunto VAZIO = sem filtro. Antes o estado inicial marcava tudo, entao o
  // painel abria com os 14 chips acesos em azul — visualmente identico a "14
  // filtros ativos" quando nao havia nenhum, e sem jeito de distinguir marcado
  // de nao marcado. Com vazio-e-neutro, aceso significa exatamente uma coisa.
  const [selLangs, setSelLangs] = useState<Set<string>>(new Set());
  const [selRepos, setSelRepos] = useState<Set<string>>(new Set());
  const [selSizes, setSelSizes] = useState<Set<string>>(new Set());

  const activeFilterCount = selLangs.size + selRepos.size + selSizes.size;
  const isFiltered = activeFilterCount > 0;

  const toggleIn = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (v: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  const resetFilters = () => {
    setSelLangs(new Set());
    setSelRepos(new Set());
    setSelSizes(new Set());
  };

  // Um FilteredMetrics por entrada, recomputado do case-index (não do
  // leaderboard.json) sempre que os filtros mudam. Sem filtro ativo isso
  // ainda roda, mas dá exatamente os números publicados — dá pra usar sempre.
  const filteredByKey = useMemo(() => {
    const map = new Map<string, FilteredMetrics>();
    for (const e of modeEntries) {
      const rows = caseIndex.filter(
                (r) =>
          r.entryKey === e.key &&
          (selLangs.size === 0 || selLangs.has(r.language)) &&
          (selRepos.size === 0 || selRepos.has(r.repo)) &&
          (selSizes.size === 0 || r.sizeBucket == null || selSizes.has(r.sizeBucket)),
      );
      map.set(e.key, computeFiltered(rows));
    }
    return map;
  }, [selLangs, selRepos, selSizes, modeEntries]);

  const entries = useMemo(() => {
    const sorted = [...modeEntries].sort((a, b) => {
      const fa = filteredByKey.get(a.key);
      const fb = filteredByKey.get(b.key);
      let av: number, bv: number;
      switch (sortKey) {
        case 'f2':
          av = (isFiltered ? fa?.f2 : a.f2) ?? -Infinity; bv = (isFiltered ? fb?.f2 : b.f2) ?? -Infinity; break;
        case 'f1':
          av = (isFiltered ? fa?.f1 : a.f1) ?? -Infinity; bv = (isFiltered ? fb?.f1 : b.f1) ?? -Infinity; break;
        case 'precision':
          av = (isFiltered ? fa?.precision : a.precision) ?? -Infinity; bv = (isFiltered ? fb?.precision : b.precision) ?? -Infinity; break;
        case 'recall':
          av = (isFiltered ? fa?.recall : a.recall) ?? -Infinity; bv = (isFiltered ? fb?.recall : b.recall) ?? -Infinity; break;
        case 'costPerPR':
          av = (isFiltered ? fa?.costPerPR : a.costPerPR) ?? Infinity; bv = (isFiltered ? fb?.costPerPR : b.costPerPR) ?? Infinity; break;
        case 'costPerBugFound':
          av = (isFiltered ? fa?.costPerBugFound : a.costPerBugFound) ?? Infinity; bv = (isFiltered ? fb?.costPerBugFound : b.costPerBugFound) ?? Infinity; break;
        default:
          av = a.rank; bv = b.rank; break;
      }
      const dir = sortKey === 'rank' ? 1 : sortDir === 'asc' ? 1 : -1;
      return (av - bv) * dir;
    });
    return sorted;
  }, [sortKey, sortDir, filteredByKey, isFiltered, modeEntries]);

  const toggleSort = (key: SortKey) => {
    const apply = () => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        // cost: cheapest first is the useful default
        setSortDir(key === 'rank' || key === 'costPerPR' || key === 'costPerBugFound' ? 'asc' : 'desc');
      }
    };
    // Reordenar DESLIZANDO a linha ate a nova posicao carrega informacao (da
    // pra ver quem subiu e quem desceu). Isso vinha do `layout` do
    // framer-motion, que custava 46kB gz so por isso. A View Transitions API
    // faz o mesmo FLIP nativamente, a custo zero de bundle. Onde nao houver
    // suporte, a tabela so reordena na hora — degrada pro comportamento sem
    // animacao, nunca pra tela quebrada.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => unknown;
    };
    if (typeof doc.startViewTransition === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doc.startViewTransition(() => flushSync(apply));
    } else {
      apply();
    }
  };

  // Filtered, both axes use the subset: cost is tracked per PR.
  const frontierData: FrontierPoint[] = modeEntries
    .filter((e) => e.costPerPR != null && (filteredByKey.get(e.key)?.n ?? 0) > 0)
    .map((e) => {
      const f = filteredByKey.get(e.key);
      const recall = (isFiltered ? f?.recall : e.recall) ?? 0;
      const ciLow = (isFiltered ? f?.ciLow : e.ciLow) ?? recall;
      const ciHigh = (isFiltered ? f?.ciHigh : e.ciHigh) ?? recall;
      return {
        name: displayNameOf(e.modelId),
        provider: providerOf(e.modelId),
        costPerPR: ((isFiltered ? f?.costPerPR : e.costPerPR) ?? e.costPerPR) as number,
        recall,
        ciLow,
        ciHigh,
        costPerBug: (isFiltered ? f?.costPerBugFound : e.costPerBugFound) ?? null,
        tokensOut: Math.round(e.usage.outputTokens / e.cases),
      };
    });

  // Cost caveats, numbered in order of first appearance in the table.
  const costNotes = [...new Set(entries.map((e) => e.costNote).filter((n): n is string => !!n))];
  const noteMark = (n: string | null) => (n ? '*'.repeat(costNotes.indexOf(n) + 1) : '');

  // Roster models with no row in this mode yet (still running, or not run in this mode).
  const missingHere = [
    ...pendingModels(data.entries.map((e) => e.modelId)),
    ...[...new Set(data.entries.map((e) => e.modelId))].filter((id) => !modeEntries.some((e) => e.modelId === id)),
  ];

  return (
    <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="eyebrow block mb-3">Rankings</span>
        <h1 className="text-3xl sm:text-4xl font-display text-[color:var(--foreground)] mb-3">AI Code Review Benchmark Leaderboard</h1>
        <p className="text-[15px] text-[color:var(--foreground-2)] max-w-2xl leading-relaxed mb-3">
          {meta.totalCases} real pull requests, {meta.totalGoldens} confirmed bugs (gold v3), judged by {judgeLabel(meta.judges[0])}.
          Every model runs in two review modes inside the Kodus harness. Ranked by F2.
        </p>
        <p className="text-[13px] text-[color:var(--muted)] max-w-2xl leading-relaxed">
          <span className="font-semibold text-[color:var(--foreground-2)]">Why F2.</span> F2 is the F-score with beta = 2,
          popularized for code review by Martian&apos;s benchmark. It weighs recall twice as much as precision, because a
          missed bug costs more than a comment you dismiss. F2 = 5·P·R / (4·P + R).
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-4 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-wrap gap-x-4 gap-y-3 items-center">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">Review mode</span>
            <ViewSwitcher views={MODE_VIEWS} active={mode} onChange={setMode} />
          </div>
          <p className="text-xs text-[color:var(--muted)] max-w-xs self-end pb-2">{MODE_DESCRIPTIONS[mode]}</p>
          {/* Ghost Pill do spec quando em repouso, preenchido de azul quando ha
              filtro. O contador diz QUANTOS, que e o que a pessoa quer saber
              sem reabrir o painel. */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-buttons)] text-[length:var(--text-body-sm)] font-semibold transition-colors',
              isFiltered
                ? 'bg-[var(--accent)] text-[color:var(--on-accent)] border-[1.5px] border-[var(--accent)]'
                : 'border-[1.5px] border-[var(--color-ink-black)] text-[color:var(--color-ink-black)] hover:bg-[var(--color-ink-black)] hover:text-white',
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            Filters
            {isFiltered && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-[var(--radius-badges)] bg-white/25 text-[length:var(--text-micro)] font-bold tabular-nums">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn('size-3.5 transition-transform', filtersOpen && 'rotate-180')} />
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
            <p className="text-xs text-[color:var(--muted-dim)] max-w-lg">
              Recomputed from the filtered PRs, not the published headline numbers. With only {meta.totalCases} PRs total, a
              narrow filter can leave very few cases per model; watch the <span className="text-[color:var(--muted)]">n=</span> count
              and the CI. Cost is tracked per PR, so $/PR and $/bug follow the filter too.
            </p>
            {isFiltered && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs font-mono text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors shrink-0 ml-4">
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
              <Scale className="size-4 text-[color:var(--accent)]" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">How to read this table</span>
              <span className="text-xs text-[color:var(--muted-dim)] block">What F2, recall, precision and cost mean here, and what this benchmark doesn&apos;t measure</span>
            </div>
          </div>
          <ChevronDown className={cn('size-4 text-[color:var(--muted)] transition-transform', methodologyOpen && 'rotate-180')} />
        </button>

        {methodologyOpen && (
          <div className="border-t border-[var(--border)] px-6 py-6 space-y-6 panel-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--foreground)] mb-1">Metrics</h3>
                <p className="text-sm text-[color:var(--muted)] mb-3">
                  Micro-averaged over all {meta.totalCases} PRs. The gold set (gold v3) holds {meta.totalGoldens} valid true
                  positives, labelled by Kodus. The judge ({judgeLabel(meta.judges[0])}) matches each published comment to a gold
                  bug when it is the same problem at the same place.
                </p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <p><span className="text-[color:var(--foreground)] font-medium">Recall</span>: <span className="text-[color:var(--muted)]">valid true positives found, out of {meta.totalGoldens}.</span></p>
                  <p><span className="text-[color:var(--foreground)] font-medium">Precision</span>: <span className="text-[color:var(--muted)]">published comments that match a valid true positive, out of all published comments. Each true positive counts once; a second comment on the same bug is a false positive.</span></p>
                  <p><span className="text-[color:var(--foreground)] font-medium">F1</span>: <span className="text-[color:var(--muted)]">harmonic mean of precision and recall, equal weight.</span></p>
                  <p><span className="text-[color:var(--foreground)] font-medium">F2</span>: <span className="text-[color:var(--muted)]">5·P·R / (4·P + R). Recall weighs twice precision. The ranking metric.</span></p>
                  <p><span className="text-[color:var(--foreground)] font-medium">Recall 95% CI</span>: <span className="text-[color:var(--muted)]">bootstrap over the {meta.totalCases} PRs. How much recall would move on a different sample of PRs; overlapping intervals mean the gap is not something this benchmark can separate.</span></p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--foreground)] mb-1">Cost</h3>
                <p className="text-sm text-[color:var(--muted)] mb-4 leading-relaxed">
                  Measured tokens times each vendor&apos;s list price (read {meta.pricesCollectedAt}), with prompt cache:
                  cached reads and cache writes are billed at their own rates, the rest of the input at the input rate.
                  Reasoning tokens are part of output. $/bug is total cost divided by valid true positives found.
                </p>
                <h3 className="text-sm font-semibold text-[color:var(--foreground)] mb-1">What this run does not measure</h3>
                <ul className="text-sm text-[color:var(--muted)] space-y-2 leading-relaxed list-disc list-inside">
                  <li><span className="text-[color:var(--foreground)]">Run-to-run variance.</span> One pass per model and mode. Treat close scores as tied.</li>
                  <li><span className="text-[color:var(--foreground)]">Large PRs.</span> These are {meta.totalCases} ordinary merged PRs; very large diffs are a different regime.</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border)] text-sm text-[color:var(--muted)]">
              <span className="text-[color:var(--foreground)] font-medium">Conflict of interest: </span>
              this benchmark is run and published by Kodus, which sells an AI code review product, on Kodus&apos;s own harness,
              and Kodus labelled the gold set. It measures models inside one fixed harness. It is not a comparison of review
              products, and another harness running the same model can score very differently.
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
                  <th className="px-5 py-3.5 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">#</th>
                  <th className="px-5 py-3.5 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest min-w-[220px] font-bold">Model</th>
                  <SortHeader label="F2" sortKeyName="f2" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="F1" sortKeyName="f1" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="Precision" sortKeyName="precision" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="Recall" sortKeyName="recall" activeKey={sortKey} onSort={toggleSort} />
                  <th className="px-5 py-3.5 text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold text-right">Recall 95% CI</th>
                  <SortHeader label="$/PR" sortKeyName="costPerPR" activeKey={sortKey} onSort={toggleSort} />
                  <SortHeader label="$/bug" sortKeyName="costPerBugFound" activeKey={sortKey} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {entries.map((e: LeaderboardEntry, idx) => {
                                  const provider = providerOf(e.modelId);
                  const f = filteredByKey.get(e.key);
                  const f2 = isFiltered ? f?.f2 ?? null : e.f2;
                  const f1 = isFiltered ? f?.f1 ?? null : e.f1;
                  const precision = isFiltered ? f?.precision ?? null : e.precision;
                  const recall = isFiltered ? f?.recall ?? null : e.recall;
                  const costPerPR = isFiltered ? f?.costPerPR ?? null : e.costPerPR;
                  const costPerBug = isFiltered ? f?.costPerBugFound ?? null : e.costPerBugFound;
                  const ciLow = isFiltered ? f?.ciLow ?? null : e.ciLow;
                  const ciHigh = isFiltered ? f?.ciHigh ?? null : e.ciHigh;
                  const isTop = idx === 0 && (!isFiltered || (f?.n ?? 0) > 0);
                  return (
                    <Fragment key={e.key}>
                      {/* viewTransitionName precisa ser custom-ident: a chave
                          do modelo tem ponto, barra e @, entao e higienizada.
                          E o que deixa o browser parear a linha antes/depois e
                          desliza-la ate a nova posicao. */}
                      <tr
                        key={e.key}
                        style={{ viewTransitionName: `row-${e.key.replace(/[^a-zA-Z0-9]/g, '-')}` }}
                        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <span className={cn('text-sm font-mono tabular-nums', isTop ? 'text-[color:var(--accent)] font-bold' : 'text-[color:var(--muted)]')}>
                            {(isFiltered ? idx + 1 : e.rank).toString().padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/model/${modelSlug(e.modelId)}`} className="flex items-center gap-2.5 group/link">
                            <ProviderLogo provider={provider} />
                            <span className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-semibold tracking-tight text-[color:var(--foreground)] group-hover/link:text-[color:var(--accent)] transition-colors truncate">
                                {displayNameOf(e.modelId)}
                              </span>
                              <span className="text-[11px] text-[color:var(--muted)] font-mono uppercase tracking-widest">{provider}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className={cn('text-base tabular-nums font-mono font-bold', isTop ? 'text-[color:var(--accent)]' : 'text-[color:var(--foreground)]')}>
                            {f2 == null ? '—' : f2.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[color:var(--muted)]">{f1 == null ? '—' : f1.toFixed(1)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[color:var(--muted)]">{precision == null ? '—' : formatScore(precision)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[color:var(--muted)]">{recall == null ? '—' : formatScore(recall)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-xs tabular-nums font-mono text-[color:var(--muted-dim)]">
                            {formatCI(ciLow, ciHigh)}
                            {isFiltered && <span className="ml-1.5 text-[color:var(--muted-dim)]">n={f?.n ?? 0}</span>}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="flex flex-col items-end gap-0.5">
                            <span className="text-sm tabular-nums font-mono text-[color:var(--foreground)]">
                              {formatMoney(costPerPR, 3)}
                              {e.costNote && <span className="text-[color:var(--muted-dim)]" title={e.costNote}>{noteMark(e.costNote)}</span>}
                            </span>
                            {e.costBasis === 'api-equivalent' && (
                              <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--muted-dim)]">API-equivalent</span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm tabular-nums font-mono text-[color:var(--muted)]">{formatMoney(costPerBug, 3)}</span>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {costNotes.length > 0 && (
            <div className="border-t border-[var(--border)] px-5 py-3 space-y-1">
              {costNotes.map((n) => (
                <p key={n} className="text-xs text-[color:var(--muted)]">
                  <span className="font-mono text-[color:var(--muted-dim)] mr-1">{noteMark(n)}</span>
                  {n}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Frontier */}
      {view === 'frontier' && (
        <div>
          <p className="text-sm text-[color:var(--muted)] mb-4 max-w-2xl">
            {MODE_LABELS[mode]} mode. Recall against cost per PR (with prompt cache), log scale. The dashed line connects only the
            Pareto frontier: models where nothing is both cheaper and better. Whiskers are the 95% bootstrap interval on recall.
            {isFiltered && ' Recall, CI and cost reflect the active filters.'}
          </p>
          <CostFrontier data={frontierData} height={560} />
        </div>
      )}

      {missingHere.length > 0 && (
        <section className="mt-16 pt-10 border-t border-[var(--border)]">
          <span className="eyebrow block mb-3">Next up</span>
          <h2 className="font-display text-[length:var(--text-heading)] text-[color:var(--color-ink-black)] mb-3">
            Not in the {MODE_LABELS[mode].toLowerCase()} table yet
          </h2>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--muted)] mb-8">
            Part of this benchmark run; results land here as each one finishes.
          </p>
          <ul className="flex flex-wrap gap-2">
            {missingHere.map((id) => (
              <li
                key={id}
                className="inline-flex items-baseline gap-2 px-4 py-2 rounded-[var(--radius-badges)] border border-[var(--border)] bg-[var(--surface-card)]"
              >
                <span className="text-[length:var(--text-body-sm)] font-semibold text-[color:var(--color-ink-black)]">
                  {displayNameOf(id)}
                </span>
                <span className="text-[length:var(--text-micro)] font-mono uppercase tracking-widest text-[color:var(--muted-dim)]">
                  {providerOf(id)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
