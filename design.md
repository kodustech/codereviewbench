# Design — CodeReviewBench

> ## ⚠️ EXPERIMENTO ABERTO — tema Portal (branch `design/portal`, 2026-08-20)
>
> Esta branch troca o tema **Lumen (Night Foundry, escuro)** pelo **Portal
> (twilight serif editorial, claro)**. O resto deste documento ainda descreve
> o Lumen e continua valendo em `bench/scorecards-pipeline`, que esta intacta.
> Se o Portal for adotado, este arquivo tem que ser reescrito, nao emendado.
>
> **Desvios conscientes do spec do Portal**, todos porque este e um site de
> DADO, nao uma landing de produto:
>
> 1. **Mono mantida (JetBrains Mono).** O Portal nao tem mono. Aqui existe
>    caminho de arquivo, id de modelo e coluna numerica; sem mono a tabela
>    perde alinhamento e o recibo deixa de parecer recibo.
> 2. **Paleta semantica preservada** (`--success`, `--danger`, `--accent-2`).
>    O Portal pede um acento cromatico so. Essa regra vale pro chrome; estes
>    tres codificam significado que o leitor distingue sem ler rotulo
>    (achou/nao achou, severidade, lado A vs B do compare).
> 3. **Cores de marca dos providers mantidas.** Sao identidade de terceiro,
>    nao decoracao nossa.
> 4. **Densidade das paginas de app mantida.** O Portal manda coluna unica de
>    640-720px e proibe grid de cards nas secoes de marketing. A leaderboard e
>    uma TABELA — e o produto. A regra do Portal foi aplicada as secoes
>    editoriais; as de dado seguem a alocacao que este design.md ja dava
>    ("a benchmark table's job is density, not air").
> 5. **Perfectly Nineties -> Playfair Display**, primeiro substituto nomeado
>    pelo proprio spec. A fonte original nao e livre.
> 6. **Sem silhueta de horizonte no hero.** O Portal descreve arvores na base
>    do gradiente. Seria ilustracao decorativa inventada, que o proprio Portal
>    proibe em "Imagery". A transicao pro canvas faz o papel.
>
> **Conformidade fechada em 2026-08-20 (2a passada)**: escala de tipo do spec
> (display 48px / heading 36px, line-height 1.0), tracking -0.02em global na
> Inter (mono e tabela isentas — apertar mono quebra alinhamento de coluna),
> page max-width 1200px em TODAS as paginas, os 6 shadows, glow ring na pilha
> de recibos (o "Device Mockup Card" do spec), e os nomes de token do spec como
> fonte de verdade com os nomes semanticos do site virando alias.
>
> **Home reestruturada pro Portal literal**: as tres grades de card (metrics
> 2-up, repos 3/2, explainer 3-up) viraram blocos editoriais empilhados em
> coluna de 680px com gap de 100px. O hero segue em duas colunas — o spec
> permite exatamente um visual competindo com o texto ali. A tabela do mini
> leaderboard fica em largura de pagina, dentro de card com glow ring, que e o
> tratamento que o proprio Portal da pra "product screenshot inside a device
> frame". Leaderboard/compare/model seguem densos.
>
> **Desvio novo**: a capsula da nav ganhou backdrop-blur em vez do #ffffff
> solido do spec. Ela tem quase a largura da coluna de leitura (615 vs 680px),
> entao todo texto da pagina passa exatamente por tras dela; solida, cortava a
> frase no meio e lia como bug. Frosted e coerente com a propria linguagem do
> Portal, que descreve o glow ring como emprestado do visionOS.
>
> **Removido junto**: o grain overlay e o `blueprint-grid` (tecnicas de tema
> escuro), o `paper-emit` (wash interno dos cards) e ~120 linhas de CSS morto
> do apparatus/meter, que ja nao eram usadas antes desta branch.
>
> **Bug de asset**: `public/kodus-logo.webp` tem o wordmark em BRANCO e so o
> simbolo cromatico — em tema claro o wordmark sumia. A classe `.brand-mark`
> recorta pro simbolo (34% da largura, medido no arquivo). Se o Portal for
> adotado, o certo e exportar um logo com wordmark escuro.


A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

