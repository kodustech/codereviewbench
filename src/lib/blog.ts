import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface FAQItem {
    q: string;
    a: string;
}

export interface PostMeta {
    slug: string;
    title: string;
    description: string;
    /** ISO `YYYY-MM-DD`. Vira <time dateTime> e lastModified do sitemap. */
    date: string;
    /** ISO `YYYY-MM-DD`. So pro BlogPosting JSON-LD — o pre-commit hook
     *  (.githooks/pre-commit) carimba isto sozinho quando o corpo do post
     *  muda, entao nao precisa editar a mao. Cai pro `date` se ausente. */
    dateModified: string;
    /** Nao entra em <meta keywords> (Google ignora desde 2009) — serve pra eu
     *  saber qual busca cada post mira e nao escrever dois pro mesmo termo. */
    keywords?: string[];
    /** `draft: true` some do indice, do sitemap e do RSS, mas a URL direta
     *  continua funcionando pra revisao antes de publicar. */
    draft?: boolean;
    /** Fonte UNICA pra secao "FAQ" visivel E pro FAQPage JSON-LD — nunca
     *  escrever a mesma pergunta duas vezes (uma na prosa, outra no schema):
     *  Google exige que o texto do schema bata com o que a pagina mostra. */
    faq?: FAQItem[];
}

const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

export function allPostSlugs(): string[] {
    if (!fs.existsSync(BLOG_DIR)) return [];
    return fs
        .readdirSync(BLOG_DIR)
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => f.replace(/\.mdx$/, ''));
}

export function postMeta(slug: string): PostMeta | null {
    const file = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(file)) return null;
    const { data } = matter(fs.readFileSync(file, 'utf8'));
    if (!data.title || !data.description || !data.date) return null;
    return {
        slug,
        title: String(data.title),
        description: String(data.description),
        date: String(data.date),
        dateModified: data.dateModified ? String(data.dateModified) : String(data.date),
        keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : undefined,
        draft: data.draft === true,
        faq: Array.isArray(data.faq)
            ? data.faq.map((f: { q: unknown; a: unknown }) => ({ q: String(f.q), a: String(f.a) }))
            : undefined,
    };
}

/** Posts publicados, mais recente primeiro. Rascunho fica de fora. */
export function publishedPosts(): PostMeta[] {
    return allPostSlugs()
        .map(postMeta)
        .filter((p): p is PostMeta => p !== null && !p.draft)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Corpo em markdown puro do post, sem o frontmatter — usado por llms-full.txt.
 *  Os posts nao tem import nem componente JSX, entao o corpo ja e markdown
 *  valido sem precisar passar pelo compilador MDX. */
export function postBody(slug: string): string | null {
    const file = path.join(BLOG_DIR, `${slug}.mdx`);
    if (!fs.existsSync(file)) return null;
    const { content } = matter(fs.readFileSync(file, 'utf8'));
    return content.trim();
}
