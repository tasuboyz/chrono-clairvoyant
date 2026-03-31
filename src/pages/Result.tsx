import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Mail, Share2, AlertTriangle, BarChart2, Briefcase, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LiquidityBadge } from "@/components/LiquidityBadge";
import { PurchaseEvaluator } from "@/components/PurchaseEvaluator";
import { AddToPortfolioModal } from "@/components/AddToPortfolioModal";
import { CorrectionPanel } from "@/components/CorrectionPanel";
import { generateMarketData, MOCK_WATCHES } from "@/data/mockData";
import { toast } from "sonner";
import type { Liquidity } from "@/types/watch";

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

const SpecItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="py-3 border-b border-border last:border-b-0">
    <p className="text-muted-foreground text-xs font-body uppercase tracking-wider mb-1">{label}</p>
    <p className="text-foreground font-body">{value || "N/D"}</p>
  </div>
);

const EditableSpecItem = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (val: string) => void;
}) => (
  <div className="py-3 border-b border-border last:border-b-0">
    <p className="text-muted-foreground text-xs font-body uppercase tracking-wider mb-1">{label}</p>
    <Input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="N/D"
      className="font-body text-sm bg-secondary/30 border-secondary"
    />
  </div>
);

type RefSourceStatus = 'official' | 'unknown';

const ReferenceBadge = ({ status, brandSite }: { status: RefSourceStatus; brandSite?: string | null }) => {
  if (status === 'official') {
    return (
      <span
        className="inline-flex items-center gap-1 ml-2 text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap"
        title={`Dati estratti da ${brandSite ?? 'sito ufficiale'}`}
      >
        ✓ Sito ufficiale
      </span>
    );
  }
  return null;
};

// Derive mock extra fields deterministically from brand+reference
function deriveMockFields(brand: string, ref: string) {
  const seed = Math.abs(ref.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0));
  const calibers: Record<string, string> = {
    Rolex: 'Cal. 3235', Omega: 'Cal. 8800', IWC: 'Cal. 69355',
    Zenith: 'Cal. 400', Tudor: 'Cal. MT5402', Panerai: 'Cal. OP XI',
    Breitling: 'Cal. B01', Hublot: 'Cal. HUB1242', 'TAG Heuer': 'Cal. Heuer-02',
  };
  return {
    caliber: calibers[brand] ?? `Cal. ${seed % 9000 + 1000}`,
    power_reserve: `${40 + (seed % 40)}h`,
    frequency: ['18.000', '21.600', '25.200', '28.800', '36.000'][(seed % 5)] + ' bph',
    thickness: `${9 + (seed % 8)}.${seed % 10}mm`,
    weight: `${90 + (seed % 120)}g`,
    case_back: ['Vite', 'Sapphire', 'Inciso'][seed % 3],
    year_introduced: 2010 + (seed % 16),
    liquidity: (['ALTA', 'ALTA', 'MEDIA', 'MEDIA', 'BASSA'] as Liquidity[])[seed % 5],
  };
}

