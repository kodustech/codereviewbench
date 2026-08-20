# Investigação: por que o nosso harness vai mal com modelos "melhores"

**Datas:** 2026-08-13 e 2026-08-14
**Escopo:** por que Gemini 3.7 Flash e GPT-5.6 Terra pontuam baixo no finder-recall da Kodus, e se isso é do modelo ou do harness.
**Status:** aberto. Não conclusivo. Ver seção "O que ainda falta" no final.

---

## 1. Ponto de partida

Bench de 30 PRs reais (light set), 95 bugs golden, replay determinístico de ferramentas, judge `claude-haiku-4-5`. Uma rodada por modelo, defaults de fornecedor.

Leaderboard inicial (antes de qualquer correção nesta investigação):


| modelo            | recall | precisão (métrica antiga, com defeito) |
| ----------------- | ------: | --------------------------------------: |
| qwen3.8-max       | 43,2%  | 46,7%                                  |
| deepseek-v4-pro   | 43,2%  | 42,6%                                  |
| kimi-k2.7-code    | 37,9%  | 48,2%                                  |
| muse-spark-1.2    | 44,2%  | 37,6%                                  |
| gpt-5.6-luna      | 29,5%  | 44,4%                                  |
| kimi-k3           | 38,9%  | 37,1%                                  |
| deepseek-v4-flash | 34,7%  | 40,0%                                  |
| gpt-5.6-terra     | 22,1%  | 32,7%                                  |
| gemini-3.7-flash  | 11,6%  | 33,3%                                  |


Pergunta do usuário: **por que Gemini e GPT vão mal, se são modelos "melhores"?** Hipótese inicial dele: pode ser característica de como esses modelos foram treinados (RL agêntico de coding penaliza falso positivo, o que produziria calibração conservadora ruim para review).

---

## 2. Defeito crítico encontrado e corrigido: `precisionMacro`

### O bug

Em `evals/scorer/score.js`, a precisão de um caso sem nenhuma predição era gravada como `0`. Precisão de zero predições é **indefinida**, não zero — zero significa "errou tudo que disse"; o modelo não disse nada.

Isso penalizava sistematicamente quem se abstém. `mean()` já descartava `null`, mas o `0` explícito entrava na média e a afundava.

### Efeito medido (gemini-3.7-flash, 30 casos, 16 zerados de 30)


|          | macro (com defeito) | macro (corrigida) | micro     |
| -------- | -------------------: | -----------------: | ---------: |
| precisão | 33,3%               | **71,4%**         | **73,9%** |
| F1       | 16,7%               | **50,0%**         | —         |


O Gemini foi de "pior precisão do bench" para "melhor precisão do bench" só com o conserto — nenhum modelo rodou de novo.

### Correção aplicada (commit `4c8cb1f7a`, branch `bench/finder-recall-light-multimodel`)

- `precision`/`f1` por caso viram `null` quando não há predição.
- Adicionado `precisionMicro` e `f1Micro` ao agregado (TP/(TP+FP) somado no bench inteiro) — é a convenção que Martian e Alibaba publicam. Macro mantida ao lado por continuidade.
- CLI (`evals/scorer/cli.js`) ajustado para tolerar `null` (antes quebrava com `m.f1.toFixed(2)` sem checar).

### Ranking após rescore com scorer corrigido (F1 micro, 9 modelos)


| #   | modelo            | F1   | recall | precisão |
| --- | ----------------- | ----: | ------: | --------: |
| 1   | deepseek-v4-pro   | 43,9 | 44,2%  | 43,6%    |
| 2   | kimi-k2.7-code    | 43,1 | 37,9%  | 50,0%    |
| 3   | qwen3.8-max       | 42,4 | 41,1%  | 43,9%    |
| 4   | kimi-k3           | 39,8 | 41,1%  | 38,7%    |
| 5   | deepseek-v4-flash | 39,3 | 36,8%  | 42,1%    |
| 6   | muse-spark-1.2    | 37,8 | 41,1%  | 35,0%    |
| 7   | gpt-5.6-luna      | 39,0 | 29,5%  | 57,7%    |
| 8   | gpt-5.6-terra     | 30,3 | 22,1%  | 44,0%    |
| 9   | gemini-3.7-flash  | 20,0 | 11,6%  | 73,9%    |


**IMPORTANTE:** esta ordem trocou de liderança em relação à rodada anterior (antes Qwen liderava com F1 44,9; agora DeepSeek Pro lidera com 43,9) **sem rodar nenhum modelo de novo** — só repontuando a mesma submission. Ver seção 3 (ruído do judge) para o porquê.

