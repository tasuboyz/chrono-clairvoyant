import { useState } from 'react';
import { Calculator } from 'lucide-react';

interface Props {
  marketAvg: number;
  brand: string;
  model: string;
  reference: string;
  onAddToPortfolio?: (price: number) => void;
}

type Verdict = { label: string; color: string; bg: string };

function getVerdict(roi: number): Verdict {
  if (roi >= 15) return { label: 'OTTIMA OPPORTUNITÀ', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (roi >= 8)  return { label: 'BUONA OPPORTUNITÀ',  color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/30' };
  if (roi >= 0)  return { label: 'NELLA MEDIA',         color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/30' };
  return           { label: 'DA EVITARE',               color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30' };
}

export function PurchaseEvaluator({ marketAvg, onAddToPortfolio }: Props) {
  const [offered, setOffered] = useState('');

  const offeredNum = parseFloat(offered) || 0;
  const margin = marketAvg - offeredNum;
  const roi = offeredNum > 0 ? (margin / offeredNum) * 100 : 0;
  const verdict = offeredNum > 0 ? getVerdict(roi) : null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-foreground">Valutazione Acquisto</h3>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">
            Prezzo offerto (€)
          </label>
          <input
            type="number"
            value={offered}
            onChange={e => setOffered(e.target.value)}
            placeholder={`es. ${Math.round(marketAvg * 0.85).toLocaleString('it-IT')}`}
            className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary/60 transition-colors"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Prezzo medio mercato</p>
          <p className="text-lg font-bold text-foreground">{marketAvg.toLocaleString('it-IT')} €</p>
        </div>
      </div>

      {offeredNum > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/40 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Margine stimato</p>
              <p className={`text-xl font-bold mt-0.5 ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {margin >= 0 ? '+' : ''}{margin.toLocaleString('it-IT')} €
              </p>
            </div>
            <div className="bg-background/40 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">ROI</p>
              <p className={`text-xl font-bold mt-0.5 ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)} %
              </p>
            </div>
          </div>

          {verdict && (
            <div className={`rounded-lg border px-4 py-2.5 text-center ${verdict.bg}`}>
              <p className={`font-bold tracking-wide text-sm ${verdict.color}`}>{verdict.label}</p>
            </div>
          )}

          {onAddToPortfolio && (
            <button
              onClick={() => onAddToPortfolio(offeredNum)}
              className="w-full rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm py-2 hover:bg-primary/20 transition-colors font-medium"
            >
              + Aggiungi al Portafoglio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
