import { Radar, Activity } from 'lucide-react';
import { OpportunityCard } from '@/components/OpportunityCard';
import { MOCK_OPPORTUNITIES } from '@/data/mockData';
import Navbar from '@/components/Navbar';

export default function OpportunityRadar() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-12 max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radar className="w-5 h-5 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">Radar Opportunità</h1>
            </div>
            <p className="text-muted-foreground">
              Annunci sottoprezzo rilevati sui principali marketplace · Aggiornato il 24 mar 2026
            </p>
          </div>
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            DEMO — Dati simulati
          </span>
        </div>

        {/* Scan status */}
        <div className="glass-card rounded-xl px-5 py-3 flex items-center gap-3 border-primary/20">
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Scan in corso su Chrono24, Watchfinder, Jomashop, Spazio21, Montredo...
          </span>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary"
                style={{ animation: `pulse 1.4s ease-in-out ${i * 0.3}s infinite` }}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="glass-card rounded-xl py-4">
            <p className="text-2xl font-bold font-display text-foreground">{MOCK_OPPORTUNITIES.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Opportunità trovate</p>
          </div>
          <div className="glass-card rounded-xl py-4">
            <p className="text-2xl font-bold font-display text-emerald-400">
              {Math.round(MOCK_OPPORTUNITIES.reduce((s, o) => s + o.margin, 0) / MOCK_OPPORTUNITIES.length).toLocaleString('it-IT')} €
            </p>
            <p className="text-xs text-muted-foreground mt-1">Margine medio</p>
          </div>
          <div className="glass-card rounded-xl py-4">
            <p className="text-2xl font-bold font-display text-foreground">
              {Math.max(...MOCK_OPPORTUNITIES.map(o => o.margin)).toLocaleString('it-IT')} €
            </p>
            <p className="text-xs text-muted-foreground mt-1">Margine massimo</p>
          </div>
        </div>

        {/* Grid opportunità */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_OPPORTUNITIES.map(opp => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>

      </div>
    </div>
  );
}
