/**
 * Hallmark Lumen apparatus — "codebase graph / topology" variant.
 * One judge node, five real repo nodes (the actual benchmark corpus), hairline
 * edges with a slow-flowing dash. Leader-line labels carry real per-repo
 * golden-comment and case counts pulled from the dataset — never invented.
 * Pure SVG, no <img>, no orb. Pulses; never rotates.
 */
interface RepoNode {
  repo: string;
  label: string;
  language: string;
  goldens: number;
  cases: number;
}

interface Props {
  judgeLabel: string;
  nodes: RepoNode[];
}

const CENTER = 200;
const RADIUS = 138;

function pos(i: number, total: number) {
  const angle = (-90 + (360 / total) * i) * (Math.PI / 180);
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

export default function Apparatus({ judgeLabel, nodes }: Props) {
  return (
    <div className="apparatus" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="apparatus__svg" role="presentation">
        {nodes.map((n, i) => {
          const p = pos(i, nodes.length);
          return (
            <line
              key={`edge-${n.repo}`}
              x1={CENTER}
              y1={CENTER}
              x2={p.x}
              y2={p.y}
              className="apparatus__edge"
              style={{ animationDelay: `${i * -0.6}s` }}
            />
          );
        })}
        {/* Night Foundry: o nucleo EMITE — ele contem a fonte de luz. So o
            anel com stroke deixava um circulo oco, que le como placeholder.
            O wash interno usa --paper-emit, o mesmo token do spec. */}
        <defs>
          <radialGradient id="core-emit">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.30" />
            <stop offset="70%" stopColor="var(--accent)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={30} className="apparatus__core" />
        <circle cx={CENTER} cy={CENTER} r={28} fill="url(#core-emit)" className="apparatus__core-emit" />
        {nodes.map((n, i) => {
          const p = pos(i, nodes.length);
          return <circle key={`node-${n.repo}`} cx={p.x} cy={p.y} r={5} className="apparatus__node" />;
        })}
      </svg>

      {/* Ancorado ABAIXO do nucleo, nao por cima: em cima do traco do
          circulo o texto ficava ilegivel (visivel no print do usuario). */}
      <span
        className="apparatus__core-label"
        style={{ left: `${(CENTER / 400) * 100}%`, top: `${((CENTER + 46) / 400) * 100}%` }}
      >
        judge &middot; {judgeLabel}
      </span>

      <ul className="apparatus__callouts">
        {nodes.map((n, i) => {
          const p = pos(i, nodes.length);
          const side = p.x > CENTER ? 'right' : p.x < CENTER ? 'left' : 'center';
          return (
            <li
              key={n.repo}
              className="apparatus__callout"
              data-side={side}
              style={{ left: `${(p.x / 400) * 100}%`, top: `${(p.y / 400) * 100}%` }}
            >
              {/* UM valor por callout. O spec do Lumen limita a anotacao a
                  um par curto (`P50 · 28 MS`); tres valores por no viravam
                  15 numeros de 9.5px espalhados em volta do grafo. */}
              <span className="apparatus__callout-name">{n.label}</span>
              <span className="apparatus__callout-meta">{n.goldens} bugs</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
