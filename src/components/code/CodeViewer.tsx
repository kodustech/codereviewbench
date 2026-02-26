'use client';

import { cn } from '@/lib/utils';
import { FileCode2 } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  filename?: string;
  highlightLines?: number[];
  maxHeight?: string;
}

export default function CodeViewer({
  code,
  filename = 'file',
  highlightLines = [],
  maxHeight = '600px',
}: CodeViewerProps) {
  const lines = code.split('\n');

  return (
    <div className="border border-[var(--border)] rounded-lg bg-[var(--background)] overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/5">
      <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCode2 className="size-4 text-[var(--muted)]" />
          <span className="text-xs font-mono text-[var(--muted)] tracking-widest font-bold uppercase">
            {filename}
          </span>
        </div>
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[var(--border)]" />
          <span className="size-2.5 rounded-full bg-[var(--border)]" />
          <span className="size-2.5 rounded-full bg-[var(--border)]" />
        </div>
      </div>
      <div
        className="overflow-y-auto font-mono text-sm leading-[1.7] text-[var(--muted)] custom-scrollbar py-4 bg-[var(--background)]"
        style={{ maxHeight }}
      >
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const cleanLine = line.replace(/^\d+:\s*/, '');
          const isAdded = cleanLine.startsWith('+');
          const isRemoved = cleanLine.startsWith('-');
          const isHighlighted = highlightLines.includes(lineNum);

          return (
            <div
              key={i}
              className={cn(
                'flex px-4 hover:bg-[var(--surface)] transition-colors',
                isAdded && 'bg-[#12261e] text-[#3fb950]',
                isRemoved && 'bg-[#2d1214] text-[#f85149]',
                isHighlighted && !isAdded && !isRemoved && 'bg-[#2d2204]/50'
              )}
            >
              <span className="w-12 text-[var(--border-bright)] select-none text-right pr-4 border-r border-[var(--border)] mr-4 tabular-nums text-xs leading-[1.7]">
                {lineNum}
              </span>
              <span className="whitespace-pre py-0.5">{cleanLine}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
