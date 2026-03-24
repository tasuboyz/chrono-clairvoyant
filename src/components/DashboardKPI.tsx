import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
}

export function DashboardKPI({ label, value, icon: Icon, sub }: Props) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-start gap-4">
      <div className="rounded-lg bg-primary/10 p-2.5 mt-0.5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold font-display text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}
