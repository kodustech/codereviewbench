/**
 * Pipeline de dados do site — benchmark v3 (gold v3, dois modos de review).
 *
 *   node process-scorecards.js [--in=./data-v3] [--out=<dir>]
 *
 * Le, para cada modo, `<in>/scorecards/<pasta>/<modelId>.json` e a submission
 * correspondente em `<in>/submissions/<pasta>/<modelId>.submission.json`:
 *
 *   light/  -> modo "balanced" (o review normal: um agente generalista)
 *   heavy/  -> modo "heavy" (generalista + 9 lentes especialistas em paralelo)
 *
 * Pega o que estiver nas pastas. Um modelo com um modo so entra com uma linha
 * so; a outra simplesmente nao existe no dado (nunca zero).
 *
 * Saida em src/lib/data/: leaderboard.json, meta.json, samples.json,
 * case-index.json.
 */
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? true] : [a, true];
    }),
);

const IN_DIR = path.resolve(args.in || './data-v3');
// `--out=` existe para testar o pipeline sem sobrescrever o que esta publicado.
const OUT_DIR = args.out ? path.resolve(args.out) : path.join(__dirname, 'src', 'lib', 'data');

const MODE_DIRS = [
    { dir: 'light', mode: 'balanced' },
    { dir: 'heavy', mode: 'heavy' },
];

// caseId -> repo/linguagem, pelo sufixo do caseId.
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

function readJson(p, fallback, warn) {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        if (warn) console.warn(`  ⚠ ${warn}`);
        return fallback;
    }
}

const PRICING = readJson(path.join(__dirname, 'pricing.json'), { models: {} }, 'pricing.json ausente: custo fica null');
// caseId -> tamanho do diff (ver scripts/extract-pr-size.js). Mesmos 30 PRs do v1.
const PR_SIZE = readJson(path.join(__dirname, 'pr-size.json'), {}, 'pr-size.json ausente: filtro de tamanho fica vazio');
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];

/**
 * Custo COM prompt cache. inputTokens ja inclui os tokens lidos/escritos em
 * cache, entao o input "fresco" e o resto. reasoningTokens ja estao dentro de
 * outputTokens: somar de novo cobraria duas vezes. cacheWrite null = sem taxa
 * separada de escrita, cobrado como input.
 */
function costOfUsage(u, p) {
    if (!u || !p) return null;
    const input = u.inputTokens || 0;
    const cacheRead = u.cacheReadTokens || 0;
    const cacheWrite = u.cacheWriteTokens || 0;
    const fresh = Math.max(0, input - cacheRead - cacheWrite);
    const writePrice = p.cacheWrite == null ? p.input : p.cacheWrite;
    const readPrice = p.cacheRead == null ? p.input : p.cacheRead;
    return (
        (fresh * p.input + cacheRead * readPrice + cacheWrite * writePrice + (u.outputTokens || 0) * p.output) / 1e6
    );
}

