# ADR — Metodologia PUBLICADA dos produtos comerciais de code review com IA

**Status:** Levantamento de fontes primárias (não é decisão de arquitetura; não é validação do nosso bench)
**Compilado em:** 2026-08-13
**Autor:** levantamento automatizado de publicações dos próprios fornecedores
**Escopo:** codereviewbench.com / harness de avaliação interno da Kodus

---

## 1. Contexto e pergunta

Nosso bench mediu, em 30 PRs reais com 95 bugs golden, **um único loop de agente** com replay determinístico de ferramentas. Apareceram dois modos de falha distintos por modelo:

| Modo | Modelo | Tool calls/caso | Findings/caso | Recall | Precisão |
|---|---|---|---|---|---|
| **Parada precoce** | gemini-3.7-flash | 15.4 | 0.8 | 11.6% | 73.9% (6 FP em 30 PRs) |
| **Filtro na saída** | gpt-5.6-terra | 53.5 (o maior do bench) | 1.7 | 22.1% | — |
| (referência) | deepseek-v4-pro | 52.7 | 3.4 | 43.2% | — |

A pergunta deste documento é **estreita e documental**: o que os fornecedores comerciais **escreveram publicamente** sobre como seus agentes funcionam, e se eles tratam esses dois problemas. Não é uma comparação de produto, não é engenharia reversa e **não infere arquitetura a partir de comportamento observado**.

> **Aviso de método:** este documento é **coleta e transcrição de texto-fonte**. Fonte primária = publicação do próprio fornecedor (blog de engenharia, docs, changelog, paper). Onde a fonte é de terceiro, está **rotulada como tal**. Onde algo não é público, está escrito **NÃO ENCONTRADO** junto com o local da busca. Ausência de publicação **não** é ausência da técnica — vários desses sistemas são fechados e a maior parte da engenharia real nunca é publicada.

**Datas importam mais do que o normal aqui.** Este é um mercado que reescreveu sua arquitetura três vezes em 18 meses. Posts anteriores a 2025 estão marcados como **provavelmente obsoletos** e não devem ser usados como descrição do produto atual.

### 1.1 Matriz de cobertura — o que cada fornecedor publica

`✅` = publicado e citado neste documento · `~` = parcial/indireto · `✗` = NÃO ENCONTRADO

| Fornecedor | Arquitetura | Chamadas/PR | Cobertura do diff | Precisão vs ruído | Modelo | Verificação 2 estágios | Benchmark próprio |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Greptile** | ✅ (v2→v3→v5) | ~ | ✗ | ✅ | ✅ | ✅ | ✅ (50 bugs) |
| **CodeRabbit** | ✅ | ✗ | ~ | ✅ | ~ | ✅ | ✗ (reporta 3º) |
| **cubic** | ✅ | ✗ | ✗ | ✅ | ✅ | ~ | ✗ (reporta 3º) |
| **Qodo** | ✅ | ✗ | ~ | ✅ | ✗ | ✅ | ✅ (100 PR/580) |
| **Cursor Bugbot** | ✅ | ✗ | ✗ | ✅ | ~ | ✅ (abandonado) | ~ (BugBench, não público) |
| **Graphite** | ~ (2ª mão) | ✗ | ✅ (nega) | ✅ (3 números) | ~ (2ª mão) | ~ (2ª mão) | ~ (500 PR, sem métrica) |
| **CodeAnt** | ✅ (só CLI) | ~ | ✅ (nega) | ~ | ✗ | ✅ | ✗ (reporta 3º) |
| **Cognition / Devin** | ✅ (doutrina) | ✗ | ✅ (o melhor argumento) | ~ | ~ | ✅ (inter-agente) | ✗ p/ review |
| **Augment** | ✅ (duas, incompatíveis) | ✗ | ✗ | ✅ (inverteu) | ~ | ✗ | ✅ (50 PR, público) |
| **Macroscope** | ✅ (híbrido) | ✗ | ✅ ("every file") | ✅ (98%/85%/97%) | ✅ (o melhor) | ✅ (o melhor) | ✅ (118 bugs, indep.) |
| **Propel** | ✅ | ✗ | ✗ | ~ | ✅ (incidente) | ✅ (2 camadas) | ~ (re-roda a da Augment) |
| **Baz** | ✅ (por hipótese) | ✗ | ✅ (o melhor + métrica) | ~ | ~ | ✅ (o melhor) | ✅ (88 PR/148, não púb.) |
| **Sourcery** ⚠️ pré-2025 | ✅ (por hunk) | ~ | ✗ | ~ | ✗ | ✅ (experimento controlado) | ~ |
| **GitHub Copilot** | ✅ (loop único) | ✗ | ✅ (nega) | ✅ | ~ | ✗ | ✗ (interno) |
| **GitLab Duo** | ✅ (2 estágios) | **✅** | ✅ (nega) | ✗ | ✅ | ~ | ✗ |
| **Amazon Q / CodeGuru** | ~ | ✗ | ~ | ✗ | ✗ | ✗ | ✗ |
| **DeepSource** | ✅ | ✗ | ✅ | ✅ | ✅ | ~ | ✅ (165 CVE, dados públicos) |
| **Codacy** | ✅ | ~ | ✗ | ~ | ✅ | ✅ | ✗ |
| **Snyk / DeepCode** | ✅ | ~ | ✅ | ✅ | ✅ | ✅ | ✅ (arXiv + VulnBench) |
| **Cloudflare** (não-fornecedor) | ✅ | ~ | ~ | ✅ | ✅ | ✅ | ✗ |
| **Sider** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Sider é o único fornecedor da lista sem NENHUMA fonte pública** — o domínio não resolve (ver §3.14).

---

## 2. Resumo executivo — os cinco achados que mais importam

**(1) O mercado está genuinamente DIVIDIDO sobre loop único vs fan-out, e os dois lados publicaram migrações em direções OPOSTAS no mesmo período.** Isto foi a surpresa do levantamento. A leitura fácil ("todo mundo foi para multi-agente, estamos errados") **não se sustenta**:

| Fornecedor | Direção | Data | O que disseram |
|---|---|---|---|
| **Cursor Bugbot** | fan-out (8 passes + voting + validador) → **LOOP ÚNICO** | 2026-01-15 | *"We saw the **largest gains** when... we switched Bugbot to a fully agentic design"* |
| **Greptile** | fluxograma → **LOOP ÚNICO** (v3) | 2025-11-26 | *"We let the system run in a loop... a very high limit on how many times it can run LLM inference"* |
| **Greptile** | loop único → **enxame por hipótese** (v5) | 2026-08-05 | *"a swarm of agents that each explore one hypothesis"* |
| **Cognition** | doutrina *"just use a single-threaded linear agent"* → reversão **parcial**, só para escrita | 2025-06-12 → 2026-04-22 | *"writes stay single-threaded... additional agents contribute intelligence rather than actions"* |
| **GitHub Copilot** | mantém **loop único** com `grep`/`glob`/`view`, na maior escala pública | 2026-03-05 | *"agentic tool-calling architecture"* |
| **Macroscope** | default é **loop único**; fan-out é opt-in e mais caro | docs | *"`full_diff` (default): One agent processes the entire PR diff"* |
| cubic, Qodo, CodeAnt, Baz, Augment, Cloudflare, Codacy, DeepSource, Propel | monolito → **fan-out + juiz** | 2025-06 a 2026-07 | ver §3 |

A Greptile atravessou o loop único e saiu; a Cursor veio de fora e entrou. **Ambas atribuem ganhos à mudança, e nenhuma das duas fez ablação limpa** (§9.1). O consenso de marketing favorece o fan-out; a evidência controlada praticamente não existe.

**(2) QUATRO fornecedores publicaram, independentemente, o nosso modo de falha "FILTRO NA SAÍDA" — e a MESMA mitigação, que é de PROMPT.**
- **Cursor (2026-01-15):** *"With the agentic approach we encountered the opposite problem: **it was too cautious.** We shifted to **aggressive prompts**..."*
- **Greptile (2026-07-21):** GPT-5.5 identificava os bugs no raciocínio e não os postava; instruir *"target around 7 to 10 comments per review"* recuperou o recall.
- **Macroscope (2026-02-04):** *"**Prefer reporting MORE issues over fewer. False positives are acceptable; do not self-censor.**"*
- **Baz (2026-03-29):** *"we **over-generate** candidate bugs with models and filter them through judges"*

Isto é confirmação externa, independente e quádrupla do fenômeno que medimos no gpt-5.6-terra (53.5 tool calls, 1.7 findings/caso). **A mitigação publicada é de PROMPT, não de arquitetura** — excelente notícia para o nosso harness, e a recomendação nº 1 do §12.3. Ver §7.2, §3.7.1, §7.9.1 e §7.9.5.

**(3) TRÊS fornecedores publicaram o nosso modo de falha "PARADA PRECOCE" — e a Baz o separou do "filtro na saída" melhor do que nós.**
- **DeepSource (2026-02-24):** *"the most common failure wasn't wrong analysis. **It was zero output. The model skipped the vulnerable code entirely.**"*
- **Snyk (2026-06-29):** *"**stop after finding one representative example of a repeated pattern**"* — falha de **enumeração**, não de detecção.
- **Baz (2026-07-29):** *"**A model may correctly diagnose a vulnerability when shown the relevant path and still fail to search for that path in the first place**"* e *"It does not forget to search for a vulnerability class **because another code path consumed its attention**."*

Ver §4.2 e §4.2.1.1. Isso nomeia o gemini-3.7-flash (15.4 tool calls, 0.8 findings/caso) melhor do que nós nomeamos. **E a Cognition dá o enquadramento conceitual:** *"a search agent's 'I've looked everywhere' is **unfalsifiable**"* — que é a justificativa mais forte para instrumentarmos tool calls. **A Baz é o único fornecedor que expõe cobertura como métrica de produto**, o que valida a nossa escolha.

**(4) Os números públicos do mercado são muito menos independentes do que parecem.** Quatro fornecedores se declaram "#1" no mesmo benchmark de terceiro em datas diferentes de 2026 (§8.4), e o gold set *offline* desse benchmark descende de um único lote de **50 PRs** montado pela Greptile em jul/2025, republicado pela Augment (que se pôs em 1º) e re-rodado pela Propel (que se pôs em 1º **e removeu a Augment da tabela**) — §8.4.1. **Em cada elo da cadeia, quem republica o conjunto ganha.** As exceções honrosas são **Macroscope** (dataset independente + declaração de conflito de interesse) e **DeepSource** (dados brutos públicos + juiz cego).

**(5) Existe um vácuo metodológico real, e sabemos exatamente qual é.** Só a GitLab publica contagem de chamadas de LLM (§3.9); só a Cognition declara e justifica micro-vs-macro — e escolheu **macro** (§8.1.1); só a Baz publica cobertura como métrica (§4.2.1.1); e **ninguém** mede tool calls por modelo com harness fixo. O benchmark publicado mais parecido com o nosso é o da Baz (88 PRs, 148 achados semeados, modelos trocados sobre o mesmo harness) e **não é público** — §8.5.8. Podemos ocupar esse espaço, desde que corrijamos os problemas do §10 e sigamos as recomendações do §12.3.

---

## 3. Pergunta 1 — ARQUITETURA DECLARADA

> Loop único sobre o PR, ou fan-out (uma chamada por arquivo/hunk/símbolo)? Alguém publica quantas chamadas de LLM faz por PR? Alguém descreve indexação prévia em vez de exploração ao vivo?

### 3.1 Greptile — a trajetória completa v2 → v3 → v5 (a fonte mais valiosa do levantamento)

**(a) v2 = fluxograma rígido. v3 = LOOP ÚNICO.**

- **Link:** https://www.greptile.com/blog/greptile-v3-agentic-code-review
- **Data (byline na página):** 2025-11-26 — autor Daksh Gupta (co-fundador)

Sobre o v2, e por que ele falhava:

> "Crudely, v2 was a flowchart as shown in this image. The workflow receives the PR diff and metadata, has a well-defined codebase context step, and then a well-defined external context step. Lastly, it produces review comments."

> "There is an obvious limitation here, among others. The rigidity of the flowchart prevents the system from using new information that it gets from the search step."

O exemplo que eles dão do fracasso do fluxograma é exatamente o argumento a favor de um loop:

> "System is reviewing a file changing the login button `onClick` action / System uses codebase search to find the file where the `onClick` function is defined / Turns out the `onClick` function calls a function in a third file / System will never see that third file, it's moving on to the next step in the flowchart"

E a v3, que é **a nossa arquitetura, descrita por eles**:

> "In v3, we introduced a new approach to code review. We let the system run in a loop, with access to some key tools such as codebase search and accessing learned rules. The system has a very high limit on how many times it can run LLM inference or access tools, so it can continue recursively searching the codebase to follow nested function calls and do multi-hop 'thinking'."

Tradução: "No v3, introduzimos uma nova abordagem para code review. Deixamos o sistema rodar **em um loop**, com acesso a algumas ferramentas-chave como busca no codebase e acesso a regras aprendidas. O sistema tem um **limite muito alto de quantas vezes pode rodar inferência de LLM ou acessar ferramentas**, então pode continuar buscando recursivamente no codebase para seguir chamadas de função aninhadas e fazer 'pensamento' multi-hop."

E — importante para a nossa Pergunta 3 — eles atribuem ao loop um ganho **de precisão**, não só de recall:

> "A second, emergent effect is that higher precision, or in other words, a higher signal-to-noise ratio. Based on our study, the reason for this is likely an increased threshold for 'sureness' since v3 can challenge its own hypothesis more strongly. Naturally, this means lower confidence comments can be safely eliminated."

Números publicados v2 → v3 (base: "over 1B lines of code" revisadas):

| Métrica | v2 | v3 | Δ |
|---|---|---|---|
| Upvote/Downvote Ratio | 1.44 | 5.13 | +256% |
| Upvotes per 10K Comments | 109 | 183 | +68% |
| Action Rate (%) | 34.75 | 59.24 | +70.5% |

**(b) v5 = ENXAME DE AGENTES POR HIPÓTESE — a saída do loop único.**

- **Link:** https://www.greptile.com/blog/greptile-v5
- **Data (byline):** 2026-08-05 — Daksh Gupta

> "We rebuilt Greptile's agent architecture around the idea that agents perform better when their task is narrowly scoped."

> "Greptile V5 spins up a swarm of agents that each explore one hypothesis for a potential bug. Since these agents run in parallel, our end to end latency is much smaller. Because each agent is focused on a narrowly scoped task, it can explore much deeper when needed, making Greptile better at catching tricky bugs."

Tradução: "Reconstruímos a arquitetura de agente da Greptile em torno da ideia de que **agentes têm melhor desempenho quando sua tarefa tem escopo estreito**. O Greptile V5 sobe um **enxame de agentes que exploram, cada um, UMA hipótese** para um bug potencial. Como esses agentes rodam em paralelo, nossa latência ponta a ponta é muito menor. Porque cada agente foca numa tarefa de escopo estreito, ele pode **explorar muito mais fundo quando necessário**, tornando a Greptile melhor em pegar bugs difíceis."

Métricas publicadas v4 → v5 (base: A/B test de um mês, "live production data from over a million PRs"):

> "Median review time went down from 5:04 to 2:25 seconds." (sic — a unidade no original é inconsistente)
> "Percentage of Greptile comments addressed by the author increased from 52% to 66%."
> "Positive replies ('nice catch' or 'fixed') increased by 28.6% from 0.266 per pull request to 0.342 per pull request."

**Nota crítica sobre o eixo do fan-out:** o fan-out da Greptile v5 é **por HIPÓTESE DE BUG**, não por arquivo nem por hunk. Isso é uma distinção que importa para nós e que quase todo mundo confunde. Não é "quebre o diff em pedaços"; é "gere N hipóteses e dê um agente com orçamento próprio de exploração para cada uma".

**(c) Indexação prévia — sim, e é um agente separado e contínuo.**

- **Link:** https://www.greptile.com/blog/nvidia-nemotron-ultra-in-code-review
- **Data (byline):** 2026-06-04 — Chun-Wei Yang

> "To give Greptile that context, we run an agent that continuously crawls each customer's codebase and maintains a living internal wiki, a structured map of what the code does and how its pieces relate."

Tradução: "Para dar esse contexto à Greptile, rodamos **um agente que rastreia continuamente o codebase de cada cliente e mantém um wiki interno vivo**, um mapa estruturado do que o código faz e como suas peças se relacionam."

Gatilhos publicados na Fig. 04 do mesmo post: "Code merged to main" e "Continuous scheduled crawl"; o agente indexador "crawls every file in the repository, file after file".

**Isso é indexação prévia, não exploração ao vivo** — e é um custo de infraestrutura que o nosso bench, por construção (replay determinístico de ferramentas sobre um único PR), não modela.

### 3.2 cubic — de agente monolítico para micro-agentes por especialidade

- **Link:** https://www.cubic.dev/blog/learnings-from-building-ai-agents
- **Data:** 2025-06-19 — Paul Sanglé-Ferrière (co-fundador)

A arquitetura inicial, transcrita literalmente do post (é literalmente a nossa):

> "Our initial architecture of the AI Code Review Tool was straightforward but problematic: [diff] → [single large prompt with contextual codebase info] → [list of comments]"

O diagnóstico:

> "It looked clean in theory but quickly fell apart in practice: **Excessive false positives**: The agent often mistook style issues for critical bugs, flagged resolved issues, and repeated suggestions our linters had already addressed. **Users lost trust**... **Opaque reasoning**: Understanding why the agent made specific calls was practically impossible. Even explicit prompts like 'ignore minor style issues' had minimal effect."

> "We tried standard solutions—longer prompts, adjusting the model's temperature, experimenting with sampling—but saw little meaningful improvement."

A solução — fan-out **por especialidade**, não por arquivo:

> "Our breakthrough came from employing specialized micro-agents, each handling a narrowly-defined scope: **Planner**: Quickly assesses changes and identifies necessary checks. **Security Agent**: Detects vulnerabilities such as injection or insecure authentication. **Duplication Agent**: Flags repeated or copied code. **Editorial Agent**: Handles typos and documentation consistency. etc…"

> "Specializing allowed each agent to maintain a focused context, keeping token usage efficient and precision high. The main trade-off was increased token consumption due to overlapping context, managed through effective caching strategies."

Resultado publicado: **"51% fewer false positives"** e **"Median comments per pull request cut by half"**, sobre "hundreds of real pull requests from active open-source and private repositories" ao longo de seis semanas.

**Achado colateral muito relevante para o nosso bench — eles REMOVERAM ferramentas:**

> "Initially, the agent had extensive tooling: Language Server Protocol (LSP), static analysis, test runners, and more. However, explicit reasoning logs revealed most analyses relied on a few core tools, with extra complexity causing confusion and mistakes. We streamlined the toolkit to essential components only, a simplified LSP and a basic terminal. With fewer distractions, the agent spent more energy confirming genuine issues, significantly improving precision."

E a lição generalizada:

> "Simplify the toolset. Regularly evaluate your agent's toolkit and remove tools rarely used (less than 10% of tasks)."

**Isto é um contraponto direto à leitura ingênua do nosso próprio dado.** Nós medimos que mais tool calls correlaciona com mais recall (52.7 calls → 43.2% recall vs 15.4 calls → 11.6%). A cubic publicou que **reduzir o conjunto de ferramentas aumentou a precisão**. As duas coisas podem coexistir (menos ferramentas ≠ menos chamadas), mas isso é um alerta contra tratar "número de tool calls" como métrica de qualidade em si.

### 3.3 cubic — a declaração que CONTRADIZ frontalmente o loop único

- **Link:** https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark
- **Data:** 2026-03-25 — Paul Sangle-Ferriere

> "Most AI code review tools run a single LLM pass over the git diff. That approach hits a ceiling quickly. To break past the 40% F1 barrier, we had to change how the agent interacts with the code."

Tradução: "A maioria das ferramentas de AI code review roda **uma única passada de LLM sobre o git diff. Essa abordagem bate num teto rapidamente.** Para passar da barreira de 40% de F1, tivemos que mudar como o agente interage com o código."

**Ressalva importante de leitura:** "a single LLM pass over the git diff" **não é** a nossa arquitetura. A nossa é um loop agêntico com ferramentas — que é o que a Greptile chamou de v3 e que é claramente mais forte que "uma passada". A frase da cubic é marketing dirigido a um alvo mais fraco. Mas o número associado ("teto de 40% F1") é o tipo de afirmação que vale a pena termos em mente ao interpretar nosso recall de 43.2% no melhor modelo.

### 3.4 Qodo — multi-agente com agente-juiz

- **Link:** https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/
- **Data:** 2026-02-04 — Dedy Kredo (co-fundador)

> "Asking one reviewer or one agent to do all of this at once leads to tradeoffs between depth, speed, and coverage."

> "Qodo 2.0 addresses this with a multi-agent expert review architecture. Instead of treating code review as a single, broad task, Qodo breaks it into focused responsibilities handled by specialized agents. Each agent is optimized for a specific type of analysis and operates with its own dedicated context, rather than competing for attention in a single pass."

Tradução: "Pedir a **um** revisor ou a **um** agente que faça tudo isso de uma vez leva a trade-offs entre **profundidade, velocidade e cobertura**." / "...cada agente opera com seu próprio contexto dedicado, em vez de **competir por atenção numa única passada**."

A descrição do modo "Extended" é ainda mais explícita:

- **Link:** https://www.qodo.ai/blog/qodo-ranked-1-ai-code-review-tool-in-martians-code-review-benchmark/
- **Data:** 2026-03-15 — Elana Krasner

> "Qodo Extended achieved 64.3% F1 score. Currently in research preview, this is our orchestrated multi-agent layer. Rather than a single-pass review, it dispatches specialized agents, each tuned for specific categories like logical edge cases, security, and cross-file dependencies, and then merges their findings through a rigorous verification step."

**Este é o dado quantitativo mais útil de todo o levantamento para a nossa decisão**, porque a Qodo publicou os **dois** números, medidos pelo **mesmo** benchmark de terceiro, no **mesmo** post:

| Configuração Qodo | F1 | Posição |
|---|---|---|
| Qodo (Standard) — produção, alta precisão | 47.9% | #4 |
| Qodo Extended — multi-agente orquestrado + verificação | 64.3% | #1 |

E a leitura que eles próprios dão: "The results show that while both versions maintain high precision, **Qodo's Extended mode provides a massive recall boost**."

### 3.5 CodeRabbit — agentes em paralelo, com agente de verificação dedicado

- **Link:** https://docs.coderabbit.ai/overview/architecture
- **Data:** página de documentação, **sem data de publicação**. Acessada em 2026-08-13.

> "While other tools just scan your changed code, CodeRabbit **orchestrates an entire system** for every single review. This isn't a simple 'review this changeset' prompt to an LLM."

A lista literal de componentes:

> "Sandboxed cloud execution with your full repository cloned for isolated analysis / Multi-dimensional code analysis combining 50+ static analyzers, linters and SAST tools / Agentic exploration that autonomously investigates your codebase for context / **Specialized AI agents working in parallel: Review, Verification, Chat, Pre-Merge Checks** / Living memory that learns from your feedback, PRs, issues, and coding guidelines"

Note o **"Verification"** como agente de primeira classe, separado do "Review". Isso responde parcialmente à Pergunta 5 (§7).

Sobre indexação prévia:

- **Link:** https://www.coderabbit.ai/blog/how-coderabbit-delivers-accurate-ai-code-reviews-on-massive-codebases
- **Data:** 2025-09-05

> "CodeRabbit maintains a semantic index (embeddings) of functions, classes/modules, tests, and prior PRs/changes."

> "CodeRabbit builds a lightweight map of definitions and references and scans commit history for files that frequently change together."

Sobre um estágio de **roteamento** antes da review — fonte recente e explícita:

- **Link:** https://www.coderabbit.ai/blog/teaching-nvidia-nemotron-3-5-lightning-to-route-code-reviews
- **Data:** 2026-08-11 — Henry Lau, Juan Pablo Flores

> "Every CodeRabbit review begins with a routing decision. Our system evaluates code changes and converts the model output into a review configuration. Because routing is one of our highest-volume model tasks, it was a good place to test whether a smaller model could handle a real part of the review process."

Tradução: "**Toda review da CodeRabbit começa com uma decisão de roteamento.** Nosso sistema avalia as mudanças de código e converte a saída do modelo numa configuração de review."

O post descreve o roteador atribuindo "complexity tags" a uma mudança, que um scorer converte numa configuração de review. Ou seja: **a configuração da review (e portanto o esforço gasto) é decidida por um modelo separado, antes do agente revisor rodar.** Nosso harness não tem esse estágio.

**Fonte histórica, e marcada como obsoleta:**

- **Link:** https://www.coderabbit.ai/blog/coderabbit-deep-dive
- **Data:** **2023-08-22 — ANTERIOR A 2025, PROVAVELMENTE OBSOLETO** (o texto discute `gpt-3.5-turbo` com janela de 4K/16K e `gpt-4` com 8K)

Ainda assim é a descrição mais literal de fan-out por arquivo que encontrei em qualquer fornecedor:

> "To circumvent context size limits, CodeRabbit uses an innovative, multi-LLM and multi-stage approach to scale reviews for larger change sets."

> "This is often insufficient to pack larger change sets. To circumvent this, we provide various summaries **while reviewing changes to each file** and by smartly prioritizing context that is packed in each request."

Trate isso como arqueologia: a motivação declarada (janela de 8K) desapareceu. Não use como descrição do produto de 2026.

### 3.6 Cloudflare — fonte primária de engenharia, não-fornecedor

Não é um produto comercial de code review, mas é uma **descrição primária, datada e extraordinariamente detalhada** de um sistema de code review com IA em produção, por uma empresa de engenharia grande. Vale mais do que a maioria das páginas de marketing dos fornecedores.

- **Link:** https://blog.cloudflare.com/ai-code-review/
- **Data:** 2026-04-20 — Ryan Skidmore

Primeiro, a tentativa ingênua e o resultado (relevante como baseline):

> "So, we jumped to the next most obvious path, which was to grab a git diff, shove it into a half-baked prompt, and ask a large language model to find bugs. The results were exactly as noisy as you might expect, with a flood of vague suggestions, hallucinated syntax errors, and helpful advice to 'consider adding error handling' on functions that already had it."

A arquitetura final:

> "Rather than relying on one model with a massive, generic prompt, we launch up to seven specialised reviewers covering security, performance, code quality, documentation, release management, and compliance with our internal Engineering Codex. These specialists are managed by a coordinator agent that deduplicates their findings, judges the actual severity of the issues, and posts a single structured review comment."

Sobre autonomia dos subagentes (relevante para "quem controla a exploração"):

> "Each sub-reviewer runs in its own OpenCode session with its own agent prompt. **The coordinator doesn't see or control what tools the sub-reviewers use.** They are free to read source files, run grep, or search the codebase as they see fit, and they simply return their findings as structured XML when they finish."

Sobre como o diff é distribuído — **este é o mecanismo de cobertura mais concreto publicado por alguém**:

> "The system doesn't embed full diffs in the prompt. Instead, it writes per-file patch files to a `diff_directory` and passes the path. **Each sub-reviewer reads only the patch files relevant to its domain.**"

> "We also extract a shared context file (`shared-mr-context.txt`) from the coordinator's prompt and write it to disk. Sub-reviewers read this file instead of having the full MR context duplicated in each of their prompts. This was a deliberate decision, as duplicating even a moderately-sized MR context across seven concurrent reviewers would multiply our token costs by 7x."

Escala declarada: "We've been running this system internally across tens of thousands of merge requests."

### 3.7 GitHub Copilot code review — o ÚNICO que descreve um loop único com ferramentas ao vivo

Este é o achado que mais nos favorece: entre todos os fornecedores levantados, **a GitHub é o único cuja arquitetura declarada é a nossa**.

- **Link:** https://github.blog/changelog/2026-03-05-copilot-code-review-now-runs-on-an-agentic-architecture/ · **Data:** 2026-03-05

> "Copilot code review now runs on an agentic tool-calling architecture and is generally available for all users with Copilot Pro, Copilot Pro+, Copilot Business, and Copilot Enterprise."

> "Copilot code review now uses agentic tool calling to gather broader repository context as needed (e.g., relevant code, directory structure, and references) so feedback reflects how your changes fit into the larger architecture."