Produced by a Hallmark `redesign` pass (2026-08-17) at the request of "melhorar
bem a UI/UX, da uma caprichada" — the prior implementation was functional but
carried real AI-tell debt: italicised Instrument Serif on every heading, a
shadow-glow accent effect, a near-pure-black `#0a0b0d` background, four-column
icon-tile feature grids, and un-tokenized hex colors. This system fixes those
while keeping the site's actual job — a data-dense benchmark leaderboard — as
the design's center of gravity, not a marketing skin over it.

## Genre
atmospheric

CodeReviewBench is a dark, technical, after-hours AI-infra tool (closer to
Modal / Together / Anthropic's product surfaces than to a generative-creative
app), which is why the Lumen register — not the generic "generative AI" arm of
atmospheric — is the pick.

## Theme
**Lumen · Night Foundry drop.** The only atmospheric theme with a working
"instrument-grade AI infra" register — hand-built apparatus instead of a
glowing orb, mono UPPERCASE technical labels, Instrument Serif ROMAN headline
with a single accent-colour verb landmark (not italics). Molten-brass accent
(H50) sits close enough to the site's existing orange that the rebrand reads
as a *correction*, not a reset.

**Deliberate deviations from spec: casing.** Lumen's canonical rule lowercases
all prose (headlines, body, nav, buttons) and reserves UPPERCASE for mono
labels only. Two narrowings, both content-driven:

1. **Data identifiers stay natural case, everywhere.** Model names, repo
   names, and version strings are identifiers in a data table (`DeepSeek V4
   Pro`, `cal.com`, `Keycloak`) — forcing those to lowercase would reduce
   scan-ability in the one place precision matters most on this site.
2. **Lowercase is scoped to the two "argument" moments, not all prose.** The
   hero headline (where the verb-landmark technique lives) and the footer's
   closing statement line are lowercase. Explanatory prose — methodology
   copy, metric definitions, the "what this doesn't measure" panel, card
   body text — stays normal sentence case. A benchmark site's credibility
   rests on reading as precise documentation in the body; the stylized
   lowercase voice is reserved for the two places that are making a brand
   statement, not stating a fact.

Recorded here explicitly so a future Hallmark run doesn't "fix" this back to
strict spec — both are considered, content-driven exceptions, not drift.

## Hero: H1 vs. statement de marca (emenda, 2026-08-19)

> **Superada** pela emenda de 2026-08-20 (tarde), mais abaixo. Mantida aqui
> pelo registro do raciocinio; o arranjo de hero descrito nesta secao nao e
> mais o que esta no ar.

O hero tinha UM elemento no topo: o statement lowercase com verb-landmark,
marcado como `<h1>`. Duas coisas quebravam com isso:

1. **SEO.** O H1 (`we check what the model actually finds.`) nao continha
   nenhuma das palavras-alvo do site — nem "benchmark", nem "code review",
   nem "AI". A pagina que mais deveria rankear pra "ai code review benchmark"
   nao usava a frase em lugar nenhum de destaque semantico.
2. **Clareza.** "finds" sem objeto: o leitor frio nao sabia *o que* e achado
   (bug) sem descer pro paragrafo.

Estrutura atual, deliberada:

- `<h1>` = **AI Code Review Benchmark**, tratado como o eyebrow mono/uppercase
  que o resto do site ja usa (`.eyebrow`). Carrega a frase-alvo, ocupa pouco
  espaco visual.
- Logo abaixo, em `<p>`, o headline visual dominante: **which AI reviewer
  actually catches bugs?** — mantem font-display, lowercase e o verb-landmark
  (agora em "catches"). Nomeia o objeto (bugs) e fala com a intencao de quem
  esta buscando qual ferramenta usar.

O H1 pequeno e proposital: hierarquia visual continua sendo do statement, e o
Google le o DOM, nao o font-size. O statement de fechamento do rodape
("if your harness can review a diff, it can be measured.") NAO muda — e outro
momento, fala com quem vai submeter, nao com quem esta escolhendo.

## Hero: o scorecard como recibo (emenda, 2026-08-20)

