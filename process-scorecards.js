/**
 * Pipeline de dados do site — formato scorecard.
 *
 * Substitui `process-data.js`, que lia a saída do promptfoo do bench sintético.
 * Consome scorecards emitidos por `evals/scorer/cli.js` (no kodus-ai) e, quando
 * disponível, a submission correspondente — que é de onde saem as findings para
 * as páginas de trace.
 *
 *   node process-scorecards.js [--in=./scorecards] [--submissions=./submissions]
 *
 * O leaderboard passa a ser MATRIZ harness × modelo, não lista de modelos: o
 * mesmo modelo dentro de motores diferentes (Kodus, Claude Code, Codex, Greptile)
 * é entrada distinta e comparável.
 */
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? true] : [a, true];
    }),
);

const IN_DIR = path.resolve(args.in || './scorecards');
const SUB_DIR = path.resolve(args.submissions || './submissions');
// Default escreve nos dados do site. `--out=` existe para poder testar o pipeline
// sem sobrescrever o que está publicado (aprendido do jeito difícil).
const OUT_DIR = args.out ? path.resolve(args.out) : path.join(__dirname, 'src', 'lib', 'data');
// Re-scores adicionais da MESMA submission, mesmo judge — mede run-to-run
// (ruído do próprio judge), não re-roda o modelo de review. Arquivo:
// scorecards/variance/<modelId>-run{2,3}.json. O run1 já está no scorecard
// canônico (IN_DIR); ausente = sem `variance` no entry, não um erro.
const VARIANCE_DIR = path.join(__dirname, 'scorecards', 'variance');

// caseId → repo/linguagem. Derivado do sufixo do caseId para o site não precisar
// dos datasets do kodus-ai (que são grandes e vivem em outro repo).
const REPO_RULES = [
    [/-cal-com$/, 'cal.com', 'typescript'],
    [/-discourse(-cursor)?$/, 'discourse', 'ruby'],
    [/-grafana(-codex)?$/, 'grafana', 'go'],
    [/-keycloak$/, 'keycloak', 'java'],
    [/-sentry(-greptile)?$/, 'sentry', 'python'],
];

function classify(caseId) {
    for (const [re, repo, lang] of REPO_RULES) {
        if (re.test(caseId)) return { repo, language: lang };
    }
    return { repo: 'unknown', language: 'unknown' };
}

const PRICING = (() => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'pricing.json'), 'utf8'));
    } catch {
        console.warn('  ⚠ pricing.json não encontrado — métricas de custo ficarão null');
        return { models: {} };
    }
})();

// caseId → tamanho real do diff (arquivos/linhas), extraído uma vez de
// evals/investigation/datasets/*.json no kodus-ai-bench (patchWithLinesStr já
// frozen no fixture — não precisa clonar repo nem checkout de SHA). Ver
// scripts/extract-pr-size.js. Faltando um caseId aqui não derruba o pipeline —
// só cai fora dos filtros/bucket de tamanho, igual custo sem preço publicado.
const PR_SIZE = (() => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'pr-size.json'), 'utf8'));
    } catch {
        console.warn('  ⚠ pr-size.json não encontrado — filtro de tamanho de PR ficará vazio');
        return {};
    }
})();
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL'];

// caseId → golden completo (texto + severidade real do golden, não do
// finding) — extraído uma vez de evals/investigation/datasets/*.json (ver
// scripts/extract-goldens.js). O scorecard só grava os PERDIDOS; pra saber
// quais foram ACERTADOS (necessário pro /compare — "A achou, B não") dá pra
// derivar por diferença: golden completo menos os que aparecem em
// missedGoldens (match exato de texto, mesma fonte).
const GOLDENS = (() => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'goldens.json'), 'utf8'));
    } catch {
        console.warn('  ⚠ goldens.json não encontrado — /compare ficará sem detalhe por golden');
        return {};
    }
})();

/**
 * Custo por PR e por bug encontrado.
 *
 * `costPerBugFound` é a métrica que combina qualidade e preço num número só:
 * modelo barato que não acha nada tem custo-por-bug terrível, e modelo caro que
 * acha tudo pode ser o melhor negócio. É o número que um comprador quer.
 *
 * Três casos em que devolvemos null em vez de zero — zero mentiria:
 *   - rodou por assinatura: não há custo por token
 *   - modelo sem preço publicado
 *   - nenhum bug encontrado: custo-por-bug é indefinido, não infinito
 */
