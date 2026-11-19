'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { live, formatDay } from '@/lib/live';
import { lb } from '@/lib/entries';
import { modelSlug } from '@/lib/constants';
import { cn } from '@/lib/utils';
import ProviderLogo from '@/components/shared/ProviderLogo';
import type { LiveModel } from '@/lib/types';

const th = 'px-5 py-3 text-[11px] font-mono font-normal text-[color:var(--muted-dim)] uppercase';
const { minOrganizations, minPRs, minPRsToRank, minSuggestionsPerOrganization } = live.thresholds;
const ranked = live.models.filter((m) => m.ranked);
const unranked = live.models.filter((m) => !m.ranked);
const benchIds = new Set(lb.entries.map((e) => e.modelId));

function LiveRow({ m, rank }: { m: LiveModel; rank?: number }) {
  const top = rank === 1;
  const name = (
    <span className="flex items-center gap-2.5">
      <ProviderLogo provider={m.provider} />
      <span className="flex flex-col gap-0.5">
        <span className={cn('text-[length:var(--text-body-sm)] font-semibold text-[color:var(--foreground)]', benchIds.has(m.id) && 'transition-colors group-hover/link:text-[color:var(--accent)]')}>
          {m.name}
        </span>
        <span className="text-[length:var(--text-micro)] text-[color:var(--muted-dim)] font-mono uppercase tracking-widest">{m.provider}</span>
      </span>
    </span>
  );
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-2)] transition-colors">
      <td className="px-5 py-4">
        <span className={cn('text-[length:var(--text-body-sm)] font-mono tabular-nums', top ? 'text-[color:var(--accent)] font-bold' : 'text-[color:var(--muted)]')}>
          {rank ? rank.toString().padStart(2, '0') : ''}
        </span>
      </td>
      <td className="px-5 py-4">
        {benchIds.has(m.id) ? (
          <Link href={`/model/${modelSlug(m.id)}`} className="group/link">{name}</Link>
        ) : (
          name
        )}
      </td>
      <td className="px-5 py-4">
        <span className="flex items-center gap-3">
          <span className="w-28 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden" aria-hidden>
            <span className={cn('block h-full rounded-r-[4px]', top ? 'bg-[var(--accent)]' : m.ranked ? 'bg-[var(--muted)]' : 'bg-[var(--border-bright)]')} style={{ width: `${m.applied}%` }} />
          </span>
          <span className={cn('text-[length:var(--text-body)] tabular-nums font-mono font-bold', top ? 'text-[color:var(--accent)]' : m.ranked ? 'text-[color:var(--foreground)]' : 'text-[color:var(--foreground-2)]')}>
            {m.applied.toFixed(1)}%
          </span>
        </span>
      </td>
      <td className="px-5 py-4 text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">
        {m.suggestionsPerPR.toFixed(2)}
      </td>
      <td className="px-5 py-4 text-[length:var(--text-body-sm)] tabular-nums font-mono text-[color:var(--muted)]">
        {m.reviewsAtLeast.toLocaleString('en-US')}+
      </td>
    </tr>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return <span className="text-[color:var(--foreground)] font-medium">{children}</span>;
}

/**
 * Aba Live da leaderboard: o mesmo modelo, medido em PR real de time que
 * usa a Kodus no Cloud. So taxa e razao por modelo (live.json); volume e
 * contagem de organizacao sao numero da empresa e nao entram aqui.
 */
