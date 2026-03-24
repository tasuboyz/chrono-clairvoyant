import { useState, useMemo } from 'react';
import { Search, BarChart2, ExternalLink } from 'lucide-react';
import { LiquidityBadge } from '@/components/LiquidityBadge';
import { MOCK_WATCHES } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import type { WatchExtended } from '@/types/watch';

const PAGE_SIZE = 10;

const BRANDS = ['Tutti', ...Array.from(new Set(MOCK_WATCHES.map(w => w.brand))).sort()];

export default function Database() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('Tutti');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return MOCK_WATCHES.filter(w => {
      const matchBrand = brand === 'Tutti' || w.brand === brand;
      const matchQ = !q || [w.brand, w.model, w.reference ?? ''].join(' ').toLowerCase().includes(q);
      return matchBrand && matchQ;
    });
  }, [query, brand]);

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const avgPrice = (w: WatchExtended) =>
    w.price_range_min && w.price_range_max
      ? Math.round((w.price_range_min + w.price_range_max) / 2)
      : null;

  const handleQueryChange = (v: string) => { setQuery(v); setPage(0); };
  const handleBrandChange = (v: string) => { setBrand(v); setPage(0); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-12 max-w-6xl mx-auto space-y-6">

        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Database Referenze</h1>
          <p className="text-muted-foreground mt-1">{MOCK_WATCHES.length} referenze archiviate</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Cerca brand, modello, referenza…"
              className="w-full bg-background/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
          <select
            value={brand}
            onChange={e => handleBrandChange(e.target.value)}
            className="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 min-w-[160px]"
          >
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Brand</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Modello</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium hidden md:table-cell">Referenza</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium hidden lg:table-cell">Anno</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">Prezzo medio</th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium hidden sm:table-cell">Liquidità</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-muted-foreground">Nessuna referenza trovata</td>
                  </tr>
                )}
                {visible.map((w, i) => (
                  <tr key={w.id} className={`border-b border-border/50 hover:bg-primary/5 transition-colors ${i % 2 === 0 ? '' : 'bg-background/20'}`}>
                    <td className="px-4 py-3 font-medium text-foreground">{w.brand}</td>
                    <td className="px-4 py-3 text-foreground">{w.model}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{w.reference ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{w.year_introduced ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-foreground font-medium">
                      {avgPrice(w) ? `${avgPrice(w)!.toLocaleString('it-IT')} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {w.liquidity ? <LiquidityBadge value={w.liquidity} short /> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/market?brand=${encodeURIComponent(w.brand)}&model=${encodeURIComponent(w.model)}&reference=${encodeURIComponent(w.reference ?? '')}`)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Analisi mercato"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://www.chrono24.com/search/?q=${encodeURIComponent(w.brand + ' ' + w.reference)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Cerca su Chrono24"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} di {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs rounded border border-border disabled:opacity-30 hover:border-primary/40 transition-colors"
                >
                  ← Prec
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                  disabled={page === pages - 1}
                  className="px-3 py-1 text-xs rounded border border-border disabled:opacity-30 hover:border-primary/40 transition-colors"
                >
                  Succ →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
