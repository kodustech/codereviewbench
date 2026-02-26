'use client';

import { cn } from '@/lib/utils';
import { FileCode2 } from 'lucide-react';
import type { ReferenceBug } from '@/lib/types';

interface DiffViewerProps {
  patch: string;
  referenceBugs?: ReferenceBug[];
  maxHeight?: string;
}

interface ParsedLine {
  type: 'file-header' | 'hunk-header' | 'hunk-label' | 'context' | 'added' | 'removed';
  lineNum: number | null;
  content: string;
  isBugLine: boolean;
}

function parseLines(patch: string, bugLines: Set<number>): ParsedLine[] {
  const raw = patch.split('\n');
  const result: ParsedLine[] = [];

  for (const line of raw) {
    if (!line.trim()) continue;

    if (line.startsWith('## file:')) {
      result.push({ type: 'file-header', lineNum: null, content: line.replace(/^## file:\s*/, '').replace(/'/g, ''), isBugLine: false });
      continue;
    }
    if (line.startsWith('@@')) {
      result.push({ type: 'hunk-header', lineNum: null, content: line, isBugLine: false });
      continue;
    }
    if (line.startsWith('__')) {
      result.push({ type: 'hunk-label', lineNum: null, content: line.replace(/_/g, '').trim() || '...', isBugLine: false });
      continue;
    }

    // Parse "63 +    code" or "63 -    code" or "63      code"
    const match = line.match(/^(\d+)\s*([+-])?\s?(.*)/);
    if (match) {
      const num = parseInt(match[1]);
      const sign = match[2];
      const code = match[3] || '';
      const type = sign === '+' ? 'added' : sign === '-' ? 'removed' : 'context';
      result.push({ type, lineNum: num, content: code, isBugLine: bugLines.has(num) });
    } else {
      result.push({ type: 'context', lineNum: null, content: line, isBugLine: false });
    }
  }
  return result;
}

export default function DiffViewer({ patch, referenceBugs = [], maxHeight = '500px' }: DiffViewerProps) {
  const bugLines = new Set<number>();
  referenceBugs.forEach((b) => {
    for (let l = b.relevantLinesStart; l <= b.relevantLinesEnd; l++) bugLines.add(l);
  });

  const lines = parseLines(patch, bugLines);

  return (
    <div className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden flex flex-col">
      {lines.map((line, i) => {
        if (line.type === 'file-header') {
          return (
            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-[#30363d] sticky top-0 z-10">
              <FileCode2 className="size-4 text-[#8b949e]" />
              <span className="text-xs font-mono text-[#e6edf3] font-semibold">{line.content}</span>
            </div>
          );
        }

        if (line.type === 'hunk-header') {
          return (
            <div key={i} className="px-4 py-1 bg-[#1f2937]/50 text-[#79c0ff] text-xs font-mono border-b border-[#30363d]">
              {line.content}
            </div>
          );
        }

        if (line.type === 'hunk-label') {
          return (
            <div key={i} className="px-4 py-0.5 bg-[#161b22] text-[#484f58] text-xs font-mono border-y border-[#30363d]">
              {line.content}
            </div>
          );
        }

        return (
          <div
            key={i}
            className={cn(
              'flex font-mono text-xs leading-6 group',
              line.type === 'added' && 'bg-[#12261e]',
              line.type === 'removed' && 'bg-[#2d1214]',
              line.isBugLine && 'ring-1 ring-inset ring-amber-500/40 bg-amber-500/10'
            )}
          >
            {/* Line number */}
            <span
              className={cn(
                'w-12 text-right pr-3 select-none tabular-nums shrink-0 border-r',
                line.type === 'added' && 'text-[#3fb950]/50 border-[#2ea04366]',
                line.type === 'removed' && 'text-[#f85149]/50 border-[#f8514966]',
                line.type === 'context' && 'text-[#484f58] border-[#30363d]',
              )}
            >
              {line.lineNum ?? ''}
            </span>

            {/* Sign column */}
            <span
              className={cn(
                'w-5 text-center select-none shrink-0',
                line.type === 'added' && 'text-[#3fb950]',
                line.type === 'removed' && 'text-[#f85149]',
              )}
            >
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>

            {/* Code */}
            <span
              className={cn(
                'flex-1 whitespace-pre pr-4',
                line.type === 'added' && 'text-[#aff5b4]',
                line.type === 'removed' && 'text-[#ffa198]',
                line.type === 'context' && 'text-[#e6edf3]',
              )}
            >
              {line.content}
            </span>

            {/* Bug indicator */}
            {line.isBugLine && (
              <span className="pr-3 text-amber-400 text-[10px] font-bold uppercase shrink-0 self-center">
                bug
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
