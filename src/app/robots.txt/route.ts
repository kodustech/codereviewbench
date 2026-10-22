import { SITE_URL } from '@/lib/site';

/**
 * /robots.txt — escrito a mao (nao via MetadataRoute.Robots) porque o
 * resolver nativo do Next nao emite comentarios: aqui cada user-agent de
 * crawler de IA/LLM tem a propria secao "Allow: /" explicita, nao so o
 * catch-all `*` — este e um benchmark publico, ser lido e citado por motor
 * generativo (GEO) e parte da estrategia de distribuicao do site.
 */
const BODY = `# codereviewbench.com — crawl policy
# We explicitly welcome AI/LLM crawlers: being read and cited by AI engines
# (GEO) is part of this site's distribution strategy.

User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: meta-externalagent
Allow: /

# LLM-friendly index of this site
# ${SITE_URL}/llms.txt

Host: ${SITE_URL}
Sitemap: ${SITE_URL}/sitemap.xml
`;

export function GET() {
    return new Response(BODY, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=0, must-revalidate',
        },
    });
}
