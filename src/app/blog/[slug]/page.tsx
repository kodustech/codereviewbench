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
        // Rascunho nunca deve ser indexado, mesmo com a URL acessivel.
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
                <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-32 pb-16">
                    {m.draft ? <span className="eyebrow block mb-4">Draft — not published</span> : null}
                    <time dateTime={m.date} className="eyebrow block mb-4 text-[color:var(--color-graphite)]">
                        {m.date}
                    </time>
                    <h1 className="font-display text-4xl sm:text-6xl mb-6 max-w-3xl">{m.title}</h1>
                    <p className="editorial max-w-2xl">{m.description}</p>
                </div>
            </section>

            <article className="w-full max-w-[68ch] mx-auto px-6 sm:px-12 pt-[var(--section-gap)] pb-16">
                <Body />
            </article>

            <div className="w-full max-w-[68ch] mx-auto px-6 sm:px-12 pb-24">
                <Link href="/blog" className="btn-filled">All posts</Link>
            </div>
        </main>
    );
}
