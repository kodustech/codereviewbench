'use client';

import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

interface BarChartEntry {
  name: string;
  [key: string]: string | number;
}

interface BarSeries {
  key: string;
  label: string;
  color: string;
}

interface BarChartProps {
  data: BarChartEntry[];
  series: BarSeries[];
  height?: number;
}

function BarTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border-bright)] p-4 rounded-xl shadow-2xl text-sm">
      <p className="font-bold text-[var(--foreground)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[var(--muted)]">
          {p.name}: <span className="text-[var(--foreground)] font-mono font-bold">{Number(p.value).toFixed(1)}%</span>
        </p>
      ))}
    </div>
  );
}

export default function BarChartComponent({ data, series, height = 420 }: BarChartProps) {
  return (
    <div className="w-full border border-[var(--border)] rounded-lg bg-[var(--surface)] p-6 sm:p-8" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RBarChart data={data} margin={{ top: 10, right: 20, bottom: 50, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232630" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#232630"
            tick={{ fill: '#a1a4ac', fontSize: 13 }}
            angle={-35}
            textAnchor="end"
            interval={0}
            tickLine={false}
            dy={8}
          />
          <YAxis
            stroke="#232630"
            tick={{ fill: '#6b6e76', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<BarTooltipContent />} />
          <Legend
            wrapperStyle={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', paddingTop: 16 }}
          />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </RBarChart>
      </ResponsiveContainer>
    </div>
  );
}
