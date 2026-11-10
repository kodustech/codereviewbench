import Link from 'next/link';
import { ArrowRight, GitPullRequest } from 'lucide-react';
import meta from '@/lib/data/meta.json';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, judgeLabel, MODE_DESCRIPTIONS } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { entriesOf, entryFor } from '@/lib/entries';
import ScorecardStack from '@/components/hero/ScorecardStack';
import ProviderLogo from '@/components/shared/ProviderLogo';

/** What heavy mode changes, over the models that have both modes. Null until
 *  at least one model has both. */
function heavyLift() {
  const pairs = entriesOf('balanced')
    .map((b) => ({ b, h: entryFor(b.modelId, 'heavy') }))
    .filter((x): x is { b: typeof x.b; h: NonNullable<typeof x.h> } => !!x.h);
  if (!pairs.length) return null;
  const mean = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / xs.length;
  const costRatios = pairs.filter((x) => x.b.costPerPR && x.h.costPerPR).map((x) => x.h.costPerPR! / x.b.costPerPR!);
  return {
    n: pairs.length,
    recall: mean(pairs.map((x) => x.h.recall - x.b.recall)),
    precision: mean(pairs.map((x) => x.h.precision - x.b.precision)),
    costRatio: costRatios.length ? mean(costRatios) : null,
  };
}

