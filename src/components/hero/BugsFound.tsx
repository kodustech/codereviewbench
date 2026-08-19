/**
 * Hero apparatus — grade de bugs.
 *
 * Versoes anteriores (grafo de topologia do corpus, depois escala de recall)
 * falharam pelo mesmo motivo: exigiam que o leitor ja soubesse o vocabulario
 * ("recall", "goldens", "never reached") pra entender o que estava vendo.
 *
 * Aqui cada ponto E um bug real que um revisor humano pegou. Os acesos foram
 * achados pelo melhor modelo; os apagados passaram batido. Nao precisa de
 * legenda: da pra ver que a maioria esta apagada.
 *
 * Numeros vem do leaderboard. Nada e escrito a mao.
 */
interface Props {
  total: number;
  found: number;
  modelName: string;
}

export default function BugsFound({ total, found, modelName }: Props) {
  const missed = total - found;

  return (
    <figure className="bugs">
      {/* Os bugs sao o GABARITO, nao um concorrente. Enquadrar como "humanos
          acharam X, a IA achou Y" cria uma comparacao homem-vs-maquina que o
          benchmark nao faz — a pergunta e quantos dos bugs conhecidos o
          modelo acha. */}
      <figcaption className="bugs__lede">
        These pull requests have <strong>{total} confirmed bugs</strong> in them.
        The best model found <strong>{found}</strong>.
      </figcaption>

      <ol className="bugs__grid" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className="bugs__dot" data-found={i < found || undefined} />
        ))}
      </ol>

      <div className="bugs__key">
        <span className="bugs__key-item">
          <span className="bugs__dot bugs__dot--legend" data-found />
          {found} found
        </span>
        <span className="bugs__key-item">
          <span className="bugs__dot bugs__dot--legend" />
          {missed} missed
        </span>
        <span className="bugs__key-model">best model &middot; {modelName}</span>
      </div>
    </figure>
  );
}
