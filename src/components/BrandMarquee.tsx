const brands = [
  "Rolex", "Omega", "Cartier", "Audemars Piguet", "Patek Philippe",
  "Hublot", "IWC", "Breitling", "TAG Heuer", "Jaeger-LeCoultre",
  "Chopard", "Panerai", "Tudor", "Longines", "Hamilton",
  "Zenith", "Vacheron Constantin", "Blancpain", "Girard Perregaux", "Franck Muller",
];

const BrandMarquee = () => {
  const brandList = [...brands, ...brands];

  return (
    <section className="py-12 border-t border-b border-border overflow-hidden">
      <div className="flex marquee whitespace-nowrap">
        {brandList.map((b, i) => (
          <span key={i} className="inline-block mx-8 text-muted-foreground/50 text-sm font-body tracking-[0.2em] uppercase">
            {b}
          </span>
        ))}
      </div>
    </section>
  );
};

export default BrandMarquee;
