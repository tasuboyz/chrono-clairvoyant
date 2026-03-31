import { useState } from "react";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/useSettings";

export default function SettingsModal() {
  const { settings, save } = useSettings();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(settings);

  const handleOpen = (v: boolean) => {
    if (v) setForm(settings);
    setOpen(v);
  };

  const handleSave = () => {
    save(form, true); // saves and reloads
  };

  const field = (id: keyof typeof form) => ({
    value: form[id],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [id]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Impostazioni"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Settings size={18} />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurazione</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Inserisci le tue credenziali per usare l'app in autonomia. I valori
          vengono salvati solo nel tuo browser (localStorage) e non vengono mai
          inviati a terze parti.
        </p>

        <div className="space-y-4 mt-2">
          {/* ── Supabase ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Supabase
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="sb-url">Project URL</Label>
                <Input
                  id="sb-url"
                  placeholder="https://xxxxxxxxxxx.supabase.co"
                  {...field("supabaseUrl")}
                />
                <p className="text-xs text-muted-foreground">
                  Supabase → Project Settings → API → Project URL
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sb-key">Anon / Public Key</Label>
                <Input
                  id="sb-key"
                  type="password"
                  placeholder="eyJhbGci..."
                  {...field("supabaseAnonKey")}
                />
                <p className="text-xs text-muted-foreground">
                  Supabase → Project Settings → API → anon public
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── AI ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              AI (identificazione orologi)
            </p>
            <div className="space-y-1">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIzaSy..."
                {...field("geminiApiKey")}
              />
              <p className="text-xs text-muted-foreground">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  Google AI Studio → Get API key
                </a>
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="debug-mode">Modalità test (debug)</Label>
              <select
                id="debug-mode"
                value={form.debugMode ?? "false"}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, debugMode: e.target.value }))
                }
                className="w-full border border-border rounded px-3 py-2"
              >
                <option value="false">Disattivato</option>
                <option value="true">Attivato</option>
              </select>
              <p className="text-xs text-muted-foreground">
                In modalità test ricevi informazioni extra su AI + ricerche web.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave}>Salva e ricarica</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
