import { ImageResponse } from 'next/og';
import meta from '@/lib/data/meta.json';
import { entriesOf } from '@/lib/entries';
import { displayNameOf } from '@/lib/constants';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'CodeReviewBench: AI Code Review Benchmark';

// Tema Instrument (design.md) em hex literal: satori nao resolve var().
// Mesma composicao do hero da home: titulo, uma frase e a tabela num painel
// que some no canvas embaixo. Laranja so no 1o colocado.
const CANVAS = '#08090a';
const PANEL = '#0f1011';
const EDGE = 'rgba(255, 255, 255, 0.08)';
const HEADING = '#f7f8f8';
const SILVER = '#d0d6e0';
const SLATE = '#8a8f98';
const GRAPHITE = '#7a7f87';
const SIGNAL = '#f0902a';

export default async function Image() {
  // A 5a linha fica embaixo da vinheta, como as ultimas da tabela na home.
  const rows = entriesOf('balanced').slice(0, 5);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: CANVAS, padding: '56px 72px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: SLATE }}>
          <div style={{ display: 'flex', color: SILVER }}>CodeReviewBench</div>
          <div style={{ display: 'flex' }}>codereviewbench.com</div>
        </div>

        <div style={{ display: 'flex', fontSize: 66, color: HEADING, marginTop: 34, letterSpacing: -1.5, lineHeight: 1 }}>
          AI code review benchmark
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: SLATE, marginTop: 18 }}>
          {`Which models catch real bugs, on ${meta.totalCases} merged PRs with ${meta.totalGoldens} confirmed bugs.`}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 40,
            flexGrow: 1,
            background: PANEL,
            border: `1px solid ${EDGE}`,
            borderBottom: 'none',
            borderRadius: '16px 16px 0 0',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', padding: '14px 28px', borderBottom: `1px solid ${EDGE}`, fontSize: 15, color: GRAPHITE, letterSpacing: 1 }}>
            <div style={{ display: 'flex', width: 70 }}>#</div>
            <div style={{ display: 'flex', flexGrow: 1 }}>MODEL</div>
            <div style={{ display: 'flex', width: 150, justifyContent: 'flex-end' }}>F2</div>
            <div style={{ display: 'flex', width: 170, justifyContent: 'flex-end' }}>RECALL</div>
          </div>
          {rows.map((e, i) => (
            <div
              key={e.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 28px',
                height: 58,
                borderBottom: `1px solid ${EDGE}`,
                borderLeft: i === 0 ? `3px solid ${SIGNAL}` : '3px solid transparent',
                fontSize: 24,
              }}
            >
              <div style={{ display: 'flex', width: 67, color: GRAPHITE, fontSize: 20 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ display: 'flex', flexGrow: 1, color: HEADING }}>{displayNameOf(e.modelId)}</div>
              <div style={{ display: 'flex', width: 150, justifyContent: 'flex-end', color: i === 0 ? SIGNAL : HEADING }}>{e.f2.toFixed(1)}</div>
              <div style={{ display: 'flex', width: 170, justifyContent: 'flex-end', color: SILVER }}>{`${e.recall.toFixed(1)}%`}</div>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 120,
              backgroundImage: `linear-gradient(to bottom, rgba(8, 9, 10, 0), ${CANVAS})`,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
