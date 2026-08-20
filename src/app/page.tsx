import Link from 'next/link';
import { ArrowRight, GitPullRequest } from 'lucide-react';
import meta from '@/lib/data/meta.json';
import leaderboardData from '@/lib/data/leaderboard.json';
import type { LeaderboardData } from '@/lib/types';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS } from '@/lib/constants';
import { formatScore, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import ScorecardStack from '@/components/hero/ScorecardStack';
import ProviderLogo from '@/components/shared/ProviderLogo';

const lb = leaderboardData as unknown as LeaderboardData;

export default function Home() {
  const topEntries = [...lb.entries].sort((a, b) => b.f1 - a.f1).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero — full-bleed, a capsula da nav flutua por cima (o spacer do
          Navbar e suprimido na home). E a unica composicao de duas colunas da
          pagina: o Portal permite exatamente um visual competindo com o texto
          aqui ("the product mockup is the only visual element competing with
          text in the hero composition"). */}
      <header className="w-full hero-dusk relative overflow-clip">
        <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-8 sm:pt-28 pb-16 sm:pb-16">
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
              <span className="eyebrow eyebrow--on-dusk block mb-5">
                {meta.models.length} models &middot; {meta.totalCases} real PRs &middot; {meta.totalGoldens} confirmed bugs
              </span>

              {/* H1 = o nome da coisa. Num site de benchmark a categoria E a
                  oferta, e e o termo que a pessoa busca. Sem verb landmark
                  porque nao ha verbo — desvio registrado no design.md. */}
              <h1 className="font-display text-[2rem] sm:text-[2.5rem] lg:text-[length:var(--text-display)] text-white mb-6 max-w-2xl lowercase">
                <span className="normal-case">AI</span> code review benchmark
              </h1>

              <p className="text-[length:var(--text-body)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] text-white max-w-xl mb-9">
                Which models actually catch real bugs, measured on merged pull requests from
                production open-source projects. Every run is versioned in the repo, so you can
                check the numbers or re-score them yourself.
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

            <div className="reveal" style={{ ['--i' as string]: 1 }}>
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

      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="editorial">
          <span className="eyebrow block mb-4">Methodology</span>
          <h2 className="mb-5">How the benchmark works</h2>
          <p>
            Every model reviews the same {meta.totalCases} real PRs, against the same human-authored
            golden comments, judged the same way. One run per model, at vendor defaults, so the
            numbers are what you get out of the box.
          </p>
        </div>
      </section>

      {/* Pipeline — quatro blocos editoriais, um por passo. O numero fica como
          rotulo mono discreto acima do titulo, nao como coluna de grid. */}
      {[
        {
          step: '01',
          title: 'Real PRs, real bugs',
          body: `${meta.totalCases} merged pull requests from ${meta.repos.length} production OSS repos, each with human-authored review comments as ground truth. ${meta.totalGoldens} golden bugs in total.`,
        },
        {
          step: '02',
          title: 'Deterministic replay',
          body: 'Each model runs the same production review agent, with tool calls replayed against a frozen snapshot of the repo. No live network, and no non-determinism from the codebase changing under it.',
        },
        {
          step: '03',
          title: 'One judge, every finding',
          body: `${meta.judges[0]} decides whether each reported finding describes the same underlying issue as a golden comment. Micro-averaged: true and false positives are summed across all PRs before computing precision and recall.`,
        },
        {
          step: '04',
          title: 'Publish the artifacts',
          body: 'Every submission and scorecard is versioned in the repo. Re-scoring never requires re-running a model, only the judge call is repeated.',
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
            { metric: 'Recall', desc: 'How many of the known bugs the model actually found.' },
            { metric: 'Precision', desc: 'Of what it reported, how much was real. A model that talks more finds more but also misfires more.' },
            { metric: 'F1', desc: 'Harmonic mean of both, equal weight. What the leaderboard ranks by, so talking more is never free.' },
            { metric: 'Tier', desc: 'Models whose recall confidence interval overlaps the tier leader’s. The exact rank inside a tier is noise, not signal.' },
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
            <span className="text-[color:var(--color-ink-black)] font-semibold">Model run-to-run variance.</span>{' '}
            One pass per model, so the review agent itself only runs once per entry. Judge noise
            (re-scoring the same submission) is measured separately where available. Treat close
            scores as tied either way.
          </p>
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">Claude or GPT via API.</span>{' '}
            Anthropic is excluded on subscription-terms grounds. GPT models were measured on a
            ChatGPT subscription and held back pending an API run.
          </p>
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">A comparison of review products.</span>{' '}
            This is one harness (Kodus&apos;s own) reviewing models inside it, not a comparison
            between Kodus and other code review tools.
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
            set, same golden comments, for every model, so the comparison is fair even when the
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
        </div>

        <div className="card-hairline overflow-hidden glow-ring">
          <div className="overflow-x-auto custom-scrollbar relative">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['#', 'Model', 'F1', 'Precision', 'Recall', 'Cost/PR'].map((h) => (
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
                        {e.f1.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">{formatScore(e.precision)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">{formatScore(e.score)}</span>
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
        </div>
      </section>

      {/* Leituras — eram tres cards 3-up, agora blocos empilhados. */}
      <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
        <div className="editorial">
          <h2 className="mb-5">What the results say so far</h2>
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">No model finds even half.</span>{' '}
            The best recall in this benchmark is under 45%. Code review has a lot of headroom left.
          </p>
          <p>
            <span className="text-[color:var(--color-ink-black)] font-semibold">Precision and recall trade off.</span>{' '}
            The model that talks the least is often the most precise. Different products, not
            different quality.
          </p>
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
            an AI code review company, on Kodus&apos;s own harness. It measures models, not review
            products. See the
            <Link href="/leaderboard" className="text-[color:var(--accent)] hover:underline mx-1">leaderboard</Link>
            for the full disclosure.
          </p>
        </div>
      </section>
    </div>
  );
}
