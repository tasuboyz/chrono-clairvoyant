import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CorrectionPanelProps {
  watchId: number;
  initialBrand: string;
  initialModel: string;
  initialReference: string;
  onDataSaved?: (data: any) => void;
}

type ScrapeState = "idle" | "loading" | "done" | "error";
type SaveState = "idle" | "saving" | "saved" | "error";

export const CorrectionPanel = ({
  watchId,
  initialBrand,
  initialModel,
  initialReference,
  onDataSaved,
}: CorrectionPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState(initialBrand);
  const [model, setModel] = useState(initialModel);
  const [reference, setReference] = useState(initialReference);
  const [scrapeState, setScrapeState] = useState<ScrapeState>("idle");
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  const handleScrapeUrl = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith("http")) return;
    setScrapeState("loading");
    setScrapeError(null);
    setAutoSaved(false);
    try {
      const url_params = new URLSearchParams();
      if (showBrowser) url_params.set("headless", "false");

      const body: any = { url: trimmedUrl };
      if (autoSave) {
        body.auto_save = true;
        body.watch_id = watchId;
      }

      const res = await fetch("/api/correct/scrape-url" + (url_params.toString() ? "?" + url_params.toString() : ""), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const specs = data.specs ?? {};
      if (specs.brand) setBrand(specs.brand);
      if (specs.model) setModel(specs.model);
      if (specs.reference) setReference(specs.reference);
      setScrapeState("done");
      if (data.saved) {
        setAutoSaved(true);
        setSaveState("saved");
        // Notify parent component of the auto-saved data
        onDataSaved?.({
          brand: specs.brand || brand,
          model: specs.model || model,
          reference: specs.reference || reference,
        });
      }
    } catch (e) {
      setScrapeError(String(e instanceof Error ? e.message : e));
      setScrapeState("error");
    }
  };

  const handleSave = async () => {
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watch_id: watchId,
          brand: brand.trim() || null,
          model: model.trim() || null,
          reference: reference.trim() || null,
          corrected_url: url.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setSaveState("saved");
      // Notify parent component of the saved data
      onDataSaved?.({
        brand: brand.trim() || null,
        model: model.trim() || null,
        reference: reference.trim() || null,
      });
    } catch (e) {
      setSaveError(String(e instanceof Error ? e.message : e));
      setSaveState("error");
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors text-left">
          <span className="text-sm font-body text-yellow-400 font-medium">
            Correggi identificazione
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-yellow-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-yellow-400" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 p-4 rounded-lg border border-border bg-secondary/20 space-y-4">

          {/* Debug options */}
          <div className="flex gap-4 flex-wrap text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBrowser}
                onChange={(e) => setShowBrowser(e.target.checked)}
                className="rounded"
              />
              <span className="flex items-center gap-1 text-muted-foreground">
                {showBrowser ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Browser visibile
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Browser nascosto
                  </>
                )}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                disabled={scrapeState === "loading"}
                className="rounded"
              />
              <span className="text-muted-foreground">Salva automaticamente</span>
            </label>
          </div>

          {/* URL input + scrape */}
          <div>
            <label className="block text-xs font-body text-muted-foreground uppercase tracking-wider mb-1.5">
              URL pagina prodotto
            </label>
            <p className="text-xs text-muted-foreground font-body mb-2">
              Incolla il link della scheda ufficiale del brand, Chrono24, WatchBase o altro sito.
            </p>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.rolex.com/en-us/watches/..."
                className="font-body text-sm flex-1"
              />
              <Button
                variant="gold-outline"
                size="sm"
                onClick={handleScrapeUrl}
                disabled={scrapeState === "loading" || !url.trim().startsWith("http")}
                className="shrink-0"
              >
                {scrapeState === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                <span className="ml-1.5">Analizza</span>
              </Button>
            </div>

            {scrapeState === "done" && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Dati estratti — controlla i campi sotto
              </div>
            )}
            {scrapeState === "error" && scrapeError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {scrapeError}
              </div>
            )}
          </div>

          {/* Campi manuali */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-body text-muted-foreground uppercase tracking-wider mb-1">
                Brand
              </label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="font-body text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-body text-muted-foreground uppercase tracking-wider mb-1">
                Modello
              </label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="font-body text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-body text-muted-foreground uppercase tracking-wider mb-1">
                Referenza
              </label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-body text-sm"
              />
            </div>
          </div>

          {/* Salva */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              variant="gold"
              size="sm"
              onClick={handleSave}
              disabled={saveState === "saving" || saveState === "saved" || autoSaved}
            >
              {saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {saveState === "saved" || autoSaved ? "Salvato" : "Salva Correzione"}
            </Button>

            {(saveState === "saved" || autoSaved) && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {autoSaved ? "Auto-salvato" : "Correzione salvata"} · il sistema imparerà da questa identificazione
              </span>
            )}
            {saveState === "error" && saveError && (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5" />
                {saveError}
              </span>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
