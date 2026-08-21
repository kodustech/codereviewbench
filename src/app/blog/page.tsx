import Link from 'next/link';
import { publishedPosts } from '@/lib/blog';

export const metadata = {
    title: 'Blog',
    description:
        'Original research on how well AI models actually review code, from the CodeReviewBench dataset: recall, precision, cost, and the bugs the models miss.',
    alternates: { canonical: '/blog' },
};

export default function BlogIndex() {
    const posts = publishedPosts();
    return (
        <main className="flex-1 flex flex-col items-center">
            <section className="w-full hero-dusk relative">
                <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-32 pb-16">
                    <span className="eyebrow block mb-4">Writing</span>
                    <h1 className="font-display text-4xl sm:text-6xl mb-6">Notes from the benchmark</h1>
                    <p className="editorial max-w-2xl">
                        What we learn from running code review models against real merged pull requests — and
                        what the numbers do not say.
                    </p>
                </div>
            </section>

            <section className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-[var(--section-gap)] pb-24">
                {posts.length === 0 ? (
                    <p className="editorial text-[color:var(--color-graphite)]">No posts published yet.</p>
                ) : (
                    <ul className="stack">
                        {posts.map((p) => (
                            <li key={p.slug} className="card-hairline p-6">
                                <time dateTime={p.date} className="eyebrow block mb-3 text-[color:var(--color-graphite)]">
                                    {p.date}
                                </time>
                                <h2 className="font-display text-2xl mb-3">
                                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                                </h2>
                                <p className="editorial">{p.description}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