function bootstrapCI(cases, iterations = 2000, seed = 42) {
    const pairs = cases.map((c) => [c.metrics.matched, c.metrics.goldens]);
    if (!pairs.length) return { lo: null, hi: null };
    // PRNG deterministico (mulberry32): mesmo dado, mesmo intervalo.
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

function fScore(p, r, beta) {
    const b2 = beta * beta;
    return p + r > 0 ? ((1 + b2) * p * r) / (b2 * p + r) : 0;
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

// Custo por PR fica com 4 casas: modelo barato custa fracao de centavo por PR,
// e round2 zeraria.
function round4(n) {
    return n == null ? null : Math.round(n * 10000) / 10000;
}

function readModeDir(kind, dir) {
    const full = path.join(IN_DIR, kind, dir);
    if (!fs.existsSync(full)) return [];
    return fs
        .readdirSync(full)
        .filter((f) => f.endsWith('.json'))
        .map((f) => {
            const data = readJson(path.join(full, f), null, `ignorado (JSON invalido): ${kind}/${dir}/${f}`);
            return data ? { file: f, data } : null;
        })
        .filter(Boolean);
}

const entries = [];
const allSamples = [];
const caseIndex = [];
let sampleId = 0;

for (const { dir, mode } of MODE_DIRS) {
    // findings publicados por (modelId, caseId), para as paginas de trace
    const findingsIndex = new Map();
    for (const { data } of readModeDir('submissions', dir)) {
        const modelId = data.run?.model?.id;
        for (const r of data.results || []) findingsIndex.set(`${modelId}::${r.caseId}`, r.findings || []);
    }

    for (const { file, data: sc } of readModeDir('scorecards', dir)) {
        const run = sc.run || {};
        const modelId = run.model?.id;
        if (!modelId) {
            console.warn(`  ⚠ sem run.model.id: ${dir}/${file}`);
            continue;
        }
        if (run.mode && run.mode !== mode) {
            console.warn(`  ⚠ ${dir}/${file} declara mode=${run.mode}, pasta diz ${mode}; vale a pasta`);
        }
        const scored = (sc.cases || []).filter((c) => c.status === 'scored');
        if (!scored.length) continue;
        const key = `${mode}::${modelId}`;
        const price = PRICING.models[modelId] || null;
        const accessPath = run.model?.accessPath || 'unknown';

        const byLanguage = {};
        const byRepo = {};
        const bySize = {};
        const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, { matched: 0, goldens: 0 }]));
        const CANONICAL_CATEGORIES = new Set(['bug', 'performance', 'security']);
        const findingsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
        const findingsByCategory = { bug: 0, performance: 0, security: 0, other: 0 };

        for (const c of scored) {
            const m = c.metrics;
            const { repo, language } = classify(c.caseId);
            const size = PR_SIZE[c.caseId] || null;
            const tp = m.tpFindings ?? 0;
            const fp = m.fpFindings ?? 0;
            for (const [bucket, name] of [
                [byLanguage, language],
                [byRepo, repo],
                ...(size ? [[bySize, size.sizeBucket]] : []),
            ]) {
                bucket[name] = bucket[name] || { matched: 0, goldens: 0, tp: 0, fp: 0, count: 0 };
                bucket[name].matched += m.matched;
                bucket[name].goldens += m.goldens;
                bucket[name].tp += tp;
                bucket[name].fp += fp;
                bucket[name].count += 1;
            }

            const matchedGoldens = m.matchedGoldens || [];
            const missedGoldens = m.missedGoldens || [];
            for (const g of matchedGoldens) if (bySeverity[g.severity]) { bySeverity[g.severity].matched += 1; bySeverity[g.severity].goldens += 1; }
            for (const g of missedGoldens) if (bySeverity[g.severity]) bySeverity[g.severity].goldens += 1;

            const findings = findingsIndex.get(`${modelId}::${c.caseId}`) || [];
            for (const f of findings) {
                const sev = (f.severity || '').toLowerCase();
                if (sev in findingsBySeverity) findingsBySeverity[sev] += 1;
                const cat = (f.category || '').toLowerCase();
                findingsByCategory[CANONICAL_CATEGORIES.has(cat) ? cat : 'other'] += 1;
            }

            // Ordem do gold (issueId), achado ou nao, pro /compare e pro trace.
            const goldensDetail = [
                ...matchedGoldens.map((g) => ({ ...g, matched: true })),
                ...missedGoldens.map((g) => ({ ...g, matched: false })),
            ].sort((a, b) => a.issueId.localeCompare(b.issueId));

            const costUsd = round4(costOfUsage(c.usage, price));
            allSamples.push({
                id: `s${sampleId++}`,
                entryKey: key,
                mode,
                modelId,
                caseId: c.caseId,
                repo,
                language,
                filesChanged: size?.filesChanged ?? null,
                linesChanged: size?.linesChanged ?? null,
                sizeBucket: size?.sizeBucket ?? null,
                recall: m.recall,
                precision: m.precision,
                goldens: m.goldens,
                matched: m.matched,
                comments: m.findings ?? findings.length,
                tpFindings: tp,
                fpFindings: fp,
                findings,
                goldensDetail,
                usage: c.usage || null,
                calls: c.calls ?? null,
                costUsd,
            });
            caseIndex.push({
                entryKey: key,
                caseId: c.caseId,
                repo,
                language,
                sizeBucket: size?.sizeBucket ?? null,
                goldens: m.goldens,
                matched: m.matched,
                tpFindings: tp,
                fpFindings: fp,
                costUsd,
            });
        }

        const finalize = (bucket) =>
            Object.fromEntries(
                Object.entries(bucket).map(([k, v]) => [
                    k,
                    {
                        recall: v.goldens ? (v.matched / v.goldens) * 100 : 0,
                        precision: v.tp + v.fp ? (v.tp / (v.tp + v.fp)) * 100 : null,
                        goldens: v.goldens,
                        matched: v.matched,
                        count: v.count,
                    },
                ]),
            );

        const a = sc.aggregate || {};
        const recall = a.recallMicro ?? 0;
        const precision = a.precisionMicro ?? 0;
        const usage = {
            inputTokens: 0, outputTokens: 0, reasoningTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
            ...(a.usage || {}),
        };
        const costTotal = costOfUsage(usage, price);
        const cases = a.casesScored ?? scored.length;
        const goldensMatched = a.goldensMatched ?? 0;
        const ci = bootstrapCI(scored);

        entries.push({
            key,
            mode,
            modelId,
            provider: run.model?.provider || null,
            accessPath,
            harness: run.harness?.name || 'unknown',
            harnessVersion: run.harness?.version || null,
            executionMode: run.executionMode || 'unknown',
            reasoningConfig: run.reasoning?.config || 'unknown',
            reasoningEffort: run.reasoning?.effortRequested || null,
            judge: sc.judge?.model || null,
            gold: sc.judge?.gold || null,
            benchmarkVersion: sc.benchmarkVersion || null,
            runAt: run.runAt || null,

            recall: recall * 100,
            precision: precision * 100,
            f1: (a.f1Micro ?? fScore(precision, recall, 1)) * 100,
            f2: (a.f2Micro ?? fScore(precision, recall, 2)) * 100,
            recallMacro: (a.recallMacro ?? 0) * 100,
            precisionMacro: (a.precisionMacro ?? 0) * 100,
            ciLow: ci.lo,
            ciHigh: ci.hi,

            goldensTotal: a.goldensTotal ?? 0,
            goldensMatched,
            comments: a.comments ?? 0,
            cases,
            calls: a.calls ?? null,
            usage,

            byLanguage: finalize(byLanguage),
            byRepo: finalize(byRepo),
            bySize: finalize(bySize),
            bySeverity: Object.fromEntries(
                SEVERITIES.map((s) => [s, { ...bySeverity[s], recall: bySeverity[s].goldens ? (bySeverity[s].matched / bySeverity[s].goldens) * 100 : null }]),
            ),
            findingsBySeverity,
            findingsByCategory,

            costTotal: costTotal == null ? null : Math.round(costTotal * 100) / 100,
            costPerPR: costTotal == null || !cases ? null : round4(costTotal / cases),
            costPerBugFound: costTotal == null || !goldensMatched ? null : round4(costTotal / goldensMatched),
            // 'api-equivalent': rodou por assinatura, custo e o preco de tabela
            // da API para os mesmos tokens. Nunca null por ser assinatura.
            costBasis: price ? (accessPath === 'subscription' ? 'api-equivalent' : 'api') : 'unpriced',
            costNote: price?.costNote || null,
            priceSource: price?.source || null,
            price: price
                ? { input: price.input, cacheRead: price.cacheRead, cacheWrite: price.cacheWrite, output: price.output }
                : null,
        });
    }
}

