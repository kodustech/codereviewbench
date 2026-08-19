# ADR — Como harnesses open source controlam exploração e reporte do modelo

**Status:** Levantamento de fontes primárias (código-fonte). Não é decisão final.
**Compilado em:** 2026-08-13
**Autor:** levantamento automatizado sobre repositórios clonados em 2026-08-13
**Escopo:** codereviewbench.com / harness de review da Kodus (`runAgentLoopViaCore`)

---

## 1. Contexto e pergunta

Medimos, em 30 PRs reais com 95 bugs golden, **um** loop de agente com replay determinístico de ferramentas (`grep` / `readFile` / `listDir` / `findFile`). Chamadas de ferramenta por caso vs. recall:

| Modelo | Tool calls/caso | Findings/caso | Recall | Precisão micro |
|---|---:|---:|---:|---:|
| deepseek-v4-pro | 52,7 | 3,4 | 43,2% | 42,6% |
| gpt-5.6-terra | **53,5** (o maior) | 1,7 | 22,1% | — |
| gpt-5.6-luna | 38,7 | 1,7 | 29,5% | 57,7% |
| gemini-3.7-flash | **15,4** (1/3 dos outros) | 0,8 | 11,6% | 73,9% |

Dois modos de falha distintos, no mesmo harness:

- **Parada precoce** (gemini-3.7-flash): explora 1/3 do que os outros exploram.
- **Filtro na saída** (gpt-5.6-terra): explora *mais* que todos e reporta *menos* que todos.

A pergunta: **os harnesses open source fazem alguma coisa a respeito disso — no código?**

> **Regra deste levantamento:** fonte primária é o código-fonte clonado, com caminho e linha. Onde a afirmação vier de README, doc ou issue, está rotulada. Onde algo não existir, está escrito **NÃO ENCONTRADO** junto com os termos buscados.

### 1.1 Resposta em uma linha

**Os harnesses de *code review* não fazem nada — confiam no modelo ou eliminam a exploração por arquitetura. Os harnesses de *coding agent* (SWE-agent, aider) fazem, e fazem bem: forçam continuação com texto reinjetado e corrigem comportamento por modelo com fragmentos de prompt. As duas melhores ideias deste documento vêm de fora do domínio de code review.**

---

## 2. O que foi lido, e o que sequer existe

### 2.1 Repositórios clonados e lidos (clone e leitura em 2026-08-13)

| Repo | HEAD | Data do commit | O que é |
|---|---|---|---|
| `qodo-ai/pr-agent` | `20bc0fe8` | **2026-08-10** | Reviewer OSS mais maduro. **Sem agente, sem tool calling.** |
| `Codesteward/codesteward` | `c7e769e1` | **2026-07-21** | Reviewer **agêntico** OSS (Apache-2.0), ferramentas reais. |
| `princeton-nlp/SWE-agent` | `3ea751c0` | **2026-07-16** | Coding agent. **Tem exploração forçada.** |
| `Aider-AI/aider` | `5dc9490b` | **2026-05-22** | Pair programming. **Tem ajuste de comportamento por modelo.** |
| `All-Hands-AI/OpenHands` | `4f465f3c` | **2026-08-12** | **Atenção:** neste HEAD o repo é o frontend ("Agent Canvas"), não o agente. Ver §2.4. |
| `withmartian/code-review-benchmark` | `fbc5425c` | **2026-08-07** | Benchmark/juiz, não harness de review. |
| `MatterAIOrg/matter-ai` | `b454b819` | **2025-06-29** | "Open-source AI Code Reviewer Agent". One-shot; prompt closed. |
| `reviewdog/reviewdog` | `8b7da604` | **2026-08-13** | **Sem LLM.** Orquestrador de linters. |
| `danger/danger-js` | `532ea4b1` | **2026-08-04** | **Sem LLM.** Runner de regras JS. |
| `sourcery-ai/sourcery` | `d807cef2` | **2026-07-22** | Casca de distribuição do pre-commit hook. Sem motor. |
| `kodustech/awesome-ai-code-review` | `0be57537` | **2026-06-28** | Lista, não código. |

### 2.2 Ferramentas comerciais: quais têm código público

Verificado em 2026-08-13 via GitHub API (`orgs/<org>/repos`, `search/repositories`, `search/code`):

| Ferramenta | Presença pública | Motor de review público? |
|---|---|---|
| **CodeRabbit** | `coderabbitai` (skills, dotfiles, plugins, `git-worktree-runner`) | **NÃO.** `search/code?q=org:coderabbitai+system_prompt+OR+systemPrompt` → `total_count: 0` |
| **Greptile** | `greptileai` (cli, skills, plugins, mirrors) | **NÃO** |
| **cubic** | org `cubic-dev-ai` → **404** | **NÃO** |
| **Cursor Bugbot** | nenhuma org | **NÃO** |
| **Sourcery** | `sourcery-ai/sourcery` existe (1855 ★), mas contém só `LICENSE`, `README.md`, `pyproject.toml` (`name = "sourcery-precommit"`), `renovate.json`, gif | **NÃO** |
| **Graphite (Diamond)** | `withgraphite` (actions, homebrew, forks de git) | **NÃO** |
| **Baz** | org não encontrada | **NÃO** |
| **CodeAnt** | `CodeAnt-AI` (cli, skills, forks de checkov/prowler) | **NÃO** |
| **Propel** | org não encontrada | **NÃO** |
| **Macroscope** | org não encontrada | **NÃO** |
| **Semgrep Assistant** | `semgrep/semgrep` (16k ★, OCaml) | **NÃO.** `search/code?q=repo:semgrep/semgrep+assistant+OR+openai+OR+anthropic` → `total_count: 0`. O motor OSS é estático; o Assistant é cloud. |
| **Danger / reviewdog** | públicos | Públicos, **mas sem LLM** (§2.3) |

**Conclusão:** dos "híbridos estática+LLM" citados na tarefa, **nenhum tem o lado LLM em código aberto**.

### 2.3 Abordagens híbridas — evidência de ausência de LLM

- **reviewdog:** `grep -rn "openai|anthropic|llm|gpt-|claude"` em `*.go` → 0 hits. Os "adaptadores" são parsers de saída de linter: `parser/checkstyle.go`, `parser/errorformat.go`, `parser/rdjson.go`, `parser/sarif.go`.
- **danger-js:** mesma busca em `*.ts`/`*.js` → 0 hits. `source/runner/` executa um `dangerfile.ts` do usuário.
- **sourcery:** o uso de LLM só aparece no **README** (fonte secundária), `README.md:27`:

> "We use both OpenAI and Anthropic LLMs to provide pieces of our code reviews. Because of this, we need to send them sections of your code (typically the diff of the PR)."

Nenhum prompt, adaptador ou chamada de API no clone.

### 2.4 Ressalva metodológica sobre OpenHands

O clone de `All-Hands-AI/OpenHands` em `4f465f3c` (2026-08-12) **não contém o agente Python**. São 8 arquivos `.py` no repo inteiro, todos de CI/mock. O próprio repo declara — `OpenHands/AGENTS.md:5`:

> "This repository is a near-direct port of the OpenHands frontend. Local backends talk straight to `software-agent-sdk` / `agent_server`; optional Cloud backends use the service layer under `src/api/cloud/`..."

Portanto `AgentController`, `StuckDetector`, `llm/llm.py`, `REASONING_EFFORT_SUPPORTED_MODELS` e `FUNCTION_CALLING_SUPPORTED_MODELS` **NÃO EXISTEM neste clone** — estão em `software-agent-sdk`, que **não foi lido**. Tudo que digo sobre OpenHands abaixo vale só para o que o frontend expõe. **Isso é uma lacuna real deste levantamento** (§9, item 12).

---

## 3. Pergunta 1 — EXPLORAÇÃO FORÇADA

> Algum deles obriga o agente a ler todos os arquivos alterados antes de concluir? Piso de tool calls, checagem de cobertura, re-prompt "você não olhou o arquivo X"?

**Resposta: nenhum harness de code review faz. Dois coding agents fazem — e o mecanismo do SWE-agent é transplantável quase literalmente.**

### 3.1 SWE-agent — o comando `submit` NÃO submete na primeira chamada

Este é o achado mais forte de todo o levantamento sobre parada precoce. O agente que decide terminar **é obrigado a passar por estágios de revisão**, cada um reinjetando uma mensagem com o diff acumulado, antes que a submissão real aconteça.

`SWE-agent/tools/review_on_submit_m/bin/submit:33-46`:

> ```python
>     submit_review_messages = registry.get("SUBMIT_REVIEW_MESSAGES", [])
>     n_stages = len(submit_review_messages)
>     current_stage = registry.get("SUBMIT_STAGE", 0)
>     if not args.force and current_stage != n_stages:
>         message = submit_review_messages[current_stage]
>         message = message.replace("{{diff}}", patch)
>         message = message.replace("{{problem_statement}}", registry.get("PROBLEM_STATEMENT", ""))
>         registry["SUBMIT_STAGE"] = current_stage + 1
>         print(message)
>         sys.exit(0)
>
>     print("<<SWE_AGENT_SUBMISSION>>")
>     print(patch)
>     print("<<SWE_AGENT_SUBMISSION>>")
> ```

A escapatória (`-f`) é **deliberadamente escondida do modelo** — `SWE-agent/tools/review_on_submit_m/config.yaml:1-6`:

> ```yaml
> tools:
>   submit:
>     signature: "submit"
>     docstring: "submits the current file"
>     # Do not actually show the -f argument to the model, only
>     # use it from the agent for submission after error
> ```

**O texto literal reinjetado**, ativo no config default — `SWE-agent/config/default.yaml:47-63`:

> ```yaml
>       SUBMIT_REVIEW_MESSAGES:
>         - |
>           Thank you for your work on this issue. Please carefully follow the steps below to help review your changes.
>
>           1. If you made any changes to your code after running the reproduction script, please run the reproduction script again.
>             If the reproduction script is failing, please revisit your changes and make sure they are correct.
>             If you have already removed your reproduction script, please ignore this step.
>           2. Remove your reproduction script (if you haven't done so already).
>           3. If you have modified any TEST files, please revert them to the state they had before you started fixing the issue.
>             You can do this with `git checkout -- /path/to/test/file.py`. Use below <diff> to find the files you need to revert.
>           4. Run the submit command again to confirm.
>
>           Here is a list of all of your changes:
>
>           <diff>
>           {{diff}}
>           </diff>
> ```

O mesmo bloco aparece em `config/default_backticks.yaml:47`, `config/default_mm_with_images.yaml:54`, `config/default_mm_no_images.yaml:53`, `config/demo/default.yaml:47`, `config/benchmarks/250225_anthropic_filemap_simple_review.yaml:48`, `config/benchmarks/250522_anthropic_filemap_simple_review.yaml:65`, `config/benchmarks/anthropic_filemap_multilingual.yaml:47` e, como âncora YAML `&submit_review_messages`, em `config/benchmarks/250212_sweagent_heavy_sbl.yaml:59` (reusada em `:93` e `:126`).

**Por que isso importa para nós:** é um **piso de exploração implementado no protocolo da ferramenta, não no prompt**. O modelo não pode "decidir" pular — a ferramenta simplesmente não faz o que ele pediu na primeira vez. É exatamente o tipo de mecanismo que o nosso harness não tem.

### 3.2 SWE-agent — retry loop: após submeter, abre uma nova tentativa do zero

Segundo nível de piso. Depois de `done`, o agente não termina: o `RetryLoop` decide se abre outra tentativa completa.

`SWE-agent/sweagent/agent/agents.py:413-429` — o laço que reinicia:

> ```python
>         while not step_output.done:
> ```
> (…) `self._rloop.on_submit(...)` e `if self._rloop.retry(): self._next_attempt()`

`ChooserRetryLoop.retry()` (linha **523**) e `ScoreRetryLoop.retry()` (linha **618**) **retornam `True` por default** (linhas 546 e 645). Ou seja: **a política padrão é tentar de novo**, e só para por custo / `max_attempts` / `max_accepts`.

`SWE-agent/sweagent/agent/reviewer.py:181-192`:

> ```python
> class ChooserRetryLoopConfig(BaseModel):
>     type: Literal["chooser"] = "chooser"
>     chooser: ChooserConfig
>
>     max_attempts: int
>     min_budget_for_new_attempt: float = 0.0
>     """Minimal $ that need to be left in order for us to start a new attempt.
>     If set to 0: Always.
>     """
>
>     cost_limit: float
> ```

