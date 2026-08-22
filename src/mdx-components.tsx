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
        // Escala proporcional ao h1 da pagina (text-3xl/4xl): h2 abaixo dele,
        // nao igual. Antes o h2 usava --text-heading (36px) e empatava com o
        // titulo do artigo, achatando a hierarquia.
        h2: ({ children }) => (
            <h2 className="text-2xl font-display mt-14 mb-4 text-[color:var(--foreground)]">
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-10 mb-3 text-[color:var(--foreground)]">
                {children}
            </h3>
        ),
        p: ({ children }) => (
            <p className="text-[16px] leading-relaxed text-[color:var(--muted)] mb-5">
                {children}
            </p>
        ),
        strong: ({ children }) => (
            <strong className="font-semibold text-[color:var(--foreground)]">{children}</strong>
        ),
        ul: ({ children }) => (
            <ul
                className="text-[16px] leading-relaxed text-[color:var(--muted)] list-disc pl-5 mb-5 space-y-2"
            >
                {children}
            </ul>
        ),
        ol: ({ children }) => (
            <ol
                className="text-[16px] leading-relaxed text-[color:var(--muted)] list-decimal pl-5 mb-5 space-y-2"
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
            <code className="font-mono text-[14px] text-[color:var(--foreground)]">
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
                className="text-[14px] tabular-nums text-[color:var(--muted)] border-b border-[var(--border)] py-3 pr-6 whitespace-nowrap"
            >
                {children}
            </td>
        ),
        blockquote: ({ children }) => (
            <blockquote
                className="border-l-2 border-[color:var(--accent)] pl-5 my-8 text-[17px] leading-relaxed text-[color:var(--foreground)]"
            >
                {children}
            </blockquote>
        ),
        hr: () => <hr className="border-0 border-t border-[var(--border)] my-12" />,
        ...components,
    };
}
