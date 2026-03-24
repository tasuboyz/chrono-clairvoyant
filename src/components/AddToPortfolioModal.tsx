import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePortfolio } from '@/hooks/usePortfolio';
import type { PortfolioWatch } from '@/types/watch';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: string;
  model: string;
  reference: string;
  suggestedPrice?: number;
  marketPrice?: number;
}

export function AddToPortfolioModal({ open, onOpenChange, brand, model, reference, suggestedPrice, marketPrice }: Props) {
  const { add } = usePortfolio();
  const [price, setPrice] = useState(suggestedPrice?.toString() ?? '');
  const [mktPrice, setMktPrice] = useState(marketPrice?.toString() ?? '');
  const [status, setStatus] = useState<PortfolioWatch['status']>('In Portafoglio');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    add({
      brand, model, reference,
      purchasePrice: parseFloat(price) || 0,
      marketPrice: parseFloat(mktPrice) || 0,
      status,
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: notes || undefined,
    });
    onOpenChange(false);
    setPrice('');
    setMktPrice('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Aggiungi al Portafoglio</DialogTitle>
          <p className="text-sm text-muted-foreground">{brand} {model} · {reference}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Prezzo acquisto (€)</label>
              <input
                type="number"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Prezzo mercato (€)</label>
              <input
                type="number"
                value={mktPrice}
                onChange={e => setMktPrice(e.target.value)}
                className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Stato</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as PortfolioWatch['status'])}
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
            >
              <option value="In Portafoglio">In Portafoglio</option>
              <option value="In Vendita">In Vendita</option>
              <option value="Venduto">Venduto</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1.5">Note (opzionale)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 resize-none"
              placeholder="es. scatola e garanzia presenti"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Annulla
            </button>
            <button type="submit" className="flex-1 bg-primary/10 border border-primary/40 rounded-lg py-2 text-sm text-primary font-medium hover:bg-primary/20 transition-colors">
              Salva
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
