import leaderboardData from '@/lib/data/leaderboard.json';
import samplesData from '@/lib/data/samples.json';
import type { LeaderboardModel, Sample } from '@/lib/types';
import { notFound } from 'next/navigation';
import ModelDetailClient from './ModelDetailClient';

const lb = leaderboardData as { models: LeaderboardModel[]; averages: { score: number; coverage: number; validity: number; localScore: number; crossFileScore: number } };
const allSamples = samplesData as Sample[];

export function generateStaticParams() {
  return lb.models.map((m) => ({ id: m.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  // Can't await in generateMetadata easily, so return a generic one
  return {
    title: `Model Detail | CodeReviewBench`,
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = lb.models.find((m) => m.slug === id);
  if (!model) notFound();

  const modelSamples = allSamples
    .filter((s) => s.modelSlug === id)
    .sort((a, b) => b.score - a.score);

  return (
    <ModelDetailClient
      model={model}
      averages={lb.averages}
      allModels={lb.models}
      samples={modelSamples}
    />
  );
}
