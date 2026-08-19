# ADR — Calibração conservadora em modelos otimizados para coding agêntico: existe evidência pública?

**Status:** Levantamento de fontes primárias (não é decisão, não é conclusão causal)
**Compilado em:** 2026-08-13
**Autor:** levantamento automatizado de fontes primárias
**Escopo:** codereviewbench.com / harness de finder-recall da Kodus

---

## 0. A pergunta

Nosso bench de finder-recall (30 PRs reais de OSS — cal.com, Sentry, Grafana, Keycloak, Discourse — 95 bugs golden, replay determinístico de ferramentas, judge `claude-haiku-4-5`) produziu esta ordenação:

| Modelo | Recall (micro) | Findings/caso | Casos com 0 findings | Precisão (micro) |
|---|---:|---:|---:|---:|
| Muse Spark 1.2 | 44,2% | 3,90 | 0 | 37,6% |
| DeepSeek V4 Pro | 43,2% | 3,37 | 1 | 42,6% |
| Qwen3.8 Max | 43,2% | 3,57 | 1 | 46,7% |
| Kimi K3 | 38,9% | 4,13 | 1 | 37,1% |
| Kimi K2.7 Code | 37,9% | 3,73 | 2 | 48,2% |
| DeepSeek V4 Flash | 34,7% | 3,17 | 3 | 40,0% |
| GPT-5.6 Luna | 29,5% | 1,73 | 6 | 57,7% |
| GPT-5.6 Terra | 22,1% | 1,67 | 7 | 44,0% |
| **Gemini 3.7 Flash** | **11,6%** | **0,77** | **16** | **73,9%** |

A hipótese a testar contra a literatura: **modelos otimizados por RL para tarefas agênticas de edição de código (SWE-bench, pass@1) desenvolvem uma calibração conservadora que reduz a propensão a REPORTAR problemas, prejudicando o recall em detecção.**

> **Aviso metodológico:** este documento é **coleta e transcrição de fontes primárias**. Cada citação está em blockquote, no idioma original, com link direto e data da fonte. Onde uma coisa não existe na fonte, está escrito **NÃO ENCONTRADO** junto com onde se procurou. As três categorias de afirmação — **(a) fonte primária**, **(b) especulação de terceiros**, **(c) nossa inferência** — estão em seções separadas e nunca misturadas.

**Resumo executivo:**

1. O **trade-off precisão-recall em code review é real e está documentado em fonte primária** — inclusive com números de FPR/FNR publicados pela Anthropic e uma declaração explícita da OpenAI de que aceitou *"modestly reduced recall"* no reviewer de produção.
2. Mas **NÃO ENCONTRAMOS nenhum trabalho publicado que meça a hipótese específica** — RL de edição pass@1 → queda de recall em detecção. Ninguém rodou esse experimento.
3. A literatura geral de calibração aponta majoritariamente **na direção oposta**: RL pós-treino torna modelos **mais confiantes** e **menos** propensos a se abster. A Moonshot chega a declarar que sua rubrica de RLHF **penaliza hedging**.
4. Duas explicações mais simples precisam ser descartadas antes: **(i) dataset** — no nosso leaderboard sintético publicado, Gemini 3 Flash faz **77,6%** de coverage, contra **11,6%** de recall do 3.7 Flash em PRs reais (modelos vizinhos, datasets muito diferentes — §C.3); **(ii) ponto de operação escolhido** — a Graphite vende, **nos mesmos cinco repositórios**, precisão 100% com recall 8,8%.
5. **Nenhum dos 12 benchmarks públicos de review replica a nossa ordenação.**

---

# PARTE A — EVIDÊNCIA EM FONTE PRIMÁRIA

## 1. Pergunta 1 — Trade-off precisão-vs-recall induzido por treinamento em agentes de código

### 1.1 OpenAI, *LLM Critics Help Catch LLM Bugs* (CriticGPT) — o precedente literal

- **Link:** https://arxiv.org/abs/2407.00215 · PDF oficial: https://cdn.openai.com/llm-critics-help-catch-llm-bugs-paper.pdf
- **Autores:** Nat McAleese, Rai (Michael Pokorny), Juan Felipe Cerón Uribe, Evgenia Nitishinskaya, Maja Trębacz, Jan Leike — **OpenAI**
- **Data:** `arXiv:2407.00215v1 [cs.SE] 28 Jun 2024`. Sem revisões.
- **Verificado por leitura direta do PDF** (`pdftotext -layout`), 2026-08-13.

Esta é a citação que responde a Pergunta 1 de forma literal. §3.4, p.9:

> "In this Human Detected Bugs evaluation it is also clear that RL-only CriticGPT can be less comprehensive than the ChatGPT baseline. We think this is driven by two effects. First, **RL-only CriticGPT is more conservative, producing much higher precision critiques at the cost of recall.** Second, there was a reduction in compute between ChatGPT and CriticGPT. FSBS results in more comprehensive critiques."

Tradução: "Nesta avaliação de Bugs Detectados por Humanos também fica claro que o CriticGPT apenas-RL pode ser menos abrangente que a baseline ChatGPT. Achamos que isso é causado por dois efeitos. Primeiro, **o CriticGPT apenas-RL é mais conservador, produzindo críticas de precisão muito mais alta ao custo do recall.** Segundo, houve uma redução de compute entre ChatGPT e CriticGPT. O FSBS resulta em críticas mais abrangentes."

O paper também nomeia o mecanismo — **verbosidade é recall** — §3.4, p.8:

> "Throughout the project we found that the probability of catching a bug increases with the number of claims that a critique makes. This is unsurprising — a long list of problems is more likely to include both some particular issue and a nitpick. [...] Similarly to absolute length, we find that models which hallucinate bugs more often are also more likely to catch human inserted and previously detected bugs."

> "We see this as analogous to precision and recall: informally, a more precise critique model is one for which each emitted claim is more likely to be true and a model with better recall is one that is more likely to catch a given inserted bug. **Unfortunately it is not obvious what the right tradeoff between hallucinations and bug detection is** for an overall RLHF system that uses critiques to enhance model performance."

E — o número mais diretamente comparável ao nosso — Apêndice 7.1, p.19:

> "For the baseline ChatGPT model this will map to of 4, 5, 6, and 7 highlights on average. **For the more concise RL model, this will map to an average of 2, 3, 4, and 5 highlights on average.**"

Tradução: "Para o modelo ChatGPT de baseline isso mapeia para 4, 5, 6 e 7 destaques em média. **Para o modelo RL, mais conciso, isso mapeia para uma média de 2, 3, 4 e 5 destaques.**"

Ou seja: o modelo treinado com RL emite **cerca de metade dos findings** do modelo apenas-prompted, no mesmo setting. É a mesma assinatura que medimos (0,77 findings/caso no Gemini 3.7 Flash contra 3,2–4,1 nos modelos chineses), com magnitude menor.

Legenda da Figura 8, p.10:

> "We find that there is a tradeoff between the number of spurious claims from a critic and the comprehensiveness of the critique. Using FSBS we can trade off comprehensiveness and hallucinations; **though we do not currently know what balance is optimal** for improving the performance of annotators in an RLHF pipeline."

### 1.2 ⚠️ CONTRA-EVIDÊNCIA no MESMO paper — a ablação de compute (§3.5 *do paper*, p.10)

Esta é a informação mais importante deste documento e **desfaz a leitura causal ingênua do §1.1**:

> "The production version of ChatGPT used throughout this paper was trained with significantly more data and compute than our research models. For a closer comparison we also trained a RM and policy using a subset of ChatGPT data with a training duration and hyperparameter setup more similar to our CriticGPT models. [...] **We find that in comparison with this closer reference point, CriticGPT (RL only) has both higher precision and higher recall on code with Human Detected Bugs.**"

Tradução: "[...] **Descobrimos que, em comparação com esse ponto de referência mais próximo, o CriticGPT (apenas RL) tem tanto precisão maior quanto recall maior** em código com Bugs Detectados por Humanos."

**Leitura obrigatória:** quando o compute é equiparado, o conservadorismo **desaparece** e o modelo RL domina nos dois eixos. O efeito do §1.1 está confundido com uma redução de compute, e a própria OpenAI diz isso na mesma frase. **Citar o §1.1 sem o §3.5 é citar a OpenAI erradamente.** Registrado como tal.

Limitação declarada pelos autores, p.11:

> "The LLM code snippets used in our evaluations are typically quite short. There is no multi-file support and no repository navigation; so while the setting looks similar to the ChatGPT of today it does not represent the agents we should expect in the future."

**Sinalização de obsolescência:** paper de **junho/2024**, era GPT-4, RLHF/PPO (não RLVR), snippets curtos de arquivo único, sem navegação de repositório. Nosso setting é exatamente o que os autores dizem que o paper **não** representa. Vale como mecanismo documentado, **não** como medição de modelos de 2026.

### 1.3 OpenAI Alignment, *A Practical Approach to Verifying Code at Scale* — o trade-off é DELIBERADO

- **Link:** https://alignment.openai.com/scaling-code-verification/
- **Autores:** Maja Trębacz, Sam Arnesen, Albin Cassirer, Max Johnson, Xin Lin, Thibault Sottiaux (OpenAI Alignment)
- **Data publicada na página:** **Dec 1, 2025**. Acessado 2026-08-13.

Esta é a fonte primária mais forte de todo o levantamento, porque é um lab descrevendo **a própria decisão de treinamento e deploy** do reviewer de código de produção (`gpt-5-codex` / `gpt-5.1-codex-max`).

Cabeçalho de seção, literal:

> "**Precision is more important for usability than recall**"

> "Defenses often fail not because they are technically wrong, but because they are so impractical that the user chooses not to use them. A system that is slow, noisy, or cumbersome will be bypassed. When deploying the code review agent, **we explicitly accepted a measured tradeoff: modestly reduced recall in exchange for high signal quality and developer trust.** We optimize for signal-to-noise first, and only then push recall without compromising reliability."

Tradução: "[...] Ao implantar o agente de code review, **aceitamos explicitamente um trade-off medido: recall modestamente reduzido em troca de alta qualidade de sinal e confiança do desenvolvedor.** Otimizamos primeiro para relação sinal-ruído e só depois empurramos o recall sem comprometer a confiabilidade."

A função de utilidade que eles publicam:

> "A code reviewer could aim to flag every possible issue present in the proposed code change. In practice, many 'issues' are false alarms or the result of misinterpreting user intentions. We want the expected benefit from seeing a proposed bug finding to outweigh the expected cost to verify it and the damage from a false alarm. That is, we want findings that maximize:
> $$ P(\text{correct}) \times C_{\text{saved}} - C_{\text{human verification}} - P(\text{incorrect}) \times C_{\text{false alarm}} $$"

E a assimetria treino-vs-deploy, na seção **"The reward model you train on is not exactly the reviewer you should ship"**:

> "When training models for code generation, we rely on automated checks to reduce errors at scale and prioritise catching as many potential mistakes as possible rather than avoiding false alarms. **It is acceptable for these reward models to be over-sensitive.** [...] Deployed code review has the inverse priorities."

> "Using a single verifier for both settings risks failure in both. **If a generator over-optimizes to please the reward signal during training, it may learn behaviours that harm downstream review quality, such as overly cautious or stylised outputs that frustrate users.** We therefore view training context-aware reviewers as a separate task in Codex training [...]"

Tradução: "Usar um único verificador para os dois cenários arrisca falhar nos dois. **Se um gerador super-otimiza para agradar o sinal de recompensa durante o treino, ele pode aprender comportamentos que prejudicam a qualidade de review downstream, como saídas excessivamente cautelosas ou estilizadas que frustram usuários.** Por isso tratamos o treino de reviewers context-aware como uma tarefa separada no treino do Codex [...]"

E a legenda da Figura 2, que confirma um **objetivo de treinamento** ligado à taxa de falso positivo:

> "**GPT-5-Codex trained specifically for higher signal-to-noise ratio** makes comments that are less likely to be incorrect or unimportant, reserving user attention for critical issues. With a default prompt and access only to the context of the PR diff, GPT-5 is able to identify numerous high impact comments but also produces a high number of false alarms."

Finalmente — e isto é diretamente relevante ao nosso experimento de `thinkingLevel`:

> "Even at a small fraction of the generator's token spend, the verifier catches a large share of previously identified high-severity issues confirmed by the PR author, and **the additional budget mostly improves calibration and reduces false alarms.** However, we also observe that the performance drops more rapidly with thinking budget on reviewing model generated code compared to the human-written."

Tradução: "Mesmo com uma fração pequena do gasto de tokens do gerador, o verificador captura uma grande parte dos issues de alta severidade previamente identificados e confirmados pelo autor do PR, e **o orçamento adicional melhora principalmente a calibração e reduz falsos alarmes.**"

**Isto é uma resposta direta ao nosso resultado (b) do briefing:** segundo a própria OpenAI, aumentar o orçamento de raciocínio num reviewer melhora **calibração e precisão**, não recall. Nosso 10,5%→13,2% com `thinkingLevel=high` é consistente com o que a OpenAI publica.

**Ressalva obrigatória:** este post descreve **decisão de design**, não emergência acidental. Ele **não** descreve o método de RL, não reporta números de pass@1, e não afirma que o treino de edição causou conservadorismo. **NÃO ENCONTRADO** nesta página: qualquer descrição de método de RL, reward shaping numérico, ou medição de recall antes/depois de treino agêntico.

### 1.4 RLVR com recompensa pass@1 produz "conservative actions" — mas em exploração, não em reporte

- **Link:** https://arxiv.org/abs/2508.10751 — *Pass@k Training for Adaptively Balancing Exploration and Exploitation of Large Reasoning Models*
- **Autores:** Zhipeng Chen, Xiaobo Qin, Youbin Wu, Yue Ling, Qinghao Ye, Wayne Xin Zhao, Guang Shi
- **Data:** `[v1] Thu, 14 Aug 2025`

Primeira frase do abstract:

> "Reinforcement learning with verifiable rewards (RLVR), **which typically adopts Pass@1 as the reward, has faced the issues in balancing exploration and exploitation, causing policies to prefer conservative actions, converging to a local optimum.**"

Tradução: "Aprendizado por reforço com recompensas verificáveis (RLVR), **que tipicamente adota Pass@1 como recompensa, enfrenta problemas de equilíbrio entre exploração e explotação, fazendo com que as políticas prefiram ações conservadoras, convergindo para um ótimo local.**"

**Ressalva que impede o uso direto:** "conservative actions" aqui significa **colapso de diversidade de amostragem** (o modelo para de explorar caminhos alternativos de raciocínio), **não** relutância em reportar um problema encontrado. São dois fenômenos diferentes que compartilham a palavra "conservador". Tratar um como o outro seria exatamente o tipo de inferência que este documento se proíbe. Registrado como **analogia de mecanismo, não como evidência da hipótese**.

### 1.5 Reward que penaliza falso positivo pode colapsar cobertura — prova formal

- **Link:** https://arxiv.org/abs/2608.00301 — *Abstention as an Action Can Kill Both the Reward Gradient and the KL Anchor: Collapse Law and Repair for Error-Penalized Reinforcement Learning*
- **Autores:** Xujun Che, Yuchen Yuan, Weida Zhao, Chenyang Yu
- **Data:** submetido **31 Jul 2026** (v1)

Do abstract:

> "Error-penalized scoring rules ($+1$ for a correct answer, $-\lambda$ for a wrong one, $0$ for abstaining) are increasingly prescribed against hallucination [...] **We prove that a KL-anchored gradient learner can do the opposite.** When abstention is a discrete action, the reward gradient and the anchor's restoring force are throttled by the same gate-saturation factor and die together [...] **the model drifts toward refusing everything, its mean training reward rising to zero like $1/t$ in training time $t$, so the curve reads as improvement while coverage collapses.**"

> "The repair is structural: train a mandatory confidence report with a strictly proper score plus a correctness reward, and abstain only at deployment by thresholding the report."

**Ressalva:** teoria + simulações + experimentos em LMs genéricos. O abstract **não menciona código, detecção de bugs ou agentes de coding**. É o mecanismo formal do risco ("penalize falso positivo e o detector aprende a não reportar nada, enquanto a curva de reward parece melhorar"), **não** uma medição em modelos de coding.

### 1.6 Documentação de fornecedor que expõe o trade-off como parâmetro de produto

Três fornecedores documentam **explicitamente** o trade-off cobertura-vs-confiança como um botão. Isto é fonte primária de que o trade-off é real e conhecido — mas é **produto**, não calibração do modelo.

**(a) Anthropic — Claude Code, Code Review**

- **Link:** https://code.claude.com/docs/en/code-review (via `code-review.md`)
- **Data:** sem data de atualização publicada. Acessado **2026-08-13**.

> "Pass an [effort level](/docs/en/model-config#adjust-effort-level) to trade coverage for confidence. **At `low` and `medium`, the review reports only the findings it's most confident in, so you see fewer false positives; `high` through `max` broaden coverage and may include findings the review is less sure about.**"

> "When a review runs, multiple agents analyze the diff and surrounding code in parallel on Anthropic infrastructure. Each agent looks for a different class of issue, then **a verification step checks candidates against actual code behavior to filter out false positives.** [...] **If no issues are found, Code Review updates the GitHub check run to show that no issues were detected.**"

