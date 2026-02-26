const fs = require('fs');
const path = require('path');

// ── Helpers ──

function parseJudgeMetrics(reason) {
  const metrics = {};
  const match = reason.match(/JUDGE_METRICS\s+(.+)/);
  if (!match) return null;
  const pairs = match[1].split(/\s+/);
  for (const pair of pairs) {
    const [key, val] = pair.split('=');
    if (key && val) metrics[key] = val === 'null' ? null : parseFloat(val);
  }
  return metrics;
}

function parseSonnetReasoning(reason) {
  const match = reason.match(/--- SONNET JUDGE ---\n([\s\S]*?)(?=--- GPT JUDGE ---|$)/);
  return match ? match[1].trim() : '';
}

function parseGptReasoning(reason) {
  const match = reason.match(/--- GPT JUDGE ---\n([\s\S]*?)$/);
  return match ? match[1].trim() : '';
}

function parseLineMetrics(reason) {
  const match = reason.match(
    /LINE_METRICS:\s+line_acc=([\d.]+)\s+avg_iou=([\d.]+)\s+exact_match=([\d.]+)\s+within3=([\d.]+)\s+matched=(\S+)/
  );
  if (!match) return null;
  return {
    lineAccuracy: parseFloat(match[1]),
    avgIou: parseFloat(match[2]),
    exactMatch: parseFloat(match[3]),
    within3: parseFloat(match[4]),
    matched: match[5],
  };
}

