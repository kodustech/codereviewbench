'use client';

import type { Sample } from '@/lib/types';
import TraceCard from '@/components/code/TraceCard';

export default function TracePreview({ sample }: { sample: Sample }) {
  return <TraceCard sample={sample} defaultExpanded />;
}
