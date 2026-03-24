import { TrendingUp, ExternalLink } from 'lucide-react';
import { LiquidityBadge } from './LiquidityBadge';
import { useNavigate } from 'react-router-dom';
import type { Opportunity } from '@/types/watch';

interface Props {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity: opp }: Props) {
  const navigate = useNavigate();

  const marginPct = Math.round(((opp.marketAvg - opp.listingPrice) / opp.listingPrice) * 100);
  const date = new Date(opp.foundAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3 gold-glow-hover transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{opp.brand}</p>
          <p className="font-display font-semibold text-foreground leading-tight">{opp.model}</p>
          <p className="text-xs text-muted-foreground">{opp.reference}</p>
        </div>
        <LiquidityBadge value={opp.liquidity} short />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-background/40 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Mercato</p>
          <p className="font-semibold text-sm">{opp.marketAvg.toLocaleString('it-IT')} €</p>
        </div>
        <div className="bg-background/40 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Annuncio</p>
          <p className="font-semibold text-sm">{opp.listingPrice.toLocaleString('it-IT')} €</p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
          <p className="text-xs text-emerald-400">Margine</p>
          <p className="font-bold text-sm text-emerald-400">+{opp.margin.toLocaleString('it-IT')} €</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          +{marginPct}% sotto media
        </span>
        <span>{opp.source} · {date}</span>
      </div>

      <button
        onClick={() => navigate(`/market?brand=${encodeURIComponent(opp.brand)}&model=${encodeURIComponent(opp.model)}&reference=${encodeURIComponent(opp.reference)}`)}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/40 text-primary text-sm py-2 hover:bg-primary/10 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Analizza
      </button>
    </div>
  );
}