function generateSeoFields(brand: string, model: string, ref: string) {
  return {
    title: `${brand} ${model} ${ref} | Acquisto e Vendita`,
    meta: `${brand} ${model} ref. ${ref} — scheda tecnica, prezzo di mercato e disponibilità su LuxuryInStock.`,
    keywords: [brand.toLowerCase(), model.toLowerCase(), ref.toLowerCase(), `${brand.toLowerCase()} usato`, `comprare ${model.toLowerCase()}`],
    shortDesc: `${brand} ${model}, referenza ${ref}. Disponibile su LuxuryInStock con certificato di autenticità. Consulta la scheda tecnica e il prezzo di mercato aggiornato.`,
  };
}

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, imagePreview } = (location.state as any) || {};
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioPrice, setPortfolioPrice] = useState<number | undefined>();

  // Editable fields state
  const [editMode, setEditMode] = useState(false);
  const [editedWatch, setEditedWatch] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [displayWatch, setDisplayWatch] = useState<any>(null);

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

  const { watch: originalWatch, description, market, confidence_summary: confSummary, official_source: officialSource, watch_id: watchId } = result;
  // Use displayWatch (updated after save) or fall back to original
  const watch = displayWatch || originalWatch;

  // Initialize editedWatch and displayWatch on first render
  useEffect(() => {
    if (!editedWatch && originalWatch) {
      setEditedWatch({ ...originalWatch });
      setDisplayWatch({ ...originalWatch });
    }
  }, [originalWatch, editedWatch]);
  const lowConfidence = watch.confidence < 0.5;
  const brandSlug = watch.brand?.toLowerCase().replace(/\s+/g, "-");
  const chrono24Search = `http://chrono24.com/search/index.htm?dosearch=true&query=${encodeURIComponent(watch.brand + " " + watch.model)}`;
  const chrono24Lis = `http://chrono24.com/search/index.htm?dosearch=true&query=${encodeURIComponent(watch.brand + " " + watch.model)}`;
  const lisCollection = `https://luxuryinstock.com/collections/${brandSlug}`;
  const officialUrl = brandUrls[watch.brand];

  const ref = watch.reference ?? '';
  const mockFields = deriveMockFields(watch.brand ?? '', ref);
  const seo = generateSeoFields(watch.brand ?? '', watch.model ?? '', ref);
  const marketData = market ?? generateMarketData(watch.brand ?? '', watch.model ?? '', ref);
  const isRealMarket = !!market;

  // Try to get liquidity from db
  const dbWatch = MOCK_WATCHES.find(w => w.reference === ref);
  const liquidity: Liquidity = dbWatch?.liquidity ?? mockFields.liquidity;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiato negli appunti!");
    } catch {
      toast.error("Impossibile copiare il link.");
    }
  };

  const handleSaveChanges = async () => {
    if (!watchId || !editedWatch) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watch_id: watchId,
          brand: editedWatch.brand?.trim() || null,
          model: editedWatch.model?.trim() || null,
          reference: editedWatch.reference?.trim() || null,
          case_material: editedWatch.case_material?.trim() || null,
          case_size: editedWatch.case_size?.trim() || null,
          movement: editedWatch.movement?.trim() || null,
          crystal: editedWatch.crystal?.trim() || null,
          water_resistance: editedWatch.water_resistance?.trim() || null,
          bracelet: editedWatch.bracelet?.trim() || null,
          dial_color: editedWatch.dial_color?.trim() || null,
          complications: editedWatch.complications,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Update the display watch with the corrected data
      setDisplayWatch({ ...editedWatch });
      setEditMode(false);
      toast.success("Dati salvati correttamente!");
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
    } finally {
      setIsSaving(false);
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
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-primary font-display text-3xl sm:text-4xl font-bold">{watch.brand}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {confSummary && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium border ${
                          confSummary.level === "high"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : confSummary.level === "medium"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                        title={confSummary.factors?.join(" · ")}
                      >
                        {confSummary.level === "high" ? "Alta confidenza" : confSummary.level === "medium" ? "Confidenza media" : "Bassa confidenza"}
                      </span>
                    )}
                    <LiquidityBadge value={liquidity} />
                  </div>
                </div>
                <p className="text-foreground font-display text-xl mb-1">{watch.model}</p>
                <p className="text-muted-foreground text-sm font-body mb-6">Ref. {watch.reference || "Non rilevabile"}</p>
                <div className="w-full h-px bg-primary/30 mb-6" />
                <ConfidenceBar value={watch.confidence} />
              </div>
            </div>
          </motion.div>

          {/* Correction Panel */}
          {watchId && (
            <CorrectionPanel
              watchId={watchId}
              initialBrand={watch.brand ?? ""}
              initialModel={watch.model ?? ""}
              initialReference={watch.reference ?? ""}
              onDataSaved={(updatedData) => {
                setDisplayWatch({ ...displayWatch, ...updatedData });
              }}
            />
          )}

          {/* Tabs */}
          <Tabs defaultValue="scheda" className="mb-8">
            <TabsList className="bg-secondary/50 border border-border mb-6 w-full sm:w-auto">
              <TabsTrigger value="scheda" className="flex-1 sm:flex-none">Scheda Tecnica</TabsTrigger>
              <TabsTrigger value="mercato" className="flex-1 sm:flex-none">
                <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
                Analisi Mercato
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 sm:flex-none">Scheda SEO</TabsTrigger>
            </TabsList>

            {/* TAB 1: Scheda Tecnica */}
            <TabsContent value="scheda">
              <div className="mb-4 flex justify-end gap-2">
                {!editMode ? (
                  <Button variant="gold-outline" size="sm" onClick={() => setEditMode(true)}>
                    Modifica dati
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? "Salvando..." : "Salva modifiche"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                      Annulla
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-lg">
                  <h2 className="font-display text-xl font-semibold mb-4 text-primary">Identificazione</h2>
                  <div className="grid grid-cols-2 gap-x-6">
                    {editMode && editedWatch ? (
                      <>
                        <EditableSpecItem
                          label="Brand"
                          value={editedWatch.brand}
                          onChange={(val) => setEditedWatch({ ...editedWatch, brand: val })}
                        />
                        <EditableSpecItem
                          label="Modello"
                          value={editedWatch.model}
                          onChange={(val) => setEditedWatch({ ...editedWatch, model: val })}
                        />
                        <EditableSpecItem
                          label="Referenza"
                          value={editedWatch.reference}
                          onChange={(val) => setEditedWatch({ ...editedWatch, reference: val })}
                        />
                        <SpecItem label="Anno introduzione" value={String(mockFields.year_introduced)} />
                      </>
                    ) : (
                      <>
                        <SpecItem label="Brand" value={watch.brand} />
                        <SpecItem label="Modello" value={watch.model} />
                        <div className="py-3 border-b border-border last:border-b-0">
                          <p className="text-muted-foreground text-xs font-body uppercase tracking-wider mb-1">Referenza</p>
                          <p className="text-foreground font-body flex items-center flex-wrap gap-y-1">
                            {watch.reference || "N/D"}
                            {officialSource?.found && (
                              <ReferenceBadge status="official" brandSite={officialSource.brand_site} />
                            )}
                          </p>
                        </div>
                        <SpecItem label="Anno introduzione" value={String(mockFields.year_introduced)} />
                      </>
                    )}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 rounded-lg">
                  <h2 className="font-display text-xl font-semibold mb-4 text-primary">Movimento</h2>
                  <div className="grid grid-cols-2 gap-x-6">
                    {editMode && editedWatch ? (
                      <>
                        <EditableSpecItem
                          label="Tipo"
                          value={editedWatch.movement}
                          onChange={(val) => setEditedWatch({ ...editedWatch, movement: val })}
                        />
                        <SpecItem label="Calibro" value={mockFields.caliber} />
                        <SpecItem label="Riserva di carica" value={mockFields.power_reserve} />
                        <SpecItem label="Frequenza" value={mockFields.frequency} />
                      </>
                    ) : (
                      <>
                        <SpecItem label="Tipo" value={watch.movement} />
                        <SpecItem label="Calibro" value={mockFields.caliber} />
                        <SpecItem label="Riserva di carica" value={mockFields.power_reserve} />
                        <SpecItem label="Frequenza" value={mockFields.frequency} />
                      </>
                    )}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 rounded-lg">
                  <h2 className="font-display text-xl font-semibold mb-4 text-primary">Cassa</h2>
                  <div className="grid grid-cols-2 gap-x-6">
                    {editMode && editedWatch ? (
                      <>
                        <EditableSpecItem
                          label="Materiale"
                          value={editedWatch.case_material}
                          onChange={(val) => setEditedWatch({ ...editedWatch, case_material: val })}
                        />
                        <EditableSpecItem
                          label="Diametro"
                          value={editedWatch.case_size}
                          onChange={(val) => setEditedWatch({ ...editedWatch, case_size: val })}
                        />
                        <SpecItem label="Spessore" value={mockFields.thickness} />
                        <SpecItem label="Peso" value={mockFields.weight} />
                        <SpecItem label="Fondello" value={mockFields.case_back} />
                        <EditableSpecItem
                          label="Vetro"
                          value={editedWatch.crystal}
                          onChange={(val) => setEditedWatch({ ...editedWatch, crystal: val })}
                        />
                        <EditableSpecItem
                          label="Impermeabilità"
                          value={editedWatch.water_resistance}
                          onChange={(val) => setEditedWatch({ ...editedWatch, water_resistance: val })}
                        />
                        <EditableSpecItem
                          label="Bracciale"
                          value={editedWatch.bracelet}
                          onChange={(val) => setEditedWatch({ ...editedWatch, bracelet: val })}
                        />
                      </>
                    ) : (
                      <>
                        <SpecItem label="Materiale" value={watch.case_material} />
                        <SpecItem label="Diametro" value={watch.case_size} />
                        <SpecItem label="Spessore" value={mockFields.thickness} />
                        <SpecItem label="Peso" value={mockFields.weight} />
                        <SpecItem label="Fondello" value={mockFields.case_back} />
                        <SpecItem label="Vetro" value={watch.crystal} />
                        <SpecItem label="Impermeabilità" value={watch.water_resistance} />
                        <SpecItem label="Bracciale" value={watch.bracelet} />
                      </>
                    )}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6 rounded-lg">
                  <h2 className="font-display text-xl font-semibold mb-4 text-primary">Quadrante & Stima Prezzo</h2>
                  {editMode && editedWatch ? (
                    <>
                      <EditableSpecItem
                        label="Colore quadrante"
                        value={editedWatch.dial_color}
                        onChange={(val) => setEditedWatch({ ...editedWatch, dial_color: val })}
                      />
                      <SpecItem label="Complicazioni" value={editedWatch.complications?.join(", ") || "Nessuna"} />
                    </>
                  ) : (
                    <>
                      <SpecItem label="Colore quadrante" value={watch.dial_color} />
                      <SpecItem label="Complicazioni" value={watch.complications?.join(", ") || "Nessuna"} />
                    </>
                  )}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-muted-foreground text-xs font-body uppercase tracking-wider mb-1">Stima prezzo mercato</p>
                    {watch.estimated_price_eur_min && watch.estimated_price_eur_max ? (
                      <p className="text-2xl font-display font-bold text-foreground">
                        {watch.estimated_price_eur_min.toLocaleString("it-IT")} — {watch.estimated_price_eur_max.toLocaleString("it-IT")} €
                      </p>
                    ) : (
                      <p className="text-foreground font-body">Non disponibile</p>
                    )}
                  </div>
                </motion.div>

                {description && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-lg lg:col-span-2">
                    <h2 className="font-display text-xl font-semibold mb-4 text-primary">Descrizione Esperta</h2>
                    <p className="text-foreground font-body leading-relaxed whitespace-pre-line">{description}</p>
                  </motion.div>
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6 rounded-lg lg:col-span-2">
                  <h2 className="font-display text-xl font-semibold mb-4 text-primary">Dove Trovarlo</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a href={chrono24Search} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                      <ExternalLink className="h-4 w-4" />Cerca su Chrono24
                    </a>
                    <a href={chrono24Lis} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                      <ExternalLink className="h-4 w-4" />LuxuryInStock su Chrono24
                    </a>
                    {(officialSource?.url || officialUrl) && (
                      <a
                        href={officialSource?.url ?? officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {officialSource?.found ? `Scheda ufficiale ${watch.brand}` : `Sito ufficiale ${watch.brand}`}
                      </a>
                    )}
                    <a href={lisCollection} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-body text-sm p-3 rounded-lg bg-secondary/50 hover:bg-secondary">
                      <ExternalLink className="h-4 w-4" />Collezione LuxuryInStock
                    </a>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* TAB 2: Analisi Mercato */}
            <TabsContent value="mercato">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Prezzo Minimo', value: marketData.price_min ?? marketData.priceMin ?? 0 },
                    { label: 'Prezzo Medio', value: marketData.price_avg ?? marketData.priceAvg ?? 0 },
                    { label: 'Prezzo Massimo', value: marketData.price_max ?? marketData.priceMax ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass-card rounded-xl py-5 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-2xl font-display font-bold text-foreground mt-1">{value.toLocaleString('it-IT')} €</p>
                    </div>
                  ))}
                </div>

                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-foreground">Annunci rilevati</h3>
                    <span className="text-xs text-muted-foreground">
                      {(marketData.listings_count ?? marketData.listingsCount ?? 0)} annunci ·{" "}
                      {isRealMarket
                        ? <span className="text-green-400">Chrono24 live</span>
                        : <span className="text-yellow-400">DEMO</span>
                      }
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-xs text-muted-foreground font-medium">Fonte</th>
                          <th className="text-left py-2 text-xs text-muted-foreground font-medium">Condizione</th>
                          <th className="text-right py-2 text-xs text-muted-foreground font-medium">Prezzo</th>
                          <th className="py-2 text-xs text-muted-foreground font-medium hidden sm:table-cell text-right">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketData.listings.map((l, i) => (
                          <tr key={i} className="border-b border-border/40 hover:bg-primary/5 transition-colors">
                            <td className="py-2.5 text-foreground">{l.source}</td>
                            <td className="py-2.5 text-muted-foreground">{l.condition}</td>
                            <td className="py-2.5 text-right font-medium text-foreground">{l.price.toLocaleString('it-IT')} €</td>
                            <td className="py-2.5 text-right text-muted-foreground text-xs hidden sm:table-cell">{l.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <PurchaseEvaluator
                  marketAvg={marketData.price_avg ?? marketData.priceAvg ?? 0}
                  brand={watch.brand ?? ''}
                  model={watch.model ?? ''}
                  reference={ref}
                  onAddToPortfolio={(price) => { setPortfolioPrice(price); setPortfolioOpen(true); }}
                />
              </div>
            </TabsContent>

            {/* TAB 3: Scheda SEO */}
            <TabsContent value="seo">
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Titolo SEO</p>
                  <p className="text-foreground font-medium">{seo.title}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Meta Description</p>
                  <p className="text-foreground text-sm leading-relaxed">{seo.meta}</p>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {seo.keywords.map(k => (
                      <span key={k} className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">{k}</span>
                    ))}
                  </div>
                </div>
                <div className="glass-card rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Descrizione Breve (ecommerce)</p>
                  <p className="text-foreground text-sm leading-relaxed">{seo.shortDesc}</p>
                </div>
                {description && (
                  <div className="glass-card rounded-xl p-5">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Descrizione Completa</p>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-yellow-400 px-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />
                  I contenuti SEO sono generati automaticamente. Rivedi prima della pubblicazione.
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="gold" size="lg" className="flex-1" onClick={() => navigate("/")}>
              🔄 Nuova Ricerca
            </Button>
            <Button
              variant="gold-outline"
              size="lg"
              className="flex-1"
              onClick={() => { setPortfolioPrice(undefined); setPortfolioOpen(true); }}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              Aggiungi al Portafoglio
            </Button>
            <Button variant="gold-outline" size="lg" className="flex-1" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Condividi
            </Button>
          </div>
        </div>
      </div>

      <Footer />

      <AddToPortfolioModal
        open={portfolioOpen}
        onOpenChange={setPortfolioOpen}
        brand={watch.brand ?? ''}
        model={watch.model ?? ''}
        reference={ref}
        suggestedPrice={portfolioPrice}
        marketPrice={marketData.price_avg ?? marketData.priceAvg ?? 0}
      />
    </div>
  );
};

export default Result;
