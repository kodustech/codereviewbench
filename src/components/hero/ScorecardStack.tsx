/**
 * Pilha de scorecards — o apparatus do hero.
 *
 * Um recibo so provava que UM numero pode ser conferido. Tres empilhados dizem
 * que isso existe pra todo modelo medido, que e a tese do site.
 *
 * Empilha pra CIMA de proposito: o nome do modelo fica no topo de cada
 * recibo, entao deslocar as de tras pra cima deixa os tres nomes visiveis. No
 * hover a pilha abre.
 *
 * Motion: so transform (regra do Lumen), easing nomeado, e colapsa em
 * prefers-reduced-motion.
 */
import Scorecard from './Scorecard';
import { displayNameOf, modelSlug } from '@/lib/constants';
import type { LeaderboardEntry } from '@/lib/types';

interface Props {
  entries: LeaderboardEntry[];
}

export default function ScorecardStack({ entries }: Props) {
  // A de indice 0 fica na frente; as seguintes recuam.
  return (
    <div className="stack">
      {entries.map((e, i) => (
        <div
          key={e.key}
          className="stack__item"
          style={{ ['--i' as string]: i }}
          aria-hidden={i > 0 || undefined}
        >
          <Scorecard
            modelName={displayNameOf(e.modelId)}
            harness={e.harness}
            judge={e.judge}
            executionMode={e.executionMode}
            cases={e.cases}
            goldensTotal={e.goldensTotal}
            goldensMatched={e.goldensMatched}
            recall={e.score}
            precision={e.precision}
            artifactPath={`scorecards/${modelSlug(e.modelId)}.json`}
          />
        </div>
      ))}
    </div>
  );
}