Valores de benchmark — `SWE-agent/config/benchmarks/250212_sweagent_heavy_sbl.yaml:136-139`:

> ```yaml
>   retry_loop:
>     type: chooser
>     cost_limit: 6.0
>     max_attempts: 10
>     min_budget_for_new_attempt: 1.0
> ```

E o prompt do chooser **proíbe indecisão** — `250212_sweagent_heavy_sbl.yaml:152-155`:

> ```yaml
>         <IMPORTANT>The last line of your response should be the index of the patch you chose.
>         You must choose a single index no matter what. If you cannot decide between two or more
>         submissions, choose the first one of these.
>         </IMPORTANT>
> ```

### 3.3 aider — `reflected_message`: re-injeção automática, com 5 gatilhos

O laço principal — `aider/aider/coders/base_coder.py:933-944`:

> ```python
>             self.reflected_message = None
>             list(self.send_message(message))
>
>             if not self.reflected_message:
>                 break
>
>             if self.num_reflections >= self.max_reflections:
>                 self.io.tool_warning(f"Only {self.max_reflections} reflections allowed, stopping.")
>                 return
>
>             self.num_reflections += 1
>             message = self.reflected_message
> ```

Os gatilhos, com o texto literal reinjetado:

**(a) O modelo mencionou um arquivo que não estava no chat.** `aider/aider/prompts.py:31-33`:

> ```python
> added_files = (
>     "I added these files to the chat: {fnames}\nLet me know if there are others we should add."
> )
> ```

Detecção e injeção — `aider/aider/coders/base_coder.py:1561-1567`:

> ```python
>             add_rel_files_message = self.check_for_file_mentions(content)
>             if add_rel_files_message:
>                 if self.reflected_message:
>                     self.reflected_message += "\n\n" + add_rel_files_message
>                 else:
>                     self.reflected_message = add_rel_files_message
>                 return
> ```

**Este é o parente mais próximo do "você não olhou o arquivo X" que a tarefa procurava** — só que invertido: o aider detecta um arquivo que o modelo *citou sem ter*, adiciona ao contexto, e força um novo turno.

**(b) Erros de lint / (c) erros de teste** — `aider/aider/coders/base_coder.py:1599-1622`:

> ```python
>         if edited and self.auto_lint:
>             lint_errors = self.lint_edited(edited)
>             ...
>             if lint_errors:
>                 ok = self.io.confirm_ask("Attempt to fix lint errors?")
>                 if ok:
>                     self.reflected_message = lint_errors
>                     return
> ```

**(d) Formato de edição malformado** — a exceção vira o prompt. `aider/aider/coders/base_coder.py:2310-2315`:

> ```python
>             self.io.tool_error("The LLM did not conform to the edit format.")
>             ...
>             self.reflected_message = str(err)
> ```

**(e) `ContextCoder` — força re-avaliação do conjunto de arquivos.** `aider/aider/coders/context_prompts.py:70-75`:

> ```python
>     try_again = """I have updated the set of files added to the chat.
> Review them to decide if this is the correct set of files or if we need to add more or remove files.
>
> If this is the right set, just return the current list of files.
> Or return a smaller or larger set of files which need to be edited, with symbols that are highly relevant to the user's request.
> """
> ```

Com guarda de teto — `aider/aider/coders/context_coder.py:37-45`:

> ```python
>         if self.num_reflections >= self.max_reflections - 1:
>             return True
>
>         self.abs_fnames = set()
>         for fname in mentioned_rel_fnames:
>             self.add_rel_fname(fname)
>         ...
>         self.reflected_message = self.gpt_prompts.try_again
> ```

### 3.4 OpenHands — o único piso visível é o goal loop com juiz (opt-in)

`OpenHands/src/hooks/mutation/conversation-mutation-utils.ts:77-82`:

> ```ts
> /**
>  * Start a `/goal` loop on a V1 conversation. The agent server drives the agent
>  * toward the objective, judging completion after each run until it is done or
>  * `max_iterations` is reached, streaming progress as goal
>  * ConversationStateUpdateEvents over the conversation's event stream.
>  */
> ```

O estado do loop — `OpenHands/src/types/agent-server/core/events/conversation-state-event.ts:82-97`:

> ```ts
> export interface GoalStatus {
>   /** Whether the goal loop is still running. */
>   active: boolean;
>   status: "running" | "complete" | "capped" | "interrupted";
>   /** Audit rounds completed so far (0 at kickoff). */
>   iteration: number;
>   ...
>   /** Last judge verdict; null at kickoff and on an interrupted loop. */
>   verdict: GoalVerdict | null;
> }
> ```

**O juiz e o prompt do goal loop não estão neste repo.** Strings reinjetadas do tipo "Please continue" / "you have not" / "keep going": **NÃO ENCONTRADO** em `src/**/*.ts,tsx` — as ocorrências de "continue" são rótulos de botão de UI.

### 3.5 Harnesses de CODE REVIEW: piso e re-prompt de cobertura — NÃO ENCONTRADO

Busca em `pr-agent/pr_agent/`, `codesteward/packages/`, `matter-ai/src/`, `code-review-benchmark/` por: `min_tool`, `minTool`, `min_steps`, `minSteps`, `min_findings`, `at least N tool`, `require.*tool.*call`, e por `You did not`, `you have not`, `have not yet`, `Please continue`, `keep going`, `not finished`, `You must examine all`, `every changed file`, `all changed files` (`*.py|*.ts|*.toml|*.yaml|*.j2`).

**Único hit em todos os repositórios de review**, e é nudge de sequência de ferramenta, não cobertura — `codesteward/packages/agents/src/tools/graph-tools.ts:174`:

> ```ts
>                   "Empty graph results — if you have not rebuilt this unit yet, call graph_rebuild then retry graph_query.",
> ```

Mesmo arquivo, `:187`:

> ```ts
>             : "If the graph was never built, call graph_rebuild then retry; else continue without structural evidence.",
> ```

E `:94`, na direção oposta (freio, não piso):

> ```ts
>           ? "Do not retry graph tools for this unit; use read_file/sandbox and packed context."
> ```

### 3.6 O que os reviewers fazem: divulgar cobertura, não coagir

#### (a) pr-agent — rodapé de cobertura

`pr-agent/pr_agent/tools/pr_reviewer.py:289-299`:

> ```python
> if self.remaining_files_list and get_settings().pr_reviewer.enable_review_coverage_footer:
>     displayed_files = self.remaining_files_list[:MAX_REVIEW_COVERAGE_FILES]
>     markdown_text += (
>         "\n\n<hr>\n\n"
>         "⚠️ **Review coverage:** The following files were not included in this review "
>         "because of the token budget:\n"
>         + "\n".join(f"- `{file}`" for file in displayed_files)
>     )
>     remaining_count = len(self.remaining_files_list) - len(displayed_files)
>     if remaining_count:
>         markdown_text += f"\n... and {remaining_count} more"
> ```

`pr_reviewer.py:30` → `MAX_REVIEW_COVERAGE_FILES = 50`. Ligado por default — `configuration.toml:123` → `enable_review_coverage_footer=true`.

A lista vem da compressão de diff, não do comportamento do modelo — `pr-agent/pr_agent/algo/pr_processing.py:296-297`:

> ```python
>             get_logger().warning(f"File was fully skipped, no more tokens: {filename}.")
>             remaining_files_list_new.append(filename)
> ```

Ou seja: pr-agent sabe quais arquivos **o harness** não mostrou, e publica. Não há equivalente para "arquivos que o modelo viu e ignorou" — porque não há modelo explorando (§4.1).

#### (b) Codesteward — coverage-gap vira *finding*

`codesteward/packages/agents/src/specialist-timeout.ts:26-29` (comentário do código):

> ```ts
> /**
>  * Explicit coverage-gap finding so a timed-out specialist is never mistaken for
>  * "role looked and found nothing." Severity is elevated for security.
>  */
> ```

Corpo literal — `specialist-timeout.ts:47-57`:

