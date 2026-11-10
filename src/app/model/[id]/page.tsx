import samplesData from '@/lib/data/samples.json';
import { displayNameOf, modelSlug, MODE_LABELS } from '@/lib/constants';
import { lb, entryFor, entriesOf, publishedModelIds, MODES } from '@/lib/entries';
import type { CaseSample, ReviewMode } from '@/lib/types';
import { notFound } from 'next/navigation';
import ModelDetailClient, { type ModelCaseRow } from './ModelDetailClient';

const allCases = samplesData as unknown as CaseSample[];

export function generateStaticParams() {
  return publishedModelIds().map((id) => ({ id: modelSlug(id) }));
}

function resolve(slug: string): string | undefined {
  return publishedModelIds().find((id) => modelSlug(id) === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = resolve(id);
  if (!modelId) return { title: displayNameOf(id) };
  const name = displayNameOf(modelId);
  const parts = MODES.map((m) => {
    const e = entryFor(modelId, m);
    return e ? `${MODE_LABELS[m]}: F2 ${e.f2.toFixed(1)}, recall ${e.recall.toFixed(1)}%, precision ${e.precision.toFixed(1)}%` : null;
  }).filter(Boolean);
  return {
    title: `${name} — AI Code Review Benchmark Results`,
    description: `How well does ${name} review code? Measured on 30 real merged PRs. ${parts.join('. ')}.`,
    alternates: { canonical: `/model/${modelSlug(modelId)}` },
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const modelId = resolve(id);
  if (!modelId) notFound();

  const entries = Object.fromEntries(
    MODES.map((m) => [m, entryFor(modelId, m) ?? null]),
  ) as Record<ReviewMode, ReturnType<typeof entryFor> | null>;

  // One row per PR with both modes zipped by gold issueId. Comment text stays
  // on the trace pages; this page only carries counts and gold text.
  const byCase = new Map<string, ModelCaseRow>();
  for (const c of allCases) {
    if (c.modelId !== modelId) continue;
    const row =
      byCase.get(c.caseId) ??
      ({ caseId: c.caseId, repo: c.repo, language: c.language, sizeBucket: c.sizeBucket, runs: {}, goldens: [] } as ModelCaseRow);
    row.runs[c.mode] = {
      matched: c.matched,
      goldens: c.goldens,
      comments: c.comments,
      tp: c.tpFindings,
      fp: c.fpFindings,
      costUsd: c.costUsd,
    };
    for (const g of c.goldensDetail) {
      let gr = row.goldens.find((x) => x.issueId === g.issueId);
      if (!gr) {
        gr = { issueId: g.issueId, text: g.text, severity: g.severity, found: {} };
        row.goldens.push(gr);
      }
      gr.found[c.mode] = g.matched;
    }
    byCase.set(c.caseId, row);
  }
  const cases = [...byCase.values()].sort((a, b) => a.caseId.localeCompare(b.caseId));
  for (const r of cases) r.goldens.sort((a, b) => a.issueId.localeCompare(b.issueId));

  const modeTotals = Object.fromEntries(MODES.map((m) => [m, entriesOf(m).length])) as Record<ReviewMode, number>;
  const others = Object.fromEntries(
    MODES.map((m) => [m, entriesOf(m).filter((e) => e.modelId !== modelId).map((e) => e.modelId)]),
  ) as Record<ReviewMode, string[]>;

  return (
    <ModelDetailClient
      modelId={modelId}
      entries={entries}
      averages={lb.averages}
      modeTotals={modeTotals}
      others={others}
      cases={cases}
    />
  );
}
