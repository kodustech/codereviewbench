#!/usr/bin/env node
// Gera um badge SVG estático por modelo publicado — pra README de quem quiser
// linkar o próprio harness pro resultado no bench. Estático (não uma rota de
// API) de propósito: o site já é gerado por build, um SVG a mais não precisa
// de servidor pra existir, funciona em qualquer host estático.
//
//   node scripts/generate-badges.js
//
// Le src/lib/data/leaderboard.json (já processado por process-scorecards.js)
// e escreve public/badge/<modelId>.svg. Rodar de novo sempre que o leaderboard
// mudar — os badges já publicados em READMEs de terceiros continuam no mesmo
// caminho, só o conteúdo do SVG muda.
const fs = require('fs');
const path = require('path');

const LEADERBOARD_PATH = path.join(__dirname, '..', 'src', 'lib', 'data', 'leaderboard.json');
const OUT_DIR = path.join(__dirname, '..', 'public', 'badge');

const CHAR_W = 6.3; // estimativa de largura por caractere em JetBrains Mono 11px
const PAD = 10;

function textWidth(s) {
    return Math.round(s.length * CHAR_W) + PAD * 2;
}

function badgeSvg(label, value, valueColor) {
    const labelW = textWidth(label);
    const valueW = textWidth(value);
    const w = labelW + valueW;
    const h = 20;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".08"/>
    <stop offset="1" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="r"><rect width="${w}" height="${h}" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${h}" fill="#0c0f16"/>
    <rect x="${labelW}" width="${valueW}" height="${h}" fill="${valueColor}"/>
    <rect width="${w}" height="${h}" fill="url(#s)"/>
  </g>
  <g text-anchor="middle" font-family="ui-monospace,'JetBrains Mono',monospace" font-size="11">
    <text x="${labelW / 2}" y="14" fill="#8f9298">${label}</text>
    <text x="${labelW + valueW / 2}" y="14" fill="#0c0f16" font-weight="700">${value}</text>
  </g>
</svg>`;
}

// Cores dos tokens do design.md (Lumen · Night Foundry), convertidas de OKLCH
// pra hex — SVG embutido em README de terceiros não pode depender de
// oklch()/var() (suporte inconsistente fora de browser moderno).
const ACCENT_HEX = '#ff8c3f'; // --accent oklch(76% 0.17 50)

function main() {
    const lb = JSON.parse(fs.readFileSync(LEADERBOARD_PATH, 'utf8'));
    fs.mkdirSync(OUT_DIR, { recursive: true });
    let count = 0;
    for (const e of lb.entries) {
        // Nome do arquivo usa o slug (`--`), nao o id cru: `@` num path de URL
        // 404a no Next. Mesma regra de modelSlug() em src/lib/constants.ts —
        // duplicada aqui porque este script e CommonJS puro, sem o alias `@/`.
        const slug = e.modelId.replace('@', '--');
        const svg = badgeSvg('codereviewbench', `${e.modelId} · F1 ${e.f1.toFixed(1)}`, ACCENT_HEX);
        fs.writeFileSync(path.join(OUT_DIR, `${slug}.svg`), svg);
        count += 1;
    }
    console.log(`✅ ${count} badge(s) → public/badge/`);
}

main();