export default function Home() {
  const topEntries = entriesOf('balanced').slice(0, 5);
  const bestBalanced = [...entriesOf('balanced')].sort((a, b) => b.recall - a.recall)[0];
  const bestHeavy = [...entriesOf('heavy')].sort((a, b) => b.recall - a.recall)[0];
  const lift = heavyLift();
  const judge = judgeLabel(meta.judges[0]);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero — full-bleed, a capsula da nav flutua por cima (o spacer do
          Navbar e suprimido na home). E a unica composicao de duas colunas da
          pagina: o Portal permite exatamente um visual competindo com o texto
          aqui ("the product mockup is the only visual element competing with
          text in the hero composition"). */}
      <header className="w-full hero-dusk relative">
        <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-56 pb-20 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-10 items-start">
            {/* Texto direto no gradiente. O card branco foi testado e
                descartado: resolvia contraste mas matava o hero.
                A legibilidade vem de tres coisas, nao do card —
                  1. DM Serif Display no lugar da Playfair. A Playfair e Didone
                     (traco fino capilar) e sumia; a DM tem traco parelho e
                     pesado, que e o que a Perfectly Nineties do spec tem.
                  2. Branco puro, sem opacidade. As opacidades /72 e /85
                     derrubavam o contraste pra 2.6.
                  3. O texto fica no ALTO do hero, onde o gradiente ainda esta
                     no azul escuro (#4a7ff2); mais abaixo ele clareia pro
                     malva e nada branco sobrevive ali. */}
            <div className="reveal" style={{ ['--i' as string]: 0 }}>
              {/* H1 = o nome da coisa. Num site de benchmark a categoria E a
                  oferta, e e o termo que a pessoa busca. Sem verb landmark
                  porque nao ha verbo — desvio registrado no design.md. */}
              <h1 className="font-display text-[2rem] sm:text-[2.5rem] lg:text-[length:var(--text-display)] text-white mb-6 max-w-2xl lowercase">
                <span className="normal-case">AI</span> code review benchmark
              </h1>

              <p className="text-[length:var(--text-heading-sm)] font-semibold leading-[var(--leading-heading-sm)] tracking-[var(--tracking-heading-sm)] text-white max-w-xl mb-10">
                Which models actually catch real bugs, measured on {meta.totalCases} merged pull
                requests from production open-source projects against {meta.totalGoldens} confirmed
                bugs, in two review modes. Every run is versioned, so you can check the numbers or
                re-score them yourself.
              </p>

              {/* Hero Pill Button do spec: pill branco solido, texto preto.
                  O azul do Portal se perderia dentro do proprio gradiente
                  azul, e o spec diz que o contraste branco-sobre-gradiente e
                  o que faz esse botao ser o alvo obvio. */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-[length:var(--text-body-sm)] font-semibold rounded-[var(--radius-buttons)] bg-white text-black hover:bg-white/90 transition-colors"
                >
                  View rankings
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="https://github.com/kodustech/codereviewbench"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[length:var(--text-body-sm)] font-medium rounded-[var(--radius-buttons)] border-[1.5px] border-white text-white hover:bg-white hover:text-black transition-colors"
                >
                  <GitPullRequest className="size-4" />
                  Check the artifacts
                </a>
              </div>
            </div>

            {/* O card transborda a borda de baixo do gradiente. E o unico
                elemento que toca as duas zonas (dusk e canvas), entao e ele
                que costura o hero na pagina — sem isso a coluna curta de texto
                e a coluna comprida do card ficam soltas lado a lado. */}
            <div className="reveal lg:mt-8 lg:-mb-40 relative z-10" style={{ ['--i' as string]: 1 }}>
              <ScorecardStack entries={topEntries.slice(0, 3)} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Daqui pra baixo: coluna unica, largura de leitura, texto corrido.
          O Portal proibe grid de cards nas secoes editoriais; as tres grades
          que existiam aqui (metrics 2-up, repos 3/2, explainer 3-up) viraram
          blocos empilhados. As paginas de DADO (leaderboard, compare, model)
          mantem densidade — ver design.md. ─────────────────────────────── */}

      <section className="w-full px-6 sm:px-12 pt-[calc(var(--section-gap)+7rem)]">
        <div className="editorial">
          <span className="eyebrow block mb-4">Methodology</span>
          <h2 className="mb-5">How the benchmark works</h2>
          <p>
            Every model reviews the same {meta.totalCases} real PRs inside the Kodus review harness,
            once per review mode, against the same gold set, judged the same way. One run per model
            and mode, at vendor defaults, so the numbers are what you get out of the box.
          </p>
        </div>
      </section>

      {/* Pipeline — quatro blocos editoriais, um por passo. O numero fica como
          rotulo mono discreto acima do titulo, nao como coluna de grid. */}
      {[
        {
          step: '01',
          title: 'Real PRs, re-labelled bugs',
          body: `${meta.totalCases} merged pull requests from ${meta.repos.length} production OSS repos. Kodus re-labelled the real problems in each PR (Opus plus a second reviewer, debated where they disagreed) into a gold set of ${meta.totalGoldens} valid true positives.`,
        },
        {
          step: '02',
          title: 'Two review modes',
          body: `Balanced: ${MODE_DESCRIPTIONS.balanced.toLowerCase()} Heavy: ${MODE_DESCRIPTIONS.heavy.toLowerCase()} Every model gets a row in each mode.`,
        },
        {
          step: '03',
          title: 'One judge, every comment',
          body: `${judge} decides whether each published comment is the same problem, at the same place, as a gold bug. Each gold bug counts once; anything else is a false positive. Checked against Opus 5.5, the two agreed on 249 of 252 comments; judging the same output again moves a score by at most one bug.`,
        },
        {
          step: '04',
          title: 'Publish the artifacts',
          body: 'Every submission and scorecard is versioned in the repo, and every PR has a trace page with the comments the model published next to the gold bugs it found and missed.',
        },
      ].map((s) => (
        <section key={s.step} className="w-full px-6 sm:px-12 pt-[var(--spacing-60)]">
          <div className="editorial">
            <span className="font-mono text-[length:var(--text-caption)] text-[color:var(--accent)] font-bold tabular-nums block mb-2">
              {s.step}
            </span>
            <h3 className="mb-2">{s.title}</h3>
            <p>{s.body}</p>
          </div>
        </section>
      ))}

      {/* Metricas — lista de definicao em texto corrido, nao card com linhas. */}
      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="editorial">
          <h2 className="mb-5">What the numbers mean</h2>
          {[
            { metric: 'Recall', desc: `Gold bugs the model found, out of ${meta.totalGoldens}.` },
            { metric: 'Precision', desc: 'Published comments that match a gold bug, out of all published comments. A second comment on the same bug is a false positive.' },
            { metric: 'F1', desc: 'Harmonic mean of precision and recall, equal weight.' },
            { metric: 'F2', desc: 'The F-score with beta = 2, popularized for code review by Martian\'s benchmark: 5·P·R / (4·P + R). It weighs recall twice as much as precision, because a missed bug costs more than a comment you dismiss. The leaderboard ranks by it.' },
            { metric: '95% CI', desc: `How much recall would move on a different sample of ${meta.totalCases} PRs. Where intervals overlap, the exact rank is noise, not signal.` },
            { metric: 'Cost', desc: 'Measured tokens times the vendor\'s list price, with prompt cache: cached reads and cache writes at their own rates. Shown per PR and per bug found.' },
          ].map((m) => (
            <p key={m.metric}>
              <span className="text-[color:var(--color-ink-black)] font-semibold">{m.metric}.</span>{' '}
              {m.desc}
            </p>
          ))}
        </div>
      </section>

      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="editorial">
          <h2 className="mb-5">What this doesn&apos;t measure</h2>
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">Run-to-run variance.</span>{' '}
            One pass per model and mode, so the review agent itself only runs once per entry.
            Treat close scores as tied.
          </p>
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">Harnesses other than Kodus&apos;s, so far.</span>{' '}
            Every entry to date runs on the same harness, so what you are comparing is models
            inside one review agent. The submission contract is open, and other harnesses get
            measured the same way once they are submitted.
          </p>
        </div>
      </section>

      {/* Repositorios — os chips continuam sendo dado (a lista real de repos),
          mas fluem dentro da coluna de leitura em vez de morar num card. */}
      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="editorial">
          <h2 className="mb-5">Source repositories</h2>
          <div className="flex flex-wrap gap-[var(--spacing-8)] mb-[var(--spacing-20)]">
            {meta.repos.map((repo) => (
              <span
                key={repo}
                className="inline-flex items-center px-[var(--spacing-12)] py-[var(--spacing-6)] rounded-[var(--radius-badges)] bg-[var(--surface-card)] border border-[var(--border)] text-[length:var(--text-caption)] font-medium text-[color:var(--color-ink-black)]"
              >
                {REPO_LABELS[repo] || repo}
              </span>
            ))}
          </div>
          <p>
            Merged PRs across {meta.languages.length} languages ({meta.languages.join(', ')}). Same
            set, same gold bugs, for every model, so the comparison is fair even when the
            result isn&apos;t flattering.
          </p>
        </div>
      </section>

      {/* Mini leaderboard — DADO. Fica como tabela, dentro de um card branco
          com o glow ring: e o "product screenshot inside a device frame" que o
          proprio Portal descreve como o unico visual permitido fora do hero.
          Largura de pagina, nao de leitura: coluna alinhada e o ponto dela. */}
      <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="mb-[var(--spacing-36)]">
          <span className="eyebrow block mb-4">Rankings</span>
          <h2 className="font-display text-[length:var(--text-heading)] text-[color:var(--color-ink-black)]">Global leaderboard</h2>
          <p className="text-[length:var(--text-body-sm)] text-[color:var(--muted)] mt-3">Balanced mode, ranked by F2.</p>
        </div>

        <div className="card-hairline overflow-hidden glow-ring">
          <div className="overflow-x-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['#', 'Model', 'F2', 'Precision', 'Recall', 'Cost/PR'].map((h) => (
                    <th key={h} className="px-5 py-3 text-[length:var(--text-micro)] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEntries.map((e, idx) => (
                  <tr
                    key={e.key}
                    className={cn('border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface-2)]')}
                  >
                    <td className="px-5 py-4">
                      <span className={cn('text-[length:var(--text-body-sm)] font-mono tabular-nums', idx === 0 ? 'text-[color:var(--accent)] font-bold' : 'text-[color:var(--muted)]')}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/model/${modelSlug(e.modelId)}`} className="group/link flex items-center gap-2.5">
                        <ProviderLogo provider={providerOf(e.modelId)} />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[length:var(--text-body-sm)] font-semibold transition-colors group-hover/link:text-[color:var(--accent)] text-[color:var(--foreground)]">
                            {displayNameOf(e.modelId)}
                          </span>
                          <span className="text-[length:var(--text-micro)] text-[color:var(--muted-dim)] font-mono uppercase tracking-widest">{providerOf(e.modelId)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('text-[length:var(--text-body)] tabular-nums font-mono font-bold', idx === 0 ? 'text-[color:var(--accent)]' : 'text-[color:var(--foreground)]')}>
                        {e.f2.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">{formatScore(e.precision)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">{formatScore(e.recall)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">{formatMoney(e.costPerPR, 3)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-[var(--spacing-24)]">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-[length:var(--text-body-sm)] text-[color:var(--accent)] hover:underline font-medium group"
          >
            Full ranking <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/leaderboard?mode=heavy"
            className="ml-6 inline-flex items-center gap-2 text-[length:var(--text-body-sm)] text-[color:var(--accent)] hover:underline font-medium group"
          >
            Heavy mode <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Leituras — eram tres cards 3-up, agora blocos empilhados. */}
      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="editorial">
          <h2 className="mb-5">What the results say so far</h2>
          {bestBalanced && (
            <p>
              <span className="text-[color:var(--color-ink-black)] font-semibold">Most bugs still get through.</span>{' '}
              The best balanced recall is {formatScore(bestBalanced.recall)} ({displayNameOf(bestBalanced.modelId)})
              {bestHeavy ? `, and the best heavy recall is ${formatScore(bestHeavy.recall)} (${displayNameOf(bestHeavy.modelId)})` : ''}.
              Code review has a lot of headroom left.
            </p>
          )}
          {lift && (
            <p>
              <span className="text-[color:var(--color-ink-black)] font-semibold">Heavy mode buys recall.</span>{' '}
              Across the {lift.n} model{lift.n === 1 ? '' : 's'} measured in both modes so far, heavy finds{' '}
              {lift.recall >= 0 ? `${lift.recall.toFixed(1)} points more` : `${(-lift.recall).toFixed(1)} points less`} recall
              {' '}with precision {lift.precision >= 0 ? 'up' : 'down'} {Math.abs(lift.precision).toFixed(1)} points
              {lift.costRatio ? `, at ${lift.costRatio.toFixed(1)}x the cost per PR` : ''}.
            </p>
          )}
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">Bring your own harness.</span>{' '}
            Submissions are a documented JSON contract. Submit a PR against the same cases.
          </p>
        </div>
      </section>

      {/* Quem publica — encerra a coluna editorial antes do rodape. */}
      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)] pb-[var(--section-gap)]">
        <div className="editorial">
          <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="inline-block mb-[var(--spacing-16)] opacity-80 hover:opacity-100 transition-opacity">
            <span className="brand-mark" style={{ ['--brand-h' as string]: '24px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kodus-logo.webp" alt="Kodus" />
            </span>
          </a>
          <p>
            This benchmark is run and published by
            <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="text-[color:var(--color-ink-black)] hover:text-[color:var(--accent)] transition-colors mx-1 font-medium">Kodus</a>,
            an AI code review company, on Kodus&apos;s own harness, and Kodus labelled the gold set.
            Every entry runs on that harness, so what the ranking compares is models inside it. See the
            <Link href="/leaderboard" className="text-[color:var(--accent)] hover:underline mx-1">leaderboard</Link>
            for the full disclosure.
          </p>
        </div>
      </section>
    </div>
  );
}
