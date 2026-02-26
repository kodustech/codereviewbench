'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import leaderboardData from '@/lib/data/leaderboard.json';
import { cn } from '@/lib/utils';
import { formatScore, formatLatency } from '@/lib/format';
import { LANGUAGE_LABELS, CATEGORY_LABELS, ALL_LANGUAGES, ALL_CATEGORIES, PROVIDER_COLORS } from '@/lib/constants';
import FilterBar from '@/components/shared/FilterBar';
import ViewSwitcher from '@/components/shared/ViewSwitcher';
import ScatterPlotChart from '@/components/charts/ScatterPlot';
import BarChartComponent from '@/components/charts/BarChart';
import RadarChartComponent from '@/components/charts/RadarChart';
import JudgeAgreement from '@/components/charts/JudgeAgreement';
import { List, LayoutGrid, BarChart3, Radar, Scale, FlaskConical, Layers, AlertCircle, ArrowUpDown, ChevronDown } from 'lucide-react';
import type { LeaderboardModel } from '@/lib/types';

const data = leaderboardData as { models: LeaderboardModel[]; averages: { score: number; coverage: number; validity: number; localScore: number; crossFileScore: number } };

const VIEWS = [
  { key: 'table', label: 'Table', icon: List },
  { key: 'scatter', label: 'Scatter', icon: LayoutGrid },
  { key: 'bar', label: 'Bar', icon: BarChart3 },
  { key: 'radar', label: 'Radar', icon: Radar },
  { key: 'judges', label: 'Judges', icon: Scale },
];

type SortKey = 'rank' | 'score' | 'coverage' | 'validity' | 'localScore' | 'crossFileScore' | 'passRate' | 'latency' | 'errors';

