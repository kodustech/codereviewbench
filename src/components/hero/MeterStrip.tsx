/**
 * Hallmark Lumen meter strip — a real measurement, not a decorative pattern.
 * Bar heights are the actual per-case recall values across every model x PR
 * pair in the bench (sorted ascending so the spread reads as a curve).
 */
interface Props {
  values: number[];
  leftLabel: string;
  rightLabel: string;
}

/** O spec do Lumen pede 60-80 ticks: acima disso a faixa vira textura, nao
 *  leitura. Vinham 268 (um por par modelo x PR). Agrupamos em TICKS baldes e
 *  usamos a MEDIA de cada balde — a curva real da distribuicao continua, so
 *  cai a resolucao. Nao inventa dado: cada tick e a media dos casos dele. */
const TICKS = 72;

function bucket(values: number[]): number[] {
  if (values.length <= TICKS) return values;
  const size = values.length / TICKS;
  return Array.from({ length: TICKS }, (_, i) => {
    const slice = values.slice(Math.floor(i * size), Math.max(Math.floor((i + 1) * size), Math.floor(i * size) + 1));
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export default function MeterStrip({ values, leftLabel, rightLabel }: Props) {
  const ticks = bucket(values);
  return (
    <aside className="meter" aria-label="Recall distribution across every scored PR">
      <p className="meter__label">{leftLabel}</p>
      <div className="meter__bars">
        {ticks.map((v, i) => (
          <span key={i} style={{ height: `${Math.max(4, v)}%`, opacity: 0.35 + (v / 100) * 0.65 }} />
        ))}
      </div>
      <p className="meter__label meter__label--right">{rightLabel}</p>
    </aside>
  );
}
