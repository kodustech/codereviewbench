import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { allPairs, parsePairSlug, pairDiff, pairTitle } from '@/lib/compare';
import { displayNameOf, modelSlug, providerOf } from '@/lib/constants';
import type { GoldenSplit } from '@/lib/compare';

export function generateStaticParams() {
    return allPairs().map((p) => ({ pair: p.slug }));
}

// PRECISA ser true. Com `false`, o Next 404a qualquer slug fora do
// generateStaticParams ANTES de a pagina rodar — e a ordem invertida
// (`b-vs-a`) nao esta la, entao o 308 pro canonico nunca disparava (404 em vez
// de redirect, testado). Com `true`, slug desconhecido cai no notFound() da
// propria pagina; o custo e resolver `parsePairSlug` sob demanda, que e uma
// busca em 45 itens.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    const r = parsePairSlug(pair);
    if (!r) return { title: 'Comparison not found' };
    const { a, b } = r;
    const d = pairDiff(a, b);
    const na = displayNameOf(a.modelId);
    const nb = displayNameOf(b.modelId);

    // Descricao unica por par: numeros reais dos dois lados + quantos bugs cada
    // um pegou que o outro perdeu. Nunca o mesmo texto em duas paginas.
    return {
        title: `${na} vs ${nb} for Code Review`,
        description:
            `${na} and ${nb} reviewed the same ${d.sharedCases} merged pull requests. ` +
            `${na} found ${a.score.toFixed(1)}% of known bugs at ${a.precision.toFixed(1)}% precision; ` +
            `${nb} found ${b.score.toFixed(1)}% at ${b.precision.toFixed(1)}%. ` +
            `${d.onlyA.length} real bugs were caught only by ${na}, ${d.onlyB.length} only by ${nb}.`,
        alternates: { canonical: `/compare/${r.canonicalSlug}` },
    };
}

function Stat({ label, a, b }: { label: string; a: string; b: string }) {
    return (
        <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-4 py-3 border-b border-[color:var(--border)]">
            <span className="font-display text-lg tabular-nums text-right">{a}</span>
            <span className="eyebrow text-[color:var(--color-graphite)]">{label}</span>
            <span className="font-display text-lg tabular-nums">{b}</span>
        </div>
    );
}

function GoldenList({ items, winner, loser }: { items: GoldenSplit[]; winner: string; loser: string }) {
    if (items.length === 0) {
        return (
            <p className="text-[color:var(--color-graphite)]">
                On these pull requests, there was no bug that {winner} caught and {loser} missed.
            </p>
        );
    }
    return (
        <ul className="stack">
            {items.map((g, i) => (
                <li key={`${g.caseId}-${i}`} className="card-hairline p-4">
                    <div className="flex items-center gap-3 mb-2">
                        {g.severity ? <span className="eyebrow">{g.severity}</span> : null}
                        <span className="eyebrow text-[color:var(--color-graphite)]">{g.repo}</span>
                        <span className="eyebrow text-[color:var(--color-graphite)]">{g.language}</span>
                    </div>
                    <p>{g.text}</p>
                </li>
            ))}
        </ul>
    );
}

export default async function PairPage({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    const r = parsePairSlug(pair);
    if (!r) notFound();
    // `b-vs-a` resolve pro mesmo par mas duplicaria conteudo — 308 pra ordem
    // canonica em vez de servir as duas URLs.
    if (!r.canonical) permanentRedirect(`/compare/${r.canonicalSlug}`);

    const { a, b } = r;
    const d = pairDiff(a, b);
    const na = displayNameOf(a.modelId);
    const nb = displayNameOf(b.modelId);
    const money = (v: number | null) => (v == null ? '—' : `$${v.toFixed(2)}`);

    // Outros pares envolvendo A ou B: descoberta pelo crawler e distribuicao de
    // link equity entre as 45 paginas, que senao ficariam orfas.
    const related = allPairs()
        .filter((p) => p.slug !== r.canonicalSlug)
        .filter((p) => [p.a.modelId, p.b.modelId].some((m) => m === a.modelId || m === b.modelId))
        .slice(0, 8);

    return (
        <main className="flex-1 flex flex-col items-center">
            <section className="w-full hero-dusk relative">
                <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-32 pb-16">
                    <span className="eyebrow block mb-4">Head to head</span>
                    <h1 className="font-display text-4xl sm:text-6xl mb-6">
                        {na} <span className="text-[color:var(--color-graphite)]">vs</span> {nb}
                    </h1>
                    <p className="editorial max-w-2xl">
                        Both models reviewed the same {d.sharedCases} merged pull requests from open-source
                        repositories, with the same harness and the same known bugs to find. {na} caught{' '}
                        {d.onlyA.length} bug{d.onlyA.length === 1 ? '' : 's'} that {nb} missed; {nb} caught{' '}
                        {d.onlyB.length} that {na} missed. They both found {d.both} and both missed {d.neither}.
                    </p>
                </div>
            </section>

            <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-[var(--section-gap)]">
                <div className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-4 pb-3">
                    <Link href={`/model/${modelSlug(a.modelId)}`} className="text-right block">
                        <span className="font-display text-xl">{na}</span>
                        <span className="eyebrow block text-[color:var(--color-graphite)]">{providerOf(a.modelId)}</span>
                    </Link>
                    <span />
                    <Link href={`/model/${modelSlug(b.modelId)}`} className="block">
                        <span className="font-display text-xl">{nb}</span>
                        <span className="eyebrow block text-[color:var(--color-graphite)]">{providerOf(b.modelId)}</span>
                    </Link>
                </div>
                <Stat label="Recall" a={`${a.score.toFixed(1)}%`} b={`${b.score.toFixed(1)}%`} />
                <Stat label="Precision" a={`${a.precision.toFixed(1)}%`} b={`${b.precision.toFixed(1)}%`} />
                <Stat label="F1" a={a.f1.toFixed(1)} b={b.f1.toFixed(1)} />
                <Stat label="Bugs found" a={`${a.goldensMatched}/${a.goldensTotal}`} b={`${b.goldensMatched}/${b.goldensTotal}`} />
                <Stat label="Cost per PR" a={money(a.costPerPR)} b={money(b.costPerPR)} />
            </section>

            <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-[var(--section-gap)]">
                <h2 className="font-display text-2xl sm:text-3xl mb-6">
                    Bugs {na} caught and {nb} missed
                </h2>
                <GoldenList items={d.onlyA} winner={na} loser={nb} />
            </section>

            <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-[var(--section-gap)]">
                <h2 className="font-display text-2xl sm:text-3xl mb-6">
                    Bugs {nb} caught and {na} missed
                </h2>
                <GoldenList items={d.onlyB} winner={nb} loser={na} />
            </section>

            <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-[var(--section-gap)] pb-24">
                <h2 className="font-display text-2xl sm:text-3xl mb-6">Compare other pairs</h2>
                <ul className="flex flex-wrap gap-3">
                    {related.map((p) => (
                        <li key={p.slug}>
                            <Link href={`/compare/${p.slug}`} className="card-hairline px-4 py-2 inline-block">
                                {pairTitle(p.a, p.b)}
                            </Link>
                        </li>
                    ))}
                </ul>
                <p className="mt-8">
                    <Link href="/compare" className="btn-filled">Pick any two models</Link>
                </p>
            </section>
        </main>
    );
}
