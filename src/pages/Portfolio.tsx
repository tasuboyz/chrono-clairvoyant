import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { usePortfolio } from '@/hooks/usePortfolio';
import { AddToPortfolioModal } from '@/components/AddToPortfolioModal';
import Navbar from '@/components/Navbar';
import type { PortfolioWatch } from '@/types/watch';

const STATUS_COLORS: Record<PortfolioWatch['status'], string> = {
  'In Portafoglio': 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  'In Vendita':     'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  'Venduto':        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
};

export default function Portfolio() {
  const { items, remove, update } = usePortfolio();
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const active = items.filter(w => w.status !== 'Venduto');
  const sold = items.filter(w => w.status === 'Venduto');

  const totalInvested = active.reduce((s, w) => s + w.purchasePrice, 0);
  const totalMarket = active.reduce((s, w) => s + w.marketPrice, 0);
  const totalPnl = totalMarket - totalInvested;
  const totalRoi = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  const realizedPnl = sold.reduce((s, w) => s + ((w.soldPrice ?? w.marketPrice) - w.purchasePrice), 0);

  const handleStatusChange = (id: string, status: PortfolioWatch['status']) => {
    update(id, { status });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-12 max-w-6xl mx-auto space-y-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Il Mio Portafoglio</h1>
            <p className="text-muted-foreground mt-1">Archivio acquisti e analisi P&L</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex-shrink-0 mt-1"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>

        {/* Sommario */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Investito', value: `${totalInvested.toLocaleString('it-IT')} €`, sub: `${active.length} orologi attivi` },
            { label: 'Valore Mercato', value: `${totalMarket.toLocaleString('it-IT')} €`, sub: 'stima attuale' },
            { label: 'P&L Potenziale', value: `${totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('it-IT')} €`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400', sub: `ROI ${totalRoi.toFixed(1)}%` },
            { label: 'Guadagno Realizzato', value: `${realizedPnl >= 0 ? '+' : ''}${realizedPnl.toLocaleString('it-IT')} €`, color: realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400', sub: `${sold.length} venduti` },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="glass-card rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold font-display mt-0.5 ${color ?? 'text-foreground'}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Orologi ({items.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Brand', 'Modello', 'Referenza', 'Acquisto', 'Mercato', 'Margine', 'ROI%', 'Stato', ''].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium ${h === '' ? '' : 'text-left'} ${['Referenza'].includes(h) ? 'hidden md:table-cell' : ''} ${['Margine', 'ROI%'].includes(h) ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">Nessun orologio nel portafoglio</td></tr>
                )}
                {items.map(w => {
                  const pnl = (w.soldPrice ?? w.marketPrice) - w.purchasePrice;
                  const roi = w.purchasePrice > 0 ? (pnl / w.purchasePrice) * 100 : 0;
                  return (
                    <tr key={w.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{w.brand}</td>
                      <td className="px-4 py-3 text-foreground">{w.model}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{w.reference}</td>
                      <td className="px-4 py-3 text-foreground">{w.purchasePrice.toLocaleString('it-IT')} €</td>
                      <td className="px-4 py-3 text-foreground">{w.marketPrice.toLocaleString('it-IT')} €</td>
                      <td className={`px-4 py-3 font-medium hidden lg:table-cell ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('it-IT')} €
                      </td>
                      <td className={`px-4 py-3 hidden lg:table-cell ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={w.status}
                          onChange={e => handleStatusChange(w.id, e.target.value as PortfolioWatch['status'])}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold border cursor-pointer bg-transparent focus:outline-none ${STATUS_COLORS[w.status]}`}
                        >
                          <option value="In Portafoglio">In Portafoglio</option>
                          <option value="In Vendita">In Vendita</option>
                          <option value="Venduto">Venduto</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setEditingId(w.id)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(w.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <AddToPortfolioModal
        open={addOpen}
        onOpenChange={setAddOpen}
        brand=""
        model=""
        reference=""
      />
    </div>
  );
}
