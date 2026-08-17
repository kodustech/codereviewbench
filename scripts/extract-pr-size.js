#!/usr/bin/env node
// One-off extraction: parse the CodeRabbit-style patchWithLinesStr embedded in the
// kodus-ai-bench dataset fixtures to compute real diff size per case (files changed,
// additions, deletions). No git checkout needed — the diff text is already frozen
// into the dataset JSON that the harness replays against.
//
//   node scripts/extract-pr-size.js <path-to-kodus-ai-bench>/evals/investigation/datasets > pr-size.json
//
// __new hunk__ lines are "<lineNum> <marker><content>" — marker '+' = added line,
// anything else = context (not counted). __old hunk__ lines have no line number,
// just "<marker><content>" — marker '-' = removed line, anything else = context.
// Re-run and diff against the committed pr-size.json whenever the case set changes.

const fs = require('fs');
const path = require('path');

const DATASET_DIR = process.argv[2];
if (!DATASET_DIR) {
    console.error('usage: node scripts/extract-pr-size.js <path-to-datasets-dir>');
    process.exit(1);
}

function countHunkLines(patch) {
    let additions = 0;
    let deletions = 0;
    let hunks = 0;
    let section = null; // 'new' | 'old' | null
    for (const line of patch.split('\n')) {
        if (line.startsWith('@@ ')) {
            hunks++;
            section = null;
            continue;
        }
        if (line === '__new hunk__') {
            section = 'new';
            continue;
        }
        if (line === '__old hunk__') {
            section = 'old';
            continue;
        }
        if (section === 'new') {
            const m = line.match(/^\d+ (.)/);
            if (m && m[1] === '+') additions++;
        } else if (section === 'old') {
            if (line.startsWith('-')) deletions++;
        }
    }
    return { additions, deletions, hunks };
}

function sizeBucket(linesChanged) {
    if (linesChanged < 30) return 'XS';
    if (linesChanged < 100) return 'S';
    if (linesChanged < 300) return 'M';
    if (linesChanged < 800) return 'L';
    return 'XL';
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
        let changedFiles;
        try {
            changedFiles = JSON.parse(row.vars.changedFiles);
        } catch {
            continue;
        }
        let additions = 0;
        let deletions = 0;
        let hunks = 0;
        for (const cf of changedFiles) {
            const stats = countHunkLines(cf.patchWithLinesStr || '');
            additions += stats.additions;
            deletions += stats.deletions;
            hunks += stats.hunks;
        }
        const linesChanged = additions + deletions;
        results[caseId] = {
            filesChanged: changedFiles.length,
            additions,
            deletions,
            linesChanged,
            hunks,
            sizeBucket: sizeBucket(linesChanged),
        };
    }
}

console.log(JSON.stringify(results, null, 2));
