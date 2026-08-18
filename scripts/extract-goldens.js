#!/usr/bin/env node
// One-off extraction: pull the full golden-bug list (text + severity) per case
// from the kodus-ai-bench dataset fixtures. Needed for the /compare view — the
// scorecard only stores MISSED goldens, not which ones were matched, so there's
// no way to say "model A found bug X that model B missed" without the full list
// to diff against. Re-run and diff against the committed goldens.json whenever
// the case set changes.
//
//   node scripts/extract-goldens.js <path-to-datasets-dir> > goldens.json

const fs = require('fs');
const path = require('path');

const DATASET_DIR = process.argv[2];
if (!DATASET_DIR) {
    console.error('usage: node scripts/extract-goldens.js <path-to-datasets-dir>');
    process.exit(1);
}

const results = {};
const files = fs.readdirSync(DATASET_DIR).filter((f) => f.endsWith('.json'));

for (const f of files) {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(path.join(DATASET_DIR, f), 'utf8'));
    } catch {
        continue;
    }
    for (const row of Array.isArray(data) ? data : [data]) {
        const caseId = row?.vars?.caseId;
        if (!caseId) continue;
        let goldens;
        try {
            goldens = JSON.parse(row.vars.goldenComments || '[]');
        } catch {
            continue;
        }
        results[caseId] = goldens.map((g) => ({
            text: g.comment || g.text || '',
            severity: g.severity || null,
        }));
    }
}

console.log(JSON.stringify(results, null, 2));
