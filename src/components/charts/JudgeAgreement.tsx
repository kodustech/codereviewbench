'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
  CartesianGrid,
} from 'recharts';
import { PROVIDER_COLORS } from '@/lib/constants';

interface JudgePoint {
  name: string;
  provider: string;
  sonnet: number;
  gpt: number;
}

interface JudgeAgreementProps {
  data: JudgePoint[];
  metric?: 'score' | 'coverage' | 'validity';
  height?: number;
}

function JudgeTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border-bright)] p-4 rounded-xl shadow-2xl text-sm">
      <p className="font-bold text-[var(--foreground)] mb-2">{d.name}</p>
      <p className="text-[var(--muted)]">Sonnet: <span className="text-[var(--foreground)] font-mono">{d.sonnet.toFixed(1)}%</span></p>
      <p className="text-[var(--muted)]">GPT: <span className="text-[var(--foreground)] font-mono">{d.gpt.toFixed(1)}%</span></p>
    </div>
  );
}

export default function JudgeAgreement({ data, height = 450 }: JudgeAgreementProps) {
  return (
    <div className="w-full border border-[var(--border)] rounded-lg bg-[var(--surface)] p-6 sm:p-8" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232630" />
          <XAxis
            type="number"
            dataKey="sonnet"
            domain={[40, 100]}
            stroke="#232630"
            tick={{ fill: '#a1a4ac', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            label={{ value: 'Sonnet Judge', position: 'bottom', fill: '#a1a4ac', fontSize: 13, offset: 25 }}
          />
          <YAxis
            type="number"
            dataKey="gpt"
            domain={[40, 100]}
            stroke="#232630"
            tick={{ fill: '#a1a4ac', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            label={{ value: 'GPT Judge', angle: -90, position: 'left', fill: '#a1a4ac', fontSize: 13, offset: 30 }}
          />
          <Tooltip content={<JudgeTooltip />} />
          <ReferenceLine
            segment={[{ x: 40, y: 40 }, { x: 100, y: 100 }]}
            stroke="#2f3340"
            strokeDasharray="5 5"
          />
          <Scatter data={data}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={PROVIDER_COLORS[entry.provider] || '#2a2d35'}
                stroke={PROVIDER_COLORS[entry.provider] || '#5a5d65'}
                strokeWidth={2}
                opacity={0.85}
              />
            ))}
            <LabelList dataKey="name" position="top" fontSize={12} fill="#a1a4ac" fontWeight="600" offset={12} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
