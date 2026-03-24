import { useSearchParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, ExternalLink } from 'lucide-react';
import { generateMarketData } from '@/data/mockData';
import { LiquidityBadge } from '@/components/LiquidityBadge';
import { PurchaseEvaluator } from '@/components/PurchaseEvaluator';
import { AddToPortfolioModal } from '@/components/AddToPortfolioModal';
import { MOCK_WATCHES } from '@/data/mockData';
import Navbar from '@/components/Navbar';
import { useState } from 'react';
import type { Liquidity } from '@/types/watch';

export default function MarketAnalysis() {
  const [params] = useSearchParams();
  const brand = params.get('brand') ?? '';
  const model = params.get('model') ?? '';
  const reference = params.get('reference') ?? '';
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioPrice, setPortfolioPrice] = useState<number | undefined>();

  const data = generateMarketData(brand, model, reference);

  // Try to get liquidity from mock db
  const dbWatch = MOCK_WATCHES.find(w => w.reference === reference);
  const liquidity: Liquidity = dbWatch?.liquidity ?? 'MEDIA';

  const handleAddToPortfolio = (price: number) => {
    setPortfolioPrice(price);
    setPortfolioOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-12 max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-5 h-5 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">Analisi Mercato</h1>
            </div>
            <p className="text-muted-foreground">{brand} {model} · <span className="font-mono text-xs">{reference}</span></p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <LiquidityBadge value={liquidity} />
            <span className="text-xs text-muted-foreground">{data.listingsCount} annunci analizzati</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">DEMO</span>
          </div>
        </div>

        {/* KPI prezzi */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Prezzo Minimo', value: data.priceMin, color: 'text-foreground' },
            { label: 'Prezzo Medio', value: data.priceAvg, color: 'text-primary font-bold' },
            { label: 'Prezzo Massimo', value: data.priceMax, color: 'text-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card rounded-xl py-5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-display mt-1 ${color}`}>{value.toLocaleString('it-IT')} €</p>
            </div>
          ))}
        </div>

        {/* Grafico storico */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Andamento Prezzi — Ultimi 6 mesi</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.priceHistory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 38% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38 38% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(38 20% 22% / 0.5)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(30 25% 94% / 0.5)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(30 25% 94% / 0.5)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(0 0% 10%)', border: '1px solid hsl(38 20% 22%)', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(30 25% 94%)' }}
                formatter={(v: number) => [`${v.toLocaleString('it-IT')} €`, 'Prezzo medio']}
              />
              <Area type="monotone" dataKey="avg" stroke="hsl(38 38% 60%)" strokeWidth={2} fill="url(#goldGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tabella annunci */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Annunci rilevati</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Fonte</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Condizione</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Prezzo</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium hidden sm:table-cell">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.listings.map((l, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{l.source}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.condition}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{l.price.toLocaleString('it-IT')} €</td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden sm:table-cell">{l.date}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors inline-flex">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Valutazione acquisto */}
        <PurchaseEvaluator
          marketAvg={data.priceAvg}
          brand={brand}
          model={model}
          reference={reference}
          onAddToPortfolio={handleAddToPortfolio}
        />

      </div>

      <AddToPortfolioModal
        open={portfolioOpen}
        onOpenChange={setPortfolioOpen}
        brand={brand}
        model={model}
        reference={reference}
        suggestedPrice={portfolioPrice}
        marketPrice={data.priceAvg}
      />
    </div>
  );
}
