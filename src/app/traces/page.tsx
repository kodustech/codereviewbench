import samplesData from '@/lib/data/samples.json';
import TracesClient from './TracesClient';
import type { Sample } from '@/lib/types';

export default function TracesPage() {
  return <TracesClient samples={samplesData as Sample[]} />;
}
