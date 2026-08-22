import Link from 'next/link';

export const metadata = {
    title: 'Page not found',
    robots: { index: false, follow: true },
};

/**
 * A 404 padrao do Next ("This page could not be found") nao tem navegacao nem
 * marca: toda visita que cai nela e link interno desperdicado, e quem chegou de
 * uma URL velha nao tem pra onde ir. Mesmo shell das paginas de conteudo.
 */
export default function NotFound() {
    return (
        <div className="max-w-[var(--page-max-width)] mx-auto w-full px-6 sm:px-12 py-12">
            <span className="eyebrow block mb-4">404</span>
            <h1 className="text-3xl sm:text-4xl font-display text-[color:var(--foreground)] mb-3">
                This page does not exist
            </h1>
            <p className="text-[15px] text-[color:var(--muted)] max-w-2xl leading-relaxed mb-10">
                The benchmark changes as models are added and re-run, so an old link can point at
                something that moved. These are the places worth starting from.
            </p>

            <ul className="flex flex-wrap gap-2">
                {[
                    { href: '/leaderboard', label: 'Leaderboard' },
                    { href: '/compare', label: 'Compare two models' },
                    { href: '/blog', label: 'Research' },
                    { href: '/', label: 'Home' },
                ].map((l) => (
                    <li key={l.href}>
                        <Link
                            href={l.href}
                            className="inline-block card-hairline px-3.5 py-2 text-sm text-[color:var(--foreground)] hover:text-[color:var(--accent)] transition-colors"
                        >
                            {l.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
