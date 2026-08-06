# ADR — Caminhos de acesso aos modelos no benchmark (assinatura vs. API)

**Status:** Levantamento de fontes primárias (não é decisão final, não é parecer jurídico)
**Compilado em:** 2026-08-04
**Autor:** levantamento automatizado de fontes primárias
**Escopo:** codereviewbench.com / harness de avaliação interno da Kodus

---

## 1. Contexto

O codereviewbench.com é um benchmark público que compara LLMs de múltiplos fornecedores em tarefas reais de code review de PRs. Características relevantes para a análise:

- O **harness de avaliação é interno** — roda em CI ou localmente. Nenhum usuário externo chama os modelos.
- Os **resultados são publicados publicamente**, incluindo um ranking comparativo entre modelos de fornecedores concorrentes.
- A chamada aos modelos é **programática e não interativa** (script/harness), não digitada por um humano numa interface de chat.

A pergunta prática: dá para rodar o benchmark sob **assinaturas de consumidor** (ChatGPT Plus/Pro, Claude Pro/Max) ou sob **coding plans** (Kimi, GLM), em vez de pagar API por token?

Por que o caminho de acesso importa para a credibilidade do benchmark: se o acesso viola os termos do fornecedor, (a) o resultado pode ser contestado como obtido de forma irregular, (b) as contas podem ser suspensas no meio de uma rodada, invalidando dados, e (c) um benchmark que compara fornecedores publicamente atrai escrutínio justamente desses fornecedores.

> **Aviso:** este documento é **coleta e transcrição de texto-fonte**, não aconselhamento jurídico. As cláusulas estão citadas literalmente no idioma original com tradução abaixo, para que uma pessoa humana (jurídico) decida. Todos os documentos citados mudam com frequência — as datas abaixo são parte da evidência.

---

## 2. Pergunta 1 — ACESSO AUTOMATIZADO

> As assinaturas de consumidor permitem acesso programático/automatizado fora dos apps oficiais?

### 2.1 Anthropic — Consumer Terms of Service (Claude Free/Pro/Max)

- **Link:** https://www.anthropic.com/legal/consumer-terms
- **Data do documento:** "Effective October 8, 2025"
- **Acessado em:** 2026-08-04
- **Seção:** `3. Use of our Services.` → lista "You may not access or use, or help another person to access or use, our Services in the following ways:"

Citação literal:

> "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."

Tradução: "Exceto quando você estiver acessando nossos Serviços por meio de uma Chave de API da Anthropic ou quando de outra forma permitirmos explicitamente, acessar os Serviços por meios automatizados ou não humanos, seja por bot, script ou de outra forma."

Cláusulas adjacentes da mesma lista, relevantes:

> "To crawl, scrape, or otherwise harvest data or information from our Services other than as permitted under these Terms."

Tradução: "Rastrear, extrair (scrape) ou de outra forma colher dados ou informações dos nossos Serviços de forma diversa da permitida por estes Termos."

> "To develop any products or services that compete with our Services, including to develop or train any artificial intelligence or machine learning algorithms or models or resell the Services."

Tradução: "Desenvolver quaisquer produtos ou serviços que concorram com nossos Serviços, inclusive desenvolver ou treinar quaisquer algoritmos ou modelos de inteligência artificial ou aprendizado de máquina, ou revender os Serviços."

**Leitura:** a cláusula de acesso automatizado é explícita e a exceção é nominal — **API Key** ou permissão explícita. Um harness que faz login com credenciais de assinatura e dispara chamadas por script cai na proibição, salvo se enquadrado na exceção "where we otherwise explicitly permit it" (ver Pergunta 4 sobre Claude Code/OAuth).

### 2.2 OpenAI — Terms of Use (ChatGPT Free/Plus/Pro, pessoas físicas)

- **Link:** https://openai.com/policies/row-terms-of-use/ (versão "rest of world", aplicável a usuários fora de EEA/Suíça/UK — portanto Brasil)
- **Data do documento:** "Published: January 1, 2026" / "Effective: January 1, 2026"
- **Acessado em:** 2026-08-04
- **Seção:** "What you cannot do."

Citação literal (item da lista):

> "Automatically or programmatically extract data or Output (defined below)."

Tradução: "Extrair dados ou Saídas (definidas abaixo) de forma automática ou programática."

Itens adjacentes da mesma lista:

> "Attempt to or assist anyone to reverse engineer, decompile or discover the source code or underlying components of our Services, including our models, algorithms, or systems (except to the extent this restriction is prohibited by applicable law)."

> "Interfere with or disrupt our Services, including circumvent any rate limits or restrictions or bypass any protective measures or safety mitigations we put on our Services."

> "Use Output to develop models that compete with OpenAI."

Traduções, na ordem: "Tentar, ou auxiliar alguém a, fazer engenharia reversa, descompilar ou descobrir o código-fonte ou componentes subjacentes dos nossos Serviços, incluindo nossos modelos, algoritmos ou sistemas (exceto na medida em que esta restrição seja proibida pela lei aplicável)." / "Interferir ou perturbar nossos Serviços, inclusive contornar quaisquer limites de taxa ou restrições, ou burlar quaisquer medidas de proteção ou mitigações de segurança que colocamos em nossos Serviços." / "Usar Saídas para desenvolver modelos que concorram com a OpenAI."

**Nota importante sobre o texto da OpenAI:** a OpenAI **não** usa a formulação "acessar os Serviços por meios que não as interfaces que fornecemos" na versão vigente destes Termos de Uso. A proibição vigente é mais estreita e mira a **extração automática/programática de dados ou Output** — não o mero uso automatizado. Formulações do tipo "other than through the interfaces we provide" **NÃO FORAM ENCONTRADAS** nos Terms of Use (ROW, jan/2026), no Services Agreement (jan/2026) nem nas Usage Policies (out/2025) conforme consultados em 2026-08-04.

**Ambiguidade a registrar:** um harness de benchmark que envia prompts e **coleta as saídas de forma programática para armazenar, ranquear e publicar** pode ser lido como "programmatically extract ... Output". Uma leitura mais restritiva diria que a cláusula visa raspagem em massa/exfiltração, não uso legítimo do produto. O texto não resolve isso. Ambas as leituras são defensáveis a partir da mesma frase.

---

## 3. Pergunta 2 — BENCHMARKING

> Existe cláusula restringindo a publicação de comparações de desempenho / benchmarks?

Foram verificados **cinco documentos distintos**, buscando os termos `benchmark`, `compare/comparison`, `performance`, `publish`, `prior written consent`:

| Documento | Link | Data | Cláusula de benchmark? |
|---|---|---|---|
| OpenAI Terms of Use (consumidor, ROW) | https://openai.com/policies/row-terms-of-use/ | Effective January 1, 2026 | **NÃO ENCONTRADO** |
| OpenAI Services Agreement (comercial/API/Enterprise) | https://openai.com/policies/services-agreement/ | Updated: December 1, 2025 / Effective: January 1, 2026 | **NÃO ENCONTRADO** |
| OpenAI Service Terms | https://openai.com/policies/service-terms/ | Updated: June 12, 2026 | **NÃO ENCONTRADO** |
| OpenAI Usage Policies | https://openai.com/policies/usage-policies/ | Effective: October 29, 2025 | **NÃO ENCONTRADO** |
| Anthropic Consumer Terms | https://www.anthropic.com/legal/consumer-terms | Effective October 8, 2025 | **NÃO ENCONTRADO** |
| Anthropic Commercial Terms | https://www.anthropic.com/legal/commercial-terms | Effective June 17, 2025 | **NÃO ENCONTRADO** |
| Anthropic Usage Policy (AUP) | https://www.anthropic.com/legal/aup | Effective September 15, 2025 | **NÃO ENCONTRADO** |

Todos acessados em 2026-08-04. Onde procurei: busca textual por `benchmark`, `compar`, `publish`, `evaluat`, `prior written consent` no texto integral renderizado de cada página.

**Conclusão desta pergunta: NENHUM dos dois fornecedores tem, hoje, cláusula de "no benchmarking without prior consent".** A cláusula histórica desse tipo (que existiu em termos de beta/preview de vários fornecedores) **não aparece** nas versões vigentes acima.

O que existe, e que é o análogo mais próximo — mas **não** é a mesma coisa:

**OpenAI Services Agreement, §3.3 (Restrictions):**

> "3.3. Restrictions. Customer will not, and will not permit End Users to: (a) use the Services or Customer Content in a way that violates applicable laws or OpenAI Policies; (b) use the Services or Customer Content in a way that violates third parties' rights; (c) allow minors to use OpenAI Services without consent from their parent or guardian; (d) Reverse Engineer any aspect of the Services or the systems used to provide the Services; (e) except for a Permitted Exception, use Output to develop artificial intelligence models that compete with OpenAI's products and services; (f) extract data from the Services other than as permitted through the Services; (g) buy, sell, or transfer API keys from, to, or with a third party; (h) interfere with or disrupt the Services, including circumvent any rate limits or restrictions or bypass any protective measures or safety mitigations for the Services;"

Tradução (itens relevantes): "(d) fazer Engenharia Reversa de qualquer aspecto dos Serviços ou dos sistemas usados para prestá-los; (e) exceto por uma Exceção Permitida, usar Saídas para desenvolver modelos de inteligência artificial que concorram com produtos e serviços da OpenAI; (f) extrair dados dos Serviços de forma diversa da permitida por meio dos Serviços; (h) interferir ou perturbar os Serviços, inclusive contornar limites de taxa..."

Note que o mesmo Services Agreement define "Reverse Engineer" de forma ampla, incluindo *model extraction*:

> "'Reverse Engineer' means reverse assemble, reverse compile, decompile, translate, engage in model extraction or stealing attacks, or otherwise attempt to discover the source code or underlying components of the Services, algorithms, and systems of the Services (except to the extent these restrictions are contrary to applicable law)."

Tradução: "'Engenharia Reversa' significa desmontar, descompilar, traduzir, praticar extração de modelo ou ataques de roubo (de modelo), ou de outra forma tentar descobrir o código-fonte ou componentes subjacentes dos Serviços, algoritmos e sistemas dos Serviços (exceto na medida em que estas restrições sejam contrárias à lei aplicável)."

**Anthropic Commercial Terms, §D.4 (Use Restrictions):**

> "D.4. Use Restrictions. Customer may not and must not attempt to (a) access the Services to build a competing product or service, including to train competing AI models or resell the Services except as expressly approved by Anthropic; (b) reverse engineer or duplicate the Services; or (c) support any third party's attempt at any of the conduct restricted in this sentence."

Tradução: "D.4. Restrições de Uso. O Cliente não pode, nem pode tentar, (a) acessar os Serviços para construir um produto ou serviço concorrente, inclusive para treinar modelos de IA concorrentes ou revender os Serviços, exceto conforme expressamente aprovado pela Anthropic; (b) fazer engenharia reversa ou duplicar os Serviços; ou (c) apoiar a tentativa de terceiros em qualquer das condutas restringidas nesta frase."

**Observação sobre a Kodus:** as cláusulas (e) da OpenAI e (a) da Anthropic falam de **usar Output para desenvolver/treinar modelos concorrentes** e de **construir produto concorrente**. Publicar um ranking comparativo não é, pelo texto, "desenvolver um modelo concorrente". Mas a Kodus é uma empresa de code review com IA — se o benchmark alimentar decisões de produto de um serviço que compete com os fornecedores avaliados, a leitura fica menos confortável. Registro isso como **ponto para o jurídico**, não como conclusão.

---

## 4. Pergunta 3 — USO INTERNO vs. SAÍDA PÚBLICA

> Os termos distinguem *quem chama o modelo* de *o que se faz com a saída*?

**Resposta curta: os termos distinguem sim as duas coisas — mas as cláusulas que barram este caso estão do lado de "quem chama", não do lado de "o que se publica". O argumento de "uso interno" não ajuda.**