export default function LiveBoard() {
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  return (
    <>
      <div className="mb-8">
        <p className="text-[15px] text-[color:var(--foreground-2)] max-w-2xl leading-relaxed mb-3">
          The same models on real teams&apos; pull requests. Precision here is the share of a model&apos;s suggestions
          that the team went on to apply, as a median across Kodus Cloud organizations that review with their own model
          key. It refreshes daily.
        </p>
        <p className="text-[13px] text-[color:var(--muted)] max-w-2xl leading-relaxed">
          Updated {formatDay(live.generatedAt)}. Window: {formatDay(live.window.from)} to {formatDay(live.window.to)} (
          {live.window.weeks} closed weeks). A model is listed once it has {minPRs}+ PRs reviewed and at least{' '}
          {minOrganizations} organizations received {minSuggestionsPerOrganization} or more of its suggestions. Models with fewer than{' '}
          {minPRsToRank.toLocaleString('en-US')} PRs reviewed sit below the ranking, unranked, because their numbers can
          swing a lot.
        </p>
      </div>

      <div className="mb-8 card-hairline overflow-hidden">
        <button
          onClick={() => setMethodologyOpen((v) => !v)}
          aria-expanded={methodologyOpen}
          className="relative w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--surface-2)] transition-colors"
        >
          <div className="text-left">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">How the live numbers are measured</span>
            <span className="text-xs text-[color:var(--muted-dim)] block">Where precision comes from, why there is no recall yet, and what this can&apos;t tell you</span>
          </div>
          <ChevronDown className={cn('size-4 text-[color:var(--muted)] transition-transform', methodologyOpen && 'rotate-180')} />
        </button>

        {methodologyOpen && (
          <div className="border-t border-[var(--border)] px-6 py-6 panel-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm text-[color:var(--muted)] leading-relaxed">
              <div className="space-y-3">
                <p>
                  <Term>Precision.</Term> After each push, Kodus compares the new code with every open suggestion and marks
                  it applied when the change does what the suggestion asked, fully or partly. A fix written another way,
                  made in another PR, or answered in the thread counts as not applied. Each organization gets its own rate
                  and the table shows the median, so one large organization can&apos;t set a model&apos;s number.
                </p>
                <p>
                  <Term>PRs reviewed.</Term> Pull requests behind the row, shown as a range (1,000+ means between 1,000
                  and the next step up) rather than an exact count. A row also needs at least {minOrganizations}{' '}
                  organizations, so no single customer&apos;s numbers show up alone, and a row built on few organizations
                  reflects few teams.
                </p>
                <p>
                  <Term>Suggestions per PR.</Term> Suggestions posted per pull request with a finished automated review,
                  median across organizations. Reviews that were skipped or failed don&apos;t count.
                </p>
                <p>
                  <Term>Model.</Term> The model an organization set for code review in its own key configuration. Only the
                  current setting is stored, so a week counts for a model only when the setting was last changed before
                  that week began. Routers, aliases such as *-latest and custom names are left out, because they don&apos;t
                  say which model ran.
                </p>
              </div>
              <div className="space-y-3">
                <p>
                  <Term>Recall.</Term> Not measured yet. In production nobody has the list of bugs a pull request really
                  had. The closest signal is what developers fixed after the review that the model never flagged, and that
                  analysis isn&apos;t running yet. Until it is, recall lives in the benchmark tab.
                </p>
                <p>
                  <Term>Teams, not only models.</Term> Teams pick their own model, and they differ in language, codebase, PR
                  size and review rules, so a gap between two rows can come from the teams. The benchmark tab holds all of
                  that fixed.
                </p>
                <p>
                  <Term>Self-graded.</Term> The check that decides whether a suggestion was applied runs on the
                  organization&apos;s own model, so each model grades its own suggestions.
                </p>
                <p>
                  <Term>Cloud only.</Term> Self-hosted installs don&apos;t send per-PR data. Raw numbers are at{' '}
                  <a href="/api/live.json" className="text-[color:var(--accent)] hover:underline">/api/live.json</a>, and the
                  query is in{' '}
                  <a href="https://github.com/kodustech/codereviewbench/blob/main/scripts/fetch-live.js" target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent)] hover:underline">scripts/fetch-live.js</a>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full card-hairline overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['#', 'Model', 'Precision (applied)', 'Suggestions per PR', 'PRs reviewed'].map((h) => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((m, idx) => (
                <LiveRow key={m.id} m={m} rank={idx + 1} />
              ))}
              {unranked.length > 0 && (
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <td colSpan={5} className="px-5 py-3 text-[length:var(--text-micro)] font-mono text-[color:var(--muted)] uppercase font-normal">
                    Under {minPRsToRank.toLocaleString('en-US')} PRs reviewed · not ranked
                  </td>
                </tr>
              )}
              {unranked.map((m) => (
                <LiveRow key={m.id} m={m} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