> ```ts
>     title: `Coverage gap: “${input.role}” specialist timed out (incomplete review)`,
>     body: [
>       `**Do not treat this unit as fully reviewed by ${input.role}.**`,
>       `The ${input.role} specialist did **not** complete analysis within the product timeout ` +
>         `(~${budgetSec}s budget` +
>         (input.unitLabel ? `, unit \`${input.unitLabel}\`` : "") +
>         `). It ran ~${ranSec}s then was aborted.`,
>       "This is **not** an empty scan and **not** evidence that the code is free of " +
>         `${input.role} issues. No trustworthy findings from this role for this unit.`,
>       "Sibling specialists may still have produced findings on the same paths — that does not replace this role.",
>       ...
> ```

Análogo para unidade abandonada após self-heal — `codesteward/packages/agents/src/self-heal.ts:134-161` (`coverageGapFinding`, `title: "Review coverage gap"`, `tags: ["coverage-gap", "self-heal"]`).

#### (c) Codesteward — o modelo declara confiança no VAZIO

`codesteward/packages/agents/src/prompt-pack.ts:77-81`:

> ```ts
> const OUTPUT_FORMAT_BASE =
>   'Respond ONLY with JSON: {"findings":[...],"emptyScanConfidence":0.0-1.0}. ' +
>   'Each finding: {"title","body","path","startLine","endLine","category","severity","confidence","suggestion","ruleIds","existingCode","reasoning"}. ' +
>   "Per-finding confidence = your self-assessed certainty 0–1 (diagnostic only; the product computes its own evidence-based score). " +
>   REASONING_CONTRACT +
>   " When findings is empty, always set emptyScanConfidence 0–1 for how sure you are that nothing actionable was missed in the packed context.";
> ```

Parseado em `codesteward/packages/agents/src/extract.ts:223` e `:235`.

**Ressalva honesta:** `emptyScanConfidence` é **coletado e persistido, mas não dispara re-execução**. `grep -rn "emptyScanConfidence" packages/` só encontra `prompt-pack.ts` (prompt), `extract.ts` (parser) e testes. **Gatilho de retry a partir dele: NÃO ENCONTRADO.**

#### (d) Codesteward — "0 findings" é diagnosticado, não aceito

`codesteward/packages/agents/src/session-audit.ts:585-635`:

> ```ts
>     return {
>       reason: "context_missing",
>       message:
>         "0 findings: code context may be missing or bound to an unverified local mount — treat as incomplete review.",
> ```

> ```ts
>   // Timeouts before "all clean" — never claim a clean pass when a role did not finish
>   if (input.coverageGaps?.specialistTimeouts || timedRuns.length) {
>     ...
>     return {
>       reason: "specialist_timeouts",
>       message:
>         `0 product findings, but ${roles.join(", ")} specialist(s) **timed out** — ` +
>         "this is **not** a clean empty scan for those roles. Coverage is incomplete.",
> ```

> ```ts
>   if (input.judge && input.judge.inputCount > 0 && input.judge.outputCount === 0) {
>     ...
>     return {
>       reason: "all_candidates_dropped",
>       message:
>         "0 findings: specialists produced candidates but judge/noise filtered all of them.",
> ```

> ```ts
>   if (input.runs.length > 0 && okRuns.length === input.runs.length) {
>     return {
>       reason: "all_units_clean",
>       message: `0 findings after ${okRuns.length} successful specialist run(s) — no issues above the severity floor.`,
> ```

**Isso separa em código exatamente os nossos dois modos de falha:** `all_candidates_dropped` é o gpt-5.6-terra; `specialist_timeouts` / `context_missing` é a família do gemini-3.7-flash. Nós hoje vemos os dois como "recall baixo".

#### (e) Codesteward — regra de prompt "não afirme sem ter lido"

`codesteward/packages/agents/src/prompt-pack.ts:149-155` (bloco `DEEP_TOOLS_DEFAULT`, injetado no system prompt do runner com ferramentas):

> ```
> RULES:
> 1. SOURCE CODE FIRST — open Diff/context, then read the files you cite with read_file or sandbox_read.
> 2. If ls/glob return empty, retry with unit paths from the prompt or sandbox_read; do not invent APIs or line-level bugs.
> 3. Do not claim a finding without having read the relevant file content (or packed Diff) unless the claim is purely graph-topology.
> 4. For structural claims (callers, auth guards, imports): graph_status → rebuild if needed → graph_query; graph does not replace reading code.
> 5. Stay read-only on the review tree (no write_file / edit_file).
> ```

É **instrução, não verificação**. **Check em código de que o modelo chamou `read_file` no arquivo citado: NÃO ENCONTRADO** (busquei `filesRead`, `readPaths`, `assert.*read`; `pathsReviewed` existe em `specialists.ts:73` mas alimenta auditoria, não um gate).

#### (f) Codesteward — o "piso" que existe: exigir que o runner TENHA ferramentas

`codesteward/packages/agents/src/deep-agent-runner.ts:158-164`:

> ```ts
>   private requireToolAgents(): boolean {
>     return (
>       process.env.STEW_REQUIRE_TOOL_AGENTS === "1" ||
>       process.env.STEW_AUTH_STRICT === "1" ||
>       process.env.NODE_ENV === "production"
>     );
>   }
> ```

`deep-agent-runner.ts:192-196`:

> ```ts
>       if (this.requireToolAgents() && process.env.STEW_USE_DEEPAGENTS !== "0") {
>         throw new Error(
>           "Tool-using agents required; refusing silent SimpleAgentRunner fallback",
>         );
>       }
> ```

### 3.7 Os demais reviewers: nada

- **pr-agent:** não há exploração para forçar (§4.1).
- **matter-ai:** **NÃO ENCONTRADO** teto, piso ou cobertura (termos: `coverage`, `covered`, `missing`, `allFiles`, `every(`, `maxIterations`, `max_steps`). Pior: truncamento silencioso — `octokit.pulls.listFiles` com `per_page: 100` **sem paginação** (`matter-ai/src/integrations/github.ts:76-81`); PRs com >100 arquivos perdem arquivos sem aviso.
- **code-review-benchmark:** **NÃO ENCONTRADO**. Não é harness de review.

---

## 4. Pergunta 2 — ARQUITETURA: um loop vs. fan-out

> Se fan-out, isso elimina a parada precoce por construção — a exploração vira estrutura do harness, não decisão do modelo.

**Resposta: sim, e é o que os dois reviewers mais maduros fazem.**

### 4.1 pr-agent — ZERO tool calling. 1..N chamadas one-shot.

Toda chamada ao LLM passa por `litellm.acompletion`, e **não há `tools`, `tool_choice` ou `function_call` em lugar nenhum**.

`pr-agent/pr_agent/algo/ai_handlers/litellm_ai_handler.py:886` e `:892`:

> ```python
>             response = await acompletion(**kwargs)
> ```

`grep -rn "tools=|tool_choice|function_call|ToolCall" pr_agent/` (excluindo o namespace `pr_agent.tools`, que são os *comandos*) → **0 hits**. `grep` por `while True|agentic|max_iterations|max_steps|max_turns` → **0 hits em código de loop**.

`/review` faz **exatamente 1 chamada de LLM por PR** — `pr-agent/pr_agent/tools/pr_reviewer.py:246-251`:

> ```python
>         response, finish_reason = await self.ai_handler.chat_completion(
>             model=model,
>             temperature=get_settings().config.temperature,
>             system=system_prompt,
>             user=user_prompt
>         )
> ```

O que substitui a exploração é compressão determinística com expansão configurável — `pr-agent/pr_agent/settings/configuration.toml:44-45`:

> ```toml
> patch_extra_lines_before = 5 # Number of extra lines (+3 default ones) to include before each hunk in the patch
> patch_extra_lines_after = 1 # Number of extra lines (+3 default ones) to include after each hunk in the patch
> ```

**Em pr-agent, "quanto contexto o modelo vê" é uma constante de configuração.** É o extremo oposto do nosso desenho.

### 4.2 pr-agent `/improve` — fan-out por chunk, paralelo

`pr-agent/pr_agent/algo/pr_processing.py:378-383`:

> ```python
> def get_pr_multi_diffs(git_provider: GitProvider,
>                        token_handler: TokenHandler,
>                        model: str,
>                        max_calls: int = 5,
>                        add_line_numbers: bool = True) -> List[str]:
> ```

`pr_processing.py:422-423` — se cabe tudo, é 1 chamada:

> ```python
>     # if we are under the limit, return the full diff
>     if total_tokens + OUTPUT_BUFFER_TOKENS_SOFT_THRESHOLD < get_max_tokens(model):
>         return ["\n".join(patches_extended)] if patches_extended else []
> ```

`pr-agent/pr_agent/tools/pr_code_suggestions.py:723-729`:

> ```python
>             # parallelize calls to AI:
>             if get_settings().pr_code_suggestions.parallel_calls:
>                 prediction_list = await asyncio.gather(
>                     *[self._get_prediction(model, patches_diff, patches_diff_no_line_numbers) for
>                       patches_diff, patches_diff_no_line_numbers in
>                       zip(self.patches_diff_list, self.patches_diff_list_no_line_numbers)])
> ```

`configuration.toml:178-180`:

> ```toml
> num_code_suggestions_per_chunk=3
> max_number_of_calls = 3
> parallel_calls = true
> ```

**Quantificação (pr-agent):**
- `/review`: **1 chamada de LLM por PR**; teto de 3 findings (`configuration.toml:112`).
- `/improve`: **1–3 gerações + 1 self-reflection por geração** → **2–6 chamadas por PR**; ≤9 sugestões antes do filtro.

### 4.3 Codesteward — fan-out bidimensional: `unidades × papéis`

`codesteward/packages/agents/src/planner.ts:17-33`:

> ```ts
> export function planReviewUnits(input: PlanInput): ReviewUnit[] {
>   const batchSize = input.batchSize ?? (input.mode === "gate" ? 12 : 20);
>   const paths = input.paths.length ? input.paths : ["."];
>
>   if (input.mode === "gate") {
>     return chunk(paths, batchSize).map((group, i) => ({
>       id: unitId(),
>       sessionId: input.sessionId,
>       kind: "file_batch" as const,
>       label: `gate-batch-${i + 1}`,
>       paths: group,
>       symbols: [],
>       status: "pending" as const,
>       assignedRoles: rolesForTier(input.riskTier),
>       metadata: {},
>     }));
>   }
> ```

Segunda dimensão — `planner.ts:63-85`:

> ```ts
> export function rolesForTier(tier: RiskTier): string[] {
>   switch (tier) {
>     case "trivial":
>       return ["generalist"];
>     case "lite":
>       return ["generalist", "rules"];
>     case "security":
>       return ["correctness", "security", "rules", "testing"];
>     case "thorough":
>       return [
>         "correctness",
>         "security",
>         "performance",
>         "testing",
>         "rules",
>         "requirements",
>         "discourse",
>       ];
>     case "full":
>     default:
>       return ["correctness", "security", "rules", "testing"];
>   }
> }
> ```

Cada `(unidade, papel)` é uma chamada de LLM — `codesteward/packages/agents/src/specialists.ts:201-208`:

> ```ts
>     const model = ctx.modelRouter.createChatModel(role);
>     const res = await model.complete({
>       system,
>       messages: [{ role: "user", content: user }],
>       jsonMode: true,
>       temperature: 0.1,
>     });
> ```

Paralelismo dos papéis — `codesteward/packages/agents/src/orchestrator.ts:918-920`:

> ```ts
>               const batches = await Promise.all(
>                 specialistRoles.map((role) => activeRunner.runSpecialist(role, ctx)),
> ```

E a mensagem de estágio explicita o desenho — `orchestrator.ts:644`:

> ```ts
>       `Running ${units.length} units (roles parallel per unit; barrier before verify)`,
> ```

**Quantificação (Codesteward), PR de 30 arquivos, tier `full`, modo `gate`:**
- Unidades: `ceil(30 / 12)` = **3**
- Papéis: **4** (`correctness`, `security`, `rules`, `testing`)
- Specialists: `3 × 4` = **12** chamadas
- Verify: `ceil(candidatos / 10)` ≈ **2**
- Discourse (só `thorough`): +2 passes + 1 síntese
- **Total típico: 14–17 chamadas de LLM por PR**, contra a nossa 1 sessão.

Os specialists **não se veem** — fan-out cego por construção. `codesteward/packages/agents/src/verifier.ts:33`:

> ```
> Your job is NOT to re-discover every bug. Specialists already proposed findings in parallel (security, correctness, testing, rules, …). They do not see each other's work.
> ```

### 4.4 matter-ai — 1 chamada por PR, sem ferramentas

`matter-ai/src/integrations/github.ts:472-477`:

> ```ts
> const preparePRForAnalysis = (prDetails: any) => {
>   return {
>     title: prDetails.title,
>     changed_files: filterPRFiles(prDetails.changed_files)
>   };
> }
> ```

`matter-ai/src/ai/pullRequestAnalysis.ts:34-39`:

> ```ts
>     let userPrompt = prompt.user.replace('{{prData}}', JSON.stringify(prData));
>
>     const analysis = await aiGateway.createCompletion({
>         systemPrompt: prompt.system,
>         userPrompt: userPrompt
>     });
> ```

Sem `tools` em nenhum provider — `matter-ai/src/ai/gateway.ts:83-91`:

> ```ts
>         return await this.client.chat.completions.create({
>           model: this.config.model,
>           ...(this.config.model.startsWith('gpt') ? { max_tokens: 16384 } : { max_completion_tokens: 16384 }),
>           messages: [
>             { role: 'system', content: prompt.systemPrompt },
>             { role: 'user', content: prompt.userPrompt },
>           ],
>           response_format: { type: "json_object" }
>         });
> ```

### 4.5 Quadro comparativo

| Harness | Tool calling? | Chamadas de LLM por PR | Quem decide quanto explorar |
|---|---|---|---|
| **pr-agent `/review`** | Não | **1** | O harness (compressão de diff) |
| **pr-agent `/improve`** | Não | **2–6** | O harness (chunking) |
| **matter-ai** | Não | **1** | Ninguém (diff inteiro, truncado em 100 arquivos) |
| **Codesteward** | **Sim** (`ls`, `read_file`, `glob`, `grep`, `sandbox_read`, `sandbox_exec`, `graph_*`) | **12–17** típico | **Harness particiona; modelo decide dentro da partição** |
| **SWE-agent** | Sim | 1 sessão × N tentativas; **teto de 75–150 chamadas de API/instância** (§8) | Modelo, **com submit gate e retry loop** |
| **Nosso harness** | Sim | **1 sessão** | **O modelo, integralmente** |

---

## 5. Pergunta 3 — PIPELINE FIND → VERIFY

**Sim, nos dois reviewers maduros — e nos dois o verify usa modelo diferente (mais forte) e temperatura mais baixa que a geração.**

### 5.1 pr-agent — self-reflection obrigatória, modelo dedicado

`pr-agent/pr_agent/tools/pr_code_suggestions.py:424-435`:

> ```python
>         # self-reflect on suggestions (mandatory, since line numbers are generated now here)
>         model_reflect_with_reasoning = get_model('model_reasoning')
>         fallbacks = get_settings().config.fallback_models
>         if model_reflect_with_reasoning == get_settings().config.model and model != get_settings().config.model and fallbacks and model == \
>                 fallbacks[0]:
>             # we are using a fallback model (should not happen on regular conditions)
>             get_logger().warning(f"Using the same model for self-reflection as the one used for suggestions")
>             model_reflect_with_reasoning = model
>         response_reflect = await self.self_reflect_on_suggestions(data["code_suggestions"],
>                                                                   patches_diff, model=model_reflect_with_reasoning)
> ```

Repare no **warning explícito** quando gerador e verificador coincidem — o repo trata isso como situação anômala ("should not happen on regular conditions").

`pr-agent/pr_agent/settings/configuration.toml:7-10`:

> ```toml
> model="gpt-5.6"
> fallback_models=["gpt-5.6-terra"]
> #model_reasoning="gpt-5.6-terra" # dedicated reasoning model for self-reflection
> #model_weak="gpt-5.6-luna" # optional, a weaker model to use for some easier tasks
> ```

Falha do verify **não descarta** — `pr_code_suggestions.py:437-441`:

> ```python
>         else:
>             # get_logger().error(f"Could not self-reflect on suggestions. using default score 7")
>             for i, suggestion in enumerate(data["code_suggestions"]):
>                 suggestion["score"] = 7
>                 suggestion["score_why"] = ""
> ```

O gate numérico fica **fora do LLM** — `pr_code_suggestions.py:736-748`:

> ```python
>                     score_threshold = max(1, int(get_settings().pr_code_suggestions.suggestions_score_threshold))
>                     for i, prediction in enumerate(predictions["code_suggestions"]):
>                         try:
>                             score = int(prediction.get("score", 1))
>                             if score >= score_threshold:
>                                 data["code_suggestions"].append(prediction)
>                             else:
>                                 get_logger().info(
>                                     f"Removing suggestions {i} from call {j}, because score is {score}, and score_threshold is {score_threshold}",
> ```

**Default do threshold é 0** — `configuration.toml:172`:

> ```toml
> suggestions_score_threshold=0 # [0-10]| recommend not to set this value above 8, since above it may clip highly relevant suggestions
> ```

**Ponto acionável:** o default do reviewer OSS mais maduro é **não filtrar por score**, e o comentário desaconselha passar de 8 porque "may clip highly relevant suggestions". O verify existe para **ordenar e rotular**, não para cortar. Isso é o inverso do nosso gate.

#### Prompt do verify (pr-agent)

`pr-agent/pr_agent/settings/code_suggestions/pr_code_suggestions_reflect_prompts.toml:2-6`:

> ```
> You are an AI language model specialized in reviewing and evaluating code suggestions for a Pull Request (PR).
> Your task is to analyze a PR code diff and evaluate the correctness and importance set of AI-generated code suggestions.
> ...
> Examine each suggestion meticulously, assessing its quality, relevance, and accuracy within the context of PR. Keep in mind that the suggestions may vary in their correctness, accuracy and impact.
> ```

`:13-17`:

> ```
> Be particularly vigilant for suggestions that:
>     - Overlook crucial details in the PR code
>     - The 'improved_code' section does not accurately reflect the suggested changes, in relation to the 'existing_code'
>     - Contradict or ignore parts of the PR's modifications
> In such cases, assign the suggestion a score of 0.
> ```

`:20-24` — o verify manda **ampliar** o contexto além das linhas citadas:

> ```
> Key guidelines for evaluation:
> - Thoroughly examine both the suggestion content and the corresponding PR code diff. Be vigilant for potential errors in each suggestion, ensuring they are logically sound, accurate, and directly derived from the PR code diff.
> - Extend your review beyond the specifically mentioned code lines to encompass surrounding PR code context, verifying the suggestions' contextual accuracy.
> - Validate the 'existing_code' field by confirming it matches or is accurately derived from code lines within a '__new hunk__' section of the PR code diff.
> ```

`:36-41` — categorias com score 0 fixo:

> ```
> - Assign a score of 0 to suggestions aiming at:
>    - Adding docstring, type hints, or comments
>    - Remove unused imports or variables
>    - Add missing import statements
>    - Using more specific exception types.
>    - Questions the definition, declaration, import, or initialization of any entity in the PR code, that might be done in the outer codebase.
> ```

### 5.2 Codesteward — verify "senior reviewer" adversarial, em lote, temperatura 0

`codesteward/packages/agents/src/verifier.ts:32-51` (`SENIOR_SYSTEM`, literal):

> ```
> You are a principal software engineer and senior code-review lead (the bar competitors like CodeRabbit aim for).
> Your job is NOT to re-discover every bug. Specialists already proposed findings in parallel (security, correctness, testing, rules, …). They do not see each other's work.
>
> You receive:
> 1) Each candidate finding with title, body, path/lines, severity, specialist role(s), product/model confidence, optional suggested fix
> 2) **Specialist reasoning** — their structured thought process (why real, what checked, caveats). Prefer this over inventing alternative theories.
> 3) Optional packed diff/file context from the same review session
>
> Decide for EACH finding: keep | drop | downgrade | upgrade.
> - keep — real, actionable, well-grounded in path/line/context or specialist reasoning
> - drop — false positive, style nit below the bar, duplicate of a stronger finding in the batch, or cannot be justified from context+reasoning
> - downgrade — real but overstated severity
> - upgrade — understated severity and evidence is strong
>
> Be adversarial but fair. Prefer high signal. Do not invent files or APIs not present in context/reasoning.
> Respond ONLY with JSON:
> {"verdicts":[{"index":0,"verdict":"keep|drop|downgrade|upgrade","reason":"1-3 sentences citing specialist reasoning and/or code context"}]}
> Include one entry per input finding index (0-based).
> ```

**(a) O verify recebe o RACIOCÍNIO do gerador, não só o finding** — `codesteward/packages/agents/src/prompt-pack.ts:71-74`:

> ```ts
> const REASONING_CONTRACT =
>   "For each finding include **reasoning** (2–6 sentences): why this is a real issue, what you checked " +
>   "(code paths, callers, guards), and any caveats. This is forwarded to a senior verifier — " +
>   "not a raw chat log, but your structured thought process. Omit only if truly nothing to justify.";
> ```

**(b) Bar configurável, inclusive amostragem** — `verifier.ts:63-76`:

> ```ts
>   if (policy.verificationBar === "off") {
>     return findings.map((f) => ({ ... verdict: "keep" ... }));
>   }
>
>   if (!findings.length) return [];
>
>   const sample =
>     policy.verificationBar === "sample"
>       ? findings.filter((_, i) => i % 5 === 0)
>       : findings;
> ```

Lote e temperatura — `verifier.ts:95-98` e `:202`:

> ```ts
>   const batchSize = Math.max(
>     1,
>     opts.batchSize ?? Number(process.env.STEW_VERIFY_BATCH_SIZE ?? 10),
>   );
> ```
> ```ts
>       temperature: 0,
> ```

Contra `temperature: 0.1` na geração (`specialists.ts:207`).

### 5.3 Codesteward — a confiança que decide é do PRODUTO, não do modelo

`codesteward/packages/agents/src/confidence.ts:1-6`:

> ```ts
> /**
>  * Three-level confidence model:
>  * - confidence (product): evidence-derived, gates + audit + UI primary
>  * - modelConfidence: specialist JSON self-report (diagnostic)
>  * - tokenConfidence: mean token prob from provider logprobs when available
>  */
> ```

`confidence.ts:32-61`:

> ```ts
> /**
>  * Derive product confidence from pipeline evidence.
>  * Model/token self-scores are weak secondary signals only (± small delta).
>  */
> export function scoreProductConfidence(s: ConfidenceSignals): number {
>   let score = 0.5;
>
>   if (s.hasPath) score += 0.1;
>   if (s.hasLine) score += 0.15;
>   if (s.hasBody) score += 0.05;
>   if (s.hasGraphEvidence) score += 0.15;
>   if (s.hasDiffEvidence) score += 0.08;
>   if (s.hasSastEvidence) score += 0.12;
>   if (s.hasProveEvidence) score += 0.12;
>   if (s.hasPolicyEvidence) score += 0.05;
>   if (s.discourseAgree) score += 0.1;
>   if (s.discourseChallenge) score -= 0.2;
>   if ((s.agentCount ?? 1) >= 2) score += 0.08;
> ```

`confidence.ts:63-70`:

> ```ts
>   // Weak secondary: model self-report (±0.05 around 0.5)
>   if (typeof s.modelConfidence === "number" && Number.isFinite(s.modelConfidence)) {
>     score += (clamp01(s.modelConfidence, 0, 1) - 0.5) * 0.1;
>   }
> ```

### 5.4 Codesteward — terceiro estágio: dois passes independentes + síntese (`thorough`)

`codesteward/packages/agents/src/discourse.ts:41-45`:

> ```ts
> /**
>  * OCR multiagent-style discourse:
>  * 1. Run two independent correctness passes (different temperature / prompt framing)
>  * 2. Synthesize with AGREE / CHALLENGE / CONNECT / SURFACE moves
>  * 3. Emit merged findings with discourse evidence attached
>  */
> ```

Framing anti-ancoragem — `discourse.ts:142-144`:

> ```ts
>   const system =
>     "You are an independent correctness reviewer (second panelist). Do not assume agreement with any prior review.\n\n" +
>     renderSpecialistSystem(ctx.promptPack, "correctness", promptVars);
> ```

Sintetizador — `discourse.ts:177-186`:

> ```
> You are a discourse synthesizer for multi-agent code review.
> Compare two independent correctness passes and existing findings.
> Emit moves:
> - AGREE: both panels (or existing) support the same issue — boost confidence
> - CHALLENGE: a finding is weak, duplicate, or likely false positive — drop or lower
> - CONNECT: two findings are related / same root cause — link them
> - SURFACE: a novel high-value issue only one panel found — promote it
> ```

**`SURFACE` é um contrapeso deliberado ao viés de precisão do verify:** um mecanismo explícito para *não perder* o que só um painel viu.

### 5.5 SWE-agent — o verify é um *reviewer* que decide se tenta de novo

`SWE-agent/sweagent/agent/reviewer.py:157-165` — `ReviewerConfig`, com `n_sample: int = 5` e `failure_score_penalty: float = 0.0`. `ScoreRetryLoopConfig` (linhas 200-216) tem `accept_score`, `max_accepts: int = 1`, `max_attempts`, `cost_limit`.

Diferença crucial em relação aos reviewers de PR: **o verificador do SWE-agent não só filtra — ele decide se o agente volta a trabalhar.** É a peça que falta nos harnesses de code review.

### 5.6 withmartian — find→verify: NÃO ENCONTRADO (só dedup + judge)

O repo não gera findings a partir de código; extrai findings de comentários de bots. Estágios: extração → dedup → juízo. Termos buscados sem resultado: `verify`, `verifier`, `two-stage`, `second pass`, `self-critic`, `critique`, `confidence_threshold`.

O desenho over-generate-and-filter aparece lá **só como proposta futura** — `methodology/summary.md:35` (fonte secundária):

> "*Over-generate and filter.* Use LLMs to generate candidate bugs, then use humans (or calibrated judges) to filter. Recognition is easier than generation, so this captures bugs humans wouldn't have spotted on their own but can verify when shown."

Regra de dedup deliberadamente conservadora — `offline/code_review_benchmark/step2_5_dedup_candidates.py:53-54`:

> ```
> When in doubt, keep candidates separate — it is better to leave a duplicate
> ungrouped than to incorrectly merge two distinct issues.
> ```

### 5.7 matter-ai — NÃO EXISTE verify

Saída do LLM vai direto ao GitHub (`matter-ai/src/integrations/github.ts:352-362`). Único pós-processamento é reparo sintático de JSON (`matter-ai/src/helpers/jsonHelper.ts:52-53`, `jsonrepair`).

---

## 6. Pergunta 4 — INSTRUÇÃO DE REPORTE (prompts literais)

> "Só reporte com evidência concreta" ou "reporte tudo, filtra depois"?

**Os dois reviewers maduros mandam o gerador ser generoso e delegam o corte ao verify. Nenhum diz "só reporte com evidência concreta" ao gerador.**

### 6.1 pr-agent `/review` — barra de evidência assimétrica por severidade

O prompt mais relevante do levantamento para a nossa pergunta. `pr-agent/pr_agent/settings/pr_reviewer_prompts.toml:49-55`:

> ```
> Determining what to flag:
> - For clear bugs and security issues, be thorough. Do not skip a genuine problem just because the trigger scenario is narrow.
> - For lower-severity concerns, be certain before flagging. If you cannot confidently explain why something is a problem with a concrete scenario, do not flag it.
> - Each issue must be discrete and actionable, not a vague concern about the codebase in general.
> - Do not speculate that a change might break other code unless you can identify the specific affected code path from the diff context.
> - Do not flag intentional design choices or stylistic preferences unless they introduce a clear defect.
> - When confidence is limited but the potential impact is high (e.g., data loss, security), report it with an explicit note on what remains uncertain. Otherwise, prefer not reporting over guessing.
> ```

Três coisas:

1. **"be thorough" para bug/security, "be certain" para o resto.** A barra é **função da severidade**, não global.
2. **"report it with an explicit note on what remains uncertain"** — terceira via entre reportar e calar.
3. **"prefer not reporting over guessing"** só depois das duas exceções acima.

O contrato de saída ecoa — `pr_reviewer_prompts.toml:150`:

> ```
>     key_issues_to_review: List[KeyIssuesComponentLink] = Field("A concise list (0-{{ num_max_findings }} issues) of bugs, security vulnerabilities, or significant performance concerns introduced in this PR. Only include issues you are confident about. If confidence is limited but the potential impact is high (e.g., data loss, security), you may include it only if you explicitly note what remains uncertain. Each issue must identify a concrete problem with a realistic trigger scenario. An empty list is acceptable if no clear issues are found.")
> ```

**Teto duro de findings** — `configuration.toml:112`:

> ```toml
> num_max_findings = 3
> ```

Injetado em `pr-agent/pr_agent/tools/pr_reviewer.py:88`:

> ```python
>             "num_max_findings": get_settings().pr_reviewer.num_max_findings,
> ```

**Achado para o nosso bench:** com `num_max_findings = 3`, o `/review` do pr-agent tem teto de reporte **mais baixo que o nosso deepseek-v4-pro observado (3,4 findings/caso)**. O reviewer OSS mais maduro decidiu deliberadamente ficar abaixo do que nossos modelos produzem espontaneamente.

Guarda de "não questione o que você não vê" — `pr_reviewer_prompts.toml:46`:

> ```
> - Note that you only see changed code segments (diff hunks in a PR), not the entire codebase. Avoid suggestions that might duplicate existing functionality or questioning code elements (like variables declarations or import statements) that may be defined elsewhere in the codebase.
> ```

### 6.2 pr-agent `/improve` — "até N", poda por categoria proibida

`pr-agent/pr_agent/settings/code_suggestions/pr_code_suggestions_prompts.toml:52-57`:

> ```
> Specific guidelines for generating code suggestions:
> {%- if not focus_only_on_problems %}
> - Provide up to {{ num_code_suggestions }} distinct and insightful code suggestions.
> {%- else %}
> - Provide up to {{ num_code_suggestions }} distinct and insightful code suggestions. Return less suggestions if no pertinent ones are applicable.
> {%- endif %}
> ```

`:61-72`:

> ```
> - Prioritize suggestions that address potential issues, critical problems, and bugs in the PR code. Avoid repeating changes already implemented in the PR. If no pertinent suggestions are applicable, return an empty list.
> - Don't suggest to add docstring, type hints, or comments, to remove unused imports, or to use more specific exception types.
> ...
> - Only give suggestions that address critical problems and bugs in the PR code. If no relevant suggestions are applicable, return an empty list.
> - DO NOT suggest the following:
>     - change packages version
>     - add missing import statement
>     - declare undefined variable, or remove unused variable
>     - use more specific exception types
>     - repeat changes already done in the PR code
> ```

**Nenhuma menção a "evidência concreta".** A poda é por **categoria proibida**, não por confiança.

### 6.3 Codesteward — geração generosa, personas curtas, corte no verify

`codesteward/packages/agents/src/prompt-pack.ts:159-176`:

> ```ts
> export const DEFAULT_PERSONAS: Record<string, string> = {
>   generalist:
>     "You are a senior code reviewer. Find correctness issues, obvious bugs, and API misuse. Prefer high-signal findings.",
>   correctness:
>     "You are a correctness specialist. Focus on logic bugs, race conditions, error handling, null/edge cases, and invariant violations.",
>   security:
>     "You are a security specialist. Focus on injection, authz/authn gaps, secrets, SSRF, path traversal, insecure crypto, and taint flows. Use graph referential/semantic queries when available.",
>   performance:
>     "You are a performance specialist. Focus on N+1 queries, unbounded loops, memory leaks, blocking I/O on hot paths, and algorithmic complexity.",
>   testing:
>     "You are a testing specialist. Identify missing tests for critical paths, brittle tests, and untested error branches.",
> ```

Único freio no gerador é **piso de severidade** — `prompt-pack.ts:124-125`:

> ```ts
> const SEVERITY_DEFAULT =
>   "Severity floor: {{severity_floor}}. Prefer actionable findings. No style nits unless severity allows.";
> ```

Grounding é sobre **fonte da afirmação**, não certeza — `prompt-pack.ts:121-122`:

> ```ts
> const GROUNDING_DEFAULT =
>   "Ground findings in SOURCE CODE first (Context FILE excerpts / diffs). The structural graph is supporting evidence for callers, auth, and cross-file edges — not a substitute for reading code.\nWhen graph hits support a finding, cite symbols/callers in the body. Prefer structural evidence over style opinions.";
> ```

Só quando não há contexto empacotado o prompt aperta — `prompt-pack.ts:511-513`:

> ```ts
>     v.context_text =
>       "WARNING: No source/diff context was packed for this unit — only emit findings you can prove from graph evidence, and mark confidence low.";
> ```

Filtro de saída no harness — `codesteward/packages/agents/src/noise.ts:11-24`:

> ```ts
> export interface NoiseOptions {
>   /** Override severity floor (defaults to policy.severityFloor). */
>   severityFloor?: Severity;
>   /** Max total findings after noise filtering. */
>   maxFindings?: number;
>   /** Max nits retained. */
>   nitCap?: number;
>   /** Drop style-only / nitty titles matching these patterns. */
>   nitPatterns?: RegExp[];
>   /** Max inline comments recommended for SCM publish. */
>   commentCap?: number;
> ```

### 6.4 withmartian — "identify every distinct substantive finding"

`online/etl/llm/prompts.py:16-18`:

> ```
> Your job is to identify every distinct substantive finding the bot flagged. A finding can be a
> bug, defect, risk, incorrect behavior, missing validation, security concern, performance concern,
> maintainability issue, documentation problem, test gap, or other concrete code-review concern.
> ```

`prompts.py:20-21` — o guard-rail é *grounding*, não confiança:

> ```
> Only extract findings grounded in the bot's comments. Do not invent findings solely from the
> commit diff. Use the commit diff only to understand code context for a comment.
> ```

### 6.5 matter-ai — o prompt de review NÃO é open source

`matter-ai/src/ai/prompts.ts:17-23`:

> ```ts
> export async function getPrompt(promptId: string): Promise<Prompt> {
>     try {
>         const response = await fetch(`https://api.matterai.so/api/v1/ai/prompts/${promptId}`, {
>             headers: {
>                 'Authorization': `Bearer ${GRAVITY_API_KEY}`
>             }
>         });
> ```

**Instrução literal de reporte: NÃO ENCONTRADO** — buscado inclusive em todo o histórico git (`git log --all -S"You are"`) por `only report`, `do not report`, `concrete evidence`, `maximum of`, `no more than`, `false positive`, `nitpick`, `You are`. Zero hits.

---

## 7. Pergunta 5 — AJUSTE POR MODELO

**Este é o eixo em que o aider está anos à frente de qualquer reviewer.**

### 7.1 aider — flags de COMPORTAMENTO por modelo: `lazy` e `overeager`

Resposta direta à pergunta "existe menção a modelos específicos se comportarem diferente (parar cedo, reportar pouco)?". **Sim, e virou mecanismo, não comentário.**

`aider/aider/models.py:135-136`:

> ```python
>     lazy: bool = False
>     overeager: bool = False
> ```

**`lazy`** = o modelo entrega menos do que deveria (deixa `# ...` no lugar de implementar). Prompt corretivo literal — `aider/aider/coders/base_prompts.py:12-15`:

> ```python
>     lazy_prompt = """You are diligent and tireless!
> You NEVER leave comments describing code without implementing it!
> You always COMPLETELY IMPLEMENT the needed code!
> """
> ```

**`overeager`** = o modelo faz demais / sai do escopo. `aider/aider/coders/base_prompts.py:17-20`:

> ```python
>     overeager_prompt = """Pay careful attention to the scope of the user's request.
> Do what they ask, but no more.
> Do not improve, comment, fix or modify unrelated parts of the code in any way!
> """
> ```

Injeção condicional — `aider/aider/coders/base_coder.py:1176-1179`:

> ```python
>         if self.main_model.lazy:
>             final_reminders.append(self.gpt_prompts.lazy_prompt)
>         if self.main_model.overeager:
>             final_reminders.append(self.gpt_prompts.overeager_prompt)
> ```

A tabela de quais modelos recebem qual patch — `aider/aider/resources/model-settings.yml`:
- `lazy: true` nas linhas **25, 32, 39, 48, 56, 64, 72, 80, 87, 92, 99, 107** (família GPT-4 turbo / GPT-4o / GPT-4 preview). Exemplo, linhas 21-26:

> ```yaml
> - name: gpt-4-turbo-2024-04-09
>   edit_format: udiff
>   weak_model_name: gpt-4o-mini
>   use_repo_map: true
>   lazy: true
>   reminder: sys
> ```

- `overeager: true` nas linhas **188, 203, 232, 247, 262, 277, 292, 307**, **1885** (`claude-opus-4-7`), **1896** (`claude-opus-4-6`), **2172** (`gpt-5`), **2199** (`gpt-5.1`). Exemplo, linhas 186-190:

> ```yaml
> - name: anthropic/claude-3-7-sonnet-20250219
>   overeager: true
>   edit_format: diff
>   weak_model_name: anthropic/claude-3-5-haiku-20241022
>   use_repo_map: true
> ```

**Mapeamento direto para os nossos modos de falha:** `lazy` ≈ gpt-5.6-terra (trabalha e entrega pouco); `overeager` ≈ o risco de precisão do deepseek-v4-pro. A correção do aider é **um fragmento de prompt anexado como lembrete final, ligado por modelo** — não um redesenho.

### 7.2 aider — parâmetros por modelo: cascata hardcoded + tabela declarativa

`aider/aider/models.py:437-598`, método `apply_generic_model_settings`. Trechos literais:

> ```python
> # linha 438
>         if "/o3-mini" in model:
>             self.edit_format = "diff"
>             self.use_repo_map = True
>             self.use_temperature = False
>             self.system_prompt_prefix = "Formatting re-enabled. "
>             if "reasoning_effort" not in self.accepts_settings:
>                 self.accepts_settings.append("reasoning_effort")
>             return
>
> # linha 463
>         if last_segment in ("gpt-5", "gpt-5-2025-08-07"):
>             self.use_temperature = False
>             self.edit_format = "diff"
>             if "reasoning_effort" not in self.accepts_settings:
>                 self.accepts_settings.append("reasoning_effort")
>             return
>
> # linha 500
>         if "deepseek" in model and ("r1" in model or "reasoning" in model):
>             self.edit_format = "diff"
>             self.use_repo_map = True
>             self.examples_as_sys_msg = True
>             self.use_temperature = False
>             self.reasoning_tag = "think"
>             return
>
> # linha 531
>         if "sonnet-4-" in model or "opus-4-" in model or "haiku-4-" in model:
>             self.edit_format = "diff"
>             self.use_repo_map = True
>             self.examples_as_sys_msg = False
>             if "opus-4-" in model:
>                 self.use_temperature = False
>             if (
>                 "thinking_tokens" not in self.accepts_settings
>                 and "4.7" not in model
>                 and "4-7" not in model
>             ):
>                 self.accepts_settings.append("thinking_tokens")
>             return
>
> # linha 587
>         if "qwen3" in model and "235b" in model:
>             self.edit_format = "diff"
>             self.use_repo_map = True
>             self.system_prompt_prefix = "/no_think"
>             self.use_temperature = 0.7
>             self.extra_params = {"top_p": 0.8, "top_k": 20, "min_p": 0.0}
>             return
> ```

Aplicação de `reasoning_effort` com diferença de wire format por gateway — `aider/aider/models.py:791-805`:

> ```python
>     def set_reasoning_effort(self, effort):
>         """Set the reasoning effort parameter for models that support it"""
>         if effort is not None:
>             if self.name.startswith("openrouter/"):
>                 ...
>                 self.extra_params["extra_body"]["reasoning"] = {"effort": effort}
>             else:
>                 ...
>                 self.extra_params["extra_body"]["reasoning_effort"] = effort
> ```

E `thinking` — `aider/aider/models.py:838-864`:

> ```python
>     def set_thinking_tokens(self, value):
>         ...
>             num_tokens = self.parse_token_value(value)
>             self.use_temperature = False
>             ...
>             # OpenRouter models use 'reasoning' instead of 'thinking'
>             if self.name.startswith("openrouter/"):
>                 ...
>                     self.extra_params["extra_body"]["reasoning"] = {"max_tokens": num_tokens}
>             else:
>                 if num_tokens > 0:
>                     self.extra_params["thinking"] = {"type": "enabled", "budget_tokens": num_tokens}
> ```

Tabela declarativa (`model-settings.yml`, 3128 linhas), exemplo `:2165-2172`:

> ```yaml
> # GPT-5 family
> - name: gpt-5
>   edit_format: diff
>   weak_model_name: gpt-5-nano
>   use_repo_map: true
>   use_temperature: false
>   accepts_settings: ["reasoning_effort"]
>   overeager: true
> ```

### 7.3 pr-agent — listas explícitas de modelos, com um comentário decisivo sobre Gemini

`reasoning_effort` global — `configuration.toml:79`:

> ```toml
> reasoning_effort = "medium" # "none", "minimal", "low", "medium", "high", "xhigh"
> ```

Aplicado só a modelos de uma lista — `litellm_ai_handler.py:659-678`:

> ```python
>                 if any(model == m or model.endswith("/" + m) for m in self.support_reasoning_models):
>                     config_effort = get_settings().config.reasoning_effort
>                     ...
>                     kwargs["reasoning_effort"] = reasoning_effort
> ```

Caminho especial GPT-5, com normalização de prefixos empilhados — `litellm_ai_handler.py:587-616`:

> ```python
>                 thinking_kwargs_gpt5 = None
>                 # Detect GPT-5 family regardless of provider prefix(es) on the model name.
>                 # Users sometimes put a provider prefix in config (e.g. "openai/gpt-5.1-codex-max"),
>                 # and Azure mode auto-prepends "azure/", which together can produce stacked prefixes
>                 # like "azure/openai/gpt-5...". Without normalization the GPT-5 path is skipped and
>                 # litellm rejects the request with UnsupportedParamsError for temperature=0.2.
>                 model_base = model
>                 while model_base.startswith(('openai/', 'azure/')):
>                     model_base = model_base.removeprefix('openai/').removeprefix('azure/')
>                 if model_base.startswith('gpt-5'):
>                     ...
>                     thinking_kwargs_gpt5 = {
>                         "reasoning_effort": effort,
>                         "allowed_openai_params": ["reasoning_effort"],
>                     }
> ```

E para GPT-5 a temperatura é removida — `litellm_ai_handler.py:654-657`:

> ```python
>                 if thinking_kwargs_gpt5:
>                     kwargs.update(thinking_kwargs_gpt5)
>                     if 'temperature' in kwargs:
>                         del kwargs['temperature']
> ```

**A citação que mais importa para o nosso caso do Gemini** — `pr-agent/pr_agent/algo/__init__.py:387-402`:

> ```python
> SUPPORT_REASONING_EFFORT_MODELS = [
>     "o3-mini",
>     "o3-mini-2025-01-31",
>     "o3",
>     "o3-2025-04-16",
>     "o4-mini",
>     "o4-mini-2025-04-16",
>     # Gemini 2.5 exposes a thinking budget that LiteLLM maps from reasoning_effort
>     # (low/medium/high -> thinkingConfig.thinkingBudget). Without these entries a
>     # configured reasoning_effort is silently dropped for Gemini, so a runaway
>     # thinking trace can consume the whole output budget and return an empty
>     # completion. Matched provider-prefix-insensitively in litellm_ai_handler so
>     # prefixed forms (e.g. "openrouter/google/gemini-2.5-pro") are covered too.
>     "gemini-2.5-pro",
>     "gemini-2.5-flash",
> ]
> ```

**Menção em código a um Gemini falhando de um jeito específico: `reasoning_effort` silenciosamente descartado → thinking trace consome o orçamento de saída → completion vazia.** O sintoma ("o Gemini devolveu pouco/nada") tem aqui uma **causa mecânica de configuração**, não de comportamento do modelo. Checável no nosso harness.

Advertência sobre modelos Claude adaptativos — `pr_agent/algo/__init__.py:404-412`:

> ```python
> # Claude models that support "extended thinking" through the manual
> # thinking={"type": "enabled", "budget_tokens": ...} request built by
> # LiteLLMAIHandler._configure_claude_extended_thinking(). Only models that
> # accept budget_tokens belong here. Adaptive-only models (Claude Opus 4.7/4.8,
> # Opus 5, Sonnet 5, Fable 5) reject budget_tokens with an HTTP 400 and must not be added
> # without also adding an adaptive-thinking code path.
> ```

### 7.4 SWE-agent — pouco por modelo; uma regra hardcoded

`SWE-agent/sweagent/agent/models.py:608-620`:

> ```python
>             # Special handling for Claude 3.7 models to set 64k context by default when beta header not present
>             # See https://github.com/SWE-agent/SWE-agent/pull/1016
>             is_claude_3_7 = "claude-3-7-sonnet" in self.config.name or "claude-sonnet-4" in self.config.name
>             has_128k_beta_header = (
>                 self.config.completion_kwargs.get("extra_headers", {}).get("anthropic-beta") == "output-128k-2025-02-19"
>             )
>             if is_claude_3_7 and not has_128k_beta_header:
>                 self.model_max_output_tokens = 64000
> ```

Defaults — `models.py:79-81`: `temperature: float = 0.0`, `top_p: float | None = 1.0`. Flag para o1 — `models.py:99-102`:

> ```python
>     convert_system_to_user: bool = False
>     """Whether to convert system messages to user messages. This is useful for
>     models that do not support system messages like o1.
>     """
> ```

`reasoning_effort` só aparece como `completion_kwargs` de config, para o `o1` usado como chooser — `config/benchmarks/250212_sweagent_heavy_sbl.yaml:183-188`:

> ```yaml
>       model: &chooser_model
>         name: o1
>         top_p: null
>         temperature: 1.
>         per_instance_cost_limit: 30
>         completion_kwargs:
>           reasoning_effort: "high"
> ```

**Comentário sobre modelo parar cedo / não usar ferramentas / reportar de menos: NÃO ENCONTRADO** em `sweagent/**/*.py`. Termos: `stops early`, `stop early`, `prematurely`, `too early`, `forget`, `tends to`, `often fails`, `lazy`, `overeager`.

### 7.5 Codesteward — modelo por PAPEL, não por modelo

`codesteward/packages/model-router/src/config.ts:167-178`:

> ```ts
> export function resolveModelForRole(
>   role: ModelRole,
>   cfg: EnvModelConfig = loadEnvModelConfig(),
> ): ResolvedModelTarget {
>   const override = cfg.roleOverrides[role] ?? cfg.roleOverrides[String(role)];
>   let model = cfg.model;
>   if (STRONG_ROLES.has(role) || role === "judge" || role === "security") {
>     model = cfg.strongModel;
>   } else if (CHEAP_ROLES.has(role) || role === "summary") {
>     model = cfg.cheapModel;
>   }
>   if (override?.model) model = override.model;
> ```

`codesteward/packages/agents/src/deep-agent-runner.ts:122-127`:

> ```ts
>   if (role === "security" || role === "judge" || role === "verifier") {
>     return process.env.MODEL_STRONG
>       ? `openai:${process.env.MODEL_STRONG}`
>       : "openai:gpt-4.1";
>   }
>   return "openai:gpt-4.1-mini";
> ```

Temperatura por **estágio**, não por modelo:

| Estágio | Arquivo:linha | Temperatura |
|---|---|---|
| Specialist (geração) | `packages/agents/src/specialists.ts:207` | `0.1` |
| Discourse passe B | `packages/agents/src/discourse.ts:153` | `0.35` |
| Discourse síntese | `packages/agents/src/discourse.ts:195` | `0.2` |
| **Verifier** | `packages/agents/src/verifier.ts:202` | **`0`** |
| Session report | `packages/agents/src/session-report.ts:481` | `0.2` |

Única ramificação por família — `deep-agent-runner.ts:108`:

> ```ts
>       temperature: isGpt5Family ? 1 : 0.2,
> ```

E no provider — `packages/model-router/src/providers/openai-compat.ts:57-61`:

> ```ts
>       // gpt-5 / codex family: many gateways only accept temperature=1 (or omit)
> ```

**`reasoning_effort` / `thinking` / `budget_tokens` em Codesteward: NÃO ENCONTRADO.**

### 7.6 Os demais

- **OpenHands (frontend):** só UI para `llm.reasoning_effort`, com o schema servido pelo backend (`src/utils/sdk-settings-field-metadata.test.ts:176`, chaves `SCHEMA$LLM$REASONING_EFFORT$CHOICE$*` em `src/i18n/translation.json:4269-4371`). Listas de modelos só em mocks (`src/mocks/settings-handlers.ts:604-611`). **Comentário sobre comportamento de modelo: NÃO ENCONTRADO.**
- **matter-ai:** temperatura hardcoded global (`gateway.ts:54` → `temperature: 0.6`, com `top_p: 0.1` e `top_k: 0` — combinação desaconselhada pela doc da Anthropic, e `top_k: 0` é inválido). `reasoning_effort`/`thinking`: **NÃO ENCONTRADO**.
- **withmartian:** `temperature=0.0` fixa em todos os passos offline (`step2_extract_comments.py:107`, `step2_5_dedup_candidates.py:178`, `step3_judge_comments.py:132`, `step5_label_prs.py:160`); online usa default `1.0` (`online/etl/llm/client.py:23-35`). `reasoning_effort`/`thinking`/`top_p`/`max_tokens`: **NÃO ENCONTRADO**.

### 7.7 Issues abertas sobre modelo sub-reportar

**NÃO ENCONTRADO.** `gh search issues` em 2026-08-13: `qodo-ai/pr-agent` × {`gemini stops early`, `not reporting`, `no suggestions returned`, `empty completion`} → 0; `princeton-nlp/SWE-agent` × `exit early` → 0; `SWE-agent/SWE-agent` × `submits too early` → 0.

---

## 8. Pergunta 6 — LIMITES: teto e piso

### 8.1 Teto

| Harness | Unidade do teto | Valor | Onde |
|---|---|---|---|
| **SWE-agent** | **custo por instância** | **$3.0** (default) | `sweagent/agent/models.py:73-76` |
| **SWE-agent** | **chamadas de API por instância** | **0 = ilimitado** (default); **75** e **150** nos configs de benchmark | `models.py:77`; `config/benchmarks/250212_sweagent_heavy_sbl.yaml:15`; `config/benchmarks/250225_anthropic_filemap_simple_review.yaml:72` |
| **SWE-agent** | tempo total de execução de comandos | **1800 s** | `sweagent/tools/tools.py:143-146` |
| **SWE-agent** | timeouts de execução consecutivos | **3** | `tools/tools.py:150-151` |
| **SWE-agent** | re-consultas por erro de formato | **3** | `sweagent/agent/agents.py:158-161` |
| **SWE-agent** | tentativas completas (retry loop) | **10** (config de benchmark) | `config/benchmarks/250212_sweagent_heavy_sbl.yaml:138` |
| **SWE-agent** | **steps / iterações** | **NÃO EXISTE** | `while not step_output.done:` em `agents.py:1284`, sem contador |
| **OpenHands** | iterações do agente | **500** (default do adapter) | `src/api/agent-server-adapter.ts:1110-1114` |
| **aider** | reflexões (re-injeções) | **3** | `aider/coders/base_coder.py:100-101` |
| **pr-agent `/improve`** | chamadas de LLM por PR | **3** | `configuration.toml:179` |
| **pr-agent `/improve`** | sugestões por chunk | **3** | `configuration.toml:178` |
| **pr-agent `/review`** | findings publicados | **3** | `configuration.toml:112` |
| **pr-agent** | timeout de chamada | **120 s** | `configuration.toml:28` |
| **Codesteward** | wall-clock por specialist | **480 000 ms (8 min)** | `packages/agents/src/concurrency.ts:36-39` |
| **Codesteward** | papéis paralelos por unidade | **4** | `concurrency.ts:42-45` |
| **Codesteward** | arquivos por unidade (`gate`) | **12** | `planner.ts:18` |
| **Codesteward** | findings por lote de verify | **10** | `verifier.ts:95-98` |
| **Codesteward** | retries de self-heal por unidade | **3** | `self-heal.ts:43` |
| **withmartian** | timeout de juiz | 30 s/chamada; 1800 s/review | `step3_judge_comments.py:24-25` |

Citações literais dos mais relevantes.

`SWE-agent/sweagent/agent/models.py:73-81`:

> ```python
>     per_instance_cost_limit: float = Field(
>         default=3.0,
>         description="Cost limit for every instance (task).",
>     )
>     total_cost_limit: float = Field(default=0.0, description="Total cost limit.")
>     per_instance_call_limit: int = Field(default=0, description="Per instance call limit.")
>     temperature: float = 0.0
>     """Sampling temperature"""
>     top_p: float | None = 1.0
> ```

`SWE-agent/config/benchmarks/250212_sweagent_heavy_sbl.yaml:11-18`:

> ```yaml
>       model: &model
>         name: claude-3-7-sonnet-latest
>         api_key: $CLAUDE_API_KEY_ROTATION
>         per_instance_cost_limit: 1.5
>         per_instance_call_limit: 75
>         total_cost_limit: 1000.0
>         temperature: 0.0
>         delay: 1.0
> ```

`SWE-agent/sweagent/tools/tools.py:139-151`:

> ```python
>     execution_timeout: int = 30
>     """Timeout for executing commands in the environment"""
>
>     install_timeout: int = 300
>     """Timeout used for each of the installation commands"""
>
>     total_execution_timeout: int = 1800
>     """Timeout for executing all commands in the environment.
>     Note: Does not interrupt running commands, but will stop the agent for the next step.
>     """
>
>     max_consecutive_execution_timeouts: int = 3
>     """Maximum number of consecutive execution timeouts before the agent exits.
>     """
> ```

`OpenHands/src/api/agent-server-adapter.ts:1110-1114`:

> ```ts
>     max_iterations:
>       typeof conversationSettings.max_iterations === "number"
>         ? conversationSettings.max_iterations
>         : 500,
>     stuck_detection: true,
> ```

`aider/aider/coders/base_coder.py:100-101`:

> ```python
>     num_reflections = 0
>     max_reflections = 3
> ```

`codesteward/packages/agents/src/concurrency.ts:31-45`:

> ```ts
> /**
>  * Per-specialist wall-clock budget so one hung DeepAgents/LLM call cannot
>  * stall a unit forever (Promise.all barrier).
>  * Default 8 minutes; override with STEW_SPECIALIST_TIMEOUT_MS.
>  */
> export function specialistTimeoutMs(env: NodeJS.ProcessEnv = process.env): number {
>   const n = Number(env.STEW_SPECIALIST_TIMEOUT_MS ?? 480_000);
>   return Number.isFinite(n) && n > 0 ? n : 480_000;
> }
>
> /** Max parallel roles inside one unit (default 4). */
> export function maxSpecialistsPerUnit(env: NodeJS.ProcessEnv = process.env): number {
>   const n = Number(env.STEW_MAX_SPECIALISTS_PER_UNIT ?? 4);
>   return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4;
> }
> ```

`codesteward/packages/agents/src/self-heal.ts:51-57`:

> ```ts
> /** Ordered strategies tried after each unit crash. */
> export const HEAL_STRATEGY_ORDER: HealStrategy[] = [
>   "retry_fresh_context",
>   "fallback_simple_runner",
>   "split_unit",
>   "skip_with_gap_note",
> ];
> ```

**Observações importantes:**

1. **SWE-agent não tem teto de steps.** `max_steps`, `step_limit`, `max_iterations`, `max_turns` → **NÃO ENCONTRADO** no repo (grep `--include=*.py --include=*.yaml --include=*.md`). O teto é **econômico** (custo, chamadas de API, tempo). Isso é uma escolha de design: limitar por orçamento, não por número de passos.
2. **Codesteward também não tem teto de steps** (`recursionLimit`, `maxIterations`, `iterationLimit`, `stepLimit`, `maxTurns` → **NÃO ENCONTRADO** em `packages/`). O teto é wall-clock; o loop de tool-use fica delegado ao `deepagents` (LangChain), com o default da biblioteca.
3. **Comparação direta com o nosso bench:** os configs de benchmark do SWE-agent permitem **75–150 chamadas de API por instância**. Nossos modelos fazem 15–53 tool calls por caso — todos dentro de um orçamento que o SWE-agent consideraria confortável. Não estamos batendo em teto; estamos observando parada voluntária.

### 8.2 Piso

**NÃO ENCONTRADO como contador em nenhum repositório.** Termos buscados em todos: `min_tool`, `minTool`, `min_steps`, `minSteps`, `min_findings`, `minFindings`, `at least`, `minimum`, `require.*read`. (`severityFloor` em Codesteward é piso de *severidade*, não de esforço.)

**Mas existem três pisos de facto, todos implementados como protocolo e não como contador:**

1. **SWE-agent — `SUBMIT_REVIEW_MESSAGES`** (§3.1): o submit não submete até consumir os estágios. Piso de *revisão antes de concluir*.
2. **SWE-agent — `retry()` retorna `True` por default** (§3.2): piso de *tentativas*, limitado só por orçamento.
3. **aider — `reflected_message`** (§3.3): piso de *turnos*, disparado por condição verificável (arquivo mencionado sem estar no chat, lint falhou, teste falhou, formato inválido).

E um piso estrutural no Codesteward (§3.6f): recusar rodar sem ferramentas em produção.

---

## 9. NÃO ENCONTRADO — inventário

Todas as buscas em **2026-08-13**, sobre os clones do §12.

1. **Piso numérico de tool calls / steps: NÃO ENCONTRADO** em nenhum repositório. Termos: `min_tool`, `minTool`, `min_steps`, `minSteps`, `at least N tool`, `minimum`, `require.*tool.*call`.
2. **Re-prompt de cobertura ("você não olhou o arquivo X"): NÃO ENCONTRADO** nos harnesses de code review. Termos: `You did not`, `you have not`, `have not yet`, `Please continue`, `keep going`, `not finished`, `You must examine all`, `every changed file`, `all changed files` em `pr-agent/pr_agent` e `codesteward/packages`. Único hit: `codesteward/.../graph-tools.ts:174` (nudge de sequência de ferramenta). O parente mais próximo existe fora de code review: `aider/aider/prompts.py:31-33`.
3. **Verificação em código de que o modelo leu o arquivo que citou: NÃO ENCONTRADO.** A regra existe como prompt (`prompt-pack.ts:152`), não como assertion. Termos: `filesRead`, `readPaths`, `assert.*read`, `pathsReviewed` como gate.
4. **Gatilho de retry a partir de `emptyScanConfidence` baixa: NÃO ENCONTRADO** em Codesteward. O campo é pedido e parseado, mas não ramifica execução.
5. **`maxIterations` / `recursionLimit` / `stepLimit`: NÃO ENCONTRADO** em Codesteward nem em SWE-agent. Tetos são wall-clock e custo.
6. **Cláusula "reporte tudo, filtramos depois" explícita: NÃO ENCONTRADO** como frase em prompt de geração. O comportamento existe (verify + noise), mas nenhum prompt diz isso ao gerador.
7. **Menção em código a modelo "parar de investigar cedo": NÃO ENCONTRADO** em SWE-agent, OpenHands, Codesteward, pr-agent, matter-ai. **O que EXISTE é a categoria adjacente `lazy` do aider** (entrega de menos), que é o análogo mais próximo do nosso gpt-5.6-terra — e o comentário do Gemini em `pr_agent/algo/__init__.py:394-398`, que atribui a completion vazia a configuração.
8. **Issues abertas sobre modelo específico sub-reportar: NÃO ENCONTRADO** (7 queries, §7.7).
9. **`SubmitReviewer`, `review_loop`, `binary_review`, `always_terminate` em SWE-agent: NÃO ENCONTRADO** com esses nomes. Os nomes reais são `Reviewer`/`ReviewerConfig`, `AbstractRetryLoop`/`ScoreRetryLoop`/`ChooserRetryLoop`, `Chooser`/`ChooserConfig`/`Preselector`, e `SUBMIT_REVIEW_MESSAGES`.
10. **Motor de review em código aberto de CodeRabbit, Greptile, cubic, Bugbot, Sourcery, Graphite, Baz, CodeAnt, Propel, Macroscope, Semgrep Assistant: NÃO ENCONTRADO** (§2.2).
11. **Harness de agente com tool-use em `withmartian/code-review-benchmark`: NÃO ENCONTRADO.** O único "harness" é `offline/scripts/claude_clone_and_review.clj:111-122`, que abre o Claude Code CLI **interativamente** para um humano rodar um slash command; a definição do slash command não está no repo.
12. **LACUNA CONHECIDA — `software-agent-sdk` (OpenHands) não foi lido.** O `StuckDetector`, o `AgentController`, o juiz do `/goal` loop e as listas `REASONING_EFFORT_SUPPORTED_MODELS` / `FUNCTION_CALLING_SUPPORTED_MODELS` estão lá, e o `AGENTS.md:5` confirma. Este é provavelmente o repositório com mais material relevante que **ficou de fora** deste levantamento. **Pendência.**

---

## 10. Conclusão — fato e hipótese, separados

### 10.1 Fatos (verificados no código)

1. **Nenhum harness de code review open source força exploração.** Nem piso de tool calls, nem re-prompt de cobertura, nem assertion de "leu o arquivo que citou".
2. **Os coding agents forçam — e o mecanismo é de protocolo, não de prompt.** SWE-agent: `submit` consome estágios de revisão e só submete de verdade no final (`tools/review_on_submit_m/bin/submit:33-46`), com a flag de escape escondida do modelo. aider: `reflected_message` reinjeta a mensagem e reabre o turno (`base_coder.py:933-944`), com 5 gatilhos verificáveis.
3. **Os reviewers maduros resolvem o problema mudando a arquitetura.** pr-agent elimina a exploração (compressão determinística + 1 chamada); Codesteward a converte em partição obrigatória (`chunk(paths, 12)` × 4 papéis) → 12–17 chamadas de LLM por PR.
4. **Find→verify com modelo e temperatura diferentes é padrão nos dois reviewers.** pr-agent: `model_reasoning` dedicado, self-reflection "mandatory", com **warning explícito** quando gerador e verificador coincidem. Codesteward: verifier a `temperature: 0`, lote de 10, veredito de 4 valores, recebendo o *reasoning* do gerador.
5. **A barra de evidência fica no verify, não no gerador.** Os prompts de geração falam em severidade e categorias proibidas, nunca em "só reporte com evidência concreta".
6. **pr-agent trata bug/security assimetricamente:** "be thorough" para bug/security, "be certain" para o resto, e uma terceira via — reportar com a incerteza anotada quando o impacto é alto.
7. **O verificador do SWE-agent decide se o agente VOLTA A TRABALHAR**, não só se o achado passa. Essa peça não existe em nenhum reviewer de PR lido.
8. **Teto sempre existe; piso numérico nunca.** SWE-agent limita por custo ($3/instância) e chamadas de API (75–150 nos benchmarks), não por steps. Codesteward por wall-clock (8 min/specialist). pr-agent por chamadas (3) e findings (3). aider por reflexões (3).
9. **Codesteward é o único que trata "0 findings" como diagnóstico com causas distinguíveis** (`context_missing`, `specialist_timeouts`, `units_failed`, `all_candidates_dropped`, `all_units_clean`) — separando em código exatamente os nossos dois modos de falha.
10. **aider tem flags de comportamento por modelo (`lazy`, `overeager`) com prompts corretivos dedicados**, aplicados a listas nominais de modelos em `model-settings.yml`. É a resposta mais direta à pergunta 5 de todo o levantamento.
11. **Existe uma causa mecânica documentada em código para "Gemini devolve pouco/nada":** `reasoning_effort` descartado silenciosamente quando o modelo não está na lista, levando o thinking trace a consumir o orçamento de saída (`pr_agent/algo/__init__.py:394-398`).
12. **Nossos 15–53 tool calls por caso estão bem abaixo do orçamento que o SWE-agent considera normal** (75–150 chamadas de API por instância). Não estamos batendo em teto — estamos observando parada voluntária.

### 10.2 Hipóteses (minhas, não verificadas)

- **H1.** O gemini-3.7-flash com 15,4 chamadas pode não ser "parada precoce comportamental", e sim o bug de configuração de `pr_agent/algo/__init__.py:394-398` — `reasoning_effort`/thinking budget mal mapeado pelo cliente. **Testável e barato.** Se for isso, é bug nosso, e o benchmark publicaria um número errado sobre o modelo.
- **H2.** O gpt-5.6-terra (53,5 chamadas, 1,7 findings) está sendo cortado pelo nosso gate de verify, não pelo próprio modelo. Nenhum reviewer OSS põe barra de evidência no gerador. Se o nosso gate roda com o **mesmo** modelo que gerou, ele herda o viés — e o pr-agent trata essa coincidência como anomalia digna de `get_logger().warning` (`pr_code_suggestions.py:430`). **Testável:** recall antes e depois do gate, por modelo.
- **H3.** O gpt-5.6-terra é `lazy` no sentido do aider — trabalha e entrega de menos — e o fix pode ser tão barato quanto um `final_reminder` por modelo, não um redesenho. **Testável:** rodar o mesmo bench com `lazy_prompt` anexado só para esse modelo e medir o delta de findings/caso e recall.
- **H4.** Fan-out por partição eliminaria a variância entre modelos que hoje medimos. Se a exploração vira estrutura, o número de chamadas passa a ser função dos arquivos alterados, não do modelo. **Isso mudaria o que o benchmark mede** — é decisão de escopo, não só de engenharia.
- **H5.** O teto de 3 findings do pr-agent sugere que o mercado OSS otimiza precisão a custo de recall bem mais agressivamente do que o nosso bench pressupõe. Nosso deepseek-v4-pro (3,4 findings/caso, precisão 42,6%) já está acima do teto de reporte do reviewer OSS mais maduro.

---

## 11. Ações concretas propostas

Ordenadas por (valor / custo). As quatro primeiras não mudam o que o benchmark mede; a última muda.

### A1 — Auditar reasoning/thinking por modelo antes de publicar qualquer número

**Custo: horas. Prioridade: máxima.**

**Por quê:** `pr-agent/pr_agent/algo/__init__.py:394-398` documenta em código que `reasoning_effort` é **silenciosamente descartado** para modelos fora da lista, e que isso produz completion vazia no Gemini. Nosso gemini-3.7-flash com 1/3 das chamadas e 0,8 findings/caso é o sintoma exato. `aider/aider/models.py:791-805` mostra ainda que o **wire format muda por gateway** (`extra_body.reasoning.effort` no OpenRouter vs. `extra_body.reasoning_effort` direto) — mandar o campo errado é silencioso.

**O que fazer:** logar, por caso, os kwargs efetivamente enviados ao provider (`reasoning_effort`, `thinking`, `temperature`, `max_tokens`, headers) e o `finish_reason`. Se algum modelo terminar por `length` ou com reasoning descartado, o número atual é inválido.

**Referências:** `litellm_ai_handler.py:583-682` (normalização de prefixos empilhados `azure/openai/gpt-5...`), `aider/aider/models.py:791-805` e `:838-864`.

### A2 — Emitir "coverage gap" como saída de primeira classe

**Custo: baixo.**

**Por quê:** hoje "o modelo parou cedo" e "o modelo olhou e não achou nada" produzem o mesmo output. Codesteward separa em código.

**O que fazer:** portar `codesteward/packages/agents/src/session-audit.ts:585-635` — classificar todo caso com poucos/zero findings em `context_missing` / `stopped_early` / `all_candidates_dropped` / `clean`, e publicar a distribuição por modelo ao lado do recall. Isso converte "recall 11,6%" num diagnóstico.

Guia — `specialist-timeout.ts:26-29`:

> ```ts
> /**
>  * Explicit coverage-gap finding so a timed-out specialist is never mistaken for
>  * "role looked and found nothing." Severity is elevated for security.
>  */
> ```

### A3 — Implementar um `submit` que não submete na primeira chamada

**Custo: baixo-médio. Este é o item mais transplantável do documento.**

**Por quê:** é o único mecanismo lido que ataca a parada precoce **sem** confiar no modelo e **sem** mudar a arquitetura. Um contador de tool calls seria arbitrário; um gate de submissão é semântico.

**O que fazer:** transformar a ferramenta de conclusão do nosso loop no padrão de `SWE-agent/tools/review_on_submit_m/bin/submit:33-46` — na primeira chamada, em vez de encerrar, devolver ao modelo:

- a lista de arquivos alterados no PR **e quais deles ele ainda não abriu** (temos o replay determinístico; sabemos exatamente quais `readFile` ocorreram);
- os findings acumulados até agora;
- a instrução de revisar e chamar `submit` de novo.

Isso é o "você não olhou o arquivo X" que **não existe em nenhum harness lido** — nós temos o dado (replay de ferramentas) e eles não teriam como ter.

Adotar também a escapatória escondida (`SWE-agent/tools/review_on_submit_m/config.yaml:1-6`): o harness pode forçar a submissão após erro, mas o modelo não sabe que a flag existe.

**Medição:** o delta de tool calls e de recall entre a 1ª e a 2ª passada, por modelo, **é a medida direta de parada precoce**. Se o gemini sobe muito e o gpt-5.6-terra não sobe, os dois modos de falha ficam separados empiricamente.

### A4 — Mover a barra de evidência do gerador para o verify, e corrigir por modelo

**Custo: médio. Muda resultados.**

**(a) Trocar a instrução de evidência do gerador pela assimetria do pr-agent** — `pr_reviewer_prompts.toml:50-51`:

> ```
> - For clear bugs and security issues, be thorough. Do not skip a genuine problem just because the trigger scenario is narrow.
> - For lower-severity concerns, be certain before flagging. If you cannot confidently explain why something is a problem with a concrete scenario, do not flag it.
> ```

**(b) Adotar a terceira via em vez de suprimir** — `pr_reviewer_prompts.toml:55`:

> ```
> - When confidence is limited but the potential impact is high (e.g., data loss, security), report it with an explicit note on what remains uncertain. Otherwise, prefer not reporting over guessing.
> ```

**(c) Exigir `reasoning` estruturado no finding, para consumo do verify** — `prompt-pack.ts:71-74`. Hoje nosso gate provavelmente julga o finding sem ver o raciocínio que o produziu.

**(d) Rodar o verify com modelo e temperatura diferentes do gerador** — `verifier.ts:202` (`temperature: 0`) e `pr_code_suggestions.py:425` (`get_model('model_reasoning')`). Se hoje usamos o mesmo modelo nos dois papéis, o viés é aplicado duas vezes — e o pr-agent trata isso como anomalia digna de warning.

**(e) Trocar drop binário por veredito de 4 valores** — `verifier.ts:41-45` (`keep|drop|downgrade|upgrade`). `downgrade` preserva recall; `drop` não.

**(f) Adicionar `lazy` / `overeager` por modelo**, no padrão `aider/aider/coders/base_coder.py:1176-1179` + `base_prompts.py:12-20`. Concretamente: uma tabela `model → prompt_patch[]` no nosso harness, com um patch anti-`lazy` para o gpt-5.6-terra. É a intervenção de menor custo do documento inteiro e ataca diretamente o modo de falha "filtro na saída".

**Medição obrigatória:** recall pré-gate e pós-gate, por modelo. Sem isso não dá para saber se o gate é o problema (H2).

### A5 — Avaliar fan-out por partição como *modo alternativo* do bench

**Custo: alto. Muda o que medimos.**

**Por quê:** é a resposta arquitetural da tarefa, confirmada no código — `planner.ts:17-33` + `planner.ts:63-85` + `orchestrator.ts:918-920`.

**Ressalva séria:** isso **remove do modelo** a decisão de quanto explorar, que é o que o nosso bench mede hoje. Não é upgrade do harness; é um segundo eixo de medição.

**Proposta:** rodar os mesmos 30 PRs em dois modos e publicar os dois:
- **Modo `agent`** (atual): 1 sessão, modelo decide a exploração. Mede *agência*.
- **Modo `fanout`**: `ceil(N_arquivos / 12)` unidades × papéis fixos, 1 chamada por par. Mede *capacidade de análise com material igual*.

**O delta entre os modos, por modelo, separa exatamente os nossos dois modos de falha:** quem sobe muito no `fanout` estava parando cedo; quem não sobe estava filtrando na saída.

Custo estimado: PR de 30 arquivos, 4 papéis → 12 chamadas de geração + ~2 de verify = **~14 chamadas/PR**, contra 1 sessão hoje.

### A6 — Ler `software-agent-sdk` (OpenHands) antes de considerar o levantamento fechado

**Custo: baixo. Pendência conhecida.**

O `StuckDetector` e o juiz do `/goal` loop são exatamente o tipo de mecanismo que este documento procurava, e ficaram fora porque o repo `All-Hands-AI/OpenHands` virou frontend (§2.4). É a lacuna mais provável de conter material novo.

---

## 12. Rastro de auditoria

Clones e buscas em **2026-08-13**, com `git clone --depth 10..50`; as datas são do HEAD do branch default no momento do clone.

| Repositório | URL | HEAD | Data | Método |
|---|---|---|---|---|
| qodo-ai/pr-agent | https://github.com/qodo-ai/pr-agent | `20bc0fe8ae7c1494c0be580f7ceb35a1c45e5741` | 2026-08-10 | clone + leitura de `pr_agent/**` |
| Codesteward/codesteward | https://github.com/Codesteward/codesteward | `c7e769e1f38f4553780d32ae00e82d54b0f2311f` | 2026-07-21 | clone + leitura de `packages/agents`, `packages/model-router`, `packages/evals` |
| princeton-nlp/SWE-agent | https://github.com/princeton-nlp/SWE-agent | `3ea751c087f32b16e039a2233dd6eefecef325d5` | 2026-07-16 | clone + leitura de `sweagent/agent`, `sweagent/tools`, `tools/review_on_submit_m`, `config/**` |
| Aider-AI/aider | https://github.com/Aider-AI/aider | `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` | 2026-05-22 | clone + leitura de `aider/coders`, `aider/models.py`, `aider/resources/model-settings.yml` |
| All-Hands-AI/OpenHands | https://github.com/All-Hands-AI/OpenHands | `4f465f3ccada5271a3bbe4a0148941b0c40d243b` | 2026-08-12 | clone + leitura de `src/**` — **repo é o frontend; agente não está aqui (§2.4)** |
| withmartian/code-review-benchmark | https://github.com/withmartian/code-review-benchmark | `fbc5425c5eec52932aa1303708873d341968fa1c` | 2026-08-07 | clone + leitura de `offline/`, `online/` |
| MatterAIOrg/matter-ai | https://github.com/MatterAIOrg/matter-ai | `b454b81996003c67fe0e18d1b557545f30fb0921` | 2025-06-29 | clone + leitura de `src/` e histórico completo |
| reviewdog/reviewdog | https://github.com/reviewdog/reviewdog | `8b7da60453598458baaa399fcf59e304fd009e27` | 2026-08-13 | clone + grep por LLM |
| danger/danger-js | https://github.com/danger/danger-js | `532ea4b1ee23fa446b10f4dc386e270ed65d30b3` | 2026-08-04 | clone + grep por LLM |
| sourcery-ai/sourcery | https://github.com/sourcery-ai/sourcery | `d807cef24950045c7af65add3acf6044a053d7d9` | 2026-07-22 | clone (repo sem código de review) |
| kodustech/awesome-ai-code-review | https://github.com/kodustech/awesome-ai-code-review | `0be57537992bfe1a35c475ad591a36135c767a06` | 2026-06-28 | clone (lista) |

Verificações de código fechado, GitHub API, 2026-08-13:
- `GET /orgs/{coderabbitai,greptileai,CodeAnt-AI,withgraphite,semgrep}/repos?per_page=100&sort=pushed`
- `GET /orgs/{cubic-dev-ai,getcubic,baz-inc,macroscope-ai,graphite-dev,propelcode}/repos` → **404 / vazio**
- `GET /search/code?q=org:coderabbitai+system_prompt+OR+systemPrompt` → `total_count: 0`
- `GET /search/code?q=repo:semgrep/semgrep+assistant+OR+openai+OR+anthropic` → `total_count: 0`

Buscas de issues (`gh search issues`, 2026-08-13): `qodo-ai/pr-agent` × {`gemini stops early`, `not reporting`, `no suggestions returned`, `empty completion`} → 0; `princeton-nlp/SWE-agent` × `exit early` → 0; `SWE-agent/SWE-agent` × `submits too early` → 0.

---

## 13. Aviso final

Este documento transcreve código-fonte lido em **2026-08-13**. Os repositórios mudam; os números de linha valem para os HEADs do §12. Ausência de um mecanismo no código **não** é evidência de que a equipe o considerou e rejeitou — é só ausência. O `software-agent-sdk` do OpenHands não foi lido e é uma lacuna conhecida (§9, item 12). Onde interpretei, marquei como leitura ou hipótese.
</content>