Evidência:

**(a) Restrições de acesso são escritas sobre o ATO DE ACESSAR, sem qualquer qualificador de destino da saída.** Reveja a cláusula da Anthropic:

> "...to access the Services through automated or non-human means, whether through a bot, script, or otherwise."

Não há "for the purpose of...", não há exceção para uso interno, não há exceção para uso pessoal. O gatilho é o **meio de acesso**. Se o harness é um script, a cláusula é acionada — independentemente de os resultados serem privados ou publicados.

**(b) Restrições sobre a saída existem e são separadas** — Anthropic Consumer Terms, §4 (Inputs, Outputs, Actions, and Materials):

> "Subject to your compliance with our Terms, we assign to you all of our right, title, and interest—if any—in Outputs."

Tradução: "Sujeito ao seu cumprimento dos nossos Termos, cedemos a você todo o nosso direito, título e interesse — se houver — nas Saídas."

Ou seja: a Anthropic **cede** os direitos sobre as saídas, mas condiciona isso ("Subject to your compliance with our Terms") ao cumprimento dos demais termos — incluindo a proibição de acesso automatizado. Publicar as saídas não é o problema; obtê-las por script é.

**(c) A única distinção "uso interno / pessoal" que encontrei nos termos de consumidor da Anthropic aponta na direção CONTRÁRIA ao argumento.** Consumer Terms, §2, sob "Evaluation and Additional Services":

> "In some cases, we may permit you to evaluate our Services for a limited time or with limited functionality. Use of our Services for evaluation purposes are for your personal, non-commercial use only."

Tradução: "Em alguns casos, podemos permitir que você avalie nossos Serviços por tempo limitado ou com funcionalidade limitada. O uso dos nossos Serviços para fins de avaliação é apenas para seu uso pessoal e não comercial."

**Ambiguidade a registrar:** essa cláusula está sob um cabeçalho sobre *trials/serviços adicionais* e "evaluate our Services" muito provavelmente significa "experimentar o produto", não "rodar uma avaliação/eval de modelo". Não trato isso como cláusula que proíbe evals. Mas a frase existe, tem a palavra "evaluation", e diz "personal, non-commercial use only" — um jurídico deve olhá-la, porque um benchmark corporativo publicado não é nem pessoal nem não comercial sob nenhuma leitura.

**(d) Do lado da OpenAI, a proibição também é sobre o ato:** "Automatically or programmatically extract data or Output". De novo, o gatilho é o método (automático/programático), não o destino.

**Conclusão:** a distinção "só o nosso harness chama o modelo, ninguém de fora chama" **não é reconhecida como excludente** em nenhuma das cláusulas encontradas. Ela seria relevante para cláusulas de revenda/multi-tenant (e nessas a Kodus está bem — não está revendendo acesso). Não é relevante para as cláusulas de acesso automatizado, que são as que decidem este caso.

---

## 5. Pergunta 4 — CAMINHO LEGÍTIMO

> Existe forma sancionada de usar uma assinatura para trabalho de avaliação interna?

### 5.1 Anthropic — Claude Code sob Pro/Max

Esta é a fonte mais direta e específica que encontrei em todo o levantamento.

- **Link:** https://code.claude.com/docs/en/legal-and-compliance
- **Data:** sem data de atualização publicada na página. **Acessado em 2026-08-04.**
- **Seção:** "Legal agreements" → "License", e "Usage policy" → "Acceptable use" / "Authentication and credential use"

Citações literais:

> "Your use of Claude Code is subject to:
> * Commercial Terms - for Team, Enterprise, and Claude API users
> * Consumer Terms of Service - for Free, Pro, and Max users"

Tradução: "Seu uso do Claude Code está sujeito a: Termos Comerciais — para usuários Team, Enterprise e Claude API; Termos de Serviço ao Consumidor — para usuários Free, Pro e Max."

> "Claude Code usage is subject to the Anthropic Usage Policy. **Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK.**"

Tradução: "O uso do Claude Code está sujeito à Política de Uso da Anthropic. **Os limites de uso anunciados para os planos Pro e Max pressupõem uso ordinário e individual do Claude Code e do Agent SDK.**"

> "**OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications."

Tradução: "**A autenticação OAuth** destina-se exclusivamente a compradores dos planos de assinatura Claude Free, Pro, Max, Team e Enterprise, e foi projetada para suportar o uso ordinário do Claude Code e de outras aplicações nativas da Anthropic."

> "**Developers** building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. Anthropic does not permit third-party developers to offer Claude.ai login or to route requests through Free, Pro, or Max plan credentials on behalf of their users."

Tradução: "**Desenvolvedores** que constroem produtos ou serviços que interagem com as capacidades do Claude, incluindo os que usam o Agent SDK, devem usar autenticação por chave de API via Claude Console ou provedor de nuvem suportado. A Anthropic não permite que desenvolvedores terceiros ofereçam login do Claude.ai nem roteiem requisições através de credenciais de plano Free, Pro ou Max em nome de seus usuários."

> "Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice."

Tradução: "A Anthropic se reserva o direito de tomar medidas para fazer cumprir estas restrições, e pode fazê-lo sem aviso prévio."

**Como isso responde à pergunta:**

- **O caminho sancionado existe e é:** Claude Code (ou o Agent SDK) autenticado via **OAuth** com uma assinatura Pro/Max. Tecnicamente: OAuth, não API key; CLI/aplicações nativas da Anthropic.
- **A ressalva "not for automated/eval workloads" existe, mas em forma qualitativa, não como proibição enumerada.** As duas frases-chave são "assume ordinary, individual usage" e "designed to support ordinary use". O termo que faz o trabalho é **"ordinary, individual"**.
- Um harness de benchmark que dispara N execuções em CI, em paralelo, sem humano no loop, é difícil de descrever como "ordinary, individual usage". A frase não é uma proibição explícita de evals — **a expressão "automated workload" ou "evaluation workload" NÃO FOI ENCONTRADA** nesta página nem nos Consumer Terms — mas é o padrão declarado que a Anthropic diz que vai fiscalizar.
- A frase "does not permit third-party developers to... route requests through Free, Pro, or Max plan credentials **on behalf of their users**" **não** atinge a Kodus diretamente: o benchmark não roteia requisições em nome de usuários terceiros. Esse ponto específico é a favor da Kodus.

**Leitura conflitante a registrar:** os Consumer Terms (§3) proíbem acesso "through automated or non-human means, whether through a bot, script, or otherwise" salvo via API Key **"or where we otherwise explicitly permit it"**. A página do Claude Code permite explicitamente OAuth para Claude Code sob Pro/Max — o que satisfaz a exceção. Portanto o Claude Code sob assinatura **não** viola o §3 por ser "automatizado". A restrição operante passa a ser a qualitativa: "ordinary, individual usage". Um jurídico precisa decidir se uma rodada de benchmark cabe nisso.

### 5.2 OpenAI — Codex sob assinatura ChatGPT

- **Link:** https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- **Data:** "Updated: 2 days ago" no momento do acesso → aproximadamente **2026-08-02**. Acessado em 2026-08-04.

Citação literal:

> "When you sign in to Codex using an existing ChatGPT account, the ChatGPT Terms of Use and Privacy Policy—or the corresponding online services agreement for OpenAI API and ChatGPT Enterprise, Education or Business Users—apply to data shared between Codex and ChatGPT."

Tradução: "Quando você entra no Codex usando uma conta ChatGPT existente, os Termos de Uso do ChatGPT e a Política de Privacidade — ou o acordo de serviços online correspondente para usuários da OpenAI API e do ChatGPT Enterprise, Education ou Business — aplicam-se aos dados compartilhados entre o Codex e o ChatGPT."

> "Codex is included across ChatGPT plans, including Free and Go. Usage limits vary by plan."

Tradução: "O Codex está incluído em todos os planos ChatGPT, incluindo Free e Go. Os limites de uso variam por plano."

**E — este é o achado decisivo do lado da OpenAI** — a documentação de autenticação do Codex:

- **Link:** https://learn.chatgpt.com/docs/auth (a URL antiga https://developers.openai.com/codex/auth redireciona 308 para esta)
- **Data:** sem data de atualização publicada. **Acessado em 2026-08-04.**

Citações literais:

> "Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs."

Tradução: "Use autenticação por chave de API para fluxos programáticos do Codex CLI, como jobs de CI/CD."

> "When you sign in with ChatGPT, Codex usage follows your ChatGPT workspace permissions, role-based access control (RBAC), and ChatGPT Enterprise retention and residency settings."

Tradução: "Quando você entra com o ChatGPT, o uso do Codex segue as permissões do seu workspace ChatGPT, o controle de acesso baseado em papéis (RBAC) e as configurações de retenção e residência do ChatGPT Enterprise."

> "With an API key, usage follows your API organization's retention and data-sharing settings instead."

Tradução: "Com uma chave de API, o uso segue as configurações de retenção e compartilhamento de dados da sua organização de API."

> "Use an access token when automation needs ChatGPT workspace access, ChatGPT-managed Codex entitlements, or enterprise workspace controls without a browser sign-in." / "Access tokens are intended for trusted scripts, schedulers, and private CI runners."

Tradução: "Use um token de acesso quando a automação precisar de acesso ao workspace ChatGPT, direitos do Codex gerenciados pelo ChatGPT, ou controles de workspace corporativo sem login por navegador." / "Tokens de acesso destinam-se a scripts confiáveis, agendadores e runners de CI privados."

**Como isso responde à pergunta:** a OpenAI **direciona explicitamente workloads programáticos/CI para API key**, não para o login de assinatura. Existe um caminho de *access token* ligado ao workspace ChatGPT para automação, mas o texto o enquadra em cenários corporativos (entitlements gerenciados, controles de workspace) e não em "rode seu benchmark no plano Plus". A recomendação explícita e literal para "programmatic Codex CLI workflows, such as CI/CD jobs" é **API key**.

Não é uma proibição — é uma orientação de documentação. **Uma proibição literal de rodar CI sob assinatura ChatGPT NÃO FOI ENCONTRADA.** O que existe é: (a) a cláusula "Automatically or programmatically extract data or Output" nos Terms of Use, e (b) esta orientação de doc apontando para API key.

---

## 6. Pergunta 5 — CODING PLANS

### 6.1 Moonshot / Kimi Coding Plan (`https://api.kimi.com/coding`, modelo `kimi-for-coding`)

**Fonte A — Kimi Code Community Guidelines**

- **Link:** https://www.kimi.com/code/docs/en/kimi-code/community-guidelines.html
- **Data:** **nenhuma data de publicação ou atualização exibida na página.** Acessado em **2026-08-04**.
- **Seções:** "Scope of Use" e "✧ Usage Guidelines We Need to Highlight"

Citações literais:

> "**Scope of Use** — Kimi Code subscriptions are for interactive use only. We're compatible with mainstream coding tools and agent frameworks (Kimi CLI, VS Code, Claude Code, OpenCode, OpenClaw, etc.), so you can call Kimi Code's AI capabilities from the tools you already use. For enterprise integrations, commercial services, or other platform-related inquiries, visit the Kimi Platform to explore partnership options."

Tradução: "**Escopo de Uso** — As assinaturas do Kimi Code são apenas para uso interativo. Somos compatíveis com as principais ferramentas de codificação e frameworks de agente (Kimi CLI, VS Code, Claude Code, OpenCode, OpenClaw, etc.), então você pode chamar as capacidades de IA do Kimi Code a partir das ferramentas que já usa. Para integrações corporativas, serviços comerciais ou outras questões relacionadas à plataforma, visite a Kimi Platform para explorar opções de parceria."