function parseResponseOutput(output) {
  try {
    const cleaned = output.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.codeSuggestions || parsed.suggestions || (Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

function avg(arr) {
  const valid = arr.filter((v) => v != null && !isNaN(v));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function getLanguage(vars, description) {
  const desc = (description || '');
  // Match by file extension in the description (most reliable)
  if (/\.tsx\b/.test(desc)) return 'typescript/react';
  if (/\.rb\b/.test(desc) || /app\//.test(desc) && desc.endsWith('.rb')) return 'ruby';
  if (/\.java\b/.test(desc)) return 'java';
  if (/\.py\b/.test(desc)) return 'python';
  if (/\.ts\b/.test(desc)) return 'typescript/node';
  // Fallback: inspect content
  const file = vars.fileContent || '';
  if (file.includes('import React') || file.includes('useState')) return 'typescript/react';
  if (file.includes('def ') && file.includes('self')) return 'python';
  if (file.includes('public class ') || file.includes('package ')) return 'java';
  if (/class\s+\w+/.test(file) && file.includes('def ') && file.includes('end')) return 'ruby';
  return 'typescript/node';
}

const MODEL_NAMES = {
  'anthropic:messages:claude-sonnet-4-5-20250929': {
    slug: 'claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
  },
  'anthropic:messages:claude-haiku-4-5-20251001': {
    slug: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'Anthropic',
  },
  'google:gemini-2.5-pro': {
    slug: 'gemini-2-5-pro',
    displayName: 'Gemini 2.5 Pro',
    provider: 'Google',
  },
  'google:gemini-3.1-pro-preview': {
    slug: 'gemini-3-1-pro',
    displayName: 'Gemini 3.1 Pro',
    provider: 'Google',
  },
  'google:gemini-3-flash-preview': {
    slug: 'gemini-3-flash',
    displayName: 'Gemini 3 Flash',
    provider: 'Google',
  },
  'openai:gpt-5.2': {
    slug: 'gpt-5-2',
    displayName: 'GPT-5.2',
    provider: 'OpenAI',
  },
  'openrouter:moonshotai/kimi-k2.5': {
    slug: 'kimi-k2-5',
    displayName: 'Kimi K2.5',
    provider: 'Moonshot AI',
  },
  'openrouter:z-ai/glm-5': {
    slug: 'glm-5',
    displayName: 'GLM-5',
    provider: 'Zhipu AI',
  },
};

function getModelInfo(providerId) {
  if (MODEL_NAMES[providerId]) return MODEL_NAMES[providerId];
  const name = providerId.split(':').pop().split('/').pop();
  return {
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    displayName: name,
    provider: providerId.split(':')[0],
  };
}

function trimFileContent(content, maxLines) {
  const lines = content.split('\n');
  if (lines.length <= maxLines) return content;
  return lines.slice(0, maxLines).join('\n') + '\n// ... truncated';
}

function buildHistogram(scores, buckets) {
  const hist = [];
  const step = 100 / buckets;
  for (let i = 0; i < buckets; i++) {
    const min = i * step;
    const max = (i + 1) * step;
    hist.push({
      min,
      max,
      count: scores.filter((s) => {
        const pct = s * 100;
        return pct >= min && (i === buckets - 1 ? pct <= max : pct < max);
      }).length,
    });
  }
  return hist;
}

// ── Main ──

const datasetDir = path.join(__dirname, 'datasets');
const filePaths = ['output-normal.json', 'output-crossfile.json'];

// Per-model accumulators
const modelAccum = {};
// All samples
const allSamples = [];
let sampleCounter = 0;

filePaths.forEach((filePath) => {
  const fullPath = path.join(datasetDir, filePath);
  if (!fs.existsSync(fullPath)) return;

  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const results =
    data.results && data.results.results
      ? data.results.results
      : Array.isArray(data.results)
        ? data.results
        : [];

  results.forEach((result) => {
    const providerId = result.provider.id || result.provider;
    const modelInfo = getModelInfo(providerId);

    if (!modelAccum[providerId]) {
      modelAccum[providerId] = {
        id: providerId,
        ...modelInfo,
        tests: 0,
        scores: [],
        localScores: [],
        crossFileScores: [],
        latencies: [],
        langScores: {},
        catScores: {},
        judges: {
          sonnet: { coverage: [], validity: [], scores: [] },
          gpt: { coverage: [], validity: [], scores: [] },
        },
        lineMetrics: { lineAccuracy: [], avgIou: [], exactMatch: [], within3: [] },
        apiErrors: 0,
        parseErrors: 0,
        judgeFails: 0,
        parseOkCount: 0,
        passCount: 0,
      };
    }

    const stats = modelAccum[providerId];
    stats.tests++;

    if (result.error) {
      stats.apiErrors++;
      return;
    }

    const components = (result.gradingResult && result.gradingResult.componentResults) || [];
    const judgeComp = components.find((c) => c.reason && c.reason.includes('JUDGE_METRICS'));
    const parseComp = components.find((c) => c.reason && c.reason.includes('PARSE_OK'));
    const lineComp = components.find((c) => c.reason && c.reason.includes('LINE_METRICS'));

    if (!judgeComp) {
      stats.judgeFails++;
      return;
    }

    const metrics = parseJudgeMetrics(judgeComp.reason);
    if (!metrics) return;

    const parseOk = parseComp ? parseComp.reason.includes('PARSE_OK') : false;
    if (parseOk) stats.parseOkCount++;

    const combinedScore = ((metrics.sonnet_score || 0) + (metrics.gpt_score || 0)) / 2;
    stats.scores.push(combinedScore);

    const isCrossFile = Boolean(result.vars && result.vars.crossFileContext);
    const category = isCrossFile ? 'cross-file' : 'local';

    if (isCrossFile) {
      stats.crossFileScores.push(combinedScore);
    } else {
      stats.localScores.push(combinedScore);
    }

    // By language
    const lang = getLanguage(result.vars || {}, result.testCase && result.testCase.description);
    if (!stats.langScores[lang]) stats.langScores[lang] = { scores: [], coverage: [], validity: [], count: 0 };
    stats.langScores[lang].scores.push(combinedScore);
    stats.langScores[lang].count++;

    // By category
    if (!stats.catScores[category])
      stats.catScores[category] = { scores: [], coverage: [], validity: [], count: 0 };
    stats.catScores[category].scores.push(combinedScore);
    stats.catScores[category].count++;

    if (result.latencyMs) stats.latencies.push(result.latencyMs);

    // Judge breakdowns
    if (metrics.sonnet_coverage != null) {
      stats.judges.sonnet.coverage.push(metrics.sonnet_coverage);
      stats.langScores[lang].coverage.push(metrics.sonnet_coverage);
      if (stats.catScores[category]) stats.catScores[category].coverage.push(metrics.sonnet_coverage);
    }
    if (metrics.gpt_coverage != null) {
      stats.judges.gpt.coverage.push(metrics.gpt_coverage);
      stats.langScores[lang].coverage.push(metrics.gpt_coverage);
      if (stats.catScores[category]) stats.catScores[category].coverage.push(metrics.gpt_coverage);
    }
    if (metrics.sonnet_validity != null) {
      stats.judges.sonnet.validity.push(metrics.sonnet_validity);
      stats.langScores[lang].validity.push(metrics.sonnet_validity);
      if (stats.catScores[category]) stats.catScores[category].validity.push(metrics.sonnet_validity);
    }
    if (metrics.gpt_validity != null) {
      stats.judges.gpt.validity.push(metrics.gpt_validity);
      stats.langScores[lang].validity.push(metrics.gpt_validity);
      if (stats.catScores[category]) stats.catScores[category].validity.push(metrics.gpt_validity);
    }
    if (metrics.sonnet_score != null) stats.judges.sonnet.scores.push(metrics.sonnet_score);
    if (metrics.gpt_score != null) stats.judges.gpt.scores.push(metrics.gpt_score);

    // Line metrics
    const lm = parseLineMetrics(lineComp ? lineComp.reason : '');
    if (lm) {
      stats.lineMetrics.lineAccuracy.push(lm.lineAccuracy);
      stats.lineMetrics.avgIou.push(lm.avgIou);
      stats.lineMetrics.exactMatch.push(lm.exactMatch);
      stats.lineMetrics.within3.push(lm.within3);
    }

    if (result.gradingResult && result.gradingResult.pass) stats.passCount++;

    // Build sample
    let referenceBugs = [];
    try {
      referenceBugs =
        typeof result.vars.referenceBugs === 'string'
          ? JSON.parse(result.vars.referenceBugs)
          : result.vars.referenceBugs || [];
    } catch {}

    const responseParsed = parseResponseOutput(result.response ? result.response.output : '');

    allSamples.push({
      id: `s-${sampleCounter++}`,
      modelSlug: modelInfo.slug,
      modelDisplayName: modelInfo.displayName,
      provider: modelInfo.provider,
      testDescription: (result.testCase && result.testCase.description) || '',
      lang,
      category,
      pass: (result.gradingResult && result.gradingResult.pass) || false,
      score: Math.round(combinedScore * 10000) / 100,
      latencyMs: result.latencyMs || 0,
      parseOk,
      prSummary: (result.vars && result.vars.prSummary) || '',
      fileContent: trimFileContent((result.vars && result.vars.fileContent) || '', 200),
      patch: (result.vars && result.vars.patchWithLinesStr) || '',
      referenceBugs,
      response: responseParsed.map((s) => ({
        relevantFile: s.relevantFile || '',
        language: s.language || '',
        suggestionContent: s.suggestionContent || '',
        existingCode: s.existingCode || '',
        improvedCode: s.improvedCode || '',
      })),
      responseRaw: ((result.response && result.response.output) || '').substring(0, 2000),
      judges: {
        sonnet: {
          score: (metrics.sonnet_score || 0) * 100,
          coverage: (metrics.sonnet_coverage || 0) * 100,
          validity: (metrics.sonnet_validity || 0) * 100,
          reasoning: parseSonnetReasoning(judgeComp.reason).substring(0, 1500),
        },
        gpt: {
          score: (metrics.gpt_score || 0) * 100,
          coverage: (metrics.gpt_coverage || 0) * 100,
          validity: (metrics.gpt_validity || 0) * 100,
          reasoning: parseGptReasoning(judgeComp.reason).substring(0, 1500),
        },
      },
      lineMetrics: lm,
      crossFileContext: isCrossFile
        ? ((result.vars && result.vars.crossFileContext) || '').substring(0, 1000) || null
        : null,
    });
  });
});

// ── Build leaderboard.json ──

const models = Object.values(modelAccum)
  .map((stats) => {
    const byLanguage = {};
    for (const [lang, data] of Object.entries(stats.langScores)) {
      byLanguage[lang] = {
        score: avg(data.scores) * 100,
        coverage: avg(data.coverage) * 100,
        validity: avg(data.validity) * 100,
        count: data.count,
      };
    }

    const byCategory = {};
    for (const [cat, data] of Object.entries(stats.catScores)) {
      byCategory[cat] = {
        score: avg(data.scores) * 100,
        coverage: avg(data.coverage) * 100,
        validity: avg(data.validity) * 100,
        count: data.count,
      };
    }

    return {
      slug: stats.slug,
      displayName: stats.displayName,
      provider: stats.provider,
      rank: 0,
      score: avg(stats.scores) * 100,
      coverage: avg([...stats.judges.sonnet.coverage, ...stats.judges.gpt.coverage]) * 100,
      validity: avg([...stats.judges.sonnet.validity, ...stats.judges.gpt.validity]) * 100,
      localScore: avg(stats.localScores) * 100,
      crossFileScore: avg(stats.crossFileScores) * 100,
      byLanguage,
      byCategory,
      judges: {
        sonnet: {
          coverage: avg(stats.judges.sonnet.coverage) * 100,
          validity: avg(stats.judges.sonnet.validity) * 100,
        },
        gpt: {
          coverage: avg(stats.judges.gpt.coverage) * 100,
          validity: avg(stats.judges.gpt.validity) * 100,
        },
      },
      histogram: buildHistogram(stats.scores, 10),
      latency: {
        p50: percentile(stats.latencies, 50),
        p90: percentile(stats.latencies, 90),
        p99: percentile(stats.latencies, 99),
      },
      parseRate: stats.tests > 0 ? (stats.parseOkCount / stats.tests) * 100 : 0,
      lineMetrics: {
        lineAccuracy: avg(stats.lineMetrics.lineAccuracy),
        avgIou: avg(stats.lineMetrics.avgIou),
        exactMatch: avg(stats.lineMetrics.exactMatch),
        within3: avg(stats.lineMetrics.within3),
      },
      tests: stats.tests,
      errors: stats.apiErrors + stats.parseErrors + stats.judgeFails,
      passRate: stats.tests > 0 ? (stats.passCount / stats.tests) * 100 : 0,
    };
  })
  .sort((a, b) => b.score - a.score);

// Assign ranks
models.forEach((m, i) => (m.rank = i + 1));

// Round numbers for smaller JSON
function round2(obj) {
  if (typeof obj === 'number') return Math.round(obj * 100) / 100;
  if (Array.isArray(obj)) return obj.map(round2);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = round2(v);
    return out;
  }
  return obj;
}

const leaderboardData = round2({
  models,
  averages: {
    score: avg(models.map((m) => m.score)),
    coverage: avg(models.map((m) => m.coverage)),
    validity: avg(models.map((m) => m.validity)),
    localScore: avg(models.map((m) => m.localScore)),
    crossFileScore: avg(models.map((m) => m.crossFileScore)),
  },
});

// ── Build meta.json ──

const allLangs = new Set();
const allCats = new Set();
allSamples.forEach((s) => {
  allLangs.add(s.lang);
  allCats.add(s.category);
});

const meta = {
  totalResults: allSamples.length,
  totalModels: models.length,
  totalTestCases: Math.max(...models.map((m) => m.tests)),
  languages: [...allLangs].sort(),
  categories: [...allCats].sort(),
  judges: ['sonnet', 'gpt'],
  generatedAt: new Date().toISOString(),
};

// ── Write files ──

const outDir = path.join(__dirname, 'src', 'lib', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));
fs.writeFileSync(path.join(outDir, 'leaderboard.json'), JSON.stringify(leaderboardData, null, 2));
fs.writeFileSync(path.join(outDir, 'samples.json'), JSON.stringify(allSamples));

const metaSize = fs.statSync(path.join(outDir, 'meta.json')).size;
const lbSize = fs.statSync(path.join(outDir, 'leaderboard.json')).size;
const samplesSize = fs.statSync(path.join(outDir, 'samples.json')).size;

console.log(`✓ meta.json     ${(metaSize / 1024).toFixed(1)} KB`);
console.log(`✓ leaderboard.json  ${(lbSize / 1024).toFixed(1)} KB`);
console.log(`✓ samples.json  ${(samplesSize / 1024).toFixed(1)} KB`);
console.log(`  ${meta.totalResults} samples, ${meta.totalModels} models, ${meta.languages.length} languages`);
