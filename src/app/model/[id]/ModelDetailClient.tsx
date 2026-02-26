'use client';

import { cn } from '@/lib/utils';
import { formatScore, formatLatency, formatDelta } from '@/lib/format';
import { LANGUAGE_LABELS, PROVIDER_COLORS } from '@/lib/constants';
import type { LeaderboardModel, Sample } from '@/lib/types';
import StatsCard from '@/components/shared/StatsCard';
import Badge from '@/components/shared/Badge';
import Histogram from '@/components/charts/Histogram';
import RadarChartComponent from '@/components/charts/RadarChart';
import BarChartComponent from '@/components/charts/BarChart';
import TraceCard from '@/components/code/TraceCard';
import Link from 'next/link';
import {
  Trophy,
  Target,
  Shield,
  Zap,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface ModelDetailClientProps {
  model: LeaderboardModel;
  averages: { score: number; coverage: number; validity: number; localScore: number; crossFileScore: number };
  allModels: LeaderboardModel[];
  samples: Sample[];
}

export default function ModelDetailClient({
  model,
  averages,
  allModels,
  samples,
}: ModelDetailClientProps) {
  const providerColor = PROVIDER_COLORS[model.provider] || '#71717a';

  // Radar data: language breakdown
  const radarAxes = Object.keys(model.byLanguage).filter((l) => model.byLanguage[l]);
  const radarData = radarAxes.map((lang) => ({
    axis: LANGUAGE_LABELS[lang] || lang,
    model: model.byLanguage[lang]?.score || 0,
    average: Math.round(
      allModels.reduce((sum, m) => sum + (m.byLanguage[lang]?.score || 0), 0) / allModels.length
    ),
  }));

  // Judge comparison bar data
  const judgeBarData = [
    {
      name: 'Coverage',
      sonnet: model.judges.sonnet.coverage,
      gpt: model.judges.gpt.coverage,
    },
    {
      name: 'Validity',
      sonnet: model.judges.sonnet.validity,
      gpt: model.judges.gpt.validity,
    },
  ];

  // Latency comparison data
  const latencyData = allModels
    .map((m) => ({ name: m.displayName, p50: m.latency.p50, isActive: m.slug === model.slug }))
    .sort((a, b) => a.p50 - b.p50);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-12 py-12">
      {/* Back link */}
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8"
      >
        <ArrowLeft className="size-4" /> Back to Leaderboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 pb-8 border-b border-[var(--border)]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-display text-[var(--foreground)]">
              {model.displayName}
            </h1>
            <Badge variant="default" className="text-xs">{model.provider}</Badge>
          </div>
          <p className="text-[var(--muted)] font-mono text-sm">
            Rank #{model.rank} of {allModels.length} models
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <span className="text-5xl font-bold font-mono tabular-nums text-[var(--accent)]">
              {formatScore(model.score)}
            </span>
            <p className="text-xs text-[var(--muted)] font-mono uppercase mt-1">
              {formatDelta(model.score - averages.score)} vs avg
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <StatsCard
          icon={Target}
          label="Coverage"
          value={formatScore(model.coverage)}
          delta={model.coverage - averages.coverage}
        />
        <StatsCard
          icon={Shield}
          label="Validity"
          value={formatScore(model.validity)}
          delta={model.validity - averages.validity}
        />
        <StatsCard
          icon={Trophy}
          label="Local Score"
          value={formatScore(model.localScore)}
          delta={model.localScore - averages.localScore}
        />
        <StatsCard
          icon={Zap}
          label="Cross-File"
          value={formatScore(model.crossFileScore)}
          delta={model.crossFileScore - averages.crossFileScore}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Score Distribution */}
        <div>
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Score Distribution
          </h3>
          <Histogram
            buckets={model.histogram}
            avgScore={averages.score}
            color={providerColor}
            height={280}
          />
        </div>

        {/* Language Radar */}
        <div>
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Performance by Language
          </h3>
          <RadarChartComponent
            data={radarData}
            series={[
              { key: 'model', label: model.displayName, color: providerColor, fillOpacity: 0.2 },
              { key: 'average', label: 'Dataset Average', color: '#5a5d65', fillOpacity: 0.05 },
            ]}
            height={280}
          />
        </div>
      </div>

      {/* Category + Judge row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {/* Category Comparison */}
        <div>
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Category Comparison
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              label="Local Logic"
              value={formatScore(model.byCategory['local']?.score || 0)}
            />
            <StatsCard
              label="Cross-File"
              value={formatScore(model.byCategory['cross-file']?.score || 0)}
              className="border-[var(--accent)]/20"
            />
          </div>
        </div>

        {/* Judge Analysis */}
        <div>
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Judge Analysis (Sonnet vs GPT)
          </h3>
          <BarChartComponent
            data={judgeBarData}
            series={[
              { key: 'sonnet', label: 'Sonnet', color: '#d4a27f' },
              { key: 'gpt', label: 'GPT', color: '#10a37f' },
            ]}
            height={280}
          />
        </div>
      </div>

      {/* Latency Section */}
      <div className="mb-12">
        <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
          Latency (p50 / p90 / p99)
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-center">
            <span className="text-2xl font-bold font-mono text-[var(--foreground)]">{formatLatency(model.latency.p50)}</span>
            <p className="text-xs text-[var(--muted)] font-mono uppercase mt-1">p50</p>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-center">
            <span className="text-2xl font-bold font-mono text-[var(--foreground)]">{formatLatency(model.latency.p90)}</span>
            <p className="text-xs text-[var(--muted)] font-mono uppercase mt-1">p90</p>
          </div>
          <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-center">
            <span className="text-2xl font-bold font-mono text-[var(--foreground)]">{formatLatency(model.latency.p99)}</span>
            <p className="text-xs text-[var(--muted)] font-mono uppercase mt-1">p99</p>
          </div>
        </div>
        {/* Latency comparison bars */}
        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] p-6">
          <div className="space-y-3">
            {latencyData.map((m) => {
              const maxLatency = Math.max(...latencyData.map((d) => d.p50));
              const pct = (m.p50 / maxLatency) * 100;
              return (
                <div key={m.name} className="flex items-center gap-4">
                  <span
                    className={cn(
                      'text-xs font-mono w-32 truncate text-right',
                      m.isActive ? 'text-[var(--foreground)] font-bold' : 'text-[var(--muted)]'
                    )}
                  >
                    {m.name}
                  </span>
                  <div className="flex-1 h-3 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', m.isActive ? 'bg-[var(--accent)]' : 'bg-[var(--border-bright)]')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-mono w-16 tabular-nums', m.isActive ? 'text-[var(--foreground)]' : 'text-[var(--muted)]')}>
                    {formatLatency(m.p50)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <StatsCard icon={CheckCircle2} label="Pass Rate" value={formatScore(model.passRate)} />
        <StatsCard label="Parse Rate" value={formatScore(model.parseRate)} />
        <StatsCard label="Tests" value={model.tests.toString()} />
        <StatsCard label="Errors" value={model.errors.toString()} />
      </div>

      {/* Sample Traces */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">
            Sample Traces ({Math.min(10, samples.length)} of {samples.length})
          </h3>
          <Link
            href={`/traces?model=${model.slug}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors font-mono"
          >
            View all in Explorer →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {samples.slice(0, 10).map((s) => (
            <TraceCard key={s.id} sample={s} />
          ))}
          {samples.length === 0 && (
            <p className="text-[var(--muted)] text-center py-12 font-mono">No traces available for this model.</p>
          )}
        </div>
      </div>
    </div>
  );
}
