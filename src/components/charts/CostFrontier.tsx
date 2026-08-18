'use client';

/**
 * Fronteira custo x qualidade: recall no eixo Y, custo medido por PR no X.
 *
 * O eixo X é logarítmico de propósito — o custo por PR varia ~16x entre o mais
 * barato e o mais caro do bench. Em escala linear os quatro modelos baratos
 * viram um borrão colado no zero e o gráfico só mostra o outlier caro.
 *
 * A linha liga apenas os pontos de PARETO (nenhum outro modelo é ao mesmo tempo
 * mais barato e melhor). Ligar todos os pontos sugeriria uma progressão que não
 * existe: os modelos são independentes, não passos de um mesmo dial.
 *
 * Só entram modelos com custo medido. Quem roda por assinatura não tem custo por
 * token e é omitido — plotar em zero mentiria ("de graça"), e escolher um valor
 * qualquer inventaria dado.
 */

import {
  Scatter,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  CartesianGrid,
  ErrorBar,
} from 'recharts';
import { PROVIDER_COLORS } from '@/lib/constants';

export interface FrontierPoint {
  name: string;
  provider: string;
  costPerPR: number;
  recall: number;
  ciLow: number;
  ciHigh: number;
  costPerBug: number | null;
  tokensOut: number;
}

interface Props {
  data: FrontierPoint[];
  height?: number;
}

/** Pareto: ninguém mais barato E com recall maior ou igual. */
function paretoFront(data: FrontierPoint[]): FrontierPoint[] {
  return data
    .filter(
      (p) =>
        !data.some(
          (q) =>
            q !== p &&
            q.costPerPR <= p.costPerPR &&
            q.recall >= p.recall &&
            (q.costPerPR < p.costPerPR || q.recall > p.recall),
        ),
    )
    .sort((a, b) => a.costPerPR - b.costPerPR);
}

function money(v: number) {
  return v < 1 ? `$${v.toFixed(2)}` : `$${v.toFixed(2)}`;
}

interface FrontierTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FrontierPoint }>;
}

function FrontierTooltip({ active, payload }: FrontierTooltipProps) {
  if (!active || !payload?.length) return null;
  const d: FrontierPoint = payload[0].payload;
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border-bright)] p-4 rounded-xl shadow-2xl text-sm">
      <p className="font-bold text-[var(--foreground)] mb-2">{d.name}</p>
      <p className="text-[var(--muted)]">
        recall{' '}
        <span className="text-[var(--foreground)] font-mono">
          {d.recall.toFixed(1)}%
        </span>{' '}
        <span className="font-mono text-xs">
          [{d.ciLow.toFixed(1)}–{d.ciHigh.toFixed(1)}]
        </span>
      </p>
      <p className="text-[var(--muted)]">
        cost/PR{' '}
        <span className="text-[var(--foreground)] font-mono">
          {money(d.costPerPR)}
        </span>
      </p>
      {d.costPerBug != null && (
        <p className="text-[var(--muted)]">
          cost/bug{' '}
          <span className="text-[var(--foreground)] font-mono">
            {money(d.costPerBug)}
          </span>
        </p>
      )}
      <p className="text-[var(--muted)]">
        output tokens/PR{' '}
        <span className="text-[var(--foreground)] font-mono">
          {d.tokensOut.toLocaleString('en-US')}
        </span>
      </p>
    </div>
  );
}

export default function CostFrontier({ data, height = 520 }: Props) {
  const priced = data.filter((d) => Number.isFinite(d.costPerPR) && d.costPerPR > 0);
  if (!priced.length) return null;

  const front = paretoFront(priced);

  // Domínio log com uma folga de meia década de cada lado, para os rótulos dos
  // pontos extremos não serem cortados pela borda.
  const xs = priced.map((d) => d.costPerPR);
  const xMin = Math.min(...xs) / 1.8;
  const xMax = Math.max(...xs) * 1.8;

  const ys = priced.flatMap((d) => [d.ciLow, d.ciHigh]);
  const yMin = Math.max(0, Math.floor((Math.min(...ys) - 4) / 5) * 5);
  const yMax = Math.ceil((Math.max(...ys) + 4) / 5) * 5;

  // ErrorBar do recharts espera o comprimento de cada perna, não os limites.
  const withErr = priced.map((d) => ({
    ...d,
    err: [d.recall - d.ciLow, d.ciHigh - d.recall] as [number, number],
  }));

  return (
    <div
      className="w-full border border-[var(--border)] rounded-lg bg-[var(--surface)] p-6 sm:p-8"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 30, right: 50, bottom: 55, left: 55 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="costPerPR"
            scale="log"
            domain={[xMin, xMax]}
            ticks={[0.05, 0.1, 0.25, 0.5, 1, 2, 4]}
            stroke="var(--border)"
            tick={{ fill: 'var(--muted)', fontSize: 13 }}
            tickFormatter={(v) => `$${v < 1 ? v.toFixed(2) : v.toFixed(0)}`}
            tickLine={false}
            allowDataOverflow
            label={{
              value: 'measured cost per PR (log scale) — cheaper →',
              position: 'bottom',
              fill: 'var(--muted)',
              fontSize: 13,
              offset: 28,
            }}
          />
          <YAxis
            type="number"
            dataKey="recall"
            domain={[yMin, yMax]}
            stroke="var(--border)"
            tick={{ fill: 'var(--muted)', fontSize: 13 }}
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'recall (real bugs found)',
              angle: -90,
              position: 'left',
              fill: 'var(--muted)',
              fontSize: 13,
              offset: 34,
            }}
          />
          <Tooltip content={<FrontierTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Fronteira primeiro, para os pontos ficarem por cima da linha. */}
          <Line
            data={front}
            dataKey="recall"
            type="linear"
            stroke="var(--muted-dim)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            legendType="none"
          />

          <Scatter data={withErr} isAnimationActive={false}>
            {withErr.map((d, i) => (
              <Cell
                key={i}
                fill={PROVIDER_COLORS[d.provider] || 'var(--surface-2)'}
                stroke={PROVIDER_COLORS[d.provider] || 'var(--muted-dim)'}
                strokeWidth={2}
              />
            ))}
            <ErrorBar
              dataKey="err"
              width={5}
              strokeWidth={1.5}
              stroke="var(--muted-dim)"
              direction="y"
            />
            <LabelList
              dataKey="name"
              position="top"
              fontSize={12}
              fill="var(--muted)"
              fontWeight="600"
              offset={14}
            />
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