> **Parcialmente emendada** pela secao de 2026-08-20 (tarde), mais abaixo: a
> pilha de recibos continua sendo o apparatus do hero, mas o headline citado
> no fim desta secao e os numeros de calibragem da pilha foram substituidos.

Decisao de posicionamento tomada com o usuario: **o ativo do site e a
auditabilidade, nao o numero**. O objetivo e ser o benchmark confiavel da
categoria — a fonte que alguem cita — nao provocar com o teto de 44%.

Isso descartou tres tentativas anteriores de visual de hero, todas focadas em
comunicar um RESULTADO:

1. Grafo de topologia (judge + 5 repos) — mostrava o insumo, ilegivel.
2. Escala de recall (0-100%, 9 modelos) — exigia o jargao do projeto.
3. Grade de 95 bugs (42 acesos) — clara, mas liderava com "a IA erra a
   maioria", que e tensao direta com o produto da Kodus e nao era a tese
   escolhida. Tambem enquadrava humano-vs-IA, comparacao que o bench nao faz.

**O que ficou (`ScorecardStack.tsx` + `Scorecard.tsx`):** tres scorecards reais
empilhados como recibos. Um so provava que UM numero pode ser conferido; tres
dizem que isso existe pra todo modelo medido. A pilha recua pra CIMA porque o
nome do modelo fica no topo de cada recibo — assim os tres nomes ficam
legiveis. No hover ela abre (`--stack-shift`), so com transform, easing
nomeado, e colapsa em `prefers-reduced-motion`.

Nota de calibragem: o `scale` com `transform-origin: bottom` come parte do
deslocamento (com peek 22 e scale .965 sobravam 11px reais entre cartas). O
padding-top reserva o alcance do estado HOVER, nao o de repouso — senao a
carta do fundo era cortada no meio da animacao.

Cada recibo mostra —
configuracao da rodada em cima (harness, judge, execution, PRs, bugs), numeros
medidos embaixo, caminho do arquivo versionado no pe. O rastro de auditoria E
o visual. Casa com a referencia-padrinho do proprio spec do Lumen: "Modal
homepage rate sheet — the receipt is the artwork".

Headline: "every number here can be **checked**." (verb landmark em "checked").

CTA secundario ("check the artifacts", aponta pro repo) fecha a promessa do
paragrafo — sem ele o "re-score it yourself" ficava solto.

Todos os campos derivam do leaderboard.json.

## Hero: H1 dominante, sem verb-landmark (emenda, 2026-08-20, tarde)

Substitui a emenda de 2026-08-19 ("H1 pequeno tratado como eyebrow"). Escrita
com as skills de PMM do repo `/growth` (`homepage-hero-pmm`), que puxam
`context/company/positioning.md` e o guia markepear "who to address on the dev
tool homepage".

O que mudou e por que:

- **`<h1>` = "AI code review benchmark", em display size.** O arranjo anterior
  (H1 mono/uppercase pequeno + statement grande logo abaixo em `<p>`) fazia o
  leitor processar duas frases concorrentes antes de saber onde estava. A
  frase-alvo de busca e tambem a descricao literal do que a pagina e: nao ha
  ganho em esconde-la num elemento secundario. Um elemento no topo, nao dois.
- **A escala virou eyebrow, nao headline.** `9 models · 30 real PRs ·
  95 confirmed bugs` — dado de maquina, mono/uppercase, no lugar onde o resto
  do site ja poe rotulos ordinais. Qualifica o H1 sem competir com ele.
- **Subhead fala com o champion, nao com o buyer.** Staff/platform engineer
  escolhendo o que usar: o que se mede, em cima do que, e como conferir.

### Desvio consciente: nao ha verb-landmark no H1

O spec do Lumen pede um verbo em cor de accent no headline. "AI code review
benchmark" e um sintagma nominal — nao tem verbo pra marcar, e inventar um
("benchmark" como verbo, "see", "compare") sacrificaria a frase-alvo exata,
que e o unico motivo do H1 existir nessa forma.

O verb-landmark **nao sumiu do site**: continua no statement de fechamento do
rodape ("if your harness can review a diff, it can be **measured**."). Um por
pagina, como o spec quer — so nao no topo.

