import type { Liquidity } from '@/types/watch';

const config: Record<Liquidity, { label: string; className: string }> = {
  ALTA:  { label: 'Liquidità ALTA',  className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  MEDIA: { label: 'Liquidità MEDIA', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  BASSA: { label: 'Liquidità BASSA', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

interface Props {
  value: Liquidity;
  short?: boolean;
}

export function LiquidityBadge({ value, short = false }: Props) {
  const { label, className } = config[value];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${className}`}>
      {short ? value : label}
    </span>
  );
}
