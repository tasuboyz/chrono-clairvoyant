import { useState, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { loadSettings } from "@/hooks/useSettings";

interface IdentifierTabsProps {
  defaultTab?: string;
}

const IdentifierTabs = forwardRef<HTMLDivElement, IdentifierTabsProps>(({ defaultTab = "image" }, ref) => {
  const [tab, setTab] = useState(defaultTab);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'immagine è troppo grande. Massimo 10MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato non supportato. Usa JPG, PNG o WebP.");
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleAnalyze = async (type: "image" | "text") => {
    setLoading(true);
    try {
      let body: any = { input_type: type };

      // Attach the user-configured Gemini key so the edge function can use it
      // when no server-side AI key is set (demo / self-hosted mode).
      const { geminiApiKey } = loadSettings();
      if (geminiApiKey) body.gemini_api_key = geminiApiKey;

      if (type === "image" && image) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(image);
        });
        body.image_base64 = base64;
      } else if (type === "text") {
        if (!text.trim()) {
          toast.error("Inserisci una descrizione dell'orologio.");
          setLoading(false);
          return;
        }
        body.text = text;
      }

      const { data, error } = await supabase.functions.invoke("identify-watch", { body });

      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "Errore sconosciuto");

      navigate("/result", { state: { result: data, imagePreview: type === "image" ? imagePreview : null } });
    } catch (err: any) {
      console.error(err);
      toast.error("Si è verificato un errore. Riprova tra qualche istante.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={ref} className="py-20">
      <div className="container max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary h-12 rounded-lg">
              <TabsTrigger value="image" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-body">
                <ImageIcon className="mr-2 h-4 w-4" />
                Carica Foto
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md font-body">
                <FileText className="mr-2 h-4 w-4" />
                Descrivi a Parole
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="image" className="mt-8" key="image-tab">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {!imagePreview ? (
                    <div
                      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 ${
                        dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("file-input")?.click()}
                    >
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-foreground font-body mb-2">Trascina qui la foto dell'orologio</p>
                      <p className="text-muted-foreground text-sm">oppure clicca per selezionare — JPG, PNG, WebP (max 10MB)</p>
                      <input id="file-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </div>
                  ) : (
                    <div className="relative glass-card p-4 rounded-lg">
                      <button onClick={() => { setImage(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-secondary rounded-full p-1 hover:bg-muted transition-colors">
                        <X className="h-4 w-4 text-foreground" />
                      </button>
                      <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-contain rounded" />
                    </div>
                  )}
                  <Button variant="gold" size="lg" className="w-full mt-6 py-6 text-base" disabled={!image || loading} onClick={() => handleAnalyze("image")}>
                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analisi in corso...</> : "Analizza Orologio"}
                  </Button>
                </motion.div>
              </TabsContent>

              <TabsContent value="text" className="mt-8" key="text-tab">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Es: Rolex Submariner nero, Omega Speedmaster vintage, orologio d'oro con quadrante bianco..."
                    className="w-full h-40 bg-input border border-border rounded-lg p-4 text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <Button variant="gold" size="lg" className="w-full mt-6 py-6 text-base" disabled={!text.trim() || loading} onClick={() => handleAnalyze("text")}>
                    {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Identificazione in corso...</> : "Identifica Orologio"}
                  </Button>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
});

IdentifierTabs.displayName = "IdentifierTabs";

export default IdentifierTabs;