> "**Don't use Kimi Code for non-interactive automation** — Kimi Code subscriptions are for personal interactive use only. Using it for non-interactive purposes — such as scripted batch execution or data annotation pipelines — goes beyond normal use."

Tradução: "**Não use o Kimi Code para automação não interativa** — As assinaturas do Kimi Code são apenas para uso interativo pessoal. Usá-lo para fins não interativos — como execução em lote por script ou pipelines de anotação de dados — vai além do uso normal."

> "**Don't spoof or alter client identity information** — We rely on this information to maintain service quality and security. Impersonating or masking your client identity can make your requests behave unpredictably from the platform's perspective."

Tradução: "**Não falsifique nem altere informações de identidade do cliente** — Dependemos dessas informações para manter a qualidade e a segurança do serviço. Personificar ou mascarar sua identidade de cliente pode fazer suas requisições se comportarem de forma imprevisível da perspectiva da plataforma."

> "**Don't resell Kimi Code's capabilities as a service** — Using Kimi Code to support your own work is completely fine. Repackaging it as a product to sell to others bypasses our pricing and service structure — and isn't fair to users who play by the rules."

Tradução: "**Não revenda as capacidades do Kimi Code como serviço** — Usar o Kimi Code para apoiar seu próprio trabalho é completamente aceitável. Reempacotá-lo como produto para vender a outros contorna nossa estrutura de preços e serviço — e não é justo com os usuários que seguem as regras."

> "If your usage doesn't align with the guidelines above, we'll review the situation first and take appropriate action—such as suspending access—based on the severity."

Tradução: "Se o seu uso não estiver alinhado com as diretrizes acima, primeiro revisaremos a situação e tomaremos a ação apropriada — como suspender o acesso — com base na severidade."

**Este é o achado mais claramente bloqueante de todo o levantamento.** "Scripted batch execution" é uma descrição literalmente exata do que um harness de benchmark faz. E "Don't spoof or alter client identity information" fecha a saída de emergência de fingir ser o Kimi CLI via User-Agent.

**Fonte B — Terms of Service for Kimi OpenPlatform (API paga, documento diferente)**

- **Link:** https://platform.kimi.ai/docs/agreement/modeluse
- **Data:** "Last Updated: July 30th, 2026". Acessado em 2026-08-04.
- **Seção:** 3.2

> "(5) For developing, serving, or creating applications, products, Services, or models that have potential competitive possibilities with the Services without authorization."

Tradução: "(5) Para desenvolver, servir ou criar aplicações, produtos, Serviços ou modelos que tenham potenciais possibilidades competitivas com os Serviços, sem autorização."

> "(4) Reverse engineering, decompiling, disassembling, translating, or otherwise attempting to discover the source code, models, algorithms, or underlying components of this Services' system."

Tradução: "(4) Fazer engenharia reversa, descompilar, desmontar, traduzir ou de outra forma tentar descobrir o código-fonte, modelos, algoritmos ou componentes subjacentes do sistema deste Serviço."

**Cláusula de benchmarking neste documento: NÃO ENCONTRADO.** Busquei por `benchmark`, `评测`, `基准`, `compare` no texto integral.

**Conclusão Kimi:** a **API paga por token** (platform.kimi.ai) não proíbe benchmark. O **Coding Plan por assinatura** proíbe explicitamente execução em lote por script.

### 6.2 Z.ai — GLM Coding Plan

- **Link:** https://docs.z.ai/legal-agreement/subscription-terms (título: "Subscriptions, Fees, and Payment")
- **Data:** **nenhuma data de vigência ou atualização exibida na página.** Acessado em **2026-08-04**.
- **Seção:** `4. Usage Rules` → subseções "Usage Scenario Restrictions" e "Personal-Use Only"

Citações literais:

> "**Usage Scenario Restrictions** — You understand and agree that the usage quota under GLM Coding Plan is only used within officially supported tools. If the system detects usage through unauthorized or unsupported tools (such as SDK-based access or other third-party integrations), some subscription benefits may be restricted to ensure fairness and service stability."

Tradução: "**Restrições de Cenário de Uso** — Você entende e concorda que a cota de uso sob o GLM Coding Plan é usada apenas dentro de ferramentas oficialmente suportadas. Se o sistema detectar uso através de ferramentas não autorizadas ou não suportadas (como acesso via SDK ou outras integrações de terceiros), alguns benefícios da assinatura podem ser restringidos para garantir justiça e estabilidade do serviço."

> "You shall not use the GLM Coding Plan quota for general-purpose API access or any scenarios outside such tools, including but not limited to directly invoking model APIs from your own applications, bots, websites, SaaS products or other systems, unless you have entered into a separate written agreement with Z.ai."

Tradução: "Você não deverá usar a cota do GLM Coding Plan para acesso a API de propósito geral ou quaisquer cenários fora de tais ferramentas, incluindo mas não se limitando a invocar diretamente APIs de modelo a partir de suas próprias aplicações, bots, sites, produtos SaaS ou outros sistemas, a menos que você tenha celebrado um acordo escrito separado com a Z.ai."

> "Unless otherwise agreed in writing, you may not resell, sub-resell, repackage, aggregate, proxy or otherwise provide the GLM Coding Plan to any third party, whether on a paid or free basis, nor may you use the GLM Coding Plan to provide model capabilities as a service to third parties."

Tradução: "Salvo acordo escrito em contrário, você não pode revender, sub-revender, reempacotar, agregar, atuar como proxy ou de outra forma fornecer o GLM Coding Plan a qualquer terceiro, seja de forma paga ou gratuita, nem pode usar o GLM Coding Plan para fornecer capacidades de modelo como serviço a terceiros."

> "**Personal-Use Only** — The GLM Coding Plan subscription is tied to a single account and is licensed only to the individual natural person associated with such account."

Tradução: "**Apenas Uso Pessoal** — A assinatura do GLM Coding Plan está vinculada a uma única conta e é licenciada apenas à pessoa natural individual associada a tal conta."

> "If Z.ai reasonably suspects that you are engaging in account sharing, bulk or automated usage on behalf of others, resale of access, or any other conduct that may harm the platform's fair-use order or the legitimate rights and interests of third parties, Z.ai is entitled to take measures including, without limitation, restricting certain features, reducing or limiting your usage quota, suspending or terminating the service, reclaiming any remaining quota, and pursuing further liability in accordance with this Agreement and applicable laws."

Tradução: "Se a Z.ai razoavelmente suspeitar que você está praticando compartilhamento de conta, uso em massa ou automatizado em nome de outros, revenda de acesso, ou qualquer outra conduta que possa prejudicar a ordem de uso justo da plataforma ou os direitos e interesses legítimos de terceiros, a Z.ai tem o direito de tomar medidas incluindo, sem limitação, restringir certas funcionalidades, reduzir ou limitar sua cota de uso, suspender ou encerrar o serviço, reaver qualquer cota remanescente e buscar responsabilização adicional conforme este Acordo e as leis aplicáveis."

**Cláusula de benchmarking: NÃO ENCONTRADO** neste documento.

**Leitura:** duas cláusulas bloqueiam o uso no harness, e uma tem uma nuance importante.

1. "only used within officially supported tools" + "You shall not use the GLM Coding Plan quota for general-purpose API access ... including ... directly invoking model APIs from your own applications" — um harness que chama o endpoint diretamente **é exatamente** "directly invoking model APIs from your own applications". Bloqueio direto e literal.
2. "licensed only to the individual natural person" — uma conta de assinatura usada por uma organização/CI já está fora do escopo da licença pelo texto.
3. **Nuance:** a cláusula de "bulk or automated usage" tem o qualificador **"on behalf of others"**. Lida estritamente, uso automatizado em benefício próprio não estaria coberto por *essa* frase. Mas a cláusula 1 (acima) não tem esse qualificador e já basta para bloquear.

---

## 7. Quadro-resumo

| Fornecedor | Caminho | Permitido para este benchmark? | Cláusula que decide | Doc + data |
|---|---|---|---|---|
| **Anthropic** | Claude Pro/Max via script próprio (não Claude Code) | **NÃO** | "to access the Services through automated or non-human means, whether through a bot, script, or otherwise" (§3) | Consumer ToS, Effective 2025-10-08 |
| **Anthropic** | Claude Pro/Max via **Claude Code (OAuth)** | **INCERTO — provável não** | Satisfaz a exceção "where we otherwise explicitly permit it", mas: "Advertised usage limits for Pro and Max plans assume **ordinary, individual usage**" e OAuth "designed to support **ordinary use**" | code.claude.com legal-and-compliance, sem data, acesso 2026-08-04 |
| **Anthropic** | API key (Console / Bedrock / Vertex) | **SIM** | Exceção explícita no §3 dos Consumer ToS; Commercial Terms §D.4 não proíbe benchmark | Commercial ToS, Effective 2025-06-17 |
| **OpenAI** | ChatGPT Plus/Pro via script próprio | **NÃO / muito arriscado** | "Automatically or programmatically extract data or Output" ("What you cannot do") | ToU (ROW), Effective 2026-01-01 |
| **OpenAI** | Codex CLI sob assinatura ChatGPT | **INCERTO — desaconselhado pela própria doc** | "Use **API key** authentication for programmatic Codex CLI workflows, such as CI/CD jobs" | learn.chatgpt.com/docs/auth, sem data, acesso 2026-08-04 |
| **OpenAI** | API key (platform) | **SIM** | Services Agreement §3.3 não proíbe benchmark; nenhuma cláusula de benchmark em 4 documentos | Services Agreement, Effective 2026-01-01 |
| **Moonshot / Kimi** | **Coding Plan** (`api.kimi.com/coding`) | **NÃO — bloqueio explícito** | "Kimi Code subscriptions are for **personal interactive use only**. Using it for non-interactive purposes — such as **scripted batch execution**... goes beyond normal use." | Kimi Code Community Guidelines, sem data, acesso 2026-08-04 |
| **Moonshot / Kimi** | API paga (platform.kimi.ai) | **SIM** | Nenhuma cláusula de benchmark; §3.2(5) só veda produtos/modelos concorrentes | ToS Kimi OpenPlatform, Last Updated 2026-07-30 |
| **Z.ai** | **GLM Coding Plan** | **NÃO — bloqueio explícito** | "You shall not use the GLM Coding Plan quota for general-purpose API access ... including ... **directly invoking model APIs from your own applications**" + "licensed only to the individual natural person" | Z.ai Subscription Terms §4, sem data, acesso 2026-08-04 |
| **Z.ai** | API paga (z.ai / open.bigmodel.cn) | **NÃO VERIFICADO** | — | ver §8 |

**Nenhum dos quatro fornecedores proíbe publicar benchmarks.** O que bloqueia é o **caminho de acesso**, não a publicação dos resultados.

---

## 8. Questões em aberto / NÃO ENCONTRADO

1. **Cláusula "no benchmarking without prior consent": NÃO ENCONTRADO** em nenhum dos 7 documentos OpenAI/Anthropic listados na tabela do §3, nem nos 2 documentos Kimi, nem nos termos de assinatura da Z.ai. Onde procurei: busca textual por `benchmark`, `compar`, `publish`, `evaluat`, `prior written consent` no texto renderizado integral de cada página, em 2026-08-04.

2. **Formulação "other than through the interfaces we provide": NÃO ENCONTRADO** nos Terms of Use da OpenAI (ROW, jan/2026). A tarefa presumia essa formulação; ela não consta da versão vigente. A cláusula equivalente é a de extração automática/programática.

3. **Anthropic — "Supplemental Terms for Claude Code": NÃO ENCONTRADO** como documento autônomo. `https://www.anthropic.com/legal/claude-code-supplemental-terms` retorna **404**. A página de compliance do Claude Code aponta diretamente para os Consumer Terms e Commercial Terms, sem termos suplementares próprios. Se esse documento existiu, não está nessa URL em 2026-08-04.

