import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import SettingsModal from "@/components/SettingsModal";

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/database',  label: 'Database' },
  { to: '/radar',     label: 'Radar' },
  { to: '/portfolio', label: 'Portafoglio' },
  { to: '/',          label: 'Ricerca AI' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/dashboard" className="flex items-center gap-1 text-xl font-display font-bold tracking-wide">
          <span className="text-primary">Luxury</span>
          <span className="text-foreground">InStock</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-body">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`transition-colors ${isActive(to) ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
            >
              {label}
            </Link>
          ))}
          <SettingsModal />
        </div>

        <div className="md:hidden flex items-center gap-3">
          <SettingsModal />
          <button onClick={() => setOpen(!open)} className="text-foreground">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border px-6 pb-6 space-y-4 pt-3">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`block transition-colors ${isActive(to) ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
