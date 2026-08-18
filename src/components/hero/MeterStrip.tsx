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

export default function MeterStrip({ values, leftLabel, rightLabel }: Props) {
  return (
    <aside className="meter" aria-label="Recall distribution across every scored PR">
      <p className="meter__label">{leftLabel}</p>
      <div className="meter__bars">
        {values.map((v, i) => (
          <span key={i} style={{ height: `${Math.max(4, v)}%`, opacity: 0.35 + (v / 100) * 0.65 }} />
        ))}
      </div>
      <p className="meter__label meter__label--right">{rightLabel}</p>
    </aside>
  );
}