### Excel de dados brutos por modelo (6 principais, F1 micro, com TP/FP/FN)


| #   | modelo            | F1   | prec  | recall | TP  | FP  | FN  |
| --- | ----------------- | ----: | -----: | ------: | ---: | ---: | ---: |
| 1   | Qwen3.8 Max       | 44,9 | 46,7% | 43,2%  | 50  | 57  | 54  |
| 2   | DeepSeek V4 Pro   | 42,9 | 42,6% | 43,2%  | 43  | 58  | 54  |
| 3   | Kimi K2.7 Code    | 42,4 | 48,2% | 37,9%  | 54  | 58  | 59  |
| 4   | Muse Spark 1.2    | 40,6 | 37,6% | 44,2%  | 44  | 73  | 53  |
| 5   | Kimi K3           | 38,0 | 37,1% | 38,9%  | 46  | 78  | 58  |
| 6   | DeepSeek V4 Flash | 37,2 | 40,0% | 34,7%  | 38  | 57  | 62  |


(Nota: esta tabela é de uma execução do judge; ver seção 3 sobre variância entre execuções — números não são idênticos aos do rescore acima porque vêm de rodadas de judge diferentes.)

---

## 3. Ruído do judge (medido, não estimado)

Re-pontuei os 9 modelos publicados com o **mesmo** scorer, **mesma** submission, **mesmo** judge (`claude-haiku-4-5`) — só rodando de novo.


| modelo            | recall (execução 1) | recall (execução 2) | delta (goldens em 95) |
| ----------------- | -------------------: | -------------------: | ---------------------: |
| deepseek-v4-pro   | 41                  | 42                  | +1                    |
| deepseek-v4-flash | 33                  | 35                  | +2                    |
| kimi-k2.7-code    | 36                  | 36                  | 0                     |
| kimi-k3           | 37                  | 39                  | +2                    |
| muse-spark-1.2    | 42                  | 39                  | −3                    |
| qwen3.8-max       | 41                  | 39                  | −2                    |
| gemini-3.7-flash  | 11                  | 11                  | 0                     |
| gpt-5.6-luna      | 28                  | 28                  | 0                     |
| gpt-5.6-terra     | 21                  | 22                  | +1                    |


**n=9, média delta = 0,11 goldens, desvio-padrão = 1,69, máximo |delta| = 3 goldens.**

**Ruído do judge: até 3,2pp de recall entre execuções idênticas, sem viés direcional.**

Padrão notado: os 3 modelos de baixo volume de findings (Gemini, Luna, Terra) variaram 0, 0, +1. Os modelos de alto volume variaram mais (Muse −3, Qwen −2, Kimi K3 +2, DeepSeek Flash +2). Hipótese não confirmada: quanto mais findings o modelo emite, mais pares golden×finding o judge avalia, mais chance de reversão de veredito — a incerteza da medição seria proporcional ao volume do modelo, não uniforme na tabela.

**Consequência prática: qualquer diferença medida abaixo de ~3,2pp de recall neste bench é indistinguível de ruído do judge.** Isso invalida (como "efeito medido") várias das intervenções testadas abaixo — ver cada uma.

**Não corrigido nesta sessão:** o judge não roda em temperatura zero (não é passada no caminho Anthropic do `judgeCall`). Rodar 3x e usar a média/desvio como barra de erro publicável é a correção óbvia e barata, ainda não feita.

---

## 4. Intervenções testadas (todas atrás de env flag, produção inalterada)

Metodologia geral: pareado nos mesmos 10 ou 15 casos (subconjunto do light-30), comparado contra controle nos mesmos casos.

### 4.1 Thinking/reasoning effort mais alto

**Flag:** `RECALL_REASONING_EFFORT=high` (já existente, propagada via `withReasoningEffort()` em `evals/investigation/agent-provider.js`, que injeta `providerOptions` via Proxy no `doGenerate`/`doStream`).

**Achado colateral relevante:** o motor self-hosted (`byok-to-vercel.ts`) **nunca setava `reasoningEffort`** — todo modelo sempre rodou no default do fornecedor. Isso não é neutro: medimos que os defaults de tokens de saída variam até 10x entre fornecedores.

**Gemini 3.7 Flash, 10 casos:**


| regime        | recall | findings/caso | tokens saída/caso |
| ------------- | ------: | -------------: | -----------------: |
| default       | 10,5%  | 1,1           | 5.926             |
| thinking high | 13,2%  | 1,5           | 11.040            |


