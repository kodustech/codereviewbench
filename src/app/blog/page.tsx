import Link from 'next/link';
import { publishedPosts } from '@/lib/blog';

export const metadata = {
    title: 'Blog',
    description:
        'Original research on how well AI models actually review code, from the CodeReviewBench dataset: recall, precision, cost, and the bugs the models miss.',
    alternates: { canonical: '/blog' },
};

/** Data ISO -> "August 21, 2026". Sem locale do runtime: o servidor renderiza
 *  estatico e o cliente hidrata; `toLocaleDateString` sem locale fixo diverge
 *  entre os dois e o React reclama de mismatch. */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
function longDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export default function BlogIndex() {
    const posts = publishedPosts();

    return (
        <main className="flex-1 flex flex-col items-center">
            {/* Hero: mesmo tratamento das outras paginas — conteudo ancorado no
                TOPO do gradiente, onde ele ainda esta em #4a7ff2 e o contraste
                do branco aguenta (ver design.md, desvio 7). */}
            <section className="w-full hero-dusk relative">
                <div className="w-full max-w-[var(--page-max-width)] mx-auto px-6 sm:px-12 pt-16 sm:pt-40 pb-20 sm:pb-28">
                    {/* Sem landmark no H1: o design.md removeu a tecnica do topo
                        de proposito e a mantem so no statement do rodape, um por
                        pagina. Aqui ela ainda pintava a palavra de --accent (azul
                        #007aff) EM CIMA do gradiente azul-violeta, o que sumia com
                        ela e lia como link quebrado. Branco puro sem opacidade e a
                        mitigacao de contraste medida pro texto sobre o gradiente. */}
                    <h1 className="font-display text-[2rem] sm:text-[2.5rem] lg:text-[length:var(--text-display)] leading-[var(--leading-display)] text-white mb-6 max-w-2xl lowercase">
                        research from the benchmark
                    </h1>
                    <p className="text-[length:var(--text-heading-sm)] font-semibold leading-[var(--leading-heading-sm)] text-white max-w-xl">
                        How the models score on real pull requests, and what the numbers leave out.
                    </p>
                </div>
            </section>

            {/* Lista em fio, nao em card. Portal proibe grade de card em secao
                editorial; a coluna de leitura de 680px e o container certo. */}
            <section className="w-full px-6 sm:px-12 pt-[var(--section-gap)] pb-[var(--section-gap)]">
                <div className="editorial">
                    <span className="eyebrow block mb-10">Writing</span>

                    {posts.length === 0 ? (
                        <p
                            className="text-[length:var(--text-body)] leading-[var(--leading-body)] tracking-[var(--tracking-body)]"
                            style={{ color: 'var(--color-graphite)' }}
                        >
                            No posts published yet.
                        </p>
                    ) : (
                        <ul className="border-t border-[var(--border)]">
                            {posts.map((p, i) => (
                                <li
                                    key={p.slug}
                                    className="reveal border-b border-[var(--border)]"
                                    style={{ ['--i' as string]: String(i) }}
                                >
                                    <Link href={`/blog/${p.slug}`} className="group block py-10">
                                        <time
                                            dateTime={p.date}
                                            className="font-mono text-[length:var(--text-caption)] tabular-nums block mb-4"
                                            style={{ color: 'var(--color-graphite)' }}
                                        >
                                            {longDate(p.date)}
                                        </time>
                                        <h2 className="font-display text-[1.75rem] sm:text-[length:var(--text-heading)] leading-[var(--leading-heading)] mb-4 text-[color:var(--color-ink-black)] group-hover:text-[color:var(--accent)] transition-colors duration-[var(--dur-short)] ease-[var(--ease-out)]">
                                            {p.title}
                                        </h2>
                                        <p
                                            className="text-[length:var(--text-body)] leading-[var(--leading-body)] tracking-[var(--tracking-body)]"
                                            style={{ color: 'var(--color-graphite)' }}
                                        >
                                            {p.description}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </main>
    );
}
