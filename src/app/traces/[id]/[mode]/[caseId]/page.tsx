import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import samplesData from '@/lib/data/samples.json';
import type { CaseSample, ReviewMode } from '@/lib/types';
import { displayNameOf, providerOf, modelSlug, REPO_LABELS, LANGUAGE_LABELS, SIZE_LABELS, MODE_LABELS, MODE_DESCRIPTIONS, judgeLabel } from '@/lib/constants';
import { entryFor, isMode } from '@/lib/entries';
import { formatMoney } from '@/lib/format';
import ProviderLogo from '@/components/shared/ProviderLogo';
import Badge from '@/components/shared/Badge';

const allSamples = samplesData as unknown as CaseSample[];

/**
 * Trace of one run on one PR: the comments the model published (from the
 * submission) next to the gold bugs it found and missed (from the scorecard).
 * The scorecard counts which comments matched a gold bug but does not say
 * WHICH comment matched which bug, so the page shows the counts, not a
 * per-comment verdict.
 */
type Params = { id: string; mode: string; caseId: string };

function find({ id, mode, caseId }: Params): CaseSample | undefined {
  if (!isMode(mode)) return undefined;
  return allSamples.find((s) => modelSlug(s.modelId) === id && s.mode === mode && s.caseId === caseId);
}

export function generateStaticParams(): Params[] {
  return allSamples.map((s) => ({ id: modelSlug(s.modelId), mode: s.mode, caseId: s.caseId }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const p = await params;
  const s = find(p);
  if (!s) return { title: 'Trace not found' };
  const name = displayNameOf(s.modelId);
  return {
    title: `${name} (${MODE_LABELS[s.mode]}) on ${s.caseId}`,
    description: `${name} in ${MODE_LABELS[s.mode].toLowerCase()} mode on a real ${REPO_LABELS[s.repo] || s.repo} PR: ${s.comments} comments published, ${s.matched} of ${s.goldens} confirmed bugs found.`,
    alternates: { canonical: `/traces/${p.id}/${s.mode}/${s.caseId}` },
    // Hundreds of thin per-PR pages; the model and compare pages are what should rank.
    robots: { index: false, follow: true },
  };
}

export default async function TracePage({ params }: { params: Promise<Params> }) {
  const p = await params;
  const s = find(p);
  if (!s) notFound();
  const mode = s.mode as ReviewMode;
  const other: ReviewMode = mode === 'heavy' ? 'balanced' : 'heavy';
  const otherHasRun = allSamples.some((x) => x.modelId === s.modelId && x.mode === other && x.caseId === s.caseId);
  const entry = entryFor(s.modelId, mode);
  const name = displayNameOf(s.modelId);
  const provider = providerOf(s.modelId);
  const found = s.goldensDetail.filter((g) => g.matched);
  const missed = s.goldensDetail.filter((g) => !g.matched);

  const stats: [string, string][] = [
    ['Gold bugs found', `${s.matched} of ${s.goldens}`],
    ['Comments published', String(s.comments)],
    ['Comments matching a bug', String(s.tpFindings)],
    ['Comments not matching', String(s.fpFindings)],
    ['Cost of this PR', formatMoney(s.costUsd, 3)],
  ];

  return (
    <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Link
          href={`/model/${modelSlug(s.modelId)}`}
          className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <ArrowLeft className="size-4" /> {name}
        </Link>
        {otherHasRun && (
          <Link
            href={`/traces/${modelSlug(s.modelId)}/${other}/${s.caseId}`}
            className="text-sm font-mono text-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
          >
            Same PR in {MODE_LABELS[other].toLowerCase()} mode
          </Link>
        )}
      </div>

      <div className="mb-10 pb-8 border-b border-[var(--border)]">
        <span className="eyebrow block mb-3">Trace</span>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <ProviderLogo provider={provider} className="size-5" />
          <h1 className="text-2xl sm:text-3xl font-display text-[color:var(--foreground)]">
            {name} · {MODE_LABELS[mode]}
          </h1>
        </div>
        <p className="font-mono text-sm text-[color:var(--foreground)] break-all mb-2">{s.caseId}</p>
        <p className="text-xs font-mono text-[color:var(--muted)] uppercase tracking-widest">
          {REPO_LABELS[s.repo] || s.repo} · {LANGUAGE_LABELS[s.language] || s.language}
          {s.sizeBucket ? ` · ${SIZE_LABELS[s.sizeBucket] || s.sizeBucket}` : ''}
          {s.filesChanged != null ? ` · ${s.filesChanged} files` : ''}
        </p>
        <p className="text-xs text-[color:var(--muted)] mt-3">
          {MODE_DESCRIPTIONS[mode]} Judge: {judgeLabel(entry?.judge)}.
        </p>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-12">
        {stats.map(([k, v]) => (
          <div key={k} className="card-hairline p-4">
            <dt className="text-[10px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-2">{k}</dt>
            <dd className="font-mono text-lg tabular-nums text-[color:var(--foreground)]">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Published comments ({s.findings.length})
          </h2>
          <div className="space-y-2">
            {s.findings.map((f, i) => (
              <div key={i} className="text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {f.severity && <Badge variant="default">{f.severity}</Badge>}
                  {f.category && <Badge variant="default">{f.category}</Badge>}
                  {f.path && (
                    <span className="text-xs font-mono text-[color:var(--muted-dim)] break-all">
                      {f.path}
                      {f.startLine ? `:${f.startLine}` : ''}
                      {f.endLine && f.endLine !== f.startLine ? `-${f.endLine}` : ''}
                    </span>
                  )}
                </div>
                <p className="text-[color:var(--foreground-2)] leading-relaxed whitespace-pre-line">{f.description}</p>
              </div>
            ))}
            {s.findings.length === 0 && <p className="text-sm text-[color:var(--muted)]">No comments published on this PR.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Gold bugs found ({found.length})
          </h2>
          <div className="space-y-2 mb-8">
            {found.map((g) => (
              <div key={g.issueId} className="text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3 flex items-start gap-3">
                <Check className="size-4 shrink-0 mt-0.5 text-[color:var(--success)]" aria-label="found" />
                <div>
                  {g.severity && <span className="text-[10px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest block mb-1">{g.severity}</span>}
                  <span className="text-[color:var(--foreground-2)] leading-relaxed">{g.text}</span>
                </div>
              </div>
            ))}
            {found.length === 0 && <p className="text-sm text-[color:var(--muted)]">None.</p>}
          </div>
          <h2 className="text-xs font-mono text-[color:var(--muted-dim)] uppercase tracking-widest font-bold mb-4">
            Gold bugs missed ({missed.length})
          </h2>
          <div className="space-y-2">
            {missed.map((g) => (
              <div key={g.issueId} className="text-sm bg-[var(--background)] border border-[var(--border)] rounded-md p-3 flex items-start gap-3">
                <X className="size-4 shrink-0 mt-0.5 text-[color:var(--muted-dim)]" aria-label="missed" />
                <div>
                  {g.severity && <span className="text-[10px] font-mono text-[color:var(--muted-dim)] uppercase tracking-widest block mb-1">{g.severity}</span>}
                  <span className="text-[color:var(--foreground-2)] leading-relaxed">{g.text}</span>
                </div>
              </div>
            ))}
            {missed.length === 0 && <p className="text-sm text-[color:var(--muted)]">None.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