Regra da voz Kodus (de `/growth`), que vale pra toda copy do site: **sem
travessao (em dash)**, sem lista-de-tres retorica, e a lista de palavras
proibidas do positioning. Os travessoes que restam em `page.tsx` estao todos
em comentario de codigo, nunca em texto renderizado.

### Recalibragem da pilha de recibos

O reveal entre cartas era 27px e o header do recibo tem 55px: o nome do modelo
cortava no meio do glifo, e a pilha lia como bug de render, nao como pilha.
Corrigido pelos dois knobs de uma vez —

- `--stack-peek: 34px → 60px`
- `scale` por nivel: `0.022 → 0.012`

O scale com `transform-origin: bottom` come `altura_da_carta x fator` do
deslocamento, entao peek e sempre maior que o reveal real:
`60 - (325 x 0.012) ≈ 56px`, que cobre o header de 55px inteiro. Se o header
mudar de altura, os dois valores tem que ser refeitos juntos. `--stack-shift-max`
caiu pra 10px pra manter a carta de tras longe da nav no hover.

## Macrostructure family

- **Marketing pages** (Home `/`): **Marquee Hero**, Lumen's canonical pairing
  — apparatus at hero-right, verb-landmark headline at hero-left, meter strip
  below. **Deviation:** kept one primary CTA in the fold (generic Marquee
  Hero says no CTA in fold) — this is a working tool, not a brand statement;
  a real product needs one clear way in. Below the fold: pipeline steps,
  metrics glossary, mini-leaderboard, explainer — restructured to avoid the
  3/4-column icon-tile grid tell (see § What pages MUST share).
- **App/data pages** (`/leaderboard`, `/model/[id]`): **Stat-Led** family —
  "the hero is a giant number, data is the narrative" already describes what
  these pages do (rank badges, stat cards, a ranked table). No apparatus, no
  hero marquee — the table and the Pareto chart carry the page.

## Theme tokens (Lumen · Night Foundry)

**Naming note:** implemented under the project's existing token names
(`--background`, `--foreground`, `--surface`, `--border`, `--muted`,
`--accent`, …) rather than a mechanical rename to Lumen's `--color-paper` /
`--color-ink` vocabulary — the existing names are already semantic and a
full-codebase rename adds regression risk with no reader-facing benefit. Map:

| Lumen role | Project token | Value |
|---|---|---|
| paper | `--background` | `oklch(13% 0.014 265)` — late-night violet-black canvas |
| paper-2 | `--surface` | `oklch(17% 0.015 265)` — elevated surface (cards) |
| paper-3 | `--surface-2` | `oklch(21% 0.016 265)` — hover / active surface |
| ink | `--foreground` | `oklch(96% 0.006 262)` — headlines, near-white |
| ink-2 | `--foreground-2` | `oklch(86% 0.008 262)` — body text |
| — | `--muted` | `oklch(66% 0.010 262)` — secondary text |
| — | `--muted-dim` | `oklch(48% 0.010 262)` — tertiary / disabled |
| rule | `--border` | `oklch(96% 0.006 262 / 0.09)` — hairline, default |
| rule-2 | `--border-bright` | `oklch(96% 0.006 262 / 0.15)` — hairline, emphasis |
| accent (brass) | `--accent` | `oklch(76% 0.17 50)` — primary accent |
| accent-2 (coral) | `--accent-2` | `oklch(68% 0.16 18)` — verb landmark only |
| glow | `--glow` | `oklch(80% 0.16 50 / 0.42)` — dense halo, apparatus only |
| paper-emit | `--paper-emit` | `oklch(76% 0.17 50 / 0.04)` — inner-emit canvas wash |
| rule-blueprint | `--rule-blueprint` | `oklch(96% 0.006 262 / 0.04)` — grid hairline |
| focus | `--focus` | `oklch(80% 0.17 50)` — focus ring (= accent, brighter) |
| — | `--success` | `oklch(72% 0.15 145)` — classification badge: real hit |
| — | `--danger` | `oklch(68% 0.18 25)` — classification badge: real miss |
| — | `--info` | `oklch(72% 0.14 240)` — neutral badge: info tag |

`--accent-dim` (accent at 12% alpha, for badge fills) is kept from the prior
system unchanged in role, recomputed from the new accent value.

