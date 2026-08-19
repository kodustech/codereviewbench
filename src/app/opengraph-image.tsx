import { ImageResponse } from 'next/og';
import leaderboardData from '@/lib/data/leaderboard.json';
import meta from '@/lib/data/meta.json';
import type { LeaderboardData } from '@/lib/types';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'CodeReviewBench — AI Code Review Benchmark';

const lb = leaderboardData as unknown as LeaderboardData;

// Cores do tema (Lumen) convertidas de OKLCH pra hex: satori nao resolve
// oklch() nem var(). Mesma conversao usada nos badges.
const BG = '#05070d';
const SURFACE = '#0c0f16';
const INK = '#f0f2f6';
const MUTED = '#8f9298';
const ACCENT = '#ff8c3f';

export default async function Image() {
  const top = [...lb.entries].sort((a, b) => b.f1 - a.f1).slice(0, 3);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: BG, padding: 64, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 26, color: ACCENT, letterSpacing: 3, fontWeight: 700 }}>
            CODEREVIEWBENCH
          </div>
          <div style={{ display: 'flex', fontSize: 68, color: INK, marginTop: 20, lineHeight: 1.1, maxWidth: 900 }}>
            AI Code Review Benchmark
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: MUTED, marginTop: 22, maxWidth: 950, lineHeight: 1.4 }}>
            {meta.totalCases} real merged pull requests · {meta.totalGoldens} human-reported bugs · {meta.totalEntries} models
          </div>
        </div>

        <div style={{ display: 'flex', gap: 18 }}>
          {top.map((e, i) => (
            <div key={e.key} style={{ display: 'flex', flexDirection: 'column', background: SURFACE, borderRadius: 14, padding: '20px 26px', flex: 1 }}>
              <div style={{ display: 'flex', fontSize: 20, color: MUTED }}>{`0${i + 1}`}</div>
              <div style={{ display: 'flex', fontSize: 30, color: INK, marginTop: 6 }}>{e.modelId.replace('@fireworks', '')}</div>
              <div style={{ display: 'flex', fontSize: 38, color: i === 0 ? ACCENT : INK, marginTop: 10, fontWeight: 700 }}>
                F1 {e.f1.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
