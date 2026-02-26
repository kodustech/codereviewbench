'use client';

import {
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface RadarDataPoint {
  axis: string;
  [key: string]: string | number;
}

interface RadarSeries {
  key: string;
  label: string;
  color: string;
  fillOpacity?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  series: RadarSeries[];
  height?: number;
}

export default function RadarChartComponent({ data, series, height = 420 }: RadarChartProps) {
  return (
    <div className="w-full border border-[var(--border)] rounded-lg bg-[var(--surface)] p-6 sm:p-8" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#232630" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#a1a4ac', fontSize: 13 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b6e76', fontSize: 12 }}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-bright)',
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'var(--font-mono), monospace', paddingTop: 8 }} />
          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.label}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? 0.15}
            />
          ))}
        </RRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