E o post de engenharia nomeia **as três ferramentas exatas** — é praticamente o nosso toolset:

- **Link:** https://github.blog/ai-and-ml/github-copilot/better-tools-made-copilot-code-review-worse-heres-how-we-actually-improved-it/ · **Data:** 2026-07-10 — Napalys Klicius

> "When we swapped in the better-maintained, shared tools that power the Copilot CLI, `grep`, `glob`, and `view`, we expected a clean upgrade."

> "Start from the diff. Narrow first with `grep` and `glob`; read exact evidence with `view`. If `grep` fails to find relevant context, retry with a simpler escaped search. If a path is wrong, pivot to `glob` instead of guessing nearby paths."

**Pré-indexação na GitHub: NÃO ENCONTRADO.** Nenhuma menção a embeddings, code graph ou índice AST. O único mecanismo persistente é memória entre reviews.

Mas note que **mesmo a GitHub não roda o loop puro**: acopla ferramentas determinísticas por cima e pré-computa um plano.

> "Copilot code review (CCR) now blends LLM detections and tool calling with deterministic tools like ESLint and CodeQL" — https://github.blog/changelog/2025-10-28-new-public-preview-features-in-copilot-code-review-ai-reviews-that-see-the-full-picture/ · 2025-10-28

> "It keeps long pull requests reviewable with an explicit plan: It can map out its review strategy ahead of time, significantly improving its performance on long, complex pull requests, where context is easily lost." — https://github.blog/ai-and-ml/github-copilot/60-million-copilot-code-reviews-and-counting/ · 2026-03-05

### 3.7.1 🟢 Cursor Bugbot — ABANDONOU o fan-out com voting e validador PARA ADOTAR O LOOP ÚNICO

**Esta é a fonte mais importante de todo o documento para a defesa da nossa arquitetura, e é o único caso publicado de um fornecedor indo na direção contrária ao consenso.** Verificada por mim diretamente contra o HTML da página.

- **Link:** https://cursor.com/blog/building-bugbot
- **Data:** **2026-01-15** — Jon Kaplan (Cursor / Anysphere)

**A arquitetura ANTIGA (v1, jul/2025) era exatamente o padrão que todo o resto do mercado adota hoje** — fan-out + voting + validador:

> "One of the most effective quality improvements we found early on was **running multiple bug-finding passes in parallel and combining their results with majority voting.** Each pass received a different ordering of the diff, which nudged the model toward different lines of reasoning. When several passes independently flagged the same issue, we treated it as a stronger signal that the bug was real."

O fluxo literal, em sete passos:

> "Run **eight parallel passes** with randomized diff order / Combine similar bugs into one bucket / **Majority voting** to filter out bugs found during only one pass / Merge each bucket into a single clear description / Filter out unwanted categories (like compiler warnings or documentation errors) / **Run results through a validator model to catch false positives** / Dedupe against bugs posted from previous runs"

**E então trocaram — pelo loop único, com o maior ganho da série:**

> "**We saw the largest gains when, this fall, we switched Bugbot to a fully agentic design. The agent could reason over the diff, call tools, and decide where to dig deeper instead of following a fixed sequence of passes.**"

Tradução: "**Vimos os maiores ganhos quando, neste outono, trocamos o Bugbot para um design totalmente agêntico. O agente podia raciocinar sobre o diff, chamar ferramentas e decidir onde cavar mais fundo, em vez de seguir uma sequência fixa de passes.**"

**🔴 E AQUI ESTÁ O PARÁGRAFO MAIS IMPORTANTE DE TODO O LEVANTAMENTO PARA NÓS:**

> "**The agentic loop forced us to rethink prompting. With earlier versions of Bugbot we needed to restrain the models to minimize false positives. But with the agentic approach we encountered the opposite problem: it was too cautious. We shifted to aggressive prompts that encouraged the agent to investigate every suspicious pattern and err on the side of flagging potential issues.**"

Tradução: "**O loop agêntico nos obrigou a repensar o prompting. Com versões anteriores do Bugbot, precisávamos CONTER os modelos para minimizar falsos positivos. Mas com a abordagem agêntica encontramos o problema OPOSTO: ele era cauteloso demais. Mudamos para prompts agressivos que encorajavam o agente a investigar todo padrão suspeito e a errar pelo lado de sinalizar problemas potenciais.**"

**Isto é o nosso modo de falha "FILTRO NA SAÍDA", nomeado por um fornecedor como propriedade INTRÍNSECA do loop agêntico, com a mitigação publicada.** E converge exatamente com o achado independente da Greptile (§7.2), que recuperou o recall do GPT instruindo um alvo de 7–10 comentários. **Dois fornecedores, com arquiteturas diferentes, chegaram à mesma conclusão: o loop único é sub-reportador por padrão, e a correção é de prompt, não de arquitetura.**

Sobre a importância do design de ferramentas — diretamente relevante ao nosso replay determinístico:

> "The same setup lets us iterate directly on the toolset itself. Because the model's behavior is shaped by the tools it can call, **even small changes in tool design or availability had an outsized impact on outcomes.** Through multiple rounds of iteration, we adjusted and refined that interface until the model's behavior consistently aligned with our expectations."

> "We were able to shift more information out of static context and into dynamic context... **The model consistently pulled in the additional context it needed at runtime, without requiring everything to be provided ahead of time.**"

**Este último trecho é evidência direta contra a tese da DeepSource/Codacy de que é preciso pré-computar contexto.** Cursor mediu o oposto.

**Métricas publicadas** (v1 jul/2025 → v11 jan/2026, "more than two million PRs per month"):

| Métrica | Antes | Depois |
|---|---|---|
| Resolution rate | 52% | **>70%** |
| Bugs sinalizados por run | 0.4 | **0.7** |
| Bugs resolvidos por PR | ~0.2 | **~0.5** |

> "Since launch, we have run **40 major experiments**..."
> "Newer versions caught more bugs **without a comparable rise in false positives**."

**Observação incômoda e importante para calibrarmos expectativas:** o Bugbot em produção sinaliza **0,7 bugs por run**. Nosso deepseek-v4-pro produz **3,4 findings/caso** e nosso gpt-5.6-terra produz **1,7**. Ou seja, **até o nosso modelo mais "calado" fala mais do que o produto comercial da Cursor.** Isso reforça o ponto do §4.3: nosso conjunto tem prevalência de bugs de 100% por construção, enquanto os PRs reais que o Bugbot vê majoritariamente não têm bug. Os números não são comparáveis, e não devemos apresentá-los como se fossem.

**Honestidade metodológica notável, e um alerta:**

> "We ran dozens of experiments across models, prompts, iteration counts, validators, context management, category filtering, and agentic designs. **Many changes, surprisingly, regressed our metrics.**"

**Nota de consolidação do mercado, que reduz a independência deste datapoint no futuro:** a Graphite foi **adquirida pela Cursor em dez/2025**, com o objetivo declarado de *"Combine the best of Graphite's AI Reviewer and Cursor's Bugbot into the most powerful AI reviewer on the market."* Graphite e Cursor haviam convergido, no fim de 2024, para **a mesma arquitetura** (passes decompostos + voting + self-critique). A Cursor publicou que abandonou a dela; a Graphite nunca publicou o que aconteceu com a sua. **A partir de 2026, os dois deixam de ser observações independentes.**

### 3.7.2 🟢 Cognition (Devin) — a doutrina publicada mais explícita a FAVOR do agente único

A Cognition é o único fornecedor que publicou uma **doutrina arquitetural** sobre o assunto, e ela é contra multi-agente. Duas peças, com uma reversão parcial entre elas.

**(a) "Don't Build Multi-Agents"** — https://cognition.com/blog/dont-build-multi-agents · Walden Yan · **2025-06-12** — ⚠️ parcialmente superada pela peça (b)

> "**Principle 1** — Share context, and share full agent traces, not just individual messages"
> "**Principle 2** — Actions carry implicit decisions, and conflicting decisions carry bad results"
> "**The simplest way to follow the principles is to just use a single-threaded linear agent**"
> "...in 2025, running multiple agents in collaboration only results in fragile systems. The decision-making ends up being too dispersed and context isn't able to be shared thoroughly enough between the agents."

**(b) "Multi-Agents: What's Actually Working"** — https://cognition.com/blog/multi-agents-working · Walden Yan · **2026-04-22** — e a reversão é **sobre code review especificamente**

> "we've found a narrower class of patterns that do: setups where **multiple agents contribute intelligence to a task while writes stay single-threaded**."
> "**multi-agent systems work best today when writes stay single-threaded and the additional agents contribute intelligence rather than actions.**"
> "most multi-agent setups in the world are limited to 'readonly' subagents, like web search subagents and code search subagents… **These types of subagents mostly resemble tool calls rather than true multi-agent collaboration.**"

**E o achado sobre isolamento de contexto entre autor e revisor, que é diretamente relevante ao nosso desenho:**

> "**Interestingly, we found this technique to work best when the coding and review agents do not share any context beforehand.**"
> "The dedicated review agent gets to skip this extraneous context, only look at the diff, and re-discover any context it needs as it reads the code from scratch."
> "**With a shorter context, the improved intelligence naturally leads to increased detection of nuanced issues.**"

**Leitura:** esta é a defesa mais forte, publicada, do formato exato do nosso harness — um revisor único, sem contexto herdado, que redescobre o que precisa a partir do diff. E é a mesma empresa que, quando precisa de cobertura garantida, usa fan-out (ver §4.2.1) — mas explicitamente **não** para review de diff.

**(c) A posição anti-embedding da Cognition** — https://cognition.com/blog/swe-grep · **2025-10-16**

> "**Embedding Search (RAG)**: once the upfront work of indexing the codebase is done, queries are fast." / "The results can be inaccurate, especially for complex queries that require to jump across the codebase multiple times" / "**The embeddings can even be counterproductive, as the agent can give too much weight to irrelevant information.**"
> "**Agentic Search**: the model uses CLI tools to explore a codebase, much like a human would do."
> "we found that we can get strong results with only **4 serial turns** – by leveraging highly parallel tool calls" / "trained the SWE-grep models to run **8 parallel tool calls** (grep, glob search, reads, etc.) at each turn"

**Nota importante sobre contagem:** "4 serial turns × 8 parallel tool calls" = **até 32 tool calls**, e é a segunda âncora numérica externa que temos para os nossos 15–54. Ressalva: é o modelo de *busca* deles, não o revisor de PR.

### 3.7.3 Augment Code — publicou DUAS arquiteturas incompatíveis com 5 meses de diferença

Ambas continuam no ar, o que torna a Augment um caso ruim para citar sem data.

**Fase 1 — agente único com ferramentas** (é a nossa arquitetura). "How we built a high-quality AI code review agent", Akshay Utture, **2026-03-10** — https://www.augmentcode.com/blog/how-we-built-high-quality-ai-code-review-agent

> "The review agent needs to navigate a repository the way a human reviewer would. To enable that, we designed a set of tools that that lets the agent explore code safely and efficiently." *(o "that that" é do original)*
> "Tools for semantic code-context retrieval, file browsing, and symbol search."
> "**Minimal functional overlap between tools to avoid confusing the model about which one to invoke.**"
> "**Deterministic injection of large inputs like PR diffs and existing review comments, rather than retrieving them through tools.**"
> "Observability around tool usage so we can understand how the agent navigates a repository during review."

**As duas linhas em negrito são decisões de design do harness que valem a pena copiarmos e testarmos**, e a segunda em particular: injetar o diff deterministicamente em vez de deixar o agente buscá-lo remove uma classe inteira de parada precoce (o agente não pode "esquecer" de ler o diff).

Busca explícita nesse post por "parallel", "sub-agent", "multi-agent", "pass", "stage", "pipeline", "filter", "verify", "validate", "confidence" → **NÃO ENCONTRADO**. O loop aparece só como imagem, nunca descrito em prosa.

**Pré-indexação: sim, explícita** — o "Context Engine":

