import Link from 'next/link';
import { publishedPosts } from '@/lib/blog';

export const metadata = {
    title: 'Blog',
    description:
        'Original research on how well AI models actually review code, from the CodeReviewBench dataset: recall, precision, cost, and the bugs the models miss.',
    alternates: { canonical: '/blog' },
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
/** Sem `toLocaleDateString`: o servidor pre-renderiza e o cliente hidrata; sem
 *  locale fixo os dois divergem e o React acusa mismatch. */
function longDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export default function BlogIndex() {
    const posts = publishedPosts();

    return (
        // Mesmo shell de /compare e /leaderboard: container de 1200px, py-12,
        // UMA borda esquerda pra tudo.
        //
        // Sem `hero-dusk`. O gradiente e tratamento exclusivo da home, onde ele
        // tem o scorecard preenchendo a coluna direita. Numa pagina de conteudo
        // ele vira 400px de cor com o lado direito vazio, e como o corpo usa
        // `.editorial` (que centraliza) o cabecalho e a lista ficavam em bordas
        // esquerdas diferentes — lia como bug de layout, nao como ritmo.
        <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
            <header className="mb-14">
                <span className="eyebrow block mb-4">Writing</span>
                <h1 className="text-3xl sm:text-4xl font-display text-[color:var(--foreground)] mb-3">
                    Research from the benchmark
                </h1>
                <p className="text-[15px] text-[color:var(--muted)] max-w-2xl leading-relaxed">
                    How the models score on real pull requests, and what the numbers leave out.
                </p>
            </header>

            {posts.length === 0 ? (
                <p className="text-[15px] text-[color:var(--muted)]">No posts published yet.</p>
            ) : (
                <ul className="border-t border-[var(--border)] max-w-[var(--reading-width)]">
                    {posts.map((p) => (
                        <li key={p.slug} className="border-b border-[var(--border)]">
                            <Link href={`/blog/${p.slug}`} className="group block py-8">
                                <time
                                    dateTime={p.date}
                                    className="font-mono text-[length:var(--text-caption)] tabular-nums text-[color:var(--muted)] block mb-3"
                                >
                                    {longDate(p.date)}
                                </time>
                                <h2 className="text-2xl font-display text-[color:var(--foreground)] mb-2 group-hover:text-[color:var(--accent)] transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)]">
                                    {p.title}
                                </h2>
                                <p className="text-[15px] text-[color:var(--muted)] leading-relaxed">
                                    {p.description}
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
