import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    // `*` + allow cobre tambem GPTBot, ClaudeBot, PerplexityBot e afins: este
    // e um benchmark publico, ser citado por motor generativo e o objetivo.
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
