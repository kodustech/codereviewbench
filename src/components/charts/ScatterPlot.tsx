'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  LabelList,
  CartesianGrid,
} from 'recharts';
import { PROVIDER_COLORS } from '@/lib/constants';

interface ScatterPoint {
  name: string;
  provider: string;
  x: number;
  y: number;
  z?: number;
}

interface ScatterPlotProps {
  data: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
  avgX?: number;
  avgY?: number;
  height?: number;
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border-bright)] p-4 rounded-xl shadow-2xl text-sm">
      <p className="font-bold text-[var(--foreground)] mb-2">{d.name}</p>
      <p className="text-[var(--muted)]">X: <span className="text-[var(--foreground)] font-mono">{d.x.toFixed(1)}%</span></p>
      <p className="text-[var(--muted)]">Y: <span className="text-[var(--foreground)] font-mono">{d.y.toFixed(1)}%</span></p>
    </div>
  );
}

export default function ScatterPlotChart({
  data,
  xLabel,
  yLabel,
  xDomain = [50, 100],
  yDomain = [50, 100],
  avgX,
  avgY,
  height = 500,
}: ScatterPlotProps) {
  return (
    <div className="w-full border border-[var(--border)] rounded-lg bg-[var(--surface)] p-6 sm:p-8" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232630" />
          <XAxis
            type="number"
            dataKey="x"
            domain={xDomain}
            stroke="#232630"
            tick={{ fill: '#a1a4ac', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            label={{ value: xLabel, position: 'bottom', fill: '#a1a4ac', fontSize: 13, offset: 25 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={yDomain}
            stroke="#232630"
            tick={{ fill: '#a1a4ac', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            label={{ value: yLabel, angle: -90, position: 'left', fill: '#a1a4ac', fontSize: 13, offset: 30 }}
          />
          <ZAxis type="number" dataKey="z" range={[200, 600]} />
          <Tooltip content={<ScatterTooltip />} />
          {avgX !== undefined && <ReferenceLine x={avgX} stroke="#2f3340" strokeDasharray="5 5" />}
          {avgY !== undefined && <ReferenceLine y={avgY} stroke="#2f3340" strokeDasharray="5 5" />}
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
            <LabelList
              dataKey="name"
              position="top"
              fontSize={12}
              fill="#a1a4ac"
              fontWeight="600"
              offset={12}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
