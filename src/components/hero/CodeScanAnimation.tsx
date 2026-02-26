'use client';

import { useEffect, useRef } from 'react';

// Fake code lines with varying widths to look realistic
const CODE_LINES = [
  { w: 0.45, indent: 0, type: 'keyword' },
  { w: 0.65, indent: 1, type: 'normal' },
  { w: 0.55, indent: 1, type: 'normal' },
  { w: 0.30, indent: 2, type: 'normal' },
  { w: 0.70, indent: 2, type: 'bug' },
  { w: 0.40, indent: 2, type: 'normal' },
  { w: 0.25, indent: 1, type: 'normal' },
  { w: 0.00, indent: 0, type: 'blank' },
  { w: 0.50, indent: 0, type: 'keyword' },
  { w: 0.60, indent: 1, type: 'normal' },
  { w: 0.75, indent: 1, type: 'normal' },
  { w: 0.35, indent: 2, type: 'normal' },
  { w: 0.55, indent: 2, type: 'normal' },
  { w: 0.68, indent: 2, type: 'bug' },
  { w: 0.42, indent: 2, type: 'normal' },
  { w: 0.30, indent: 1, type: 'normal' },
  { w: 0.20, indent: 0, type: 'normal' },
  { w: 0.00, indent: 0, type: 'blank' },
  { w: 0.38, indent: 0, type: 'keyword' },
  { w: 0.58, indent: 1, type: 'normal' },
  { w: 0.48, indent: 1, type: 'normal' },
  { w: 0.62, indent: 2, type: 'bug' },
  { w: 0.35, indent: 2, type: 'normal' },
  { w: 0.28, indent: 1, type: 'normal' },
];

export default function CodeScanAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animate scan line position
    let frame: number;
    let scanY = -20;
    const speed = 0.35;
    const totalHeight = CODE_LINES.length * 22;

    const scanLine = container.querySelector('[data-scan]') as HTMLElement;
    const lines = container.querySelectorAll('[data-line]') as NodeListOf<HTMLElement>;
    const bugMarkers = container.querySelectorAll('[data-bug]') as NodeListOf<HTMLElement>;

    function animate() {
      scanY += speed;
      if (scanY > totalHeight + 40) {
        scanY = -20;
        // Reset all lines
        lines.forEach((l) => {
          l.style.opacity = '0.12';
          l.style.transform = 'scaleX(1)';
        });
        bugMarkers.forEach((b) => {
          b.style.opacity = '0';
          b.style.transform = 'scale(0)';
        });
      }

      if (scanLine) {
        scanLine.style.transform = `translateY(${scanY}px)`;
      }

      // Reveal lines as scan passes
      lines.forEach((l, i) => {
        const lineY = i * 22;
        if (scanY > lineY) {
          const isBug = l.dataset.isbug === 'true';
          l.style.opacity = isBug ? '0.9' : '0.3';
          l.style.transition = 'opacity 0.4s ease, transform 0.3s ease';
        }
      });

      // Show bug markers
      bugMarkers.forEach((b) => {
        const bugY = parseFloat(b.dataset.y || '0');
        if (scanY > bugY + 5) {
          b.style.opacity = '1';
          b.style.transform = 'scale(1)';
          b.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
      });

      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Editor chrome */}
      <div className="absolute inset-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-2xl shadow-black/20">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-[#f85149]/60" />
            <div className="size-2.5 rounded-full bg-[#d29922]/60" />
            <div className="size-2.5 rounded-full bg-[#3fb950]/60" />
          </div>
          <span className="text-[11px] font-mono text-[var(--muted-dim)] ml-2">review.diff</span>
        </div>

        {/* Code area */}
        <div className="relative px-5 py-4">
          {/* Line numbers gutter */}
          <div className="absolute left-0 top-0 w-10 h-full pt-4">
            {CODE_LINES.map((line, i) => (
              <div
                key={i}
                className="h-[22px] flex items-center justify-end pr-2 text-[11px] font-mono tabular-nums"
                style={{ color: 'var(--muted-dim)', opacity: 0.4 }}
              >
                {line.type !== 'blank' ? i + 1 : ''}
              </div>
            ))}
          </div>

          {/* Code lines */}
          <div className="ml-10">
            {CODE_LINES.map((line, i) => {
              if (line.type === 'blank') {
                return <div key={i} className="h-[22px]" data-line data-isbug="false" />;
              }
              const isBug = line.type === 'bug';
              return (
                <div
                  key={i}
                  className="h-[22px] flex items-center relative"
                  data-line
                  data-isbug={isBug.toString()}
                  style={{ opacity: 0.12, paddingLeft: line.indent * 20 }}
                >
                  {/* Diff marker */}
                  <span
                    className="w-3 text-[11px] font-mono shrink-0 mr-2"
                    style={{ color: isBug ? '#f85149' : i % 3 === 0 ? '#3fb950' : 'var(--muted-dim)' }}
                  >
                    {isBug ? '-' : i % 3 === 0 ? '+' : ' '}
                  </span>

                  {/* Code bar */}
                  <div
                    className="h-[3px] rounded-full"
                    style={{
                      width: `${line.w * 100}%`,
                      backgroundColor: line.type === 'keyword'
                        ? '#79c0ff'
                        : isBug
                        ? '#f85149'
                        : 'var(--muted-dim)',
                    }}
                  />

                  {/* Bug highlight background */}
                  {isBug && (
                    <div className="absolute inset-0 -mx-2 rounded bg-[#f8514910]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Scan line */}
          <div
            data-scan
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              top: 16,
              background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
              boxShadow: '0 0 20px var(--accent), 0 0 60px rgba(255, 107, 53, 0.15)',
              transform: 'translateY(-20px)',
            }}
          />

          {/* Bug markers (appear when scan finds bugs) */}
          {CODE_LINES.map((line, i) => {
            if (line.type !== 'bug') return null;
            return (
              <div
                key={`bug-${i}`}
                data-bug
                data-y={i * 22}
                className="absolute right-4 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f85149]/15 border border-[#f85149]/30"
                style={{
                  top: 16 + i * 22,
                  opacity: 0,
                  transform: 'scale(0)',
                }}
              >
                <div className="size-1.5 rounded-full bg-[#f85149] animate-pulse" />
                <span className="text-[10px] font-mono text-[#f85149] font-bold">bug</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Glow behind the card */}
      <div className="absolute -inset-10 bg-[var(--accent)] opacity-[0.02] blur-[80px] rounded-full pointer-events-none -z-10" />
    </div>
  );
}