if (!entries.length) {
    console.error(`nenhum scorecard em ${IN_DIR}/scorecards/{light,heavy}`);
    process.exit(1);
}

// Rank dentro do modo, por F2 (o ranking que o site publica).
for (const { mode } of MODE_DIRS) {
    entries
        .filter((e) => e.mode === mode)
        .sort((a, b) => b.f2 - a.f2)
        .forEach((e, i) => (e.rank = i + 1));
}
entries.sort((a, b) => (a.mode === b.mode ? a.rank - b.rank : a.mode === 'balanced' ? -1 : 1));

// Custo e quatro casas fora do round2 generico.
const COST_KEYS = new Set(['costPerPR', 'costPerBugFound', 'costUsd', 'price']);
function roundEntry(e) {
    const out = round2(e);
    for (const k of COST_KEYS) if (k in e) out[k] = e[k];
    return out;
}

const avgOf = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const averages = Object.fromEntries(
    MODE_DIRS.map(({ mode }) => {
        const es = entries.filter((e) => e.mode === mode);
        return [mode, round2({
            recall: avgOf(es.map((e) => e.recall)),
            precision: avgOf(es.map((e) => e.precision)),
            f1: avgOf(es.map((e) => e.f1)),
            f2: avgOf(es.map((e) => e.f2)),
        })];
    }),
);