export default function LeaderboardClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = searchParams.get('lang') || 'all';
  const category = searchParams.get('category') || 'all';
  const [view, setView] = useState('table');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [scoringOpen, setScoringOpen] = useState(false);

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  // Compute filtered/recalculated scores
  const hasFilter = lang !== 'all' || category !== 'all';

  const models = useMemo(() => {
    const mapped = data.models
      .map((m) => {
        let score = m.score;
        let coverage = m.coverage;
        let validity = m.validity;

        if (lang !== 'all' && m.byLanguage[lang]) {
          const l = m.byLanguage[lang];
          score = l.score;
          coverage = l.coverage;
          validity = l.validity;
        }
        if (category !== 'all' && m.byCategory[category]) {
          const c = m.byCategory[category];
          score = c.score;
          coverage = c.coverage;
          validity = c.validity;
        }

        return { ...m, score, coverage, validity };
      })
      .sort((a, b) => {
        let aVal: number, bVal: number;
        switch (sortKey) {
          case 'score': aVal = a.score; bVal = b.score; break;
          case 'coverage': aVal = a.coverage; bVal = b.coverage; break;
          case 'validity': aVal = a.validity; bVal = b.validity; break;
          case 'localScore': aVal = a.localScore; bVal = b.localScore; break;
          case 'crossFileScore': aVal = a.crossFileScore; bVal = b.crossFileScore; break;
          case 'passRate': aVal = a.passRate; bVal = b.passRate; break;
          case 'latency': aVal = a.latency.p50; bVal = b.latency.p50; break;
          case 'errors': aVal = a.errors; bVal = b.errors; break;
          default: aVal = a.score; bVal = b.score; break;
        }
        const defaultDesc = sortKey === 'latency' || sortKey === 'errors';
        const dir = sortKey === 'rank' ? 'desc' : sortDir;
        return dir === 'asc' ? aVal - bVal : bVal - aVal;
      });

    // Re-assign ranks based on current sort (by score desc)
    const ranked = [...mapped].sort((a, b) => b.score - a.score);
    const rankMap = new Map(ranked.map((m, i) => [m.slug, i + 1]));
    return mapped.map((m) => ({ ...m, rank: rankMap.get(m.slug) || m.rank }));
  }, [lang, category, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' || key === 'latency' || key === 'errors' ? 'asc' : 'desc');
    }
  };

  const setExclusiveFilter = useCallback(
    (key: 'lang' | 'category', value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const other = key === 'lang' ? 'category' : 'lang';
      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
        params.delete(other); // clear the other filter
      }
      router.replace(`/leaderboard?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const filterGroups = [
    {
      key: 'lang',
      label: 'Language',
      options: [{ value: 'all', label: 'All' }, ...ALL_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))],
      value: lang,
      onChange: (v: string) => setExclusiveFilter('lang', v),
    },
    {
      key: 'category',
      label: 'Category',
      options: [{ value: 'all', label: 'All' }, ...ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))],
      value: category,
      onChange: (v: string) => setExclusiveFilter('category', v),
    },
  ];

  // Chart data helpers
  const scatterData = models.map((m) => ({
    name: m.displayName,
    provider: m.provider,
    x: m.localScore,
    y: m.crossFileScore,
    z: m.score,
  }));

  const barData = models.map((m) => ({
    name: m.displayName,
    local: m.byCategory['local']?.score || 0,
    crossFile: m.byCategory['cross-file']?.score || 0,
  }));

  const radarAxes = ALL_LANGUAGES.filter((l) => models.some((m) => m.byLanguage[l]));
  const radarData = radarAxes.map((lang) => {
    const point: { axis: string; [key: string]: string | number } = { axis: LANGUAGE_LABELS[lang] };
    models.forEach((m) => {
      point[m.slug] = m.byLanguage[lang]?.score || 0;
    });
    return point;
  });

  const judgeData = models.map((m) => ({
    name: m.displayName,
    provider: m.provider,
    sonnet: (m.judges.sonnet.coverage + m.judges.sonnet.validity) / 2 * 100 / 100,
    gpt: (m.judges.gpt.coverage + m.judges.gpt.validity) / 2 * 100 / 100,
  }));

  const SortHeader = ({ label, sortKeyName, className }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <th
      className={cn('px-5 py-3.5 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest cursor-pointer hover:text-[var(--foreground)] transition-colors select-none font-bold', className)}
      onClick={() => toggleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        {sortKey === sortKeyName && <ArrowUpDown className="size-3" />}
      </div>
    </th>
  );

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Rankings</span>
        <h1 className="text-3xl sm:text-4xl font-display text-[var(--foreground)] mb-3">AI Code Review Benchmark Leaderboard</h1>
        <p className="text-[15px] text-[var(--muted)] max-w-2xl leading-relaxed">
          Which models actually find bugs, and which ones just add noise? Filter by language and category to see how each model performs.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 pb-8 border-b border-[var(--border)]">
        <FilterBar groups={filterGroups} />
        <ViewSwitcher views={VIEWS} active={view} onChange={setView} />
      </div>

      {/* Scoring methodology panel */}
      {view === 'table' && (
        <div className="mb-8 border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden">
          <button
            onClick={() => setScoringOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center">
                <Scale className="size-4 text-[var(--accent)]" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-[var(--foreground)]">How we measure performance</span>
                <span className="text-xs text-[var(--muted-dim)] block">Scoring weights, pass criteria, and what each column means</span>
              </div>
            </div>
            <ChevronDown className={cn('size-4 text-[var(--muted)] transition-transform', scoringOpen && 'rotate-180')} />
          </button>

          {scoringOpen && (
            <div className="border-t border-[var(--border)] px-6 py-6">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Score breakdown */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Score</h3>
                  <p className="text-sm text-[var(--muted)] mb-4">Continuous quality score from 0 to 1. Weighted average of four components:</p>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Recall', weight: 45, desc: 'Expected decisions detected (strict match)' },
                      { name: 'Soft Coverage', weight: 25, desc: 'Flexible match between predicted and expected' },
                      { name: 'Precision', weight: 20, desc: 'Of predicted decisions, how many were correct' },
                      { name: 'Count Score', weight: 10, desc: 'Penalty if decision count is out of range' },
                    ].map((c) => (
                      <div key={c.name} className="flex items-start gap-3">
                        <div className="flex items-center gap-2 shrink-0 w-36">
                          <div className="h-1.5 rounded-full bg-[var(--surface-2)] w-full overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${c.weight}%` }} />
                          </div>
                          <span className="text-xs font-mono text-[var(--accent)] tabular-nums w-8 text-right">{c.weight}%</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm text-[var(--foreground)] font-medium">{c.name}</span>
                          <span className="text-sm text-[var(--muted)]"> — {c.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Pass Rate */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">Pass Rate</h3>
                  <p className="text-sm text-[var(--muted)] mb-4">Binary. A test passes only if <span className="text-[var(--foreground)]">all four</span> thresholds are met:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { metric: 'score', op: '\u2265', val: '0.72' },
                      { metric: 'recall', op: '\u2265', val: '1.0' },
                      { metric: 'precision', op: '\u2265', val: '0.6' },
                      { metric: 'countScore', op: '\u2265', val: '0.7' },
                    ].map((t) => (
                      <div key={t.metric} className="px-3 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] font-mono text-sm">
                        <span className="text-[var(--foreground)]">{t.metric}</span>
                        <span className="text-[var(--muted-dim)]"> {t.op} </span>
                        <span className="text-[var(--accent)]">{t.val}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-4">A test can score 0.85 but still fail if recall is below 1.0. One missed threshold and the test fails.</p>
                </div>
              </div>

              {/* Column glossary */}
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Column reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
                  <p><span className="text-[var(--foreground)] font-medium">Coverage</span> — % of known bugs found</p>
                  <p><span className="text-[var(--foreground)] font-medium">Validity</span> — % of suggestions that were correct</p>
                  <p><span className="text-[var(--foreground)] font-medium">Local</span> — score on single-file bugs</p>
                  <p><span className="text-[var(--foreground)] font-medium">Cross-File</span> — score on multi-file bugs</p>
                  <p><span className="text-[var(--foreground)] font-medium">Latency</span> — median response time</p>
                  <p><span className="text-[var(--foreground)] font-medium">Errors</span> — failed API calls, excluded from score</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Views */}
      {view === 'table' && (
        <div className="w-full border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <SortHeader label="#" sortKeyName="rank" />
                  <th className="px-5 py-3.5 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest min-w-[240px] font-bold">Model</th>
                  <SortHeader label="Score" sortKeyName="score" />
                  <SortHeader label="Coverage" sortKeyName="coverage" />
                  <SortHeader label="Validity" sortKeyName="validity" />
                  <SortHeader label="Local" sortKeyName="localScore" />
                  <SortHeader label="Cross-File" sortKeyName="crossFileScore" className="text-blue-400" />
                  <SortHeader label="Pass Rate" sortKeyName="passRate" />
                  <SortHeader label="Latency" sortKeyName="latency" />
                  <SortHeader label="Errors" sortKeyName="errors" />
                </tr>
              </thead>
              <tbody>
                {models.map((m, idx) => {
                  const isTop = m.rank === 1;
                  return (
                    <tr key={m.slug} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors group">
                      <td className="px-5 py-4">
                        <span className={cn('text-sm font-mono tabular-nums', isTop ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]')}>
                          {m.rank.toString().padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/model/${m.slug}`} className="flex flex-col gap-0.5 group/link">
                          <span className={cn('text-sm font-semibold tracking-tight group-hover/link:text-[var(--accent)] transition-colors', isTop ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]/80')}>
                            {m.displayName}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] font-mono uppercase tracking-widest">{m.provider}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('text-base tabular-nums font-mono font-bold', isTop ? 'text-[var(--accent)]' : 'text-[var(--foreground)]')}>
                          {formatScore(m.score)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(m.coverage)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(m.validity)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(m.localScore)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('text-sm tabular-nums font-mono font-semibold', m.crossFileScore > 80 ? 'text-[var(--accent)]' : 'text-[var(--muted)]')}>
                          {formatScore(m.crossFileScore)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(m.passRate)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatLatency(m.latency.p50)}</span>
                      </td>
                      <td className="px-5 py-4">
                        {m.errors > 0 ? (
                          <div className="flex items-center gap-1.5 text-[#f85149]">
                            <AlertCircle className="size-3" />
                            <span className="text-xs font-mono font-bold">{m.errors}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-[var(--muted)]/50">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'scatter' && (
        <ScatterPlotChart
          data={scatterData}
          xLabel="Local Logic Score"
          yLabel="Cross-File Score"
          avgX={data.averages.localScore}
          avgY={data.averages.crossFileScore}
          height={600}
        />
      )}

      {view === 'bar' && (
        <BarChartComponent
          data={barData}
          series={[
            { key: 'local', label: 'Local Logic', color: '#5a5d65' },
            { key: 'crossFile', label: 'Cross-File', color: '#ff6b35' },
          ]}
          height={500}
        />
      )}

      {view === 'radar' && (
        <RadarChartComponent
          data={radarData}
          series={models.slice(0, 5).map((m) => ({
            key: m.slug,
            label: m.displayName,
            color: PROVIDER_COLORS[m.provider] || '#71717a',
          }))}
          height={550}
        />
      )}

      {view === 'judges' && (
        <JudgeAgreement data={judgeData} height={550} />
      )}

      {/* Explainer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden mt-10">
        <div className="flex flex-col gap-3 p-6 bg-[var(--surface)]">
          <FlaskConical className="size-5 text-[var(--muted)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Local Logic</h3>
          <p className="text-sm text-[var(--muted)] leading-[1.75]">Bugs inside a single file. Logic errors, wrong conditions, broken state.</p>
        </div>
        <div className="flex flex-col gap-3 p-6 bg-[var(--surface)]">
          <Layers className="size-5 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Cross-File Context</h3>
          <p className="text-sm text-[var(--muted)] leading-[1.75]">A change in one file breaks something in another. The hard part of code review.</p>
        </div>
        <div className="flex flex-col gap-3 p-6 bg-[var(--surface)]">
          <AlertCircle className="size-5 text-[var(--muted)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Process Fails</h3>
          <p className="text-sm text-[var(--muted)] leading-[1.75]">Tests that timed out or returned garbage output.</p>
        </div>
      </div>
    </div>
  );
}