4. **Datas ausentes.** Três das fontes mais decisivas **não publicam data de vigência ou atualização**: a página de legal-and-compliance do Claude Code, as Kimi Code Community Guidelines e os Subscription Terms da Z.ai. Para essas, a única data auditável é a de acesso (**2026-08-04**). Isso é uma fraqueza real da evidência — recomendo salvar snapshots (WARC / archive.org) antes de tomar a decisão.

5. **Z.ai — termos de API paga: NÃO VERIFICADO.** Só os termos de assinatura (subscription-terms) foram consultados. Os termos gerais de API da Z.ai / Zhipu (incluindo a plataforma chinesa open.bigmodel.cn) não foram lidos e podem ter cláusulas diferentes, inclusive sobre benchmark. **Pendência.**

6. **Definição de "ordinary, individual usage" (Anthropic): sem definição nos termos.** É o critério que decide o caso do Claude Code sob Max, e não há definição, limite numérico ou exemplo em nenhum documento consultado. Só uma consulta direta à Anthropic resolve.

7. **"Permitted Exception" (OpenAI Services Agreement §3.3(e)):** o termo é usado e definido em algum ponto do documento; não extraí a definição. Pode ser relevante se algum dia o benchmark alimentar desenvolvimento de modelo. **Pendência menor.**

