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
        // Mesmo shell das outras paginas de conteudo: container de 1200px, uma
        // borda esquerda so. Sem `hero-dusk` — o gradiente e da home.
        <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
            <header className="mb-12 max-w-[var(--reading-width)]">
                {m.draft ? (
                    <span className="eyebrow block mb-4 text-[color:var(--accent)]">Draft — not published</span>
                ) : null}
                <time
                    dateTime={m.date}
                    className="font-mono text-[length:var(--text-caption)] tabular-nums text-[color:var(--muted)] block mb-4"
                >
                    {longDate(m.date)}
                </time>
                <h1 className="text-3xl sm:text-4xl font-display text-[color:var(--foreground)] mb-4 leading-[1.1]">
                    {m.title}
                </h1>
                <p className="text-[17px] text-[color:var(--muted)] leading-relaxed">{m.description}</p>
            </header>

            {/* Coluna de leitura alinhada A ESQUERDA, nao centralizada: `.editorial`
                usa margin-inline auto e jogava o corpo pro meio, criando uma
                segunda borda esquerda contra o cabecalho. */}
            <article className="max-w-[var(--reading-width)] border-t border-[var(--border)] pt-12">
                <Body />
            </article>

            <div className="max-w-[var(--reading-width)] border-t border-[var(--border)] mt-16 pt-8">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-[color:var(--accent)] hover:underline underline-offset-4"
                >
                    ← All posts
                </Link>
            </div>
        </div>
    );
}