> "Most AI code review tools operate almost entirely on the PR diff, and rely on pattern-based grep-search to gather relevant code context outside the diff. That approach breaks down quickly in large, messy codebases."
> "**The Context Engine is not just grep or keyword matching. It is a full search engine for your code that retrieves the right slice before the model spends tokens exploring.**" (https://www.augmentcode.com/context-engine, sem data)

⚠️ **A Augment nunca diz se o índice é embeddings, AST ou grafo de símbolos.** Nenhuma página do fornecedor usa "embedding", "vector" ou "AST". Blogs de terceiros afirmam um tri-índice "vector + graph + BM25" — **isso NÃO é rastreável a nenhuma publicação da Augment e não está reportado aqui como tal.**

**Fase 2 — "Cosmos", multi-agente explícito** (mai–jun/2026):

> "**Cosmos orchestrates specialized review agents** that assess risk, catch issues, and surface the decisions that require human judgment." / "**A team of agents on every PR.**" (https://www.augmentcode.com/solutions/code-review, sem data)
> "It splits the code review process into **four coordinated loops**: change execution (PR Author), risk analysis (PR Risk Analyzer), correctness (Bug Reviewer), and system design judgment" — **2026-05-06**
> "**Cosmos is not a single agent. It's not a workflow engine. It's the operating system that turns agents and humans into a coordinated team**" — Chris Kelly, **2026-06-03**

**Se os Experts rodam em paralelo: NÃO ENCONTRADO.** Custo por review publicado: "average cost per PR review: 2,400 credits (~$1.50)".

### 3.7.4 Macroscope — híbrido declarado: índice AST pré-construído + exploração agêntica ao vivo

- **Link:** https://macroscope.com/blog/introducing-macroscope · Kayvon Beykpour (CEO) · **2025-09-17**

> "**The most important part of this perception layer is our 'code walking' system. Walkers traverse the Abstract Syntax Tree (AST) of your code, constructing a graph of your entire codebase.**"

E a doc explicita o híbrido — https://docs.macroscope.com/bug-detection-and-fixes:

> "**Macroscope reviews every file in a PR.** For ten natively-supported languages, dedicated AST codewalkers build a reference graph for lower-latency reviews. All other languages — including Elixir, Starlark, C/C++, PHP, and more — are **fully reviewed via Macroscope's agentic analysis engine**."

**Fan-out configurável, com o número publicado** — https://docs.macroscope.com/check-run-agents:

> `full_diff` (default): "**One agent processes the entire PR diff**"
> `code_object`: "**Up to 20 agents in parallel, one per changed code object**"
> Blog **2026-05-27**: "code_object dispatches up to 20 parallel agents, each reviewing an individual function or class — **higher cost, higher coverage**."

**Note que o DEFAULT da Macroscope é o loop único sobre o diff inteiro**, e o fan-out é opt-in com trade-off explícito de custo. Nenhuma menção a "embeddings", "vector" ou "RAG" em nenhuma página: **NÃO ENCONTRADO**.

A Macroscope também se posiciona explicitamente contra a chamada única — https://macroscope.com/content/what-is-agentic-ci-ai-agents-pull-request-checks, **2026-05-04**:

> "The earlier generation of AI code review tools — including most CodeRabbit and Greptile workflows — **runs as a single LLM call on the diff.** The model sees the patch, returns comments, and exits. That is AI in CI, but it is not agentic CI."

### 3.7.5 Propel — multi-modelo com camada de validação agêntica

- **Link:** https://docs.propelcode.ai/ (sem data)

> "Propel is an independent AI code review layer that reviews every pull request with **multi-model analysis and agentic validation**."
> "Unlike single-model reviewers or linters that operate in isolation, **Propel orchestrates multiple frontier models, validates findings through an agent layer**, and applies your company-specific rules and knowledge base to produce broader coverage with less noise."

Changelog, **2026-02-17**: "**We modularized each step of Propel's review workflow so we can optimize each step independently.** This improves coverage and reduces noise."

⚠️ **Contradição não reconciliada na própria Propel:** o estudo de caso do parceiro de vector-DB (Chroma) diz *"Customer repositories are **continuously indexed** in Chroma Cloud"*, enquanto https://www.propelcode.ai/security diz *"**Zero Data Retention**... Code is analyzed in memory and **never permanently stored**... Data is purged immediately after analysis completion"*. **Nenhuma reconciliação publicada.**

### 3.7.6 Baz — fan-out por HIPÓTESE DE RISCO, com seção intitulada "Why single-agent approaches fall short"

Junto com a Greptile v5, é o fan-out cujo eixo é **hipótese**, não arquivo — o desenho mais interessante para nós.

- **Link:** https://baz.ai/resources/blog/engineering-intuition-at-scale-the-architecture-of-agentic-code-review — Omri Levy · **Data:** **2025-12-15**

Título da seção, literal: **"Why single-agent approaches fall short"**.

> "Instead of relying on a predefined workflow missing critical code base 'interaction', we shifted to a **multi-agent architecture** that can query and engage with a code base. By breaking reviews into phases—**context mapping, intent inference, Socratic questioning, and targeted investigations**—we built an agentic reviewer that reasons more like a senior engineer and produces consistent results."

O fluxo publicado, em cinco fases:

> "**Context Mapping** — Locate where the PR introduces changes in the broader codebase...
> **Intent Inference** — Infer what the PR is trying to achieve from the title, description, commit messages, ticket - and the code itself.
> **Socratic Questioning** — Generate probing validation questions that challenge assumptions and common pitfalls
> **Targeted Investigation (multi-agent)** — **Spawn independent sub-agents, each assigned to prove or disprove one risk.** They traverse the repo, read diffs and files, run searches, and **manage their own task queues**.
> **Reflection & Consolidation** — Aggregate findings, filter false positives, and surface a concise report: evidence, rationale, and a **yes/no verdict** for each risk."

E a arquitetura declarada, incluindo o modelo:

> "Architecture at a glance — Independent agents with defined contracts (**input = risk hypothesis, output = evidence + verdict**). Tool integrations for code search and schema parsing. Repo access with read-only constraints and scoped search to reduce cost. **GPT-5 by OpenAI with low reasoning**, no compiling code or real 'static' checks"

**Restatado 15 meses depois, com o modo de falha nomeado** — https://baz.ai/resources/research/the-anatomy-of-code-review-accuracy · Nimrod Kor · **2026-03-29**:

> "**A single agent attempting to do everything produced brittle behavior and opaque failure modes.** Replacing that monolith with a meta agent, repo-local skills and narrow subagents changed how the reviewer behaved and how we operated it."
> "Subagents are narrow and single-purpose... **Narrow responsibilities made subagents easy to unit test, instrument, and roll back.**"

**Note o argumento de engenharia, não de qualidade:** testabilidade, instrumentação e rollback. É o argumento pró-fan-out mais honesto do corpus — e **não** é um argumento sobre recall.

**Pré-indexação: sim, com embeddings, e explicitamente NÃO por arquivo** — https://baz.ai/docs/agents/baz-agents (docs, sem data):

> "**Rather than assessing changes on a per-file basis, these agents consider the entire repository and its external context. The codebase is split into indexable units, and embeddings with similarity measures are used to retrieve relevant code and tests.**"

E os estágios com modelos e orçamentos distintos (2026-07-22):

> "For Baz, that behavior includes flow mapping, repository context retrieval, reviewer-specific tool use, deep exploration, security analysis, dependency analysis, and finding generation. **These stages use different prompts, tools, models, and timeout budgets.**"

### 3.7.7 Sourcery — fan-out por HUNK (⚠️ pré-2025, provavelmente obsoleto)

**A descrição de fan-out por hunk mais explícita do corpus — e a mais antiga.** Todo o material metodológico da Sourcery é de 2024; o blog deles não publica sobre metodologia de review desde então. Tratar como arqueologia.

O ponto mais relevante para nós é que a Sourcery reporta **economia de tokens** como motivação do fan-out (−77% vs chamada única), não recall. Ver §7.9.6 para o material de verificação deles, que é o mais valioso.

⚠️ **Ressalva de escopo:** a descrição do pipeline por hunk aparece no contexto do **complexity check** especificamente. A Sourcery generaliza a técnica no texto, mas **nunca afirma que essa é a arquitetura de todos os tipos de comentário**. Não superinterpretar como "a arquitetura do revisor deles".

### 3.8 GitLab Duo — pipeline de dois estágios em que o revisor NÃO pode buscar contexto

**Contradiz frontalmente o loop agêntico.**

- **Link:** https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/ · **Data:** GA no GitLab 18.8; acessado 2026-08-13

> "Code Review Flow runs in two stages: **Pre-scan**: The flow inspects the merge request diffs and uses them to identify related context to fetch from the project repository... **Review**: The flow runs the review with the following data in the large language model. **The review stage cannot fetch additional context on demand.**"

Isto é *retrieval-then-generate*, não um loop. O agente nunca decide buscar mais nada.

### 3.9 Chamadas de LLM por PR — o ÚNICO número publicado no mercado inteiro

**A GitLab é a única fonte que publica contagem de chamadas de LLM por review.** Está na doc do Security Review Flow (que roda ao lado do Code Review Flow):

- **Link:** https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/security_review/ · **Data:** Beta, GitLab 19.1; acessado 2026-08-13

| Review complexity | Approximate LLM calls | Estimated credits |
|---|---|---|
| "Small diff or a few changed files" | **~16** | ~8 |
| "Standard feature branch" | **~28** | ~14 |
| "Large or logic-heavy multi-file change" | **~40** | ~20 |

> "Security Review Flow uses GitLab Credits each time it performs a review. Credit usage scales with diff complexity and the model you select."

**Esta é a única âncora externa que temos para os nossos 15.4–53.5 tool calls por caso.** Duas leituras, ambas importantes:

1. A ordem de grandeza **bate** com a nossa: dezenas de chamadas por review, não centenas nem unidades. Nossos 44–54 tool calls estão no topo da faixa da GitLab (~40 para "large or logic-heavy multi-file change"), e os 15.4 do gemini-3.7-flash estão exatamente no piso dela (~16 para "small diff or a few changed files"). Ou seja: **o gemini-3.7-flash trata PRs reais como se fossem diffs triviais.** Isso é uma forma nova e muito mais forte de enunciar o achado de parada precoce.
2. **O número da GitLab escala com o tamanho do diff por construção (fan-out), o nosso não.** Num loop único, a contagem é uma consequência emergente do comportamento do modelo. É por isso que ela varia 3.5× entre modelos no nosso bench e não varia entre modelos no deles.

**Ressalva obrigatória:** os números da GitLab são do *Security* Review Flow, não do *Code* Review Flow. Para o Code Review Flow a contagem é **NÃO ENCONTRADA** — só existe o preço fixo de US$ 0,25/review (https://about.gitlab.com/blog/agentic-code-reviews-with-flat-rate-pricing/, 2026-03-19).

### 3.10 Fan-out com granularidade PUBLICADA — Codacy e Snyk

Os dois únicos casos em que o eixo do fan-out está documentado numericamente.

**Codacy** — https://docs.codacy.com/codacy-ai/codacy-ai/ · **Data:** "Last updated: April 2, 2026"

> Smart False Positive Triage — "To detect a Possible False Positive, Codacy only processes the specific issue context: **one request per file with issues**. No additional repository data is sent or used."

> AI-enhanced comments — "To generate an AI-enhanced comment, Codacy only processes the specific issue context: **the issue line plus up to ten lines before and ten lines after that line**."

**Snyk** — https://snyk.io/blog/ai-code-security-snyk-autofix-deepcode-ai/ · **Data:** 2024-04-23 — **ANTERIOR A 2025, e a arquitetura foi substituída em 2026**

> "**For each issue encountered, Snyk Agent Fix generates 5 different fix candidates.**"

### 3.11 DeepSource — análise estática primeiro, com pré-indexação servida ao agente como ferramentas

O contraste mais explícito com exploração ao vivo via grep, e é nominal.

- **Link:** https://deepsource.com/blog/deepsource-next · **Data:** 2026-02-24 — Jai Pradeesh & Sanket Saurav

> "We've spent the last several years building static analysis infrastructure used by thousands of engineering teams. Today, we're putting an AI code review agent on top of it, which has structured access to data-flow graphs, taint maps, control-flow analysis, and 5,000+ static analyzers worth of findings before it can start reasoning about code on its own."

O pipeline em três passos, literal:

> "— 5,000+ static analyzers run first, catching known vulnerability classes and establishing a high-confidence baseline. — Our extended static anlaysis harness builds code intelligence stores — data-flow graphs, control-flow graphs, taint source-and-sink maps, reachability analysis, import graphs, and per-PR ASTs. — The AI Review agent is seeded with the baseline findings and can query the stores as tools during its review." *(o typo "anlaysis" é do original)*

E a crítica direta à exploração por grep:

> "When our AI agent reviews your code, it's not reading source files in isolation or relies only on `grep`-based exploration. It has structured access to how data moves through your application, which paths are reachable, where untrusted input enters and where it ends up."

### 3.12 Codacy — crítica nominal aos loops agênticos com estado

- **Link:** https://blog.codacy.com/deterministic-static-analysis-for-ai-coding-workflows-how-to-cut-token-cost-without-weakening-code-review · **Data de publicação NÃO EXPOSTA no HTML.** Acessado 2026-08-13.

> "This article is about changing that order of operations: **using deterministic static analysis to narrow the review surface first, then spending LLM reasoning on the smaller set of questions that actually require judgment.**"

> "**Stateful agent loops can keep carrying earlier tool output into later calls**, while known rule violations are repeatedly handed to inference even when a deterministic check could have settled them before the model started exploring."

> "A cost-aware AI SDLC sequences this deliberately: **deterministic checks run first and remove the noise, and only the smaller, genuinely ambiguous residue gets handed to a model for interpretation.**"

### 3.13 Amazon Q Developer — filtragem ANTES da review

- **Link:** https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/code-reviews.html · acessado 2026-08-13

> "Reviews are powered by both generative AI and rule-based automatic reasoning."

> "**Before starting a code review, Amazon Q applies filtering to ensure that only relevant code is reviewed.** As part of the filtering process, Amazon Q excludes unsupported languages, test code, and open source code."

**Aviso de obsolescência sobre o CodeGuru Reviewer:** "As of November 7, 2025, you can't create new repository associations in Amazon CodeGuru Reviewer." (banner em https://docs.aws.amazon.com/codeguru/latest/reviewer-ug/how-codeguru-reviewer-works.html). Toda a doc técnica do CodeGuru Reviewer é **pré-LLM** ("program analysis combined with machine learning models trained on millions of lines of Java and Python code") e não deve ser usada como descrição de produto vivo.

### 3.13.1 CodeAnt — a declaração de fan-out por arquivo MAIS LITERAL do corpus

- **Link:** https://docs.codeant.ai/cli/review.md
- **Data:** sem data na página; `sitemap.xml` `<lastmod>` = **2026-07-27**

> "The review runs in a **multi-phase pipeline**:"
> "**Each changed file is analyzed independently and in parallel.**"
> "For each file, the agent: 1. Receives the diff and full file content / 2. Can use tools to read other files, search the codebase, and explore directory structures / **3. Iterates through up to 5 conversation turns to gather context and form suggestions** / 4. Returns file-specific suggestions with severity labels"
> "**After all per-file analyses complete, the reflector phase:** 1. Combines all per-file suggestions / 2. Runs a final analysis pass to deduplicate, refine, and prioritize / 3. Produces the final set of code suggestions"

Ferramentas do agente: **Read, Glob, Grep, LS** — praticamente idênticas às nossas.

**Esta é a arquitetura mais próxima de um "nosso loop, mas por arquivo" que existe publicada.** E note o número: **até 5 turnos de conversa por arquivo**. Num PR de 10 arquivos, isso é um teto de 50 turnos — a mesma ordem de grandeza dos nossos 44–54 tool calls por caso, mas **distribuída por construção** em vez de emergente.

**Isso sugere uma variante de harness testável e barata para nós:** manter o loop único, mas **iterar o diff arquivo a arquivo com orçamento fixo por arquivo**, e comparar recall contra o loop livre. Isso isolaria diretamente a hipótese de que a parada precoce é um problema de alocação de atenção, não de capacidade.

🚩 **Ressalva de escopo obrigatória:** isto documenta o revisor **CLI/local** da CodeAnt. A CodeAnt **não publica** descrição de fases do revisor **hospedado** de PR no GitHub/GitLab. Tratar o pipeline do CLI como a arquitetura do produto hospedado seria inferência — para o revisor hospedado, arquitetura permanece **NÃO ENCONTRADO**.

Corroboração num terceiro documento — https://docs.codeant.ai/api-reference/agent-analysis/get-agent-scan-results (`<lastmod>` 2026-07-31):

> "returns deduplicated issues found across all analyzed files. Issues are deduplicated using LLM-based analysis to remove duplicate findings **across files**."

E o limite duro que **garante ausência de cobertura** (https://docs.codeant.ai/cli/review):

> "**Maximum files per review: 10 unique files**" / "Files exceeding these limits are skipped with a warning."

**Aviso sobre as fontes da CodeAnt — relevante para qualquer citação que façamos deles.** A CodeAnt mantém duas trilhas de publicação que se contradizem, ambas primárias:

| Afirmação | Docs de engenharia | Blog de GTM |
|---|---|---|
| Retrieval | "**Why RAG is not the primary component**" (≤2025-08-04) | "**RAG-based codebase indexing**" (fev/2026) |
| LSP | "**LSP is not the answer**" | "**The Real Solution: LLMs Augmented with Language Server Protocols**" (mai/2025) |
| Falso positivo | *(nenhum número)* | "**<5% false positive rate**" (fev/2026) — contra os próprios **52.2% de precisão ≈ 48% de FPR** (mar/2026) |
| Recall | *(nenhum)* | "**92% recall**" (fev/2026) — contra **51.1% de recall** (mar/2026) |

Também: um mecanismo de ensemble aparece só no marketing — *"running three LLMs in parallel and only surfacing issues when 2+ models agree... cuts false positives by ~60%... while maintaining 92% recall"* (https://www.codeant.ai/blogs/ai-code-review-false-positives, byline 2026-02-06) — e **grep no corpus completo de docs (9,4 MB) por `consensus`, `models agree`, `three LLMs` retorna ZERO ocorrências.** Trate a alegação de ensemble como **não substanciada**.

**Nota de método para quem for verificar:** páginas `codeant.ai/blogs/*` renderizam um **timestamp ao vivo** que fetchers confundem com data de publicação. As datas reais estão no byline e no JSON-LD `datePublished`. Já `docs.codeant.ai` **não tem data alguma** — só dá para datar via `sitemap.xml` `<lastmod>` + Wayback.

### 3.14 Sider — SEM METODOLOGIA PÚBLICA (produto aparentemente inativo)

Verificação técnica em 2026-08-13: `sider.review` tem NS delegado à Route53 mas **nenhum registro A**; `curl` retorna "Could not resolve host"; subdomínios `www.`, `help.`, `docs.`, `blog.`, `app.` idem; `medium.com/sider-review` bloqueado por Cloudflare (403); Wayback API retornou HTTP 429.

**Todas as seis perguntas: NÃO ENCONTRADO.** Não há blog, docs, changelog, paper ou talk acessível. A única caracterização disponível é **secundária e pré-LLM** (Wikipedia: agregador de ferramentas de análise estática open-source; negócio transferido para a Sleeek Corporation em 2019-10-31).

**Recomendação: retirar Sider do conjunto de comparação, ou marcá-lo explicitamente como "sem metodologia pública".** Não há afirmação defensável a fazer sobre ele.

### 3.15 Quantas chamadas de LLM por PR — consolidado

| Fornecedor | Publica contagem? | O que existe |
|---|---|---|
| **GitLab** | **SIM** | ~16 / ~28 / ~40 por review, escalando com o diff (Security Review Flow) |
| Snyk | Parcial | k=5 candidatos **por issue** (fix, não review) |
| Codacy | Parcial | "one request per file with issues" (triagem de FP) |
| Cloudflare | Estrutural | "up to seven specialised reviewers"; timeouts 5–10 min/tarefa, 25 min total |
| Greptile | Qualitativo | "a very high limit on how many times it can run LLM inference or access tools" (v3) |
| GitHub | Custo, não contagem | "$0.05 to $1 USD worth of AI credits with 'Lite' effort, and $0.25 to $5 with 'Balanced'" |
| CodeRabbit, cubic, Qodo, AWS, DeepSource | **NÃO ENCONTRADO** | — |

**Conclusão da Pergunta 1:** só a GitLab publica contagem, e para um flow adjacente. Nosso número de tool calls por caso, medido *por modelo com harness fixo*, **não tem par publicado em lugar nenhum** — ninguém isola a variável modelo. Essa é a contribuição mais defensável do nosso bench.

---

## 4. Pergunta 2 — CONTROLE DE EXPLORAÇÃO

> Alguém descreve garantir que o agente examine todo o diff?

**Resposta curta: quase ninguém. Esta é a maior lacuna do corpus publicado, e é exatamente o ponto em que o nosso achado de "parada precoce" incomoda.**

Busquei os termos `coverage`, `every changed file`, `exhaustive`, `systematic`, `no file left unreviewed`, `multi-pass`, `second pass`, `each hunk` nos sites de Greptile, CodeRabbit, cubic, Qodo e no post da Cloudflare.

### 4.1 O que EXISTE

**(a) Cloudflare — cobertura por construção do arquivo de patch, mas sem garantia declarada.** É o único mecanismo concreto que encontrei: o sistema escreve **um arquivo de patch por arquivo** em disco e passa o caminho. Mas a frase seguinte anula a garantia:

> "Each sub-reviewer reads only the patch files relevant to its domain."

Quem decide o que é "relevant to its domain" é o subagente. Não há garantia declarada de que todo arquivo seja lido por alguém. E há filtragem explícita **antes**:

> "Before the agents see any code, the diff goes through a filtering pipeline that strips out noise like lock files, vendored dependencies, minified assets, and source maps"

Além de tiers de risco que reduzem deliberadamente o esforço:

> "Trivial (≤10 linhas, ≤20 arquivos): Coordinator + one generalised code reviewer"

Ou seja: a Cloudflare **deliberadamente não** examina todo o diff com todo o esforço. Isso é gestão de custo, declarada como tal, não uma garantia de cobertura.

**(b) cubic — um "Planner" que decide o escopo.** A descrição é de uma linha e não fala em cobertura:

> "**Planner**: Quickly assesses changes and identifies necessary checks."

**(c) Qodo — usa a palavra "coverage", mas para descrever o PROBLEMA, não uma garantia.**

> "Asking one reviewer or one agent to do all of this at once leads to tradeoffs between depth, speed, and coverage."

E, no post do benchmark, "coverage" aparece como consequência de recall baixo:

> "This behavior inflates precision while severely limiting real review coverage."

**(d) Qodo — modo "Exhaustive" existe como configuração de produto.** É a ocorrência literal mais próxima do termo que procurávamos:

- **Link:** https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/ · **Data:** 2026-02-04

> "For Qodo, we report results for two operating configurations: **Qodo Precise**, which reports only issues that clearly require developer action, and **Qodo Exhaustive**, which is optimized for maximum coverage and recall."

Mas isso é o **nome de um perfil**, não a descrição de um mecanismo. **Como** o modo exaustivo garante cobertura: **NÃO ENCONTRADO**.

**(e) CodeRabbit — "incremental", que é o oposto de uma garantia de cobertura total.**

- **Link:** https://docs.coderabbit.ai/overview/pull-request-review.md · **Data:** sem data. Acessado 2026-08-13.

> "CodeRabbit reviews new pull requests automatically and updates its feedback as you push new commits—**focusing on what changed**. **New PRs**: Full analysis of all changes with detailed findings. **New commits**: Incremental reviews that track what's new since the last review."

"Full analysis of all changes" é a afirmação mais próxima de uma garantia de cobertura que encontrei em qualquer doc de produto. É uma frase de marketing numa página de visão geral, sem mecanismo associado.

### 4.2 DOIS FORNECEDORES PUBLICARAM O NOSSO MODO DE FALHA "PARADA PRECOCE"

**Esta é a descoberta mais importante desta seção, e ela veio do lado SAST do mercado, não dos nativos de IA.**

**(a) DeepSource — "o erro mais comum não era análise errada. Era saída zero."**

- **Link:** https://deepsource.com/blog/deepsource-next · **Data:** 2026-02-24

> "Static analysis alone has the opposite problem. **It checks everything, every time**, but it can't reason beyond the patterns it's been programmed to find."

E então, literalmente:

> "LLM-only code review can reason about code, but it has a blind spot: **it doesn't always look at the right things. When we benchmarked LLM-only tools against real CVEs, the most common failure wasn't wrong analysis. It was zero output. The model skipped the vulnerable code entirely.**"

Tradução: "Code review só com LLM consegue raciocinar sobre código, mas tem um ponto cego: **nem sempre olha para as coisas certas. Quando avaliamos ferramentas só-LLM contra CVEs reais, a falha mais comum não era análise errada. Era SAÍDA ZERO. O modelo pulou o código vulnerável inteiramente.**"

**Isto é o nosso gemini-3.7-flash (0.8 findings/caso, 15.4 tool calls), descrito por um fornecedor, com a mesma causa proposta: o modelo não olhou.** Não é incapacidade de julgar; é falha de cobertura.

**(b) Snyk — "para depois de achar UM exemplo representativo de um padrão repetido"**

- **Link:** https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/ · **Data:** 2026-06-29 — Liran Tal

> "**The model found some representative issues, then failed to enumerate repeated vulnerable sinks.** That is exactly where deterministic data-flow analysis is valuable. SAST coverage and model review are not duplicates of each other; they are different instruments with different blind spots."

> "They can also vary across runs, over-report adjacent concerns, or **stop after finding one representative example of a repeated pattern.**"

Com o caso concreto e o número:

> "Across five repetitions, it missed every path-traversal reference finding and two of three resource-limit finding opportunities."

> "In the largest app-like fixture, Claude Opus 4.6 High was the best model at only 40.0% Snyk-reference F1, repeatedly missing path traversal and resource-limit vulnerabilities."

> "Snyk Code SAST was deterministic and better at **systematically enumerating** repeated data-flow sinks."

**Esta é a caracterização mais precisa do fenômeno em toda a literatura levantada: o modelo não para por incapacidade, para por SATISFAÇÃO — encontrou um exemplar do padrão e considerou a tarefa cumprida.** É um modo de falha de *enumeração*, não de *detecção*. Vale a pena checarmos se os nossos 95 bugs golden contêm padrões repetidos e se as omissões se concentram nas ocorrências 2..N.

### 4.2.1 🔥 Cognition — a MELHOR formulação publicada do problema de cobertura, e é exatamente a nossa

Este é o achado mais importante da Pergunta 2. A Cognition publicou o argumento que estávamos procurando, e o publicou melhor do que qualquer um.

- **Link:** https://devin.ai/blog/agentic-map-reduce — "Agentic MapReduce"
- **Data:** **2026-07-01**

Primeiro, a distinção entre os dois regimes de trabalho:

> "Most of the work we ask coding agents to do is local… The relevant code lives in a handful of files, and an agent with a shell, grep, and read is exactly right for the job."
> "A different class of work requires reasoning over the entire codebase… Here, **completeness is the goal**."

E então a frase que nomeia o nosso problema:

> "**No explicit coverage boundary. A search-driven agent stops when it decides it's done — not when a finite work queue has been exhausted.**"

> "**a search agent's 'I've looked everywhere' is unfalsifiable.**"

Tradução: "**Sem fronteira explícita de cobertura. Um agente movido a busca para quando ELE decide que terminou — não quando uma fila finita de trabalho foi esgotada.**" / "**o 'eu olhei em todo lugar' de um agente de busca é infalsificável.**"

E a solução deles, com a garantia declarada:

> "**Coverage is guaranteed by construction: the deterministic pass produces a finite work queue, every shard is assigned to an investigation agent, and the scan is complete only when that queue is exhausted.**"
> "Plan | Shard | **Map: One agent per batch, in parallel, does the real per-shard reasoning** | Reduce"
> "**Workers run independently and in parallel.**"

E o custo que aceitam por isso, declarado:

> "Completeness now rests on **selector recall**: a file that matches no selector never reaches a worker. **We take this trade deliberately.**"

**Por que isto importa tanto para nós:**

1. **É a única formulação publicada do critério de parada como problema de FALSIFICABILIDADE**, não de qualidade. Um agente que para sozinho não produz evidência de cobertura — e é precisamente por isso que o nosso número de tool calls por caso é informativo: **é um proxy observável de uma propriedade que o próprio agente não consegue reportar honestamente.**
2. **A Cognition usa fan-out APENAS onde "completeness is the goal"** (varredura de repo inteiro no Security Swarm), e mantém o agente único para trabalho local sobre diff. Ou seja: o mesmo fornecedor escolhe arquiteturas diferentes conforme a cobertura seja ou não o objetivo. **Isso é o argumento mais matizado do corpus inteiro e devemos citá-lo como tal.**
3. **Aplicado ao nosso bench:** o nosso setup é "local" pelo critério deles (um diff, poucos arquivos), o que sustenta o loop único como instrumento. Mas o nosso *objetivo* é completeness (achar 95 bugs conhecidos), o que é o regime em que eles próprios dizem que o agente-único não dá garantia. **Essa tensão é real, é nossa, e vale declarar em vez de esconder.**

Anti-garantia explícita da mesma empresa (docs do Security Swarm): *"No security scanner can guarantee complete coverage."* E, em 2025 (⚠️ post com banner de "superseded"): *"Please note that Devin isn't guaranteed to catch every bug"* — https://cognition.com/blog/devin-101-automatic-pr-reviews-with-the-devin-api, **2025-01-21**.

**Para o Devin Review especificamente, cobertura: NÃO ENCONTRADO.** Grep exaustivo em `docs.devin.ai/llms-full.txt` (2,76 MB) + todos os posts: `"every changed file"` = 0; `"no file left unreviewed"` = 0; `"multi-pass"` = 0; `"second pass"` = 0; `"each hunk"` = 1 ocorrência, mas sobre **apresentação** do diff, não detecção.

### 4.2.1.1 🔥🔥 Baz — a formulação mais precisa do nosso problema, e a única métrica de COBERTURA em produto

Se a Cognition dá o melhor argumento conceitual, a **Baz dá a melhor descrição operacional** — e separa exatamente os nossos dois modos de falha.

- **Link:** https://baz.ai/resources/blog/sast-inside-expanding-the-hypothesis-space-of-agentic-security-review — Omri Levy
- **Data:** **2026-07-29**

> "Large language models are useful security reviewers because they can reason across code that no single rule describes well. […] **That capability does not imply complete coverage.**"
> "A security agent still has to decide what to inspect, which files to retrieve, which vulnerability hypotheses to test, and when it has collected enough evidence. Its result depends on the model, the prompt, the available context, **the search trajectory, and the order in which evidence is encountered.**"

**E então a frase que separa "parada precoce" de "filtro na saída" melhor do que qualquer coisa que escrevemos:**

> "**A model may correctly diagnose a vulnerability when shown the relevant path and still fail to search for that path in the first place.**"

Tradução: "**Um modelo pode diagnosticar corretamente uma vulnerabilidade quando lhe mostram o caminho relevante, e ainda assim falhar em BUSCAR esse caminho.**"

E o contraste com a regra determinística, que nomeia o mecanismo da parada precoce:

> "A static rule can repeatedly inspect every matching call site for a known source, sink, API misuse, or unsafe language construct. **It does not forget to search for a vulnerability class because another code path consumed its attention.** Its weakness is interpretation."
> "An agent can perform that interpretation. Its weakness is that **it may not generate every relevant hypothesis.** It may not retrieve the file containing the sanitization wrapper. It may fail to recognize an uncommon library call as a sink. **It may inspect the changed function without enumerating all of its externally reachable callers.**"

**"because another code path consumed its attention" é, em seis palavras, a hipótese mecanicista para o nosso gemini-3.7-flash.**

A solução da Baz é gerar hipóteses deterministicamente e deixar o agente avaliá-las:

> "During a review, Baz runs specialized static checks over the changed code and passes the resulting signals into the same investigation performed by the Advanced Security agent. These signals do not become comments automatically. **They become claims to test.**"
> "**The purpose is broader coverage, not deterministic output.**"
> "The static check **expands the set of candidate conditions**. The agent evaluates each condition using repository context."

**🟢 E a Baz é o ÚNICO fornecedor do levantamento inteiro que expõe COBERTURA como métrica de produto** — https://baz.ai/docs/insights/evaluation (docs, sem data):

> "**Coverage answers a different question from acceptance: not how much of what Baz said was taken, but how much of what was there Baz found.** It shows the total number of comments alongside a per-category count, with a radar chart of the same categories, **so gaps in coverage are visible** next to the categories Baz reports heavily on."

**Isto valida diretamente a nossa escolha de instrumentar cobertura.** Um fornecedor chegou à mesma conclusão e a transformou em dashboard.

E a Baz também mede variância entre execuções, com a mesma preocupação do §10.5:

> "Not terrible, but every tool missed the hardest defects—the same ones humans missed. […] Worse, results were inconsistent. **Same setup, different runs, different answers.**"
> "More importantly, **runs were consistent**. Breaking the process into steps made each part observable and debuggable." — https://baz.ai/resources/blog/engineering-intuition-at-scale-the-architecture-of-agentic-code-review, **2025-12-15**

Trade-off de cobertura declarado (heurística de localidade):

> "The system selects hunks adjacent to the changed lines, includes a window of surrounding code, and trims thread conversation after code context because **empirical evidence shows bug signals are usually local to modifications.**" — **2026-03-29**

### 4.2.2 Macroscope — a única reivindicação literal de "every file", e o que ela realmente cobre

- **Link:** https://macroscope.com/blog/code-review-v3 · **Data:** 2026-02-04

> "**Previously, we only reviewed files in languages with native AST-parsing (~12 of the most popular). Now every file in your PR gets reviewed.**"

E na doc, sob o cabeçalho "Universal File Support":

> "Config files, documentation, scripts, and other non-code files are also reviewed. **Every file in a PR gets examined.**"

**Esta é a única ocorrência de uma promessa literal de cobertura de todo arquivo em todo o levantamento.** Mas note o que ela é e o que não é: é uma afirmação de **escopo de arquivo**, não um mecanismo por hunk, e não vem acompanhada de métrica de verificação.

A Macroscope também publica o argumento de que índice > exploração, precisamente no eixo de sistematicidade — https://macroscope.com/content/ai-code-review-monorepos-complete-guide:

> "Greptile's agentic search can follow nested function calls across files, but its approach is **more exploratory than systematic. The agent decides what to investigate.** AST-based analysis traces every caller by construction — **there is no decision, every dependent is examined.**"

**"there is no decision" é a formulação mais concisa do argumento anti-loop no corpus.** É o mesmo ponto da Cognition, dito do lado do índice em vez do lado da fila de trabalho.

E os mecanismos que **limitam** cobertura (changelog 2026-08-07): "**Max Automatic Reviews** caps how many times correctness review runs automatically on one PR"; "**Max File Size** skips files larger than the configured KB limit"; arquivos de teste ignorados por padrão.

### 4.2.3 Augment — cobertura como AJUSTE DE PROMPT e dial de usuário, não como mecanismo

Vale registrar porque é honesto e porque mostra onde o mercado realmente resolve isso:

> "Outline the steps in the review workflow." — o workflow de review é descrito como **instrução de prompt**, não como iteração garantida em código. (2026-03-10)
> "Either focus on high signal-to-noise issues OR focus on a thorough review catching all issues." (2026-03-10)
> "**Thorough** (default) provides comprehensive coverage, **catching 50% more bugs**, while **Precise** focuses on the most critical issues with fewer comments." — https://docs.augmentcode.com/codereview/overview

**"catching 50% more bugs" entre dois perfis de PROMPT do mesmo agente** é mais uma evidência (junto com Cursor e Greptile) de que a variável dominante no recall pode ser calibração, não capacidade. Ver §12.3, recomendação 1.

Modos de falha de cobertura publicados pela própria Augment (seção "Corner cases", 2026-03-10):

> "**Large pull requests, affected by context rot and context window limits**"
> "Running subsequent rounds of review: doing incremental reviews and dealing with existing review comments"

### 4.3 GitHub — a política de silêncio é DELIBERADA e quantificada

E aqui está o outro lado: para a GitHub, calar não é falha, é feature — e eles publicam a taxa.

- **Link:** https://github.blog/ai-and-ml/github-copilot/60-million-copilot-code-reviews-and-counting/ · **Data:** 2026-03-05

> "In code review, more comments don't necessarily mean a better review. Our goal isn't to maximize comment volume, but to surface issues that actually matter."

> "**Silence is better than noise. In 71% of the reviews, Copilot code review surfaces actionable feedback. In the remaining 29%, the agent says nothing at all.**"

> "As our ability to identify high-signal findings improves, we're also able to comment more confidently, now averaging about **5.1 comments per review** without increasing review churn or lowering our quality threshold."

**Leitura crítica para o nosso bench:** 29% de silêncio total é uma política de produto, não um bug. Mas o nosso bench roda sobre 30 PRs que **sabidamente contêm 95 bugs**. Nesse setting, silêncio é sempre erro. **Se um modelo foi pós-treinado com uma política do tipo "silence is better than noise", ele será penalizado pelo nosso bench de um jeito que não reflete a qualidade dele no uso real** — onde a maioria dos PRs realmente não tem bug grave. Esta é uma limitação de validade externa que precisamos declarar: nosso conjunto tem prevalência de bugs de 100% por construção, e a calibração ótima nesse regime não é a calibração ótima em produção.

Também vale notar o contraste de escala: GitHub reporta **5.1 comentários por review**, contra os nossos 0.8–3.4 findings/caso. As populações não são comparáveis (eles contam todo tipo de comentário; nós contamos findings casados com golden bugs), mas a ordem de grandeza sugere que nossos modelos estão todos falando bem menos do que um produto calibrado fala.

### 4.4 Anti-garantias explícitas — todos publicam que NÃO cobrem tudo

Ninguém garante cobertura, e vários **documentam o contrário**, com números.

**GitHub** — https://docs.github.com/en/copilot/responsible-use/code-review (acessado 2026-08-13):

> "**Missed code quality problems:** Copilot may not identify all of the problems that are present in code, especially where changes are large or complex."

E exclusões por construção (https://docs.github.com/en/copilot/concepts/agents/code-review):

> "Some file types are excluded from Copilot code review: Dependency management files, such as `package.json` and `Gemfile.lock`; Log files; SVG files."

Único uso de "exhaustive" no corpus da GitHub — e é para negar exaustividade:

> "Use Lite for routine changes where fast feedback is more important than **exhaustive** analysis."

**GitLab** — garante cobertura no nível de MR, nega no nível de conteúdo, com os limites numéricos:

> "Automatic reviews from GitLab Duo ensure that **all merge requests** in your project, group, or instance receive an initial review."

> "Code Review Flow applies two limits to keep the prompt within a workable size: — For files longer than 10,000 lines, only the diff is sent to the model. The full file contents are not included. — The total context that the pre-scan gathers is capped at approximately 1 MiB. When the cap is exceeded, the context is truncated to approximately 800 KiB before the review stage runs."

> "**For very large merge requests, the review might miss context that was truncated.**"

**Graphite** — o mais explícito de todos sobre não cobrir tudo (https://graphite.com/docs/ai-review-customization):

> "Files marked as `linguist-generated` will be: … **Excluded from AI review when determining if a PR is too large** … **Skipped during the AI review process**"

> "**Limitations:** Large files are truncated for performance / Too many files can reduce review quality"

**Amazon Q** — cascata de escopo documentada, com cotas duras (200 KB para auto-reviews):

> "By default, if you simply ask Amazon Q to review your code, it will review only the code changes in the active file in your IDE... If there is no diff file is present, Amazon Q will review the entire code file. If no file is open, it will search for any code changes in the project to review."

E, operacionalmente relevante:

> "**Subsequent commits do not trigger another automatic review.**" — https://aws.amazon.com/blogs/devops/introducing-an-interactive-code-review-experience-with-amazon-q-developer-in-github/ · 2025-09-08

### 4.5 O que NÃO existe

**Com DUAS exceções parciais, nenhum fornecedor publica um mecanismo que garanta que cada arquivo (ou cada hunk) do diff foi examinado:**

1. **Macroscope** afirma literalmente *"Every file in a PR gets examined"* (§4.2.2) — mas é **escopo de arquivo**, sem mecanismo por hunk e sem métrica de verificação.
2. **Cognition** garante cobertura por construção — mas **explicitamente só no Security Swarm (repo inteiro), NÃO no Devin Review de diff** (§4.2.1).

Fora disso: nenhum publica métrica de cobertura de diff; nenhum descreve um "segundo passe sobre arquivos não visitados". Os termos `no file left unreviewed`, `exhaustive coverage`, `multi-pass`, `second pass`, `each hunk` **NÃO FORAM ENCONTRADOS** como descrição de mecanismo em nenhuma fonte primária consultada. Verificações negativas mais fortes disponíveis: grep exaustivo no corpus de docs da CodeAnt (9,4 MB) → **0 ocorrências**; grep em `docs.devin.ai/llms-full.txt` (2,76 MB) → **0 ocorrências**; grep em 15 páginas de docs + 21 posts da Propel → **0 ocorrências**; busca no post de engenharia da Augment → **0 ocorrências**.

A única reivindicação de exaustividade que existe é **da camada estática, não do agente**: DeepSource ("It checks everything, every time") e Snyk ("reproduced its reference set deterministically", "systematically enumerating"). Ou seja: **quem garante cobertura no mercado é o SAST determinístico, não o LLM.**

**Leitura:** o mercado publicado **assume que o modelo não se vira** — e resolve por duas vias, nunca por instrumentação de cobertura:
1. **Fan-out** (nativos de IA): N agentes com escopos sobrepostos, o que reduz a chance de que uma parada precoce individual apague um bug. Ninguém chama isso de cobertura, mas é o que faz.
2. **Camada determinística por baixo** (SAST): o LLM pode pular código, mas o analisador estático não pula, então o recall de base é garantido por construção.

**Consequência para nós:** o modo de falha "parada precoce" é **estruturalmente invisível** para todos esses produtos, porque nenhum deles instrumenta cobertura — eles a compram com arquitetura. Um enxame de N agentes *mascara* a parada precoce de um agente individual; não a resolve. **Medir tool calls por caso, por modelo, com harness fixo, é algo que ninguém no mercado faz e que nomeia diretamente uma falha que dois fornecedores já observaram qualitativamente.** É a contribuição mais forte do nosso bench.

---

## 5. Pergunta 3 — PRECISÃO VS RUÍDO

> Como falam do trade-off? Greptile e Graphite são conhecidos por posicionamento de precisão alta — confirmar com citação.

Este é o tema **mais** publicado de todos. E o achado é que **o mercado está genuinamente dividido**, com dois campos que declaram posições opostas por escrito.

### 5.1 Campo "recall primeiro" — CodeRabbit

- **Link:** https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark
- **Data:** 2026-03-03 — Sahil Mohan Bansal

> "There's a common assumption when comparing code review tools that the best code review tool is the one with highest precision. Fewer comments, higher precision, sounds intuitive right? However, CodeRabbit has always taken a slightly different approach. CodeRabbit is specifically engineered to have a good balance between precision and recall. **We would rather flag a real bug you choose to dismiss than miss a real bug you needed to see.**"

> "We've always believed that the job of a code review tool is to catch as many critical bugs as possible and trust developers to decide which ones matter."

E o knob de produto correspondente:

> "CodeRabbit is built to be thorough by default while also being configurable for your team's noise tolerance with controls like **Chill vs Assertive review profiles (fewer vs. more comments)**, path-based instructions, and Learnings"

### 5.2 Campo "precisão primeiro" — Greptile

- **Link:** https://www.greptile.com/content-library/greptile-martian-code-review-benchmark
- **Data:** 2026-07-30 — Everett Butler

> "Together, these metrics capture the two directions in which an AI code reviewer can fail. **High precision with low recall produces quiet reviews but misses real bugs. High recall with low precision catches more issues but floods pull requests with comments engineers learn to ignore.**"

> "**Leaving more comments is not the goal.** ... A useful reviewer must be thorough enough to catch consequential bugs and precise enough that developers and downstream coding agents can trust its feedback."

Números que a Greptile reivindica nessa data: F1 60.8%, **precisão 76.2% (a mais alta do leaderboard)**, recall 50.6%.

**Confirmação do posicionamento de precisão alta da Greptile: SIM, confirmado com citação e número.**

### 5.2.1 Graphite — posicionamento confirmado, mas com TRÊS números incompatíveis e nenhuma metodologia

O briefing pedia para confirmar o posicionamento de precisão alta da Graphite. **Confirmado — e com uma ressalva séria.**

- **Link:** https://graphite.com/blog/graphite-reviewer-launch
- **Data:** **2024-09-30 — ANTERIOR A 2025, PROVAVELMENTE OBSOLETO**

> "What really makes Graphite Reviewer stand out is its accuracy. We've focused relentlessly on cutting through the noise and eliminating the hallucinations that often plague other AI tools. AI only feels like magic when it's consistently helpful and trustworthy, and **Reviewer has achieved a <3% false-positive rate across tens of thousands of code changes reviewed.**"

> "**More signal, less noise:** Other AI bots hallucinate and create noisy comments. Graphite Reviewer is calibrated to catch real bugs and deliver smarter, targeted feedback with fewer false positives."

**Mas a Graphite publicou três números mutuamente incompatíveis e nunca os reconciliou:**

| Número | Fonte | Data | Métrica de fato nomeada |
|---|---|---|---|
| **<3% false-positive rate** | /blog/graphite-reviewer-launch | 2024-09-30 | falsos positivos |
| **"Less than 5% negative comment rate"** | /features/ai-reviews | **sem data** (página atual) | **downvotes de usuário — NÃO é FP** |
| **5–8%** | /guides/ai-code-review-false-positives | **sem data**, conteúdo de SEO | falsos positivos, sem fonte |

**Nenhum dos três tem metodologia publicada.** E note a troca silenciosa: a métrica passou de *falso positivo medido* (2024) para *taxa de downvote do usuário* (atual). São coisas diferentes, e a segunda é muito mais fácil de otimizar.

Único número quantitativo pós-2025 da Graphite sobre o reviewer:

> "In fact, **30-35% of all actionable code review comments** at organizations using Graphite Agent come from the AI tool." — https://graphite.com/blog/ai-code-review-for-ai-generated-code · 2025-07-28

**Lição para o codereviewbench.com:** "<3% de falso positivo" é exatamente o tipo de número que circula sem metodologia e que um benchmark independente existe para disciplinar. Vale citá-lo no site **junto com a observação de que não há metodologia publicada e de que o próprio fornecedor publica outros dois números conflitantes.**

### 5.2.2 DeepSource — o melhor enquadramento publicado do trade-off

- **Link:** https://deepsource.com/benchmarks · acessado 2026-08-13

> "We're choosing F1 as the hero metric because it's the only one that punishes both failure modes. Accuracy is inflated by true negatives: roughly half the diffs are patched code where 'nothing wrong' is the easy correct answer. **Precision alone rewards cowardice**: a tool can hit 100% precision by only speaking up when it's absolutely certain, missing most real vulnerabilities. **Recall alone rewards noise**: a tool can catch everything by flagging everything, and developers stop trusting it. F1 can't be gamed by either failure mode."

Tradução: "**Precisão sozinha premia a covardia**: uma ferramenta pode atingir 100% de precisão só falando quando tem certeza absoluta, perdendo a maioria das vulnerabilidades reais. **Recall sozinho premia o ruído.**"

"Precision alone rewards cowardice" é a frase que melhor descreve o que o nosso número de 73.9% de precisão do gemini-3.7-flash está capturando.

### 5.2.3 Snyk — CORREÇÃO sobre o número de 0,08% que circula no mercado

**Aviso de precisão factual:** o famoso "0,08% de falso positivo" da Snyk **NÃO é do Snyk Code (SAST/code review). É do Snyk API & Web (DAST).** Não use como taxa de FP de code review.

- **Link:** https://snyk.io/blog/minimizing-false-positives-enhancing-security-efficiency/ · **Data:** 2025-07-01 — Tiago Mendo

> "Snyk API & Web is a highly accurate tool for secure application development, with **an extremely low rate of 0.08% for false positives**."

O número que **é** de código: *"Snyk Agent Fix autofixes code in seconds, with 85% accuracy"* (https://snyk.io/platform/deepcode-ai/).

E, no benchmark próprio deles (2026-06-29), a precisão medida por configuração de modelo varia muito: Claude Opus 4.6 Medium 91.5%, Opus 4.6 High 89.8%, **Opus 4.7 Max 69.6%**, Sonnet 4.6 Medium 62.6%, Sonnet 4.6 High 58.6%. Com o comentário:

> "The highest-recall LLM also had the noisiest queue: **41% of its reports fell outside the Snyk Code reference set.**"

### 5.3 Qodo — a declaração que mais se aproxima do NOSSO achado

- **Link:** https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/
- **Data:** 2026-02-04 — Tomer Yanay, Bar Fingerman

> "The results reveal a clear and consistent pattern across tools. While several agents achieve very high precision, this comes at the cost of extremely low recall, meaning they identify only a small fraction of the actual issues present in the PRs. **In practice, these tools are conservative: they flag only the most obvious problems to avoid false positives, but miss a large portion of subtle, system-level, and best-practice violations. This behavior inflates precision while severely limiting real review coverage.**"

Tradução: "Os resultados revelam um padrão claro e consistente entre as ferramentas. Embora vários agentes alcancem **precisão muito alta, isso vem ao custo de recall extremamente baixo** — eles identificam apenas uma pequena fração dos problemas reais presentes nos PRs. Na prática, essas ferramentas são conservadoras: sinalizam apenas os problemas mais óbvios para evitar falsos positivos, mas perdem grande parte das violações sutis, de nível de sistema e de boas práticas. **Esse comportamento infla a precisão enquanto limita severamente a cobertura real da review.**"

**Este parágrafo é a descrição publicada do nosso gemini-3.7-flash** (precisão 73.9%, recall 11.6%). A Qodo observou o mesmo perfil em produtos comerciais inteiros; nós observamos no nível do modelo dentro de um harness fixo.

### 5.4 cubic — o argumento do F1 e o custo do FP

- **Link:** https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark · **Data:** 2026-03-25

> "In AI code review, optimizing for just one metric creates a terrible developer experience. If you only optimize for Recall (catching every possible bug), the agent will flag every minor nitpick and hallucinate issues. Developers get buried in noise and start ignoring the bot entirely. If you only optimize for Precision (only commenting when 100% certain), the agent becomes too timid and misses the complex, architectural bugs that actually break production."

### 5.5 Greptile — o custo do falso positivo em fluxo agêntico

- **Link:** https://www.greptile.com/blog/model-inversion · **Data:** 2026-07-21

> "But a holistic approach without proper verification produces false positives, and **false positives are not free. Each one costs an engineer's attention, and in an agentic workflow, each one costs compute.** One of the promises of AI code review is that they make verification cheap. **The challenge is knowing when to cast a wide net and when to go deep.**"

### 5.6 O contexto histórico do problema (obsoleto, mas esclarecedor)

- **Link:** https://www.greptile.com/blog/make-llms-shut-up
- **Data:** **2024-12-18 — ANTERIOR A 2025, OBSOLETO** como descrição de produto. Adaptado de talk no Sourcegraph Dev Tools meetup, 2024-12-16.

> "When we first launched this product, the biggest complaint by far was that the bot left too many comments. In a PR with 20 changes, it would leave as many as 10 comments, at which point the PR author would simply start ignoring all of them."

A anatomia do ruído, com números:

> "We analyzed existing Greptile comments and found that **~19% were good, 2% were flat-out incorrect, and 79% were nits** - comments that were technically true but not something the dev cared about."

**Este é o dado mais importante do post e o mais frequentemente ignorado:** o problema dominante **não era alucinação (2%)**, era **irrelevância (79%)**. Nosso bench, ancorado em 95 bugs golden, mede a fatia de 19% e trata as outras duas como iguais — um nit tecnicamente correto e uma alucinação contam ambos como falso positivo. Isso é uma limitação real da nossa métrica de precisão, e está publicada por um fornecedor desde 2024.

---

## 6. Pergunta 4 — ESCOLHA E TROCA DE MODELO

> Alguém publica QUAL modelo usa e por quê? Alguém relatou que trocar de modelo mudou o comportamento? Alguém usa modelos diferentes para estágios diferentes?

**Resposta curta: SIM para os três, e com muito mais detalhe do que eu esperava.** Este foi o tema mais bem documentado depois de precisão-vs-ruído.

### 6.1 Greptile — arquitetura multi-modelo com roteador, declarada como a decisão de design central

- **Link:** https://www.greptile.com/blog/nvidia-nemotron-ultra-in-code-review · **Data:** 2026-06-04

> "Behind that simple experience is a decision most people never see: which AI model should handle each step? **It is tempting to pick one large model and route everything through it. We have found that this is the wrong approach.** Reviewing a code change, deciding whether a threaded reply needs an answer, and continuously mapping an entire codebase are genuinely different jobs, with different demands on speed, cost, and the amount of information a model has to hold at once."

> "So instead of one model, we run several. **A lightweight internal router sends each task to the model that handles it best. This is what we mean by a multi-model architecture, and it is the single most important design choice behind Greptile's quality and economics.**"

Os estágios nomeados e avaliados nesse post: (1) **Chat with PR** — um classificador que decide `reply` / `acknowledge` / `skip`; (2) **Codebase indexing** — o agente que mantém o wiki interno. Ambos avaliados contra "the proprietary frontier models we run today", com ganhos publicados de ~78% de custo na classificação e 173 vs 100 de throughput de indexação.

Qual modelo roda a review principal:

- **Link:** https://www.greptile.com/blog/model-inversion · **Data:** 2026-07-21

> "Greptile uses a variety of models under the hood, but **the main review agent is usually a frontier model from either OpenAI or Anthropic.**"

### 6.2 Greptile — "Model Inversion": trocar de modelo MUDA o que é encontrado, e eles shipparam isso

Mesmo post (2026-07-21). O achado:

> "The data shows that both models find more bugs in code written by the other model than in code they wrote themselves."

> "This revealed a fascinating pattern: **the types of bugs a model introduces most often are the same types it's more likely to miss during review.**"

O produto que saiu disso:

> "It detects which coding agent authored a PR - based on commit trails, branch prefixes, and PR titles - and routes the review to a different model. **If Claude wrote it, GPT reviews it, and vice versa.**"

> "**Model inversion is experimental**, and we're still learning how far the effect goes as models improve."

Recall publicado (P0/P1, alta severidade):

| Dataset | Claude Opus 4.7 | GPT 5.5 |
|---|---|---|
| PRs autorados por Claude | 60.0 (same-model) | 62.0 (cross-model) |
| PRs autorados por Codex | 53.7 (cross-model) | 50.5 (same-model) |

### 6.3 Cloudflare — atribuição explícita de modelo por estágio, com tabela

- **Link:** https://blog.cloudflare.com/ai-code-review/ · **Data:** 2026-04-20

> "Because we split the review into specialised domains, we don't need to use a super expensive, highly capable model for every task. We assign models based on the complexity of the agent's job:"

> "**Top-tier: Claude Opus 4.7 and GPT-5.4:** Reserved exclusively for the Review Coordinator. The coordinator has the hardest job — reading the output of seven other models, deduplicating findings, filtering out false positives, and making a final judgment call. It needs the highest reasoning capability available."

> "**Standard-tier: Claude Sonnet 4.6 and GPT-5.3 Codex:** The workhorse for our heavy-lifting sub-reviewers (Code Quality, Security, and Performance)."

> "**Kimi K2.5:** Used for lightweight, text-heavy tasks like the Documentation Reviewer, Release Reviewer, and the AGENTS.md Reviewer."

Note a assimetria: **o modelo mais caro fica no ESTÁGIO DE FILTRO, não no de geração.** Isso é o inverso do que uma intuição ingênua sugeriria e é diretamente relevante para a nossa Pergunta 5.

Eles também publicam failback chains explícitas (`opus-4-7 → opus-4-6 → null`, `sonnet-4-6 → sonnet-4-5 → null`) e um control plane em Workers KV que permite trocar modelo em produção em 5 segundos.

### 6.4 cubic — argumenta contra deixar o USUÁRIO escolher o modelo

- **Link:** https://www.cubic.dev/blog/why-choosing-your-own-llm-for-code-review-is-a-bad-idea · **Data:** 2026-02-10 — Alex Mercer

> "Letting users choose their own LLM for code review creates problems: inconsistent feedback on the same code, high false-positive rates, difficulty comparing reviews over time, and increased costs from unnecessarily using expensive models."

> "cubic follows this approach using specialized micro-agents. One agent coordinates the review, while others focus on security, clarity, and structure. **Each agent uses the most suitable AI for its task.**"

E, no post do benchmark (2026-03-25):

> "We constantly run experiments to understand which models perform best for specific use cases. **Tools like Claude Code are locked into using one specific model. We aren't.** We route different parts of the review process to the best model for that specific situation, optimizing the pipeline far beyond what a single model can achieve."

### 6.5 CodeRabbit — pós-treino de um modelo pequeno para o estágio de roteamento

- **Link:** https://www.coderabbit.ai/blog/teaching-nvidia-nemotron-3-5-lightning-to-route-code-reviews · **Data:** 2026-08-11

Trabalho conjunto CodeRabbit + NVIDIA + Baseten, SFT destilado + RLVR sobre NVIDIA Nemotron 3.5 Lightning, para a tarefa de roteamento:

> "On a frozen 1,000-task evaluation, exact route agreement increased from **75.8% for the GPT baseline model to 80.4% after SFT and 80.7% after SFT plus RLVR.** Output agreement measured by Cohen's kappa reached 0.544, up from 0.461 after SFT."

> "The post-trained model achieved higher accuracy than the previous GPT-class model by about 4%. It also reduced estimated inference costs by about 50%."

Metodologia declarada: 39.566 exemplos de repos públicos, **split por repositório para evitar vazamento** ("We split the data by repository to prevent train and evaluation leakage"), 9.996 exemplos de SFT, 1.000 de eval congelado.

Honestidade estatística digna de nota (rara em blog de fornecedor):

> "The paired confidence interval for the route delta crossed zero, so we treat that route result as **non-regression rather than a statistically decisive improvement.**"

### 6.6 Greptile — TREX é model-agnostic por design, com modelos diferentes dentro da mesma review

- **Link:** https://www.greptile.com/blog/trex-code-execution · **Data:** 2026-06-17 — Shlok Mehrotra

> "From the start, we designed TREX around a model-agnostic harness that allows hot-swapping between frontier models without rebuilding. The flexibility goes deeper than most people expect: **the main agent and the subagents can use different providers. We can have multiple models running within the same review.** This makes it easy for us to pick the best model at any given point, based on internal evals."

E a tese de que o modelo não é o diferencial:

> "TREX's differentiation is not which model it's running. It's the infrastructure around the model: the codebase indexing, the orchestration, the artifact generation, the evaluation framework."

### 6.6.1 🔥 Macroscope — a evidência mais detalhada do mercado sobre DIFERENÇA DE COMPORTAMENTO entre modelos

**Se há uma seção deste documento para levar para a reunião de resultados do bench, é esta.** A Macroscope publicou exatamente o tipo de comparação que estamos fazendo, com o mesmo tipo de achado.

- **Link:** https://macroscope.com/blog/we-stopped-writing-prompts · **Data:** **2026-02-04** — Rob Bishop & Joe Bernstein (co-fundadores)

**O número que mais importa:**

> "**Given the same 'maximize recall' directive, Opus flags 199 potential issues. GPT-5.2 flags 3,923. Same task, 20× different output.**"

Tradução: "**Dada a MESMA diretiva de 'maximize recall', o Opus sinaliza 199 problemas potenciais. O GPT-5.2 sinaliza 3.923. Mesma tarefa, saída 20× diferente.**"

**Isto é a nossa tabela de findings/caso, num experimento controlado, com um fator de 20× em vez do nosso 4×.** E note a direção: aqui é o **GPT que fala mais**, o oposto do nosso gpt-5.6-terra. Duas leituras possíveis, e não temos como decidir entre elas: (a) modelos diferentes (GPT-5.2 vs GPT-5.6) têm calibrações opostas; (b) a instrução "maximize recall" da Macroscope desbloqueia no GPT exatamente o comportamento que o prompt default suprime — que é precisamente a tese de Cursor e Greptile. **A leitura (b) é a mais parcimoniosa e é diretamente testável no nosso harness.**

**A caracterização por modelo, publicada:**

> "different models have different intuitions about what counts as a bug, how severe it is, and when to speak up. **These aren't flaws; they're just different calibrations.**"

> "**Gemini 3 is aggressive at finding edge cases but noisy; GPT-5.2 is better at following instructions; Opus is more precise out of the box but also more conservative.**"

**E dois "tells" comportamentais que eles transformaram em filtros — técnica que podemos usar como métrica secundária:**

> "**GPT-5.2 hedges when it's uncertain… We found that hedging correlates strongly with false positives… modal language like 'could,' 'potentially,' and 'may' became a filter. If the model hedges, the output gets rejected.**"

> "**Gemini 3 sometimes thinks out loud… The rambling is a tell… words like 'wait,' 'however,' and 're-reading' became rejection signals. Not all models do this. Opus, for instance, doesn't ramble—so it doesn't need this filter.**"

**Modelos diferentes por estágio — explícito, e é a conclusão do sistema deles:**

> "**Auto-tune learned to harness those differences: use an aggressive model for detection, a precise one for validation, and filter where a model's confidence runs hot.**"

> "Auto-tune discovered approaches we wouldn't have tried—like **using different models for different subtasks, or pairing aggressive detection with ruthless validation**."

**E o relato de troca de modelo com números** — https://macroscope.com/blog/opus-4.5-code-review · **2025-12-12**:

> "Today we're releasing a new version of Macroscope Code Review with substantially better performance, **powered exclusively by Claude Opus 4.5.**"
> "**Code Review v2 powered by Opus 4.5 has 40% better recall** than our previous production performance, which was powered primarily by GPT-5.1."
> "It significantly outperformed Sonnet 4.5 and GPT-5.1 on raw precision, **generating 10% fewer false positives**."
> "our new Opus 4.5 powered Code Review leads to a **25% higher F1 score**"
> Trade-off de latência: ~40% maior (262s vs 183s)

⚠️ **Superado dois meses depois** por seleção automática por linguagem: *"Macroscope's auto-tune system tests multiple model, prompt, and parameter combinations per language to find the best config."* (docs) — e há uma **página desatualizada** que ainda diz "Macroscope's code review runs on Claude Opus 4.5" (https://macroscope.com/content/ai-code-review-precision-vs-recall, 2026-07-08), contradizendo a doc. Cuidado ao citar.

### 6.6.2 Cognition — por que treinaram um modelo próprio, e o que mediram

- **Link:** https://cognition.com/blog/swe-check-10x-faster · **Data:** **2026-04-14**

> "They found that **frontier models that met the quality bar were too slow and expensive** for on-demand bug detection in the IDE."
> "The result is SWE-check, which **matches frontier performance on internal in-distribution evals (delta F1 to Opus 4.6 goes from 0.09 to 0)**."
> "makes meaningful progress on out-of-distribution evals (delta F1 to Opus 4.6 goes from 0.49 to 0.29)."
> "**Smaller, specialized models can rival frontier generalists on the tasks they're trained for, at a fraction of the cost and latency.**"

Note a honestidade do segundo número: **fora da distribuição, o gap permanece grande (0.29)**. É o tipo de ressalva que raramente aparece em blog de fornecedor.

Modelos do Quick Review, publicados e selecionáveis pelo usuário (https://docs.devin.ai/desktop/quick-review): "**SWE-check** | A fast, lightweight review model optimized for common code issues"; "**GPT 5.5** | Uses the latest OpenAI frontier model for deep, agentic code review."; "**Opus 4.7** | Uses the latest Anthropic frontier model for deep, agentic code review."

**Modelo do Devin Review: NÃO ENCONTRADO.** **Efeito de trocar modelo no comportamento do review: NÃO ENCONTRADO.**

### 6.6.3 Augment — "tratar o modelo como componente plug-and-play raramente funciona"

- **Link:** https://www.augmentcode.com/blog/how-we-built-high-quality-ai-code-review-agent · **Data:** **2026-03-10**

> "Models differ in how they: **Interpret instructions / Use tools / Trade off precision vs recall**"
> "**Treating the model as a drop-in component rarely produces high-quality results.**"
> "High review quality requires **continuous benchmarking and careful pairing between models, tools, and prompts**."
> "**For Augment Code Review, the GPT model series has consistently performed the best so far**"

**Versão específica, ou relato antes/depois de uma troca: NÃO ENCONTRADO. Modelos diferentes por estágio: NÃO ENCONTRADO.**

### 6.7 GitLab — o mais transparente do mercado: modelo default por feature, com histórico de versões

- **Link:** https://docs.gitlab.com/user/duo_agent_platform/model_selection/ e a doc do Code Review Flow · acessados 2026-08-13

> "Model information — LLM: Anthropic Claude Sonnet 5 Vertex. Select a different model using the Agentic Code Review setting."
> Histórico: "LLM updated to Claude Sonnet 4.6 Vertex in GitLab 19.1. LLM updated to Claude Sonnet 5 Vertex in GitLab 19.3."

| Feature | Modelo default |
|---|---|
| GitLab Duo Agentic Chat | Claude Sonnet 4.6 |
| **Code Review Flow** | **Claude Sonnet 5** |
| Security Review Flow | Claude Sonnet 4.6 |

Selecionáveis para Code Review Flow: Claude Sonnet 4.5 (deprecado em 19.3), Sonnet 4.6, Sonnet 5, GPT-5.2, GPT-5.3 Codex.

**Efeito medido de trocar de modelo: NÃO ENCONTRADO.** A GitLab publica *que* trocou, nunca o efeito. **Modelos diferentes para gerar vs verificar: NÃO ENCONTRADO** — pre-scan e review usam o mesmo modelo.

### 6.8 GitHub — proíbe troca de modelo, e publicou o efeito de uma troca

**A GitHub é o único que proíbe explicitamente a troca de modelo pelo usuário, com justificativa:**

- **Link:** https://docs.github.com/en/copilot/concepts/agents/code-review · acessado 2026-08-13

> "Copilot code review is a purpose-built product that uses a carefully tuned mix of models, prompts, and system behaviors to deliver consistent, high-quality feedback across a wide range of codebases. **Model switching is not supported, as changing the model is likely to compromise reliability, user experience, and the quality of review comments.**"

Dois níveis de esforço, com roteamento para modelos diferentes:

> "**Lite:** Standard review. Provides fast, targeted feedback on common issues... (default). **Balanced:** Routes pull requests to a **higher-reasoning model** for longer analysis of complex logic, security-sensitive code, and cross-service changes."

**E o único número publicado no mercado inteiro sobre o efeito de trocar de modelo:**

> "We treat this as a deliberate trade-off. In one recent change, **adopting a more advanced reasoning model improved positive feedback rates by 6%, even though review latency increased by 16%.**" — 60M post, 2026-03-05

**Qual modelo a GitHub usa: NÃO ENCONTRADO.** Nenhuma página nomeia o modelo por trás do Copilot code review.

### 6.9 DeepSource e Codacy — dois tiers de modelo por estágio, documentados

**DeepSource** — https://deepsource.com/blog/byok · **Data:** 2026-03-24

> "Configuration requires two model deployments: — a flagship model that powers Autofix™ and AI Code Review, and — **a smaller, faster model that handles everything else (like generating issue descriptions, filtering, summarization)**. Splitting workloads this way keeps token costs down and inference fast, while maintaining quality."

Famílias suportadas em BYOK: Anthropic Claude, OpenAI GPT Codex, Google Gemini. **Modelo default do DeepSource Cloud: NÃO ENCONTRADO.**

**Codacy** — https://docs.codacy.com/codacy-ai/codacy-ai/ · **Data:** "Last updated: April 2, 2026"

| Feature | Modelo declarado |
|---|---|
| AI Reviewer (gerador) | "This feature leverages **Google Gemini models**" |
| AI-enhanced comments | "This feature leverages **OpenAI models**" |
| Smart False Positive Triage (filtro) | "This feature leverages **OpenAI models**" |

**Ou seja: na Codacy, o gerador de review roda em Gemini e o triador de falso-positivo roda em OpenAI.** É o exemplo mais limpo de "modelo diferente para gerar vs filtrar" no corpus. Versões específicas: **NÃO ENCONTRADO**.

### 6.10 Snyk — o dado mais contra-intuitivo do levantamento: modelo mais caro performou PIOR

- **Link:** https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/ · **Data:** 2026-06-29

> "Claude Opus 4.7 Max was the most expensive model configuration in this run, but not the best performing one. It averaged 95,969 tokens and $0.3559 per model session. Claude Opus 4.6 Medium averaged 51,574 tokens and $0.0628 per model session. **Opus 4.7 Max, therefore, costs 5.67x more and uses 1.86x more tokens, while scoring lower: 68.8% Snyk-reference F1 versus 75.4% for Opus 4.6 Medium.**"

> "**More expensive inference does not automatically provide better security coverage.**"

E sobre variância entre execuções — relevante para o nosso §10.5:

> "Claude Sonnet 4.6 Medium produced the most one-off extra vulnerability reports: **61.7% of its LLM-only reports appeared in just one of five runs.**"

> "Nearly half of the unique, unmatched model findings appeared in only one of five identical repetitions. **That is a practical reliability problem: a developer could get a materially different review queue depending on which run happened to execute.**"

Histórico de troca de modelo da Snyk, com motivo (T5 → StarCoder → frontier + retrieval):

> "**We tested every potentially viable, interesting LLM to find out which one produced the best results when coupled with our fine-tuning methods. And based on its accuracy and speed, we chose StarCoder as the base model** and fine-tuned it on our training datasets." — https://snyk.io/blog/ai-code-security-snyk-autofix-deepcode-ai/ · **2024-04-23, pré-2025**

Tabela publicada em 2026-04-27 (https://snyk.io/blog/snyk-agent-fix-agentic-architecture/), "Functional & Secure Fix rate" sobre ~150 golden tests:

| Model | Fix rate |
|---|---|
| StarCoder (current) | 72.4% |
| Gemini 3.1 Pro | 74.2% |
| Sonnet 4.6 | 72.4% |
| Opus 4.6 | 74.6% |
| **Sonnet 4.6 + Snyk Intelligence** | **82.5%** |
| **Opus 4.6 + Snyk Intelligence** | **85.4%** |

> "Our analysis found that by equipping frontier models from Anthropic with Snyk intelligence, they passed **14.48% more evaluations** than the Anthropic or previous Agent Fix model alone."

**Leitura para nós:** este é o argumento de que *retrieval/contexto vale mais que capacidade bruta do modelo* — e é quantificado. Se replicável no nosso setting, sugere que a diferença entre nossos modelos (11.6% a 43.2% de recall) poderia ser parcialmente fechada por contexto, não por troca de modelo.

### 6.11 Graphite — escolha de modelo por avaliação head-to-head, e um alerta metodológico

**Fonte SECUNDÁRIA (escrita pela Anthropic, não pela Graphite), mas linkada e endossada pela Graphite:**

- **Link:** https://www.anthropic.com/customers/graphite · **Data:** ~2024-12 — **ANTERIOR A 2025**

> "After testing leading AI models, Graphite found that only Claude met their standards for code review. **The team's rigorous evaluation framework tested models against 500 pull requests, including synthetic and real-world examples with known bugs that even experienced engineers struggled to spot.**"

> "The release of Claude 3.5 Sonnet marked a decisive breakthrough. Baum said, '**Not only did our eval performance skyrocket, but it identified bugs in our test dataset that we hadn't even realized were bugs.**'"

**Este segundo trecho é um alerta metodológico direto para nós, e é o único relato desse tipo em todo o corpus:** um upgrade de modelo **invalidou parte do gold set** deles, ao encontrar bugs reais que não estavam rotulados. Exatamente o risco que a CodeRabbit descreve em §8.5, mas observado do lado de dentro. Com 95 bugs golden, estamos expostos a isso toda vez que adicionarmos um modelo mais forte ao bench.

---

## 7. Pergunta 5 — VERIFICAÇÃO EM DOIS ESTÁGIOS

> Alguém descreve gerar candidatos e depois filtrar com um segundo passo? Como descrevem o trade-off de recall no primeiro estágio?

**Resposta curta: SIM, é praticamente universal entre os fornecedores que publicam arquitetura — e um deles publicou que a versão ingênua NÃO funciona.**

### 7.1 A declaração canônica do trade-off — Qodo

Esta é a frase que responde exatamente à pergunta, e ela aparece duas vezes com formulações ligeiramente diferentes.

- **Link:** https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/ · **Data:** 2026-02-04

> "The distinction between precision and recall matters in practice. **Precision can be tuned through filtering and prioritization once issues are found. Recall cannot. If a system fails to detect an issue, no amount of post-processing can recover it.** High recall depends on deep understanding of the codebase, cross-file dependencies, architectural context, and repository-specific standards."

E no post do benchmark (mesma data):

> "Importantly, **precision is a dimension that can be tuned post-processing** according to user preference (e.g., stricter filtering of findings), **whereas recall is fundamentally constrained by the system's ability** to deeply understand the codebase, cross-file dependencies, architectural context, and repository-specific standards."

Tradução: "Precisão pode ser ajustada por filtragem e priorização **depois** que os problemas são encontrados. **Recall não pode. Se um sistema falha em detectar um problema, nenhum pós-processamento o recupera.**"

**Esta é a justificativa publicada mais forte para a nossa preocupação com o "filtro na saída".** Se o gpt-5.6-terra investiga (53.5 tool calls) mas não reporta (1.7 findings), ele está gastando o recurso caro (recall no primeiro estágio) e jogando fora o resultado num filtro implícito — a pior combinação possível segundo o argumento da Qodo.

### 7.2 Greptile — o experimento que reproduz o NOSSO modo de falha "FILTRO NA SAÍDA"

**Esta é a fonte primária mais importante do levantamento inteiro para o nosso caso.**

- **Link:** https://www.greptile.com/blog/model-inversion
- **Data:** 2026-07-21 — Rodrigo Caridad (research team, Greptile)

**Metodologia declarada:** dois datasets de 500 PRs cada (um autorado por Claude Code, um por Codex), ~1.500 comentários de ground truth no total, autoria determinada por commit trails / prefixos de título / prefixos de branch, `/review` rodado 3× por PR, matching por LLM-as-a-judge, "Final results reflect recall on high-severity bugs only."

A observação de partida — **é a nossa tabela de findings/caso**:

> "During initial testing, I observed a stark contrast in the number of comments each model would post per review. **The average Codex review would land at around 1 to 2 comments, while Opus would post around 7 to 8.** I considered two possible explanations: GPT comments *less* than it should. Opus comments *more* than it should. **Both turned out to be true. GPT searches for bugs depth-first. Opus goes breadth-first.**"

A decomposição do trace em três fases — **é a nossa contagem de tool calls, feita de outro jeito**:

> "Across the board, LLM code review traces can be split into three phases: **Scope**: The model reads the diff and understands the changes the PR introduces... **Investigate**: The model searches the codebase with the goal of gathering evidence to confirm the existence of such bugs. **Summarize**: The model summarizes its findings and produces the final review artifacts."

| Fase | Opus 4.7 | GPT 5.5 |
|---|---|---|
| Scope (lê o diff) | 59.4% / 31.5 KB | **6.1% / 2.1 KB** |
| Investigate (grep, evidência) | 31.2% / 16.6 KB | **82.5% / 28.5 KB** |
| Summarize (escreve a review) | 9.4% / 5.0 KB | 11.4% / 3.9 KB |

> "The difference was significant. Opus gets most of its context during the *Scope* phase. GPT gets most of it from the *Investigate* phase. I theorized the following: **Opus takes a preventive approach - willing to comment on things that *could* be bugs. GPT places a big emphasis on verifying that what looks wrong is *actually* wrong.**"

**E então a seção literalmente intitulada "GPT leaves bugs behind":**

> "You would think that a strong emphasis on verification wouldn't hurt results. When curating the dataset, we built our ground truth from high-severity, verified bugs. Yet initially, **GPT had very low recall.** It would be easy to blame the model's capabilities, but GPT 5.5 is a frontier model. I was convinced that this wasn't a skill issue."

> "I tried adding an extra instruction explicitly telling the model to target around 7 to 10 comments per review. **Suddenly, it recovered.** Not an elegant solution, but it confirmed my suspicion: **GPT was leaving bugs behind.**"

> "Looking at the reasoning traces made it even clearer. **The model would often identify the bugs I expected it to post, explicitly mentioning them as potential issues in its reasoning summaries. Yet it wouldn't post them.**"

A causa-raiz que eles propõem:

> "After multiple iterations of tuning extra instructions, I started to see both improvement and the potential root cause: **conflicting instructions and post-training reinforced behavior.**"

> "Instructions like 'be thorough' or 'output all the bugs you can find' would often lead the model into internal debates about whether to follow the *developer* or the *user* instructions. **The language of OpenAI's `/review` system prompt leads GPT 5.5 to aggressively narrow the scope of its reviews with the goal minimizing noise.**"

> "The performance eventually improved. Nonetheless, I couldn't help but feel that **prompting it away from that behavior felt less like crafting a request and more like trying to jailbreak the model.**"

E no fechamento:

> "One thing that stood out from the GPT work: models weight their system instructions heavily, and post-training techniques like Deliberate Alignment encourage them to reason about user intent before acting. In practice, **this meant that getting GPT to simply report all the bugs it found was surprisingly difficult. The model was not disobedient - it was doing exactly what it was trained to do.**"

**Isto é confirmação externa, independente, datada e em fonte primária do nosso modo de falha "FILTRO NA SAÍDA", no mesmo family de modelo (GPT).** A Greptile mediu por composição de trace + traces de raciocínio; nós medimos por tool calls e findings/caso. As duas medições concordam. E eles publicam uma **mitigação testada**: instruir um alvo numérico de comentários (7–10) recuperou o recall.

### 7.3 Greptile — o aviso de que LLM-as-a-judge ingênuo FALHOU

**Fonte obsoleta em produto, mas o resultado negativo é o que importa.**

- **Link:** https://www.greptile.com/blog/make-llms-shut-up
- **Data:** **2024-12-18 — ANTERIOR A 2025**

> "**Attempt 2: LLM-as-a-judge** — Since we couldn't get the LLM to stop *producing* nit comments, we figured we would simply add a filtering step where the LLM could rate the severity of a comment+diff pair on a 1-10 scale, and simply eliminate any comments rated less than 7. Sadly, this also failed. **The LLMs judgment of its own output was nearly random.** This also made the bot extremely slow because there was now a whole new inference call in the workflow."

E antes disso:

> "**Attempt 1: Prompting** — Sadly, even with all kinds of prompting tricks, we simply could not get the LLM to produce fewer nits without also producing fewer critical comments."

O que **funcionou** para eles, em 2024, foi clustering por embedding de feedback histórico do time:

> "If the comment had a cosine similarity exceeding some threshold with at least 3 unique downvoted comments, it would get blocked."

> "Within two weeks of rolling out this feature, existing users saw address rate ... go from 19% to 55+%."

**Ressalva forte:** isto é de dez/2024, com modelos daquela geração, e a própria Greptile depois construiu sistemas de verificação sofisticados (TREX). Não é evidência de que LLM-as-judge não funcione em 2026. **É** evidência de que a versão ingênua (auto-avaliação de severidade 1–10 pelo mesmo modelo) foi testada e reprovada por um fornecedor, e que o baseline "peça pro modelo julgar a si mesmo" merece ceticismo.

### 7.4 CodeRabbit — verificação como agente separado e como execução de scripts

Da página de arquitetura (sem data, acessada 2026-08-13): agentes "**Review, Verification, Chat, Pre-Merge Checks**" em paralelo.

E o mecanismo de evidência:

- **Link:** https://www.coderabbit.ai/blog/how-coderabbit-delivers-accurate-ai-code-reviews-on-massive-codebases · **Data:** 2025-09-05

> "When something needs checking, CodeRabbit generates shell/Python checks (think grep, ast-grep) to confirm an assumption or **extract proof from the codebase before we post the comment**."

### 7.5 Cloudflare — o "judge pass" do coordenador, com regras explícitas

- **Link:** https://blog.cloudflare.com/ai-code-review/ · **Data:** 2026-04-20

> "After spawning all sub-reviewers, the coordinator performs a **judge pass** to consolidate the results: **Deduplication**: If the same issue is flagged by both the security reviewer and the code quality reviewer, it gets kept once... **Re-categorisation**: A performance issue flagged by the code quality reviewer gets moved to the performance section. **Reasonableness filter**: Speculative issues, nitpicks, false positives, and convention-contradicted findings get dropped. **If the coordinator isn't sure, it uses its tools to read the source code and verify.**"

Note: o juiz **tem ferramentas** e pode verificar. Não é um filtro de texto sobre texto — é a diferença crítica em relação ao LLM-as-judge que falhou na Greptile em 2024.

E a instrução negativa como técnica central:

> "It turns out that telling an LLM what *not* to do is where the actual prompt engineering value resides. Without these boundaries, you get a firehose of speculative theoretical warnings that developers will immediately learn to ignore."

Exemplo literal do prompt do security reviewer, seção "What NOT to Flag": *"Theoretical risks that require unlikely preconditions / Defense-in-depth suggestions when primary defenses are adequate / Issues in unchanged code that this MR doesn't affect / 'Consider using library X' style suggestions"*.

### 7.6 Qodo — agente-juiz explícito com limiar de confiança

- **Link:** https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/ · **Data:** 2026-02-04

> "To keep feedback focused, Qodo includes a **judge agent** that evaluates findings across agents. The judge agent resolves conflicts, removes duplicates, and filters out low-signal results. **Only issues that meet a high confidence and relevance threshold make it into the final review.**"

> "This multi-agent design is a key reason Qodo can maintain both high recall and high precision in real pull request conditions."

### 7.7 cubic — confiança numérica no schema de saída do primeiro estágio

- **Link:** https://www.cubic.dev/blog/learnings-from-building-ai-agents · **Data:** 2025-06-19

O schema publicado literalmente no post:

```json
{"reasoning": "`cfg` can be nil on line 42; dereferenced without check on line 47",
 "finding": "Possible nil-pointer dereference",
 "confidence": 0.81}
```

> "We required the AI to explicitly state its reasoning **before** providing any feedback"

> "Enabled us to clearly trace the AI's decision-making process. If reasoning was flawed, we could quickly identify and exclude the pattern in future iterations. Encouraged structured thinking by forcing our Code Review AI to justify its findings first, significantly reducing arbitrary conclusions."

### 7.8 Greptile TREX — verificação por EXECUÇÃO, não por julgamento textual

- **Link:** https://www.greptile.com/blog/trex-code-execution · **Data:** 2026-06-17

A tese:

> "Static code review has a ceiling. It can reason about what the code says. **It can't tell you what it does.**"

A arquitetura orquestrador/subagente — note que é o **mesmo padrão da v5**, mas para verificação:

> "The Greptile reviewer agent acts as an orchestrator. **It reads the diff, identifies issues worth investigating, and spins up a dedicated TREX agent per issue, all running in parallel.** The TREX agents have the liberty, the compute, and the knowledge of the orchestrator agent."

E um resultado negativo importante, publicado:

> "TREX started as a completely separate product from Greptile, as a standalone agent that generated and ran tests. We hoped that bugs would surface as a result. **They didn't.** Generating tests wasn't the same activity as finding bugs."

> "The obvious fix seemed like combining them into one agent. We tried that, and ran into a different problem: **a single agent handling the full review got overloaded.** Between spinning up services, taking screenshots, running tests, there was too much context for one agent to manage cleanly."

Sobre alucinação de verificação — relevante para qualquer estágio de "evidência":

> "We found an early version of the agent would sometimes **hallucinate about how thoroughly it had tested something, claiming to have tried something it hadn't.** Bullet points gave us no way to verify."

> "Artifacts also need to be trustworthy. Every artifact has to give the reviewer enough to verify the run themselves... **Bad evidence is worse than no evidence.**"

### 7.9 Snyk — o melhor material publicado sobre verificação, e a única descrição do trade-off filtro-vs-recall

**O verificador da Snyk NÃO é um LLM. É o próprio analisador estático.** Isso resolve o problema que derrubou o LLM-as-judge da Greptile em 2024.

- **Link:** https://snyk.io/blog/ai-code-security-snyk-autofix-deepcode-ai/ · **Data:** 2024-04-23 — **pré-2025, mas explicitamente confirmado como vigente** ("This practice of checking Snyk Agent Fix's proposed code continues, even after our transition to using a different, more advanced LLM model")

> "To safeguard the accuracy of Snyk Agent Fix, **all predictions are checked against our human-created rules and knowledge base (embodied in our symbolic AI). A prediction passes the checks if it produces syntactically correct, parseable code, and fixes the relevant security issue without introducing new ones.** This is a unique Snyk differentiator: We use our own code analyzer and knowledge base, both powered by symbolic AI, **to filter out potentially incorrect fixes and hallucinations generated by the LLM behind Snyk Agent Fix, before any such flawed fixes can reach our customers.**"

Formalizado no paper como dois predicados:

- **Paper:** "DeepCode AI Fix: Fixing Security Vulnerabilities with Large Language Models" — Berabi, Gronskiy, Raychev, Sivanrupan, Chibotaru, Vechev — **arXiv:2402.13291**, submetido **2024-02-19**, revisado **2024-02-23**

> "Pass@k: The code analysis engine is capable, for the given issue instance (C, ℓ, I) and a corresponding prediction p, to provide a predicate DoesFix(p, C, ℓ, I), capturing if this prediction fixes the given issue instance. ... another predicate NoNewIssues(p|C) can check if p introduced new issues elsewhere in the code"

E a auto-crítica sobre a circularidade do verificador — honestidade rara:

> "The quality of Pass@k depends on the robustness of the analysis engine. For example, a trivial definition of DoesFix(…) as 'the issue is not detected anymore' can be easily overfitted to — e.g., by deleting the whole code."

**E aqui está a única descrição publicada, em qualquer fornecedor, da dinâmica "filtro duro custa recall → recuperamos com retry":**

- **Link:** https://snyk.io/blog/snyk-agent-fix-agentic-architecture/ · **Data:** 2026-04-27 — Brendan Hann & David Alessi

> "One of the most significant hurdles in auto-fixing is LLM's generating insecure code. **Previously, if Agent Fix's model generated an insecure fix, it was simply filtered out. This is the safest option, but it potentially leaves the developer with no suggestions at all.**
> Instead of discarding an imperfect output, the system now:
> — **Extracts the issue**: Identifies exactly why the first suggestion failed.
> — **Feeds it back**: Passes the error context back to the agent.
> — **Adapts the answer**: The agent rethinks the problem and generates a corrected version, avoiding its previous mistake.
> This loop ensures that, instead of getting 'No fix available,' developers receive a high-quality, verified remediation that has already been stress-tested by our engine."

Tradução do trecho decisivo: "**Antes, se o modelo gerava um fix inseguro, ele era simplesmente filtrado fora. Essa é a opção mais segura, mas potencialmente deixa o desenvolvedor sem nenhuma sugestão.**"

**Isto é exatamente o nosso "FILTRO NA SAÍDA", reconhecido por um fornecedor como problema, e com a solução publicada: em vez de descartar, devolver o motivo da falha ao agente e deixá-lo corrigir.** É a mitigação arquitetural mais concreta de todo o levantamento.

E a arquitetura atual usa retrieval sobre base curada em vez de fine-tuning:

> "Snyk maintains a database of over 35,000 real-world vulnerabilities from open source projects and fixes written by Snyk security experts. During prediction, we don't just ask the model to guess a solution; **we inject the prompt with the most relevant, real-world examples of how that specific CWE was previously resolved.**"

### 7.9.1 🔥 Macroscope — a formulação MAIS CLARA do trade-off recall-no-primeiro-estágio em todo o corpus

A seção do post chama-se literalmente **"Separating detection from validation"**, é assinada pelos co-fundadores, e responde à nossa Pergunta 5 melhor do que qualquer outra fonte.

- **Link:** https://macroscope.com/blog/we-stopped-writing-prompts — "We (Basically) Stopped Writing Prompts."
- **Data:** **2026-02-04** — Rob Bishop & Joe Bernstein (co-fundadores)

> "One pattern auto-tune discovered: **pair a permissive detection with strict validation.** For detection: '**Prefer reporting MORE issues over fewer. False positives are acceptable; do not self-censor.**' This sounds wrong because we'd always tried to minimize false positives everywhere."

> "But it works if validation compensates: strict rejection of hedging, speculation, and anything that can't be proven from the code. **One optimizes for recall; the other optimizes for precision. Neither would work well in isolation.**"

> "**Without strict validation, that aggressive detection is unusable.**"

Tradução: "Um padrão que o auto-tune descobriu: **combinar detecção permissiva com validação estrita.** Para a detecção: '**Prefira reportar MAIS problemas do que menos. Falsos positivos são aceitáveis; não se autocensure.**' ... **Um otimiza para recall; o outro otimiza para precisão. Nenhum dos dois funcionaria bem isoladamente.**"

**"do not self-censor" é, literalmente, a instrução que endereça o nosso modo de falha "FILTRO NA SAÍDA".** É a terceira formulação independente da mesma mitigação — depois de Cursor ("aggressive prompts") e Greptile (alvo de 7–10 comentários). **Três fornecedores, três arquiteturas diferentes, a mesma correção: instruir o primeiro estágio a NÃO filtrar.**

O passo de verificação, declarado — https://macroscope.com/content/what-is-agentic-ci-ai-agents-pull-request-checks, **2026-05-04**:

> "**Macroscope's agents include a verification step before posting.** Reason about each candidate finding. The agent decides whether something is a real bug, a style preference, or a false positive — and **discards the false positives before posting**."

E o limiar de confiança como a única diferença entre os dois modos de produto — **2026-07-08**:

> "**The underlying detection engine — AST-based codewalkers building a reference graph across files — is the same in both modes. What changes is the confidence bar a finding must clear before it becomes a comment.**"

**Prática de transparência que deveríamos copiar** (changelog 2025-10-24) — os candidatos filtrados ficam visíveis ao usuário:

> "you can expand the '**Filtered Issues**' section at the bottom of the PR description to see which comments were excluded, by file, and expand each file to view the specific comment(s) identified."

**Execução de teste no review: NÃO** — *"It does not test your code at runtime. That is what your test suite is for."* Terminologia "LLM-as-judge" / "critic": **NÃO ENCONTRADO** nas páginas da Macroscope.

### 7.9.2 Propel — duas camadas de rejeição nomeadas, e o incidente que as validou

- **Link:** https://www.propelcode.ai/blog/why-model-diversity-matters · **Data:** **2026-02-05**

> "**Our pipeline had two rejection layers: likelihood filtering (Gemini) and multi-model validation (OpenAI, Anthropic, Gemini).**"

E o loop de verificação declarado — "Evidence-First AI Code Review", Tony Dong, **2026-02-24**:

> "1. Generate findings based on diff and context pack. 2. **Verify each finding with repo search, tests, or logs.** 3. Assign severity and confidence to each verified issue. 4. Route the PR based on risk tier and confidence."
> "**Make evidence mandatory. If a finding cannot point to a test, log, or policy rule, it should be suppressed.**"

**Trade-off de recall no primeiro estágio: NÃO ENCONTRADO.** A Propel nunca escreve "geramos com recall alto e depois filtramos".

### 7.9.3 Cognition — o par gerador-verificador é INTER-AGENTE, e o filtro fica no agente de código

O padrão da Cognition é diferente de todos os outros: o revisor não se filtra; quem filtra é o **agente autor**, que tem o contexto de intenção do usuário.

- **Link:** https://cognition.com/blog/multi-agents-working · **Data:** **2026-04-22**

> "The final key part to making this system work really well is the communication bridge between the coding agent and review agent. Basically, **does Devin properly use its broader context of user instructions, decisions, etc. to filter the bugs that come back from Devin Review?** This is key to preventing looping, disobeying the user, doing work that is out of scope, and so on."

> "Takeaways: **clean context leads to a notable improvement in capabilities when using a generator-verifier loop.**"

⚠️ **DISTINÇÃO CRÍTICA que evita um erro de citação:** o LLM-judge do SWE-check é um **avaliador de recompensa em tempo de TREINO**, não um filtro em produção — aparece na seção "How we designed the reward function" (*"We first check if the bugs are scoped correctly with a simple LLM-judge pass"*). **Não citar como verificação de dois estágios em produção.**

Verificação por execução com prova de runtime existe, mas **só no Security Swarm** (repo inteiro):

> "A worker reads the real code, **clears a false-positive gate**, and reports findings with severity, confidence, and preconditions, **accounting for every file it was handed**."
> "**Verify: runtime proof.** The orchestrator Devin session fans out once more; this time over findings. **One sandboxed session per serious finding reproduces it against a running build** and records it as Confirmed, False Positive, or Inconclusive."

### 7.9.4 Augment — NÃO tem verificação em produção

**NÃO ENCONTRADO como produção.** Busca no post de engenharia por "filter", "verify", "validate", "confidence", "judge", "critic", "pass", "stage" → **NOT FOUND**. LLM-as-judge aparece **apenas** em eval offline. O que existe em produção chama-se "Guardrails" e é **segurança do agente, não filtragem de achados**:

> "Agents can occasionally do weird things like commenting on the wrong PR, or modifying PR description. To prevent this, we implemented several guardrails: **Narrow tool operations** (eg. a code review agent's Github tool shouldn't be able to push new commits) / **Restricted shell access** / **Making as many components deterministic as possible** (such as retrieving PRs, constructing API calls, etc.)"

### 7.9.5 🔥 Baz — "over-generate ... and filter": a frase exata que a Pergunta 5 procurava

- **Link:** https://baz.ai/resources/research/the-anatomy-of-code-review-accuracy — Nimrod Kor · **Data:** **2026-03-29**

> "**To raise recall beyond human-only gold sets we over-generate candidate bugs with models and filter them through judges and human review.**"

Tradução: "**Para elevar o recall acima do de gold sets só-humanos, nós SUPERGERAMOS bugs candidatos com modelos e os filtramos por juízes e revisão humana.**"

E o mecanismo de duas etapas, com os detalhes que faltavam em todos os outros:

> "**In the two-stage pattern the agent first creates a free-form analysis.** This verbose internal artifact helps debugging and traceability. **A second, schema-constrained extraction step then produces a typed result** with fields such as analysis text, an addressed boolean, a structured explanation, a **confidence score**, and a precise location. The extraction enforces types and returns confidence metrics; **low-confidence extractions are routed to human adjudication rather than becoming ambiguous production comments.**"

> "Operationally we log model identity, token usage, and extraction confidence for every comment; **conservative behavior routes low-confidence results to humans or records analysis without posting a comment**"

**Note o desenho:** o primeiro estágio é livre e verboso (recall), o segundo é **extração com schema tipado** (não julgamento de mérito). Isso é diferente de todos os outros — o filtro não pergunta "isto é um bug bom?", pergunta "isto se encaixa no schema com confiança suficiente?". É plausivelmente por isso que funciona onde o LLM-as-judge da Greptile falhou.

E os dois estados de saída, com os suprimidos retidos para avaliação (§7.9.1, mesma prática da Macroscope):

> "**Finding** — Surfaced with SAST source attribution" / "**Suppressed** — Retained for evaluation, not shown to the developer"

### 7.9.6 Sourcery — a comparação controlada entre auto-filtragem e filtro decomposto (⚠️ pré-2025)

**Fonte antiga, mas é o único experimento controlado publicado sobre COMO fazer o filtro funcionar.**

- **Link:** https://sourcery.ai/blog/improving-llm-responses · **Data:** **2024-02-26 — ANTERIOR A 2025, PROVAVELMENTE OBSOLETO**

**O que falhou** — e é o mesmo resultado negativo da Greptile:

> "At first we tried to improve the usefulness of comments simply by expanding our prompt to say the comments had to explicitly be useful. Unfortunately (and maybe we should have expected this) this didn't help cut down on the number of not useful comments. **LLMs, it turns out, have a fairly persistent sense that the content they generate is useful.**"

> "Finally we tried sending a follow up to the LLM after it created the comment asking it which of its comments were useful. But still it **always managed to create a plausible argument about why what it put forward was useful**."

> "Generically trying to filter for 'usefulness' from the same LLM conversation didn't work out and we suspected that using a different LLM agent for the same type of check ('is this comment useful') wouldn't work particularly well - and it didn't. **This simple post-filter check didn't yield any real improvements to the comment quality we were making (43% vs 42%).**"

**O que funcionou — decompor o julgamento em booleanos específicos em vez de perguntar "isto é útil?":**

> "We put together a validation request using a separate LLM for every comment we generated where we asked it to give a **boolean answer for each of these categories** above... This gave us **28 potential validation combinations** to check... and unlike our previous attempts, **these actually moved the needle**."

> "Ultimately we found that **4 of these checks had the most impact** on improving our comment usefulness — **Valid to the code, Actionable, Specific, Valuable to the author**. And that combining the 4 of them together led to the biggest lift in usefulness **without overly filtering out truly useful comments**. In the end we were able to increase the average usefulness of the comments in our code reviews with this relatively simple method **from the low 40s% to roughly 60%**."

**Este é o achado prático mais acionável sobre verificação em todo o levantamento:** "peça um juízo global de utilidade" falha (42%→43%, ruído); "peça N booleanos específicos e combine" funciona (~42%→~60%). E o trade-off de recall está nomeado: *"without overly filtering out truly useful comments"*.

Segundo filtro, com número, no mesmo período:

> "To help cut down on these cases we can lean on another LLM request to check if the feedback we would be giving a developer would be **too generic**. If it says it is we throw out that as a potential response. **During our experimentation and development of the complexity check we saw that this cut down on 80+% of the false positives we were seeing at this stage.**" — https://sourcery.ai/blog/tackling-complex-tasks-with-llms, **2024-02-15** ⚠️ pré-2025

E o princípio de design generalizado, que é literalmente a tese "supergere e filtre":

> "**A better way forward is to work with the grain of the model - if it really wants to do something, let it do it, but ask it to classify it's behaviour. You can then add a later step that filters out the responses you don't want.**" — Nick Thapen, https://sourcery.ai/blog/dont-tell-me-what-not-to-do, **2024-04-26** ⚠️ pré-2025

⚠️ **Ressalva sobre o "Panel of Experts" da Sourcery** (https://sourcery.ai/blog/panel-of-experts, Nick Thapen, **2024-05-13**): apesar do nome, **NÃO é fan-out** — é **um único prompt com três personas** ("You are a panel of three experts... Alice, Bob and Charles"), isto é, multi-agente simulado dentro de uma chamada. Reduziu o error rate de 40% para 20% num test set difícil, ao custo de "a rough doubling of our cost". **Não conflacionar com subagentes reais.**

⚠️ **Aviso geral sobre a Sourcery:** o blog deles **não publica nada sobre metodologia de review desde 2024**. Todo o material acima é pré-2025 e deve ser tratado como arqueologia, não como descrição do produto atual.

### 7.10 Codacy e DeepSource — filtro por confiança, mas na direção SAST→LLM

**Codacy** — https://docs.codacy.com/codacy-ai/codacy-ai/ · 2026-04-02

> "During triage, each issue is given a **confidence score** along with an explanation. **When the confidence level falls below a defined threshold, the issue is then flagged as an AI false positive** and surfaced for manual review."

Padrão literal: *gerar (regras) → pontuar confiança → filtrar por limiar → escalar para humano*.

**DeepSource** — https://deepsource.com/changelog/2026-02-23 (auto-datado "Feb 24, 2026")

> "The static analysis results are remarkably better now, with far fewer false positives (**thanks to AI filtering**) and better descriptions."

**Ressalva importante para ambos:** o filtro roda sobre achados do **SAST**, não sobre a saída do próprio agente de IA. Um verificador sobre a saída do agente de review em produção: **NÃO ENCONTRADO** em Codacy nem em DeepSource.

**GitLab** tem o mesmo padrão, empacotado como flows separados: "SAST False Positive Detection" e "Secret False Positive Detection" (docs, Foundational flows).

### 7.11 GitHub — a exceção: NÃO tem segundo estágio, e mudou para evitar "esquecer" achados

**Verificação em dois estágios na GitHub: NÃO ENCONTRADO.** Nenhuma menção a LLM-as-judge, validator, critic, self-reflection ou confidence scoring no pipeline de produção.

E — muito relevante para nós — **a GitHub publicou que mudou justamente PARA LONGE de consolidar achados no final:**

> "**It catches issues as it reads, not just at the end: Previously, agents waited until the end of a review to finalize results, which often led to 'forgetting' early discoveries.**" — 60M post, 2026-03-05

**Isto é um mecanismo direto contra o nosso modo de falha "filtro na saída", e é o oposto do padrão orquestrador-juiz.** A GitHub emite o achado no momento em que o encontra, em vez de acumular tudo num buffer que o modelo depois poda. Vale considerar como variante do harness: **forçar emissão incremental em vez de um relatório final único.**

O que existe na GitHub é agrupamento, não filtragem:

> "Instead of multiple separate comments for the same pattern error, which can be overwhelming, the agent clusters them into a single, cohesive unit to reduce cognitive load."

### 7.12 Graphite — voting e self-critique (fonte SECUNDÁRIA)

- **Link:** https://www.anthropic.com/customers/graphite — **SECUNDÁRIA (escrita pela Anthropic)**, ~2024-12 — **ANTERIOR A 2025**. A Graphite a linka e endossa em /blog/how-graphite-uses-claude (2024-12-11).

> "Graphite's implementation combines Claude's sophisticated reasoning capabilities with deep expertise in effective code review. **Their architecture breaks complex code analysis into discrete steps, allowing Claude to excel at each specific task. The system employs multiple validation layers including voting, chain of reasoning, and self-critique to ensure only high-quality comments reach developers.**"

Evidência de primeira mão de um estágio de filtro (as métricas de exclusão implicam candidatos gerados e depois adjudicados) — https://graphite.com/docs/ai-review-customization:

> "**Issues checked**: Total issues evaluated against this exclusion / **PRs reviewed**: Number of pull requests where this exclusion was applied / **Issues caught**: Issues that were filtered out by this exclusion / **Percentage caught**: Proportion of checked issues that were excluded"

**Se esse adjudicador é um LLM, uma regra ou um score: NÃO ENCONTRADO.** Não inferir.

---

## 8. Pergunta 6 — BENCHMARKS PRÓPRIOS

> Quem publica números próprios, com que metodologia? Precisão/recall são micro ou macro?

### 8.1 A resposta direta sobre micro vs macro

**A grande maioria usa MICRO (pooled) e não discute a escolha. Mas DOIS fornecedores tratam do assunto — e um deles escolheu MACRO e publicou o raciocínio.** Esta é a seção mais diretamente acionável do documento para o nosso desenho.

#### 8.1.1 🔥 Cognition (SWE-check) — o único que enuncia a escolha e justifica: MACRO

- **Link:** https://cognition.com/blog/swe-check-10x-faster — "Introducing SWE-Check: 10x Faster Bug Detection", Raymond Feng, Jeffrey Ling, Rhythm Garg, Moritz Stephan
- **Data:** **2026-04-14**

> "How do we aggregate these scores over many samples? There are two reasonable ways to go about this:"
> "We could aggregate a **global total count** of true positives (TP), false positives (FP), and false negatives (FN) to compute a global precision and recall, then combine them into an f_β score."
> "We could **average P(τ) and R(τ) over the samples** to get an average precision and an average recall, then combine them into an f_β score."
> "**Since we would not want to bias the model to be disproportionately good at examples where there are a lot of ground truth bugs (at the expense of poor performance on examples where there are few / no ground truth bugs), we opt for the second choice.**"
> "**We define R_pop = E_τ[R(τ)] and P_pop = E_τ[P(τ)].**"
> "A key observation is that we cannot directly use [f_β(τ)] because **averaging f_β(τ) does not yield f_β**."
> Caso de borda declarado: "if there are no predicted bugs and no ground truth bugs, we set the precision and recall to 1"

Tradução do trecho decisivo: "**Como não queremos enviesar o modelo a ser desproporcionalmente bom em exemplos onde há MUITOS bugs de ground truth (às custas de desempenho ruim em exemplos onde há poucos ou nenhum), optamos pela segunda escolha**" — isto é, **macro**.

**Isto é exatamente o argumento que se aplica ao nosso conjunto.** Com 95 bugs em 30 PRs, a distribuição é quase certamente desigual, e a métrica micro é dominada pelos PRs com mais bugs. A Cognition não só escolheu macro como explicou por quê, e ainda registrou a armadilha algébrica (média de F1 ≠ F1 das médias) que teríamos que evitar.

**Ressalva:** o SWE-check é o modelo local de detecção de bugs da Cognition, não o Devin Review, e o N de amostras **NÃO FOI ENCONTRADO**.

#### 8.1.2 Macroscope — micro no headline, com checagem macro publicada (mas sem os números)

- **Link:** https://macroscope.com/blog/code-review-benchmark · **Data:** 2025-09-17

> "**when examining the unweighted averages (i.e. averaging each tool's bug detection rate across their per-language bug detection rates), we observed that our relative overall ranking remained unchanged.**"

Headline: 57/118 = 48,31% = **micro**. A checagem macro foi **por linguagem**, não por PR, e **os números não foram publicados**.

#### 8.1.3 Todos os demais — micro, sem discussão

**Qodo** — https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/ (2026-02-04):

> "**Recall:** Calculated as the rate of ground truth issues recognized by the tool. **Precision:** Calculated as the rate of tool-generated comments that correctly correspond to a ground truth issue. **F1 Score:** The harmonic mean of Precision and Recall"

Razão sobre contagens agregadas ⇒ **micro**.

**Martian Code Review Bench** — https://github.com/withmartian/code-review-benchmark (README, acessado 2026-08-13). Fórmulas literais do README:

> "Offline Precision: Tool comments that match a golden comment / total tool comments"
> "Offline Recall: Golden comments found by the tool / total golden comments"
> "Online Precision: Bot suggestions matched to real fixes / total suggestions"
> "Online Recall: Real fixes caught by the bot / total fixes made"

Também micro. **Se o README especifica agregação micro vs macro explicitamente: NÃO ENCONTRADO** — a fórmula implica pooling, mas não há declaração sobre a escolha.

**Consolidado:** com 30 PRs e 95 bugs, micro e macro divergem bastante se a distribuição de bugs por PR for desigual (um PR com 12 bugs domina a métrica micro). **Nenhum fornecedor publica os dois com números.** A Cognition publica só macro e justifica; a Macroscope publica micro e diz ter checado macro sem mostrar. **Publicar micro E macro, com os dois números e a diferença explicada, continua sendo uma contribuição real — e agora temos o argumento da Cognition, citável, para justificar por que macro importa.**

### 8.2 Benchmark próprio da Greptile (auto-publicado)

- **Link:** https://www.greptile.com/benchmarks · **Data declarada da execução: julho de 2025.** Página rotulada "AI Code Review Benchmarks 2025". Acessada 2026-08-13.

Escala: **5 ferramentas, 50 bugs, 5 repos** (Sentry/Python, Cal.com/TypeScript, Grafana/Go, Keycloak/Java, Discourse/Ruby).

Metodologia literal:

> "From each, 10 real bug-fix PRs were traced back to the commits that introduced the bugs. Extremely large or single-file changes were excluded to keep the set realistic. For each case, two branches were created: one before the bug and one after the fix. A fresh PR reintroduced the original change and was replicated across 5 clean forks, one per code review tool."

> "A bug counted as 'caught' only when the tool explicitly identified the faulty code in a line-level comment and explained the impact."

**A limitação decisiva, declarada por eles mesmos:**

> "**Scoring considered only detection of the original bug; false positives, style suggestions, and unrelated comments did not affect the catch rate.**"

**Ou seja: é um benchmark de RECALL PURO. Não mede precisão.** Resultado: Greptile 82%, Bugbot 58%, Copilot 54%, CodeRabbit 44%, Graphite 6%.

E a auto-ressalva de validade:

> "Note that this evaluation was conducted in July 2025, and these tools evolve quickly, so performance may change over time."

**Leitura:** benchmark de fornecedor, com o fornecedor em primeiro lugar, medindo só a métrica em que ele é forte, com dados de julho/2025 (13 meses atrás na data desta compilação). O 6% da Graphite deve ser tratado com muito ceticismo. Use como exemplo de metodologia, não como resultado.

### 8.3 Benchmark próprio da Qodo (auto-publicado, o mais rigoroso do conjunto)

- **Link:** https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/ · **Data:** 2026-02-04

Escala: **100 PRs, 580 issues, 8 repositórios**, TypeScript/Python/JavaScript/C/C#/Rust/Swift. Dataset público em GitHub org própria.

A crítica declarada aos benchmarks anteriores (inclusive ao da Greptile, nomeada):

> "We address critical limitations in existing benchmarks, which primarily rely on backtracking from fix commits to buggy commits, thereby narrowly focusing on bug detection while neglecting essential code quality and best-practice enforcement."

> "**Greptile** made an important first step by creating a benchmark based on backtracking from fix commits... **Augment** also used this approach to evaluate several AI code review tools. These methods are effective at spotting real bugs but are limited in scale, often only a single bug per commit review, and do not capture the size, complexity, or context of full pull requests."

O pipeline de construção (relevante porque é injeção de defeitos, como o nosso golden set):

1. **Repository Analysis and Rule Extraction** — regras de boas práticas extraídas por agente + validação humana.
2. **PR Collection & Filtering** — "3+ files, 50-15,000 lines changed, recently merged"; e um filtro que vale copiar: *"we exclusively select PRs that were merged **without** subsequent reverts or immediate followup fix commits"*.
3. **Violation Injection** — violações de compliance injetadas por LLM, "corrupting the diff while preserving the original functionality".
4. **Issues Injection** — "an additional 1-3 functional/logical bugs are injected... logical errors, edge case failures, race conditions, resource leaks, and improper error handling".
5. **Ground Truth Validation** — "double verification"; problemas naturais encontrados nessa checagem são **adicionados ao ground truth**.

Setup de avaliação (também vale copiar):

> "All benchmarked pull requests (PRs) were opened on a clean, forked repository. Prior to opening the PRs, we ensured that the repository-specific best practice rules, formalized in an **AGENTS.md** file, were committed to the root directory, making them accessible to all participating tools"

> "Each of the 7 evaluated code review tools was configured using its **default settings**"

Definição de "Hit" — **mais estrita que a nossa e vale considerar**:

> "An inline comment generated by a tool is classified as a 'Hit' (True Positive) if two criteria are met: The comment text accurately describes the underlying issue **AND** the localization (the file and line number reference) is correct and points to the source of the issue."

Julgamento por LLM-as-a-judge. Resultado principal: Qodo F1 60.1%, recall 56.7%.

**Ressalvas:** (a) é benchmark de fornecedor e o fornecedor ganha; (b) bugs injetados por LLM podem ter assinatura estatística distinta de bugs reais — a Qodo não discute esse risco; (c) o modo "Exhaustive" que ganha é descrito como research preview, não produção.

### 8.4 Martian Code Review Bench — o único de terceiro, e a guerra de "#1"

- **Link:** https://codereview.withmartian.com · **Código/dados:** https://github.com/withmartian/code-review-benchmark

Estrutura de duas camadas, transcrita da descrição da CodeRabbit (2026-03-03) e confirmada no README:

> "**Online benchmark:** analyzes code review comments that developers actually accept or reject across open source repos. When a developer fixes an issue found by a code review tool, that's a signal that the review comment was useful."
> "**Offline benchmark:** runs every code review tool on the same **50 PRs** and analyzes them against a curated set of previously identified bugs called the 'gold set.'"

**Aqui está o achado mais importante desta seção: QUATRO fornecedores publicaram, em datas diferentes, que são "#1" no MESMO benchmark.**

| Fornecedor | Data do post | F1 reivindicado | Precisão | Recall | Link |
|---|---|---|---|---|---|
| CodeRabbit | 2026-03-03 | 51.2% | 49.2% | (a maior) | coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark |
| Qodo (Extended) | 2026-03-15 | 64.3% | 62.3% | 66.4% | qodo.ai/blog/qodo-ranked-1-ai-code-review-tool-in-martians-code-review-benchmark |
| cubic | 2026-03-25 | 61.8% | 56.3% | 68.6% | cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark |
| Greptile | 2026-07-30 | 60.8% | 76.2% | 50.6% | greptile.com/content-library/greptile-martian-code-review-benchmark |

Os números **não são comparáveis entre si**: são snapshots de um leaderboard contínuo, em camadas diferentes (online vs offline), com composições de ferramentas diferentes. A própria Qodo reconhece:

> "these evaluations are not static. They evolve as datasets expand, methods improve, tools continue to develop and new ones are introduced. The Martian Code Review Benchmark reflects that dynamic with **results representing a snapshot in time rather than a fixed ranking.**"

**Lição direta para o codereviewbench.com: um leaderboard contínuo sem versionamento de snapshot vira munição de marketing e perde valor científico.** Se publicarmos ranking, precisamos de snapshots datados, imutáveis e citáveis.

E a lista completa de reivindicações de topo cresce quando se inclui o resto do mercado — a CodeAnt reporta **#3 com 51.7% F1** (52.2% precisão, 51.1% recall) em https://www.codeant.ai/blogs/ai-code-review-benchmark-results-from-200-000-real-pull-requests, byline **2026-03-17**. A mesma empresa escreve, no mesmo post:

> "**Every AI code review vendor publishes benchmarks where they win. Greptile publishes benchmarks where Greptile wins. CodeRabbit publishes benchmarks where CodeRabbit wins.**"

### 8.4.1 🔴 A CADEIA DE PROVENIÊNCIA: quase todos os números públicos descendem de UM conjunto de 50 PRs

**Este é, disparado, o achado mais importante de toda a seção de benchmarks, e ele muda como devemos nos posicionar.**

Reconstruindo a linhagem a partir das citações e artefatos de cada fornecedor:

**1. Greptile (jul/2025)** monta um conjunto de **50 PRs / 50 bugs / 5 repos** (Sentry, Cal.com, Grafana, Keycloak, Discourse) por backtracking de fix commits. **Mede só catch rate e ignora falsos positivos explicitamente:** *"Scoring considered only detection of the original bug; false positives, style suggestions, and unrelated comments did not affect the catch rate."* Greptile fica em 1º. https://www.greptile.com/benchmarks

**2. Augment (2025-12-11)** pega esse conjunto, **adiciona 145 golden comments próprios**, e passa a calcular precisão — que o conjunto original não media. Augment fica em 1º (F 59%).
- Link: https://www.augmentcode.com/blog/we-benchmarked-7-ai-code-review-tools-on-real-world-prs-here-are-the-results
- O dataset é **público**: https://github.com/ai-code-review-evaluations. Descrição da org, literal: *"AI Code Review tools on Greptile Benchmarks (https://www.greptile.com/benchmarks) Nov-2025"*.
- README do `golden_comments`, literal: *"**We use the Greptile AI Code Review benchmark dataset**... **the only public dataset for Code Reviews**, for this comparison."* e *"To fix the set of golden comments, we manually reviewed the PRs, manually reviewed issues pointed out by the 7 tools, **used Auggie** to improve our understanding of the codebase, and updated the golden comments to add missing valid golden comments."*
- Golden comments por repo: Sentry 35, Cal.com 32, Grafana 24, Discourse 29, Keycloak 25 = **145**.
- ⚠️ **A Augment usou o próprio produto (Auggie) para curar o gold set contra o qual se avaliou, e não publica declaração de conflito de interesse: NÃO ENCONTRADO.**

**3. Propel (≤jan/2026)** re-roda **a si mesma** sobre a suíte da Augment e publica-se em 1º (F 64%). https://www.propelcode.ai/benchmarks. Três problemas de integridade, todos verificáveis:
- 🚩 **A Propel removeu a autora do benchmark da própria tabela.** A página linka o post da Augment e as seis linhas de concorrentes são **numericamente idênticas** às da Augment — mas **a linha da Augment (F 59%) não aparece**, substituída pela da Propel. O subtítulo diz "seven AI code review tools"; a tabela lista Propel + 6. **Nenhuma nota explica a omissão.**
- 🚩 **Uma divulgação foi removida da página ao vivo.** O snapshot do Wayback de **2026-01-19** continha uma seção "Conservative Adjustments", hoje ausente: *"**Propel was configured to surface only bug-related findings for this evaluation. Performance, architectural feedback, code duplication, and similar categories were excluded via configuration.**"* / *"Two cases were excluded due to faulty or ambiguous benchmark data."* / *"…executed the evaluation only for its own results."* Os números não mudaram; a divulgação sumiu.
- 🚩 Artefatos em https://github.com/propel-gtm (102 repos = 50 pares únicos repo/PR) foram criados em **2026-03-05/06**, ou seja, **depois** de a página de benchmarks já existir (jan/2026). Sem labels, sem outputs, sem scripts de scoring.

**4. Martian (fev/2026)** constrói o gold set do seu benchmark *offline* **a partir dos conjuntos de Augment e Greptile**. A CodeAnt declara: *"The curated gold dataset… was initially built using datasets from two existing tools: **Augment**, **Greptile**"*. A CodeRabbit descreve o mesmo fato: *"The offline comparison started with a dataset of known bugs curated by **two other code review vendors**"*.

**5. CodeAnt, CodeRabbit, Qodo, cubic (mar/2026) e Greptile (jul/2026)** reportam colocação nesse benchmark, quatro deles declarando-se #1.

**Consequência.** O benchmark "independente" que quatro fornecedores usam para se declarar #1 tem, no lado offline, um gold set **derivado de conjuntos montados por dois dos concorrentes avaliados**, de tamanho 50, curado em parte com a ferramenta de um deles. A camada *online* (comportamento de desenvolvedor) é genuinamente independente; **a offline não é**. E em cada elo da cadeia, **quem republica o conjunto fica em primeiro lugar**.

**A exceção honrosa: Macroscope.** É o único dos fornecedores levantados com dataset **independente** (118 bugs / 45 repos, construído do zero) **e** com declaração de conflito de interesse publicada — ver §8.5.5.

E a CodeAnt publica a consequência técnica disso, que é a mesma crítica da CodeRabbit:

> "If another tool identifies a real issue not present in the gold set, the benchmark may classify that comment as a **false positive**."

**O que isso significa para o codereviewbench.com — e é uma boa notícia:** existe um vácuo real. O mercado tem (a) benchmarks de fornecedor onde o fornecedor ganha, (b) um benchmark de terceiro cujo gold set descende de dois fornecedores, e (c) nenhum benchmark que **isole a variável modelo com harness fixo**. Nossos 95 bugs golden, montados de forma independente, com replay determinístico de ferramentas e o mesmo loop para todos os modelos, **não colidem com essa linhagem** — medem outra coisa. Devemos dizer isso explicitamente na publicação, e devemos declarar a proveniência do nosso gold set com a mesma clareza que cobramos dos outros.

### 8.5 A crítica da CodeRabbit ao método de gold set — que é o NOSSO método

**Isto é o que mais deve nos incomodar neste documento.**

- **Link:** https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark · **Data:** 2026-03-03

> "The reason why the online benchmark approach is important is that **the offline approach often will flag a false positive when a code review tool finds a real issue that the benchmark's gold set doesn't include. High-volume tools like CodeRabbit simply surface more issues that the gold set didn't anticipate leading to bias against tools with higher recall.**"

> "**The gold set is incomplete.** The offline comparison started with a dataset of known bugs curated by two other code review vendors but they found some comments that were scored as 'false positives' were actually real issues the gold set didn't include."

E a mesma empresa, sobre benchmarks de fornecedor em geral:

> "AI code review benchmarks have mostly been published by other code review vendors (whose tools always seem to come out on top in their benchmarks)."

**Aplicação direta ao nosso bench:** com 95 bugs golden em 30 PRs, **toda descoberta verdadeira fora do gold set é contada como falso positivo.** Isso penaliza sistematicamente os modelos de alto recall e **infla a precisão medida dos modelos conservadores**. Concretamente: a precisão de 73.9% do gemini-3.7-flash (6 FP em 30 PRs) é o número mais suspeito da nossa tabela — um modelo que fala pouco tem pouca chance de ser punido por falar coisa certa que não está no gold set. Ver §10.

### 8.5.1 DeepSource — o benchmark de fornecedor mais bem executado, e a crítica que mais nos atinge

Este é o único fornecedor que publica **resultados brutos**, **juiz cego** e uma **auto-crítica** do próprio benchmark.

- **Link:** https://deepsource.com/benchmarks · acessado 2026-08-13

**Dataset:** 165 CVEs filtrados do OpenSSF vulnerability dataset, JavaScript/TypeScript, com três critérios ("Dual-commit availability", "Ground truth present", "Tractable file size: the affected file(s) must not exceed 1,000 lines of code").

**Resultados publicados** (165 diffs para todas as ferramentas):

| | DeepSource | Cursor BugBot | Semgrep | CodeRabbit | Claude Code† | Greptile | Devin | Codex‡ |
|---|---|---|---|---|---|---|---|---|
| Precision | 100% | 74.23% | 74.07% | 100% | 90.7% | 85.45% | 89.06% | 94.74% |
| Recall | 73.17% | 87.80% | 24.39% | 21.95% | 47.56% | 57.32% | 69.51% | 65.85% |
| F1 | **84.51%** | 80.45% | 36.70% | 36.00% | 62.40% | 68.61% | 78.08% | 77.70% |

> "† Claude Code was tested using Opus 4.5. ‡ Codex was tested using their cloud PR review, which uses GPT-5-Codex."

**MICRO vs MACRO — a única resposta explícita do mercado inteiro, e ela é incomum:**

> "Judge: Claude Opus 4.5. **Each CVE/variant pair is scored as a single binary outcome — True Positive, False Positive, True Negative, or False Negative. Regardless of how many comments, findings, or files a tool flags on a given entry, the question is singular: did this tool correctly identify the specific CVE vulnerability? A tool that posts 15 comments on a PR receives the same credit as one that posts a single precise finding, and there is no partial credit or weighted scoring.**"

> "**Edge cases.** If a tool posts multiple comments and at least one correctly identifies the CVE, the entry is scored as a True Positive."

**Leitura:** não é micro-por-finding nem macro-por-PR clássico. É **binário por entrada, agregado sobre 165 entradas de peso igual**. **Consequência crítica: ruído dentro de uma entrada NÃO é penalizado.** É por isso que DeepSource e CodeRabbit aparecem ambos com 100% de precisão — o FP só ocorre quando a ferramenta aponta a vulnerabilidade original numa variante **já corrigida**. Esse desenho infla a precisão de ferramentas verborrágicas e não mede nit algum.

**Blindagem do juiz — boa prática que devemos copiar:**

> "Critically, **the judge did not see the tool's name**, eliminating potential bias toward or against specific vendors. The judge output structured JSON with per-issue reasoning and an overall `cve_matches_any_issue` verdict."

**Publicidade dos artefatos — o melhor do corpus:** "All judged results from the security benchmark are publicly available in the DeepSourceCorp/benchmarks repository" (8 arquivos `.jsonl`, um por ferramenta).

**E a crítica que atinge diretamente o nosso desenho:**

- **Link:** https://deepsource.com/blog/ai-code-review-benchmarks · **Data:** 2026-02-26 — Jai

> "Several AI code review tools have published benchmarks. The problem: there's no SWE-bench for code review. No shared yardstick. **Each vendor runs their own benchmark, on their own dataset, and wins.**"

> "**Get a real sample size. 50 PRs is not enough. Statistical noise dominates and a few edge cases can swing scores by 10+ points. Anything under 100 entries should be treated with skepticism.**"

> "Where we fall short: **we ran the benchmark ourselves.** The data is published for anyone to verify, but no third party has done so yet. 165 entries is more than most vendor benchmarks, but it's still not large. And we only cover security."

> "Until then, **treat all vendor benchmarks, including ours, with skepticism. Look for published data, reproducible methodology, and honest scope claims. Be especially wary of any benchmark where the designer also happens to win.**"

**Aplicação direta e desconfortável: o nosso bench tem 30 PRs.** Pelo critério publicado da DeepSource, isso está bem abaixo do limiar de ceticismo ("anything under 100 entries"). Temos 95 bugs golden, o que ajuda se a unidade de agregação for o bug e não o PR — mas isso torna a decisão micro-vs-macro (§8.1) **ainda mais consequente**, porque em macro o nosso N efetivo é 30, não 95. **Este é o argumento mais forte para reportarmos micro como métrica principal e macro apenas como checagem de robustez, declarando o N das duas.**

### 8.5.2 Snyk — dois benchmarks, e a auto-crítica sobre circularidade do ground truth

**(A) arXiv:2402.13291 — dataset e código públicos.** 156 bug patterns (40 de segurança), >5.000 exemplos rotulados manualmente, a partir de 6 milhões de commits. Código em https://github.com/snyk/deepcode_ai_fix.

**Micro vs macro:** a fórmula publicada é média sobre **instâncias de defeito**, com peso igual — **micro por instância. Não existe agregação por PR no paper** (o que é coerente: é APR, não review de diff).

**(B) Snyk VulnBench JS 1.0** — https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/ · 2026-06-29

> "The benchmark contains 10 JavaScript fixture projects with 44 Snyk Code reference findings."
> "Each configuration ran each task **five times**: 10 tasks x 6 configurations x 5 repetitions = 300 runs."

**Micro vs macro:** por finding, pooled sobre as 10 fixtures. Scorer deliberadamente leniente:

> "**The scorer is intentionally lenient: a model finding is credited if it reports the same vulnerability type as a reference finding. It does not need to match the same file, line, severity, or source-to-sink path.**"

**Note o contraste com a Qodo**, que exige localização exata (arquivo + linha). Duas definições de "hit" incompatíveis, com números não comparáveis entre si. Mais uma razão para declararmos a nossa explicitamente.

**A auto-crítica sobre circularidade — o melhor exemplo de honestidade metodológica do corpus:**

> "**Snyk Code defines the reference set for this benchmark. That means its 100% score is not an accuracy claim about all possible vulnerabilities in the projects.** It means Snyk Code reproduced its own reference findings deterministically across repeated runs."

> "**Because this benchmark does not use an independent, exhaustively adjudicated ground truth set, Snyk-reference F1 should not be read as true vulnerability-detection accuracy.**"

> "This table should not be read as 'Snyk proved Snyk is 100% accurate.'"

> "The reference set comes from Snyk Code. That is transparent and reproducible, but **circular if treated as a universal truth set**."

**Este é o modelo de aviso que deveríamos escrever no codereviewbench.com.** Nosso gold set de 95 bugs é, do mesmo modo, uma escolha nossa — e a métrica é "recall contra o nosso gold set", não "recall contra todos os bugs existentes nos 30 PRs".

### 8.5.3 Graphite — eval de 500 PRs, mas sem métricas e sem publicação

**Fonte SECUNDÁRIA (Anthropic), ~2024-12, pré-2025:**

> "The team's rigorous evaluation framework tested models against **500 pull requests**, including synthetic and real-world examples with known bugs that even experienced engineers struggled to spot."

> "The system currently provides **actionable feedback on one in five pull requests**, nearing the industry standard of one in three receiving human comments."

**N = 500 PRs, sintéticos + reais, com bugs conhecidos. Mas: sem precisão, sem recall, sem F1 — apenas "eval performance skyrocket". Não é público. Micro vs macro: NÃO ENCONTRADO e indeterminável.**

### 8.5.3.1 Cursor — "resolution rate" online + BugBench offline (metodologia descrita, dataset não público)

- **Link:** https://cursor.com/blog/building-bugbot · **Data:** 2026-01-15

**Métrica online, e ela é diferente de tudo o mais no corpus:**

> "To solve this problem, we devised a metric called the **resolution rate**. It uses AI to determine, **at PR merge time, which bugs were actually resolved by the author in the final code.** When developing this metric, we spot-checked every example internally with the PR author and we found that the LLM correctly classified nearly all of them as resolved or not."

**Benchmark offline:**

> "We began evaluating changes online using actual resolution rates and offline using **BugBench, a curated benchmark of real code diffs with human annotated bugs**."

**BugBench não é público.** Tamanho, composição, e micro-vs-macro: **NÃO ENCONTRADO**.

**Leitura para nós:** "resolution rate" é uma métrica de comportamento do desenvolvedor (como a camada *online* do Martian), não de ground truth. É imune ao problema do gold set incompleto (§8.5) e vulnerável ao problema oposto — um bug real que o autor ignorou conta como não-resolvido. As duas famílias de métrica são complementares e **nenhum fornecedor publica as duas lado a lado com o mesmo conjunto**. Isso também é um vácuo.

### 8.5.5 🟢 Macroscope — o único dataset independente, e a única declaração de conflito de interesse

- **Link:** https://macroscope.com/blog/code-review-benchmark · **Data:** **2025-09-17**

Metodologia, literal:

> "We selected **45 popular open-source repositories** across the 8 programming languages Macroscope supports... We searched their commit logs to find commits labelled as bug fixes."
> "An LLM classified each commit as either a self-contained issue or a context-dependent issue... **We kept only the self-contained runtime bugs**"
> "This process ultimately yielded a dataset of **118 runtime bugs** across the 45 repositories we sampled."
> "We opened a pull request with the base set to the parent commit branch and the head set to the branch with the bug commit." ← **um PR por bug**
> "Each tool ran with its default settings, and **ran in isolation within independent GitHub PRs** in order to avoid scenarios where one tool might skip reporting a correctly identified bug because another tool already flagged it."
> "We manually verified all of the matched bugs identified for each tool. We also **randomly sampled and verified five non-matches per tool**"
> "This evaluation was conducted between **August 25 2025 and September 14 2025.**"

| Ferramenta | Bugs avaliados | Detectados | Taxa | Média coment./PR |
|---|---|---|---|---|
| **Macroscope** | 118 | 57 | **48.31%** | 2.55 |
| CodeRabbit | 118 | 54 | 45.76% | **10.84** |
| Cursor Bugbot | 118 | 50 | 42.37% | **0.91** |
| Greptile | 72 | 17 | 23.61% | 3.08 |
| Graphite Diamond | 115 | 21 | 18.26% | 0.62 |

**A declaração de conflito de interesse — o único fornecedor do levantamento inteiro a publicar uma:**

> "**We have used the results of this benchmarking data to fix bugs and improve our code review pipeline** (e.g. fix bugs in our AST walkers), however we have not encoded any of the bugs in our dataset into our pipelines, nor trained any models on this data. **We acknowledge that the other tools we evaluated did not have the same opportunity to fix any issues that they would have encountered with this exact dataset.**"

E o escopo declarado honestamente:

> "**We did not assess the quality, value or correctness of all of these comments**" — isto é, **o benchmark público NÃO mediu precisão.**

⚠️ **Inconsistência a registrar:** páginas de SEO posteriores da Macroscope conflacionam os 98% de precisão (de um benchmark interno diferente) com este dataset público de 118 bugs, que explicitamente não mediu precisão.

**Dataset público? NÃO — descrito, não baixável. NÃO ENCONTRADO.**

**Segundo benchmark, interno, com scoring não-F1 — e é uma ideia que vale considerarmos** (2026-02-04):

> "**We had 500+ labeled bugs; without that benchmark, you can't run this system.**"
> "**Severity-weighted scoring. We don't optimize raw F1. Each bug severity tier is worth 5× the next, so critical bugs score 125× higher than low-severity ones (5³).** False positives are penalized."
> "**We re-split the dataset each epoch to avoid overfitting to a single test set.**"
> "Auto-tuning now catches **~3.5× more high-severity bugs with ~50% fewer false positives on TypeScript**... **These results are on held-out test data.**"

**Ponderação por severidade é algo que o nosso bench não faz** e que resolveria parte da objeção "nem todo bug golden vale o mesmo". Registrar como opção, não como recomendação — introduz um parâmetro subjetivo novo.

### 8.5.6 Augment e Propel — números, e as ressalvas

**Augment (2025-12-11)** — 50 PRs, 145 golden comments, dataset público, LLM-as-judge:

| Ferramenta | Precisão | Recall | F |
|---|---|---|---|
| **Augment Code Review** | **65%** | **55%** | **59%** |
| Cursor Bugbot | 60% | 41% | 49% |
| Greptile | 45% | 45% | 45% |
| Codex Code Review | 68% | 29% | 41% |
| CodeRabbit | 36% | 43% | 39% |
| Claude Code | 23% | 51% | 31% |
| GitHub Copilot | 20% | 34% | 25% |

**Micro vs macro: NÃO ENCONTRADO — não declarado.** As fórmulas são contagens brutas de TP/FP/FN sem descrição de média por PR — *consistente com* pooled/micro, mas **nunca dito**, e sem contagens absolutas publicadas.

⚠️ **Um segundo benchmark interno da Augment, do mesmo autor, dá números diferentes** (2026-03-10): "10 PRs from 5 open-source repositories", F1 53.8%, recall 62.8%, precisão 47.0%. A redação é ambígua quanto a serem 10 no total ou 10 por repo.

Métricas online da Augment (2026-03-10), úteis como contraste com ground truth:
> "Bugs fixed (comment posted and addressed by author) per PR / **1.03**" (humanos: 0.54); "True positive rate (comments addressed) / **45%**"; "**Augment prevents more bugs than human reviewers while maintaining a comparable true-positive rate.**"

**Propel (≤2026-01)** — mesma suíte, Propel em 1º com 68% precisão / 61% recall / 64% F. Ver as três bandeiras de integridade em §8.4.1. A Propel enuncia bem o argumento do F-score:

> "**This formulation penalizes tools that optimize for precision at the cost of missing issues, as well as tools that maximize recall by generating excessive noise.**"
> "Codex Code Review matched Propel on precision at 68%, but had the lowest recall among the tools at 29%, **indicating a bias toward precision at the cost of coverage.**"

**Micro vs macro: NÃO ENCONTRADO** — nem pela Propel, nem pela Augment. **A ambiguidade atravessa a cadeia inteira sem nunca ser resolvida.**

### 8.5.7 Cognition — não publica benchmark de code review, mas publica o melhor aviso

**Benchmark público de code review da Cognition: NÃO ENCONTRADO.** Só telemetria de produção, sem metodologia e sem denominador: *"Devin Review catches an average of **2 bugs per PR**, of which roughly **58% are severe**"* (2026-04-22); *"Devin Review now checks hundreds of thousands of PRs per day"* (2026-05-06).

⚠️ **A figura de terceiro amplamente repetida "Devin Review catches ~30% more issues" NÃO é rastreável a nenhuma publicação do fornecedor — tratar como fabricada.**

O eval do Security Swarm (repo inteiro, **não** review de PR) traz a autocrítica mais afiada do corpus:

> "**vendor benchmarks quote recall numbers we can't audit for false positives or reproduce independently**" — https://devin.ai/blog/security-swarm-eval, 2026-07-01

...dita num post que publica o próprio número de 72% de recall, sujeito exatamente a essa crítica. E a definição, que é macro e só-recall:

> "**Recall is the fraction of the 50 cases in which at least one of the run's findings describes the target vulnerability; everything else, including false positives, is ignored.**"
> "**We did not add custom prompts, configuration, or benchmark-specific tuning.**"
> "one can read the recall numbers as **a floor** on what a run finds, not a ceiling."

### 8.5.8 🔥🔥 Baz — o benchmark publicado MAIS PARECIDO COM O NOSSO

**88 PRs, 148 achados semeados, mesmo harness, modelos trocados, recall por modelo.** É, literalmente, o desenho do nosso bench — e é o único no mercado.

- **Link:** https://baz.ai/resources/research/ship-inference-routing-for-agentic-code-review — Nimrod Kor
- **Data:** **2026-07-22**

> "On the same **88-pull-request benchmark**, the direct GPT-5.4 baseline cost $2.06 per pull request and **detected 83 of 148 seeded findings**; the Martian-routed configuration cost $1.03 per pull request and detected 82."
> "Each run records **expected finding coverage, generated findings, tool activity, duration, and token usage.**"

| Rota | Achados / 148 | Recall | Custo médio/PR | Duração média |
|---|---|---|---|---|
| GPT-5.4 direto | 77 | 52.0% | $2.06 | — |
| Roteado (Martian) | 82 | 55.4% | $1.03 | 328 s |
| GLM 5.2 via Martian | 67 | 45.3% | $0.73 | 1.050 s |

**E a disciplina estatística que devemos copiar literalmente:**

> "**We did not treat the five-finding difference as an improvement. The team considered it normal model variance and concluded that the two runs were in the same quality range.**"

Tradução: "**Não tratamos a diferença de cinco achados como uma melhoria. A equipe considerou que era variância normal de modelo e concluiu que as duas execuções estavam na mesma faixa de qualidade.**"

**Isto é uma advertência direta ao nosso resultado.** Se 5 achados em 148 (3,4 p.p. de recall) é ruído para a Baz num N maior que o nosso, então a nossa diferença entre 22.1% e 43.2% provavelmente é real, mas diferenças menores no nosso ranking **não são** — e não temos barra de erro para saber onde fica o corte. Reforça a recomendação 3 do §12.3.

Note também que **eles registram "tool activity" por run**, o que é o análogo direto da nossa contagem de tool calls. É o indício mais forte de que a nossa métrica é a certa — alguém já a coleta, só não a publica.

**Micro vs macro: NÃO ENCONTRADO** — "83 de 148 achados" sobre "88 PRs" é contagem pooled (micro por construção), mas a Baz nunca usa os termos nem reporta distribuição por PR. **Dataset: NÃO público.**

**🟢 E a Baz publica a melhor metodologia de construção e MANUTENÇÃO de gold set do corpus** — https://baz.ai/resources/research/the-anatomy-of-code-review-accuracy, **2026-03-29**:

> "Offline tests feed identical inputs to models and tools for controlled comparisons, **isolating model capability from harness engineering.**"
> "We trace production bugs back to their origin commits to build held-out validation sets... and we perform **adversarial validation when multiple strong tools agree on a finding absent from the gold set.** This process **expands the benchmark as model capability grows rather than letting it cap evaluation at human recall.**"
> "**Gold set incompleteness demands continuous expansion** through model-assisted generation, production-trace validations and adversarial validation campaigns **rather than freezing the set**."

**A primeira frase é a justificativa publicada da nossa arquitetura de harness fixo** ("isolating model capability from harness engineering") — exatamente o argumento que eu havia registrado como hipótese nossa em §12.2.4. Ele existe, publicado, e é da Baz.

**E a "adversarial validation" é a solução direta para a crítica da CodeRabbit em §8.5:** quando várias ferramentas fortes concordam num achado ausente do gold set, isso vira candidato a entrar no gold set em vez de contar como falso positivo. **Devemos adotar isso.**

⚠️ **Bandeira metodológica na própria Baz, que devemos evitar:**

> "Conditioning review and grading on repo-local specs is the final alignment. Agents.md and similar repo specs state what a team cares about; **the reviewer and the grader use the same spec** so precision and recall answer the question 'does the tool do what this team asked?'"

**Revisor e avaliador lendo a mesma spec é circularidade.** A Baz assume isso e redefine a pergunta para acomodá-la, mas é uma escolha que enfraquece o número.

**Benchmark menor da Baz, com ablação de arquitetura (n=8, não público):** "Baz classic (single-agent): 4.5/8 / Roo: 4/8 / Claude Code: 3/8 / Codex: 3.5/8" vs "**Agentic Baz: 7/8**" (2025-12-15). **n=8 é pequeno demais para concluir qualquer coisa, e o meio-ponto não é explicado.** Registrar como direcional, não como evidência.

**Benchmark de terceiro:** a Baz reivindica #1 em precisão no Martian Code Review Bench (snapshot 2026-02-26), com a ressalva honesta *"Many previous 'benchmarks' in this category are too small to generalize, too static to stay clean, and too tied to a single vendor's scoring choices."* ⚠️ **Os únicos links que a Baz dá para esse benchmark são dois posts no x.com/withmartian — sem dataset nem URL de leaderboard.**

### 8.5.4 Quem NÃO publica benchmark de qualidade

- **GitHub:** benchmark interno existe e é usado para decisões, mas **não é público**. *"Our internal Copilot code review benchmarks were useful because they show more than a final score. They show the path the agent took, including which tools it called..."* (2026-07-10). **Precision/recall: NÃO PUBLICADOS.**
- **GitLab:** **NÃO ENCONTRADO.** Só números de custo/tempo.
- **AWS:** **NÃO ENCONTRADO para code review.** O SWE-bench publicado em 2024-09-16 é do agente de *desenvolvimento de features*, não de review, e é pré-2025.
- **Codacy:** **NÃO ENCONTRADO.**
- **Sider:** **NÃO ENCONTRADO** (sem site).

### 8.6 Fonte acadêmica de terceiro sobre CodeRabbit (não é fornecedor)

Rotulada explicitamente como **TERCEIRO / acadêmica**, incluída porque é a maior amostra independente que encontrei e porque contradiz parcialmente as métricas de engajamento auto-publicadas.

- **Título:** "Is Agentic Code Review Helpful? Mining Developers' Feedback to CodeRabbit Reviews in the Wild"
- **Autores:** Hong Yi Lin, Mingzhao Liang, Patanamon Thongtanunam, Kla Tantithamthavorn
- **Link:** https://arxiv.org/abs/2607.03316
- **Data:** submetido 2026-07-03 (v1), revisado 2026-07-23 (v2)

Do abstract, literal:

> "Through an empirical study of 31,073 pairs of code reviews and developer feedback from 10,191 pull requests across 239 GitHub repositories, our results show that agentic reviews receive mixed reception: **36.4% were accepted and 7.3% triggered discussion, while 56.3% were rejected. Rejections were primarily associated with invalid suggestions that were false positives, redundant, or out of scope, as well as misalignment with developer intent and coding practices.** We further found that agentic reviews tend to focus more on functional concerns than evolvability-related comments, yet they were more likely to be invalid."

**Duas leituras relevantes para nós:**

1. **A taxonomia de rejeição é de quatro categorias, não uma:** falso positivo, redundante, fora de escopo, desalinhado com a intenção. Isso reforça §10.2 — colapsar tudo em "falso positivo" perde informação, e a literatura já separa.
2. **56.3% de rejeição** convive com as métricas de "address rate" de 43–66% que os fornecedores publicam. Não são contraditórias (medem coisas diferentes, em populações diferentes), mas mostram que **a métrica de engajamento é fortemente dependente de definição** — mais uma razão para o nosso bench ancorar em ground truth e não em aceitação.

---

## 9. O balanço da evidência sobre loop único vs fan-out

**Leia as duas listas juntas.** Isoladamente, a primeira parece devastadora; com a segunda ao lado, o quadro é de mercado dividido, não de consenso contra nós.

### 9.0 O que CONTRADIZ a nossa abordagem de loop único

Consolidado, em ordem de força da evidência:

**1. Greptile abandonou o loop único que ela mesma tinha adotado.** v3 (2025-11-26) = loop único, publicado como avanço. v5 (2026-08-05) = enxame por hipótese, publicado como avanço sobre o v3. É a evidência mais forte porque é o **mesmo fornecedor**, com **métricas de produção** nos dois sentidos, e porque o v3 é literalmente a nossa arquitetura. Não é alguém dizendo que o loop único é ruim — é alguém que rodou o loop único em produção sobre 1B de linhas e depois saiu dele.

**2. Qodo publicou o delta quantitativo entre passada única e multi-agente, medido por terceiro.** Standard 47.9% F1 vs Extended 64.3% F1, mesmo benchmark, mesmo post (2026-03-15), com o ganho atribuído explicitamente a recall. É o número mais acionável do documento.

**3. cubic afirma um teto explícito.** *"Most AI code review tools run a single LLM pass over the git diff. That approach hits a ceiling quickly. To break past the 40% F1 barrier, we had to change how the agent interacts with the code."* (2026-03-25). **Com a ressalva de que "single LLM pass" ≠ loop agêntico** — o alvo dessa frase é mais fraco do que nós.

**4. Qodo, sobre sobrecarga de um agente único:** *"Asking one reviewer or one agent to do all of this at once leads to tradeoffs between depth, speed, and coverage."* (2026-02-04).

**5. Greptile, sobre sobrecarga de contexto, em outro experimento:** *"we tried that, and ran into a different problem: a single agent handling the full review got overloaded... there was too much context for one agent to manage cleanly."* (TREX, 2026-06-17).

**6. cubic saiu do prompt único monolítico após três revisões de arquitetura**, com o diagnóstico de excesso de falsos positivos e raciocínio opaco (2025-06-19).

**7. Cloudflare rejeitou o prompt único explicitamente** e foi para 7 revisores + coordenador (2026-04-20).

**8. CodeAnt publica a declaração de fan-out por arquivo mais literal do corpus:** *"Each changed file is analyzed independently and in parallel"*, com até 5 turnos por arquivo e uma fase reflectora de agregação (`<lastmod>` 2026-07-27). Ressalva: documenta o CLI, não o produto hospedado.

**9. GitLab constrói o produto de modo que o revisor NÃO POSSA explorar:** *"The review stage cannot fetch additional context on demand."* É a negação mais forte do loop agêntico no mercado, vinda de um fornecedor de primeira linha.

**10. DeepSource e Snyk publicaram evidência empírica de que o LLM sozinho falha em COBERTURA** — não em julgamento (§4.2). Este é o item que mais deve nos preocupar, porque é sobre medição, não sobre preferência arquitetural.

### 9.0.1 🟢 O que SUSTENTA a nossa abordagem de loop único

Não é uma lista curta, e ela não aparece em nenhum resumo de mercado:

**1. Cursor Bugbot mediu o loop único como SUPERIOR ao fan-out com voting e validador, e chamou de "the largest gains".** É o único fornecedor que rodou os dois em produção sobre o mesmo produto, com métrica online definida (resolution rate 52% → >70%) e benchmark offline próprio (BugBench). Migrou **de** 8 passes paralelos + majority voting + modelo validador **para** um único agente com ferramentas. 2026-01-15. Ver §3.7.1.

**2. Greptile atribuiu ao loop único (v3) ganho simultâneo de recall E precisão**, com a explicação mecanicista de que o loop eleva o limiar de certeza: *"an increased threshold for 'sureness' since v3 can challenge its own hypothesis more strongly"*. 2025-11-26.

**3. GitHub Copilot code review roda loop agêntico com `grep`/`glob`/`view` ao vivo, na maior implantação pública que existe** — o título do post de engenharia é "60 million Copilot code reviews and counting" (2026-03-05). É a nossa arquitetura, operando na maior escala declarada do mercado. (Para comparação, a Cursor declara "more than two million PRs per month" no Bugbot — também loop único.)

**4. Cursor mediu que contexto dinâmico funciona tão bem quanto contexto pré-computado:** *"The model consistently pulled in the additional context it needed at runtime, without requiring everything to be provided ahead of time."* Isso contraria diretamente a tese central de DeepSource e Codacy.

**5. As duas mitigações publicadas para o nosso pior modo de falha são de PROMPT, não de arquitetura** (Cursor: "aggressive prompts"; Greptile: alvo numérico de comentários). Se o "filtro na saída" se corrige com prompt, ele não é um argumento contra o loop único — é um parâmetro do harness que estamos deixando no default.

**6. Nenhum dos fornecedores pró-fan-out fez ablação limpa.** Todas as migrações vieram acompanhadas de novos prompts, novos modelos e nova indexação. A Cursor é a única que declara ter rodado dezenas de experimentos com métrica fixa — e a conclusão dela foi a favor do loop. (Ressalva honesta: a Cursor **também** não isolou a arquitetura — os 40 experimentos cobrem modelos, prompts, harness e topologia juntos, e eles trocaram de modelo no mesmo período. Ver §9.1.)

**7. Cognition publicou a doutrina "just use a single-threaded linear agent" (2025-06-12) e, ao revisá-la (2026-04-22), manteve o núcleo:** subagentes read-only *"mostly resemble tool calls rather than true multi-agent collaboration"*. Pelo critério deles, **um harness de review com ferramentas já É o padrão que eles endossam** — a reversão deles é sobre escrita, não sobre leitura.

**8. O DEFAULT da Macroscope é o loop único sobre o diff inteiro** (`full_diff`: "One agent processes the entire PR diff"); o fan-out por objeto de código é opt-in, com custo maior declarado. Mesmo entre os que oferecem fan-out, ele nem sempre é o padrão.

**9. A Baz justifica o fan-out por TESTABILIDADE, não por recall:** *"Narrow responsibilities made subagents easy to unit test, instrument, and roll back."* É um argumento de engenharia de produto que **não se aplica a um harness de benchmark**, cujo objetivo é medir, não operar.

### 9.1 Contra-argumentos honestos (o que NÃO contradiz)

Para não superajustar ao consenso de marketing:

- **Nenhuma dessas transições foi medida contra um loop único BEM FEITO em condições controladas.** Todas são narrativas de produto ("mudamos, melhorou"), com métricas de engajamento (address rate, upvotes) e não de recall/precisão contra ground truth — as exceções parciais são o par Qodo Standard/Extended e a ablação n=8 da Baz.
- **A evidência da Cursor, que é a nossa melhor, tem a mesma fraqueza na direção oposta.** Eles afirmam "the largest gains" ao trocar para o loop agêntico, mas **não publicam comparação controlada** entre 8-passes e agêntico. A métrica-headline (resolution rate 52% → >70%) cobre **40 experimentos** que incluem modelos, prompts, harness e arquitetura simultaneamente. **Também não dizem se o modelo validador sobreviveu à reescrita** — "validators" aparece apenas na lista de coisas que varreram experimentalmente. Registrar isso é obrigatório: não podemos cobrar ablação limpa dos outros e aceitar narrativa da Cursor porque ela nos favorece.
- **A definição de "falso positivo" da Cursor é um artefato:** eles tratam como FP qualquer achado não resolvido antes do merge, o que conta um achado correto-mas-recusado como erro.
- **A ablação da Baz (single-agent 4.5/8 → multi-agent 7/8) é a única comparação direta da mesma equipe** — e tem **n=8**, pontuação com meios-pontos não explicada, e não é pública. Direcional, não conclusiva.
- **Os ganhos publicados são confundidos com outras mudanças simultâneas** — prompts novos, modelos novos, indexação nova. Nenhum é ablação limpa de "loop único vs fan-out".
- **O eixo do fan-out varia e importa:** por hipótese (Greptile v5), por especialidade (cubic, Cloudflare, Qodo), por arquivo (CodeRabbit 2023, obsoleto). Não existe "fan-out" genérico. O de Greptile v5 preserva a exploração profunda por agente; o por-arquivo a destrói.
- **O nosso objetivo é diferente do deles.** Eles otimizam um produto; nós isolamos a variável "modelo" com harness fixo e replay determinístico. Um harness fan-out com N subagentes por especialidade **mistura** a capacidade do modelo com a engenharia do orquestrador — exatamente o que o nosso bench existe para evitar. **O loop único é defensável como INSTRUMENTO DE MEDIÇÃO mesmo que seja inferior como PRODUTO.** Esta distinção não aparece em nenhuma fonte, e é nossa para fazer.
- **cubic reduziu ferramentas para ganhar precisão**, o que contraria a leitura simplista de "mais tool calls = melhor".

---

## 10. Onde as fontes publicadas ATACAM a nossa metodologia de medição

Separado de propósito da seção anterior: aqui não é sobre arquitetura, é sobre se o nosso **número** está certo.

**1. Gold set incompleto infla precisão de modelo calado (CodeRabbit, 2026-03-03).** Já citado em §8.5. Ação sugerida: amostrar manualmente os falsos positivos do gemini-3.7-flash. Com apenas 6 FP em 30 PRs, dá para auditar 100% deles em uma hora. Se uma fração relevante for achado verdadeiro fora do gold set, a precisão de 73.9% cai e a história muda.

**2. "Nit" ≠ "alucinação", e nós tratamos os dois como FP (Greptile, 2024-12-18).** 79% nits vs 2% incorretos. Nossa métrica de precisão soma coisas de naturezas diferentes. Ação sugerida: classificar os FP em (a) factualmente errado, (b) correto mas irrelevante.

**3. Micro vs macro não é discutido por ninguém, e com 30 PRs isso morde.** Ação sugerida: publicar ambos.

**4. Definição de "hit" — a Qodo exige localização correta (arquivo + linha) além da descrição correta.** Se o nosso matching for mais frouxo, nosso recall não é comparável ao deles. Precisa ser declarado explicitamente na publicação.

**5. Variância entre execuções.** A Greptile rodou `/review` **3× por PR** e mediou. A TREX define precisão parcialmente como **consistência entre execuções**: *"precision (e.g., consistency across runs: if you review the same PR twice, are you finding roughly the same set of issues?)"* (2026-06-17). E a Snyk rodou **5×** e publicou o resultado alarmante: *"**61.7% of its LLM-only reports appeared in just one of five runs**"* e *"Nearly half of the unique, unmatched model findings appeared in only one of five identical repetitions"* (2026-06-29). **Se rodamos uma vez por caso, não sabemos nossa barra de erro** — e o dado da Snyk sugere que ela pode ser grande o bastante para engolir a diferença entre 1.7 e 3.4 findings/caso. Este é o furo metodológico mais caro de ignorar.

**6. Tamanho da amostra — a crítica mais direta, e é nominal.** DeepSource, 2026-02-26: *"**Get a real sample size. 50 PRs is not enough. Statistical noise dominates and a few edge cases can swing scores by 10+ points. Anything under 100 entries should be treated with skepticism.**"* **Temos 30 PRs.** Se agregarmos por PR (macro), nosso N é 30 — bem abaixo do limiar que um concorrente já publicou como critério de ceticismo. Se agregarmos por bug (micro), o N é 95, ainda abaixo. Isso não invalida o trabalho, mas **precisa estar declarado na publicação, antes que alguém o declare por nós**.

**7. Prevalência de bugs de 100% por construção.** Nosso conjunto é feito de PRs que sabidamente contêm bugs. No mundo real, a maioria dos PRs não contém bug grave — a GitHub publica que fica em silêncio em **29%** das reviews *por política*, e a Cursor publica **0,7 bugs sinalizados por run**. Um modelo pós-treinado para "silence is better than noise" é penalizado pelo nosso setup de um jeito que não reflete seu comportamento em produção. **É uma limitação de validade externa, não um erro** — mas tem de ser dita.

**8. Nosso instrumento pode estar medindo o prompt, não o modelo.** Cursor publicou que a diferença entre "conter o modelo" e "prompt agressivo" foi o que separou uma versão ruim de uma boa no *mesmo* loop agêntico. Se o nosso prompt default estiver no lado contido, estaremos medindo "quão cauteloso este modelo é sob um prompt neutro", não "quanto este modelo consegue achar". Ver recomendação 1 do §12.3.

---

## 11. NÃO ENCONTRADO — inventário explícito

1. **Contagem de chamadas de LLM por review: ENCONTRADO em UM fornecedor apenas — GitLab** (~16 / ~28 / ~40, Security Review Flow; ver §3.9). **NÃO ENCONTRADO** em Greptile, CodeRabbit, cubic, Qodo, GitHub, AWS, DeepSource, Codacy, Snyk, Graphite, CodeAnt, Cloudflare. Parciais: Snyk (k=5 candidatos por issue), Codacy ("one request per file with issues"), CodeAnt ("up to 5 conversation turns" por arquivo). *Correção sobre uma versão anterior deste documento, que registrava "NÃO ENCONTRADO em nenhum fornecedor" — estava errado.*

2. **Contagem de TOOL CALLS por review, por modelo, com harness fixo: NÃO ENCONTRADO em ninguém.** É a métrica do nosso bench e não tem par publicado. O mais próximo é a GitHub, que descreve a métrica sem publicar o número: *"They show the path the agent took, including which tools it called, how much output came back"* — e diz apenas, em termos relativos, *"The agent was making a similar number of tool calls, but spending more of them on relevant evidence instead of repeatedly expanding the search."*

3. **Mecanismo publicado que garanta cobertura de todo o diff: NÃO ENCONTRADO em nenhum dos ~20 fornecedores.** Termos `no file left unreviewed`, `exhaustive coverage`, `every changed file`, `multi-pass`, `second pass`, `each hunk` não aparecem como descrição de mecanismo em nenhuma fonte primária. Verificação mais forte disponível: grep exaustivo no corpus completo de docs da CodeAnt (9,4 MB) → **0 ocorrências** para todos esses termos. As únicas reivindicações de exaustividade são da **camada estática determinística**, não do agente (DeepSource: "It checks everything, every time"; Snyk: "systematically enumerating").

4. **Métrica de cobertura de diff (quantos % dos arquivos alterados o agente efetivamente leu): NÃO ENCONTRADO em ninguém.**

5. **Ablação limpa "loop único vs fan-out" com o resto constante: NÃO ENCONTRADO.** O par Qodo Standard/Extended é o mais próximo, mas as duas configurações diferem em mais coisas que a topologia.

6. **Macro-averaging (média por PR) de precisão/recall: NÃO ENCONTRADO em nenhum benchmark público.** Todos usam micro, com três variantes distintas e não comparáveis entre si: micro por finding (Qodo, Martian, Snyk VulnBench), micro por instância de defeito (Snyk arXiv), binário por entrada com ruído intra-entrada não penalizado (DeepSource).

7. **Contagem "7-8 modelos" da CodeRabbit em fonte primária: NÃO ENCONTRADO.** Aparece em cobertura de terceiro (theaiengineer.substack.com, medium.com/data-science-collective — **ambas SECUNDÁRIAS, não verificadas contra fonte CodeRabbit**). A doc oficial de arquitetura lista agentes nomeados, não uma contagem de modelos.

8. **Data de publicação da página de arquitetura da CodeRabbit e das docs em geral: NÃO ENCONTRADO.** As docs (Mintlify) não expõem data. Só temos a data de acesso: 2026-08-13. Mesmo problema em `docs.codeant.ai` (datável só via `sitemap.xml` `<lastmod>`) e no post "deterministic-first" da Codacy.

9. **Metodologia do Martian sobre agregação micro/macro declarada explicitamente: NÃO ENCONTRADO** no README; as fórmulas implicam micro. O site `codereview.withmartian.com` é uma SPA em JS e **não foi possível extrair texto** — nem por fetcher HTTP nem por WebFetch. Todas as informações sobre o Martian neste documento vêm do README no GitHub e de descrições de fornecedores que reportam nele.

10. **Origem do gold set offline do Martian: CONFIRMADA POR DUAS FONTES CONCORRENTES, mas não pelo Martian.** CodeRabbit: "curated by two other code review vendors". CodeAnt: "initially built using datasets from two existing tools: Augment, Greptile". **Ambas são de concorrentes avaliados, não do Martian.** Uma declaração do próprio Martian sobre a proveniência: **NÃO ENCONTRADO** (bloqueado pela SPA).

11. **Qual modelo a GitHub usa no Copilot code review: NÃO ENCONTRADO.** Nenhuma página GitHub nomeia o modelo.

12. **Modelo default do DeepSource Cloud: NÃO ENCONTRADO.** Só a configuração BYOK é documentada.

13. **Qual modelo a CodeAnt usa: NÃO ENCONTRADO — e a doc de compliance ship um placeholder editorial não preenchido:** *"third-party general-purpose AI (GPAI) foundation models accessed via **[confirm provider(s) - e.g., OpenAI, Anthropic, Azure OpenAI, self-hosted open-weights models]**"* (https://docs.codeant.ai/compliance/EU-AI-Act-Statement, `<lastmod>` 2026-07-02). Os quatro nomes são **exemplos dentro de um TODO**, não divulgação. A CodeAnt declara a razão do sigilo: *"Customer-facing summaries are available under NDA on request."*

14. **Sider: TUDO NÃO ENCONTRADO** — domínio sem registro A em 2026-08-13. Ver §3.14.

15. **Arquitetura do revisor HOSPEDADO da CodeAnt (GitHub/GitLab): NÃO ENCONTRADO.** Só o CLI é documentado.

---

## 12. Conclusão — separando FATO de HIPÓTESE

### 12.1 FATOS (transcritos de fonte primária, datados)

1. **Cursor Bugbot migrou de fan-out (8 passes + majority voting + modelo validador) PARA um loop agêntico único, e chamou o resultado de "the largest gains"** (2026-01-15). Métricas: resolution rate 52% → >70%; bugs sinalizados por run 0.4 → 0.7.
2. **Greptile migrou de fluxograma para loop único (2025-11-26) e depois de loop único para enxame por hipótese (2026-08-05)**, atribuindo ganhos às duas mudanças.
3. cubic, Qodo, CodeAnt, CodeRabbit, Cloudflare, Codacy e DeepSource descrevem **fan-out** (por especialidade, por arquivo ou por finding) com um estágio de consolidação/filtro. Publicado entre 2025-06 e 2026-07.
4. **GitHub Copilot code review é o maior produto do mercado a declarar um loop agêntico único** com `grep`/`glob`/`view` ao vivo (2026-03-05, 2026-07-10). GitLab Duo declara o oposto: *"The review stage cannot fetch additional context on demand."*
5. **DOIS fornecedores publicaram o "filtro na saída" com a MESMA mitigação de prompt:** Cursor (*"it was too cautious... we shifted to aggressive prompts"*, 2026-01-15) e Greptile (alvo de 7–10 comentários recuperou o recall do GPT-5.5, 2026-07-21).
6. **DOIS fornecedores publicaram a "parada precoce":** DeepSource (*"It was zero output. The model skipped the vulnerable code entirely."*, 2026-02-24) e Snyk (*"stop after finding one representative example of a repeated pattern"*, 2026-06-29).
7. **Qodo publicou que precisão é ajustável post-hoc e recall não é** (2026-02-04), e mediu 47.9% F1 (single-pass) vs 64.3% F1 (multi-agente + verificação) no mesmo benchmark de terceiro.
8. **Greptile testou LLM-as-judge ingênuo em 2024 e reprovou** (*"nearly random"*). Ressalva: geração de modelos anterior. **Snyk resolve o mesmo problema com verificador determinístico** (o próprio SAST), não com LLM.
9. **Snyk publicou a dinâmica filtro-duro → perda de recall → retry com feedback** (2026-04-27) — a única descrição pública dessa correção.
10. **Só a GitLab publica contagem de chamadas de LLM** (~16/~28/~40 por review). **Ninguém publica métrica de cobertura de diff.** **Ninguém publica macro-averaging.**
11. **Quatro fornecedores reivindicaram "#1" no mesmo benchmark de terceiro** em datas diferentes de 2026, e o gold set offline dele descende de conjuntos de dois concorrentes avaliados, num lote de 50 PRs.
12. **CodeRabbit, DeepSource e Snyk publicaram, cada um, uma crítica ao método de gold set que se aplica diretamente ao nosso** — incluindo *"50 PRs is not enough... Anything under 100 entries should be treated with skepticism"* (DeepSource, 2026-02-26).
13. **Modelo por estágio é prática publicada e comum.** Cloudflare coloca o modelo **mais caro no estágio de FILTRO**; Codacy usa Gemini para gerar e OpenAI para triar FP; DeepSource usa flagship + modelo menor.
14. **Snyk mediu que um modelo mais caro performou PIOR** (Opus 4.7 Max: 5,67× o custo, F1 68.8% vs 75.4% do Opus 4.6 Medium).

### 12.2 HIPÓTESES (nossas, não sustentadas por citação)

1. *Hipótese:* o fan-out do mercado é, funcionalmente, um mecanismo de **cobertura** disfarçado — N agentes com escopos sobrepostos reduzem a chance de que uma parada precoce individual apague um bug. Ninguém escreve isso. Se estiver certo, nosso achado de parada precoce explica **por que** o mercado convergiu para fan-out sem nunca ter medido o fenômeno.
2. *Hipótese:* a "parada precoce" e o "filtro na saída" têm **causas diferentes** — a primeira sendo alocação de atenção/pacing, a segunda sendo pós-treinamento de alinhamento. Greptile e Cursor documentaram a segunda; DeepSource e Snyk observaram a primeira, mas nenhum dos quatro as separou explicitamente. **A separação é nossa e é publicável.**
3. *Hipótese:* nossa precisão de 73.9% no gemini-3.7-flash é **artefato do gold set fechado**, não virtude do modelo. Testável em uma hora. **Deve ser testado antes de publicar.**
4. ~~*Hipótese:*~~ **PROMOVIDO A FATO.** O loop único é adequado como **instrumento de medição** porque isola a variável modelo. Eu havia registrado isto como argumento nosso; **ele está publicado, quase palavra por palavra, pela Baz** (2026-03-29): *"Offline tests feed identical inputs to models and tools for controlled comparisons, **isolating model capability from harness engineering**."* Este é o argumento central de defesa do bench, e agora é citável.
5. *Hipótese:* a diferença de findings/caso entre nossos modelos é em boa parte **artefato de prompt default**, não de capacidade. Diretamente testável (ver recomendação 1 abaixo) e, se confirmada, é o resultado mais interessante do bench.

### 12.3 Recomendações de método (ordenadas por relação valor/custo)

1. **🔴 Rodar o bench com um prompt "agressivo" e/ou com alvo numérico de findings, como variante controlada.** **QUATRO fornecedores publicaram, independentemente, que essa é a correção para exatamente o comportamento que medimos:** Cursor (*"we shifted to aggressive prompts"*), Greptile (alvo de 7–10 comentários), Macroscope (*"Prefer reporting MORE issues over fewer. False positives are acceptable; do not self-censor."*) e Baz (*"we over-generate candidate bugs... and filter them"*). Se o recall do gpt-5.6-terra subir de 22.1% com uma mudança de prompt, **o achado deixa de ser "este modelo é pior" e passa a ser "este modelo precisa de calibração diferente" — que é uma contribuição muito mais forte e muito mais defensável.** É o experimento mais barato e de maior retorno da lista. (Deriva de §3.7.1, §7.2, §7.9.1 e §7.9.5.)

1b. **Corolário: a Macroscope mediu 20× de diferença de volume entre modelos sob a MESMA diretiva de "maximize recall"** (Opus 199 vs GPT-5.2 3.923 achados). Enquanto não rodarmos essa variante, não sabemos qual fração do nosso spread de recall é capacidade e qual é calibração. **Este é hoje o maior risco à interpretação do bench.** (Deriva de §6.6.1.)
2. **Auditar manualmente os 6 FP do gemini-3.7-flash** antes de publicar qualquer número de precisão. Uma hora de trabalho; o número mais suspeito da nossa tabela. (Deriva de §8.5.)
3. **Rodar ≥3 vezes por caso e publicar a variância.** Greptile roda 3×; Snyk roda 5× e publicou que *"61.7% of its LLM-only reports appeared in just one of five runs"*. Sem isso, não sabemos se 1.7 e 3.4 findings/caso são distinguíveis. (Deriva de §6.10 e §10.5.)
4. **Publicar micro E macro, declarando o N de cada um.** Ninguém faz. Com 30 PRs, o N macro é 30 e o micro é 95 — e a DeepSource publicou que "under 100 entries" merece ceticismo. (Deriva de §8.1 e §8.5.1.)
5. **Declarar explicitamente o critério de "hit".** As definições públicas são incompatíveis entre si: Qodo exige arquivo+linha corretos; Snyk VulnBench aceita só o tipo da vulnerabilidade; DeepSource pontua binário por entrada. Sem declarar a nossa, nenhum número é comparável. (Deriva de §8.3, §8.5.1, §8.5.2.)
6. **Cegar o juiz quanto ao nome do modelo**, como a DeepSource faz. Barato e elimina uma classe inteira de objeção. (Deriva de §8.5.1.)
7. **Publicar os resultados julgados em bruto** (JSONL por modelo), como a DeepSource. É o que separa um benchmark citável de um post de marketing. (Deriva de §8.5.1.)
8. **Escrever um aviso de circularidade explícito**, no modelo do da Snyk: nossa métrica é "recall contra o nosso gold set de 95 bugs", não "recall contra todos os bugs existentes nos 30 PRs". (Deriva de §8.5.2.)
9. **Separar FP "factualmente errado" de FP "correto mas irrelevante"**; a literatura acadêmica já usa quatro categorias. (Deriva de §5.6 e §8.6.)
10. **Declarar a prevalência de bugs do conjunto (100% por construção) como limite de validade externa.** GitHub publica 29% de silêncio deliberado e 5,1 comentários/review; Cursor publica 0,7 bugs/run. Nossos números não são comparáveis aos deles, e devemos dizer isso antes que alguém diga por nós. (Deriva de §4.3 e §3.7.1.)
11. **Reportar tool calls por caso, por modelo, como contribuição própria** — ninguém no mercado publica isso, e é a métrica que discrimina os dois modos de falha. Ancorar na única referência externa que existe (GitLab: ~16 para diff pequeno, ~40 para mudança grande). (Deriva de §3.9 e §3.15.)
12. **Versionar snapshots datados e imutáveis** do leaderboard, e declarar a proveniência do nosso gold set. (Deriva de §8.4 e §8.4.1.)

13. **🔴 Adotar "adversarial validation" para o gold set:** quando dois ou mais modelos fortes concordam num achado que **não** está no gold set, tratar como candidato a entrar no gold set em vez de contar automaticamente como falso positivo. É a solução publicada da Baz para exatamente a crítica que CodeRabbit, DeepSource e Snyk fazem ao método de gold set, e é a única maneira de o bench não ficar preso ao teto do recall humano: *"This process expands the benchmark as model capability grows rather than letting it cap evaluation at human recall."* (Deriva de §8.5.8.)

14. **Adotar a disciplina de variância da Baz na redação:** eles se recusaram a chamar 5 achados em 148 de melhoria, classificando como variância normal. Precisamos de um limiar declarado abaixo do qual não afirmamos diferença entre modelos. (Deriva de §8.5.8.)

15. **Considerar filtro decomposto em booleanos, não juízo global**, se algum dia adicionarmos um estágio de verificação. A Sourcery mediu que "isto é útil?" não move a agulha (42%→43%) e que quatro booleanos específicos movem (~42%→~60%); a Baz usa extração com schema tipado + confiança em vez de juízo de mérito. **Não repetir o LLM-as-judge ingênuo que a Greptile reprovou.** (Deriva de §7.9.6, §7.9.5 e §7.3.)

---

## 13. Rastro de auditoria — onde procurei

Todas as consultas em **2026-08-13**, salvo indicação.

| Fonte | URL | Data do doc | Tipo |
|---|---|---|---|
| Greptile — v5 | https://www.greptile.com/blog/greptile-v5 | 2026-08-05 | Primária |
| Greptile — v4 + New Pricing | https://www.greptile.com/blog/greptile-v4 | 2026-03-05 | Primária |
| Greptile — v3, agentic approach | https://www.greptile.com/blog/greptile-v3-agentic-code-review | 2025-11-26 | Primária |
| Greptile — Models are worse at reviewing their own code | https://www.greptile.com/blog/model-inversion | 2026-07-21 | Primária |
| Greptile — Nemotron 3 Ultra / multi-model architecture | https://www.greptile.com/blog/nvidia-nemotron-ultra-in-code-review | 2026-06-04 | Primária |
| Greptile — Building TREX | https://www.greptile.com/blog/trex-code-execution | 2026-06-17 | Primária |
| Greptile — How to Make LLMs Shut Up | https://www.greptile.com/blog/make-llms-shut-up | **2024-12-18 — obsoleto** | Primária |
| Greptile — What Developers Need to Know | https://www.greptile.com/blog/ai-code-review | 2025-06-16 | Primária |
| Greptile — Benchmarks | https://www.greptile.com/benchmarks | execução jul/2025 | Primária |
| Greptile — Martian ranking | https://www.greptile.com/content-library/greptile-martian-code-review-benchmark | 2026-07-30 | Primária |
| Greptile — índice do blog (28 posts, datas) | https://www.greptile.com/blog | — | Primária |
| CodeRabbit — Architecture | https://docs.coderabbit.ai/overview/architecture | **sem data** | Primária |
| CodeRabbit — Pull Request Reviews | https://docs.coderabbit.ai/overview/pull-request-review.md | **sem data** | Primária |
| CodeRabbit — massive codebases / semantic index | https://www.coderabbit.ai/blog/how-coderabbit-delivers-accurate-ai-code-reviews-on-massive-codebases | 2025-09-05 | Primária |
| CodeRabbit — tops Martian benchmark | https://www.coderabbit.ai/blog/coderabbit-tops-martian-code-review-benchmark | 2026-03-03 | Primária |
| CodeRabbit — Nemotron 3.5 Lightning routing | https://www.coderabbit.ai/blog/teaching-nvidia-nemotron-3-5-lightning-to-route-code-reviews | 2026-08-11 | Primária |
| CodeRabbit — deep dive | https://www.coderabbit.ai/blog/coderabbit-deep-dive | **2023-08-22 — obsoleto** | Primária |
| cubic — Learnings from building AI agents | https://www.cubic.dev/blog/learnings-from-building-ai-agents | 2025-06-19 | Primária |
| cubic — #1 on Code Review Bench | https://www.cubic.dev/blog/cubic-is-the-best-ai-code-reviewer-on-martian-s-benchmark | 2026-03-25 | Primária |
| cubic — Why choosing your own LLM is a bad idea | https://www.cubic.dev/blog/why-choosing-your-own-llm-for-code-review-is-a-bad-idea | 2026-02-10 | Primária |
| cubic — The false positive problem | https://www.cubic.dev/blog/the-false-positive-problem-why-most-ai-code-reviewers-fail-and-how-cubic-solved-it | 2025-12-09 | Primária (marketing) |
| Qodo — How we built a real-world benchmark | https://www.qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/ | 2026-02-04 | Primária |
| Qodo — Introducing Qodo 2.0 | https://www.qodo.ai/blog/introducing-qodo-2-0-agentic-code-review/ | 2026-02-04 | Primária |
| Qodo — #1 on Martian | https://www.qodo.ai/blog/qodo-ranked-1-ai-code-review-tool-in-martians-code-review-benchmark/ | 2026-03-15 | Primária |
| Cloudflare — Orchestrating AI Code Review at scale | https://blog.cloudflare.com/ai-code-review/ | 2026-04-20 | Primária (não-fornecedor) |
| Martian — Code Review Bench (site) | https://codereview.withmartian.com | — | Terceiro (SPA, sem texto extraível) |
| Martian — benchmark repo | https://github.com/withmartian/code-review-benchmark | — | Terceiro |
| Academia — CodeRabbit in the wild | https://arxiv.org/abs/2607.03316 | 2026-07-03 (v2 2026-07-23) | Terceiro (acadêmica) |
| **Cursor** — Building a better Bugbot | https://cursor.com/blog/building-bugbot | **2026-01-15** | Primária (verificada por mim) |
| **Cognition** — Multi-Agents: What's Actually Working | https://cognition.com/blog/multi-agents-working | 2026-04-22 | Primária |
| Cognition — Don't Build Multi-Agents | https://cognition.com/blog/dont-build-multi-agents | 2025-06-12 (superado em parte) | Primária |
| Cognition — SWE-Check (micro vs macro) | https://cognition.com/blog/swe-check-10x-faster | 2026-04-14 | Primária |
| Cognition — SWE-grep (anti-embeddings) | https://cognition.com/blog/swe-grep | 2025-10-16 | Primária |
| Cognition — Devin Review | https://cognition.com/blog/devin-review | 2026-01-21 | Primária |
| Devin — Agentic MapReduce (cobertura) | https://devin.ai/blog/agentic-map-reduce | 2026-07-01 | Primária |
| Devin — Security Swarm eval | https://devin.ai/blog/security-swarm-eval | 2026-07-01 | Primária |
| **Augment** — How we built a high-quality AI code review agent | https://www.augmentcode.com/blog/how-we-built-high-quality-ai-code-review-agent | 2026-03-10 | Primária |
| Augment — benchmark de 7 ferramentas | https://www.augmentcode.com/blog/we-benchmarked-7-ai-code-review-tools-on-real-world-prs-here-are-the-results | 2025-12-11 | Primária |
| Augment — dataset público | https://github.com/ai-code-review-evaluations | Nov-2025 | Primária (dados) |
| Augment — Cosmos (multi-agente) | https://www.augmentcode.com/blog/solving-code-review-with-cosmos | 2026-05-06 | Primária |
| **Macroscope** — Code Review Benchmark | https://macroscope.com/blog/code-review-benchmark | 2025-09-17 | Primária |
| Macroscope — We (Basically) Stopped Writing Prompts | https://macroscope.com/blog/we-stopped-writing-prompts | 2026-02-04 | Primária |
| Macroscope — Opus 4.5 on Code Review | https://macroscope.com/blog/opus-4.5-code-review | 2025-12-12 (superado) | Primária |
| Macroscope — Detection Mode | https://macroscope.com/blog/new-code-review-pipeline-detection-mode | 2026-06-24 | Primária |
| Macroscope — bug detection (docs) | https://docs.macroscope.com/bug-detection-and-fixes | sem data | Primária |
| **Propel** — benchmarks | https://www.propelcode.ai/benchmarks | sem data (Wayback 2026-01-19) | Primária |
| Propel — Why Model Diversity Matters | https://www.propelcode.ai/blog/why-model-diversity-matters | 2026-02-05 | Primária |
| **Baz** — Engineering Intuition at Scale | https://baz.ai/resources/blog/engineering-intuition-at-scale-the-architecture-of-agentic-code-review | 2025-12-15 | Primária |
| Baz — The anatomy of code review accuracy | https://baz.ai/resources/research/the-anatomy-of-code-review-accuracy | 2026-03-29 | Primária |
| Baz — SAST Inside (cobertura) | https://baz.ai/resources/blog/sast-inside-expanding-the-hypothesis-space-of-agentic-security-review | 2026-07-29 | Primária |
| Baz — Ship inference routing (bench 88 PRs) | https://baz.ai/resources/research/ship-inference-routing-for-agentic-code-review | 2026-07-22 | Primária |
| Baz — Coverage como métrica (docs) | https://baz.ai/docs/insights/evaluation | sem data | Primária |
| **Sourcery** — Improving LLM responses | https://sourcery.ai/blog/improving-llm-responses | **2024-02-26, obsoleto** | Primária |
| Sourcery — Panel of Experts | https://sourcery.ai/blog/panel-of-experts | **2024-05-13, obsoleto** | Primária |
| Sourcery — Don't tell me what not to do | https://sourcery.ai/blog/dont-tell-me-what-not-to-do | **2024-04-26, obsoleto** | Primária |
| **Graphite** — case study Anthropic | https://www.anthropic.com/customers/graphite | ~2024-12, **pré-2025** | **SECUNDÁRIA** |
| **GitHub** — CCR agentic architecture (changelog) | https://github.blog/changelog/2026-03-05-copilot-code-review-now-runs-on-an-agentic-architecture/ | 2026-03-05 | Primária |
| GitHub — 60 million Copilot code reviews | https://github.blog/ai-and-ml/github-copilot/60-million-copilot-code-reviews-and-counting/ | 2026-03-05 | Primária |
| GitHub — Better tools made CCR worse | https://github.blog/ai-and-ml/github-copilot/better-tools-made-copilot-code-review-worse-heres-how-we-actually-improved-it/ | 2026-07-10 | Primária |
| GitHub — CCR public preview / CodeQL+ESLint | https://github.blog/changelog/2025-10-28-new-public-preview-features-in-copilot-code-review-ai-reviews-that-see-the-full-picture/ | 2025-10-28 | Primária |
| GitHub — docs: code review | https://docs.github.com/en/copilot/concepts/agents/code-review | sem data | Primária |
| GitHub — docs: responsible use | https://docs.github.com/en/copilot/responsible-use/code-review | sem data | Primária |
| **GitLab** — Code Review Flow (docs) | https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/ | GA 18.8 | Primária |
| GitLab — Security Review Flow (contagem de chamadas) | https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/security_review/ | Beta 19.1 | Primária |
| GitLab — Code Review (não-agêntico) | https://docs.gitlab.com/user/gitlab_duo/code_review/ | sem data | Primária |
| GitLab — model selection | https://docs.gitlab.com/user/duo_agent_platform/model_selection/ | sem data | Primária |
| GitLab — flat-rate pricing | https://about.gitlab.com/blog/agentic-code-reviews-with-flat-rate-pricing/ | 2026-03-19 | Primária |
| **AWS** — Amazon Q code reviews (docs) | https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/code-reviews.html | sem data | Primária |
| AWS — CodeGuru Reviewer (em manutenção) | https://docs.aws.amazon.com/codeguru/latest/reviewer-ug/how-codeguru-reviewer-works.html | **pré-LLM, obsoleto** | Primária |
| AWS — Amazon Q em GitHub | https://aws.amazon.com/blogs/devops/introducing-an-interactive-code-review-experience-with-amazon-q-developer-in-github/ | 2025-09-08 | Primária |
| **Sider** | https://sider.review/ | — | **DNS sem registro A em 2026-08-13** |
| **DeepSource** — DeepSource Next | https://deepsource.com/blog/deepsource-next | 2026-02-24 | Primária |
| DeepSource — benchmarks | https://deepsource.com/benchmarks | acessado 2026-08-13 | Primária |
| DeepSource — crítica aos benchmarks de fornecedor | https://deepsource.com/blog/ai-code-review-benchmarks | 2026-02-26 | Primária |
| DeepSource — BYOK (dois tiers de modelo) | https://deepsource.com/blog/byok | 2026-03-24 | Primária |
| DeepSource — FP rate histórico | https://deepsource.com/blog/how-deepsource-ensures-less-false-positives | **2020-06-05, obsoleto** | Primária |
| DeepSource — resultados brutos | https://github.com/deepsourcecorp/benchmarks | — | Primária (dados) |
| **Codacy** — Codacy AI (docs) | https://docs.codacy.com/codacy-ai/codacy-ai/ | Last updated 2026-04-02 | Primária |
| Codacy — AI Reviewer | https://blog.codacy.com/whats-new-in-codacys-ai-reviewer | 2026-04-13 | Primária |
| Codacy — deterministic-first | https://blog.codacy.com/deterministic-static-analysis-for-ai-coding-workflows-how-to-cut-token-cost-without-weakening-code-review | **sem data** | Primária |
| **Snyk** — DeepCode AI Fix (paper) | https://arxiv.org/abs/2402.13291 | 2024-02-19 / v2 2024-02-23 | Primária (peer-reviewable) |
| Snyk — Agent Fix agentic architecture | https://snyk.io/blog/snyk-agent-fix-agentic-architecture/ | 2026-04-27 | Primária |
| Snyk — VulnBench JS 1.0 | https://snyk.io/blog/snyk-vulnbench-js-1-0-llm-security-review-repeatability/ | 2026-06-29 | Primária |
| Snyk — autofix / verificação simbólica | https://snyk.io/blog/ai-code-security-snyk-autofix-deepcode-ai/ | **2024-04-23, pré-2025** | Primária |
| Snyk — FP 0,08% (é DAST, não código) | https://snyk.io/blog/minimizing-false-positives-enhancing-security-efficiency/ | 2025-07-01 | Primária |
| Snyk — dataset e código | https://github.com/snyk/deepcode_ai_fix | — | Primária (dados) |
| **Graphite** — Reviewer launch (<3% FP) | https://graphite.com/blog/graphite-reviewer-launch | **2024-09-30, pré-2025** | Primária |
| Graphite — AI review customization (docs) | https://graphite.com/docs/ai-review-customization | sem data | Primária |
| Graphite — code index (Turbopuffer, sem embeddings) | https://graphite.com/blog/how-we-sped-up-code-search-graphite-chat | 2025-09-09 | Primária |
| Graphite — AI review para código gerado por IA | https://graphite.com/blog/ai-code-review-for-ai-generated-code | 2025-07-28 | Primária |
| Graphite — case study (voting/self-critique, eval 500 PRs) | https://www.anthropic.com/customers/graphite | ~2024-12, **pré-2025** | **SECUNDÁRIA (Anthropic)** |
| **CodeAnt** — CLI review (fan-out por arquivo) | https://docs.codeant.ai/cli/review.md | `<lastmod>` 2026-07-27 | Primária |
| CodeAnt — agent scan (reflection filtering) | https://docs.codeant.ai/api-reference/agent-analysis/start-agent-scan | `<lastmod>` 2026-07-31 | Primária |
| CodeAnt — resultados no Martian | https://www.codeant.ai/blogs/ai-code-review-benchmark-results-from-200-000-real-pull-requests | byline 2026-03-17 | Primária |
| CodeAnt — EU AI Act (placeholder de modelo) | https://docs.codeant.ai/compliance/EU-AI-Act-Statement | `<lastmod>` 2026-07-02 | Primária |
