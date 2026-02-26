'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { HistogramBucket } from '@/lib/types';

interface HistogramProps {
  buckets: HistogramBucket[];
  avgScore?: number;
  color?: string;
  height?: number;
}

function HistTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border-bright)] p-3 rounded-xl shadow-2xl text-sm">
      <p className="text-[var(--foreground)] font-mono font-bold">{d.min.toFixed(0)}-{d.max.toFixed(0)}%</p>
      <p className="text-[var(--muted)]">{d.count} results</p>
    </div>
  );
}

export default function Histogram({ buckets, avgScore, color = '#ff6b35', height = 280 }: HistogramProps) {
  const data = buckets.map((b) => ({
    label: `${b.min.toFixed(0)}`,
    ...b,
  }));

  return (
    <div className="w-full border border-[var(--border)] rounded-lg bg-[var(--surface)] p-6" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 25, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232630" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#232630"
            tick={{ fill: '#a1a4ac', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
          />
          <YAxis
            stroke="#232630"
            tick={{ fill: '#6b6e76', fontSize: 13 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<HistTooltip />} />
          {avgScore !== undefined && (
            <ReferenceLine
              x={Math.floor(avgScore / 10).toString() + '0'}
              stroke="#d29922"
              strokeDasharray="5 5"
              label={{ value: 'avg', fill: '#d29922', fontSize: 12 }}
            />
          )}
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