+2,7pp. **Abaixo do ruído do judge (3,2pp) — não afirmável como efeito real.**

**Nota de contexto perdida:** eu tinha, antes desta investigação, comparado erroneamente o `OUT TOK` de um leaderboard público (CursorBench-like) que mostrava ~107k tokens de saída para modelos em `high`, contra os ~5-11k medidos aqui, e concluído que estávamos "rodando com o raciocínio desligado". **Isso estava errado** — aquele benchmark mede sessões agênticas de 125 steps; nosso harness faz ~9 steps por caso. Por step, os números são parecidos (~0,86k vs ~1,2k). Não é uma comparação válida. Retratado durante a sessão.

**Descoberta relacionada:** `gemini-3.7-flash` default de `thinking_level` é `medium`, não baixo — nunca rodou "sem pensar".

### 4.2 Mandato de cobertura obrigatória (prompt)

**Flag:** `RECALL_COVERAGE=1` em `libs/code-review/infrastructure/agents/prompts/review-prompt-blocks.ts`. Reintroduz literalmente a frase removida no commit `6a68d33f8` (22/06/2026, "soft coverage"):

> "You must readFile EVERY hunk of every changed file listed above before finalizing. A file with multiple hunks is only fully covered when each listed line range has been read... grep, findFile, and listDir help navigation, but they do not count as coverage."

**Gemini 3.7 Flash, 15 casos:**


| regime            | recall       | findings/caso | zerados |
| ----------------- | ------------: | -------------: | -------: |
| default           | 11,8% (6/51) | 1,1           | 7/15    |
| RECALL_COVERAGE=1 | 13,7% (7/51) | 1,3           | 6/15    |


+2,0pp. **Abaixo do ruído.**

### 4.3 Mecanismo de cobertura por CÓDIGO (não prompt) — investigação de arquitetura

Descoberta importante: o motor atual **JÁ TEM** um mecanismo de veto de conclusão — `CompletionGatePolicy` em `libs/agent-harness/infrastructure/policies/completion-gate.policy.ts`, extraído (segundo o próprio cabeçalho do arquivo) do antigo loop de 4600 linhas ("H-STOP experiment"):

```
shouldStop(view): boolean {
  ...
  if (s.criticalTotal > 0 && s.criticalPending > 0) return false; // veta finalizar
  return true;
}
```

**Mas ele está inerte no nosso bench.** `criticalTotal` só é &gt; 0 quando `fileTiers` é populado, e `fileTiers` só é construído em produção (`base-code-review-agent.provider.ts`) quando o PR é **grande**:

```
shouldFireFilter = changedFiles.length > 1 &&
  (adaptiveProfile.lowSignalFilterUnconditional ||
   (estimatedPromptTokens > promptBudget && reviewMode !== 'deep'))
```

Medido: nossos 30 casos têm diff mediano de ~13.100 caracteres (~3.200 tokens), máximo ~37.500 chars (~9.400 tokens). O orçamento (`PROMPT_BUDGET_RATIO = 0.55` da janela do modelo) fica entre 70k e 550k tokens dependendo do modelo. **Nunca é excedido.** Portanto `fileTiers` fica `undefined` tanto no bench quanto em produção para PRs deste tamanho — **não é bug do eval, é fidelidade a produção**. A trava simplesmente nunca é armada nesse regime de tamanho de PR.

**Conclusão desta sub-investigação:** não testamos (por falta de tempo/prioridade) forçar `fileTiers` artificialmente para ver se armar a trava muda recall em PR pequeno. Ficou como pendência.

Também portei o `coverage-ledger.ts` original de junho (commit `20ebbf686`, antes da migração para agent-harness) para comparar — **descartado**: código morto, o mecanismo equivalente já existe como `CompletionGatePolicy`, mais forte que o de junho (veta em vez de rodar passe de recuperação depois).

### 4.4 Strict tool use (Gemini)

**Descoberta:** `model-strictness.ts` liga *strict tool use* (amostragem restrita à gramática do schema) **somente para Gemini**:

```ts
export function supportsStrictTools(modelId) {
    return /^gemini[-_]/i.test(modelId);
}
```

Comentário no próprio arquivo: *"Anthropic (Claude) is intentionally NOT enabled: measured on the finder-recall eval, native strict tool use CRATERS recall — the grammar-constrained sampling roughly halves the findings the model produces (recall 0.357 -&gt; 0.100 on a 15-PR A/B, tp 15 -&gt; 4)."*

Ou seja: essa mesma configuração, medida no Claude, **derrubou pela metade** o recall. O Gemini é o único modelo do bench 30 rodando com essa configuração ligada, e nenhum outro modelo do bench rodou com ela.

