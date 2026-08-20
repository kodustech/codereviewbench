# Experimentos de ablação (fora da pipeline, de propósito)

Artefatos das intervenções testadas na investigação de harness-vs-modelo
(2026-08-13 a 2026-08-17). Cada um é uma rodada com uma flag `RECALL_*`
ligada, em subconjunto de casos, para medir o efeito da flag isolada.

**Não são resultados publicados.** Os runs canônicos do leaderboard estão um
nível acima, em `submissions/*.json`.

## Por que ficam num subdiretório

`readJsonDir()` em `process-scorecards.js` **não é recursivo** — varre só o
primeiro nível de `submissions/`. Manter os experimentos aqui é o que impede
que entrem no índice de findings.

Isso não é cosmético. Quando estes arquivos estavam soltos em `submissions/`,
`gemini37-nostrict15.submission.json` apagava 15 dos 30 findings do run
publicado `gemini37-light30.submission.json`: a chave do índice era
`(entryKey, caseId)`, e como harness e modelo são os mesmos, o experimento
colidia com o canônico em todo caso comum. Hoje a chave inclui `runAt`, então
a colisão não voltaria — mas a separação física continua sendo a defesa que
não depende de ninguém lembrar disso.

## O que cada arquivo é

A rodada **não grava qual flag estava ligada**. `run.reasoning` sai como
`{config: 'vendor-default', effortRequested: null}` mesmo em
`gemini37-high10`, que rodou com `RECALL_REASONING_EFFORT=high`. O nome do
arquivo é o único registro do que foi variado — o mapa abaixo é lido do nome,
não do conteúdo, e é por isso que renomear qualquer um destes arquivos perde
a informação de vez.

| Arquivo | Modelo | Casos | Flag | Estudo |
| --- | --- | --- | --- | --- |
| `gemini37-light30.partial` | gemini-3.7-flash | 30 | nenhuma (baseline) | §2 |
| `gemini37-high10` | gemini-3.7-flash | 10 | `RECALL_REASONING_EFFORT=high` | §4.1 |
| `gemini37-high-reportall10` | gemini-3.7-flash | 10 | `RECALL_REASONING_EFFORT=high` + `RECALL_REPORT_ALL=1` | §4.1 / §4.6 |
| `gemini37-coverage15` | gemini-3.7-flash | 15 | `RECALL_COVERAGE=1` | §4.2 |
| `gemini37-nostrict15` | gemini-3.7-flash | 15 | `RECALL_NO_STRICT=1` | §4.4 |
| `dsv4pro-target-partial3` | deepseek-v4-pro | 3 | `RECALL_TARGET_COUNT="7 to 10"` | §4.5 |
| `terra-nobar` | gpt-5.6-terra | 15 | `RECALL_NO_EVIDENCE_BAR=1` | §4.6 |
| `terra-both` | gpt-5.6-terra | 15 | `RECALL_NO_EVIDENCE_BAR=1` + `RECALL_TARGET_COUNT` | §4.6 |
| `qwen27b-light30.partial` | qwen3.8-27b | 30 | nenhuma (parcial do run canônico) | — |

`§` remete a `docs/estudo-harness-vs-modelo-2026-08-13-14.md`, que tem os
números e a leitura de cada intervenção. As flags e onde cada uma mora no
código estão no §9 do mesmo doc.

Os 4 braços do §4.6 (controle, meta, sem barra, sem barra + meta) não estão
todos aqui: o controle é o run canônico do Terra em `submissions/`, e o braço
só-meta não foi salvo como artefato separado.

`.partial.json` é o dump incremental que o runner grava enquanto roda;
`.submission.json` é o arquivo fechado no fim. Onde existem os dois, o
`.partial` só serve pra inspecionar caso a caso.

## Pendência que isto deixa explícita

O runner deveria carimbar as flags ativas dentro de `run` no artefato. Sem
isso, uma ablação só é auditável enquanto o nome do arquivo sobreviver, o que
é fraco demais para um repo cuja tese é que todo número pode ser conferido.
