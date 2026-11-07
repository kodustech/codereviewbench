import { PairPage, pairMetadata, pairStaticParams } from '../../pair-route';

export function generateStaticParams() {
    return pairStaticParams('heavy');
}

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    return pairMetadata('heavy', pair);
}

export default async function HeavyPairPage({ params }: { params: Promise<{ pair: string }> }) {
    const { pair } = await params;
    return <PairPage mode="heavy" pair={pair} />;
}
