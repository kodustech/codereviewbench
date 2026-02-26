'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatScore } from '@/lib/format';
import { LANGUAGE_LABELS, CATEGORY_LABELS, ALL_LANGUAGES, ALL_CATEGORIES } from '@/lib/constants';
import leaderboardData from '@/lib/data/leaderboard.json';
import TraceCard from '@/components/code/TraceCard';
import Badge from '@/components/shared/Badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Sample, LeaderboardModel } from '@/lib/types';

const lb = leaderboardData as { models: LeaderboardModel[] };
const modelSlugs = lb.models.map((m) => m.slug);
const modelNames = Object.fromEntries(lb.models.map((m) => [m.slug, m.displayName]));

const PAGE_SIZE = 20;

interface TracesClientProps {
  samples: Sample[];
}

export default function TracesClient({ samples }: TracesClientProps) {
  const [lang, setLang] = useState('all');
  const [category, setCategory] = useState('all');
  const [model, setModel] = useState('all');
  const [passFilter, setPassFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'latency'>('score');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = samples;

    if (lang !== 'all') result = result.filter((s) => s.lang === lang);
    if (category !== 'all') result = result.filter((s) => s.category === category);
    if (model !== 'all') result = result.filter((s) => s.modelSlug === model);
    if (passFilter === 'pass') result = result.filter((s) => s.pass);
    if (passFilter === 'fail') result = result.filter((s) => !s.pass);
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (s) =>
          s.prSummary.toLowerCase().includes(q) ||
          s.testDescription.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) =>
      sortBy === 'score' ? b.score - a.score : a.latencyMs - b.latencyMs
    );

    return result;
  }, [samples, lang, category, model, passFilter, sortBy, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Explorer</span>
        <h1 className="text-3xl sm:text-4xl font-display text-[var(--foreground)] mb-3">Trace Explorer</h1>
        <p className="text-[15px] text-[var(--muted)] max-w-2xl leading-relaxed">
          All {samples.length} evaluation traces, fully transparent. Click any row to see the diff, what the model suggested, and how both judges scored it.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-[var(--border)]">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="size-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search traces..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--border-bright)]"
          />
        </div>

        {/* Dropdowns as button groups */}
        <FilterPills label="Lang" options={[{ v: 'all', l: 'All' }, ...ALL_LANGUAGES.map((l) => ({ v: l, l: LANGUAGE_LABELS[l] }))]} value={lang} onChange={(v) => { setLang(v); setPage(1); }} />
        <FilterPills label="Category" options={[{ v: 'all', l: 'All' }, ...ALL_CATEGORIES.map((c) => ({ v: c, l: CATEGORY_LABELS[c] }))]} value={category} onChange={(v) => { setCategory(v); setPage(1); }} />
        <FilterPills label="Model" options={[{ v: 'all', l: 'All' }, ...modelSlugs.map((s) => ({ v: s, l: modelNames[s] }))]} value={model} onChange={(v) => { setModel(v); setPage(1); }} />
        <FilterPills label="Result" options={[{ v: 'all', l: 'All' }, { v: 'pass', l: 'Pass' }, { v: 'fail', l: 'Fail' }]} value={passFilter} onChange={(v) => { setPassFilter(v); setPage(1); }} />
        <FilterPills label="Sort" options={[{ v: 'score', l: 'Score' }, { v: 'latency', l: 'Latency' }]} value={sortBy} onChange={(v) => setSortBy(v as 'score' | 'latency')} />
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[var(--muted)] font-mono">
          {filtered.length} results · page {safePage}/{totalPages}
        </span>
      </div>

      {/* Trace list */}
      <div className="flex flex-col gap-2">
        {paginated.map((sample) => (
          <TraceCard key={sample.id} sample={sample} />
        ))}
        {paginated.length === 0 && (
          <div className="text-center py-20 text-[var(--muted)] font-mono">No traces match the filters.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) {
              p = i + 1;
            } else if (safePage <= 4) {
              p = i + 1;
            } else if (safePage >= totalPages - 3) {
              p = totalPages - 6 + i;
            } else {
              p = safePage - 3 + i;
            }
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'size-9 rounded-lg text-sm font-mono transition-all',
                  p === safePage
                    ? 'bg-[var(--surface-2)] text-[var(--foreground)] font-bold'
                    : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]'
                )}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-30 transition-all"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">{label}:</span>
      <div className="flex gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              value === opt.v
                ? 'bg-[var(--surface-2)] text-[var(--foreground)]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
            )}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  );
}
