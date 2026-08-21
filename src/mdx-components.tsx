import type { MDXComponents } from 'mdx/types';

/** Obrigatorio pelo @next/mdx no App Router. Mapeia os elementos do markdown
 *  pros tokens do tema Portal — sem isso o post renderiza com o reset do
 *  Tailwind e fica sem hierarquia nenhuma. */
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h2: ({ children }) => <h2 className="font-display text-2xl sm:text-3xl mt-12 mb-4">{children}</h2>,
        h3: ({ children }) => <h3 className="font-display text-xl mt-8 mb-3">{children}</h3>,
        p: ({ children }) => <p className="editorial mb-5">{children}</p>,
        ul: ({ children }) => <ul className="editorial list-disc pl-6 mb-5 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="editorial list-decimal pl-6 mb-5 space-y-2">{children}</ol>,
        a: ({ href, children }) => (
            <a href={href as string} className="underline decoration-[color:var(--border-bright)] underline-offset-4">
                {children}
            </a>
        ),
        table: ({ children }) => (
            <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse">{children}</table>
            </div>
        ),
        th: ({ children }) => <th className="eyebrow border-b border-[color:var(--border)] py-2 pr-4">{children}</th>,
        td: ({ children }) => <td className="border-b border-[color:var(--border)] py-2 pr-4 tabular-nums">{children}</td>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[color:var(--border-bright)] pl-5 my-6 text-[color:var(--color-graphite)]">
                {children}
            </blockquote>
        ),
        ...components,
    };
}
