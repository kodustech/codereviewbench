import type { MetadataRoute } from 'next';
import leaderboardData from '@/lib/data/leaderboard.json';
import type { LeaderboardData } from '@/lib/types';
import { modelSlug } from '@/lib/constants';
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
  ];

  const modelRoutes = lb.entries.map((e) => ({
    url: `${SITE_URL}/model/${modelSlug(e.modelId)}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
  }));

  return [...staticRoutes, ...modelRoutes].map((r) => ({ ...r, lastModified: now }));
}
