# Design — CodeReviewBench

Tema **Instrument** (2026-11-19). Escolhido pelo Gabriel entre tres direcoes
montadas a partir de pesquisa no Refero (quadro com mockups, direcao "B ·
Instrumento no escuro"). Substitui o Portal (serifa + gradiente dusk) e a
tentativa clara "Ruled" do mesmo dia. Historico no git.

Este e um site de DADO. A tabela e o produto: na home ela e o instrumento
central do hero, saindo do escuro.

## Pesquisa

Refero, 2026-11-19: 13 buscas de estilo e tela; lidos por completo Linear,
Warp, Bun e Next.js; ~20 previas; telas de Parallel (benchmark em markdown),
n8n (relatorio com abas), Glassnode (catalogo em tabela), W&B (barras por
modelo) e o Code Review Bench do Martian (referencia do Gabriel).

## Reference lock

- **Principal, Linear:** canvas `#08090a`, painel `#0f1011` com borda
  translucida e canto de 12px, titulo Inter 510 com -0.022em (nunca 700),
  texto em ardosia `#8a8f98`, acao em pill clara `#e5e5e6` (nunca colorida),
  marcacao mono pequena so como legenda de figura, painel do produto que some
  numa vinheta, fechamento centralizado maior que o titulo do topo.
- **Emprestado do Axiom:** um sinal so, laranja. Aqui e o laranja da Kodus
  (`#f0902a`, tirado do logo): 1o colocado, vencedor de metrica, estado ativo,
  link no hover. Barra comum de dado e neutra.
- **Do Martian:** ranking no topo e abas Benchmark / Live.
- **Rejeitado:** eyebrow em caixa alta acima de titulo e faixa de stats no
  hero (vetados pelo Gabriel), neon roxo, card colorido por secao, numero
  gigante decorativo, laranja em toda barra.

## Tokens

Fonte de verdade: `src/app/globals.css` (`:root`). Os nomes antigos do TSX
(`--foreground`, `--surface`, `--accent`, `--muted`...) apontam pros tokens
novos.

| Papel | Valor |
|---|---|
| Canvas | `#08090a` |
| Painel | `#0f1011` |
| Vidro (trilho, hover, pill secundaria) | branco 5% |
| Borda | branco 8% (forte: 14%) |
| Regua estrutural | `#23252a` |
| Titulo / numero | `#f7f8f8` |
| Texto de destaque | `#d0d6e0` |
| Texto corrido | `#8a8f98` |
| Rotulo mono / coluna | `#7a7f87` (4.8:1) |
| Acao | `#e5e5e6` com texto `#08090a` |
| Sinal | `#f0902a` |

Semanticas no passo escuro: sucesso `#3fb950`, perigo `#f85149`, ambar
`#d29922`.

Cores de provider (`PROVIDER_COLORS`): passos "dark" da paleta de referencia
da skill dataviz, validados com `validate_palette.js` contra `#0f1011` (todas
as checagens passam nas 8 com hue). Zhipu e xAI ficam em cinza neutro e se
identificam pelo nome escrito ao lado.

## Tipo

- **Inter** variavel em tudo; titulo 510. Escala: display 60px, heading
  40px, monumento 72px (fechamento), body 15-16px, small 13px.
- **Geist Mono** so pra numero de tabela, unidade e legenda de figura
  ("Fig. 01 · balanced mode · ranked by F2"), 11-12px, peso normal.

## Paginas

- Home: titulo + apoio + duas pills, link "New · N models measured in
  production" a direita, tabela top 8 no painel com abas e vinheta, legenda
  da figura. Depois: metodo em 4 colunas separadas por regua vertical, par
  titulo/apoio nas secoes, definicoes em grade com regua, resultados e
  limites, fonte e quem publica. Fechamento centralizado com uma frase por
  linha.
- Paginas de dado (leaderboard, live, compare, model, trace) herdam os
  tokens e mantem a densidade.