function costOf(run, agg) {
    const accessPath = run?.model?.accessPath || 'unknown';
    if (accessPath === 'subscription' || accessPath === 'local') {
        return {
            costTotal: null,
            costPerPR: null,
            costPerBugFound: null,
            costBasis: accessPath === 'subscription' ? 'assinatura (sem custo por token)' : 'local',
        };
    }
    const p = PRICING.models[run?.model?.id];
    if (!p) {
        return { costTotal: null, costPerPR: null, costPerBugFound: null, costBasis: 'preço não publicado' };
    }
    const u = agg.usage || { inputTokens: 0, outputTokens: 0 };
    const costTotal = (u.inputTokens / 1e6) * p.input + (u.outputTokens / 1e6) * p.output;
    const cases = agg.casesScored || 0;
    const bugs = agg.goldensMatched || 0;
    return {
        costTotal,
        costPerPR: cases ? costTotal / cases : null,
        costPerBugFound: bugs ? costTotal / bugs : null,
        costBasis: `preço de tabela (${PRICING._meta?.collectedAt || 's/data'}), sem desconto de cache`,
    };
}

function avg(xs) {
    const v = xs.filter((x) => typeof x === 'number' && !Number.isNaN(x));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function round2(o) {
    if (typeof o === 'number') return Math.round(o * 100) / 100;
    if (Array.isArray(o)) return o.map(round2);
    if (o && typeof o === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(o)) out[k] = round2(v);
        return out;
    }
    return o;
}

function readJsonDir(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
            try {
                return { file: f, data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) };
            } catch {
                console.warn(`  ⚠ ignorado (JSON inválido): ${f}`);
                return null;
            }
        })
        .filter(Boolean);
}

// ── carga ──
const scorecards = readJsonDir(IN_DIR);
if (!scorecards.length) {
    console.error(`nenhum scorecard em ${IN_DIR}`);
    console.error('gere com: node evals/scorer/cli.js --submission=<sub.json> --out=<scorecards>/<nome>.json');
    process.exit(1);
}

// findings por (entryKey, runAt, caseId), para as páginas de trace. runAt entra
// na chave de propósito: submissions/ acumula reruns e experimentos de ablação
// (RECALL_* flags) do MESMO modelo — sem o runAt, um arquivo solto processado
// depois na ordem do readdir sobrescreve silenciosamente os findings do run
// canônico pra qualquer caseId que os dois tenham em comum. Descoberto porque
// gemini37-nostrict15.submission.json (experimento) estava apagando 15/30
// findings de gemini37-light30.submission.json (o run publicado).
const findingsIndex = new Map();
for (const { data } of readJsonDir(SUB_DIR)) {
    const key = entryKeyOf(data.run);
    const runAt = data.run?.runAt || 'unknown';
    for (const r of data.results || []) {
        findingsIndex.set(`${key}::${runAt}::${r.caseId}`, r.findings || []);
    }
}

function entryKeyOf(run) {
    const h = run?.harness?.name || 'unknown';
    const m = run?.model?.id || 'bundled';
    return `${h}::${m}`;
}

// ── entradas do leaderboard (harness × modelo) ──
const entries = [];
const allSamples = [];
const scorecardCases = new Map(); // entryKey -> cases[] (insumo do bootstrap)
// Índice leve (sem findings/texto) pra filtro combinado (linguagem + repo +
// tamanho) no client sem embarcar samples.json inteiro (~870KB) no bundle da
// leaderboard. tp/fpFindings vêm do scorer — dá pra recompor precisão micro
// (TP/(TP+FP)) de qualquer subconjunto sem reabrir o scorecard.
const caseIndex = [];
let sampleId = 0;

// Modelos medidos mas ainda NAO publicados. Ficam de fora do site sem sair do
// repo — o scorecard continua versionado, entao republicar e so tirar daqui.
// gpt-5.6-luna/terra: rodaram por assinatura, sem custo por token, entao nao
// entram na fronteira custo x qualidade e a comparacao com os demais mistura
// dois regimes de cota. Voltam quando rodarem por API.
const NAO_PUBLICADOS = (args.include === 'todos'
    ? []
    : ['gpt-5.6-luna', 'gpt-5.6-terra']);

