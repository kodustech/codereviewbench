import { PROVIDER_COLORS } from '@/lib/constants';
import { PROVIDER_LOGO_PATHS } from '@/lib/providerLogos';
import { cn } from '@/lib/utils';

interface ProviderLogoProps {
  provider: string;
  className?: string;
}

/** Logo real do fornecedor quando existe (ver providerLogos.ts); cai pro
 *  ponto colorido de sempre quando não (hoje: Zhipu, e qualquer nome que
 *  não bata com PROVIDER_COLORS). Mesmo tamanho nos dois casos, pra não
 *  saltar layout dependendo de qual modelo é a linha. */
export default function ProviderLogo({ provider, className }: ProviderLogoProps) {
  const color = PROVIDER_COLORS[provider] || '#71717a';
  const path = PROVIDER_LOGO_PATHS[provider];

  if (!path) {
    return <span className={cn('size-2.5 rounded-full shrink-0', className)} style={{ background: color }} />;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      className={cn('size-3 shrink-0', className)}
      role="img"
      aria-label={provider}
    >
      <path d={path} />
    </svg>
  );
}
