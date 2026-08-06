# Preços por token dos modelos do benchmark (fontes oficiais)

**Coleta:** 04/08/2026. **Volume da passada:** 12,39M tokens de input + 0,58M tokens de output por modelo (95,5% input).
**Fórmula:** `custo = 12,39 × preço_input_por_1M + 0,58 × preço_output_por_1M` (USD).

> Apenas fontes primárias (páginas de preço e docs oficiais dos próprios fornecedores). Nenhum agregador, blog ou comparador foi usado como fonte de preço.

---

## 1. Tabela principal

| Modelo | Provider | Input $/1M | Output $/1M | Cache-read $/1M | **Custo por passada (USD)** | Fonte | Data |
|---|---|---|---|---|---|---|---|
| gpt-5.6-luna | OpenAI | 0,20 | 1,20 | 0,02 | **3,17** | [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing) | 04/08/2026 |
| gpt-5.6-terra | OpenAI | 2,00 | 12,00 | 0,20 | **31,74** | [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing) | 04/08/2026 |
| gpt-5.6-sol | OpenAI | 5,00 | 30,00 | 0,50 | **79,35** | [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing) | 04/08/2026 |
| gemini-3.1-pro-preview | Google | 2,00 (≤200k) | 12,00 | 0,20 | **31,74** | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) | 04/08/2026 |
| gemini-3.6-flash | Google | 1,50 | 7,50 | 0,15 | **22,94** | [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing) | 04/08/2026 |
| kimi-k2.7-code | Moonshot | 0,95 (cache miss) | 4,00 | 0,19 | **14,09** | [platform.kimi.ai/docs/pricing/chat-k27-code](https://platform.kimi.ai/docs/pricing/chat-k27-code.md) | 04/08/2026 |
| Kimi K3 | Moonshot | 3,00 (cache miss) | 15,00 | 0,30 | **45,87** | [platform.kimi.ai/docs/pricing/chat-k3](https://platform.kimi.ai/docs/pricing/chat-k3.md) | 04/08/2026 |
| GLM-5.2 | Z.ai / Zhipu | 1,40 | 4,40 | 0,26 | **19,90** | [docs.z.ai/guides/overview/pricing](https://docs.z.ai/guides/overview/pricing) | 04/08/2026 |
| deepseek-v4-flash | DeepSeek | 0,14 (cache miss) | 0,28 | 0,0028 | **1,90** | [api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing) | 04/08/2026 |
| deepseek-v4-pro | DeepSeek | 0,435 (cache miss) | 0,87 | 0,003625 | **5,89** | [api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing) | 04/08/2026 |
| grok-4.5 | xAI | 2,00 (<200k) | 6,00 | 0,30 | **28,26** | [docs.x.ai/docs/models](https://docs.x.ai/docs/models) | 04/08/2026 |
| qwen3.8-max | Alibaba | 2,00 (Singapura) | 6,00 | 0,17 | **28,26** | [alibabacloud.com/help/en/model-studio/qwen3-8-max](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-max) | 04/08/2026 |
| MiniMax-M3 | MiniMax | 0,30 (≤512k) | 1,20 | 0,06 | **4,41** | [platform.minimax.io/docs/guides/pricing-paygo](https://platform.minimax.io/docs/guides/pricing-paygo.md) | 04/08/2026 |
| mimo-v2.5-pro | Xiaomi | 0,435 (overseas) | 0,87 | 0,0036 | **5,89** | [mimo.mi.com/docs/zh-CN/price/pay-as-you-go](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go) | 04/08/2026 |

Nenhuma das páginas acima exibe data de última atualização; a data informada é a data de acesso.

### Mapeamento "GPT Luna / Sol / Terra"

Os nomes existem, mas na página da OpenAI aparecem como variantes da família **GPT-5.6**:

- **GPT Luna** → `gpt-5.6-luna` — $0,20 in / $1,20 out / $0,02 cached
- **GPT Terra** → `gpt-5.6-terra` — $2,00 in / $12,00 out / $0,20 cached
- **GPT Sol** → `gpt-5.6-sol` — $5,00 in / $30,00 out / $0,50 cached

Não existe modelo chamado apenas "GPT Luna/Sol/Terra" sem o prefixo de versão.

---

## 2. Cache, batch e moeda

### Preço de cache-read e mecanismo

| Modelo | Cache-read $/1M | Razão cache/input | Mecanismo | Batch |
|---|---|---|---|---|
| gpt-5.6-luna / terra / sol | 0,02 / 0,20 / 0,50 | 10% | automático (prompt caching da OpenAI) | 50% de desconto (listado na página) |
| gemini-3.1-pro-preview | 0,20 | 10% | caching de contexto (implícito + explícito); armazenamento explícito $4,50/h | 50% (Batch API) |
| gemini-3.6-flash | 0,15 | 10% | idem; armazenamento $1,00/h | 50% (Batch API) |
| kimi-k2.7-code | 0,19 | 20% | **automático** ("automatic context caching", doc do K2.7) | página de batch existe (`/docs/pricing/batch`), desconto não capturado |
| Kimi K3 | 0,30 | 10% | automático | idem |
| GLM-5.2 | 0,26 | ~19% | cached input com armazenamento "Limited-time Free"; a página não diz se é automático | não listado |
| deepseek-v4-flash | **0,0028** | **2%** | cache automático em disco | não listado |
| deepseek-v4-pro | **0,003625** | **0,83%** | cache automático em disco | não listado |
| grok-4.5 | 0,30 | 15% | cached input automático | não listado |
| qwen3.8-max | 0,17 | 8,5% | cache implícito + explícito; criação de cache explícito custa 125% do input, hit ~10% | não listado |
| MiniMax-M3 | 0,06 | 20% | prompt caching read | não listado |
| mimo-v2.5-pro | 0,0036 | **0,83%** | cache hit; **escrita de cache gratuita por tempo limitado** ("缓存写入：限时免费") | não listado |

### Modelos com cache dramaticamente mais barato (destaque)

Três modelos têm cache-read absurdamente abaixo do input normal — e como a carga é 95,5% input com contexto reenviado em até 28 passos, isso muda tudo:

- **DeepSeek V4 Pro**: cache-read é **120× mais barato** que o input ($0,003625 vs $0,435).
- **Xiaomi MiMo V2.5 Pro**: **121× mais barato** ($0,0036 vs $0,435), e a escrita no cache está gratuita.
- **DeepSeek V4 Flash**: **50× mais barato** ($0,0028 vs $0,14).

Os demais ficam na faixa convencional de 5×–10× (OpenAI, Google, Kimi K3, Qwen, xAI, GLM).

### Custo por passada no cenário "100% cache hit" (limite inferior teórico)

Usando o preço de cache-read no lugar do input (mesmo output):

| Modelo | Sticker | 100% cache hit | Redução |
|---|---|---|---|
| deepseek-v4-flash | 1,90 | **0,20** | −90% |
| mimo-v2.5-pro | 5,89 | **0,55** | −91% |
| deepseek-v4-pro | 5,89 | **0,55** | −91% |
| gpt-5.6-luna | 3,17 | **0,94** | −70% |
| MiniMax-M3 | 4,41 | **1,44** | −67% |
| kimi-k2.7-code | 14,09 | **4,67** | −67% |
| qwen3.8-max | 28,26 | **5,59** | −80% |
| GLM-5.2 | 19,90 | **5,77** | −71% |
| gemini-3.6-flash | 22,94 | **6,21** | −73% |
| grok-4.5 | 28,26 | **7,20** | −75% |
| gpt-5.6-terra | 31,74 | **9,44** | −70% |
| gemini-3.1-pro-preview | 31,74 | **9,44** | −70% |
| Kimi K3 | 45,87 | **12,42** | −73% |
| gpt-5.6-sol | 79,35 | **23,60** | −70% |

**Efeito no ranking:** no preço de tabela, DeepSeek V4 Flash (1,90) < gpt-5.6-luna (3,17) < MiniMax-M3 (4,41). Com cache alto, MiniMax-M3 e gpt-5.6-luna trocam de posição, e **qwen3.8-max cai de 28,26 para 5,59**, ficando mais barato que GLM-5.2, Gemini Flash e Grok — uma inversão relevante. Na prática o hit rate real fica entre os dois extremos; use os dois números como faixa.

### Moeda e conversão

Taxa usada: **1 USD = 6,755 CNY** (Trading Economics, 04/08/2026).

- **Xiaomi MiMo** publica duas tabelas. Doméstica (CNY/1M): `mimo-v2.5-pro` ¥3,00 input / ¥0,025 cache hit / ¥6,00 output → ≈ $0,444 / $0,0037 / $0,888. Internacional (já em USD): $0,435 / $0,0036 / $0,87. **A tabela principal usa a tabela internacional em USD.**
- **Alibaba Qwen3.8-Max** também tem duas tabelas. Pequim (CNY/1M): ¥12 input / ¥1,5 cache hit / ¥36 output → ≈ $1,78 / $0,222 / $5,33. Singapura/internacional (USD): $2,00 / $0,17 / $6,00. **A tabela principal usa Singapura.** Rodar na região de Pequim sairia ~11% mais barato no input.
- **Moonshot, Z.ai, DeepSeek e MiniMax** publicam as páginas internacionais diretamente em USD — sem conversão necessária.

### Avisos de preço promocional / variável

- **MiniMax-M3**: as tarifas listadas são marcadas como **"Permanent 50% off"** sobre preços de referência riscados ($0,60/$2,40). Sem data de término, mas é preço promocional declarado.
- **DeepSeek**: a página avisa que o serviço vai adotar **preço de pico/fora de pico**, com tarifas **2× nos horários de pico** (09:00–12:00 e 14:00–18:00, horário de Pequim). Data de início ainda não anunciada. Isso pode dobrar o custo da passada se o run cair na janela de pico.
- **Gemini 3.1 Pro**: está como **preview** (`gemini-3.1-pro-preview`) — preço sujeito a mudança no GA.
- **Z.ai GLM-5.2**: armazenamento de cache "Limited-time Free".
- **Xiaomi**: escrita de cache "限时免费" (grátis por tempo limitado).

### Faixas por tamanho de prompt (atenção no loop de 28 passos)

- **Grok 4.5**: acima de 200k tokens de prompt, **toda** a requisição é cobrada no dobro ($4,00 in / $12,00 out / $0,60 cache). Se o contexto acumulado passar de 200k, o custo da passada vai de $28,26 para $56,52.
- **Gemini 3.1 Pro**: $2,00 vale para ≤200k; prompts maiores têm tarifa superior.
- **MiniMax-M3**: dobra acima de 512k tokens de input.
- **Qwen3.8-Max**: preço plano em toda a janela de 1M — sem surcharge.
- **Kimi K2.7 Code**: janela de 262.144 tokens (menor que os demais) — pode limitar o loop.

---

## 3. NÃO ENCONTRADO

| Item solicitado | Situação | Onde foi verificado |
|---|---|---|
| — | Nenhum modelo da lista ficou sem preço oficial. | — |

Observações sobre correspondências que exigiram interpretação:

- **"GPT Luna / GPT Sol / GPT Terra"**: **encontrados**, porém com os IDs `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra` na página de preços da OpenAI. Não existem entradas com os nomes soltos.
- **"Kimi 3"**: mapeado para **Kimi K3** (modelo flagship, 1M de contexto) em `platform.kimi.ai/docs/pricing/chat-k3`. Não existe um "Kimi 3" separado do K3.
- **"Kimi K2.7 (coding)"**: mapeado para `kimi-k2.7-code`. Existe também `kimi-k2.7-code-highspeed` custando exatamente o dobro ($1,90 in / $0,38 cache / $8,00 out → **$28,18** por passada).
- **`qwen3.8-max`**: **não aparece** na página geral de preços do Model Studio (`/help/en/model-studio/model-pricing`, que só lista até `qwen3.7-max`). O preço foi obtido da página oficial do modelo (`/help/en/model-studio/qwen3-8-max` e a versão em chinês `help.aliyun.com/zh/model-studio/qwen3-8-max`). O modelo consta também como `qwen3.8-max-preview` com promoções noturnas na documentação chinesa.
- **Descontos de batch de Moonshot, Z.ai, DeepSeek, xAI, MiniMax, Alibaba e Xiaomi** não foram capturados nas páginas de preço consultadas — apenas OpenAI e Google publicam o desconto de 50% de forma explícita nessas páginas.

---

## 4. Total do orçamento de uma "passada completa"

Somando o custo por passada de **todos os 14 modelos precificados**:

| Cenário | Total (USD) |
|---|---|
| Preço de tabela (sem cache) | **$323,42** |
| Sem `deepseek-v4-pro` (13 modelos) | **$317,52** |
| Limite inferior teórico (100% cache hit) | **$88,01** |

Ou seja, um refresh completo do benchmark custa entre **~$88 e ~$323** por rodada, dependendo do aproveitamento de cache. Adicionando `kimi-k2.7-code-highspeed` o teto sobe para ~$351,60.

Três modelos concentram quase metade do custo de tabela: `gpt-5.6-sol` ($79,35), `Kimi K3` ($45,87) e os dois de $31,74 (`gpt-5.6-terra` e `gemini-3.1-pro-preview`) — juntos, $188,70 de $323,42 (58%).

---

## 5. Aviso

Todos os preços foram coletados em **04/08/2026** diretamente das páginas oficiais de cada fornecedor. Preços de LLM mudam com frequência (cortes de preço, fim de promoções, mudança de preview para GA, tarifação por horário de pico). **Revalide antes de fechar orçamento**, especialmente MiniMax (promoção "permanent 50% off"), DeepSeek (peak/off-peak anunciado mas sem data) e Gemini 3.1 Pro (ainda em preview).
