# Design — CodeReviewBench

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
