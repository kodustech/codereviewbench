import Link from 'next/link';
import { notFound } from 'next/navigation';
import { allPostSlugs, postMeta } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

export function generateStaticParams() {
    // Inclui rascunho: a URL direta precisa funcionar pra revisao. O que o
    // `draft` esconde e o indice, o sitemap e o RSS.
    return allPostSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
function longDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const m = postMeta(slug);
    if (!m) return { title: 'Post not found' };
    return {
        title: m.title,
        description: m.description,
        alternates: { canonical: `/blog/${slug}` },
        openGraph: {
            title: m.title,
            description: m.description,
            type: 'article',
            publishedTime: m.date,
            url: `${SITE_URL}/blog/${slug}`,
        },
        ...(m.draft ? { robots: { index: false, follow: false } } : {}),
    };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const m = postMeta(slug);
    if (!m) notFound();

    const { default: Body } = await import(`@/content/blog/${slug}.mdx`);

    return (
        <main className="flex-1 flex flex-col items-center">
            <section className="w-full hero-dusk relative">
                <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-40 pb-20 sm:pb-28">
                    {m.draft ? (
                        <span className="font-mono text-[length:var(--text-caption)] uppercase tracking-[0.1em] text-white/70 block mb-5">
                            Draft — not published
                        </span>
                    ) : null}
                    <time
                        dateTime={m.date}
                        className="font-mono text-[length:var(--text-caption)] tabular-nums text-white/70 block mb-5"
                    >
                        {longDate(m.date)}
                    </time>
                    {/* H1 do artigo em sentence case: o lowercase estilizado e
                        reservado ao statement de marca (design.md, desvio 2 de
                        casing). Titulo de artigo e conteudo, nao statement. */}
                    <h1 className="font-display text-[2rem] sm:text-[2.5rem] lg:text-[length:var(--text-display)] leading-[var(--leading-display)] text-white max-w-3xl">
                        {m.title}
                    </h1>
                </div>
            </section>

            {/* Long Document: coluna unica de leitura, ritmo dado pelo espaco
                entre blocos do MDX (ver src/mdx-components.tsx). */}
            <article className="w-full px-6 sm:px-12 pt-[var(--section-gap)]">
                <div className="editorial">
                    <p
                        className="text-[length:var(--text-heading-sm)] font-semibold leading-[var(--leading-heading-sm)] mb-14 text-[color:var(--color-ink-black)]"
                    >
                        {m.description}
                    </p>
                    <Body />
                </div>
            </article>

            <section className="w-full px-6 sm:px-12 pt-20 pb-[var(--section-gap)]">
                <div className="editorial border-t border-[var(--border)] pt-10">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-[length:var(--text-body-sm)] font-semibold text-[color:var(--accent)] hover:underline underline-offset-4"
                    >
                        ← All posts
                    </Link>
                </div>
            </section>
        </main>
    );
}