for (const { data: sc } of scorecards) {
    const run = sc.run || {};
    const key = entryKeyOf(run);
    if (NAO_PUBLICADOS.includes(run?.model?.id)) {
        console.log(`   (fora do site: ${run.model.id} — use --include=todos para incluir)`);
        continue;
    }
    const scored = (sc.cases || []).filter((c) => c.status === 'scored');
    if (!scored.length) continue;
    scorecardCases.set(key, scored);

    // agregados por linguagem, repo e tamanho de PR, a partir dos casos
    const byLanguage = {};
    const byRepo = {};
    const bySize = {};
    // Mix de severidade/categoria do que o modelo REPORTOU — não é recall por
    // severidade (goldens não têm severidade anotada, só texto+classificação).
    // É um sinal de calibração: esse modelo grita "critical" pra tudo, ou é
    // conservador? Categoria normalizada pras 3 que o scorer realmente usa de
    // forma consistente entre modelos — o resto é string livre por modelo
    // (ex.: "existing-finding-1", "BUG LENS") e vira "other" em vez de fingir
    // que é taxonomia real.
    const CANONICAL_CATEGORIES = new Set(['bug', 'performance', 'security']);
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const byCategory = { bug: 0, performance: 0, security: 0, other: 0 };
    for (const c of scored) {
        const { repo, language } = classify(c.caseId);
        const size = PR_SIZE[c.caseId] || null;
        for (const [bucket, name] of [
            [byLanguage, language],
            [byRepo, repo],
            ...(size ? [[bySize, size.sizeBucket]] : []),
        ]) {
            bucket[name] = bucket[name] || { matched: 0, goldens: 0, recalls: [], precisions: [], count: 0 };
            bucket[name].matched += c.metrics.matched;
            bucket[name].goldens += c.metrics.goldens;
            bucket[name].recalls.push(c.metrics.recall);
            bucket[name].precisions.push(c.metrics.precision);
            bucket[name].count += 1;
        }

        const caseFindings = findingsIndex.get(`${key}::${run.runAt}::${c.caseId}`) || [];
        for (const f of caseFindings) {
            const sev = (f.severity || '').toLowerCase();
            if (sev in bySeverity) bySeverity[sev] += 1;
            const cat = (f.category || '').toLowerCase();
            byCategory[CANONICAL_CATEGORIES.has(cat) ? cat : 'other'] += 1;
        }

        const missedGoldens = c.metrics.missedGoldens || [];
        const missedTexts = new Set(missedGoldens.map((m) => m.text));
        const fullGoldens = GOLDENS[c.caseId] || null;
        // null (não []): sem goldens.json pra esse caso, não dá pra afirmar
        // "achou zero" — diferente de genuinamente não ter detalhe nenhum.
        const goldensDetail = fullGoldens
            ? fullGoldens.map((g) => ({ text: g.text, severity: g.severity, matched: !missedTexts.has(g.text) }))
            : null;

        allSamples.push({
            id: `s${sampleId++}`,
            entryKey: key,
            harness: run.harness?.name || 'unknown',
            modelId: run.model?.id || null,
            caseId: c.caseId,
            repo,
            language,
            filesChanged: size?.filesChanged ?? null,
            linesChanged: size?.linesChanged ?? null,
            sizeBucket: size?.sizeBucket ?? null,
            recall: c.metrics.recall,
            precision: c.metrics.precision,
            f1: c.metrics.f1,
            goldens: c.metrics.goldens,
            matched: c.metrics.matched,
            findings: caseFindings,
            missedGoldens,
            goldensDetail,
            usage: c.usage || null,
            latencyMs: c.latencyMs ?? null,
        });

        caseIndex.push({
            entryKey: key,
            caseId: c.caseId,
            repo,
            language,
            sizeBucket: size?.sizeBucket ?? null,
            goldens: c.metrics.goldens,
            matched: c.metrics.matched,
            tpFindings: c.metrics.tpFindings ?? 0,
            fpFindings: c.metrics.fpFindings ?? 0,
        });
    }

    const finalize = (bucket) =>
        Object.fromEntries(
            Object.entries(bucket).map(([k, v]) => [
                k,
                {
                    recall: (v.goldens ? v.matched / v.goldens : 0) * 100,
                    precision: (avg(v.precisions) || 0) * 100,
                    goldens: v.goldens,
                    count: v.count,
                },
            ]),
        );

    const a = sc.aggregate || {};
    entries.push({
        key,
        harness: run.harness?.name || 'unknown',
        harnessVersion: run.harness?.version || null,
        modelId: run.model?.id || null,
        provider: run.model?.provider || null,
        // Regime de acesso: assinatura e API têm limites e latência diferentes.
        // Fica no dado para o site poder rotular, em vez de virar nota de rodapé.
        accessPath: run.model?.accessPath || 'unknown',
        executionMode: run.executionMode || 'unknown',
        // Regime de raciocínio. Sem isso o ranking embute calibração de vendor
        // como se fosse qualidade: medimos 8x de diferença em output entre dois
        // modelos que rodaram ambos "no default".
        reasoningConfig: run.reasoning?.config || 'unknown',
        reasoningEffort: run.reasoning?.effortRequested || null,
        reasoningTokens: scored.reduce((s, c) => s + (c.usage?.reasoningTokens || 0), 0) || null,

        // Sinal de truncamento. Um recall baixo acompanhado de finishReason de
        // corte é artefato da rota de acesso, não qualidade do modelo — e sem
        // isso visível o leaderboard publica um ranking que mistura as duas
        // coisas. `maxFindingsInCase` complementa: teto idêntico entre modelos
        // diferentes que compartilham a rota é indício de limite externo.
        finishReasons: scored.reduce((acc, c) => {
            const k = c.finishReason || 'unknown';
            acc[k] = (acc[k] || 0) + 1;
            return acc;
        }, {}),
        maxFindingsInCase: Math.max(
            0,
            ...allSamples.filter((s) => s.entryKey === key).map((s) => s.findings.length),
        ),
        judge: sc.judge?.model || null,
        runAt: run.runAt || null,

        // headline = recall micro (pondera por bug, não por PR). precision e f1
        // também em micro — mesma convenção (TP/(TP+FP) agregado no bench
        // inteiro), consistente com o que Martian e Alibaba publicam. macro
        // fica ao lado só por continuidade histórica.
        score: (a.recallMicro ?? 0) * 100,
        recallMacro: (a.recallMacro ?? 0) * 100,
        precision: (a.precisionMicro ?? a.precisionMacro ?? 0) * 100,
        precisionMacro: (a.precisionMacro ?? 0) * 100,
        f1:
            a.f1Micro != null
                ? a.f1Micro * 100
                : (() => {
                      const p = a.precisionMicro ?? a.precisionMacro ?? 0;
                      const r = a.recallMicro ?? 0;
                      return p + r ? (200 * p * r) / (p + r) : 0;
                  })(),
        fairRecall: (a.fairRecallMacro ?? 0) * 100,
        loopFidelity: a.loopFidelityMacro == null ? null : a.loopFidelityMacro * 100,

        goldensTotal: a.goldensTotal ?? 0,
        goldensMatched: a.goldensMatched ?? 0,
        cases: a.casesScored ?? scored.length,
        usage: a.usage || { inputTokens: 0, outputTokens: 0 },

        byLanguage: finalize(byLanguage),
        byRepo: finalize(byRepo),
        bySize: finalize(bySize),
        findingsBySeverity: bySeverity,
        findingsByCategory: byCategory,

        ...costOf(run, a),
    });
}