const leaderboard = { entries: entries.map(roundEntry), averages };

const runAts = entries.map((e) => e.runAt).filter(Boolean).sort();
const meta = {
    totalEntries: entries.length,
    totalModels: new Set(entries.map((e) => e.modelId)).size,
    modes: MODE_DIRS.map((m) => m.mode).filter((m) => entries.some((e) => e.mode === m)),
    entriesByMode: Object.fromEntries(MODE_DIRS.map(({ mode }) => [mode, entries.filter((e) => e.mode === mode).length])),
    models: [...new Set(entries.map((e) => e.modelId))].sort(),
    harnesses: [...new Set(entries.map((e) => e.harness))].sort(),
    languages: [...new Set(allSamples.map((s) => s.language))].sort(),
    repos: [...new Set(allSamples.map((s) => s.repo))].sort(),
    sizes: SIZE_ORDER.filter((s) => allSamples.some((sample) => sample.sizeBucket === s)),
    accessPaths: [...new Set(entries.map((e) => e.accessPath))].sort(),
    judges: [...new Set(entries.map((e) => e.judge).filter(Boolean))].sort(),
    gold: [...new Set(entries.map((e) => e.gold).filter(Boolean))].sort(),
    benchmarkVersion: entries[0].benchmarkVersion,
    totalCases: Math.max(...entries.map((e) => e.cases)),
    totalGoldens: Math.max(...entries.map((e) => e.goldensTotal)),
    pricesCollectedAt: PRICING._meta?.collectedAt || null,
    firstRunAt: runAts[0] || null,
    lastRunAt: runAts[runAts.length - 1] || null,
    generatedAt: new Date().toISOString(),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'leaderboard.json'), JSON.stringify(leaderboard, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'samples.json'), JSON.stringify(allSamples.map(roundEntry)));
fs.writeFileSync(path.join(OUT_DIR, 'case-index.json'), JSON.stringify(caseIndex));

console.log(`✅ ${entries.length} entrada(s), ${meta.totalModels} modelo(s), ${allSamples.length} amostras`);
for (const e of entries) {
    const money = e.costPerPR != null
        ? `$${e.costPerPR.toFixed(3)}/PR · $${e.costPerBugFound?.toFixed(3) ?? '—'}/bug (${e.costBasis})`
        : `custo n/a (${e.costBasis})`;
    console.log(
        `   [${e.mode}] #${e.rank} ${e.modelId} F2 ${e.f2.toFixed(1)} · R ${e.recall.toFixed(1)} · P ${e.precision.toFixed(1)} ` +
            `(${e.goldensMatched}/${e.goldensTotal}, ${e.comments} comments) · ${money}`,
    );
}
console.log(`→ ${path.relative(process.cwd(), OUT_DIR) || '.'}`);
