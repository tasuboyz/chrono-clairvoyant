import { Link } from 'react-router-dom';
import { Database, TrendingUp, Watch, Briefcase, Search, ChevronRight } from 'lucide-react';
import { DashboardKPI } from '@/components/DashboardKPI';
import { OpportunityCard } from '@/components/OpportunityCard';
import { MOCK_WATCHES, MOCK_OPPORTUNITIES } from '@/data/mockData';
import { usePortfolio } from '@/hooks/usePortfolio';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
  const { items: portfolio } = usePortfolio();

  const avgPrice = Math.round(
    MOCK_WATCHES.reduce((s, w) => s + ((w.price_range_min ?? 0) + (w.price_range_max ?? 0)) / 2, 0) / MOCK_WATCHES.length
  );

  const navItems = [
    { to: '/database', icon: Database, label: 'Database Referenze', desc: 'Sfoglia le referenze archiviate' },
    { to: '/radar', icon: TrendingUp, label: 'Radar Opportunità', desc: 'Annunci sottoprezzo rilevati' },
    { to: '/portfolio', icon: Briefcase, label: 'Il Mio Portafoglio', desc: 'Archivio acquisti e P&L' },
    { to: '/', icon: Search, label: 'Nuova Ricerca AI', desc: 'Identifica un orologio' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 pb-12 max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Watch Intelligence</h1>
          <p className="text-muted-foreground mt-1">Cruscotto dealer — panoramica in tempo reale</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKPI
            label="Referenze Archiviate"
            value={MOCK_WATCHES.length}
            icon={Database}
            sub="nel database"
          />
          <DashboardKPI
            label="Prezzo Medio Mercato"
            value={`${avgPrice.toLocaleString('it-IT')} €`}
            icon={Watch}
            sub="su tutte le referenze"
          />
          <DashboardKPI
            label="Opportunità Rilevate"
            value={MOCK_OPPORTUNITIES.length}
            icon={TrendingUp}
            sub="ultime 24h"
          />
          <DashboardKPI
            label="Orologi in Portafoglio"
            value={portfolio.filter(w => w.status !== 'Venduto').length}
            icon={Briefcase}
            sub={`${portfolio.filter(w => w.status === 'Venduto').length} venduti`}
          />
        </div>

        {/* Quick navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {navItems.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="glass-card rounded-xl p-4 flex items-start gap-3 gold-glow-hover transition-all hover:border-primary/40 group"
            >
              <div className="rounded-lg bg-primary/10 p-2 mt-0.5 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1 group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* Opportunità recenti */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-foreground">Ultime Opportunità</h2>
            <Link to="/radar" className="text-primary text-sm hover:underline flex items-center gap-1">
              Vedi tutte <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_OPPORTUNITIES.slice(0, 3).map(opp => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