8. **Termos EEA/UK da OpenAI não consultados.** Foi usada a versão ROW, aplicável ao Brasil. Se houver operação ou contratação por entidade europeia, o documento aplicável é outro (https://openai.com/policies/eu-terms-of-use/ ou equivalente).

9. **Ambiguidade não resolvida (registrada, não decidida):** "Automatically or programmatically extract data or Output" — leitura ampla (qualquer coleta programática de saída, o que inclui o harness) vs. leitura estreita (raspagem em massa/exfiltração, o que não inclui). Ambas as leituras cabem no texto. Não escolhi uma.

10. **Ambiguidade não resolvida:** Anthropic Consumer Terms §2, "Use of our Services for evaluation purposes are for your personal, non-commercial use only." — contexto indica trial de produto, não eval de modelo, mas a palavra "evaluation" está lá.

---

## 9. Onde procurei (rastro de auditoria)

Todas as consultas em **2026-08-04**.

| Documento | URL | Data do doc | Método |
|---|---|---|---|
| OpenAI Terms of Use (ROW) | https://openai.com/policies/row-terms-of-use/ | Effective 2026-01-01 | navegador headless (403 para fetchers HTTP simples) |
| OpenAI Services Agreement | https://openai.com/policies/services-agreement/ | Updated 2025-12-01 / Effective 2026-01-01 | navegador headless |
| OpenAI Service Terms | https://openai.com/policies/service-terms/ | Updated 2026-06-12 | navegador headless |
| OpenAI Usage Policies | https://openai.com/policies/usage-policies/ | Effective 2025-10-29 | navegador headless |
| OpenAI Help — Codex com plano ChatGPT | https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan | "Updated: 2 days ago" (~2026-08-02) | navegador headless |
| OpenAI/Codex — Authentication | https://learn.chatgpt.com/docs/auth | sem data | fetch (redirect 308 de developers.openai.com/codex/auth) |
| Anthropic Consumer ToS | https://www.anthropic.com/legal/consumer-terms | Effective 2025-10-08 | curl + extração de texto |
| Anthropic Commercial ToS | https://www.anthropic.com/legal/commercial-terms | Effective 2025-06-17 | curl + extração de texto |
| Anthropic Usage Policy (AUP) | https://www.anthropic.com/legal/aup | Effective 2025-09-15 | curl + extração de texto |
| Claude Code — Legal and compliance | https://code.claude.com/docs/en/legal-and-compliance | sem data | fetch |
| Anthropic Claude Code Supplemental Terms | https://www.anthropic.com/legal/claude-code-supplemental-terms | — | **404 — não existe nessa URL** |
| Kimi Code Community Guidelines | https://www.kimi.com/code/docs/en/kimi-code/community-guidelines.html | sem data | curl + extração de texto |
| Kimi OpenPlatform ToS | https://platform.kimi.ai/docs/agreement/modeluse | Last Updated 2026-07-30 | curl + extração de texto |
| Z.ai Subscription Terms | https://docs.z.ai/legal-agreement/subscription-terms | sem data | curl + extração de texto |

---

## 10. Aviso final

Este documento é **coleta e transcrição de fontes primárias**, compilado em **2026-08-04**. Não constitui aconselhamento jurídico e não substitui a análise do jurídico da Kodus. As cláusulas foram citadas literalmente e datadas justamente para que a decisão seja tomada sobre o texto, não sobre um resumo. Onde uma cláusula não foi encontrada, está registrado "NÃO ENCONTRADO" junto com o local da busca — ausência de proibição no texto **não** é o mesmo que permissão.

Todos os documentos citados mudam sem aviso. Antes de decidir, recomenda-se arquivar snapshots das URLs acima.

---

# ADENDO — 2026-08-04 · Pergunta 6: uma assinatura de consumidor pode render uma CREDENCIAL BRUTA para um harness próprio?

**Status:** levantamento de fontes primárias (adendo ao documento acima; não contradiz nem substitui as seções 1–10)
**Compilado em:** 2026-08-04
**Escopo da pergunta:** o benchmark da Kodus roda no **harness próprio** (`runAgentLoopViaCore`, o motor de review de produção). Rodar *dentro* do Claude Code / Codex mede o agente do fornecedor e é inútil para o benchmark. A pergunta é estreita: **uma assinatura Claude Max/Pro ou ChatGPT Plus/Pro produz um token que o harness da Kodus possa enviar direto para `/v1/messages` ou `/v1/chat/completions`?**

> **Três coisas diferentes, separadas em todo o adendo:** (a) o que é **tecnicamente possível**; (b) o que o fornecedor **documenta como suportado**; (c) o que os **termos permitem**. Um "sim" em (a) não é "sim" em (b) nem em (c).

---

## 11. Anthropic

### 11.1 Resposta curta

**NÃO — para o caso da Kodus, uma assinatura Claude Max/Pro não produz credencial de API utilizável por harness arbitrário de forma sancionada.**

Resumindo as três dimensões:

| Dimensão | Resposta |
|---|---|
| Tecnicamente possível? | **Parcialmente sim, mas só fingindo ser o Claude Code** (ver §11.4) |
| Documentado como suportado? | **NÃO** — a doc diz que o token OAuth "can only make model requests" no contexto do Claude Code; nenhuma doc descreve uso contra a Messages API por cliente terceiro |
| Termos permitem? | **NÃO** — `code.claude.com/docs/en/legal-and-compliance` (já citado no §5.1 acima): OAuth "is designed to support ordinary use of Claude Code and other native Anthropic applications" |

### 11.2 O CLI `ant` NÃO é o caminho da assinatura — ele é Console/API

Este é o ponto que desfaz a premissa da pergunta. O `ant auth login` **não** loga numa assinatura de consumidor.

- **Link:** https://platform.claude.com/docs/en/cli-sdks-libraries/cli/authentication
- **Data:** sem data de atualização publicada. **Acessado em 2026-08-04.**

Citações literais:

> "`ant auth login` lets you call the API without creating or managing an API key. It opens a browser-based OAuth flow **against the Claude Console** and stores the resulting credentials under `$ANTHROPIC_CONFIG_DIR`"

> "During the browser flow, you select an **organization** and then a [**workspace**](/docs/en/manage-claude/workspaces). The issued token is scoped to that workspace, so the CLI can only see resources that belong to it."

> "Interactive login is intended for local development and scripting on your own machine. For non-interactive workloads such as **CI, servers, and containers, use Workload Identity Federation instead**."

Tradução: "`ant auth login` permite chamar a API sem criar ou gerenciar uma chave de API. Ele abre um fluxo OAuth de navegador **contra o Claude Console** e armazena as credenciais em `$ANTHROPIC_CONFIG_DIR`." / "Durante o fluxo de navegador, você seleciona uma **organização** e depois um **workspace**. O token emitido é escopado a esse workspace..." / "O login interativo é destinado a desenvolvimento local e scripting na sua própria máquina. Para workloads não interativos como **CI, servidores e contêineres, use Workload Identity Federation**."

E a página de autenticação da Claude API confirma que só existem dois caminhos para a API:

- **Link:** https://platform.claude.com/docs/en/manage-claude/authentication — acessado 2026-08-04, sem data publicada.

> "The Claude API supports **two** ways to authenticate requests: [API key] Static `sk-ant-api...` secret in the `x-api-key` header ... [Workload Identity Federation] Short-lived bearer token exchanged from your identity provider's identity token"

Tradução: "A Claude API suporta **duas** formas de autenticar requisições: [chave de API] segredo estático `sk-ant-api...` no header `x-api-key` ... [Workload Identity Federation] token bearer de curta duração trocado a partir do token de identidade do seu provedor de identidade."

**Leitura:** o perfil OAuth em `~/.config/anthropic/` é lastreado por uma **organização do Claude Console (Developer Platform)**, com billing de API por token — não por uma assinatura Claude Max/Pro. O `ant auth print-credentials --access-token` imprime um token dessa organização. **Ele não converte assinatura em API.** A menção a assinatura de consumidor (Pro/Max/Team/Enterprise) **NÃO FOI ENCONTRADA** nas páginas de quickstart nem de authentication do CLI `ant` (busca por `Pro`, `Max`, `subscription`, `claude.ai` em 2026-08-04).

> **Consequência prática:** um usuário que só tem Claude Max e nenhum billing de API **não obtém token funcional por esse caminho** — não há organização de Console para selecionar. Não pude testar isso empiricamente (não tenho conta Max sem org de API); a conclusão vem do texto da doc, que descreve o fluxo como seleção de organização + workspace do Console. Registro como **inferência forte a partir do texto, não como teste**.

### 11.3 O caminho que É lastreado por assinatura: `claude setup-token` / `CLAUDE_CODE_OAUTH_TOKEN`

- **Link:** https://code.claude.com/docs/en/authentication → seção "Generate a long-lived token"
- **Data:** sem data publicada. **Acessado em 2026-08-04.**

Citações literais:

> "For CI pipelines, scripts, or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`"

> "This token **authenticates with your Claude subscription and requires a Pro, Max, Team, or Enterprise plan**. It **can only make model requests**, so it can't establish Remote Control sessions or fetch claude.ai connectors. MCP servers you configure locally still work."

Tradução: "Para pipelines de CI, scripts ou outros ambientes onde o login interativo por navegador não está disponível, gere um token OAuth de um ano com `claude setup-token`." / "Este token **autentica com sua assinatura Claude e exige um plano Pro, Max, Team ou Enterprise**. Ele **só pode fazer requisições de modelo**..."

A mesma página lista a precedência de credenciais, item 5:

> "`CLAUDE_CODE_OAUTH_TOKEN` environment variable. A long-lived OAuth token generated by `claude setup-token`. Use this for CI pipelines and scripts where browser login isn't available."

**Ou seja: existe sim um token de um ano, lastreado por assinatura Max, explicitamente pensado para CI.** Mas toda a documentação o descreve como credencial **do Claude Code**, não da Messages API. A frase "can only make model requests" está no contexto de capacidades do Claude Code (vs. Remote Control / connectors) — **não** é uma autorização para uso na Messages API por cliente terceiro. Uma afirmação de que esse token é aceito pela Messages API **NÃO FOI ENCONTRADA** em nenhuma doc da Anthropic (procurei em `code.claude.com/docs/en/authentication`, `platform.claude.com/docs/en/manage-claude/authentication`, `.../cli/authentication`, `code.claude.com/docs/en/legal-and-compliance`).

### 11.4 O que é tecnicamente possível (evidência de campo, não doc)

Duas issues no repositório oficial `anthropics/claude-code` documentam o comportamento real da API com tokens `sk-ant-oat01-*`. **São issues de usuários, não posição oficial da Anthropic** — trato como evidência técnica, não como política.

**(a) Rejeição pura — issue #28091, "[BUG] Anthropic disabled OAuth tokens for third-party apps", aberta 2026-02-24, fechada como duplicata:**

> "As of ~Feb 20 2026, OAuth workspace tokens generated via `claude setup-token` (prefix `sk-ant-oat01-*`) are rejected by the API:
> - Via `x-api-key`: `"invalid x-api-key"`
> - Via `Authorization: Bearer`: `"OAuth authentication is currently not supported."`
> This means Max/Pro subscribers paying $200/month cannot use their tokens for third-party integrations. Only console API keys (`sk-ant-api03-*`) with separate pay-per-use billing work."

**(b) Funciona SE o cliente se identificar como Claude Code — issue #40515, aberta 2026-03-29:**

> "Anthropic's Messages API silently validates the `system` field when requests are authenticated with OAuth tokens (`sk-ant-oat-*`). For all models **except Haiku**, the API requires the system prompt to begin with the exact string: `You are Claude Code, Anthropic's official CLI for Claude.`"

A issue traz curl reproduzível com os headers `anthropic-beta: claude-code-20250219,oauth-2025-04-20`, `user-agent: claude-cli/2.1.85 (external, cli)`, `x-app: cli` contra `https://api.anthropic.com/v1/messages`, e a matriz:

| Modelo | Sem a identidade Claude Code | Com a identidade |
|---|---|---|
| `claude-opus-4-6` | 400 | **200** |
| `claude-sonnet-4-6` | 400 | **200** |
| `claude-haiku-4-5-20251001` | **200** | **200** |

E a própria issue nomeia quem depende disso:

> "This undocumented requirement affects **every third-party consumer** using Claude Max OAuth tokens outside the Claude CLI: **OpenClaw** — the open-source AI gateway...; **opencode-claude-auth** — community OAuth bridge for OpenCode; **Custom integrations** — anyone using `sk-ant-oat-*` tokens with the Anthropic SDK"

**Leitura, com o cuidado devido:**

1. **Tecnicamente possível?** Sim: um token de assinatura Max chega a `/v1/messages` e retorna 200 — **desde que o harness envie o header beta `claude-code-20250219`, o user-agent `claude-cli/...` e o system prompt começando com "You are Claude Code, Anthropic's official CLI for Claude."**
2. Isso significa que o harness da Kodus teria de **se declarar Claude Code** para funcionar. Não é uma credencial neutra — é uma credencial cuja aceitação depende de o cliente se apresentar como o produto da Anthropic.
3. Isso colide frontalmente com o §5.1 deste documento: OAuth "designed to support ordinary use of Claude Code and other native Anthropic applications". E a cláusula §3 dos Consumer Terms (acesso automatizado) só é excepcionada "where we otherwise explicitly permit it" — a permissão explícita existente cobre o Claude Code, não um harness que o imita.
4. **Também sabota o próprio benchmark:** injetar o system prompt do Claude Code no começo de toda requisição contamina a medição. O benchmark deixaria de medir "o modelo X no harness da Kodus".

### 11.5 Cronologia de política (fontes secundárias — registrar como tal)

Não encontrei um post oficial da Anthropic anunciando a mudança. O que há é cobertura secundária, citada aqui **com essa ressalva explícita**:

- **Link:** https://developer.puter.com/tutorials/openai-oauth/ — "updated June 11, 2026", acessado 2026-08-04.

> "On **February 20, 2026**, Anthropic updated its terms to prohibit subscription OAuth tokens in third-party tools. On **April 4, 2026**, billing enforcement turned on: third-party traffic stopped drawing from subscription quotas and now bills as overage. From an Anthropic spokesperson: *'Using Claude subscriptions with third-party tools isn't permitted under our Terms of Service, and they put an outsized strain on our systems.'*"

Um comunicado primário da Anthropic com essa declaração **NÃO FOI ENCONTRADO** (procurei em anthropic.com/news, support.claude.com e nas páginas legais já listadas no §9). A **fonte primária equivalente** é a página `code.claude.com/docs/en/legal-and-compliance` já transcrita no §5.1, que diz o mesmo em outras palavras.

### 11.6 CI/Actions: o que a Anthropic SANCIONA explicitamente

Aqui a resposta é **SIM** — mas só para o agente da própria Anthropic.

- **Link:** https://github.com/anthropics/claude-code-action → `docs/setup.md`
- **Acessado em 2026-08-04.**

O README diz:

> "supports multiple authentication methods including Anthropic direct API (API key or workload identity federation), Amazon Bedrock, Google Vertex AI, and Microsoft Foundry."

E o `docs/setup.md` lista três métodos:

1. `ANTHROPIC_API_KEY` — chave `sk-ant-...` como GitHub secret;
2. `CLAUDE_CODE_OAUTH_TOKEN` — disponível para **"Pro and Max users"**, que podem *"generate this by running `claude setup-token` locally"*;
3. Workload Identity Federation — *"exchanging the workflow's GitHub Actions OIDC token for a short-lived Anthropic access token"*.

**Leitura:** rodar uma **assinatura Pro/Max dentro do GitHub Actions é um fluxo oficialmente documentado e suportado pela Anthropic** — via a Action oficial, executando o Claude Code. Isso responde "sim" à pergunta 4 do briefing, mas **não** ajuda a Kodus: o que roda é o agente da Anthropic, exatamente o que o benchmark precisa evitar. A credencial é sancionada *para aquele executor*, não como token genérico.

### 11.7 Existe fluxo oficial "gere uma API key a partir da sua assinatura"?

**NÃO ENCONTRADO.** Procurei em: `platform.claude.com/docs/en/manage-claude/authentication`, `.../cli/authentication`, `.../cli/quickstart`, `code.claude.com/docs/en/authentication`, `code.claude.com/docs/en/legal-and-compliance`, e por busca web por "Claude Max API key subscription". As chaves `sk-ant-api03-*` só são emitidas em `platform.claude.com/settings/keys`, que é a organização de Console com billing próprio. Assinatura claude.ai e organização de Console são sistemas de billing distintos.

---

## 12. OpenAI

### 12.1 Resposta curta

**NÃO — uma assinatura ChatGPT Plus/Pro não produz credencial usável contra `/v1/chat/completions` ou `/v1/responses` por um harness terceiro, e a documentação da OpenAI diz isso repetidamente.**

| Dimensão | Resposta |
|---|---|
| Tecnicamente possível? | **Só via proxy que imita o Codex CLI** (ver §12.4) — não é um token bruto para a Platform API |
| Documentado como suportado? | **NÃO** — "For general OpenAI API calls, continue to use Platform API keys" |
| Termos permitem? | **Não há proibição literal encontrada**; há orientação explícita em sentido contrário + a cláusula "Automatically or programmatically extract data or Output" já registrada no §2.2 |

### 12.2 ChatGPT e API continuam sendo billings separados

- **Link:** https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus — **HTTP 403 para fetchers automatizados em 2026-08-04**; não consegui transcrever o texto primário. **NÃO VERIFICADO em fonte primária.**

O que consegui confirmar em fonte primária é indireto, mas é do próprio doc de auth do Codex (§12.3): "OpenAI bills API key usage through your OpenAI Platform account at standard API rates" e "When you sign in with an API key, Codex uses standard API pricing **instead of included ChatGPT plan credits**." Os dois pools são tratados como distintos ao longo de toda a página.

### 12.3 O que o "Sign in with ChatGPT" do Codex produz — e o que a doc diz sobre usá-lo fora do Codex

- **Link:** https://developers.openai.com/codex/auth.md (redireciona 308 → https://learn.chatgpt.com/docs/auth)
- **Data:** sem data publicada. **Acessado em 2026-08-04.**

Citações literais:

> "Codex supports two ways to sign in when using OpenAI models: Sign in with ChatGPT for subscription access; Sign in with an API key for usage-based access."

> "**Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs.** Don't expose Codex execution in untrusted or public environments."

Tradução: "**Use autenticação por chave de API para fluxos programáticos do Codex CLI, como jobs de CI/CD.** Não exponha a execução do Codex em ambientes não confiáveis ou públicos."

> "Access tokens are intended for trusted scripts, schedulers, and private CI runners. **For general OpenAI API calls, continue to use Platform API keys.**"

Tradução: "Tokens de acesso destinam-se a scripts confiáveis, agendadores e runners de CI privados. **Para chamadas gerais à API da OpenAI, continue usando chaves de API da Plataforma.**"

E a página dedicada de access tokens (https://learn.chatgpt.com/docs/enterprise/access-tokens, acessada 2026-08-04, sem data):

> "Codex access tokens are ChatGPT workspace credentials **scoped to Codex permissions**. They authenticate trusted non-interactive **local** workflows, including Codex CLI and app-server-based automation, with a ChatGPT workspace identity."

> "Codex access tokens are currently supported for **ChatGPT Business and Enterprise workspaces**."

> "**Wrong credential type:** Codex access tokens are for trusted local automation through Codex CLI or an app-server client. Use Workspace Agent access tokens to trigger published ChatGPT workspace agents, and **use Platform API keys for general OpenAI API calls**."

**Sobre a citação que o briefing pediu para localizar** ("Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs"): ela está na seção **"Sign in with an API key"** da página de autenticação do Codex. **É uma recomendação, não uma proibição.** O texto não diz "você não pode usar login ChatGPT em CI"; diz qual autenticação usar para esse caso. A distinção importa e está registrada.

Há ainda uma página inteira que a OpenAI publica *sobre* manter auth de assinatura em CI:

- **Link:** https://learn.chatgpt.com/docs/auth/ci-cd-auth ("Maintain Codex account auth in CI/CD (advanced)") — acessada 2026-08-04, sem data.

> "**The right way to authenticate automation is with an API key. Use this guide only if you specifically need to run the workflow as your Codex account.**"

> "This is an advanced workflow for enterprise and other trusted private automation. **API keys are still the recommended option for most CI/CD jobs.**"

> "Treat `~/.codex/auth.json` like a password: it contains access tokens. Don't commit it, paste it into tickets, or share it in chat. **Do not use this workflow for public or open-source repositories.**"

E — decisivo para a pergunta da Kodus — o escopo declarado:

> "This guide applies to Codex-managed ChatGPT auth (`auth_mode: "chatgpt"`). **It does not apply to:** API key auth; external-token host integrations (`auth_mode: "chatgptAuthTokens"`); **generic OAuth clients outside Codex**."

Tradução: "Este guia se aplica à auth ChatGPT gerenciada pelo Codex. **Não se aplica a:** auth por chave de API; integrações de host com token externo; **clientes OAuth genéricos fora do Codex**."

**Leitura:** a OpenAI **documenta e suporta** rodar assinatura ChatGPT em CI privado — mas exclusivamente executando o **Codex**, com o `auth.json` persistido entre runs, e diz literalmente que a orientação não cobre "generic OAuth clients outside Codex". Um harness próprio da Kodus é exatamente um "generic OAuth client outside Codex".

### 12.4 O que é tecnicamente possível

O token OAuth do Codex é obtido em `https://auth.openai.com/oauth/authorize` + `.../oauth/token` (PKCE, scope `openid profile email offline_access`) e guardado em `~/.codex/auth.json`. **Ele não é uma Platform API key** e a rota que ele autentica é a do Codex, não `api.openai.com/v1/*` na forma padrão.

Fonte secundária, marcada como tal (https://developer.puter.com/tutorials/openai-oauth/, "updated June 11, 2026", acessado 2026-08-04):

> "OpenAI has several OAuth surfaces, but **none of them are designed to let a third-party app call the OpenAI API on a user's behalf**."

> "That last one is what third-party tools like OpenClaw use. They take the Codex OAuth token, **run a localhost proxy, and translate requests into the Codex CLI shape so OpenAI's auth check (which validates a Codex-specific system prompt) passes.** The user's ChatGPT subscription pays for the calls."

> "The pattern depends on **mimicking the Codex CLI request shape, including a specific system prompt that OpenAI's auth check expects**. If OpenAI changes that check, third-party tools using this approach stop working until they're updated."

> "Codex OAuth in a third-party app. ... Currently works, used by tools like OpenClaw. **Not officially supported** — Anthropic removed the equivalent on Claude in April 2026, and Google made a similar change with Gemini CLI."

**Simétrico ao caso Anthropic:** funciona, mas só imitando o cliente do fornecedor, incluindo o system prompt — o que contamina a medição e sai do que a doc cobre. Não consegui verificar a existência dessa validação de system prompt em fonte primária da OpenAI: **NÃO ENCONTRADO** em `learn.chatgpt.com/docs/auth`, `.../auth/ci-cd-auth`, `.../enterprise/access-tokens`.

### 12.5 Fluxo oficial "gere uma API key a partir da assinatura ChatGPT"?

**NÃO ENCONTRADO.** As chaves continuam vindo de `platform.openai.com/api-keys`, citado pela própria doc do Codex: "Get your API key from the OpenAI dashboard (platform.openai.com/api-keys)". Nenhuma página consultada descreve emissão de credencial de Platform API a partir de plano ChatGPT.

---

## 13. Os projetos OSS mencionados ("openclawn" e "hermes")

### 13.1 "openclawn" → **OpenClaw** (`github.com/openclaw/openclaw`, docs em `docs.openclaw.ai`)

Gateway/agente de IA open-source. É o mesmo "OpenClaw" já citado no §6.1 deste documento, dentro das Kimi Code Community Guidelines ("Kimi CLI, VS Code, Claude Code, OpenCode, **OpenClaw**, etc.").

**Mecanismo de auth** — `docs/concepts/oauth.md` (branch `main`, lido via raw.githubusercontent em 2026-08-04):

> "OpenClaw supports OAuth ("subscription auth") for providers that offer it, notably **OpenAI Codex (ChatGPT OAuth)** and **Anthropic Claude CLI reuse**. For Anthropic, the practical split is:
> - **Anthropic API key**: normal Anthropic API billing.
> - **Anthropic Claude CLI / subscription auth inside OpenClaw**: Anthropic staff told us this usage is allowed again, so OpenClaw treats Claude CLI reuse and `claude -p` usage as sanctioned for this integration unless Anthropic publishes a new policy. **For Anthropic in production, API key auth is still the safer recommended path.**"

Bloco `<Warning>` da mesma página:

> "Anthropic's public Claude Code docs say direct Claude Code use stays within Claude subscription limits, and **Anthropic staff told us OpenClaw-style Claude CLI usage is allowed again**. OpenClaw therefore treats Claude CLI reuse and `claude -p` usage as sanctioned for this integration **unless Anthropic publishes a new policy**."

E sobre a OpenAI:

> "**OpenAI Codex OAuth is explicitly supported for use outside the Codex CLI, including OpenClaw workflows.**"

Em `docs/providers/openai.md`:

> "**OpenAI explicitly supports subscription OAuth usage in external tools and workflows like OpenClaw.**"

**Ponderação obrigatória sobre essas duas últimas afirmações:** são declarações **do OpenClaw sobre o que a OpenAI/Anthropic permitiriam**, sem link para fonte do fornecedor. **Não encontrei nenhuma página da OpenAI que diga isso** — ao contrário, o guia de CI/CD da OpenAI exclui explicitamente "generic OAuth clients outside Codex" (§12.3). E a afirmação "Anthropic staff told us ... allowed again" é atribuída a uma conversa privada não publicada; a página `code.claude.com/docs/en/legal-and-compliance` continuava, em **2026-08-04**, com o texto restritivo transcrito no §5.1. **Registro como conflito de fontes não resolvido — a doc de um projeto OSS não é fonte primária sobre a política de um fornecedor.**

Note também que o caminho Anthropic preferido pelo OpenClaw é **reuso do Claude CLI local / `claude -p`** — ou seja, ele **executa o Claude Code**, não envia token bruto para a Messages API. Isso é justamente o que não serve para o benchmark da Kodus.

Menções a ToS/CI nas docs do OpenClaw além do acima: **NÃO ENCONTRADO** (busca por `terms`, `tos`, `ci`, `ban`, `policy` em `docs/concepts/oauth.md` e `docs/providers/openai.md`).

### 13.2 "hermes" → **Hermes Agent** (`github.com/NousResearch/hermes-agent`)

Agente da Nous Research. O componente relevante é o **Subscription Proxy**.

- **Link:** https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/subscription-proxy.md (também em https://hermes-agent.nousresearch.com/docs/user-guide/features/subscription-proxy) — acessado 2026-08-04.

O que a doc diz:

> "The subscription proxy is a local HTTP server that lets external apps — ... anything that speaks OpenAI-compatible chat completions — use your Hermes-managed provider subscription as their LLM endpoint."

> "Currently shipped: `nous` (Nous Portal) and `xai` (xAI / Grok)."

Endpoints expostos: `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`, `/v1/models`. Auth: OAuth do Nous Portal, refresh token em `~/.hermes/auth.json`.

Sobre extensibilidade, a doc diz que adicionar novos provedores (incluindo *"Anthropic via OAuth"*) exige implementar um `UpstreamAdapter` — ou seja, **é trabalho futuro, não algo que existe hoje**.

**Conclusão sobre o Hermes:** é exatamente o formato de credencial que a Kodus quer (endpoint OpenAI-compatible lastreado por assinatura), **mas os adapters embarcados hoje são Nous Portal e xAI — não Anthropic nem OpenAI**. Não resolve o problema da Kodus. Declarações sobre ToS ou uso em CI: **NÃO ENCONTRADO** na página.

### 13.3 Outros projetos verificados

- **`opencode`** (`github.com/anomalyco/opencode`, ex-sst/opencode): há discussão pública sobre auth por assinatura (issue #3281, "Enable User Sign-in with Codex ChatGPT Accounts via OAuth"; thread "How is Claude Pro/Max authentication implemented?"). Não aprofundei a leitura do código. **NÃO VERIFICADO em profundidade.**
- **`opencode-claude-auth`** — nomeado pela issue #40515 do `anthropics/claude-code` como "community OAuth bridge for OpenCode". Não inspecionado. **NÃO VERIFICADO.**
- **`claude-code-proxy` / `claude-code-router`** — não inspecionados nesta rodada. **NÃO VERIFICADO.**

---

## 14. Resposta direta à pergunta do adendo

| Fornecedor | Assinatura → credencial bruta para o harness da Kodus? | Base |
|---|---|---|
| **Anthropic** | **NÃO** (sancionado). Tecnicamente possível só imitando o Claude Code (header `anthropic-beta: claude-code-20250219`, UA `claude-cli/...`, system prompt "You are Claude Code, Anthropic's official CLI for Claude.") | Doc do CLI `ant` = OAuth de Console/API-org, não assinatura; `CLAUDE_CODE_OAUTH_TOKEN` é credencial do Claude Code; legal-and-compliance limita OAuth a "ordinary use of Claude Code and other native Anthropic applications"; issues #28091 / #40515 |
| **OpenAI** | **NÃO**. Token do Codex é escopado ao Codex; a doc manda usar Platform API key para chamadas gerais e exclui "generic OAuth clients outside Codex" | `learn.chatgpt.com/docs/auth`, `.../auth/ci-cd-auth`, `.../enterprise/access-tokens` |
| **Anthropic (CI oficial)** | **SIM, mas roda o Claude Code** — `CLAUDE_CODE_OAUTH_TOKEN` de Pro/Max é suportado no `anthropics/claude-code-action` | `docs/setup.md` do repo oficial |
| **OpenAI (CI oficial)** | **SIM, mas roda o Codex** — `auth.json` persistido em runner privado e confiável, desaconselhado vs. API key | `learn.chatgpt.com/docs/auth/ci-cd-auth` |

**Em uma frase:** os dois fornecedores oferecem um caminho de assinatura-em-CI, mas **os dois amarram esse caminho ao próprio agente deles** (Claude Code / Codex). Nenhum dos dois emite, hoje, uma credencial de assinatura que um harness arbitrário possa apontar para a API de inferência padrão. O que existe na prática é imitação do cliente oficial — tecnicamente funcional, não documentado, e no caso da Anthropic contrariando texto legal explícito. Para o benchmark isso é duplamente ruim, porque forçar o system prompt do cliente oficial altera o que está sendo medido.

**Não mudou nada nas conclusões das seções 1–10**: para o harness próprio, o caminho limpo continua sendo **API key** (Anthropic Console / OpenAI Platform), ou WIF no caso da Anthropic em CI.

---

## 15. Onde procurei neste adendo (rastro de auditoria)

Todas as consultas em **2026-08-04**.

| Documento | URL | Data do doc | Método |
|---|---|---|---|
| Claude API — Authentication | https://platform.claude.com/docs/en/manage-claude/authentication | sem data | fetch |
| `ant` CLI — Authentication options | https://platform.claude.com/docs/en/cli-sdks-libraries/cli/authentication | sem data | fetch |
| `ant` CLI — Quickstart | https://platform.claude.com/docs/en/cli-sdks-libraries/cli/quickstart.md | sem data | curl |
| Claude Code — Authentication | https://code.claude.com/docs/en/authentication | sem data | fetch |
| `anthropics/claude-code-action` — README + docs/setup.md | https://github.com/anthropics/claude-code-action | sem data | fetch |
| `anthropics/claude-code` issue #28091 | https://github.com/anthropics/claude-code/issues/28091 | aberta 2026-02-24 | `gh issue view` |
| `anthropics/claude-code` issue #37205 | https://github.com/anthropics/claude-code/issues/37205 | aberta 2026-03-21 | `gh issue view` |
| `anthropics/claude-code` issue #40515 | https://github.com/anthropics/claude-code/issues/40515 | aberta 2026-03-29 | `gh issue view` |
| Codex — Authentication | https://developers.openai.com/codex/auth.md → https://learn.chatgpt.com/docs/auth | sem data | curl (.md) |
| Codex — Maintain account auth in CI/CD | https://learn.chatgpt.com/docs/auth/ci-cd-auth.md | sem data | curl (.md) |
| ChatGPT Enterprise — Access tokens | https://learn.chatgpt.com/docs/enterprise/access-tokens.md | sem data | curl (.md) |
| OpenAI Help — What is ChatGPT Plus? | https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus | — | **HTTP 403 — não transcrito** |
| OpenClaw — OAuth | https://raw.githubusercontent.com/openclaw/openclaw/main/docs/concepts/oauth.md | branch `main` | curl |
| OpenClaw — OpenAI provider | https://raw.githubusercontent.com/openclaw/openclaw/main/docs/providers/openai.md | branch `main` | curl |
| Hermes Agent — Subscription Proxy | https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/subscription-proxy.md | branch `main` | fetch |
| Puter — "How to do OAuth with OpenAI" (**fonte secundária**) | https://developer.puter.com/tutorials/openai-oauth/ | updated 2026-06-11 | curl |

### Itens NÃO ENCONTRADO / NÃO VERIFICADO neste adendo

1. **Confirmação empírica de que uma conta só-Max (sem organização de API) obtém token via `ant auth login`: NÃO TESTADO.** A conclusão de §11.2 vem do texto da doc (fluxo seleciona organização + workspace do Console), não de teste.
2. **Comunicado primário da Anthropic sobre a mudança de fev/abr de 2026: NÃO ENCONTRADO.** Só cobertura secundária. A fonte primária equivalente é a página legal-and-compliance (§5.1).
3. **Validação de system prompt do lado OpenAI: NÃO ENCONTRADO** em fonte primária da OpenAI — só relato secundário e docs de projetos terceiros.
4. **Texto primário de `help.openai.com` sobre ChatGPT Plus × API: NÃO OBTIDO** (403 para fetchers em 2026-08-04).
5. **Base do OpenClaw para "OpenAI explicitly supports subscription OAuth usage in external tools": NÃO ENCONTRADA** nenhuma página da OpenAI que sustente a afirmação.
6. **`opencode`, `opencode-claude-auth`, `claude-code-proxy`, `claude-code-router`: NÃO VERIFICADOS** em profundidade.

---

# ADENDO 2 — 2026-08-04 · "Sign in with ChatGPT", declarações públicas da OpenAI e correção parcial do Adendo 1

**Status:** levantamento de fontes primárias. **Este adendo CORRIGE parcialmente o §12.1.**
**Compilado em:** 2026-08-04
**Motivo:** contestação específica do usuário — *"Sam Altman disse abertamente que dá para usar assinatura ChatGPT em projetos terceiros, e muitos projetos fazem isso."*

**Veredito antecipado: o usuário está certo quanto ao fato.** Existe endosso público, nominal e verificável da liderança da OpenAI ao uso de assinatura ChatGPT dentro de harnesses de terceiros. O que eu havia escrito no §12.1 ("NÃO") estava correto sobre **documentação técnica** e sobre **`api.openai.com`**, mas estava **incompleto e enganoso** por omitir esse endosso. Corrijo abaixo, em detalhe, e separo o que muda do que não muda para o caso da Kodus.

---

## 16. O que foi verificado

### 16.1 "Sign in with ChatGPT" — shipou, mas é IDENTIDADE, não acesso a modelo

Esta é a primeira coisa a desfazer: o mecanismo chamado "Sign in with ChatGPT" **não** é o mecanismo do qual o Altman falou.

- **Link:** https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt
- **Data:** "Updated: 4 days ago" no momento do acesso → aproximadamente **2026-07-31**. **Acessado em 2026-08-04** (via navegador headless; `curl` recebe 403).

Citações literais:

> "Sign in with ChatGPT is an **identity-provider sign-in option** that lets you use identity information from your ChatGPT account to create, link, or access an account with a supported external application."

> "Sign in with ChatGPT is available globally to authenticated ChatGPT users, including users in Enterprise organizations. It is available on OpenAI Academy and Codex Sites and is **rolling out in beta** across select plugins and partner sites. Initial participating partners include **Airtable, GitLab, HubSpot, Notion, Supabase, and Vercel**."

> "When you use Sign in with ChatGPT, the external application receives **only your name, email address, and profile picture**, if you have one."

> "Sign in with ChatGPT does not independently share: Your ChatGPT conversations or memory; Your files or **tokens**; Your **billing information** or other ChatGPT account data"

Traduções: "É uma **opção de login de provedor de identidade** que permite usar informações de identidade da sua conta ChatGPT para criar, vincular ou acessar uma conta numa aplicação externa suportada." / "Disponível globalmente... **em beta** em plugins e sites parceiros selecionados. Parceiros iniciais: Airtable, GitLab, HubSpot, Notion, Supabase e Vercel." / "A aplicação externa recebe **apenas seu nome, e-mail e foto de perfil**." / "Não compartilha independentemente: suas conversas ou memória; seus arquivos ou **tokens**; suas informações de **cobrança**."

**Status e resposta à pergunta 1:** **shipou, em beta** (~ago/2026), com parceiros nominados. **Resposta à pergunta 2: NÃO — ele não autoriza chamadas de modelo cobradas da assinatura do usuário.** É OIDC puro: nome, e-mail, foto. A doc diz explicitamente que **não** compartilha tokens nem billing. Uma menção a acesso a modelo, cota, ou cobrança na assinatura do usuário: **NÃO ENCONTRADO** nesta página.

> **Portanto: o "Sign in with ChatGPT" para desenvolvedores existe, mas NÃO é o mecanismo que faria a assinatura pagar as chamadas de um app terceiro.** Quem afirma o contrário (inclusive reportagem secundária que li) está confundindo dois produtos com nomes parecidos: o IdP "Sign in with ChatGPT" e o **OAuth do Codex** ("sign in with ChatGPT" dentro do Codex CLI).

### 16.2 A declaração do Sam Altman — VERIFICADA em fonte primária

- **Link:** https://x.com/sama/status/2050357911915028689
- **Autor:** Sam Altman, conta oficial **@sama** (CEO da OpenAI)
- **Data/hora exibidas no post:** **11:33 PM · May 1, 2026**
- **Acessado em 2026-08-04** (navegador headless; WebFetch recebe 402)

Texto integral do post, literal:

> "you can sign in to openclaw with your chatgpt account now and use your subscription there!
>
> happy lobstering."

Tradução: "você já pode entrar no openclaw com sua conta chatgpt e usar sua assinatura lá! bom lagosteio."

**O usuário está certo.** Esta é uma declaração pública, primária, do CEO da OpenAI, endossando nominalmente o uso da assinatura ChatGPT **dentro de um harness de terceiros open-source (OpenClaw)**. Não é paráfrase; é o texto integral do post, com data.

Contexto visível na thread (registro, não fonte): a resposta mais curtida ao post é *"the new meta: whatever anthropic does, just do the opposite"* (@0bytematt, 1 May 2026) — o post é de ~4 semanas depois de a Anthropic ligar a fiscalização de billing contra harnesses terceiros (4 abr 2026, §11.5). O endosso é, no mínimo, também um movimento competitivo.

### 16.3 Segunda fonte primária da OpenAI: a página do programa "Codex for Open Source"

- **Link:** https://developers.openai.com/community/codex-for-oss
- **Data:** sem data de publicação na página. **Acessada em 2026-08-04.**

Citação literal:

> "The fund now supports eligible maintainers by offering **six months of ChatGPT Pro with Codex** and conditional access to Codex Security for core maintainers with write access. **Developers should code in the tools they prefer, whether that's Codex, OpenCode, Cline, pi, OpenClaw, or something else, and this program supports that work.**"

Tradução: "O fundo agora apoia mantenedores elegíveis oferecendo **seis meses de ChatGPT Pro com Codex** e acesso condicional ao Codex Security... **Desenvolvedores devem programar nas ferramentas que preferirem, seja Codex, OpenCode, Cline, pi, OpenClaw ou outra, e este programa apoia esse trabalho.**"

**Leitura:** é a OpenAI, em domínio próprio (`developers.openai.com`), **distribuindo assinaturas ChatGPT Pro** e dizendo na mesma frase que o desenvolvedor deve usar a ferramenta que preferir, **nomeando harnesses concorrentes**. Não é um contrato nem uma cláusula de termos, mas é bem mais que um tweet: é política de programa publicada.

### 16.4 Terceira declaração citada (Tibo Sottiaux) — NÃO VERIFICADA em fonte primária

A imprensa técnica atribui a **Tibo Sottiaux** (executivo de produto da OpenAI para Codex/ChatGPT) um anúncio no mesmo sentido, incluindo o dado de que "Pi e OpenCode já representam 10% do tráfego do Codex".

- **Fonte secundária:** https://manifest.build/blog/chatgpt-plus-tokens-third-party-harnesses/ — Bruno Perez, **Jul 1, 2026**, acessado 2026-08-04.

> "A few weeks ago, **Tibo Sottiaux, an executive at OpenAI, announced that you can use your ChatGPT account (the paid OpenAI subscription that starts at $20/month with Plus) inside third-party harnesses**. He added that Pi and OpenCode, two popular open-source coding agents, already make up 10% of Codex traffic."

**O post original de Tibo NÃO FOI LOCALIZADO** — a busca no X exige login (`x.com/search` redireciona para onboarding em 2026-08-04). **Trato como reportagem secundária, não confirmada.**

O mesmo artigo (secundário) faz a leitura mais honesta que encontrei sobre o status contratual:

> "**Nothing in OpenAI's terms of use explicitly permits or prohibits** using your ChatGPT subscription inside a non-OpenAI tool. It reads like something they **tolerate**, not something they've committed to."

> "What they do say plainly is that they reserve the right to terminate your access if your use could cause risk or harm to OpenAI, its users, or anyone else."

> "**None of these statements is contractual.** But the direction is unmistakable."

Isso bate exatamente com o que o levantamento primário deste ADR encontrou nas seções 2 e 3: nem permissão nem proibição literal nos Terms of Use.

---

## 17. Recheque da questão de escopos (pergunta 5)

Os erros empíricos coletados na máquina do usuário são **reprodutíveis, conhecidos e têm explicação documentada em repositório público**:

- `/v1/models` → 403 `Missing scopes: api.model.read`
- `/v1/chat/completions` → 401/403 `Missing scopes: model.request`
- `/v1/responses` → 401 `Missing scopes: api.responses.write`

Fonte: `openclaw/openclaw` issue **#24720** ("[Bug]: OpenAI OAuth tokens missing model.request scope, all API calls rejected", aberta **2026-02-23**, fechada 2026-03-06), com curl idêntico:

> "OAuth URL requests only: `scope=openid+profile+email+offline_access`
> All completions return: `"Missing scopes: model.request"`
> Model listing returns: `"Missing scopes: api.model.read"`"

E a issue **#26801** (aberta **2026-02-25**) mostra o JWT decodificado:

> "Decoding the JWT access token shows only identity scopes were requested: `"scp": ["openid", "profile", "email", "offline_access"]`"

### 17.1 Dá para pedir escopos mais amplos? **NÃO.**

Issue **#24927** (`openclaw/openclaw`, aberta **2026-02-24**), sobre `api.responses.write`:

> "OAuth tokens from ChatGPT Pro subscription ($200/mo) only have scopes: `openid, profile, email, offline_access`. **The `api.responses.write` scope is not available via the Codex OAuth client (`app_EMoamEEZ73f0CkXaXp7hrann`). Confirmed with both browser OAuth and device-code auth flow — same scopes.**"

Os escopos são fixados no **registro do app OAuth do Codex**, do lado da OpenAI. O cliente não escolhe. **Uma forma documentada de solicitar escopos mais amplos: NÃO ENCONTRADO** (procurei em `learn.chatgpt.com/docs/auth`, `.../auth/ci-cd-auth`, `.../enterprise/access-tokens`, `developers.openai.com/api/reference/overview` e no índice `learn.chatgpt.com/llms.txt` em 2026-08-04).

**Conclusão da pergunta 5, parte A: `api.openai.com` está fechado para o token de assinatura, por desenho, e não há caminho documentado para abri-lo.** Os testes do usuário estão certos e não há truque de escopo.

### 17.2 O endpoint que FUNCIONA com o mesmo token

Mesma issue #24927, seção "Workaround":

> "Using `openai-codex-responses` provider (**chatgpt.com/backend-api**) which works with the same token"

> "**Workaround:** Use `openai-codex/gpt-5.3-codex` for sub-agents (**works via chatgpt.com/backend-api**). Main session can use `openai/gpt-5.2` normally."

Confirmado no código-fonte oficial do Codex (`github.com/openai/codex`, `main`, clonado 2026-08-04):

- `codex-rs/thread-manager-sample/src/main.rs:279` → `chatgpt_base_url: "https://chatgpt.com/backend-api/".to_string()`
- `codex-rs/agent-identity/src/lib.rs:58-59` → hosts aceitos `"https://chatgpt.com"` | `"https://chatgpt.com/backend-api"`
- `codex-rs/config/src/config_toml.rs:365` → `pub chatgpt_base_url: Option<String>` (chave de configuração pública)

**Ou seja: a rota lastreada por assinatura é `https://chatgpt.com/backend-api/...` (backend do Codex), não `api.openai.com`.** É lá que o token com escopos só-de-identidade é aceito, porque a autorização de modelo acontece do lado do backend do ChatGPT, contra a assinatura, e não pelo sistema de escopos da Platform API.

### 17.3 Sancionado ou apenas tecnicamente possível?

Preciso separar três camadas, e elas dão respostas diferentes:

| Camada | Status | Evidência |
|---|---|---|
| **Documentação técnica da OpenAI** | **NÃO documentado.** `chatgpt.com/backend-api` como endpoint para clientes terceiros: **NÃO ENCONTRADO** em nenhuma página de `learn.chatgpt.com` / `developers.openai.com`. O guia de CI/CD exclui explicitamente "generic OAuth clients outside Codex" (§12.3) | docs consultadas em 2026-08-04 |
| **Postura pública da liderança** | **ENDOSSADO, nominalmente.** Altman: "sign in to openclaw with your chatgpt account ... and use your subscription there!" (1 mai 2026). Página Codex for OSS: "Developers should code in the tools they prefer, whether that's Codex, OpenCode, Cline, pi, **OpenClaw**, or something else" | x.com/sama/status/2050357911915028689; developers.openai.com/community/codex-for-oss |
| **Termos de uso** | **Nem permite nem proíbe literalmente.** Confirmado no §3 deste ADR: a única cláusula próxima é "Automatically or programmatically extract data or Output" | ToU ROW, Effective 2026-01-01 |

**Resposta direta à pergunta 5, parte B:** o uso do token de assinatura contra `chatgpt.com/backend-api` por um cliente terceiro é **publicamente endossado pela liderança da OpenAI e não é proibido pelos termos, mas não é coberto por nenhuma documentação técnica**. Não é "meramente tecnicamente possível" — há endosso nominal. Também não é "sancionado" no sentido contratual — não há cláusula, SLA ou compromisso. É uma **tolerância declarada publicamente**, revogável sem aviso, exatamente como a Anthropic revogou a equivalente em abril de 2026.

---

## 18. A distinção que decide o caso da Kodus (pergunta 3)

Aqui é onde o endosso público **não** cobre o caso, e preciso ser explícito sobre o que é evidência e o que é ausência de evidência.

**O que o endosso cobre, pelo texto literal:** um **desenvolvedor** usando **sua** assinatura **dentro de um harness de codificação**, para **programar**. O post do Altman fala de "sign in to openclaw with **your** chatgpt account" — usuário final, no loop, usando a ferramenta. A página Codex for OSS fala de "**Developers** should **code** in the tools they prefer" — mantenedores de OSS programando.

**O caso da Kodus é diferente em três eixos:**

1. **Não há usuário final no loop.** É um harness de benchmark em CI, não-interativo.
2. **A conta é corporativa, o uso é de empresa**, não "sua conta, seu trabalho".
3. **A finalidade não é programar** — é medir e publicar um ranking comparativo entre fornecedores, incluindo a própria OpenAI.

**Uma cláusula ou frase que enderece ou exclua explicitamente esse cenário: NÃO ENCONTRADO.** Procurei em: help.openai.com/articles/20001410 (Sign in with ChatGPT), learn.chatgpt.com/docs/auth, .../auth/ci-cd-auth, .../enterprise/access-tokens, developers.openai.com/community/codex-for-oss, e no índice completo `learn.chatgpt.com/llms.txt`, em 2026-08-04. Nenhum documento diz "só para uso pessoal", nem "só com usuário no loop", nem "não para benchmark", nem o contrário.

**O que existe e é relevante, e já está transcrito acima neste ADR:**

- A orientação literal para o cenário da Kodus (programático, CI): *"Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs."* (§12.3) — **recomendação, não proibição.**
- O guia de CI/CD que se auto-exclui: *"It does not apply to: ... generic OAuth clients outside Codex."* (§12.3)
- E a cláusula genérica dos ToU: *"Automatically or programmatically extract data or Output"* (§2.2), cuja ambiguidade continua registrada e não resolvida.

**Leitura honesta:** o endosso público da OpenAI mira harness-de-codificação-com-desenvolvedor. O benchmark da Kodus fica **fora do texto do endosso e fora do texto de qualquer proibição** — uma zona não endereçada. Isso é diferente do caso Anthropic, onde há texto explícito contra (§5.1, §11).

---

## 19. CORRIGENDA ao Adendo 1 (§12)

Registro as correções sem apagar o texto original, conforme a regra deste documento.

| Onde | O que eu escrevi | Correção |
|---|---|---|
| §12.1, tabela, linha "Termos permitem?" | "Não há proibição literal encontrada; há orientação explícita em sentido contrário" | **Mantém-se correto**, mas faltava: existe **endosso público explícito da liderança da OpenAI**, que eu não havia procurado. Ver §16.2 e §16.3. |
| §12.1, veredito "**NÃO**" | Categórico demais | **Corrigir para: NÃO para `api.openai.com` (confirmado por escopos, §17.1); SIM tecnicamente e com endosso público não-contratual para `chatgpt.com/backend-api` via cliente que fale o protocolo do Codex (§17.2–17.3).** |
| §12.4 | Eu havia usado só fonte secundária (Puter) para o funcionamento do proxy | **Reforçado com fonte primária**: issues do `openclaw/openclaw` com JWT decodificado e curl reproduzível, e o código-fonte de `openai/codex`. Ver §17. |
| §13.1 | Eu marquei a afirmação do OpenClaw *"OpenAI explicitly supports subscription OAuth usage in external tools and workflows like OpenClaw"* como **"NÃO ENCONTRADA nenhuma página da OpenAI que sustente a afirmação"** | **CORRIGIDO: a afirmação do OpenClaw está substancialmente sustentada.** O post do Altman de 1 mai 2026 cita o OpenClaw **pelo nome**, e a página Codex for OSS da OpenAI também. O que continua verdadeiro é a distinção: o suporte é **declaratório/de programa**, não **documentação técnica** nem cláusula contratual. Peço desculpas pela imprecisão. |
| §14, tabela, linha OpenAI | "**NÃO**. Token do Codex é escopado ao Codex" | **Mantém-se factualmente correto quanto ao escopo**, mas a linha deve ser lida junto com §17.3: o escopo do Codex é atingível por um harness terceiro que fale o protocolo do Codex contra `chatgpt.com/backend-api`, e isso é publicamente endossado. |

**O que NÃO muda:**

- O lado **Anthropic** permanece inteiramente como descrito no §11. Não encontrei nada que o contrarie; ao contrário, o próprio contexto do post do Altman é a mudança da Anthropic em sentido oposto.
- A conclusão de que **`api.openai.com` não aceita credencial de assinatura** permanece — confirmada com evidência mais forte do que eu tinha antes.
- A conclusão de que, para rodar sob assinatura, o harness precisa **falar o protocolo do cliente oficial** permanece. Para o benchmark isso continua sendo um problema **metodológico** independente do problema jurídico: se o `runAgentLoopViaCore` tiver de se apresentar como Codex e enviar o request shape do Codex, o que se mede deixa de ser puramente o harness da Kodus.

---

## 20. Respostas diretas às cinco perguntas do recheque

1. **"Sign in with ChatGPT" para desenvolvedores shipou?** **SIM — em beta**, atualizado ~2026-07-31, com parceiros nominados (Airtable, GitLab, HubSpot, Notion, Supabase, Vercel). **Mas é provedor de identidade (nome, e-mail, foto).** Não paga chamadas de modelo. Não é o mecanismo em questão.
2. **O que ele autoriza?** Só identidade. Chamadas gerais de modelo cobradas na assinatura do usuário: **NÃO**. A doc afirma que não compartilha "your files or **tokens**" nem "your **billing** information".
3. **A doc endereça o caso "empresa rodando harness interno, sem usuário final"?** **NÃO ENCONTRADO** — nem cobrindo, nem excluindo. Zona não endereçada. O endosso público, pelo texto, fala de desenvolvedor programando na ferramenta que prefere.
4. **Declaração pública de liderança?** **SIM, verificada.** Sam Altman, @sama, **1 mai 2026, 23:33**: *"you can sign in to openclaw with your chatgpt account now and use your subscription there! happy lobstering."* Mais a página oficial Codex for OSS. A declaração atribuída a Tibo Sottiaux é **secundária e não verificada**.
5. **Escopos mais amplos ou outro endpoint?** Escopos: **não há caminho documentado** — são fixos no app OAuth do Codex (`app_EMoamEEZ73f0CkXaXp7hrann`). Endpoint: **`https://chatgpt.com/backend-api/`** funciona com o mesmo token, confirmado por issues públicas e pelo código do `openai/codex`. **Sancionado?** Endossado publicamente pela liderança; **não documentado tecnicamente**; **não proibido** pelos termos.

**Em uma frase, para o time:** no lado da OpenAI a porta está aberta e o CEO disse isso em público, mas ela dá para o backend do ChatGPT falando o protocolo do Codex — não para a Platform API — e o endosso é sobre desenvolvedor-programando, não sobre benchmark corporativo em CI. No lado da Anthropic a porta está fechada e escrita. Isso não é a mesma resposta para os dois fornecedores, e o §14 deve ser lido com esta correção.

---

## 21. Onde procurei neste adendo (rastro de auditoria)

Todas as consultas em **2026-08-04**.

| Documento | URL | Data do doc | Método |
|---|---|---|---|
| OpenAI Help — Sign in with ChatGPT | https://help.openai.com/en/articles/20001410-sign-in-with-chatgpt | "Updated: 4 days ago" (~2026-07-31) | navegador headless (403 para curl/WebFetch) |
| Sam Altman (@sama) no X | https://x.com/sama/status/2050357911915028689 | **2026-05-01, 23:33** | navegador headless (402 para WebFetch) |
| OpenAI Developers — Codex for Open Source | https://developers.openai.com/community/codex-for-oss | sem data | navegador headless |
| Índice de docs do Codex/ChatGPT | https://learn.chatgpt.com/llms.txt | sem data | curl |
| `openclaw/openclaw` issue #24720 | https://github.com/openclaw/openclaw/issues/24720 | aberta 2026-02-23, fechada 2026-03-06 | `gh issue view` |
| `openclaw/openclaw` issue #24927 | https://github.com/openclaw/openclaw/issues/24927 | aberta 2026-02-24, fechada 2026-02-25 | `gh issue view` |
| `openclaw/openclaw` issue #26801 | https://github.com/openclaw/openclaw/issues/26801 | aberta 2026-02-25 | `gh issue view` |
| `openai/codex` código-fonte (`main`) | https://github.com/openai/codex | clone 2026-08-04 | `git clone --depth 1 --sparse` + grep |
| Manifest Blog (**fonte secundária**) | https://manifest.build/blog/chatgpt-plus-tokens-third-party-harnesses/ | 2026-07-01 | navegador headless |

### NÃO ENCONTRADO / NÃO VERIFICADO neste adendo

1. **Post original de Tibo Sottiaux: NÃO LOCALIZADO.** `x.com/search` exige login em 2026-08-04. Só reportagem secundária.
2. **Documentação técnica da OpenAI sobre `chatgpt.com/backend-api` para clientes terceiros: NÃO ENCONTRADO** em `learn.chatgpt.com/llms.txt` (índice completo, 297 linhas) nem nas páginas de auth.
3. **Forma documentada de obter escopos `model.request` / `api.responses.write` num token de assinatura: NÃO ENCONTRADO.**
4. **Cláusula que enderece uso corporativo/não-interativo da assinatura em harness terceiro: NÃO ENCONTRADO** em nenhum documento da OpenAI consultado — nem permitindo, nem proibindo.
5. **Anúncio formal (blog/newsroom) da OpenAI sobre uso de assinatura em harnesses terceiros: NÃO ENCONTRADO.** O endosso existe em post pessoal do CEO e em página de programa, não em post de produto ou changelog.
