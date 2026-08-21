import type { MDXComponents } from 'mdx/types';

/**
 * Mapa MDX -> tipografia do Portal.
 *
 * Regra dura do sistema: nada de tamanho arbitrario do Tailwind aqui. A escala
 * e display 48 / heading 36 / heading-sm 18 / body 16 / caption 12, com
 * line-height 1 nos titulos e 1.35 no corpo — os mesmos tokens que a home e a
 * leaderboard usam. Sem isso o artigo le como outro site.
 *
 * Mono fica reservada a numero e identificador (design.md, desvio 1): a coluna
 * numerica da tabela e `code` inline. Prosa nunca.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h2: ({ children }) => (
            <h2 className="font-display text-[1.75rem] sm:text-[length:var(--text-heading)] leading-[var(--leading-heading)] mt-20 mb-6 text-[color:var(--color-ink-black)]">
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-[length:var(--text-heading-sm)] font-semibold leading-[var(--leading-heading-sm)] mt-12 mb-4 text-[color:var(--color-ink-black)]">
                {children}
            </h3>
        ),
        p: ({ children }) => (
            <p
                className="text-[length:var(--text-body)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] mb-6"
                style={{ color: 'var(--color-graphite)' }}
            >
                {children}
            </p>
        ),
        strong: ({ children }) => (
            <strong className="font-semibold text-[color:var(--color-ink-black)]">{children}</strong>
        ),
        ul: ({ children }) => (
            <ul
                className="text-[length:var(--text-body)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] list-disc pl-5 mb-6 space-y-3"
                style={{ color: 'var(--color-graphite)' }}
            >
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol
                className="text-[length:var(--text-body)] leading-[var(--leading-body)] tracking-[var(--tracking-body)] list-decimal pl-5 mb-6 space-y-3"
                style={{ color: 'var(--color-graphite)' }}
            >
                {children}
            </ol>
        ),
        a: ({ href, children }) => (
            <a
                href={href as string}
                className="text-[color:var(--accent)] hover:underline underline-offset-4"
            >
                {children}
            </a>
        ),
        code: ({ children }) => (
            <code className="font-mono text-[length:var(--text-body-sm)] text-[color:var(--color-ink-black)]">
                {children}
            </code>
        ),
        // Tabela em largura de pagina rola no proprio container — o corpo nunca
        // rola na horizontal (regra de responsividade do Hallmark, gate 34).
        table: ({ children }) => (
            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 mb-8">
                <table className="w-full text-left border-collapse">{children}</table>
            </div>
        ),
        th: ({ children }) => (
            <th className="eyebrow text-left border-b border-[var(--border)] pb-3 pr-6 whitespace-nowrap font-normal">
                {children}
            </th>
        ),
        td: ({ children }) => (
            <td
                className="text-[length:var(--text-body-sm)] tabular-nums border-b border-[var(--border)] py-3.5 pr-6 whitespace-nowrap"
                style={{ color: 'var(--color-graphite)' }}
            >
                {children}
            </td>
        ),
        blockquote: ({ children }) => (
            <blockquote
                className="border-l-2 border-[color:var(--accent)] pl-6 my-10 text-[length:var(--text-heading-sm)] leading-[var(--leading-heading-sm)]"
                style={{ color: 'var(--color-ink-black)' }}
            >
                {children}
            </blockquote>
        ),
        hr: () => <hr className="border-0 border-t border-[var(--border)] my-16" />,
        ...components,
    };
}