## Typography

- Display: **Instrument Serif**, weight 400, style **normal** (roman — italic
  is retired). Verb-landmark technique: exactly one accent-2-coloured word per
  hero headline, underlined, never italic.
- Body: **Geist**, weights 400/500/600 (replaces DM Sans — DM Sans is on
  Hallmark's banned-default list; Geist is the Lumen-spec body face and this
  project already leans dev-tool).
- Mono: **JetBrains Mono**, weights 400/500 (unchanged — already correct).
- Scale anchor: `--text-display: clamp(2.75rem, 5vw + 1rem, 5.25rem)`.
  Hero headline is ~40 chars → sits in the 21–50 bracket, full `--text-display`.
- Tabular numerals everywhere a number appears: `font-variant-numeric: tabular-nums`.

## Spacing

4pt named scale (`--space-3xs` … `--space-4xl`, see `layout-and-space.md`).
Pages use named tokens only, never raw px.

## Motion

- Easings: `--ease-out: cubic-bezier(0.16,1,0.3,1)` / `--ease-in: cubic-bezier(0.7,0,0.84,0)` / `--ease-in-out: cubic-bezier(0.65,0,0.35,1)`.
- Durations: `--dur-micro: 120ms` / `--dur-short: 220ms` / `--dur-long: 420ms` / `--dur-pulse: 4s` (apparatus only).
- Reveal: one orchestrated page-load stagger, DOM-index driven, capped at ~500ms total. No per-scroll fade-up on every section.
- Apparatus pulses (3% intensity, 4s), never rotates.
- `prefers-reduced-motion: reduce` collapses everything to a 150ms opacity crossfade.

## Microinteractions stance

- Silent success — no toasts for the filter panel or sort changes (the table updating IS the confirmation).
- Hover delay 800ms / focus delay 0ms on any tooltip.
- Focus rings appear instantly, never transitioned in.

## CTA voice

- Primary: pill-rounded, `--color-accent` fill, `--color-paper` text, weight 600.
- Secondary: pill-rounded, `--color-rule-2` border, `--color-ink-2` text, transparent fill.
- Copy: direct, technical, lowercase (marketing slots only) — "view rankings", not "Get Started Now →".

## Nav — N5 Floating pill

Content-sized, detached, `color-mix` blur backdrop over `--color-paper`, sits
`--space-md` from the top. Real content: wordmark + Home/Leaderboard links +
Contribute pill CTA — well under the ~720px width ceiling.

## Footer — Ft5 Statement, extended

Ft5's closing-sentence anchor move, but with a condensed single link row
beneath instead of "minimal links only" — this site has real functional links
(GitHub, Discord, benchmark repo, contribute guide) that matter for an open
benchmark asking for community submissions. Documented deviation: Ft5 spec
says "minimal links"; this ships ~8 real links in one quiet row, not the
two-column AI-footer shape (gate 43) it replaces.

## What pages MUST share

- Wordmark treatment, nav (N5), footer (Ft5-extended).
- The accent hue (molten brass) and its ≤5% surface-fill discipline.
- Instrument Serif roman + Geist + JetBrains Mono, no exceptions.
- Hairline cards with inner-emission on hover (not drop-shadow, not glow).
- Mono UPPERCASE eyebrows, capped at one per page, only where genuinely ordinal.

## What pages MAY differ on

- Marketing pages carry the apparatus + meter strip + blueprint grid; app
  pages don't (Lumen's own rejection list: no apparatus outside the hero).
- App pages may use denser type scale / tighter spacing than marketing pages
  — a benchmark table's job is density, not air.

## Per-page allowances

- Home: one apparatus (codebase-topology: 5 repo nodes → judge node, real
  per-repo golden/case counts as leader-line labels), one meter strip, hero
  blueprint grid.
- Leaderboard / Model detail: **no enrichment.** The table and the chart are
  the content; typography + hairline cards only.

## Removed as part of this pass

Confirmed-orphaned files (already unreferenced before this run, or made
orphaned by it): `src/components/code/CodeViewer.tsx` (dead since the trace
explorer was removed), `src/components/hero/CodeScanAnimation.tsx` (replaced
by the hand-built apparatus).
