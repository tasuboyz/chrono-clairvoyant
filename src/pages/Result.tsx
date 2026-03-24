import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail, Share2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const brandUrls: Record<string, string> = {
  "Rolex": "https://www.rolex.com",
  "Omega": "https://www.omegawatches.com",
  "Cartier": "https://www.cartier.com",
  "Audemars Piguet": "https://www.audemarspiguet.com",
  "Patek Philippe": "https://www.patek.com",
  "Hublot": "https://www.hublot.com",
  "IWC": "https://www.iwc.com",
  "Breitling": "https://www.breitling.com",
  "TAG Heuer": "https://www.tagheuer.com",
  "Jaeger-LeCoultre": "https://www.jaeger-lecoultre.com",
  "Chopard": "https://www.chopard.com",
  "Panerai": "https://www.panerai.com",
  "Tudor": "https://www.tudorwatch.com",
  "Longines": "https://www.longines.com",
  "Zenith": "https://www.zenith-watches.com",
  "Vacheron Constantin": "https://www.vacheron-constantin.com",
  "Blancpain": "https://www.blancpain.com",
};

const ConfidenceBar = ({ value }: { value: number }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-body mb-1">
        <span className="text-muted-foreground">Livello di confidenza</span>
        <span className="text-foreground font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%`, animation: "confidence-fill 1.5s ease-out" }} />
      </div>
    </div>
  );
};

const SpecItem = ({ label, value }: { label: string; value?: string }) => (
  <div className="py-3 border-b border-border last:border-b-0">
    <p className="text-muted-foreground text-xs font-body uppercase tracking-wider mb-1">{label}</p>
    <p className="text-foreground font-body">{value || "N/D"}</p>
  </div>
);

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, imagePreview } = (location.state as any) || {};

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-display text-xl mb-4">Nessun risultato disponibile</p>
          <Button variant="gold" onClick={() => navigate("/")}>Torna alla Home</Button>
        </div>
      </div>
    );
  }

  const { watch, description } = result;
  const lowConfidence = watch.confidence < 0.5;
  const brandSlug = watch.brand?.toLowerCase().replace(/\s+/g, "-");
  const chrono24Search = `https://www.chrono24.com/search/index.htm?query=${encodeURIComponent(watch.brand + " " + watch.model)}`;
  const chrono24Lis = `https://www.chrono24.com/search/index.htm?customerId=20696&dosearch=true&query=${encodeURIComponent(watch.model)}`;
  const lisCollection = `https://luxuryinstock.com/collections/${brandSlug}`;
  const officialUrl = brandUrls[watch.brand];

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiato negli appunti!");
    } catch {
      toast.error("Impossibile copiare il link.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container max-w-5xl px-4">
          <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Nuova Ricerca
          </Button>

          {lowConfidence && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-primary/30 p-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm font-body text-foreground">⚠️ Identificazione incerta. Il risultato potrebbe non essere accurato.</p>
            </motion.div>
          )}

          {/* Main Watch Card */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="glass-card rounded-lg overflow-hidden mb-8">
            <div className="flex flex-col lg:flex-row">
              {imagePreview && (
                <div className="lg:w-1/2 bg-secondary/30">
                  <img src={imagePreview} alt={watch.model} className="w-full h-full object-contain max-h-96 p-6" />
                </div>
              )}
              <div className={`p-8 flex flex-col justify-center ${imagePreview ? "lg:w-1/2" : "w-full"}`}>
                <p className="text-primary font-display text-3xl sm:text-4xl font-bold mb-2">{watch.brand}</p>
                <p className="text-foreground font-display text-xl mb-1">{watch.model}</p>
                <p className="text-muted-foreground text-sm font-body mb-6">Ref. {watch.reference || "Non rilevabile"}</p>
                <div className="w-full h-px bg-primary/30 mb-6" />
                <ConfidenceBar value={watch.confidence} />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Specs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-lg">
              <h2 className="font-display text-xl font-semibold mb-4 text-primary">Specifiche Tecniche</h2>
              <div className="grid grid-cols-2 gap-x-6">
                <SpecItem label="Movimento" value={watch.movement} />
                <SpecItem label="Cassa" value={watch.case_material} />
                <SpecItem label="Diametro" value={watch.case_size} />
                <SpecItem label="Vetro" value={watch.crystal} />
                <SpecItem label="Impermeabilità" value={watch.water_resistance} />
                <SpecItem label="Bracciale" value={watch.bracelet} />
                <SpecItem label="Quadrante" value={watch.dial_color} />
                <SpecItem label="Complicazioni" value={watch.complications?.join(", ") || "Nessuna"} />
              </div>
            </motion.div>

            {/* Price */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-lg">
              <h2 className="font-display text-xl font-semibold mb-4 text-primary">💰 Stima di Prezzo</h2>
              {watch.estimated_price_eur_min && watch.estimated_price_eur_max ? (
                <p className="text-3xl font-display font-bold text-foreground mb-3">
                  €{watch.estimated_price_eur_min.toLocaleString("it-IT")} — €{watch.estimated_price_eur_max.toLocaleString("it-IT")}
                </p>
              ) : (
                <p className="text-foreground font-body mb-3">Prezzo non disponibile per questo modello.</p>
              )}
              <p className="text-muted-foreground text-sm font-body mb-6">
                Prezzo indicativo basato su dati di mercato. Per una valutazione precisa, contatta LuxuryInStock.
              </p>
              <a href="mailto:info@luxuryinstock.com?subject=Richiesta valutazione orologio">
                <Button variant="gold" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Richiedi Valutazione
                </Button>
              </a>
            </motion.div>

            {/* Description */}
            {description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 rounded-lg lg:col-span-2">
                <h2 className="font-display text-xl font-semibold mb-4 text-primary">📝 Descrizione Esperta</h2>
                <p className="text-foreground font-body leading-relaxed whitespace-pre-line">{description}</p>
              </motion.div>
            )}

            {/* Links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 rounded-lg lg:col-span-2">
              <h2 className="font-display text-xl font-semibold mb-4 text-primary">🔗 Dove Trovarlo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href={chrono24Search} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                  <ExternalLink className="h-4 w-4" />Cerca su Chrono24
                </a>
                <a href={chrono24Lis} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                  <ExternalLink className="h-4 w-4" />LuxuryInStock su Chrono24
                </a>
                {officialUrl && (
                  <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                    <ExternalLink className="h-4 w-4" />Sito ufficiale {watch.brand}
                  </a>
                )}
                <a href={lisCollection} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                  <ExternalLink className="h-4 w-4" />Collezione LuxuryInStock
                </a>
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button variant="gold" size="lg" className="flex-1" onClick={() => navigate("/")}>
              🔄 Nuova Ricerca
            </Button>
            <Button variant="gold-outline" size="lg" className="flex-1" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Condividi Risultato
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Result;
