const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <p className="font-display text-xl font-bold mb-2">
            <span className="text-primary">Luxury</span><span className="text-foreground">InStock</span>
          </p>
          <p className="text-muted-foreground text-sm font-body">
            by Simone Cossu — Via Moretto 52, 25121 Brescia (BS) — Italy
          </p>
          <a href="mailto:info@luxuryinstock.com" className="text-primary text-sm font-body hover:text-gold-light transition-colors">
            info@luxuryinstock.com
          </a>
        </div>
        <div className="flex gap-6 text-sm font-body text-muted-foreground">
          <a href="https://luxuryinstock.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Chi Siamo</a>
          <a href="https://luxuryinstock.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">I Nostri Orologi</a>
          <a href="mailto:info@luxuryinstock.com" className="hover:text-primary transition-colors">Supporto Clienti</a>
        </div>
      </div>
      <div className="mt-8 pt-6 border-t border-border text-center text-muted-foreground text-xs font-body">
        © 2026 LuxuryInStock by Simone Cossu. Tutti i diritti riservati.
      </div>
    </div>
  </footer>
);

export default Footer;
