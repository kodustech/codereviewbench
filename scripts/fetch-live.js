#!/usr/bin/env node
// Gera src/lib/data/live.json, o dado da pagina /live: quanto do que cada
// modelo sugere em PR de time real acaba aplicado, no Kodus Cloud.
//
//   SEO_COPILOT_MCP_TOKEN=mcp_... node scripts/fetch-live.js
//
// Le o warehouse da Kodus pela tool runWarehouseQuery do MCP do seo-copilot
// (unico caminho de leitura de fora da VPC). O repo e PUBLICO, entao o JSON
// so leva TAXA e RAZAO por modelo: nenhuma contagem de PR, sugestao ou
// organizacao, nem participacao de cada modelo. Volume e numero de cliente
// sao dado da empresa, nao do benchmark. Cada linha de modelo vem de pelo
// menos MIN_ORGS organizacoes, e nome de modelo digitado por time nao sai.
//
// Roda todo dia pelo .github/workflows/live-data.yml. Quando o numero nao
// mudou, o arquivo nao e reescrito (o generatedAt sozinho nao vira commit).
const fs = require('fs');
const path = require('path');

const MCP_URL = process.env.SEO_COPILOT_MCP_URL || 'https://growth.kodus.io/api/mcp';
const TOKEN = process.env.SEO_COPILOT_MCP_TOKEN;
const OUT_PATH = path.join(__dirname, '..', 'src', 'lib', 'data', 'live.json');
const MODELS_PATH = path.join(__dirname, '..', 'live-models.json');

// Semanas fechadas (segunda a domingo, UTC) da janela. So conta semana em que
// a organizacao nao mexeu no modelo (ver ORGS_SQL).
const WEEKS = 12;
// Modelo aparece com pelo menos isto de organizacoes com taxa propria. Uma so
// seria o numero de um cliente.
const MIN_ORGS = 2;
// Aparece com pelo menos MIN_PRS PRs revisados; abaixo disso a taxa e ruido.
const MIN_PRS = 50;
// Entra no ranking com pelo menos isto de PRs revisados; abaixo, a linha
// aparece sem posicao. Mesmo numero da coluna que o leitor ve.
const RANK_MIN_PRS = 500;
// PRs revisados por modelo saem como piso de faixa, nunca o numero exato:
// somar a coluna exata daria o volume de review da empresa.
const REVIEW_FLOORS = [10000, 5000, 2500, 1000, 500, 250, 100, 50];
// Taxa de uma organizacao so entra na mediana com isto de sugestoes.
const MIN_SUGGESTIONS = 10;

// A org da propria Kodus e o backup anonimo de PRs nao sao uso de cliente.
// Por nome exato: o filtro por "kodus" no nome pegava org de teste de cliente.
const INTERNAL = `SELECT org_id FROM marts.mart_dim_orgs WHERE org_name IN ('Kodus', 'BKP PRs Anonymous - Kodus')`;

const W0 = `(date_trunc('week', now()) - interval '${WEEKS} weeks')`;

