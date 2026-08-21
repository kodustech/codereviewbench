import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface PostMeta {
    slug: string;
    title: string;
    description: string;
    /** ISO `YYYY-MM-DD`. Vira <time dateTime> e lastModified do sitemap. */
    date: string;
    /** Nao entra em <meta keywords> (Google ignora desde 2009) — serve pra eu
     *  saber qual busca cada post mira e nao escrever dois pro mesmo termo. */
    keywords?: string[];
    /** `draft: true` some do indice, do sitemap e do RSS, mas a URL direta
     *  continua funcionando pra revisao antes de publicar. */
    draft?: boolean;
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
        keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : undefined,
        draft: data.draft === true,
    };
}

/** Posts publicados, mais recente primeiro. Rascunho fica de fora. */
export function publishedPosts(): PostMeta[] {
    return allPostSlugs()
        .map(postMeta)
        .filter((p): p is PostMeta => p !== null && !p.draft)
        .sort((a, b) => (a.date < b.date ? 1 : -1));
}
