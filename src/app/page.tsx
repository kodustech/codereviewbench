import Link from 'next/link';
import { ArrowRight, FlaskConical, Layers, Scale, GitPullRequest, Search, ShieldCheck, ArrowDown, Cpu, Bug, FileCode2, ChevronRight } from 'lucide-react';
import meta from '@/lib/data/meta.json';
import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import type { LeaderboardModel, Sample } from '@/lib/types';
import { formatScore, formatLatency } from '@/lib/format';
import { cn } from '@/lib/utils';
import TracePreview from './TracePreview';

const lb = leaderboardData as { models: LeaderboardModel[]; averages: any };
const samples = samplesData as Sample[];

const highlightTrace = samples
  .filter((s) => s.category === 'cross-file' && s.score > 70)
  .sort((a, b) => b.score - a.score)[0] || samples[0];

export default function Home() {
  const topModels = lb.models.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Hero */}
      <header className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 pt-20 sm:pt-32 pb-32 grid-bg relative">
        {/* Accent glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

        <div className="relative">
          {/* Headline */}
          <h1 className="animate-fade-up text-5xl sm:text-7xl lg:text-[5.5rem] font-display tracking-tight text-[var(--foreground)] leading-[1.05] mb-8 max-w-4xl" style={{ animationDelay: '0ms' }}>
            AI Code Review<br />Benchmark.
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up text-lg sm:text-xl text-[var(--muted)] max-w-2xl leading-relaxed mb-16" style={{ animationDelay: '80ms' }}>
            We generate realistic bugs based on real-world patterns and see which LLMs can actually find them. Not linting issues. Regressions that break logic and cross-file contracts.
          </p>

          {/* Stats row */}
          <div className="animate-fade-up flex flex-wrap gap-12 sm:gap-16" style={{ animationDelay: '160ms' }}>
            {[
              { value: meta.totalResults.toLocaleString(), label: 'eval traces' },
              { value: meta.languages.length.toString().padStart(2, '0'), label: 'languages' },
              { value: meta.totalModels.toString().padStart(2, '0'), label: 'models' },
              { value: meta.totalTestCases.toString(), label: 'test cases' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <span className="text-3xl sm:text-4xl font-mono font-bold tabular-nums text-[var(--foreground)]">
                  {stat.value}
                </span>
                <span className="text-xs text-[var(--muted)] font-mono uppercase tracking-widest mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent" />
      </div>

      {/* Methodology */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
        <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Methodology</span>
        <h2 className="text-3xl sm:text-4xl font-display text-[var(--foreground)] mb-4">How It Works</h2>
        <p className="text-base text-[var(--muted)] max-w-2xl mb-16 leading-[1.75]">
          Every model gets the same test suite, the same bugs, the same grading criteria. No cherry-picking, no human scoring, no prompt tricks. Just deterministic evals you can audit yourself.
        </p>

        {/* Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          {[
            {
              step: '01',
              icon: Bug,
              title: 'Generate bugs',
              desc: 'We create synthetic but realistic regressions based on real-world bug patterns across 5 languages. Each test case has a PR patch, the full codebase, and exact bug locations as ground truth.',
            },
            {
              step: '02',
              icon: Cpu,
              title: 'Run AI code review',
              desc: 'Every model gets the same PR diff and has to find the bugs, point to the exact lines, and suggest a fix. We parse everything into structured suggestions.',
            },
            {
              step: '03',
              icon: Scale,
              title: 'Two judges score it',
              desc: 'Claude Sonnet and GPT independently score every response. Did the model find the bugs? Were the suggestions actually correct? Final score is the average of both.',
            },
            {
              step: '04',
              icon: ShieldCheck,
              title: 'Publish everything',
              desc: 'All scores, all traces, all judge reasoning. Broken down by language, category, and model. Nothing is hidden.',
            },
          ].map((item, i) => (
            <div key={item.step} className="relative flex flex-col gap-4 p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-[var(--accent)] font-bold">{item.step}</span>
                <item.icon className="size-4 text-[var(--muted)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{item.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-[1.75]">{item.desc}</p>
              {i < 3 && (
                <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 size-4 text-[var(--border-bright)] z-10" />
              )}
            </div>
          ))}
        </div>

        {/* Two columns: Test Categories + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
          {/* Test Categories */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Test Categories</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              <div className="p-6 flex gap-4">
                <FlaskConical className="size-5 text-[var(--muted)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">Local Logic</h4>
                  <p className="text-sm text-[var(--muted)] leading-[1.75]">
                    Bugs that live inside a single file. Wrong conditions, broken state, off-by-one errors. Most models do okay here. It&apos;s table stakes for AI code review.
                  </p>
                </div>
              </div>
              <div className="p-6 flex gap-4">
                <Layers className="size-5 text-[var(--accent)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)] mb-1">Cross-File Context</h4>
                  <p className="text-sm text-[var(--muted)] leading-[1.75]">
                    You change an interface in one file and it breaks three consumers in other files. Can the model catch that? This is where it gets hard, and where we see the biggest gap between models.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Explained */}
          <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Metrics Explained</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {[
                {
                  metric: 'Score',
                  value: 'Primary',
                  desc: 'Overall quality, averaged across both judges. This is what we rank by.',
                },
                {
                  metric: 'Coverage',
                  value: 'Recall',
                  desc: 'How many of the known bugs did the model actually find?',
                },
                {
                  metric: 'Validity',
                  value: 'Precision',
                  desc: 'Out of everything the model flagged, how much was real? Lower means more noise.',
                },
                {
                  metric: 'Pass Rate',
                  value: 'Binary',
                  desc: 'Percentage of tests where the model hit the minimum bar to pass.',
                },
              ].map((m) => (
                <div key={m.metric} className="px-6 py-4 flex items-start gap-4">
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <span className="text-sm font-semibold text-[var(--foreground)] font-mono">{m.metric}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-widest font-bold">{m.value}</span>
                    <p className="text-sm text-[var(--muted)] leading-[1.75] mt-0.5">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dual Judge Deep Dive */}
        <div className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden mb-20">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-3">
            <Scale className="size-4 text-[var(--accent)]" />
            <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Dual Judge System</h3>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#d4a27f]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">Claude Sonnet 4.5</span>
                  <span className="text-[11px] font-mono text-[var(--muted)]">Anthropic</span>
                </div>
                <p className="text-sm text-[var(--muted)] leading-[1.75]">
                  Checks each response against the ground-truth bugs. Did the model find them? Are the suggestions actually valid? Writes out its full reasoning for every score.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#10a37f]" />
                  <span className="text-sm font-semibold text-[var(--foreground)]">GPT</span>
                  <span className="text-[11px] font-mono text-[var(--muted)]">OpenAI</span>
                </div>
                <p className="text-sm text-[var(--muted)] leading-[1.75]">
                  Second opinion, same criteria, different provider. Two judges from two companies means no single-provider bias. The final score is the average of both.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
              <span className="text-xs text-[var(--muted)] font-mono leading-relaxed">
                final_score = (sonnet_score + gpt_score) / 2. Same for coverage and validity. You can see both judges&apos; full reasoning for every trace in the
                <Link href="/traces" className="text-[var(--accent)] hover:underline mx-1">explorer</Link>.
              </span>
            </div>
          </div>
        </div>

        {/* Languages + Powered by Kodus */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Languages */}
          <div className="lg:col-span-3 border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Languages</h3>
            </div>
            <div className="p-6 flex flex-wrap gap-2">
              {[
                { name: 'TypeScript / Node', color: 'bg-[#3178c6]' },
                { name: 'Python', color: 'bg-[#3572A5]' },
                { name: 'React / TSX', color: 'bg-[#61dafb]' },
                { name: 'Ruby', color: 'bg-[#CC342D]' },
                { name: 'Java', color: 'bg-[#b07219]' },
              ].map((lang) => (
                <span key={lang.name} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)]">
                  <span className={cn('size-2.5 rounded-full', lang.color)} />
                  {lang.name}
                </span>
              ))}
            </div>
            <div className="px-6 pb-6">
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                Every language has both local and cross-file tests. Same test suite for every model, so the comparison is fair.
              </p>
            </div>
          </div>

          {/* Powered by Kodus */}
          <div className="lg:col-span-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">Powered By</h3>
            </div>
            <div className="p-6 flex flex-col gap-5 flex-1">
              <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/kodus-logo.webp" alt="Kodus" className="h-6" />
              </a>
              <p className="text-sm text-[var(--muted)] leading-[1.75]">
                Every evaluation is run by
                <a href="https://kodus.io" target="_blank" rel="noopener noreferrer" className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors mx-1 font-medium">Kodus</a>,
                the AI code review engine behind this benchmark. The same pipeline that reviews production code runs these evals.
              </p>
              <a
                href="https://kodus.io"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium group"
              >
                Learn about Kodus <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent" />
      </div>

      {/* Mini Leaderboard */}
      <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Rankings</span>
            <h2 className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">Global Leaderboard</h2>
          </div>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors group"
          >
            Full ranking <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['#', 'Model', 'Score', 'Coverage', 'Validity', 'Cross-File', 'Latency'].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-mono text-[var(--muted-dim)] uppercase tracking-widest font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topModels.map((m, idx) => (
                  <tr
                    key={m.slug}
                    className={cn(
                      'border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--surface-2)]',
                    )}
                  >
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-sm font-mono tabular-nums',
                        idx === 0 ? 'text-[var(--accent)] font-bold' : 'text-[var(--muted)]'
                      )}>
                        {m.rank.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/model/${m.slug}`} className="group/link flex flex-col gap-0.5">
                        <span className={cn(
                          'text-sm font-semibold tracking-tight transition-colors group-hover/link:text-[var(--accent)]',
                          idx === 0 ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]/80'
                        )}>
                          {m.displayName}
                        </span>
                        <span className="text-xs text-[var(--muted-dim)] font-mono uppercase tracking-widest">{m.provider}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-base tabular-nums font-mono font-bold',
                        idx === 0 ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'
                      )}>
                        {formatScore(m.score)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(m.coverage)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatScore(m.validity)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'text-sm tabular-nums font-mono font-semibold',
                        m.crossFileScore > 80 ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                      )}>
                        {formatScore(m.crossFileScore)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm tabular-nums font-mono text-[var(--muted)]">{formatLatency(m.latency.p50)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--border-bright)] to-transparent" />
      </div>

      {/* Trace Preview */}
      {highlightTrace && (
        <section className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 py-24">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <span className="text-xs font-mono text-[var(--accent)] uppercase tracking-widest font-bold block mb-3">Explorer</span>
              <h2 className="text-3xl sm:text-4xl font-display text-[var(--foreground)]">Regression Traces</h2>
            </div>
            <Link
              href="/traces"
              className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors group"
            >
              All traces <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <TracePreview sample={highlightTrace} />
        </section>
      )}
    </div>
  );
}