// ── intervalo de confiança e agrupamento em faixas ──
// Com ~95 goldens no set light, a margem é ±8-9pp. Publicar 1º/2º/3º com uma
// casa decimal promete precisão que o dado não paga — então o site expõe a
// margem e uma faixa, e o rank fica como ordenação, não como afirmação.
// Bootstrap sobre CASOS (não sobre goldens). A fórmula binomial assume goldens
// independentes, e eles não são: vários vivem no mesmo PR, e um modelo que "pega
// o assunto" daquele PR acerta vários de uma vez. Reamostrar casos com reposição
// respeita essa estrutura e não custa chamada nenhuma de API.
//
// LIMITE IMPORTANTE: isto mede só a variância de QUAIS PRs caíram no set. NÃO
// mede a variância do mesmo modelo entre rodadas — para isso é preciso rodar o
// mesmo modelo mais de uma vez. Ver `varianceCaveat` no meta.
function bootstrapCI(cases, iterations = 2000, seed = 42) {
    const pairs = cases.map((c) => [c.metrics.matched, c.metrics.goldens]);
    if (!pairs.length) return { lo: null, hi: null };
    // PRNG determinístico (mulberry32): mesmo dado → mesmo intervalo, sempre.
    let s = seed;
    const rnd = () => {
        s |= 0; s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const samples = [];
    for (let i = 0; i < iterations; i++) {
        let m = 0, g = 0;
        for (let j = 0; j < pairs.length; j++) {
            const [mm, gg] = pairs[(rnd() * pairs.length) | 0];
            m += mm; g += gg;
        }
        samples.push(g ? (m / g) * 100 : 0);
    }
    samples.sort((a, b) => a - b);
    const at = (q) => samples[Math.min(samples.length - 1, Math.floor(q * samples.length))];
    return { lo: at(0.025), hi: at(0.975) };
}


// ── comparacao pareada entre dois modelos ───────────────────────────────────
//
// Por que pareado: os dois modelos rodam os MESMOS PRs. Comparar os dois
// intervalos marginais joga fora essa informacao — se um PR e dificil, ele e
// dificil para os dois, e essa dificuldade comum cancela na diferenca. Na
// pratica o intervalo da diferenca sai ~40% mais estreito que os marginais,
// entao o teste marginal declarava empate em casos que o pareado separa.
//
// Reamostra os caseIds uma vez por iteracao e calcula os DOIS recalls sobre o
// MESMO conjunto reamostrado. Devolve a diferenca observada, o IC da diferenca
// e o p bilateral do bootstrap.
function pairedDiff(casesA, casesB, iterations = 4000, seed = 42) {
    const mapA = new Map(casesA.map((c) => [c.caseId, c.metrics]));
    const mapB = new Map(casesB.map((c) => [c.caseId, c.metrics]));
    // so casos que os dois rodaram — sem isso a diferenca compara conjuntos
    // distintos e deixa de ser pareada
    const ids = [...mapA.keys()].filter((id) => mapB.has(id));
    if (ids.length < 2) return null;

    let s = seed;
    const rnd = () => {
        s |= 0; s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const recallOf = (map, sample) => {
        let m = 0, g = 0;
        for (const id of sample) { const x = map.get(id); m += x.matched; g += x.goldens; }
        return g ? (m / g) * 100 : 0;
    };

    const observed = recallOf(mapA, ids) - recallOf(mapB, ids);
    const diffs = [];
    for (let i = 0; i < iterations; i++) {
        const sample = new Array(ids.length);
        for (let j = 0; j < ids.length; j++) sample[j] = ids[(rnd() * ids.length) | 0];
        diffs.push(recallOf(mapA, sample) - recallOf(mapB, sample));
    }
    diffs.sort((a, b) => a - b);
    const at = (q) => diffs[Math.min(diffs.length - 1, Math.floor(q * diffs.length))];

    // p bilateral do bootstrap: duas vezes a menor cauda em relacao a zero.
    const below = diffs.filter((d) => d <= 0).length / diffs.length;
    const p = Math.min(1, 2 * Math.min(below, 1 - below));

    return { observed, lo: at(0.025), hi: at(0.975), p, n: ids.length };
}

function mean(xs) {
    return xs.reduce((a, b) => a + b, 0) / xs.length;
}
// stdev amostral (n-1) — com n=3 é uma estimativa bem grosseira, por isso o
// site rotula explicitamente "n=3" perto de qualquer número que use isso.
function stdev(xs) {
    if (xs.length < 2) return null;
    const m = mean(xs);
    return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

// Variância run-a-run: reroda o MESMO judge sobre a MESMA submission (não
// rereoda o modelo de review) — isola ruído do julgamento do ruído de qual
// PR caiu no set (que o bootstrap acima já cobre). null quando não há
// scorecards/variance/<modelId>-run{2,3}.json para esse modelo — ausência,
// não zero.
function runToRunVariance(entry) {
    if (!entry.modelId) return null;
    const runs = [{ recallMicro: entry.score / 100, precisionMicro: entry.precision / 100, f1Micro: entry.f1 / 100 }];
    for (const n of [2, 3]) {
        const p = path.join(VARIANCE_DIR, `${entry.modelId}-run${n}.json`);
        try {
            const sc = JSON.parse(fs.readFileSync(p, 'utf8'));
            const a = sc.aggregate || {};
            runs.push({ recallMicro: a.recallMicro ?? 0, precisionMicro: a.precisionMicro ?? 0, f1Micro: a.f1Micro ?? 0 });
        } catch {
            // arquivo dessa rodada ainda não existe — variância parcial não é
            // publicada, é tudo ou nada pra não sugerir mais confiança do que
            // o dado sustenta.
            return null;
        }
    }
    const recalls = runs.map((r) => r.recallMicro * 100);
    const precisions = runs.map((r) => r.precisionMicro * 100);
    const f1s = runs.map((r) => r.f1Micro * 100);
    return {
        runs: runs.length,
        recall: { mean: mean(recalls), stdev: stdev(recalls), values: recalls },
        precision: { mean: mean(precisions), stdev: stdev(precisions), values: precisions },
        f1: { mean: mean(f1s), stdev: stdev(f1s), values: f1s },
    };
}

for (const e of entries) {
    e.runToRunVariance = runToRunVariance(e);
}

for (const e of entries) {
    const p = e.score / 100;
    const n = e.goldensTotal || 1;
    // mantido para comparação; o intervalo publicado é o bootstrap
    e.ciHalfWidth = 1.96 * Math.sqrt(Math.max(p * (1 - p), 0) / n) * 100;
    const scoredCases = (scorecardCases.get(e.key) || []).filter((c) => c.status === 'scored');
    const b = bootstrapCI(scoredCases);
    e.ciLow = b.lo;
    e.ciHigh = b.hi;
    // meia-largura efetiva usada no agrupamento em faixas
    e.ciHalfWidthBootstrap = b.lo != null ? (b.hi - b.lo) / 2 : e.ciHalfWidth;
}
entries.sort((a, b) => b.score - a.score);
entries.forEach((e, i) => (e.rank = i + 1));

// ── Faixas ──────────────────────────────────────────────────────────────────
//
// Agrupa quem não é estatisticamente separável do líder da faixa.
//
// O critério anterior era `gap > max(meia-largura dos dois)` — uma heurística
// sobre os intervalos MARGINAIS, que ignora o fato de todo modelo rodar os
// MESMOS PRs. Isso a tornava conservadora demais nos dois sentidos: larga
// porque desperdiça o pareamento, e sem qualquer controle para o número de
// comparações feitas.
//
// Agora: bootstrap pareado da diferença contra o líder da faixa, com correção
// de Holm-Bonferroni sobre a família de comparações daquele líder. Holm em vez
// de Bonferroni puro porque é uniformemente mais poderoso e igualmente válido.
//
// Ordem importa: sem correção, testar 8 modelos a 95% produz ~0,4 falso
// positivo esperado só por acaso, e um falso positivo aqui QUEBRA uma faixa —
// afirma diferença onde não há. O viés fica deliberadamente para o lado de
// declarar empate.
const ALPHA = 0.05;
let tier = 0;
let idx = 0;
while (idx < entries.length) {
    tier += 1;
    const leader = entries[idx];
    leader.tier = tier;
    const rest = entries.slice(idx + 1);
    if (!rest.length) break;

    const leaderCases = scorecardCases.get(leader.key) || [];
    const tests = rest.map((e) => ({
        e,
        r: pairedDiff(leaderCases, scorecardCases.get(e.key) || []),
    }));

    // Holm: ordena p crescente; rejeita enquanto p_(i) <= alpha/(m-i); no
    // primeiro que falha, para — os seguintes ficam todos sem rejeitar.
    const m = tests.length;
    const ordered = [...tests].filter((t) => t.r).sort((a, b) => a.r.p - b.r.p);
    const separated = new Set();
    for (let i = 0; i < ordered.length; i++) {
        if (ordered[i].r.p <= ALPHA / (m - i)) separated.add(ordered[i].e.key);
        else break;
    }

    for (const t of tests) {
        t.e.pairedVsTierLeader = t.r
            ? { diff: +t.r.observed.toFixed(2), lo: +t.r.lo.toFixed(2), hi: +t.r.hi.toFixed(2), p: +t.r.p.toFixed(4), n: t.r.n }
            : null;
    }

    // O próximo líder é o primeiro (maior recall) que separou. Quem não
    // separou entra nesta faixa.
    const nextIdx = rest.findIndex((e) => separated.has(e.key));
    if (nextIdx === -1) {
        for (const e of rest) e.tier = tier;
        break;
    }
    for (let k = 0; k < nextIdx; k++) rest[k].tier = tier;
    idx = idx + 1 + nextIdx;
}

const leaderboard = round2({
    entries,
    averages: {
        score: avg(entries.map((e) => e.score)),
        precision: avg(entries.map((e) => e.precision)),
        f1: avg(entries.map((e) => e.f1)),
    },
});

const meta = {
    totalEntries: entries.length,
    harnesses: [...new Set(entries.map((e) => e.harness))].sort(),
    models: [...new Set(entries.map((e) => e.modelId).filter(Boolean))].sort(),
    languages: [...new Set(allSamples.map((s) => s.language))].sort(),
    repos: [...new Set(allSamples.map((s) => s.repo))].sort(),
    // ordem por tamanho (XS→XL), não alfabética — alfabética dá L,M,S,XL,XS.
    sizes: SIZE_ORDER.filter((s) => allSamples.some((sample) => sample.sizeBucket === s)),
    executionModes: [...new Set(entries.map((e) => e.executionMode))].sort(),
    accessPaths: [...new Set(entries.map((e) => e.accessPath))].sort(),
    judges: [...new Set(entries.map((e) => e.judge).filter(Boolean))].sort(),
    totalCases: Math.max(...entries.map((e) => e.cases)),
    totalGoldens: Math.max(...entries.map((e) => e.goldensTotal)),
    tiers: tier,
    // Como a faixa e decidida — fica no meta pra o site poder citar sem
    // reescrever a regra a mao em dois lugares.
    tierMethod: {
        test: 'bootstrap pareado da diferenca de recall contra o lider da faixa, nos mesmos PRs',
        iterations: 4000,
        alpha: 0.05,
        correction: 'Holm-Bonferroni sobre as comparacoes contra cada lider de faixa',
        note: 'Pareado porque todo modelo roda os MESMOS PRs: a dificuldade do caso cancela na diferenca, o que estreita o intervalo em ~40% frente aos marginais. A correcao existe porque testar 8 modelos a 95% produz ~0,4 falso positivo esperado, e um falso positivo aqui QUEBRA uma faixa, afirmando diferenca onde nao ha.',
    },
    // Rótulo obrigatório: dois tipos de variância, dois status diferentes.
    varianceCaveat: {
        measured: 'case-sampling (bootstrap 2000x) e judge run-to-run (3 rodadas do mesmo judge sobre a mesma submission, onde disponível)',
        notMeasured: 'model run-to-run (rodar o MESMO modelo de novo do zero — 1 passada por entrada)',
        runsPerEntry: 1,
        judgeRunsAvailable: entries.filter((e) => e.runToRunVariance).length,
        judgeRunsTotal: entries.length,
    },
    generatedAt: new Date().toISOString(),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'leaderboard.json'), JSON.stringify(leaderboard, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'samples.json'), JSON.stringify(round2(allSamples)));
fs.writeFileSync(path.join(OUT_DIR, 'case-index.json'), JSON.stringify(caseIndex));

console.log(`✅ ${entries.length} entrada(s) · ${allSamples.length} amostras · ${tier} faixa(s)`);
for (const e of entries) {
    const money =
        e.costPerPR != null
            ? `$${e.costPerPR.toFixed(3)}/PR` +
              (e.costPerBugFound != null ? ` · $${e.costPerBugFound.toFixed(2)}/bug` : '')
            : `custo n/a (${e.costBasis})`;
    console.log(
        `   #${e.rank} [T${e.tier}] ${e.harness}/${e.modelId || 'bundled'} ` +
            `${e.score.toFixed(1)}% [${(e.ciLow??0).toFixed(1)}–${(e.ciHigh??0).toFixed(1)}] ` +
            `(${e.goldensMatched}/${e.goldensTotal}) ${e.accessPath}/${e.executionMode} · ${money}`,
    );
}
console.log(`→ ${path.relative(process.cwd(), OUT_DIR)}`);