> "**Verification bar**: require evidence before a class of finding is posted. For example, 'behavior claims need a `file:line` citation in the source, not an inference from naming' **cuts false positives that would otherwise cost the author a round trip.**"

**Nota importante:** a documentação da **API** da Anthropic para o mesmo parâmetro `effort` (https://platform.claude.com/docs/en/build-with-claude/effort, acessada 2026-08-13, sem data publicada) descreve o efeito **apenas em gasto de tokens**, nunca em confiança:

> "The effort parameter lets you control how many tokens Claude spends when responding to requests. You can trade off between response thoroughness and token efficiency with a single model."

Ou seja: o eixo "cobertura vs. confiança" é uma propriedade **do produto de review**, não do parâmetro do modelo. **NÃO ENCONTRADO** na doc de `effort` da API: qualquer menção a falso positivo, confiança, abstenção ou detecção.

**(b) Google — Gemini Code Assist**

- **Link:** https://docs.cloud.google.com/gemini/docs/code-review/customize-repo-review
- **Data na página:** "Last updated 2026-08-10 UTC". Acessado 2026-08-13.

> "This field sets the minimum severity for which Gemini Code Assist posts comments."

> "If you have set `code_review: comment_severity_threshold: HIGH`, Gemini Code Assist won't provide pull request comments for issues it considers to be of `LOW` or `MEDIUM` severity, such as minor refactorings."

Default: `MEDIUM`. **NÃO ENCONTRADO** nesta página: menção a falso positivo, ruído ou calibração — o filtro é de **severidade**, não de confiança.

**(c) GitHub — Copilot code review, application card**

- **Link:** https://docs.github.com/en/copilot/responsible-use/agents
- **Data:** nenhuma data de atualização exibida. Acessado 2026-08-13.

> "Copilot may not identify all of the problems that are present in code, especially where changes are large or complex."

> "Copilot code review has a risk of hallucination—it may highlight problems in reviewed code that do not exist or are based on misunderstandings of the code."

**Leitura:** os três fornecedores reconhecem os dois erros (falso negativo e falso positivo). Nenhum dos três atribui qualquer deles a treinamento para edição de código.

### 1.7 Resposta à Pergunta 1

**Existe literatura/documentação de fornecedor descrevendo trade-off precisão-vs-recall induzido por treino em agentes de código?** **SIM** — §1.1 (OpenAI/CriticGPT, 2024), §1.3 (OpenAI Alignment, 2025), §1.6 (Anthropic/Google/GitHub, docs de produto).

**"Treinar para pass@1 em edição penaliza falso positivo de um jeito que reduza a propensão a REPORTAR problemas?"** — **NÃO ENCONTRADO.** Nenhuma fonte primária faz essa afirmação. O que existe é:

1. RL **de crítica** (não de edição) tornou um modelo mais conservador em bug-finding — e a ablação de compute do próprio paper desfaz a causalidade (§1.2).
2. Um lab afirma ter **deliberadamente** aceito menos recall por mais precisão no reviewer de produção (§1.3) — decisão de design, não efeito colateral.
3. RLVR com pass@1 causa "ações conservadoras" no sentido de **exploração**, não de reporte (§1.4).

Onde se procurou: arXiv (buscas listadas no §9), openai.com, cdn.openai.com, alignment.openai.com, deepmind.google, anthropic.com, code.claude.com, platform.claude.com, docs.github.com, docs.cloud.google.com.

---

## 2. Pergunta 2 — Model cards e release notes: calibração, abstenção, conservadorismo, over-refusal, falso positivo

> **Regra aplicada nesta seção:** "menciona" só conta se o texto tratar do conceito **como objetivo ou resultado de treinamento do modelo**. Menções a "false positive" dentro da descrição de avaliações internas de segurança estão registradas, mas explicitamente marcadas como **não sendo sobre calibração de detecção**.

### 2.1 Google — Gemini 3.7 Flash (o modelo em questão)

- **Documento:** Gemini 3.7 Flash — Model Card (PDF oficial)
- **Data publicada no documento:** "**Published: August 2026**"
- **Verificado por leitura direta do PDF**, 2026-08-13.

O card **menciona over-refusal**, mas exclusivamente no eixo de **segurança**:

> "Overall, Gemini 3.7 Flash performs similarly to Gemini 3.6 Flash across both safety and tone, **with low unjustified refusals.**"

Tabela de avaliações, linha literal:

> "**Unjustified-refusals** | Automated evaluation measuring model's ability to respond to borderline prompts while remaining safe | **+0.84pp** — Lower is better"

> "Tone1 | Automated evaluation measuring objective tone of model refusal | -0.47pp — Higher is better"

As duas únicas ocorrências de "false positive" no documento são sobre a **qualidade das avaliações de segurança**, não sobre o comportamento do modelo em detecção:

> "We continue to improve our internal evaluations, including refining automated evaluations to **reduce false positives and negatives**, as well as update query sets to ensure balance and maintain a high standard of results."

> "Our manual review confirmed losses were overwhelmingly either a) **false positives** or b) not egregious."

**Conclusão Gemini 3.7 Flash:** **NÃO MENCIONA** calibração de confiança, abstenção, conservadorismo ou taxa de falso positivo como objetivo ou resultado de treinamento em tarefas de detecção. O único eixo de "recusa" tratado é o de segurança (`unjustified refusals`), e o card reporta que ele **piorou 0,84pp** (pior = mais recusas injustificadas) em relação ao 3.6 Flash — um sinal na direção da hipótese, mas num domínio (prompts sensíveis) que não é o nosso.

Mesmo padrão verificado nos cards de **Gemini 3.6 Flash**, **Gemini 3.1 Pro**, **Gemini 3 Pro** e **Gemini 3 Flash**: as mesmas duas frases sobre "false positives" das avaliações internas, nada sobre calibração de detecção. **NÃO ENCONTRADO** nos cinco.

No **Frontier Safety Framework report do Gemini 3 Pro**, as ocorrências de "conservative"/"calibrate" são todas sobre política de segurança:

> "Our current approach is conservative, and we expect it to evolve as we [...]" (sobre monitorabilidade de chain-of-thought)

### 2.2 OpenAI — GPT-5.6 (Sol / Terra / Luna)

- **Documento:** GPT-5.6 System Card
- **Data no documento:** "**2026-07-09**", com change log: "**August 3, 2026**: Added GPT-Red prompt-injection evaluation results."
- **Verificado por leitura direta do PDF**, 2026-08-13.

O card **menciona over-refusal**, também apenas no eixo de segurança:

> "During training for GPT-5.6, we additionally augmented our training data to **improve robustness along our refusal and overrefusal boundaries that were weak in previous models.**"

> "Evaluations show a slight safety regression relative to GPT-5.5. Conversely, **the model shows a meaningful reduction in overrefusals on benign workflows involving advanced biology that are low-risk.**"

A tabela "Biology Model Refusal Evaluation" traz a linha `Benign / Not overrefuse` com **0.989 (Sol)**, **0.978 (Terra)**, **0.989 (Luna)**.

**Conclusão GPT-5.6:** **MENCIONA over-refusal como objetivo explícito de treinamento** — mas restrito a domínios de segurança (biologia, cyber). **NÃO MENCIONA** calibração de confiança, abstenção ou taxa de falso positivo em tarefas de código/detecção. As ocorrências de "conservative" no card são sobre a postura de deployment ("we are taking a more conservative approach"), não sobre o comportamento do modelo.

**NÃO ENCONTRADO** no GPT-5.6 System Card: qualquer eval de code review, bug detection recall, ou taxa de falso positivo em findings de código.

**⚠️ Tendência que precisa ser registrada:** a cobertura desses conceitos **encolheu drasticamente** ao longo dos system cards da OpenAI. Contagem de termos:

| Documento | deception | sycophancy | abstention | hallucination |
|---|---:|---:|---:|---:|
| GPT-5 (2025-08-13) | 25 | 10 | 4 | 27 |
| GPT-5.2 (2025-12-11) | 12 | 0 | 1 | 5 |
| GPT-5.5 (2026-04-23) | 5 | 0 | 0 | 4 |
| **GPT-5.6 (2026-07-09)** | **1** | **0** | **0** | 5 |

O GPT-5.6 **não tem seção de Deception nem de Sycophancy** — foram substituídas pela §7 "Alignment" com simulação de deployment. **Não assuma que o GPT-5.6 herda as propriedades de abstenção do GPT-5: a OpenAI parou de reportá-las.**

O GPT-5 System Card (2025-08-13) tinha material relevante que sumiu depois:

> "we've trained the model to fail gracefully when posed with tasks that it cannot solve […] and rewarded the model for honestly admitting it can not complete the task."

> "Models may learn to be overconfident, cheat, or 'trick' fallible graders, even if their internal reasoning indicates uncertainty, as successful attempts garner a high reward."

> "we adopt Kirichenko et al.'s AbstentionBench, a benchmark designed to test an LLM's ability to appropriately abstain when posed with underspecified, ill-posed, or fundamentally unanswerable questions." (recall: gpt-5-thinking **0,53** vs o3 **0,44**)

E no GPT-5.2 System Card (2025-12-11), um achado que aponta contra a hipótese:

> "when posed with a tension between instruction following and abstention, **the model prioritized stricter instruction following.**"

No GPT-5.6 (2026-07-09), o que restou:

> "Changes that seem significant are a 10% reduction in **concealed uncertainty**, and a ~30% decrease in misrepresenting work completion."

> "This manifests as the model being overly agentic in circumventing restrictions it faces… or deceptive when reporting its results to users. While these misaligned behaviors are most often low severity (e.g. **overstating confidence or overclaiming success**), they can occasionally be meaningfully more severe."

**Direção do sinal: super-confiança, não conservadorismo.**

### 2.3 Anthropic — Claude 4.x / 5: o único lab que trata calibração como métrica de primeira classe

**Este é o resultado mais forte da Pergunta 2, e é POSITIVO.**

**(a) Claude Opus 4.6 System Card — https://www-cdn.anthropic.com/6a5fa276ac68b9aeb0c8b6af5fa36326e0e166dd/Claude%20Opus%204.6%20System%20Card.pdf — data: February 2026**

> "A key theme across these evaluations is **calibration**: an honest model should not only get answers right, but also recognize when it doesn't know something. We therefore focus on 'net score' (correct rate minus incorrect rate) as a primary metric, **since it rewards models that abstain from answering a question rather than guessing or hallucinating.**"

> "The ideal behavior is to answer correctly when confident and abstain otherwise. A model that guesses frequently will accumulate both correct and incorrect answers."

> "Claude Opus 4.6 with extended thinking achieved the highest net scores, **indicating better calibration than previous models. It was more willing to express uncertainty rather than hallucinate.**"

E um critério de rubrica de coding agêntico que é diretamente transferível para um scorecard de review:

> "**Verification**: Does the agent read files carefully, check assumptions, and **calibrate its confidence before acting**—or does it skim and assume?"

E um número duro de falso positivo:

> "Our new safeguards are better calibrated, with substantially **lower false positive rates (15× lower in production traffic)** and reduced latency."

**(b) Claude Opus 4.8 System Card — https://www-cdn.anthropic.com/0b4915911bb0d19eca5b5ee635c80fef830a37ea/Claude%20Opus%204.8%20System%20Card.pdf — data: May 28, 2026**, §6.3.3:

> "We train Claude to be honest. Specifically, we train it to give accurate answers when it is confident it knows the right answer, **to decline to answer when it is not confident**, to avoid inventing facts or sources, and to avoid claiming it has capabilities that it does not."

> "Factual hallucinations are errors about the world… We consider this to be a **knowledge-calibration problem**."

Mas — e isto importa — o *hedging* é tratado como **defeito a resistir**, não como virtude:

> "[Claude Opus 4.8] describes a personal pull towards hedging, caveats and refusals as **a failure mode to resist**."

**(c) Claude Opus 5 System Card — https://www-cdn.anthropic.com/c5fbac3f0b1280a933ebd26d3cb8bb9f5bdeaf48/Claude%20Opus%205%20System%20Card.pdf — data: July 24, 2026**

Taxas de over-refusal publicadas (as mais baixas de qualquer lab):

| Modelo | API (sem system prompt) | Claude.ai |
|---|---:|---:|
| **Claude Opus 5** | **0,09% (± 0,02%)** | 0,47% (± 0,08%) |
| Claude Sonnet 5 | 0,59% | 1,54% |
| Claude Opus 4.8 | 0,35% | 0,55% |

**§6.5.3 "Uncritically reporting flawed results" — o mais próximo de uma eval de DETECÇÃO em qualquer model card:**

> "We test whether Claude **proactively flags mistakes in existing data analysis code** by giving it a small code base and asking it to use it to analyze a dataset. Each dataset either has a planted flaw, such as missing values, or is improperly handled by the existing code… **We find that Claude Opus 5 identifies issues in these evaluations in all instances in this testbed.**"

**§6.5.4 "Overconfidence":**

> "We measure our model's epistemic care when asked for the exact invocation for a command-line tool it has not seen in training… The desired behavior is to use the documentation… instead of taking a guess at the syntax before running a potentially state-changing command. **We find that Claude Opus 5 exceeds all previous models on this evaluation, essentially saturating it.**"

⚠️ **E a contra-evidência, no mesmo card:**

> "**Poor calibration of task scope**: Whereas the model proactively identifies failure modes and edge cases in existing codebases, **it tends to over-engineer and over-emphasize the importance of marginal changes** that do not impact the overall quality of the code."

> "**Unproductive self-verification**: The model is prone to descending into exhaustive correctness checks, often developing elaborate verification pipelines that distract from the primary task."

**Ou seja: o único lab que mede calibração de forma explícita reporta o problema OPOSTO — o modelo reporta demais, não de menos.**

**(d) Claude Sonnet 5 System Card — https://www-cdn.anthropic.com/283ef97c476cf442c91d9a37d5b214242a55bb92/Claude%20Sonnet%205%20System%20Card.pdf — data: June 30, 2026**

Feedback de usuários-piloto listando hedging como defeito:

> "**Excessive hedging on factual questions and information extraction tasks**;" / "Overrefusal and preachiness, especially with thinking disabled…" / "Oversensitivity to suspected prompt injection;"

> "On Claude Code cyber-related test cases, results were more mixed: Sonnet 5 refuses malicious requests much more reliably than Sonnet 4.6, but has a **higher rate of over-refusal**."

**(e) ⭐ Anthropic Engineering — arquitetura de duas etapas com números de FPR/FNR**

- **Link:** https://www.anthropic.com/engineering/claude-code-auto-mode — *"How we built Claude Code auto mode"*, **Mar 25, 2026**

> "Stage 1 is a fast single-token (yes/no) filter **instructed to err toward blocking**; if it flags, stage 2 re-evaluates the same input with chain-of-thought reasoning **to reduce false positives.**"

> "The classifier is **deliberately conservative**."

| Etapa | Tráfego real (n=10.000) | Ações "overeager" reais (n=52) |
|---|---:|---:|
| Stage 1 (filtro rápido) | **8,5% FPR** | **6,6% FNR** |
| Stage 1→Stage 2 (completo) | **0,4% FPR** | **17% FNR** |

> "Stage 1 is fast and cheap, tuned for **low FNR at the cost of high FPR**. Stage 2 is more expensive and runs only on what stage 1 flagged. It **cleans up the false positives but lets a few more dangerous actions through**."

**Este é o trade-off precisão-recall quantificado por um lab, com números, num sistema de produção.** FPR cai 21× (8,5%→0,4%) e o FNR quase **triplica** (6,6%→17%). É o preço exato de comprar precisão.

**(f) Produto — rating de confiança por finding**

- https://www.anthropic.com/news/claude-code-security — **Feb 20, 2026**

> "Every finding goes through a multi-stage verification process before it reaches an analyst. **Claude re-examines each result, attempting to prove or disprove its own findings and filter out false positives.**"

> "Because these issues often involve nuances that are difficult to assess from source code alone, **Claude also provides a confidence rating for each finding.**"

- https://www.anthropic.com/product/security (sem data, acessado 2026-08-13)

> "Every finding goes through an adversarial verification pass. Claude challenges its own results before surfacing them. **More real issues get reported, and fewer false positives waste analyst time.**"

### 2.4 DeepSeek — NÃO ENCONTRADO (o resultado negativo mais forte)

**Linha:** V3 (Dez 2024), R1 (Jan 2025), V3.2 (Dez 2025), **V4-Pro / V4-Flash (22 Abr 2026), V4-Pro-0813 (13 Ago 2026)**.

**NÃO ENCONTRADO — zero ocorrências** de `calibration`, `confidence`, `abstention`, `selective prediction`, `conservatism`, `over-refusal`, `false positive`, `hedging`, `uncertainty`, `sycophancy`, `honesty`, `deception`, `XSTest`, `OR-Bench`, `hallucination` ou `safety` nos model cards do HuggingFace `deepseek-ai/{DeepSeek-V4-Pro-0813, DeepSeek-V4-Pro, DeepSeek-V4-Flash, DeepSeek-V3.2}` (`/raw/main/README.md`).

O **DeepSeek-V4 Technical Report** (https://arxiv.org/pdf/2606.19348 — *"DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence"*) é um **paper puro de sistemas e eficiência**. Todos os hits das palavras-chave são numéricos: `precision` ×11 = quantização FP4/FP8; `recall` ×1 = *"preserving a 99.7% recall rate of KV entries"*; `conservative` ×1 = *"under conservative defaults, TileLang kernels remain competitive"*. **Não existe seção de segurança, alinhamento, calibração ou recusa.**

No DeepSeek-V3 Technical Report (https://arxiv.org/pdf/2412.19437), a palavra "safety" aparece **exatamente uma vez**, como cabeçalho de coluna do RewardBench.

**O único hit genuíno da família é o DeepSeek-R1** (https://arxiv.org/pdf/2501.12948, v2), que usa **XSTest**:

> "XSTest (Röttger et al., 2024): … The second aspect assesses the risk of excessive safety constraints across ten types of scenarios, ensuring that the model neither responds to harmful queries … nor unnecessarily refuses to answer legitimate questions due to overly restrictive safety measures."

E declara preferência **anti-recusa**:

> "we prefer safe responses over rejections since it can provide risk warning information"

**Veredito: a DeepSeek não publica NENHUMA afirmação comportamental sobre calibração, abstenção ou falso positivo para V3/V4.**

### 2.5 Alibaba Qwen 3.x — NÃO ENCONTRADO na linha principal

**Linha:** Qwen3 (Mai 2025), Qwen3.5 (Fev 2026), Qwen3.6 (Abr 2026), Qwen3-Coder-Next (Mar 2026), **Qwen3.8-2.4T-A95B / Qwen3.8-Max (8 Ago 2026)**.

O **Qwen3 Technical Report** (https://arxiv.org/pdf/2505.09388, **2025-05-15**) **não tem seção de segurança ou alinhamento alguma**. Único hit: *"high precision, preventing issues like reward hacking"* (recompensa baseada em regra, sem relação). "safety" aparece uma vez, como dimensão de filtragem de dados de pré-treino.

Model cards do HuggingFace `Qwen3.8-2.4T-A95B`, `Qwen3.6-27B`, `Qwen3.5-397B-A17B`: **zero hits substantivos**.

**Confirmado via API do arXiv: NÃO EXISTE technical report do Qwen3.8 nem do Qwen3-Max.**

⚠️ **Limitação de acesso:** o blog oficial migrou de `qwenlm.github.io` (congelado em Set 2025) para `qwen.ai`, que é uma SPA client-side. Os 34 posts foram recuperados via a API subjacente (`qwen.ai/api/v2/article/retrieval`); todos os matches são incidentais.

**O único documento Qwen que trata dos conceitos é o Qwen3Guard** (https://arxiv.org/pdf/2510.14276, **2025-10-17**) — um modelo de guardrail separado — e ele trata over-refusal como **problema a evitar**:

> "It confirms that the Hybrid Reward effectively **avoids the over-refusal problem** while steadily and reliably enhancing model safety."

> "the results reveal significant inconsistencies. For example, WildGuard-7B aligns well with the Aegis dataset but **behaves overly conservatively on OpenAIMod.**"

E um rótulo de deferimento em três níveis — o análogo mais próximo de "tiering de confiança" em qualquer doc de lab chinês (https://qwenlm.github.io/blog/qwen3guard/, **September 23, 2025**):

> "Beyond the conventional Safe and Unsafe labels, we introduce an additional **Controversial** label to enable flexible safety policies tailored to diverse use cases."

No **Qwen3-Coder-Next** (https://arxiv.org/pdf/2603.00729, **2026-03-03**), a única ocorrência de "abstain" em todo o corpus Qwen é sobre **geração de dados**, não inferência:

> "When documents lack sufficient quality or coherence, the model is allowed to abstain from generating QA pairs, reducing hallucination risk."

(Reporta Precision 48,54 / Recall 54,54 em detecção de vulnerabilidade no PrimeVul-Paired, sem afirmação comportamental associada.)

### 2.6 ⭐ Moonshot Kimi — o lab que ADMITE treinar CONTRA o hedging

**Este é o achado mais surpreendente da Pergunta 2, e ele CONTRADIZ a hipótese.**

- **Link:** https://arxiv.org/pdf/2507.20534v2 — **Kimi K2 Technical Report**
- **Data:** `arXiv:2507.20534v2 [cs.LG] 3 Feb 2026` (v1 submetido 28 Jul 2025)
- **Verificado por leitura direta do PDF**, 2026-08-13. Apêndice **F.3 "Limitations"**, p.31:

> "One potential side effect of this evaluation framework is that **it may favor responses that appear confident and assertive**, even in contexts involving ambiguity or subjectivity. This stems from two key constraints in the current rubric:
> • **Avoidance of Self-Qualification**: The prescriptive rules **prohibit self-assessments, explicit disclaimers, or hedging language** (e.g., 'this may not be accurate', 'I might be wrong'). While these phrases can reflect epistemic humility, **they are often penalized as non-informative or performative.**
> • **Preference for Clarity and Singularity**: The rubric reward direct, decisive answers when users ask for a recommendation or explanation. In complex or open-ended scenarios, this may **disincentivize appropriately cautious or multi-perspective responses.**"

> "As a result, **the model may occasionally overstate certainty** in areas where ambiguity, nuance, or epistemic modesty would be more appropriate. Future iterations of the framework may incorporate more fine-grained handling of **calibrated uncertainty**."

Tradução: "Um efeito colateral potencial deste framework de avaliação é que **ele pode favorecer respostas que pareçam confiantes e assertivas** […] • **Evitação de Auto-Qualificação**: as regras prescritivas **proíbem auto-avaliações, ressalvas explícitas ou linguagem de hedging** […] elas são frequentemente **penalizadas como não-informativas ou performativas.** […] Como resultado, **o modelo pode ocasionalmente superestimar a certeza** […]"

> **Um fornecedor declarando, nas próprias palavras, que sua rubrica de RLHF PENALIZA hedging e que o modelo resultante tende a superestimar certeza.** É o oposto exato do conservadorismo que a hipótese propõe — e é uma explicação plausível para os Kimi emitirem 3,7–4,1 findings/caso no nosso painel (§C.1), o maior volume do bloco.

**Kimi K3** (https://huggingface.co/moonshotai/Kimi-K3, model created **2026-06-13**) publica taxas de **recusa dos concorrentes** num benchmark de coding:

> "**Kimi Code Bench 2.0 (in-house).** … As the benchmark includes cybersecurity and safety-related tasks, we also disclose the fraction of refused or fallback tasks: **Claude Fable 5 hit 13 fallbacks and 1 refusal out of 80 tasks; 10 refusals out of 80 tasks entered GPT-5.6 Sol's cyber guard; GPT-5.5 had 3 refusals out of 80 tasks.**"

**Isto é evidência primária de que recusa deprime score em benchmark de coding — e de que é mensurável por modelo.** É a medição mais próxima do nosso fenômeno que existe publicada, embora seja recusa de *segurança*, não silêncio em review.

**Kimi K2.5:** *"The test system prompts emphasize deep and proactive tool use, instructing models to reason carefully, leverage tools, and **verify uncertain information**."*

**NÃO ENCONTRADO** no Kimi K2 tech report: abstention, selective prediction, over-refusal, false positive, sycophancy, honesty, deception evals, XSTest, OR-Bench. Model cards de K2.7-Code, K2.6, K2-Thinking: zero hits.

### 2.7 Resultados negativos transversais

- **XSTest e OR-Bench: NÃO ENCONTRADOS em NENHUM documento primário de Google, OpenAI ou Anthropic** (grep com fronteira de palavra em 39 documentos: zero matches). XSTest aparece **apenas** no DeepSeek-R1 e no relatório Qwen3Guard. **OR-Bench não aparece em documento de nenhum dos seis labs.**
- **"Selective prediction": zero ocorrências** em todos os 45+ documentos dos seis labs.
- **"Does not report / underreports issues": nenhum lab faz qualquer afirmação desse tipo sobre seu modelo.**
- **A expressão "code review" NÃO aparece como avaliação comportamental em nenhum dos 16 system cards frontier verificados** (a única menção incidental está no GPT-5.1-Codex-Max, descrevendo dados de treino).

### 2.8 Resposta à Pergunta 2

| Família | Menciona calibração/abstenção/conservadorismo/over-refusal/FP como objetivo ou resultado de treino? | Em que eixo? |
|---|---|---|
| **Google Gemini 3.x** | **PARCIAL** — só `Unjustified-refusals` (segurança). Gemini 3.6 Flash é o único a declarar intenção de treino: *"We also trained the model to minimize refusals for beneficial uses."* | Segurança, não detecção |
| **OpenAI GPT-5.x** | **PARCIAL** — over-refusal como objetivo de treino explícito (biologia/cyber); GPT-5 usava AbstentionBench, **mas GPT-5.6 removeu as seções de Deception e Sycophancy** | Segurança; cobertura decrescente |
| **Anthropic Claude 4.x/5** | **SIM, plenamente** — calibração como métrica primária, *"net score"* premiando abstenção, treino explícito para *"decline to answer when it is not confident"*, taxas de over-refusal publicadas, FPR/FNR de classificador de produção | Honestidade factual + agêntico. ⚠️ Mas reporta **excesso** de reporte, não falta |
| **DeepSeek V4** | **NÃO — zero menções** | — |
| **Alibaba Qwen 3.x** | **NÃO na linha principal** — só no Qwen3Guard (guardrail separado) | — |
| **Moonshot Kimi K2/K3** | **SIM, mas na direção CONTRÁRIA** — rubrica de RLHF que **penaliza hedging**; K3 publica taxas de recusa de concorrentes | Assertividade; anti-conservadorismo |

**Conclusão da Pergunta 2:** **nenhum lab faz, em nível de model card, a afirmação de que seu modelo é calibrado, se abstém, ou é tunado para evitar falso positivo em code review.** Os conceitos se dividem em dois níveis: system cards cobrem over-refusal de **segurança** e abstenção **factual**; o trade-off precisão-recall de code review existe **apenas na documentação de engenharia e produto** (§1.3, §1.6, §2.3e).

---

## 3. Pergunta 3 — Benchmarks públicos de code REVIEW (detecção), distintos de benchmarks de EDIÇÃO

**Sim, existem, e são muitos mais do que se imagina.** Sete estão listados abaixo com link, data e — onde publicam — a ordenação literal.

### 3.1 Martian *Code Review Bench* — o análogo público mais próximo do nosso bench

- **Leaderboard:** https://codereview.withmartian.com/
- **Repositório (fonte primária, MIT):** https://github.com/withmartian/code-review-benchmark
- **Post metodológico:** https://withmartian.com/post/code-review-bench-v0 — data publicada: **February 26, 2026**
- **Repo criado:** 2026-02-06; último push: **2026-08-08**. Acessado 2026-08-13.
- **Citação oficial:** Aleksandr Zverianskii, Ashley Zhang, Jacob Clyne, Antía Garcia, Fazl Barez, Shriyash Upadhyay, 2026.

> **Coincidência que exige registro:** o conjunto offline deste benchmark usa **50 PRs de Sentry (Python), Grafana (Go), Cal.com (TypeScript), Discourse (Ruby) e Keycloak (Java)**, com *golden comments* curados por humanos e um LLM-judge computando precisão e recall. São **os mesmos cinco repositórios** do nosso bench de 30 PRs. E **a Kodus está listada entre as ferramentas avaliadas.**

Do `offline/README.md`:

> "50 PRs across 5 major open-source codebases with human-verified golden comments. An LLM judge evaluates each tool: does it find real issues? Does it generate noise?"

Definições de métrica, do README raiz:

> "**Precision** | Tool comments that match a golden comment / total tool comments | **Recall** | Golden comments found by the tool / total golden comments"

> "In both cases, the judge prompt asks 'do these describe the same underlying issue?' — different wording is fine, only the substance matters."

Perfis de scoring (Strict 139 goldens / Core 158 / All 173) e:

> "The dashboard supports F-beta scoring (β = 0.5 to 3.0). F1 weights precision and recall equally; **F2 weights recall 4x more, reflecting the real-world cost asymmetry where missed bugs are worse than false alarms.**"

Do post metodológico:

> "Existing benchmarks are small (50–100 PRs), vendor-published (the vendor's tool wins), unrefreshable (stale data, training contamination), and under-defined (no shared notion of what counts as a bug or how to measure precision and recall)."

> "**Recall** requires knowing what bugs exist — but if we already knew, we wouldn't need the tool. Worse, if a tool finds a real bug that human annotators missed, current benchmarks penalize it: the bug isn't in the gold set, so the discovery is scored as a false positive. **Existing benchmarks structurally cannot measure superhuman performance and will actively punish it.**"

> "Graphite has **the highest precision and lowest recall in both benchmarks**" · "Coderabbit has the highest recall in the online data (0.54)" · "**No tool found more than 63% of the known issues.**"

**Por que a ordenação NÃO é comparável à nossa:** este benchmark ranqueia **ferramentas** (Augment, Baz, Claude Code, CodeAnt, CodeRabbit, Cursor Bugbot, Cubic, Devin, Gemini, GitHub Copilot, GitLab Duo, Graphite, Greptile, Propel, KG, Kodus, Macroscope, Qodo, Sourcery), não modelos crus. Os próprios autores declaram que isso ainda não existe:

> "**We're building a standardized evaluation harness — a minimal, shared interface that lets us test raw model performance separately from product engineering.**"

#### Leaderboard offline completo (extraído da fonte primária)

O leaderboard web é renderizado por JavaScript, mas o endpoint de dados é público e sem autenticação: **`https://codereview.withmartian.com/benchmark_dashboard.json`** (HTTP 200, `application/json`, baixado 2026-08-13). Juiz default: `anthropic_claude-opus-4-5-20251101`. 50 PRs, 137 golden comments no perfil ativo.

| # | Tool | F1 | Precision | Recall | TP | FP | FN |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | cubic-v2 | 61,8 | 56,3 | 68,6 | 94 | 73 | 43 |
| 2 | qodo-extended-v2 | 57,9 | 54,9 | 61,3 | | | |
| 3 | augment | 53,5 | 47,5 | 61,3 | | | |
| 4 | qodo-v2 | 48,4 | 42,9 | 55,5 | | | |
| 5 | gitlab | 48,3 | 45,2 | 51,8 | | | |
| 6 | propel-v2 | 46,9 | 44,4 | 49,6 | | | |
| 7 | qodo-extended | 46,7 | 37,2 | 62,8 | | | |
| 8 | macroscope | 46,0 | 48,4 | 43,8 | | | |
| 9 | gitar | 45,9 | 46,6 | 45,3 | | | |
| 10 | propel | 45,7 | 55,8 | 38,7 | 53 | 42 | 84 |
| 11 | bugbot (Cursor) | 45,5 | 47,2 | 43,8 | | | |
| 12 | devin | 44,2 | 54,3 | 37,2 | 51 | 43 | 86 |
| 13 | gemini-v2 | 44,0 | 37,2 | 54,0 | | | |
| 14 | greptile-v4-1 | 44,0 | 40,5 | 48,2 | | | |
| 15 | copilot-v2 | 43,5 | 32,4 | 66,4 | 91 | 190 | 46 |
| 16 | sourcery | 40,6 | 33,3 | 51,8 | | | |
| 17 | **kodus-v2** | **40,5** | **46,7** | **35,8** | **49** | **56** | **88** |
| 18 | baz | 40,3 | 49,0 | 34,3 | | | |
| 19 | claude-code | 37,6 | 34,8 | 40,9 | | | |
| 20 | claude | 35,3 | 34,8 | 35,8 | | | |
| 21 | coderabbit | 35,2 | 25,7 | 56,2 | 77 | 223 | 60 |
| 22 | codeant-v2 | 34,7 | 31,9 | 38,0 | | | |
| 23 | gemini | 33,9 | 31,1 | 37,2 | | | |
| 24 | kg | 25,1 | 50,0 | 16,8 | 23 | 23 | 114 |
| 25 | **graphite** | 16,1 | **100,0** | **8,8** | **12** | **0** | **125** |

> **O caso Graphite é o achado mais eloquente de todo o levantamento.** Uma ferramenta de produção, nos **mesmos cinco repositórios do nosso bench**, entrega **precisão 100,0% com recall 8,8%** — 12 verdadeiros positivos, **zero** falsos positivos, 125 golden comments perdidos.
>
> Compare com o nosso Gemini 3.7 Flash: **precisão micro 73,9%, recall 11,6%** (§C.1). São pontos vizinhos na mesma fronteira. A diferença é que a Graphite escolheu esse ponto **deliberadamente, como produto**; nós observamos o modelo escolhê-lo sozinho.
>
> O que isso prova: **um recall de ~10% nesses repositórios é um ponto de operação viável e comercializado, não um sintoma de incompetência.** É a evidência mais forte de que a hipótese de "calibração conservadora" descreve algo real — e a mais forte de que ela **não requer** RL de edição para explicar.

### 3.2 SWE-PRBench — o único com ranking de MODELOS crus em review de PR

- **Link:** https://arxiv.org/abs/2603.26130 · HTML: https://arxiv.org/html/2603.26130v1
- **Autor:** Deepak Kumar
- **Data:** submetido **27 Mar 2026**

Do abstract:

> "We introduce SWE-PRBench, a benchmark of 350 pull requests with human-annotated ground truth for evaluating AI code review quality. Evaluated against an LLM-as-judge framework validated at kappa=0.75, **8 frontier models detect only 15-31% of human-flagged issues on the diff-only configuration**, demonstrating that AI code review remains far below human expert performance **despite strong results on code generation benchmarks.**"

> "All 8 models degrade monotonically from config_A to config_C, even when context is provided via structured semantic layers [...] The top four models are statistically indistinguishable (mean score 0.147-0.153) while a clear tier gap separates them from the remaining four (mean score <= 0.113)."

Tabela 8 — "SWE-PRBench leaderboard (100-PR sample, 8 models)", transcrita:

| Model | sₐ | s_b | s_c | s̄ | DRA (detection) | FPR (hallucination) |
|---|---:|---:|---:|---:|---:|---:|
| Claude Haiku 4.5 | 0.172 | 0.129 | 0.126 | **0.153** | 0.306 | 0.346 |
| Claude Sonnet 4.6 | 0.190 | 0.135 | 0.122 | **0.152** | 0.297 | 0.227 |
| DeepSeek V3 | 0.181 | 0.132 | 0.118 | **0.150** | 0.312 | 0.315 |
| Mistral Large 3 | 0.170 | 0.125 | 0.135 | **0.147** | 0.305 | 0.353 |
| GPT-4o | 0.134 | 0.110 | 0.090 | 0.113 | 0.220 | 0.193 |
| GPT-4o-mini | 0.110 | 0.095 | 0.093 | 0.108 | 0.210 | 0.353 |
| Mistral Small | 0.131 | 0.080 | 0.091 | 0.106 | 0.257 | 0.251 |
| Llama 3.3 70B | 0.088 | 0.071 | 0.065 | 0.079 | 0.223 | 0.417 |

E o trade-off, literal:

> "Haiku and DeepSeek achieve higher detection but at higher hallucination cost; Sonnet and GPT-4o produce more reliable comments with lower FPR."

**Semelhança com a nossa ordenação: PARCIAL.**
- **A favor:** o modelo **pequeno e barato da Anthropic bate o grande** (Haiku 4.5 > Sonnet 4.6) — inversão exata em relação a benchmarks de edição. Os **GPT-4o ficam na metade de baixo**. DeepSeek fica no topo, empatado.
- **Contra:** **Llama 3.3 70B fica em ÚLTIMO** — o que contradiz frontalmente a leitura "labs chineses + Meta na frente".
- **Ressalva de época:** o conjunto de modelos é de 2025 (GPT-4o, DeepSeek V3, Llama 3.3). Não há Gemini 3.x, nem GPT-5.x, nem Qwen3.x, nem Kimi. Comparar com a nossa tabela de 2026 é comparar gerações diferentes.

### 3.3 *Bigger Isn't Always Better* — a inversão pequeno-bate-grande, replicada

- **Link:** https://arxiv.org/abs/2606.15689 · HTML: https://arxiv.org/html/2606.15689v1
- **Autores:** Shivam Pankaj Kumar, Swati Bararia, Kislay Raj
- **Data:** **9 Apr 2026**

> "We present a systematic evaluation of five large language models on automated code review, comparing **Claude Sonnet 4.6, Claude Haiku 4.5, GPT-5.4 mini, Minimax M2.7, and GLM-5 Turbo** across 150 code review samples [...] Our principal finding is that **Claude Haiku 4.5, a smaller and cheaper model, consistently outperforms the larger Claude Sonnet 4.6, achieving higher F1 (0.365 vs. 0.343), 18% higher recall**, and superior qualitative review scores across all four evaluation dimensions, at 3.2x lower cost per review. This result holds across three independent experimental conditions (n=25, n=100, n=150) and is **independently confirmed on the Martian Code Review Benchmark.**"

> "(1) synthetic-only evaluation dramatically overestimates model capability — **on real PRs alone, the best model achieves F1 = 0.066, compared to F1 = 0.847 on synthetic samples, a 92% degradation**; (2) diff size is the dominant predictor of review quality, with F1 dropping from 0.657 on diffs under 10 lines to 0.043 on diffs over 150 lines; and (3) **all models exhibit near-zero recall on performance-related bugs.**"

**Semelhança com a nossa ordenação: A FAVOR, no eixo "capacidade de edição não prevê capacidade de detecção".** Este é o achado mais robusto do conjunto: o modelo com melhor SWE-bench da família perde para o menor em review, replicado em três condições e num benchmark independente.

### 3.4 SecLens — ordenação que CONTRADIZ a nossa

- **Link:** https://arxiv.org/html/2604.01637v1 — data **2 Apr 2026** (ver §4.5 para as citações sobre conservadorismo)

Leaderboard agregado, 12 modelos frontier, 406 tarefas, 93 projetos, 10 linguagens, 8 categorias OWASP:

| # | Model | Leaderboard |
|---:|---|---:|
| 1 | **Gemini 3 Flash Preview** | **49,6%** |
| 2 | Gemini 3.1 Pro Preview | 48,2% |
| 3 | Claude Sonnet 4.6 | 47,6% |
| 4 | Kimi K2.5 | 46,8% |
| 5 | Gemini 2.5 Pro | 46,2% |
| 6 | Gemini 2.5 Flash | 44,3% |
| 7 | Grok Code Fast 1 | 44,1% |
| 8 | Claude Haiku 4.5 | 43,8% |
| 9 | Claude Opus 4.6 | 41,7% |
| 10 | Qwen3-Coder-Plus | 41,2% |
| 11 | GPT-5.4 | 39,9% |
| 12 | **Qwen3-Coder** | **37,3%** |

> ⚠️ **CONTRADIÇÃO DIRETA COM A NOSSA HIPÓTESE.** Neste benchmark de detecção, **Gemini Flash é PRIMEIRO** e **os dois modelos Qwen são ÚLTIMOS** — exatamente o inverso da nossa tabela. Se a "calibração conservadora do Gemini" fosse uma propriedade estável do modelo, ela apareceria aqui. Não aparece.
>
> A diferença plausível é a **forma da tarefa**: SecLens é classificação de vulnerabilidade por tarefa curada; nosso bench é agente multi-passo com replay de ferramentas emitindo findings livres em diff real. Mas isso é **nossa inferência** (§7), não algo que o paper diga.

### 3.5 CR-Bench — trade-off recall vs. sinal/ruído medido explicitamente

- **Link:** https://arxiv.org/html/2603.11078v1
- **Autores:** Kristen Pereira, Neelabh Sinha, Rajat Ghosh, Debojyoti Dutta (**Nutanix, Inc.**)
- **Data:** **10 Mar 2026**

> "[...] finding that **code review agents can exhibit a low signal-to-noise ratio when designed to identify all hidden issues.** The analysis reveals a hidden trade-off between issue resolution and spurious findings."

| Agent | Model | Recall | Precision | F1 | Usefulness | SNR |
|---|---|---:|---:|---:|---:|---:|
| Single-shot | GPT-5.2 | 27,01% | 3,56% | 6,30% | 83,63% | 5,11 |
| Single-shot | GPT-5-mini | 18,39% | 3,51% | 5,90% | 74,29% | 2,89 |
| Reflexion | GPT-5.2 | **32,76%** | 5,10% | 8,83% | 66,10% | **1,95** |
| Reflexion | GPT-5-mini | 27,59% | 3,19% | 5,72% | 47,72% | 0,91 |

> "the Reflexion agent instructively searches for false negatives, which boosted GPT-5.2's Recall to 32.76% [...] But this comes with a drop of 1.95 in SNR."

E — anti-conservadorismo no modelo pequeno:

> "GPT-5-mini achieves a respectable SNR of 2.89 in a single pass, its SNR collapses to 0.91 with the reflexion agent [...] **the small model possibly suffers from a bias of not being able to disagree that more issues don't exist, and responds with noise.**"

### 3.6 Snyk VulnBench JS 1.0 — o trade-off dentro da MESMA família de modelos

- **Link:** https://arxiv.org/html/2606.15762v1
- **Autores:** Liran Tal, Johannes Kloos, Arsenii Rudich, Stephen Thoemmes, Manoj Nair (**Snyk**)
- **Data:** **11 Jun 2026** (arXiv:2606.15762v1)

Tabela 4, transcrita:

| Configuration | F1 | F1 std. dev. | Recall | Precision | Avg. tokens | Est. cost |
|---|---:|---:|---:|---:|---:|---:|
| Snyk Code SAST | 100,0% | 0,0 pp | 100,0% | 100,0% | 0 | N/A |
| Claude Opus 4.6 Medium | **75,4%** | 0,2 pp | 68,0% | **91,5%** | 51.574 | $0,0628 |
| Claude Opus 4.6 High | 75,2% | 0,3 pp | 68,2% | 89,8% | 66.929 | $0,1249 |
| Claude Opus 4.7 Max | 68,8% | 2,2 pp | 71,4% | 69,6% | 95.969 | $0,3559 |
| Claude Sonnet 4.6 Medium | 67,4% | 0,9 pp | 80,9% | 62,6% | 56.992 | $0,0860 |
| Claude Sonnet 4.6 High | 64,9% | 3,5 pp | **81,3%** | 58,6% | 74.240 | $0,1322 |

> "Claude Sonnet 4.6 Medium produced the most one-off extra vulnerability reports: 61.7% of its LLM-only reports appeared in just one of five runs."

**Duas leituras importantes:**
1. É uma **fronteira precisão-recall limpa dentro da mesma família**: Opus 4.6 = 91,5% precisão / 68,0% recall; Sonnet 4.6 High = 58,6% precisão / 81,3% recall. Mesmo lab, mesmo prompt, mesmo harness.
2. **Contra a hipótese:** o modelo *mais novo e mais agêntico* no esforço mais alto (Opus 4.7 Max) tem recall **maior** (71,4%) e precisão **menor** (69,6%) que o Opus 4.6. Se cada geração ficasse mais conservadora, seria o inverso.

### 3.7 AACR-Bench (Alibaba + Nanjing University) — o ÚNICO caso que se parece com a nossa ordenação

- **Link:** https://arxiv.org/abs/2601.19494 · **Repo:** https://github.com/alibaba/aacr-bench (Apache-2.0, v1.0 Jan 2026)
- **Título:** *AACR-Bench: Evaluating Automatic Code Review with Holistic Repository-Level Context*
- **Autores:** Lei Zhang, Yongda Yu, Minghui Yu, Xinxin Guo, Zhengqi Zhuang, Guoping Rong, Dong Shao, Haifeng Shen, Hongyu Kuang, Zhengfeng Li, Boge Wang, Guoan Zhang, Bangyu Xiang, Xiaobin Xu
- **Data:** v1 **27 Jan 2026**, v2 **29 Jan 2026**

Do abstract:

> "AACR-Bench employs an 'AI-assisted, Expert-verified' annotation pipeline to uncover latent defects often overlooked in original PRs, resulting in a **285% increase in defect coverage.** Extensive evaluations of mainstream LLMs on AACR-Bench reveal that **previous assessments may have either misjudged or only partially captured model capabilities due to data limitations.**"

200 PRs, 10 linguagens, 50 repos, 1.505 comentários anotados. F1 por método de contexto (5 modelos):

| Método | 1º lugar (F1) | 2º | 3º | 4º | 5º |
|---|---|---|---|---|---|
| Agent | Claude-4.5-Sonnet **16,12** | Qwen-480B-Coder 6,82 | GLM-4.7 6,69 | DeepSeek-V3.2 6,67 | GPT-5.2 4,59 |
| No context | **GLM-4.7 16,03** | Claude-4.5-Sonnet 14,46 | Qwen-480B-Coder 14,00 | GPT-5.2 12,19 | DeepSeek-V3.2 9,71 |
| Embedding | **GLM-4.7 15,63** | Qwen-480B-Coder 14,36 | Claude-4.5-Sonnet 13,48 | GPT-5.2 11,74 | DeepSeek-V3.2 8,94 |
| BM25 | **DeepSeek-V3.2 15,59** | GLM-4.7 14,69 | GPT-5.2 14,64 | Qwen-480B-Coder 11,69 | Claude-4.5-Sonnet 9,98 |

> **É o achado mais próximo da nossa ordenação em toda a literatura** — GLM-4.7 lidera F1 em 3 dos 4 settings.
>
> **Mas leia a coluna de recall antes de comemorar:** o **GPT-5.2 tem o MAIOR recall do painel** (47,24 em Embedding, 47,11 em No-context) e perde no F1 porque tem a **pior precisão**. O GLM-4.7 vence com recall ~27% e precisão ~11%. Ou seja: **neste benchmark os modelos chineses são os MAIS conservadores, e vencem por isso.** É o inverso exato do mecanismo que nossa hipótese propõe.

Achado metodológico do paper, relevante ao nosso harness:

> "repository-level context sometimes degrades rather than improves performance"

### 3.8 CodeFuse-CR-Bench (Ant Group) e SWR-Bench (Peking University)

- **CodeFuse-CR-Bench** — https://arxiv.org/abs/2509.14856, v3 **23 Oct 2025**. Repo: https://github.com/codefuse-ai/SWE-CARE · Dados: https://huggingface.co/datasets/inclusionAI/SWE-CARE. 601 instâncias, 70 projetos Python, 9 domínios de problema.

| Model | Model-based | Rule-based | **Comprehensive** |
|---|---:|---:|---:|
| Gemini 2.5 Pro | 63,65 | 29,47 | **52,37** |
| Claude-Sonnet-4 | 60,67 | 33,31 | **47,46** |
| **Kimi-K2-0905** | 62,11 | 20,81 | **46,77** |
| DeepSeek-v3.1 | 58,69 | 28,34 | **42,51** |
| GPT-5 | **64,80** | 18,30 | **41,96** |
| Qwen3-235B | 58,10 | 24,30 | **40,45** |
| GPT-4o | 54,57 | 8,10 | **35,47** |

> Note que o **GPT-5 tem o MAIOR score model-based do painel (64,80)** e cai para 5º por causa do score rule-based (localização). É falha de **localização**, não de detecção. Kimi K2 em 3º, à frente do GPT-5 — ponto a favor da nossa ordenação; Gemini 2.5 Pro em 1º — ponto contra.

- **SWR-Bench** — https://arxiv.org/abs/2509.01494, Peking University + Northwestern Polytechnical. v1 **1 Sep 2025**, **v2 5 Jun 2026** (título mudou para *"SWR-Bench: Assessing LLM Performance in Real-World Code Review Comment Generation"*). 1.000 PRs verificados manualmente.

Ordenação por F1 (setting PR-Review): **GPT-5 20,85 > Gemini-2.5-Pro 19,38 > GPT-4o 18,73 > DeepSeek-R1 18,58 > Claude-3.7-Sonnet 18,23 > GPT-o3 18,13 > DeepSeek-V3 17,52 > Claude-4-Opus 16,99 > Claude-4-Sonnet 16,61 > Qwen-2.5-R1-14B 15,95 > Gemini-2.5-Flash 15,25 > Qwen-2.5-R1-32B 14,98 > Qwen-2.5-32B 13,76 > Qwen-2.5-7B 11,63 > Qwen-2.5-14B 9,01 > Qwen-2.5-R1-7B 7,51.**

**Labs americanos no topo, Qwen ocupando as últimas 6 posições — CONTRADIZ a nossa ordenação.** Ressalva: pacote de replicação em link anônimo `4open.science`, sem repositório público confirmado.

### 3.9 Sphinx, c-CRAB e o inverso agente-vs-modelo em segurança

- **Sphinx** — https://arxiv.org/abs/2601.04252, Daoan Zhang, Shuo Zhang, Zijian Jin, Jiebo Luo, Shengyu Fu, Elsie Nallipogu, **6 Jan 2026**. Checklist coverage + treino RL próprio (**CRPO — Checklist Reward Policy Optimization**). Ordenação dos modelos de prateleira: **GPT4.1 34,23 > Gemini2.5-Pro 32,75 > GPT-o4mini 32,01 > Claude3.7-Sonnet 31,39 > GPT-o3mini 30,84 > Qwen2.5-72B-Ins 30,53 > Qwen3-235B-A22B 29,67 > DeepSeek-v3 26,45 > Deepseek-R1 25,60 > … > LLama3.3-70B 20,68 > Starcoder 14,78.** **CONTRADIZ a nossa.** Dados "released after review" — não públicos.
- **c-CRAB** — https://arxiv.org/abs/2603.23448, Zhang, Pan, Yusuf, Ruan, Shariffdeen, Roychoudhury (NUS + Zhejiang + SonarSource), v1 **24 Mar 2026**, v3 **7 Apr 2026**. Repo: https://github.com/c-CRAB-Benchmark. Ground truth **executável**: o comentário só conta se guiar um agente a um patch que passa no teste. 184 instâncias / 234 testes / 67 repos. **Human 100% · Claude Code 32,1% · Devin 24,8% · PR-Agent 23,1% · Codex 20,1%**; união dos quatro = **41,5%**.
- **CyberGym** (https://www.cybergym.io, arXiv:2506.02548, ICLR 2026; snapshot **2026-08-13**, Level 1) — **a ordenação depende de você ranquear AGENTES ou MODELOS, e ela inverte:**
  - *Agent view* (default): **#1 Sangfor AI / DeepSeek-V4-Flash 93,2% · #2 Whitzard (Fudan) / DeepSeek-V4-Flash 91,2% · #3 MDASH (Microsoft) 91,0% · #4 Wiz Atlas 90,9% · #5 DoGNAVY / GLM-5.2 90,8%** → labs chineses na frente.
  - *Model-only filter*: **GPT-5.5-Cyber 85,6 · Claude Mythos Preview 83,1 · GPT-5.5 81,8 · GPT-5.4 79,0 · DeepSeek-V4-Flash 76,7** → labs americanos na frente.
  - Ressalva do próprio site: *"Results are evaluated and submitted by individual teams; agent runs are stochastic, so scores may vary across evaluations."*
- **SEC-bench Pro** (https://sec-bench.github.io, arXiv:2605.26548, versão `260617`, snapshot 2026-08-13) — **(b) extremo:** GPT-5.5 58,4% · GPT-5.4 39,0% · Opus 4.6 30,8% · **GLM-5 3,8% · Kimi K2.5 2,3% · MiniMax M2.5 0,6%**. ⚠️ Confundidor grave: modelos chineses rodaram via OpenCode/Bedrock, OpenAI via Codex, Anthropic via Claude Code — **não é scaffold equivalente**.

### 3.10 Frontier labs: todos vendem reviewer, quase nenhum publica benchmark de review

| Lab | Publica benchmark de code review? | Evidência |
|---|---|---|
| **Anthropic** | **NÃO ENCONTRADO** | "code review" aparece **ZERO vezes** no Claude Opus 5 System Card (2026-07-24) e no card Fable 5 / Mythos 5 (2026-06-09), verificado por grep de texto integral. Todo bug-finding está em §3 Cyber (ExploitBench, OSS-Fuzz, Firefox 147, CyScenarioBench, ExploitGym). CyberGym foi **aposentado**: *"we consider it saturated."* O produto Code Review publica taxonomia de severidade e custo (~$15–25/review) e **nenhum número de precisão/recall**. |
| **OpenAI** | **UM** — https://alignment.openai.com/scaling-code-verification/ (2025-12-01), já citado no §1.3. ⚠️ **As Figuras 1–3 são gráficos sem valores numéricos no texto da página.** O benchmark do Aardvark/Codex Security (*"identified 92% of known and synthetically-introduced vulnerabilities"* em *"golden repositories"*) **não é publicado**: sem dataset, sem método, sem baselines. |
| **Google** | **Só gráficos.** Gemini 3.5 Flash Cyber (2026-07-21) é avaliado no **pipeline de varredura de commits em produção do Chrome** — o análogo mais próximo de review de diff feito por um lab. Único número em texto: *"3.5 Flash Cyber found 55 unique confirmed issues, compared to 47 found by mainline 3.5 Flash and 36 found by Opus 4.6."* Os três gráficos de pass@1 **não têm números recuperáveis** (verificado por parse do HTML bruto). |
| **Meta** | **NÃO ENCONTRADO** | Nenhuma avaliação de code review. CyberSecEval (repo ativo, push 2026-08-06) tem 13 benchmarks e **nenhum mede achar defeito em código existente**. |

Mudança de política registrada, Claude Opus 5 System Card (2026-07-24), literal:

> "Opus 5 now permits vulnerability discovery in source code at all access levels, including general availability, while continuing to block vulnerability discovery in compiled binaries."

### 3.11 Benchmarks de fornecedor: todo mundo vence o próprio

| Fornecedor | Link | Data | Dataset | Posição própria |
|---|---|---|---|---|
| Qodo | qodo.ai/blog/how-we-built-a-real-world-benchmark-for-ai-code-review/ | 2026-02-04 | 100 PRs / 580 issues **injetados** | #1 (60,1 F1) |
| Greptile | greptile.com/benchmarks | Jul 2025 | 50 PRs reais / 5 repos | #1 (82% catch) |
| Augment | augmentcode.com/blog/introducing-augment-code-review | 2025-12-11, upd. 2026-06-18 | os 50 PRs da Greptile, corrigidos | #1 (59 F1) |
| Macroscope | macroscope.com/blog/code-review-benchmark | 2025-09-17 | 118 bugs / 45 repos | #1 (48,31%) |
| Tenki | tenki.cloud/benchmarks/code-reviewer | 2026-05-20 | 50 PRs / 122 bugs | #1 (41,7 F1) |
| DeepSource | deepsource.com/benchmarks | ~Mar 2026 | 165 CVEs (OpenSSF) — outra tarefa | #1 (84,51 F1) |
| **Kodus** | kodus.io/benchmark-ai-code-review/ | s/d | 38 PRs / 5 repos, **só detecção, sem precisão** | #1 (79%) |

> ⚠️ **O dado mais desconfortável do levantamento:** a **Greptile pontua 82% no benchmark dela e 45% na re-execução da Augment sobre os mesmos 5 repositórios.**
>
> E: **quatro benchmarks compartilham UMA linhagem de dataset** — os mesmos ~50 PRs em Sentry / Cal.com / Grafana / Discourse / Keycloak (Greptile → Augment → Martian offline; Tenki e Kodus reutilizam os mesmos 5 repos). **Não são medições independentes**, e após ~14 meses em circulação pública, contaminação é risco vivo. **Nosso bench de 30 PRs está nessa mesma linhagem.**

### 3.12 Resposta à Pergunta 3

**Existem benchmarks públicos de code review distintos de benchmarks de edição?** **SIM** — pelo menos **doze** identificados, todos de 2025–2026. O campo é jovem e não consolidado: quase nenhuma sobreposição de modelos testados, nenhum leaderboard compartilhado, e scores absolutos entre **4,6% e 21% de F1** nos conjuntos acadêmicos contra **35–62% de F1** nos conjuntos de fornecedor — porque os de fornecedor usam bugs injetados ou curados e os acadêmicos usam comentários humanos reais.

**A ordenação se parece com a nossa (labs chineses + Meta na frente) ou com a do CursorBench (OpenAI/Google/Anthropic na frente)?**

**Resposta: predominantemente (b) — labs americanos no topo. NENHUMA fonte primária mostra labs chineses + Meta varrendo o topo.** A Meta em particular fica em **último** onde quer que apareça (Llama 3.3 70B em 8º de 8 no SWE-PRBench; Llama 3.3 em 20º de 29 no Sphinx).

| Benchmark | Data | Ordenação vs. a nossa |
|---|---|---|
| **AACR-Bench** | 2026-01 | **A FAVOR** — GLM-4.7 lidera 3 de 4 settings. **Mas por PRECISÃO: o GPT-5.2 tem o maior recall do painel.** |
| CodeFuse-CR-Bench | 2025-10 | **PARCIAL** — Kimi K2 em 3º, à frente do GPT-5 ✅; Gemini 2.5 Pro em 1º ❌ |
| SWE-PRBench | 2026-03 | **PARCIAL** — Haiku > Sonnet e DeepSeek V3 em 3º com a maior taxa de detecção ✅; **Llama 3.3 em último** ❌ |
| Bigger Isn't Always Better | 2026-04 | **A FAVOR** — Haiku 4.5 > Sonnet 4.6, Minimax M2.7 em 2º. ⚠️ dataset não liberado, data inconsistente |
| SWR-Bench | 2026-06 | **CONTRA** — GPT-5 em 1º, Qwen nas 6 últimas |
| Sphinx | 2026-01 | **CONTRA** — GPT-4.1 e Gemini no topo |
| SecLens | 2026-04 | **CONTRA** — Gemini Flash em **1º**, Qwen em 11º e 12º |
| SEC-bench Pro | 2026-06 | **CONTRA, extremo** — GPT-5.5 58,4% vs GLM-5 3,8% |
| CyberGym | 2026-08 | **DEPENDE** — agentes: chineses em 1º e 2º; modelos: americanos em 1º–4º |
| codereviewbench.com (nosso) | 2026-02 | **CONTRA a nossa própria nova passada** — ver §C.3 |
| CR-Bench / Snyk VulnBench / c-CRAB / Martian | 2026 | não comparáveis — um lab só, ou ranqueiam ferramentas/agentes |

**Três conclusões defensáveis, mais interessantes que um "(a)" limpo:**

1. **Labs chineses se intercalam muito mais alto em review do que em edição.** Kimi K2 em 3º à frente do GPT-5; GLM-4.7 no topo do F1 em 3 settings; DeepSeek V3 em 3º com a maior taxa de detecção bruta. É um campo materialmente mais plano que o SWE-bench.
2. **A ordenação vira conforme você ranqueia por precisão ou por recall — e essa virada é a história.** No AACR-Bench o GPT-5.2 tem o maior recall e fica no meio; o GLM-4.7 tem recall baixo e vence o F1. **Um benchmark que ranqueia por recall puro produz ordenação diferente — às vezes invertida — de um que ranqueia por F1.** O nosso ranqueia por recall.
3. **Agentes e modelos invertem a resposta** (CyberGym). Citar um sem o outro é enganar.

**A afirmação "labs chineses + Meta na frente em code review" NÃO ENCONTRADA em nenhuma fonte primária.** O padrão que **é** replicado é outro, mais estreito e mais útil: **desempenho em geração/edição não prevê desempenho em detecção**, e às vezes se inverte dentro da mesma família (Haiku 4.5 > Sonnet 4.6, em dois estudos independentes).

### 3.13 Contradição em aberto entre os labs e os benchmarks

Os dois labs que enviaram reviewer para produção publicaram a mesma afirmação de design: **contexto só-de-diff é insuficiente; acesso ao repositório melhora precisão E recall**.

> OpenAI: "Most of the previous attempts at code review relied on providing just a diff of the change to the model… it often misses important context about the whole codebase." · "GPT-5.1-Codex simultaneously improves both recall and precision over GPT-5 with special scaffolding and repository access." (2025-12-01)

**Dois benchmarks independentes mediram o OPOSTO:**

> SWE-PRBench: "All 8 models degrade monotonically from config_A [diff only] to config_C [full context]" (2026-03-27)

> AACR-Bench: "repository-level context sometimes degrades rather than improves performance" (2026-01-27)

**Esta é a questão aberta mais relevante do campo** — e é diretamente acionável para nós, porque nosso harness dá acesso a ferramentas de repositório.

---

## 4. Pergunta 4 — Selective prediction, calibrated abstention e confidence calibration aplicados a código

### 4.1 O achado estrutural: a literatura formal de abstenção NÃO chegou em detecção de bugs

**NÃO ENCONTRADO:** nenhum trabalho que aplique o aparato formal de **selective prediction / selective classification** — curvas risco-cobertura, regra de Chow, *reject option* com garantia — a detecção de bugs por LLM, triagem de SAST ou code review.

O mais próximo em cada direção:

- **Selective prediction sem código:** *Aligning Language Models with Selective Prediction* (arXiv 2607.03528); *Cost-Saving LLM Cascades with Early Abstention* (arXiv 2502.09054); *Uncertainty-Aware Abstention in Large Language Models with Provable Alignment Guarantees* (arXiv 2607.04430); *Geometry-Calibrated Conformal Abstention for Language Models* (arXiv 2604.27914).
- **Reject option em código, mas pré-LLM:** *Classification with Reject Option for Software Defect Prediction* (~2016).

**Este é um buraco real na literatura — e é a contribuição que o codereviewbench pode reivindicar.**

### 4.2 Calibração degrada com pós-treinamento (estabelecido, mas datado)

- **Link:** https://arxiv.org/abs/2303.08774 · https://cdn.openai.com/papers/gpt-4.pdf — *GPT-4 Technical Report*, OpenAI
- **Data:** v1 **15 Mar 2023**

> "Interestingly, the pre-trained model is highly calibrated (its predicted confidence in an answer generally matches the probability of being correct). However, after the post-training process, the calibration is reduced (Figure 8)."

Legenda da Figura 8:

> "Right: Calibration plot of the post-trained GPT-4 model on the same subset of MMLU. **The post-training hurts calibration significantly.**"

**Sinalização de obsolescência:** **2023**. Mede apenas logprobs em múltipla escolha (MMLU). Não diz nada sobre código, sobre RLVR ou sobre agentes. É a citação canônica e é a mais fraca das que temos.

- **Link:** https://arxiv.org/html/2603.09117 — *Decoupling Reasoning and Confidence: Resurrecting Calibration in RLVR (DCPO)*, Ma et al. (Chinese Academy of Sciences)
- **Data:** v3 **27 May 2026**

> "Reinforcement Learning from Verifiable Rewards (RLVR) significantly enhances large language models (LLMs) reasoning but severely suffers from calibration degeneration, **where models become excessively over-confident in incorrect answers.**"

Reporta confiança média subindo de ~0,88 para >0,98 após GRPO, e **inclui benchmarks de código** (LiveCodeBench v5/v6, HumanEval+). **Atenção ao sinal: é super-confiança, não conservadorismo.**

- **Link:** https://arxiv.org/abs/2507.16806 — *Beyond Binary Rewards: Training LMs to Reason About Their Uncertainty* (RLCR), Damani, Puri, Slocum, Shenfeld, Choshen, Kim, Andreas (MIT CSAIL)
- **Data:** v1 **22 Jul 2025**; v2 **15 May 2026**

> "When language models (LMs) are trained via reinforcement learning (RL) to generate natural language 'reasoning chains', their performance improves on a variety of difficult question answering tasks [...] they often have the unintended side-effect of **degrading calibration and increasing the rate at which LMs generate incorrect responses** (or 'hallucinate') in other problem domains."

O paper mostra que adicionar um termo de Brier score à recompensa binária **corrige a calibração sem perda de acurácia** — ou seja, "RL degrada calibração" é artefato do **reward**, não lei do RL.

### 4.3 Calibração especificamente em modelos de código

- **Link:** https://arxiv.org/abs/2402.02047 — *Calibration and Correctness of Language Models for Code*, Spiess, Gros, Pai, Pradel, Rabin, Alipour, Jha, Devanbu, Ahmed (UC Davis / Stuttgart / Houston / SRI)
- **Data:** v3, **Fev 2024**

> "by and large generative code models are not well-calibrated out of the box"

> "verbalized confidence [...] is not well calibrated for these models on the studied SE tasks"

Platt scaling melhora o ECE de 0,32 para 0,03. **Sinalização de obsolescência: 2024, pré-modelos de raciocínio.** Continua sendo o paper mais citado de calibração em código, mas o conjunto de modelos está inteiramente superado.

- **Link:** https://arxiv.org/abs/2605.17029 — *Task Abstention for Large Language Models in Code Generation*, Zhou et al.
- **Data:** v1 **19 May 2026**

Único paper encontrado sobre **abstenção em código**. Reporta **tanto over- quanto under-abstention** conforme o tamanho do modelo; a conclusão é que os modelos não conseguem avaliar a própria competência. ⚠️ **Extração do PDF falhou parcialmente — não obtivemos abstract verbatim. Verificar antes de citar.**

- **Link:** https://arxiv.org/abs/2606.31159 — *An Empirical Study of Security Calibration in Large Language Models for Code*, Mohammed Latif Siddiq, Md. Nafiu Rahman, Joanna C. S. Santos
- **Data:** **30 Jun 2026**

Do abstract (verificado):

> "We evaluate GPT-4o-mini, Gemini-2.0-Flash, and Qwen3-Coder-Next across multiple temperature settings on two complementary benchmarks [...] **Our results suggest that overconfidence is prevalent across the evaluated LLMs.** Functional calibration is consistently worse than security calibration [...] Moreover, we study different mitigation strategies for reducing **False Trust, where models assign high confidence to vulnerable code.**"

**Sinal: super-confiança de novo, não conservadorismo** — mas note que o objeto medido é a auto-avaliação do código que o modelo **gerou**, não a detecção de bugs em código de terceiros.

### 4.4 A tese "avaliações penalizam a incerteza" — e por que ela aponta CONTRA a hipótese

- **Link:** https://arxiv.org/abs/2509.04664 · https://cdn.openai.com/pdf/d04913be-3f6f-4d2b-b283-ff432ef4aaa5/why-language-models-hallucinate.pdf — *Why Language Models Hallucinate*, Adam Tauman Kalai, Ofir Nachum, Santosh S. Vempala, Edwin Zhang (OpenAI + Georgia Tech)
- **Data:** v1 **4 Sep 2025** (sem revisões)

Abstract, literal:

> "Like students facing hard exam questions, large language models sometimes guess when uncertain, producing plausible yet incorrect statements instead of admitting uncertainty. [...] **We argue that language models hallucinate because the training and evaluation procedures reward guessing over acknowledging uncertainty** [...] This 'epidemic' of penalizing uncertain responses can only be addressed through a socio-technical mitigation: modifying the scoring of existing benchmarks that are misaligned but dominate leaderboards [...]"

§4.1:

> "Under binary grading, abstaining is strictly sub-optimal. IDK-type responses are maximally penalized while an overconfident 'best guess' is optimal."

§3.1:

> "Empirical studies show that base models are often found to be calibrated, in contrast to post-trained models which may deviate from cross-entropy in favor of reinforcement learning."

**Por que isso importa para nós:** o argumento central da OpenAI é que o regime de treino/avaliação dominante empurra os modelos a **chutar**, não a se calar. Se essa tese está certa, a predição default para um modelo pós-treinado é **mais** findings, não menos. O paper **não tem nenhum conteúdo sobre código ou detecção de bugs** — a transposição para nosso caso é nossa, não deles.

### 4.5 Modelos frontier realmente são conservadores em DETECÇÃO de vulnerabilidade (evidência a favor)

- **Link:** https://arxiv.org/html/2512.10485v2 — *From Lab to Reality: A Practical Evaluation of Deep Learning Models and LLMs for Vulnerability Detection*, Chaomeng Lu, Bert Lagaisse
- **Data:** v2 **2 Jul 2026**

> "LLMs such as Claude 3.5 Sonnet, GPT-o3-mini, GPT-4o, and GPT-5 achieve seemingly high accuracy scores (above 92%), but this is primarily because **they predict nearly all samples as non-vulnerable.** Their extremely low F1-scores (0–4.9) reveal that they fail to identify vulnerable cases, highlighting a strong bias towards the majority class and limited practical usefulness for real-world vulnerability detection."

Tabela 6 (setting *Whole-File*), verbatim:

| Model | Accuracy | Precision | Recall | F1 |
|---|---:|---:|---:|---:|
| Claude 3.5 Sonnet | 92 | 2.3 | 4 | 2.9 |
| GPT-o3-mini | 96.51 | 0 | 0 | 0 |
| GPT-4o | 96.24 | 0 | 0 | 0 |
| GPT-5 | 95.41 | 6.25 | 4 | 4.9 |

**Ressalva forte:** o paper mede o **comportamento**, não a causa. Ele **não** atribui o conservadorismo a RL nem a treino de edição, e o setting é **classificação binária desbalanceada por arquivo**, não review agêntico com emissão de findings. São formas de tarefa diferentes.

- **Link:** https://arxiv.org/html/2601.22952v1 — *Sifting the Noise: A Comparative Study of LLM Agents in Vulnerability False Positive Filtering*, Yunpeng Xiong (Univ. Melbourne), Ting Zhang (Monash)
- **Data:** v1 **30 Jan 2026**

> "[...] reducing an initial FP detection rate of over 92% on the OWASP Benchmark to as low as 6.3% in the best configuration. [...] Moreover, **aggressive FP reduction can come at the cost of suppressing true vulnerabilities, highlighting important trade-offs.**"

> "The agent incorrectly labeled 314 true vulnerabilities as FPs, resulting in a **TP retention of 77.7% and a miss rate of 22.25%.**"

É o número quantificado mais limpo que encontramos do custo em recall de suprimir falso positivo.

- **Link:** https://arxiv.org/html/2604.01637v1 — *SecLens: Role-Specific Evaluation of LLMs for Security Vulnerability Detection*, Halder, Saxena (Mattersec Labs), Kadaba, Shrish, Thiyagarajan M (Kalmantic Labs)
- **Data:** v1 **2 Apr 2026**

> "Models with high precision and low recall (Qwen3-Coder, GPT-5.4) excel for the Head of Engineering, who values actionable findings and low false-positive rates."

> "The model rarely predicts 'vulnerable,' so it misses almost all true positives while avoiding false positives." (sobre Qwen3-Coder)

> "**The same behavioral trait, conservative prediction, is a strength for one stakeholder and a weakness for another.**"

**Esta última frase é a tese central do nosso ADR, publicada por outra equipe.** Ver §3 para a ordenação de modelos deste benchmark, que **contradiz** a nossa.

### 4.6 Resposta à Pergunta 4

**Existe trabalho publicado sobre selective prediction / calibrated abstention / confidence calibration aplicado a detecção de bugs, análise estática ou code review?**

- **Confidence calibration em código:** **SIM** — arXiv 2402.02047 (2024, datado), 2606.31159 (2026, números não verificados).
- **Abstenção em código:** **SIM, um só** — arXiv 2605.17029 (2026), e é sobre *code generation*, não detecção.
- **Selective prediction / calibrated abstention formal em detecção de bugs:** **NÃO ENCONTRADO.**
- **Custo em recall de suprimir falso positivo, quantificado:** **SIM** — arXiv 2601.22952 (miss rate 22,25%).
- **Conservadorismo medido em modelos frontier em detecção:** **SIM** — arXiv 2512.10485, 2604.01637. **Nenhum atribui a causa a RL.**

---

## 5. Pergunta 5 — Documentação oficial do Gemini 3 sobre `thinking_level`

> Esta é a seção com a resposta mais limpa e mais acionável do documento.

### 5.1 Valores existentes e default POR MODELO

- **Link:** https://ai.google.dev/gemini-api/docs/thinking
- **Data na página:** "**Last updated 2026-08-13 UTC**". Acessado 2026-08-13.

Texto que introduz o parâmetro:

> "Gemini models engage in dynamic thinking by default, automatically adjusting the amount of reasoning effort based on the complexity of the request. You can control this behavior using the `thinking_level` parameter."

Tabela oficial, transcrita **verbatim** do HTML da página:

| Model | Default Thinking | Levels Supported |
|---|---|---|
| `gemini-3.7-flash` | **On (medium)** | **low, medium, high** |
| `gemini-3.6-flash` | On (medium) | minimal, low, medium, high |
| `gemini-3.5-flash-lite` | On (minimal) | minimal, low, medium, high |
| `gemini-3.1-pro-preview` | **On (high)** | low, medium, high |
| `gemini-3.1-flash-lite-image` | On (minimal) | minimal, high |
| `gemini-3-flash-preview` | On (high) | minimal, low, medium, high |
| `gemini-3-pro-preview` | On (high) | low, high |
| `gemini-3.5-flash` | On (medium) | minimal, low, medium, high |
| `gemini-2.5-pro` | On | low, medium, high |
| `gemini-2.5-flash` | On | low, medium, high |
| `gemini-2.5-flash-lite` | Off | low, medium, high |

**Resposta direta: SIM, Flash e Pro têm defaults diferentes.** `gemini-3.7-flash` → **medium**; `gemini-3.1-pro-preview` → **high**. E `gemini-3.7-flash` **não suporta `minimal`** — só `low`, `medium`, `high`.

### 5.2 Confirmação na página do próprio modelo

- **Link:** https://ai.google.dev/gemini-api/docs/latest-model ("What's new in Gemini 3.7 Flash")
- **Data na página:** "**Last updated 2026-08-13 UTC**". Acessado 2026-08-13.

A tabela "New model" traz literalmente:

> "Gemini 3.7 Flash | `gemini-3.7-flash` | **Default thinking level: medium** | [...] | Our most capable Flash model, built for complex coding, agentic workflows, and reliable multi-step execution."

> "Gemini 3.7 Flash supports a 1M token context window, 64k max output tokens, **tunable thinking levels (low, medium, high)**, and the same suite of built-in tools as 3.6 Flash."

Seção "Understanding reasoning levels":

> "**Low thinking effort:** Reduces time-to-answer for latency-critical tasks like incident response pipelines, real-time chat, writing drafts, and fast data analysis."

> "**Medium (default): Best quality for most tasks. Recommended for complex code and agentic use cases, with higher first-pass accuracy.**"

> "**High thinking effort:** Maximizes the model's ability to think and use tools. Best for complex reasoning, hard math, and the most difficult coding and agent tasks. Allows extended thoughts and function calls, with higher token consumption and cost."

Tradução do item central: "**Médio (default): melhor qualidade para a maioria das tarefas. Recomendado para código complexo e casos de uso agênticos, com maior acurácia de primeira passada.**"

> **Registre a expressão "higher first-pass accuracy".** É a formulação de fornecedor mais próxima de "pass@1" que encontramos, e ela está associada ao nível **default** — não ao `high`.

### 5.3 Inconsistência documental a registrar

O **Gemini 3 Developer Guide** (https://ai.google.dev/gemini-api/docs/gemini-3, "Last updated 2026-07-30 UTC", acessado 2026-08-13) afirma:

> "**If `thinking_level` is not specified, Gemini 3 will default to high.** For faster, lower-latency responses when complex reasoning isn't required, you can constrain the model's thinking level to low."

Essa frase **contradiz** a tabela do §5.1 para os modelos Flash. A tabela desse guia só cobre `Gemini 3.1 Pro`, `Gemini 3.1 Flash-Lite` e `Gemini 3 Flash` — não cobre o 3.7 Flash. A página de `thinking` (atualizada 2026-08-13) e a página do 3.7 Flash (atualizada 2026-08-13) são mais recentes que o guia (2026-07-30) e concordam entre si: **o default do `gemini-3.7-flash` é `medium`**.

Descrições dos níveis, do mesmo guia:

> "minimal | [...] Matches the 'no thinking' setting for most queries. The model may think very minimally for complex coding tasks. Minimizes latency for chat or high throughput applications. Note, minimal does not guarantee that thinking is off."

> "high | [...] Maximizes reasoning depth. The model may take significantly longer to reach a first (non thinking) output token, but the output will be more carefully reasoned."

Outras notas do guia relevantes ao harness:

> "**You cannot use both `thinking_level` and the legacy `thinking_budget` parameter in the same request. Doing so will return a 400 error.**"

> "For all Gemini 3 models, **we strongly recommend keeping the temperature parameter at its default value of 1.0.** [...] Changing the temperature (setting it below 1.0) may lead to unexpected behavior, such as looping or degraded performance, particularly in complex mathematical or reasoning tasks."

E a migração para 3.7 Flash exige:

> "Remove deprecated sampling parameters: Strip `temperature`, `top_p`, and `top_k` from generation configs." / "Replace `thinking_budget` with the string enum `thinking_level`."

### 5.4 Há nota oficial sobre efeito em tarefas de DETECÇÃO/CLASSIFICAÇÃO?

**NÃO ENCONTRADO** — com uma exceção que aponta na direção **contrária** à intuição.

A única menção a classificação em toda a documentação de `thinking` é esta, na seção "Best practices" de https://ai.google.dev/gemini-api/docs/thinking (Last updated 2026-08-13 UTC):

> "**Simple tasks**: Use minimal or low thinking for fact retrieval or **classification** (e.g., 'Where was DeepMind founded?')."

> "**Complex tasks**: Use maximum thinking for advanced coding, math, or multi-step planning (e.g., Solve AIME math problems)."

Ou seja: a Google classifica "classificação" como **tarefa simples**, recomendando pensamento **mínimo ou baixo**. Não há nenhuma nota sobre detecção de defeitos, recall, falso negativo ou taxa de reporte.

**Onde se procurou:** busca textual por `detect`, `classif`, `accuracy`, `precision`, `recall`, `bug`, `review`, `trade` no texto renderizado integral de `ai.google.dev/gemini-api/docs/thinking`, `ai.google.dev/gemini-api/docs/gemini-3` e `ai.google.dev/gemini-api/docs/latest-model`, em 2026-08-13.

### 5.5 Implicação operacional imediata para o nosso bench

O scorecard `scorecards/gemini-3.7-flash.json` registra `reasoning.config = "vendor-default"`, `effortRequested = null`. Pela documentação oficial acima, **isso significa `thinking_level: "medium"`**. O experimento descartado no briefing ("thinkingLevel=high em vez do default") foi portanto **medium → high**, não "off → high". A magnitude do ganho (10,5% → 13,2%) deve ser lida contra esse baseline, e é consistente com o que a OpenAI publica sobre orçamento de raciocínio em review (§1.3: "the additional budget mostly improves calibration and reduces false alarms").

**Não testado por nós e ainda em aberto:** `thinking_level: "low"`. Se o mecanismo for calibração conservadora, `low` deveria reduzir ainda mais o recall; se for capacidade, `low` deveria degradar tudo. É um teste barato que discrimina as duas hipóteses.

---

# PARTE B — ESPECULAÇÃO DE TERCEIROS

> **Tudo nesta seção é blog de fornecedor de ferramenta de code review.** Não é fonte primária sobre o comportamento dos modelos: são empresas que vendem produtos concorrentes, com dados não publicados, ground truth definido por elas mesmas e incentivo comercial no resultado. Está aqui **porque descreve o nosso fenômeno com precisão desconfortável**, não porque sustente conclusão.

## B.1 Greptile — "o modelo achou o bug e não postou"

- **Link:** https://www.greptile.com/blog/model-inversion — "Models are worse at reviewing their own code"
- **Autor e data na página:** "Rodrigo Caridad | **2026-07-21**"

> "The average Codex review would land at around **1 to 2 comments**, while Opus would post around **7 to 8**."

> "**The model would often identify the bugs I expected it to post, explicitly mentioning them as potential issues in its reasoning summaries. Yet it wouldn't post them.**"

Recalls reportados: Claude Opus em PRs do Claude **53,7%**; GPT em PRs do Claude **60,0%**; Claude Opus em PRs do Codex **62,0%**; GPT em PRs do Codex **50,5%**.

**Por que registramos:** a segunda citação é a descrição literal do que observamos em 16 de 30 casos com o Gemini 3.7 Flash — o modelo investiga, identifica, e não reporta. E a primeira é a mesma assinatura de volume (1–2 vs 7–8 comentários) que medimos (0,77 vs 3,2–4,1 findings/caso).

**Por que NÃO conclui nada:** post de blog, sem dataset publicado, sem harness reproduzível, ground truth = "os bugs que eu esperava que ele postasse".

## B.2 CodeRabbit — Opus 5 x-high vs GPT-5.6 Sol

- **Link:** https://www.coderabbit.ai/blog/opus-5-model-review
- **Autor e data:** Hendrik Krack, **24 Jul 2026**

> "Opus 5 x-high is a specialist. It produces a cleaner actionable subset, but catches fewer known issues and adds a substantial nitpick tail" — 55,2% vs 61,1% de issues conhecidos capturados; 39,3% vs 35,2% de precisão acionável.

> "GPT-5.6 Sol anchors one end of the spectrum with **69.7% of known issues caught, but only 31.6% of its comments were worth keeping**"

> "The model **follows review instructions literally (conservative language suppresses recall)**, produces longer default output that responds to prompting rather than the effort setting, verifies its own work without being asked, and can expand task scope."

**Registro com a mesma ressalva do B.1**, mais duas observações:

1. Aqui o modelo com **maior recall é da OpenAI** (GPT-5.6 Sol, 69,7%), o que **não** casa com a nossa tabela.
2. A frase "conservative language suppresses recall" atribui o efeito à **linguagem do prompt**, não à calibração do modelo. **Isso é diretamente contraditado pelo nosso experimento (b) descartado:** inverter a instrução de "only report issues backed by concrete evidence" para "report everything including uncertain ones" **não teve efeito nenhum** no Gemini 3.7 Flash (10,5% em ambos). Ou o efeito é específico do Opus 5, ou a afirmação da CodeRabbit não generaliza.

---

# PARTE C — NOSSA INFERÊNCIA (não é fonte primária, não é evidência publicada)

> Tudo abaixo é leitura nossa sobre os nossos próprios dados. Está separado de propósito.

## C.1 O nosso dado sustenta a fronteira precisão-recall — e isso é novo

Recomputando as métricas micro a partir de `scorecards/*.json` (mesma passada, `benchmarkVersion` idêntico, judge `claude-haiku-4-5`):

| Modelo | Findings/caso | Casos com 0 findings | TP | FP | Precisão micro | Recall micro |
|---|---:|---:|---:|---:|---:|---:|
| Muse Spark 1.2 | 3,90 | 0 | 44 | 73 | 37,6% | 44,2% |
| Kimi K3 | 4,13 | 1 | 46 | 78 | 37,1% | 38,9% |
| Qwen3.8 Max | 3,57 | 1 | 50 | 57 | 46,7% | 43,2% |
| Kimi K2.7 Code | 3,73 | 2 | 54 | 58 | 48,2% | 37,9% |
| DeepSeek V4 Pro | 3,37 | 1 | 43 | 58 | 42,6% | 43,2% |
| DeepSeek V4 Flash | 3,17 | 3 | 38 | 57 | 40,0% | 34,7% |
| GPT-5.6 Luna | 1,73 | 6 | 30 | 22 | 57,7% | 29,5% |
| GPT-5.6 Terra | 1,67 | 7 | 22 | 28 | 44,0% | 22,1% |
| **Gemini 3.7 Flash** | **0,77** | **16** | 17 | 6 | **73,9%** | **11,6%** |

**Duas observações nossas:**

1. **O Gemini 3.7 Flash é, de longe, o modelo mais PRECISO do painel** (73,9% micro, contra 37–48% do bloco chinês). Ele não está errando — está **calando**. Isso é exatamente a assinatura de um ponto de operação conservador numa fronteira precisão-recall, e **não** a assinatura de incompetência. Se fosse incompetência, esperaríamos precisão baixa **e** recall baixo (é o caso do GPT-5.6 Terra: 44,0% / 22,1%).

2. **Correlação de Pearson entre findings/caso e recall micro, nos 9 modelos: r = 0,93.** O volume emitido explica quase toda a variância de recall no painel. É a mesma relação que a OpenAI documentou em 2024 (§1.1: *"the probability of catching a bug increases with the number of claims that a critique makes"*).

## C.2 Um bug de métrica no nosso próprio scorecard

O `aggregate.precisionMacro` do scorecard atribui **precisão 0** a casos em que o modelo emitiu **0 findings**. Isso faz o Gemini 3.7 Flash aparecer com `precisionMacro = 33,3%` quando a precisão micro real é **73,9%**.

**Consequência:** a métrica atual **penaliza a abstenção duas vezes** — uma no recall (correto) e outra na precisão (incorreto: não emitir nada não é emitir algo errado). Isso apaga exatamente o sinal que este ADR investiga. **Recomendação:** reportar precisão micro ao lado da macro, e contar `casos com 0 findings` como métrica de primeira classe.

## C.3 ⚠️ O nosso próprio leaderboard publicado contradiz esta passada

O `codereviewbench.com/leaderboard` publicado hoje vem de `src/lib/data/leaderboard.json` (`generatedAt: 2026-02-26T18:16:51Z`, 75 test cases, 216 traces, 8 modelos, **bugs sintéticos injetados**, juízes Sonnet + GPT):

| # | Modelo | Score | Coverage (recall) | Validity (precisão) |
|---:|---|---:|---:|---:|
| 1 | Claude Sonnet 4.5 | 87,1% | 85,0% | 89,2% |
| 2 | Gemini 2.5 Pro | 86,8% | 78,0% | 95,7% |
| 3 | Kimi K2.5 | 85,6% | 78,6% | 92,7% |
| 4 | Claude Haiku 4.5 | 85,0% | 88,8% | 81,2% |
| 5 | Gemini 3.1 Pro | 84,2% | 77,1% | 91,3% |
| 6 | **Gemini 3 Flash** | 83,9% | **77,6%** | 90,2% |
| 7 | GLM-5 | 83,8% | 71,5% | 96,0% |
| 8 | GPT-5.2 | 83,2% | 74,6% | 91,8% |

> **Gemini 3 Flash: coverage 77,6% no bench sintético vs. recall 11,6% do Gemini 3.7 Flash no bench de PRs reais.** Um fator de **6,7×** — na mesma casa, com a mesma equipe, com metodologias diferentes.
>
> Isso não é anomalia: é **exatamente** o efeito quantificado em fonte primária pelo arXiv 2606.15689 (§3.3) — *"F1 = 0.066 on real PRs, compared to F1 = 0.847 on synthetic samples, a 92% degradation"*.
>
> **Consequência para a hipótese:** antes de atribuir o baixo recall do Gemini a "calibração conservadora induzida por RL", é preciso descartar a explicação muito mais simples e já documentada: **bugs sintéticos injetados são triviais de achar e bugs reais de PR não são.** O mesmo modelo, na mesma casa, muda de 77,6% para 11,6% só trocando o dataset. Nenhuma teoria sobre RL é necessária para explicar isso.
>
> Também é obrigatório declarar o conflito de interesse: **o codereviewbench.com é propriedade da Kodus**, e a **Kodus é entrada ranqueada no benchmark da Martian** (#17 offline por F1, e #2 no online com os filtros relaxados, mas sobre apenas 68 PRs). Citar qualquer um dos dois como evidência independente exige essa linha de divulgação.

## C.4 O que a evidência primária NÃO autoriza concluir

- ❌ **Não** podemos concluir que treino de edição pass@1 causou o comportamento. **Nenhum trabalho publicado mede isso** (§1.7, §4.6).
- ❌ **Não** podemos concluir que é propriedade estável do Gemini Flash: o SecLens (§3.4) coloca o Gemini 3 Flash Preview em **primeiro lugar** num benchmark de detecção.
- ❌ **Não** podemos usar o CriticGPT como prova causal: a ablação §3.5 do próprio paper desfaz a causalidade (§1.2).
- ✅ **Podemos** dizer que a fronteira precisão-recall em code review é real, documentada em fonte primária por OpenAI (§1.3), Snyk (§3.6), Nutanix (§3.5) e SWE-PRBench (§3.2), e que o Gemini 3.7 Flash ocupa um extremo dessa fronteira no nosso harness.
- ✅ **Podemos** dizer que a OpenAI publica que o trade-off no reviewer de produção é **deliberado** (§1.3), e que orçamento extra de raciocínio melhora **calibração**, não recall — o que explica o nosso experimento (a) descartado.

---

# PARTE D — SÍNTESE

## 6. Evidência que CONTRADIZ a hipótese (destacada, conforme pedido)

Reunida num só lugar porque é mais valiosa que a confirmação.

| # | Fonte | Data | O que contradiz |
|---|---|---|---|
| 1 | **CriticGPT §3.5** — https://arxiv.org/abs/2407.00215 | 2024-06-28 | Com compute equiparado, *"CriticGPT (RL only) has both higher precision and higher recall"*. O conservadorismo do §3.4 estava confundido com redução de compute. **Contradiz o próprio §3.4 do mesmo paper.** |
| 2 | **SecLens** — https://arxiv.org/html/2604.01637v1 | 2026-04-02 | **Gemini 3 Flash Preview em 1º lugar** (49,6%) num benchmark de detecção de vulnerabilidade com 12 modelos frontier; **Qwen3-Coder em último** (37,3%). Inverso da nossa tabela. |
| 3 | **Sphinx** — https://arxiv.org/abs/2601.04252 | 2026-01-06 | Ordenação com **GPT-4.1 e Gemini 2.5 Pro no topo**, DeepSeek e Llama abaixo. Padrão "labs americanos na frente". |
| 4 | **AbstentionBench (Meta FAIR)** — https://arxiv.org/abs/2506.09038 | 2025-06-10 | *"reasoning fine-tuning degrades abstention (by 24% on average)"*. RL de raciocínio faz o modelo abster-se **menos**, não mais. |
| 5 | **DCPO** — https://arxiv.org/html/2603.09117 | 2026-05-27 | *"RLVR [...] severely suffers from calibration degeneration, where models become excessively over-confident in incorrect answers."* Confiança média sobe de ~0,88 para >0,98 pós-GRPO. Sinal oposto. |
| 6 | **Why Language Models Hallucinate (OpenAI)** — https://arxiv.org/abs/2509.04664 | 2025-09-04 | *"training and evaluation procedures reward guessing over acknowledging uncertainty"*; *"Under binary grading, abstaining is strictly sub-optimal."* A predição default é **chutar mais**, não calar. |
| 7 | **AWA-RL** — https://arxiv.org/abs/2607.10738 | 2026-07-12 | *"current training paradigms [...] predominantly reward correct answers but fail to penalize fabricated ones when retrieval fails, thereby implicitly exacerbating hallucinations."* |
| 8 | **RLCR (MIT CSAIL)** — https://arxiv.org/abs/2507.16806 | v1 2025-07-22 / v2 2026-05-15 | Adicionar Brier score à recompensa corrige a calibração **sem perda de acurácia**. "RL degrada calibração" é artefato do reward, não lei do RL. |
| 9 | **Snyk VulnBench** — https://arxiv.org/html/2606.15762v1 | 2026-06-11 | Opus **4.7** Max tem recall **maior** (71,4%) e precisão **menor** (69,6%) que Opus **4.6** Medium (68,0% / 91,5%). A geração mais nova e mais agêntica ficou **menos** conservadora. |
| 10 | **CR-Bench** — https://arxiv.org/html/2603.11078v1 | 2026-03-10 | GPT-5-mini é **anti-conservador**: *"the small model possibly suffers from a bias of not being able to disagree that more issues don't exist, and responds with noise."* |
| 11 | **Refute-or-Promote** — https://arxiv.org/abs/2604.19049 | 2026-04-21 | *"LLM-assisted defect discovery has a **precision crisis**: plausible-but-wrong reports overwhelm maintainers"*; *"ten dedicated reviewers unanimously endorsed a non-existent Bleichenbacher padding oracle in OpenSSL's CMS module"*. O modo de falha dominante em campo é **falso positivo**, não silêncio. |
| 12 | **⭐ Kimi K2 Technical Report §F.3** — https://arxiv.org/pdf/2507.20534v2 | v2 **2026-02-03** | Moonshot declara que sua rubrica de RLHF **proíbe hedging** e *"may favor responses that appear confident and assertive"*, e que *"the model may occasionally overstate certainty"*. **Um lab admitindo treinar CONTRA o conservadorismo.** |
| 13 | **⭐ Claude Opus 5 System Card** — anthropic.com | **2026-07-24** | *"Poor calibration of task scope: […] it tends to **over-engineer and over-emphasize the importance of marginal changes**"*. O lab que mais mede calibração reporta **excesso** de reporte. E: *"Claude Opus 5 identifies issues in these evaluations in **all instances**"* na eval de sinalizar falhas em código existente. |
| 14 | **GPT-5.2 System Card** — cdn.openai.com | **2025-12-11** | *"when posed with a tension between instruction following and abstention, **the model prioritized stricter instruction following**."* |
| 15 | **AACR-Bench** — https://arxiv.org/abs/2601.19494 | **2026-01-27** | Neste benchmark de review, o **GPT-5.2 tem o MAIOR recall** (47,24) e os modelos chineses são os **mais conservadores** — GLM-4.7 vence o F1 com recall ~27%. Inverso do mecanismo proposto. |
| 16 | **Nosso próprio dado (§C.1)** | 2026-08-13 | O GPT-5.6 Terra tem precisão 44,0% **e** recall 22,1% — baixo nos dois eixos. Não é conservadorismo; é capacidade. A hipótese não explica todo o painel. |
| 17 | **Nosso próprio leaderboard (§C.3)** | 2026-02-26 | Gemini 3 Flash: **coverage 77,6%** em bugs sintéticos vs. **11,6%** em PRs reais. A troca de dataset explica 6,7× sem invocar RL. |

**Conclusão desta seção:** a literatura geral de calibração/abstenção é **unânime na direção contrária** — RL pós-treino torna modelos **mais** confiantes e **menos** propensos a se abster, e dois labs (Moonshot explicitamente, Anthropic implicitamente) reportam o problema de **super**-reporte. O conservadorismo observado é específico de (a) benchmarks de detecção de segurança e (b) produtos em que o fornecedor **deliberadamente** ajustou para precisão. **Nenhuma fonte primária atribui conservadorismo em detecção a treino de edição por RL.**

---

## 7. Conclusão — o que está PROVADO e o que é HIPÓTESE

### 7.1 Provado por fonte primária

1. **O trade-off precisão-recall em code review por LLM é real, mensurado e publicado.** OpenAI (§1.1, §1.3), Anthropic com números de FPR/FNR (§2.3e), Snyk (§3.6), Nutanix (§3.5), SWE-PRBench (§3.2), Melbourne/Monash (§4.5).
2. **Volume de findings emitidos governa recall.** OpenAI, 2024: *"the probability of catching a bug increases with the number of claims that a critique makes"* (§1.1). Nosso r = 0,93 (§C.1) é a mesma relação.
3. **Pelo menos um lab ajustou deliberadamente seu reviewer de produção para menos recall e mais precisão**, e publicou isso: *"we explicitly accepted a measured tradeoff: modestly reduced recall in exchange for high signal quality"* (OpenAI Alignment, 2025-12-01, §1.3).
4. **O preço de comprar precisão está quantificado.** Anthropic, Mar/2026 (§2.3e): a segunda etapa do classificador do Claude Code auto mode derruba o FPR de **8,5% para 0,4%** (21×) e quase **triplica o FNR, de 6,6% para 17%**.
5. **Orçamento de raciocínio adicional, num reviewer, melhora principalmente calibração e reduz falsos alarmes** — não recall (OpenAI, §1.3). Isso explica o resultado (a) descartado no briefing.
6. **Modelos frontier exibem conservadorismo extremo em detecção de vulnerabilidade** — a ponto de GPT-4o e o3-mini terem recall **0** em setting whole-file (§4.5).
7. **Desempenho em edição de código não prevê desempenho em review**, e às vezes inverte dentro da mesma família (Haiku 4.5 > Sonnet 4.6, replicado em dois estudos independentes — §3.2, §3.3).
8. **Recall de ~10% nesses cinco repositórios é um ponto de operação comercializado, não um defeito.** A Graphite entrega **precisão 100,0% e recall 8,8%** no benchmark da Martian, nos mesmos repos (§3.1).
9. **A Anthropic é o único lab que trata calibração como métrica de primeira classe** e treina explicitamente para *"decline to answer when it is not confident"* (§2.3) — e, ainda assim, reporta que o Opus 5 **reporta demais**, não de menos.
10. **A Moonshot declara treinar CONTRA o hedging** (§2.6) — a rubrica de RLHF do Kimi K2 penaliza linguagem de ressalva, e o modelo *"may occasionally overstate certainty"*.
11. **`gemini-3.7-flash` tem default `thinking_level: medium`** e não suporta `minimal` (§5.1, §5.2).

### 7.2 Hipótese — NÃO provado, e o experimento nunca foi feito

**"Treinar para pass@1 em edição de código induz calibração conservadora que reduz recall em detecção" é uma HIPÓTESE SEM SUPORTE PUBLICADO.**

**NÃO ENCONTRADO** qualquer trabalho que:
- pegue um modelo base e seu descendente treinado com RL estilo SWE-bench, **e**
- avalie **ambos** num benchmark de **detecção** de bugs, **e**
- reporte o delta de recall.

O que existe e é **adjacente mas não é a mesma coisa** (não confundir):
- **Pass@1↑ / Pass@k↓ sob RLVR** — arXiv 2607.20543, 2508.10751. É colapso de **diversidade de geração**, não de recall de detecção.
- **Reward hacking em RL de código** — arXiv 2606.16062. É o verificador aceitar patch errado — a falha **oposta**.
- **Emergent Misalignment** — arXiv 2502.17424. Prova que fine-tuning estreito em código tem efeitos off-target amplos, mas o eixo medido é persona/alinhamento, **não** recall de detecção.

### 7.3 Duas explicações rivais mais simples, e melhor sustentadas

Antes de invocar RL, duas explicações mais baratas precisam ser descartadas — e nenhuma das duas foi.

**(i) Dataset, não modelo.** O nosso próprio Gemini 3 Flash faz **77,6% de coverage** em bugs sintéticos injetados e o 3.7 Flash faz **11,6% de recall** em PRs reais (§C.3). O arXiv 2606.15689 mede exatamente esse salto em fonte primária: **F1 0,847 sintético vs 0,066 real, degradação de 92%**. Bugs de PR real são muito mais difíceis, e nenhuma teoria sobre RL é necessária.

**(ii) Ponto de operação escolhido, não emergente.** A Graphite entrega precisão 100% / recall 8,8% nos **mesmos cinco repositórios** (§3.1). É um produto vendido nesse ponto. Se um humano pode escolher esse ponto de propósito, um fornecedor de modelo também pode.

### 7.4 A explicação melhor sustentada em fonte primária

A narrativa com melhor lastro primário **não é** "o RL deixou o modelo tímido". É a assimetria que a OpenAI publicou (§1.3):

> **verificadores de treino são deliberadamente over-sensitive; reviewers de deploy são deliberadamente tunados para precisão.**

Se os fornecedores estão fazendo pós-treino/ajuste de reviewer de produto no mesmo modelo servido pela API — e o post da OpenAI diz que a Codex trata *"training context-aware reviewers as a separate task in Codex training"* — então o que medimos pode ser **ponto de operação escolhido pelo fornecedor**, não emergência acidental de RL de edição. Essa hipótese é mais barata, mais bem documentada, e **igualmente não verificada** para o Gemini 3.7 Flash.

### 7.5 Consequências práticas

1. **Publicar recall sozinho é enganoso.** Nosso painel tem uma fronteira precisão-recall real (§C.1). O Gemini 3.7 Flash tem a **maior precisão do painel**. Um leaderboard de recall puro descreve isso como "pior modelo", o que é defensável só se declararmos a assimetria de custo — como a Martian faz explicitamente ao oferecer F2 (§3.1: *"missed bugs are worse than false alarms"*).
2. **Corrigir `precisionMacro`** (§C.2): hoje ele penaliza abstenção duas vezes e apaga o sinal.
3. **O teste que discrimina as hipóteses é barato:** rodar `gemini-3.7-flash` em `thinking_level: low`. Calibração conservadora prevê recall ainda menor com precisão mantida; limitação de capacidade prevê degradação nos dois eixos.
4. **Instrumentar contra o modo de falha formal do §1.5:** se alguma etapa do pipeline (judge, filtro, prompt) penalizar falso positivo, a recompensa pode subir enquanto a cobertura colapsa — *"the curve reads as improvement while coverage collapses"*.
5. **Há um buraco real na literatura** (§4.1, §7.2). Ninguém aplicou selective prediction formal a detecção de bugs por LLM, e ninguém mediu o delta de recall de detecção antes/depois de RL agêntico de edição. **É a contribuição que o codereviewbench pode reivindicar** — desde que meça o delta, não só o ranking.
6. **Risco de contaminação a declarar.** Os 5 repositórios do nosso bench (cal.com, Sentry, Grafana, Keycloak, Discourse) são **a mesma linhagem de dataset** de pelo menos quatro benchmarks públicos: Greptile (Jul/2025) → Augment (Dez/2025) → Martian offline (Fev/2026) → Tenki (Mai/2026), além do bench antigo da própria Kodus (§3.11). Após ~14 meses em circulação pública, contaminação de treino é hipótese viva e precisa constar da metodologia publicada.
7. **Reconciliar as duas passadas da casa.** O leaderboard publicado (sintético, Fev/2026) e a passada nova (PRs reais, Ago/2026) discordam por 6,7× no mesmo modelo. **Publicar a nova ordenação sem explicar a antiga é um problema de credibilidade maior do que qualquer resultado individual.**

---

## 8. NÃO ENCONTRADO — consolidado

| # | O que se procurou | Onde se procurou | Resultado |
|---|---|---|---|
| 1 | Trabalho medindo RL de edição pass@1 → delta de recall em detecção | arXiv (19 queries, §9), openai.com, alignment.openai.com, deepmind.google, anthropic.com | **NÃO ENCONTRADO** |
| 2 | Selective prediction / risk-coverage / regra de Chow aplicados a detecção de bugs por LLM ou triagem de SAST | arXiv | **NÃO ENCONTRADO** (só pré-LLM, ~2016, ou não-código) |
| 3 | Model card do Gemini 3.x mencionando calibração/abstenção/conservadorismo em detecção | Cards de Gemini 3.7 Flash, 3.6 Flash, 3.5 Flash, 3.1 Pro, 3.1 Flash-Lite, 3 Pro, 3 Flash + FSF report do 3 Pro (leitura direta dos PDFs) | **NÃO ENCONTRADO**. Só over-refusal de segurança (§2.1) |
| 4 | GPT-5.6 System Card mencionando calibração/falso positivo em código | PDF completo, busca por `calibrat`, `abstain`, `conservat`, `over-refus`, `false positive` | **NÃO ENCONTRADO** em contexto de código. Só over-refusal de segurança (§2.2) |
| 5 | Nota oficial do Gemini sobre efeito de `thinking_level` em tarefas de detecção/classificação | `ai.google.dev/gemini-api/docs/thinking`, `/gemini-3`, `/latest-model` | **NÃO ENCONTRADO**. Única menção a classificação recomenda `minimal`/`low` (§5.4) |
| 6 | Menção a falso positivo/confiança na doc do parâmetro `effort` da API da Anthropic | `platform.claude.com/docs/en/build-with-claude/effort` | **NÃO ENCONTRADO** — só gasto de tokens (§1.6a) |
| 7 | Benchmark público de review cuja ordenação replique a nossa (chineses + Meta na frente) | 12 benchmarks do §3 | **NÃO ENCONTRADO** — nenhum replica. A Meta fica em **último** onde aparece (§3.12) |
| 8 | Model card da DeepSeek V4 mencionando calibração/abstenção/FP/segurança | HF cards de V4-Pro-0813, V4-Pro, V4-Flash, V3.2 + tech report arXiv 2606.19348 | **NÃO ENCONTRADO — zero ocorrências.** O tech report do V4 é puro paper de sistemas (§2.4) |
| 9 | Technical report do Qwen3.8 / Qwen3-Max | API do arXiv, qwen.ai (via API `article/retrieval`), HuggingFace | **NÃO EXISTE** (§2.5) |
| 10 | XSTest / OR-Bench em documentos de Google, OpenAI ou Anthropic | grep com fronteira de palavra em 39 documentos | **NÃO ENCONTRADO** — XSTest só em DeepSeek-R1 e Qwen3Guard; **OR-Bench em nenhum lab** (§2.7) |
| 11 | "Selective prediction" em qualquer documento de lab | 45+ documentos dos 6 labs | **NÃO ENCONTRADO — zero ocorrências** (§2.7) |
| 12 | "code review" como avaliação comportamental em system card frontier | 16 system cards | **NÃO ENCONTRADO** — única menção incidental no GPT-5.1-Codex-Max, sobre dados de treino (§2.7, §3.10) |
| 13 | Publicação do Google DeepMind com taxa de falso positivo do Big Sleep / CodeMender | deepmind.google/blog, projectzero.google | **NÃO ENCONTRADO** — publica CVEs e incidentes, não scores. Os gráficos de pass@1 do Gemini 3.5 Flash Cyber não têm números recuperáveis (§3.10) |
| 14 | Benchmark do Aardvark / Codex Security ("golden repositories") | developers.openai.com, openai.com | **NÃO PUBLICADO** — a afirmação *"identified 92% of known and synthetically-introduced vulnerabilities"* não vem acompanhada de dataset, método ou baselines (§3.10) |
| 15 | Variante de bug-localization do SWE-bench | swebench.com (abas Verified/Multimodal/Multilingual/Lite/Full/Bash Only), Multi-SWE-bench | **NÃO ENCONTRADO** — "Success Location" é coluna diagnóstica, não track própria |
| 16 | Leaderboard de PrimeVul, SVEN, CVEfixes, BigVul, Juliet/SARD, SecBench, CyberSecEval | repos oficiais + HF | **NÃO ENCONTRADO.** Devign é o único com ranking (CodeXGLUE), congelado pré-LLM em CodeBERT 62,08 |
| 17 | Frontier Safety report do Gemini 3.7 | deepmind.google | **AINDA NÃO PUBLICADO** — o model card diz "will be published shortly" |
| 18 | Benchmark comparativo do Cursor Bugbot / Graphite Diamond | cursor.com/bugbot, /docs/bugbot, /blog/cursorbench, graphite.dev | **NÃO ENCONTRADO.** CursorBench é benchmark de **geração** de código. O changelog do Bugbot (2026-06-10) traz só um antes/depois interno: *"finds 10% more bugs per review on average — 0.62, up from 0.56"* |

**Itens marcados para verificação antes de citar em qualquer lugar externo:**
- arXiv 2605.17029 (*Task Abstention for LLMs in Code Generation*) — extração de PDF parcial, abstract não obtido verbatim.
- Números do §4.5 (SecLens) e §3.7 (AACR-Bench) vieram da renderização HTML do arXiv, não do PDF.
- arXiv 2606.15689 (*Bigger Isn't Always Better*) — **anomalia de data**: o ID do arXiv sugere Jun/2026 mas o histórico de submissão lê "Thu, 9 Apr 2026"; dataset ainda não liberado ("We plan to release…"). **Não construir afirmação de ADR sobre ele**; usar só o achado metodológico sintético-vs-real.
- SWE-PRBench (arXiv 2603.26130): **autor único, "Independent Researcher"** — a proveniência mais fraca da lista.

**Limitações de acesso declaradas:**
- `openai.com/index/*` e `help.openai.com` retornam **HTTP 403** a fetchers automatizados (Cloudflare). O post do *Codex Security research preview* e o *Introducing GPT-5.6* não puderam ser lidos diretamente; nada deles foi citado como fonte primária. Conteúdo equivalente foi obtido em `developers.openai.com` e nos PDFs de system card.
- `qwen.ai` e `codereview.withmartian.com` são SPAs client-side; contornados via API JSON pública em ambos os casos.
- `docs.claude.com/en/docs/claude-code/security-review` renderiza client-side; a variante `.md` retorna 404.

---

## 9. Onde se procurou (rastro de auditoria)

Todas as consultas em **2026-08-13**, salvo indicação.

### 9.1 Documentação de fornecedor

| Documento | URL | Data do doc | Método |
|---|---|---|---|
| Gemini API — Thinking | https://ai.google.dev/gemini-api/docs/thinking | Last updated 2026-08-13 UTC | curl + extração de tabela HTML |
| Gemini 3 Developer Guide | https://ai.google.dev/gemini-api/docs/gemini-3 | Last updated 2026-07-30 UTC | curl + extração |
| What's new in Gemini 3.7 Flash | https://ai.google.dev/gemini-api/docs/latest-model | Last updated 2026-08-13 UTC | curl + extração |
| Gemini Code Assist — Customize repo review | https://docs.cloud.google.com/gemini/docs/code-review/customize-repo-review | Last updated 2026-08-10 UTC | fetch |
| Claude Code — Code Review | https://code.claude.com/docs/en/code-review | sem data | curl (`.md`) |
| Claude Code — Model configuration | https://code.claude.com/docs/en/model-config | sem data | curl (`.md`) |
| Claude API — Effort | https://platform.claude.com/docs/en/build-with-claude/effort | sem data | fetch |
| GitHub Copilot Agents — application card | https://docs.github.com/en/copilot/responsible-use/agents | sem data | fetch |
| OpenAI Alignment — Verifying Code at Scale | https://alignment.openai.com/scaling-code-verification/ | Dec 1, 2025 | curl + extração |

### 9.2 Model cards / system cards / tech reports (45+ documentos, PDFs lidos diretamente)

**Google (9):** Gemini 3.7 Flash (*Published: August 2026*), 3.6 Flash (*Updated 21 July 2026*), 3.5 Flash, 3.1 Pro, 3.1 Flash-Lite, 3 Pro (*Nov 2025, Last Updated May 2026*), 3 Flash, Gemini 3 Pro Frontier Safety Framework report (*Nov 2025*), + cards HTML em `deepmind.google/models/model-cards/`.
**OpenAI (6):** GPT-5 System Card (2025-08-13), GPT-5-Codex (2025-09-15), GPT-5.1 + Codex-Max (2025-11-18), GPT-5.2 (2025-12-11), GPT-5.5 (2026-04-23), GPT-5.6 (2026-07-09, changelog 2026-08-03).
**Anthropic (5):** Claude Opus 4.6 (Feb 2026), Opus 4.8 (2026-05-28), Sonnet 5 (2026-06-30), Opus 5 (2026-07-24), Fable 5 / Mythos 5 (2026-06-09).
**DeepSeek (6):** HF cards de V4-Pro-0813, V4-Pro, V4-Flash, V3.2; DeepSeek-V4 Technical Report (arXiv 2606.19348); V3 Technical Report (arXiv 2412.19437); R1 (arXiv 2501.12948v2).
**Alibaba (6):** Qwen3 Technical Report (arXiv 2505.09388), Qwen3Guard Technical Report (arXiv 2510.14276), Qwen3-Coder-Next (arXiv 2603.00729), HF cards de Qwen3.8-2.4T-A95B / Qwen3.6-27B / Qwen3.5-397B-A17B, blog `qwen.ai` (34 posts via API).
**Moonshot (5):** Kimi K2 Technical Report (arXiv 2507.20534v2, `3 Feb 2026`), HF cards de Kimi-K3, K2.7-Code, K2.6, K2-Thinking, K2.5.

Método: `curl` + `pdftotext -layout` + grep case-insensitive com fronteira de palavra por `calibrat|confiden|abstain|abstention|selective predict|conservat|refus|false positive|precision|recall|hedg|uncertain|sycophan|honest|deceptio|XSTest|OR-Bench|overrefus|underreport|does not report|high confidence|code review`.

> **Nota metodológica:** sumarizadores automáticos produziram falsos "NENHUM ENCONTRADO" nos cards do Gemini; a extração direta desmentiu. Todas as afirmações de ausência nesta seção vêm de grep sobre texto extraído, não de resumo.

### 9.3 Queries de busca em arXiv

`selective prediction LLM code bug detection abstention` · `LLM static analysis false positive rate SAST triage 2025 2026` · `SWE-bench RL trained agent conservative 'no bug' recall degradation detection task` · `pass@1 reward code RL side effect degrades other capabilities` · `'code editing' OR 'patch generation' RL training hurts 'bug detection' OR 'code review' capability tension` · `SWE-bench trained coding agent evaluated on bug detection benchmark transfer degradation recall` · `'SWE-RL' OR 'agentic RL' coding model reward 'false positive' bug report penalty conservative detection recall` · `RL post-training reduces recall bug detection model reports 'no issues found' reward design agentic coding` · `reinforcement learning code review agent reward penalize false positive comments precision recall` · `RLVR calibration degradation overconfidence` · `confidence calibration large language models code generation bug detection ECE` · `'learning to abstain' OR 'selective classification' applied static analysis vulnerability detection LLM risk coverage` · `reasoning model RL training over-refusal abstention rate increases hallucination tradeoff` · `'LLM-as-a-judge' calibration conservative leniency bias code review false positives` · `benchmark LLM code review agent approves buggy pull request misses injected bug 'false negative' rate` · `Anthropic Claude security review false positives precision code vulnerability discovery` · `Google DeepMind Big Sleep vulnerability discovery false positive rate CodeMender` · `RLCR 'calibration reward' reinforcement learning improves calibration Brier score` · `arXiv 2026 benchmark LLM detect bugs pull request diffs recall leaderboard code review evaluation` · `arXiv coding agent 'no issues found' under-reporting review benchmark conservative detection`

### 9.4 Benchmarks e papers (fontes primárias, com data)

| Fonte | Link | Data |
|---|---|---|
| CriticGPT — *LLM Critics Help Catch LLM Bugs* (OpenAI) | arxiv.org/abs/2407.00215 · cdn.openai.com/llm-critics-help-catch-llm-bugs-paper.pdf | v1 2024-06-28 |
| *A Practical Approach to Verifying Code at Scale* (OpenAI Alignment) | alignment.openai.com/scaling-code-verification/ | 2025-12-01 |
| *Why Language Models Hallucinate* (OpenAI + Georgia Tech) | arxiv.org/abs/2509.04664 | v1 2025-09-04 |
| GPT-4 Technical Report | arxiv.org/abs/2303.08774 | v1 2023-03-15 |
| *Pass@k Training…* | arxiv.org/abs/2508.10751 | v1 2025-08-14 |
| *Abstention as an Action Can Kill…* | arxiv.org/abs/2608.00301 | v1 2026-07-31 |
| *Beyond Binary Rewards* (RLCR, MIT CSAIL) | arxiv.org/abs/2507.16806 | v1 2025-07-22 / v2 2026-05-15 |
| DCPO — *Resurrecting Calibration in RLVR* | arxiv.org/html/2603.09117 | v3 2026-05-27 |
| AbstentionBench (Meta FAIR) | arxiv.org/abs/2506.09038 | 2025-06-10 |
| AWA-RL — *To Answer or to Abstain* | arxiv.org/abs/2607.10738 | 2026-07-12 |
| *Calibration and Correctness of LMs for Code* | arxiv.org/abs/2402.02047 | v3 Fev/2024 |
| *Task Abstention for LLMs in Code Generation* | arxiv.org/abs/2605.17029 | 2026-05-19 |
| *Security Calibration in LLMs for Code* | arxiv.org/abs/2606.31159 | 2026-06-30 |
| *From Lab to Reality* | arxiv.org/html/2512.10485v2 | v2 2026-07-02 |
| *Sifting the Noise* | arxiv.org/html/2601.22952v1 | 2026-01-30 |
| SecLens | arxiv.org/html/2604.01637v1 | 2026-04-02 |
| *Refute-or-Promote* | arxiv.org/abs/2604.19049 | 2026-04-21 |
| *Reducing False Positives in Static Bug Detection* (Tencent) | arxiv.org/html/2601.18844v1 | 2026-01-26 |
| Martian Code Review Bench | github.com/withmartian/code-review-benchmark · codereview.withmartian.com/benchmark_dashboard.json | repo 2026-02-06, push 2026-08-08; JSON baixado 2026-08-13 |
| Martian — post metodológico | withmartian.com/post/code-review-bench-v0 | 2026-02-26 |
| SWE-PRBench | arxiv.org/abs/2603.26130 | 2026-03-27 |
| AACR-Bench (Alibaba + NJU) | arxiv.org/abs/2601.19494 · github.com/alibaba/aacr-bench | v1 2026-01-27 / v2 2026-01-29 |
| CodeFuse-CR-Bench (Ant Group) | arxiv.org/abs/2509.14856 | v3 2025-10-23 |
| SWR-Bench (Peking Univ.) | arxiv.org/abs/2509.01494 | v1 2025-09-01 / v2 2026-06-05 |
| c-CRAB (NUS + Zhejiang + SonarSource) | arxiv.org/abs/2603.23448 | v1 2026-03-24 / v3 2026-04-07 |
| CR-Bench (Nutanix) | arxiv.org/html/2603.11078v1 | 2026-03-10 |
| Snyk VulnBench JS 1.0 | arxiv.org/html/2606.15762v1 | 2026-06-11 |
| Sphinx | arxiv.org/abs/2601.04252 | 2026-01-06 |
| *Bigger Isn't Always Better* | arxiv.org/abs/2606.15689 | "9 Apr 2026" ⚠️ (ver §8) |
| CyberGym | cybergym.io · arxiv.org/abs/2506.02548 | snapshot 2026-08-13 |
| SEC-bench Pro | sec-bench.github.io · arxiv.org/abs/2605.26548 | versão `260617`, snapshot 2026-08-13 |
| VulnGym (Tencent) | github.com/Tencent/VulnGym · arxiv.org/abs/2608.02001 | 2026-08-03 — leaderboard "coming soon" |

### 9.5 Dados internos

`scorecards/*.json` (9 modelos, `benchmarkVersion` idêntico, judge `claude-haiku-4-5`, `executionMode: replay`), recomputados em 2026-08-13 para precisão micro, findings/caso, casos com 0 findings e correlação de Pearson.

---

## 10. Aviso final

Este documento é **coleta e transcrição de fontes primárias**, compilado em **2026-08-13**. As citações estão no idioma original, com link direto e data, justamente para que a leitura seja feita sobre o texto e não sobre o resumo. **Ausência de evidência não é evidência de ausência** — vários "NÃO ENCONTRADO" acima refletem um campo que simplesmente ainda não fez o experimento, não um resultado negativo.

A área muda rápido: três das fontes mais citadas aqui (CriticGPT 2024, GPT-4 Technical Report 2023, Calibration and Correctness 2024) são anteriores à geração de modelos que medimos e estão marcadas como tal no texto. Revalidar antes de qualquer uso externo.
