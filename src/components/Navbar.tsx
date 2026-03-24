import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-1 text-xl font-display font-bold tracking-wide">
          <span className="text-primary">Luxury</span>
          <span className="text-foreground">InStock</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-body">
          <a href="https://luxuryinstock.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">I Nostri Orologi</a>
          <a href="mailto:info@luxuryinstock.com" className="text-muted-foreground hover:text-primary transition-colors">Contatti</a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border px-6 pb-6 space-y-4">
          <a href="https://luxuryinstock.com" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-primary transition-colors">I Nostri Orologi</a>
          <a href="mailto:info@luxuryinstock.com" className="block text-muted-foreground hover:text-primary transition-colors">Contatti</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