// Uma linha por organizacao (sem id): o modelo de review configurado, PRs
// revisados e sugestoes postadas/aplicadas nas semanas que contam.
//
// - PR revisado = execucao do Automated Code Review que terminou (success ou
//   partial_error), um por PR por semana. NAO usar reviewed_prs do
//   mart_org_weekly_metrics: conta PR aberto, inclusive os pulados.
// - Aplicada = o produto comparou o push seguinte com a sugestao e marcou
//   implemented ou partially_implemented.
// - O warehouse so guarda a config de modelo ATUAL, entao uma semana so conta
//   se comecou depois da ultima edicao dessa config: nela o modelo de hoje e
//   com certeza o que rodou. Conservador, nunca atribui ao modelo errado.
// - O slot e o de codeReview: o override da task quando existe, senao o
//   modelo padrao (libs/llm/llm-tasks.ts no kodus-ai).
const ORGS_SQL = `
WITH cfg AS (
  SELECT DISTINCT ON (organization_id) organization_id::text org_id, "updatedAt" cfg_upd,
    coalesce(
      (SELECT m->>'model' FROM jsonb_array_elements(cv->'models') m WHERE m->>'id' = cv->'routing'->'taskOverrides'->>'codeReview'),
      (SELECT m->>'model' FROM jsonb_array_elements(cv->'models') m WHERE m->>'id' = cv->'routing'->>'defaultModelId')
    ) model_raw
  FROM (
    SELECT organization_id, "updatedAt", "configValue"::jsonb cv
    FROM kodus_postgres.organization_parameters_sanitized WHERE "configKey" = 'byok_config'
  ) x
  ORDER BY organization_id, "updatedAt" DESC
),
rev AS (
  SELECT t.organization_id::text org_id, date_trunc('week', ae."createdAt")::date wk,
    count(DISTINCT ae."repositoryId" || '#' || ae."pullRequestNumber") prs
  FROM kodus_postgres.automation_execution ae
  JOIN kodus_postgres.team_automations ta ON ta.uuid = ae.team_automation_id
  JOIN kodus_postgres.teams t ON t.uuid = ta."teamUuid"
  JOIN kodus_postgres.automation a ON a.uuid = ta."automationUuid"
  WHERE a.name = 'Automated Code Review' AND lower(ae.status) IN ('success', 'partial_error')
    AND ae."createdAt" >= ${W0} AND ae."createdAt" < date_trunc('week', now())
  GROUP BY 1, 2
),
sug AS (
  SELECT s."organizationId"::text org_id, date_trunc('week', s."suggestionCreatedAt")::date wk, count(*) sent,
    count(*) FILTER (WHERE lower(s."suggestionImplementationStatus") IN ('implemented', 'partially_implemented')) impl
  FROM kodus_postgres_analytics.suggestions_mv s
  WHERE lower(s."suggestionDeliveryStatus") = 'sent'
    AND s."suggestionCreatedAt" >= ${W0} AND s."suggestionCreatedAt" < date_trunc('week', now())
  GROUP BY 1, 2
),
ow AS (
  SELECT coalesce(r.org_id, s.org_id) org_id, coalesce(r.wk, s.wk) wk,
    coalesce(r.prs, 0) prs, coalesce(s.sent, 0) sent, coalesce(s.impl, 0) impl
  FROM rev r FULL OUTER JOIN sug s ON s.org_id = r.org_id AND s.wk = r.wk
  WHERE coalesce(r.org_id, s.org_id) NOT IN (${INTERNAL})
)
SELECT c.model_raw,
  coalesce(sum(ow.prs) FILTER (WHERE ow.wk > c.cfg_upd), 0) prs,
  coalesce(sum(ow.sent) FILTER (WHERE ow.wk > c.cfg_upd), 0) sent,
  coalesce(sum(ow.impl) FILTER (WHERE ow.wk > c.cfg_upd), 0) impl
FROM ow JOIN cfg c ON c.org_id = ow.org_id
GROUP BY ow.org_id, c.model_raw
HAVING coalesce(sum(ow.prs) FILTER (WHERE ow.wk > c.cfg_upd), 0) > 0`;

async function query(sql) {
    const maxRows = 500;
    const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
            Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name: 'runWarehouseQuery', arguments: { sql, maxRows } },
        }),
    });
    const text = await res.text();
    // 403 em HTML vem do WAF do ALB (regra de SQL injection), nao do app:
    // UNION ALL, CASE ... THEN 1/0 e parecidos sao barrados no corpo do POST.
    if (res.status === 403) throw new Error(`WAF blocked the query (HTTP 403). Rewrite it without UNION ALL / CASE THEN 1/0.`);
    if (!res.ok) throw new Error(`MCP HTTP ${res.status}: ${text.slice(0, 300)}`);
    const msg = JSON.parse(text);
    if (msg.error) throw new Error(`MCP error: ${JSON.stringify(msg.error).slice(0, 300)}`);
    const out = JSON.parse(msg.result.content[0].text);
    if (!out.success) throw new Error(`Query failed: ${out.error || text.slice(0, 300)}`);
    if (out.rows.length >= maxRows) throw new Error(`Query hit ${maxRows} rows; the result would be truncated.`);
    return out.rows;
}

/** O nome que o time digitou → id canonico. Tira o que muda de rota pra rota
 *  e nao muda o modelo: prefixo de vendor/gateway, sufixo de snapshot, :free. */
