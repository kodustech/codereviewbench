'use client';

import { cn } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { formatScore, formatLatency } from '@/lib/format';
import { LANGUAGE_LABELS, CATEGORY_LABELS } from '@/lib/constants';
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  GitPullRequest,
  Bug,
  Clock,
  Bot,
} from 'lucide-react';
import { useState } from 'react';
import DiffViewer from './DiffViewer';
import type { Sample } from '@/lib/types';

interface TraceCardProps {
  sample: Sample;
  defaultExpanded?: boolean;
}

export default function TraceCard({ sample, defaultExpanded = false }: TraceCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [judgeTab, setJudgeTab] = useState<'sonnet' | 'gpt'>('sonnet');

  return (
    <div className="border border-[#30363d] rounded-md bg-[#0d1117] overflow-hidden">
      {/* Summary Row — like a GitHub PR title */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#161b22] transition-colors text-left"
      >
        {sample.pass ? (
          <GitPullRequest className="size-4 text-[#3fb950] shrink-0" />
        ) : (
          <GitPullRequest className="size-4 text-[#f85149] shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-[#e6edf3] font-semibold truncate block">
            {sample.testDescription || sample.prSummary}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={sample.category === 'cross-file' ? 'blue' : 'default'}>
            {CATEGORY_LABELS[sample.category] || sample.category}
          </Badge>
          <Badge>{LANGUAGE_LABELS[sample.lang] || sample.lang}</Badge>
          <span className={cn(
            'text-xs font-mono font-bold tabular-nums px-2 py-0.5 rounded',
            sample.pass ? 'text-[#3fb950] bg-[#12261e]' : 'text-[#f85149] bg-[#2d1214]'
          )}>
            {formatScore(sample.score)}
          </span>
          <span className="text-xs font-mono text-[#484f58]">{formatLatency(sample.latencyMs)}</span>
          {expanded ? <ChevronUp className="size-4 text-[#484f58]" /> : <ChevronDown className="size-4 text-[#484f58]" />}
        </div>
      </button>

      {/* Expanded: GitHub-style PR view */}
      {expanded && (
        <div className="border-t border-[#30363d]">
          {/* PR description */}
          <div className="px-4 py-3 bg-[#161b22] border-b border-[#30363d] flex items-start gap-3">
            <MessageSquare className="size-4 text-[#8b949e] mt-0.5 shrink-0" />
            <p className="text-sm text-[#c9d1d9] leading-relaxed">{sample.prSummary}</p>
          </div>

          {/* Diff section */}
          {sample.patch && (
            <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '500px' }}>
              <DiffViewer
                patch={sample.patch}
                referenceBugs={sample.referenceBugs}
              />
            </div>
          )}

          {/* Model suggestions — styled like GitHub review comments */}
          {sample.response.length > 0 && (
            <div className="border-t border-[#30363d]">
              <div className="px-4 py-2 bg-[#161b22] border-b border-[#30363d] flex items-center gap-2">
                <Bot className="size-4 text-[#8b949e]" />
                <span className="text-xs font-semibold text-[#e6edf3]">{sample.modelDisplayName}</span>
                <span className="text-xs text-[#484f58]">suggested {sample.response.length} change{sample.response.length > 1 ? 's' : ''}</span>
              </div>

              {sample.response.map((s, i) => (
                <div key={i} className="border-b border-[#30363d] last:border-b-0">
                  {/* Comment body */}
                  <div className="px-4 py-3 bg-[#0d1117]">
                    <p className="text-sm text-[#c9d1d9] leading-relaxed mb-1">{s.suggestionContent}</p>
                    {s.relevantFile && (
                      <span className="text-xs font-mono text-[#484f58]">{s.relevantFile}</span>
                    )}
                  </div>

                  {/* Suggested change — GitHub-style diff block */}
                  {(s.existingCode || s.improvedCode) && (
                    <div className="mx-4 mb-3 border border-[#30363d] rounded-md overflow-hidden">
                      <div className="px-3 py-1 bg-[#161b22] border-b border-[#30363d] text-[10px] font-mono text-[#8b949e] uppercase tracking-wider font-bold">
                        Suggested change
                      </div>
                      {s.existingCode && (
                        <div className="bg-[#2d1214] font-mono text-xs">
                          {s.existingCode.split('\n').map((line, li) => (
                            <div key={li} className="flex leading-5">
                              <span className="w-5 text-center text-[#f85149]/60 select-none shrink-0">-</span>
                              <span className="text-[#ffa198] whitespace-pre pr-4">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.improvedCode && (
                        <div className="bg-[#12261e] font-mono text-xs">
                          {s.improvedCode.split('\n').map((line, li) => (
                            <div key={li} className="flex leading-5">
                              <span className="w-5 text-center text-[#3fb950]/60 select-none shrink-0">+</span>
                              <span className="text-[#aff5b4] whitespace-pre pr-4">{line}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reference bugs — like GitHub linked issues */}
          {sample.referenceBugs.length > 0 && (
            <div className="border-t border-[#30363d] px-4 py-3 bg-[#161b22]">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="size-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-[#e6edf3]">
                  Reference Bugs ({sample.referenceBugs.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sample.referenceBugs.map((b, i) => (
                  <span key={i} className="inline-flex items-center text-xs font-mono text-[#c9d1d9] bg-[#0d1117] border border-[#30363d] rounded-md px-2 py-1">
                    {b.relevantFile}
                    <span className="text-amber-400 ml-1">L{b.relevantLinesStart}–{b.relevantLinesEnd}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Judge evaluation — like GitHub CI checks */}
          <div className="border-t border-[#30363d]">
            <div className="px-4 py-2 bg-[#161b22] flex items-center justify-between border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-[#8b949e]" />
                <span className="text-xs font-semibold text-[#e6edf3]">Judge Evaluation</span>
              </div>
              <div className="flex rounded-md border border-[#30363d] overflow-hidden">
                {(['sonnet', 'gpt'] as const).map((j) => (
                  <button
                    key={j}
                    onClick={(e) => { e.stopPropagation(); setJudgeTab(j); }}
                    className={cn(
                      'px-3 py-1 text-xs font-mono font-semibold transition-all capitalize',
                      judgeTab === j
                        ? 'bg-[#1f6feb] text-white'
                        : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9]',
                      j === 'gpt' && 'border-l border-[#30363d]',
                    )}
                  >
                    {j === 'sonnet' ? 'Sonnet' : 'GPT'}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics bar */}
            <div className="grid grid-cols-3 divide-x divide-[#30363d] bg-[#0d1117]">
              {[
                { label: 'Score', value: sample.judges[judgeTab].score },
                { label: 'Coverage', value: sample.judges[judgeTab].coverage },
                { label: 'Validity', value: sample.judges[judgeTab].validity },
              ].map((m) => (
                <div key={m.label} className="px-4 py-3 text-center">
                  <span className={cn(
                    'text-lg font-bold font-mono tabular-nums',
                    m.value >= 80 ? 'text-[#3fb950]' : m.value >= 50 ? 'text-[#d29922]' : 'text-[#f85149]'
                  )}>
                    {formatScore(m.value)}
                  </span>
                  <p className="text-[10px] text-[#484f58] uppercase font-mono mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Reasoning */}
            {sample.judges[judgeTab].reasoning && (
              <div className="px-4 py-3 bg-[#0d1117] border-t border-[#30363d]">
                <div className="text-xs text-[#8b949e] leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap font-mono">
                  {sample.judges[judgeTab].reasoning}
                </div>
              </div>
            )}
          </div>

          {/* Footer metadata — like GitHub commit footer */}
          <div className="px-4 py-2 bg-[#161b22] border-t border-[#30363d] flex flex-wrap items-center gap-4 text-xs font-mono text-[#484f58]">
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {formatLatency(sample.latencyMs)}
            </span>
            <span>{sample.parseOk ? 'Parse OK' : 'Parse Failed'}</span>
            {sample.lineMetrics && (
              <>
                <span>LineAcc {(sample.lineMetrics.lineAccuracy * 100).toFixed(0)}%</span>
                <span>IoU {(sample.lineMetrics.avgIou * 100).toFixed(0)}%</span>
                <span>Matched {sample.lineMetrics.matched}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
