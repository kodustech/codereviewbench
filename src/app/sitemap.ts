import type { MetadataRoute } from 'next';
import leaderboardData from '@/lib/data/leaderboard.json';
import metaData from '@/lib/data/meta.json';
import type { LeaderboardData, Meta } from '@/lib/types';
import { modelSlug } from '@/lib/constants';
import { allPairs } from '@/lib/compare';
import { publishedPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/site';

const lb = leaderboardData as unknown as LeaderboardData;
const meta = metaData as unknown as Meta;

// Quando o leaderboard foi regerado pela ultima vez (process-data.js grava
// isto a cada rodada). Serve de lastModified pras paginas que agregam TODOS
// os modelos — nao muda a cada deploy, so quando o dado de fato muda.
const leaderboardLastModified = new Date(meta.generatedAt);

// `runAt` e nullable em entradas antigas do schema — cai pro generatedAt
// global em vez de virar epoch (1970) no sitemap.
function runAtOf(entry: { runAt: string | null }): Date {
  return entry.runAt ? new Date(entry.runAt) : leaderboardLastModified;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // /traces nao entra: e um redirect 307 pro /leaderboard, listar seria
  // mandar o crawler pra um destino que ja esta no sitemap.
  const staticRoutes = [
    { url: `${SITE_URL}/`, priority: 1, changeFrequency: 'weekly' as const },
    { url: `${SITE_URL}/leaderboard`, priority: 0.9, changeFrequency: 'weekly' as const },
    { url: `${SITE_URL}/compare`, priority: 0.6, changeFrequency: 'weekly' as const },
    // O dado bruto numa URL propria: e o que um motor generativo consegue citar
    // com precisao, e o Dataset schema agora aponta pra ele.
    { url: `${SITE_URL}/api/leaderboard.json`, priority: 0.5, changeFrequency: 'weekly' as const },
  ].map((r) => ({ ...r, lastModified: leaderboardLastModified }));

  // Cada modelo tem a propria data de corrida (`runAt`) — um modelo que nao
  // foi re-rodado nao deveria aparecer como "mudou hoje" so porque outro
  // modelo entrou na leaderboard.
  const modelRoutes = lb.entries.map((e) => ({
    url: `${SITE_URL}/model/${modelSlug(e.modelId)}`,
    priority: 0.7,
    changeFrequency: 'monthly' as const,
    lastModified: runAtOf(e),
  }));

  // Os 45 pares (C(10,2)). Le de allPairs() — mesma fonte do
  // generateStaticParams da rota, entao sitemap e rotas nao divergem quando
  // entrar modelo novo. lastModified e o mais recente runAt dos dois modelos
  // do par.
  const pairRoutes = allPairs().map((p) => ({
    url: `${SITE_URL}/compare/${p.slug}`,
    priority: 0.5,
    changeFrequency: 'monthly' as const,
    lastModified: new Date(Math.max(runAtOf(p.a).getTime(), runAtOf(p.b).getTime())),
  }));

  // Rascunho (`draft: true`) fica de fora — publishedPosts ja filtra. Estes
  // usam a data do post como lastModified: mentir que um post de marco mudou
  // hoje queima confianca do crawler no sitemap inteiro.
  const postRoutes = publishedPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    priority: 0.6,
    changeFrequency: 'yearly' as const,
    lastModified: new Date(p.date),
  }));

  // /blog em si e so uma listagem — "mudou" quando o post mais recente saiu.
  const blogIndexRoute = {
    url: `${SITE_URL}/blog`,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
    lastModified: postRoutes[0]?.lastModified ?? leaderboardLastModified,
  };

  return [...staticRoutes, blogIndexRoute, ...modelRoutes, ...pairRoutes, ...postRoutes];
}