function normalize(raw) {
    if (!raw) return null;
    let s = raw.trim().toLowerCase().replace(/^~/, '');
    s = s.split('/').pop(); // deepseek/..., accounts/fireworks/models/..., z-ai/...
    s = s.replace(/^(us|eu|apac)\./, '').replace(/^(anthropic|openai|moonshotai|meta|amazon|google)\./, ''); // Bedrock
    s = s.replace(/(\d)p(\d)/g, '$1.$2'); // Fireworks: v4p1 → v4.1
    s = s.replace(/[:-]free$/, '');
    s = s.replace(/-\d{8}$/, '').replace(/[:-]\d{4}$/, ''); // -20251001, -1017, :1017
    s = s.replace(/-preview.*$/, '');
    s = s.replace(/^claude-(opus|sonnet|haiku)-(\d+)-(\d+)$/, 'claude-$1-$2.$3');
    return s;
}

const num = (v) => Number(v) || 0;
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

function quantile(sorted, q) {
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function buildModels(orgRows, catalog) {
    const groups = new Map();
    for (const r of orgRows) {
        const id = normalize(r.model_raw);
        if (!id || !catalog[id]) continue; // alias, router ou nome do time: fora
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id).push(r);
    }

    const models = [];
    for (const [id, rows] of groups) {
        // Mediana entre organizacoes, nao a taxa somada: uma organizacao
        // grande sozinha nao define o numero do modelo.
        const rated = rows.filter((r) => num(r.sent) >= MIN_SUGGESTIONS);
        if (rated.length < MIN_ORGS) continue;
        const rates = rated.map((r) => (100 * num(r.impl)) / num(r.sent)).sort((a, b) => a - b);
        const perPR = rated.map((r) => num(r.sent) / Math.max(1, num(r.prs))).sort((a, b) => a - b);
        const reviews = rated.reduce((a, r) => a + num(r.prs), 0);
        if (reviews < MIN_PRS) continue;
        const reviewsAtLeast = REVIEW_FLOORS.find((f) => reviews >= f) ?? MIN_PRS;
        models.push({
            id,
            name: catalog[id].name,
            provider: catalog[id].provider,
            ranked: reviewsAtLeast >= RANK_MIN_PRS,
            applied: round(quantile(rates, 0.5)),
            suggestionsPerPR: round(quantile(perPR, 0.5), 2),
            reviewsAtLeast,
        });
    }
    // Ranqueados primeiro; dentro de cada grupo, pela taxa.
    return models.sort((a, b) => b.ranked - a.ranked || b.applied - a.applied);
}

function windowDates() {
    // Segunda da semana corrente (UTC), menos WEEKS semanas; termina no domingo
    // anterior. Mesmo recorte do date_trunc('week', now()) do SQL.
    const now = new Date();
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const from = new Date(monday);
    from.setUTCDate(from.getUTCDate() - 7 * WEEKS);
    const to = new Date(monday);
    to.setUTCDate(to.getUTCDate() - 1);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

async function main() {
    if (!TOKEN) {
        console.error('SEO_COPILOT_MCP_TOKEN is not set.');
        process.exit(1);
    }
    const catalog = JSON.parse(fs.readFileSync(MODELS_PATH, 'utf8')).models;
    const models = buildModels(await query(ORGS_SQL), catalog);

    const data = {
        generatedAt: new Date().toISOString(),
        source: 'Kodus Cloud',
        window: { weeks: WEEKS, ...windowDates() },
        thresholds: { minOrganizations: MIN_ORGS, minPRs: MIN_PRS, minPRsToRank: RANK_MIN_PRS, minSuggestionsPerOrganization: MIN_SUGGESTIONS },
        models,
    };

    // Sem mudanca de numero, sem commit: compara tudo menos o generatedAt.
    if (fs.existsSync(OUT_PATH)) {
        const prev = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
        const strip = (d) => JSON.stringify({ ...d, generatedAt: null });
        if (strip(prev) === strip(data)) {
            console.log('live.json unchanged.');
            return;
        }
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log(`live.json: ${models.length} models, ${data.window.from} to ${data.window.to}.`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
