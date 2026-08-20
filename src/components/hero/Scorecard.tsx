/**
 * Hero apparatus — o scorecard como recibo.
 *
 * A tese do site nao e "modelos acham pouco bug", e "aqui todo numero pode ser
 * conferido". Entao o visual do hero e o proprio rastro de auditoria: um
 * scorecard real renderizado como recibo, com a configuracao da rodada em
 * cima, os numeros medidos embaixo, e o caminho do arquivo versionado no pe.
 *
 * Referencia do spec do Lumen: "Modal homepage rate sheet — the receipt is the
 * artwork".
 *
 * Todo campo vem do leaderboard.json. Nada e escrito a mao.
 */
interface Props {
  modelName: string;
  harness: string;
  judge: string | null;
  executionMode: string;
  cases: number;
  goldensTotal: number;
  goldensMatched: number;
  recall: number;
  precision: number;
  artifactPath: string;
}

export default function Scorecard({
  modelName,
  harness,
  judge,
  executionMode,
  cases,
  goldensTotal,
  goldensMatched,
  recall,
  precision,
  artifactPath,
}: Props) {
  const config: [string, string][] = [
    ['harness', harness],
    ['judge', judge ?? '—'],
    ['execution', executionMode],
    ['pull requests', String(cases)],
    ['confirmed bugs', String(goldensTotal)],
  ];

  const measured: [string, string][] = [
    ['bugs found', `${goldensMatched} of ${goldensTotal}`],
    ['recall', `${recall.toFixed(1)}%`],
    ['precision', `${precision.toFixed(1)}%`],
  ];

  return (
    <figure className="receipt">
      <header className="receipt__head">
        <span className="receipt__kind">scorecard</span>
        <span className="receipt__subject">{modelName}</span>
      </header>

      <dl className="receipt__rows">
        {config.map(([k, v]) => (
          <div className="receipt__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <dl className="receipt__rows receipt__rows--measured">
        {measured.map(([k, v]) => (
          <div className="receipt__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <footer className="receipt__foot">
        <span className="receipt__path">{artifactPath}</span>
        <span className="receipt__note">versioned in the repo</span>
      </footer>
    </figure>
  );
}
