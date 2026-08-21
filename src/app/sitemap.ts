import type { MetadataRoute } from 'next';
import leaderboardData from '@/lib/data/leaderboard.json';
import type { LeaderboardData } from '@/lib/types';
import { modelSlug } from '@/lib/constants';
import { allPairs } from '@/lib/compare';
import { publishedPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

const lb = leaderboardData as unknown as LeaderboardData;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // /traces nao entra: e um redirect 307 pro /leaderboard, listar seria
  // mandar o crawler pra um destino que ja esta no sitemap.
  const staticRoutes = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: 'weekly' as const },
    { url: `${SITE_URL}/leaderboard`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${SITE_URL}/compare`, priority: 0.6, changeFrequency: 'weekly' as const },
    { url: `${SITE_URL}/blog`, priority: 0.7, changeFrequency: 'weekly' as const },
  ];

  const modelRoutes = lb.entries.map((e) => ({
    url: `${SITE_URL}/model/${modelSlug(e.modelId)}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }));

  // Os 45 pares (C(10,2)). Le de allPairs() — mesma fonte do
  // generateStaticParams da rota, entao sitemap e rotas nao divergem quando
  // entrar modelo novo.
  const pairRoutes = allPairs().map((p) => ({
    url: `${SITE_URL}/compare/${p.slug}`,
    priority: 0.5,
    changeFrequency: 'monthly' as const,
  }));

  // Rascunho (`draft: true`) fica de fora — publishedPosts ja filtra. Estes
  // usam a data do post como lastModified, nao `now`: mentir que um post de
  // marco mudou hoje queima confianca do crawler no sitemap inteiro.
  const postRoutes = publishedPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    priority: 0.6,
    changeFrequency: 'yearly' as const,
    lastModified: new Date(p.date),
  }));

  return [
    ...[...staticRoutes, ...modelRoutes, ...pairRoutes].map((r) => ({ ...r, lastModified: now })),
    ...postRoutes,
  ];
}
