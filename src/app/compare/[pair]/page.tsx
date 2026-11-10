import { PairPage, pairMetadata, pairStaticParams } from '../pair-route';

export function generateStaticParams() {
    return pairStaticParams('balanced');
}

// Must be true: with false, Next 404s the flipped order (`b-vs-a`) before the
// page runs, and the 308 to the canonical order never fires.
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    return pairMetadata('balanced', pair);
}

export default async function BalancedPairPage({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    return <PairPage mode="balanced" pair={pair} />;
}