**Flag adicionada:** `RECALL_NO_STRICT=1`.

**Gemini 3.7 Flash, 15 casos:**


| regime             | recall       | precisão | findings | TP  | FP  | zerados |
| ------------------ | ------------: | --------: | --------: | ---: | ---: | -------: |
| com strict (atual) | 11,8% (6/51) | 64,3%    | 14       | 9   | 5   | 7/15    |
| sem strict         | 15,7% (8/51) | 61,1%    | 18       | 11  | 7   | 8/15    |


+3,9pp. **No limite do ruído do judge (3,2pp) — não afirmável com confiança.**

Zerados não melhoraram (7→8) — ou seja, strict não era a causa dos casos completamente mudos.

### 4.5 Meta numérica de comentários ("target 7-10")

**Fonte primária (não é hipótese nossa):** engenheiro da Greptile, post 21/07/2026 — [https://github.blog](https://github.blog) (citado no `adr-commercial-review-methodology.md` da pesquisa). Trecho literal:

> "I tried adding an extra instruction explicitly telling the model to target around 7 to 10 comments per review. Suddenly, it recovered. Not an elegant solution, but it confirmed my suspicion: GPT was leaving bugs behind."
>
> "Looking at the reasoning traces made it even clearer. The model would often identify the bugs I expected it to post, explicitly mentioning them as potential issues in its reasoning summaries. Yet it wouldn't post them."
>
> "models weight their system instructions heavily, and post-training techniques like Deliberate Alignment encourage them to reason about user intent before acting... this meant that getting GPT to simply report all the bugs it found was surprisingly difficult. The model was not disobedient — it was doing exactly what it was trained to do."

Corroborado por outros 3 fornecedores com formulações próprias: Cursor ("we shifted to aggressive prompts... err on the side of flagging"), Macroscope ("Prefer reporting MORE issues over fewer. False positives are acceptable; do not self-censor."), Baz ("we over-generate candidate bugs... and filter them").

**Flag adicionada:** `RECALL_TARGET_COUNT="7 to 10"` em `review-prompt-blocks.ts`:

```
Target around ${N} comments for this review. If you are below that number,
lower your reporting bar and revisit the changed code for issues you
considered but did not report.
```

**Gemini 3.7 Flash, 15 casos:**


| regime    | recall    | precisão | F1(micro) | findings | TP  | FP  |
| --------- | ---------: | --------: | ---------: | --------: | ---: | ---: |
| controle  | 11,8%     | 64,3%    | 19,9      | 9        | 14  | 5   |
| meta 7-10 | **17,6%** | 46,4%    | **25,6**  | 13       | 28  | 15  |


**+5,8pp de recall, F1 micro +5,7 pontos. Este é o único efeito medido claramente acima do ruído do judge.**

**GPT-5.6 Terra, 15 casos:**


| regime    | recall    | precisão | F1(micro) | findings | TP  | FP  |
| --------- | ---------: | --------: | ---------: | --------: | ---: | ---: |
| controle  | 25,5%     | 53,8%    | 34,6      | 14       | 16  | 12  |
| meta 7-10 | **29,4%** | 48,5%    | **36,6**  | 16       | 17  |     |


+3,9pp de recall, F1 +2,0. **No limite do ruído.**

**Braço de controle DeepSeek Pro (n=3, incompleto — rodada travou, ver seção 6):**


| regime                        | findings/caso |
| ----------------------------- | -------------: |
| controle (30 casos completos) | 3,4           |
| meta 7-10 (3 casos apenas)    | 4,7           |


**Isto é evidência CONTRA a hipótese de correção específica de auto-censura**: a meta numérica infla volume TAMBÉM no modelo que não sub-reporta. Sugere efeito geral de "fale mais" em vez de destravar especificamente bugs que o modelo via e calava. **Não confirmado — n=3, braço incompleto.**

**Nenhum dos dois modelos chegou perto do alvo de 7-10** (entregaram 1,9 e 2,2 findings/caso). A meta foi ignorada por um fator de ~4, mas moveu a régua marginalmente.

### 4.6 Remover a barra de evidência (sem substituir por nada)

Motivação: os testes anteriores de "permissão qualitativa" (`RECALL_REPORT_ALL=1`, que troca a frase por "report everything including uncertain ones") são exatamente a forma que a Greptile documenta como INEFICAZ (gera "debate interno" no modelo sobre intenção do usuário vs desenvolvedor). Nunca tínhamos testado remover a frase supressora **sem** pôr nada no lugar.

**Flag adicionada:** `RECALL_NO_EVIDENCE_BAR=1` em `bug-agent.provider.ts` — remove `'Only report issues backed by concrete evidence from the code.'` sem substituto.

**GPT-5.6 Terra, 15 casos, os 4 braços:**


| braço            | recall | precisão | F1   | find/caso | TP  | FP  |
| ---------------- | ------: | --------: | ----: | ---------: | ---: | ---: |
| controle         | 25,5%  | 53,8%    | 34,6 | 1,7       | 14  | 12  |
| meta 7-10        | 29,4%  | 48,5%    | 36,6 | 2,2       | 16  | 17  |
| sem barra        | 27,5%  | 53,6%    | 36,3 | 1,9       | 15  | 13  |
| sem barra + meta | 27,5%  | 48,4%    | 35,0 | 2,1       | 15  | 16  |


**Todas as diferenças estão dentro do ruído do judge (3,2pp).** Achado contra-intuitivo: "sem barra + meta" (as duas intervenções juntas) deu o PIOR F1 dos três tratamentos, não o melhor como eu esperava — as duas não somam, a segunda parece desfazer parte do ganho da primeira.

Padrão qualitativo: "sem barra" preserva precisão (53,6% vs 53,8% controle) e ganha recall marginal. "Meta" destrói precisão (48,5%) por um pouco mais de recall. Mecanismos aparentemente diferentes.

**Conclusão desta seção: nenhuma variação de prompt testada no Terra produziu efeito acima do ruído.** O prompt não parece ser o gargalo dele.

---

## 5. Comparação cross-harness: alibaba/open-code-review (achado mais forte da investigação)

### Por quê

Ideia: separar "é o modelo" de "é o nosso harness" rodando o MESMO modelo, nos MESMOS PRs (via SHAs reais do git), em um harness de terceiro **open source**, e pontuando o resultado com o NOSSO scorer contra os NOSSOS goldens (mesmo judge). Isso isola a variável harness de verdade — nenhuma das intervenções de prompt acima conseguia fazer isso.

### Ferramenta usada

`github.com/alibaba/open-code-review` — CLI Go, MIT, 20,4k estrelas, criado por engenharia interna da Alibaba ("served tens of thousands of developers... over the past two years"). Compilado localmente (`go build`).

**Arquitetura descoberta no código-fonte deles** (`internal/config/template/scan_template.json`, o system prompt real):

- **Um agente por ARQUIVO alterado**, não por PR inteiro. Cada arquivo = uma sessão de LLM própria.
- O modelo recebe o **arquivo completo** (`<current_file_content>`), não o diff. "Unlike diff-based review, in this task you are reviewing an ENTIRE existing source file (no diff context)."
- **Orçamento de tool call explícito no prompt**, visível para o modelo: "your tool-call budget per file is limited... Limit context-gathering to AT MOST 2-3 tool calls per finding."
- **Proibição textual de achado cross-file**: "findings outside the current file MUST NOT become the subject of your comments." Tools de contexto existem (pode ler outro arquivo para entender), mas o achado tem que ser sobre o arquivo atual.
- Passe de dedup separado (outro LLM call) para mesclar comentários quase-duplicados do mesmo batch.
- Observabilidade de erro por item: `manifest.coverage.failed[].reason`, classificado (`provider or subtask request failed`, etc.) — mais granular que o nosso `finishReason`.

### Setup técnico

- Repo Keycloak clonado (`--filter=blob:none`), checkout nos SHAs reais gravados nos datasets (`benchmarkBaseRef`/`benchmarkHeadRef`, campos que já existiam nos datasets — não foi preciso reconstruir nada).
- 6 casos do light-set são de `keycloak/keycloak` — todos usados.
- Configuração via env: `OCR_LLM_URL`, `OCR_LLM_TOKEN`, `OCR_LLM_MODEL`, `OCR_LLM_PROTOCOL=openai`. Protocolos suportados: `anthropic`, `openai` (chat completions), `openai-responses`. **Sem protocolo nativo Gemini.**
- Comando: `ocr review --from <base-sha> --to <head-sha> --format json`.

### Resultado — DeepSeek V4 Pro (funcionou limpo, 6/6 casos)

Convertido para o nosso formato de submission (script `ocr-to-submission.js`, mapeia `comments[].{path,content}` → `findings[].{path,description}`) e pontuado com `evals/scorer/cli.js` contra os mesmos goldens, mesmo judge.


| harness                                  | recall (17 goldens, 6 casos de Keycloak) | precisão  |
| ---------------------------------------- | ----------------------------------------: | ---------: |
| **Nosso** (replay)                       | 11,8% (2/17)                             | 21,1%     |
| **Alibaba OCR** (live, arquivo completo) | **23,5% (4/17)**                         | **25,0%** |


**O mesmo modelo, nos mesmos 6 PRs, dobrou o recall no harness alternativo.**

Por caso (Alibaba OCR / DeepSeek):


| caso                                    | recall | precisão | F1   |
| --------------------------------------- | ------: | --------: | ----: |
| fixing-re-authentication-with-passkeys  | 0/2    | n/a      | n/a  |
| fix-concurrent-group-access             | 1/2    | 100,0%   | 0,67 |
| add-caching-support                     | 1/2    | 50,0%    | 0,50 |
| add-client-resource-type-and-scopes     | 0/3    | 0,0%     | n/a  |
| add-html-sanitizer                      | 1/4    | 25,0%    | 0,25 |
| implement-access-token-context-encoding | 1/4    | 16,7%    | 0,20 |


### Resultado — Gemini 3.7 Flash (BLOQUEADO — 2 bugs técnicos distintos, não conclusivo)

**Bug 1 — HTTP/2 vs chave `AQ.` do Google (o mesmo bug do dia inteiro, agora no cliente Go padrão):**
O binário Go (`net/http` padrão) negocia HTTP/2 por padrão contra host TLS. A chave nova do AI Studio (`AQ.` prefix, "auth key") retorna `401 ACCESS_TOKEN_TYPE_UNSUPPORTED` sobre HTTP/2. Só funciona em HTTP/1.1. Contornado com `GODEBUG=http2client=0`.

**Bug 2 — parser do OCR rejeita a resposta do Gemini mesmo com HTTP/1.1 funcionando:**
Com o workaround de HTTP/1.1, a chamada CHEGA na API (tokens sendo consumidos: 18k-35k por caso em 4 dos 6 casos) mas falha depois com `"reason": "provider or subtask request failed"` — mensagem genérica, sem detalhe de qual campo da resposta não bateu o parsing esperado. Hipótese não confirmada: diferença no formato de `tool_calls` entre o endpoint `v1beta/openai/chat/completions` do Gemini e o que o parser Go do OCR espera (provavelmente calibrado para o formato real da OpenAI).

**Resultado final: 6 de 6 casos falharam** (`status: "failed"`). 2 com 0 tokens (bateram no bug 1, mesmo com o env var — inconsistente, não investigado a fundo), 4 com tokens reais consumidos mas parsing falhou (bug 2).

**Não foi possível medir Gemini em nenhum harness alternativo hoje.** Isso é, em si, um dado: a dificuldade de integração do formato de tool-calling do Gemini pode ser parte da explicação do problema mais amplo — não é só sobre calibração de prompt, é sobre o quão bem os harnesses (o nosso e os de terceiros) lidam com a forma como cada fornecedor estrutura tool calls.

### Ressalvas sobre este experimento (importantes, para não superinterpretar)

1. **n pequeno.** 6 casos, 17 goldens. 1 golden = 5,9pp de recall nesta escala — a diferença de 11,7pp (11,8%→23,5%) é grande o bastante para provavelmente ser real, mas a amostra é frágil.
2. `**executionMode` diferente.** O OCR roda em modo `live` — lê o repositório real do disco, arquivo completo. O nosso roda em `replay` — usa o corpus determinístico gravado no dataset. Mais contexto disponível pode ser parte da vantagem do OCR, não só a arquitetura (fan-out por arquivo).
3. **Só testado em Keycloak (Java), só com um modelo (DeepSeek Pro) de forma completa.** Não sabemos se o padrão se repete em outros repositórios (cal.com/TS, Sentry/Python, Grafana/Go, Discourse/Ruby) nem em outros modelos.
4. **Efeito de goldens classificados `untestable` na rodada OCR não foi possível interpretar corretamente.** Todos os 13 goldens perdidos nesta rodada vieram classificados `untestable` pelo nosso scorer (0 `realMiss`). Isso PARECE confirmar a limitação de contexto cross-file do OCR, mas na verdade é mais provável que seja um artefato de medição: o classificador de fairness (`codeInCorpus`) compara contra o nosso corpus de replay gravado, que não é o mesmo código que o OCR (rodando em `live`) efetivamente leu. **Não é evidência confiável de nada — nem a favor nem contra a hipótese de limitação cross-file.** Retratado durante a sessão depois de eu ter inicialmente interpretado errado.
5. **A restrição de cross-file do OCR é fato documentado** (está literalmente escrita no prompt deles), mas quanto isso explica da diferença de recall medida é DESCONHECIDO — não quantificamos quantos dos 95 goldens do nosso dataset completo são genuinamente cross-file (exigem ler 2+ arquivos para perceber o bug). Essa contagem ficou como pendência, não foi feita.

---

## 6. Erros operacionais cometidos nesta sessão (registrados para não repetir)

1. **Comparei F1 de duas execuções de judge diferentes e reportei "não mudou" quando na verdade tinha mudado.** Corrigido ao recalcular com os scorecards corretos lado a lado.
2. **Interpretei checkpoint parcial no meio da escrita como dado válido** ("gemini: 1 (partial)") — era race condition de leitura de arquivo sendo escrito. O dado real era `0 (failed)`.
3. **Lancei dois processos fazendo `git checkout` no MESMO clone de repositório ao mesmo tempo** (um rodando DeepSeek, outro tentando rodar Gemini) — risco real de corromper qual SHA estava checked-out para qual caso. Detectado e corrigido criando um segundo clone isolado antes que causasse dano confirmado.
4. **Matei meu próprio processo de Monitor com `pkill -f` porque o padrão de busca casou com o texto do próprio script do monitor** (continha a string que eu estava tentando matar). Rearmado.
5. **Concluí com n=3, n=4 e n=8 casos várias vezes ao longo do dia**, e a leitura mudou (às vezes invertendo) ao chegar em n=15 ou n=30. Padrão recorrente, mencionado explicitamente pelo usuário como frustração ("porra n é possível", "vc ta rodando com poucos casos de novo").
6. `**RECALL_TARGET_COUNT` no braço de controle DeepSeek Pro travou** (rodou 3 de 15 casos em &gt;20min sem tool call, mesmo com API respondendo em 2s em teste isolado) — motivo não diagnosticado, matei o processo e segui com n=3 parcial, sinalizando explicitamente que é dado incompleto.

## 6.1 Defeitos de harness/runner corrigidos nesta sessão (não relacionados a modelos)

- `run-recall.js`: falha de infra capturada no pool de workers não era impressa no log (só existia em `rows[].reason` no artefato JSON) — corrigido para logar. Isso escondeu, numa sessão anterior, a causa real de uma falha (token OAuth do judge vencido no meio de um run longo).
- `run-recall.js`: checkpoint parcial usava nome derivado do MODELO, não do `--output` — duas rodadas paralelas do mesmo modelo (ex.: dois braços de A/B) sobrescreviam o checkpoint uma da outra. Corrigido para derivar do `--output`.
- `finder.agent.ts`: instrumentado (`state.__findingsOutcome`) para registrar qual dos 3 caminhos de extração de findings ocorreu — `structured`, `artifact-unusable` (ex.: `submitResult({})` vazio do Gemini, ou achados escritos em prosa por Anthropic sem campo estruturado), ou `no-artifact`. Antes, "zero findings" era um número só, sem causa observável.

---

## 7. O que ficou estabelecido com confiança razoável

1. **O bug do `precisionMacro` era real e sistemático** — penalizava modelos conservadores. Corrigido e commitado.
2. **O ruído do judge é ~3,2pp de recall entre execuções idênticas**, sem viés direcional. Isso deveria ser a barra de erro publicada, e hoje não é.
3. **Nenhuma intervenção de PROMPT testada isoladamente produziu efeito claramente acima do ruído**, exceto a meta numérica no Gemini (+5,8pp, a mais forte medida).
4. **A meta numérica de comentários é a intervenção de prompt mais promissora**, mas (a) nenhum modelo chegou perto do alvo pedido, (b) o ganho é majoritariamente falso positivo (troca F1 quase neutro, ganha recall e perde precisão), (c) o braço de controle (DeepSeek, que não sub-reporta) também aumentou volume — sugerindo efeito geral de "fale mais", não correção específica de auto-censura, embora este ponto tenha n=3 e não seja confiável.
5. `**strict tool use` está ligado só para Gemini**, e a mesma configuração já foi medida cratereando recall no Claude. O efeito de desligar (+3,9pp) está no limite do ruído — sugestivo mas não conclusivo.
6. **A comparação cross-harness com o alibaba/open-code-review é a evidência mais direta e menos contaminada por confounds de prompt**: mesmo modelo, mesmos PRs reais, harness diferente, recall dobrou (11,8%→23,5%). É pequena (n=6) e tem uma diferença de execução não controlada (`live` vs `replay`), mas é o único experimento do dia que isola arquitetura de harness em vez de calibração de prompt.
7. **A arquitetura do OCR (um agente por arquivo, arquivo completo em vez de diff, orçamento de tool-call explícito no prompt, achado restrito ao arquivo atual) é estruturalmente diferente da nossa** (um agente por PR inteiro, diff, sem orçamento declarado ao modelo, sem restrição de escopo). Isso é fato de código, não inferência.
8. **O Gemini tem dificuldade de integração real com pelo menos dois harnesses diferentes** (o nosso — via `submitResult({})` vazio documentado no nosso código — e o do OCR — via falha de parser não diagnosticada). Isso sugere que parte do problema "Gemini vai mal" pode ser sobre engenharia de integração de tool-calling, não só sobre calibração de review.

## 8. O que ainda falta (pendências explícitas, nada foi fechado)

1. **Repontuar cada scorecard publicado 3x e usar média + desvio como barra de erro oficial.** Barato (só custa Haiku), resolve a fragilidade que atravessou o dia inteiro.
2. **Contar quantos dos 95 goldens do dataset completo são genuinamente cross-file** (exigem 2+ arquivos para perceber o bug). Decide se a restrição documentada do OCR consegue explicar a diferença de recall medida ou não. Não requer rodar modelo nenhum — é análise dos datasets existentes.
3. **Rodar o braço de controle DeepSeek com `RECALL_TARGET_COUNT` até completar os 15 casos** (hoje só tem 3, e travou). Decide se a meta numérica é correção de auto-censura ou efeito geral de prompt.
4. **Rodar o comparativo cross-harness (Alibaba OCR) em outros repositórios** do light-set (cal.com, Sentry, Grafana, Discourse) para ver se o dobro de recall se sustenta fora de Keycloak/Java.
5. **Diagnosticar o bug de parser do OCR com Gemini** (ou desistir formalmente e documentar como limitação conhecida) — sem isso, não dá para comparar Gemini em nenhum harness alternativo.
6. **Forçar `fileTiers` artificialmente no nosso harness** para PR pequeno e ver se armar a `CompletionGatePolicy` (que hoje fica inerte nesse regime) muda recall — teste de arquitetura que nunca foi feito, mais barato que portar o desenho do OCR inteiro.
7. **Decidir se a página pública usa uma coluna (regime default, declarado) ou duas colunas (default + "calibrado" com meta numérica)** — decisão de produto, não técnica, ainda em aberto com o usuário.

---

## 9. Arquivos e flags relevantes (para retomar rápido)

- **Commit com o conserto do scorer + todas as flags de experimento:** `4c8cb1f7a`, branch `bench/finder-recall-light-multimodel` (repo kodus-ai).
- **Flags de experimento** (todas OFF por padrão):
  - `RECALL_REASONING_EFFORT=<low|medium|high>` — já existia, propagada em `evals/investigation/agent-provider.js` (`withReasoningEffort()`).
  - `RECALL_COVERAGE=1` — `libs/code-review/infrastructure/agents/prompts/review-prompt-blocks.ts`.
  - `RECALL_NO_STRICT=1` — `libs/code-review/infrastructure/agents/core/model-strictness.ts`.
  - `RECALL_TARGET_COUNT="N to M"` — `libs/code-review/infrastructure/agents/prompts/review-prompt-blocks.ts`.
  - `RECALL_NO_EVIDENCE_BAR=1` — `libs/code-review/infrastructure/agents/providers/bug-agent.provider.ts`.
  - `RECALL_REPORT_ALL=1` — já existia (sessão anterior), mesma localização do NO_EVIDENCE_BAR; troca a barra por permissão qualitativa em vez de remover.
  - `RECALL_DUMP=<dir>` — `evals/investigation/run-recall.js`, grava saída crua do agente por caso.
- **Ferramenta cross-harness:** binário compilado em `/private/tmp/.../scratchpad/ocr-bin` a partir de `github.com/alibaba/open-code-review` (main branch, 2026-08-14). Conversor: `scratchpad/ocr-to-submission.js`.
- **Docs de pesquisa já existentes no repo** (contexto de fontes primárias usado nesta investigação): `docs/adr-conservative-calibration.md`, `docs/adr-harness-exploration.md`, `docs/adr-commercial-review-methodology.md`, `docs/adr-model-access-paths.md`.
- **Scorecards atuais** (pós-correção do scorer): `scorecards/*.json` no repo — refletem a métrica corrigida (`precisionMicro`/`f1Micro` presentes).

