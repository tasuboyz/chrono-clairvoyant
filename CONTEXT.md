# Chrono Clairvoyant — Contesto del Progetto

## Cos'è

App web italiana per l'identificazione di orologi di lusso tramite AI.
L'utente carica una foto o descrive l'orologio a parole; l'AI risponde con marca, modello, referenza, specifiche tecniche, stima di prezzo e descrizione editoriale.

Progetto sviluppato con **Lovable** e collegato a **Supabase** per backend e storage dati.

---

## Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| Animazioni | Framer Motion |
| Routing | React Router DOM v6 |
| State/Query | TanStack Query v5 |
| Backend | Supabase (DB + Edge Functions) |
| AI | Lovable AI Gateway → Google Gemini 2.5 Flash |
| Test | Vitest + Testing Library + Playwright |

---

## Architettura

```
Browser
  └── React SPA (Vite)
        ├── Index page  → hero + IdentifierTabs + TrustSection + BrandMarquee + Footer
        ├── Result page → dettaglio orologio identificato
        └── supabase.functions.invoke("identify-watch")
              └── Supabase Edge Function (Deno)
                    ├── Step 1: chiama AI Gateway → identifica orologio (tool call JSON)
                    ├── Step 2: chiama AI Gateway → genera descrizione editoriale italiana
                    ├── Step 3: salva in tabella `identifications` (log)
                    └── Step 4: upsert in tabella `watches` (catalogo)
```

---

## Flusso Utente

1. **Home (Index)** — hero con CTA, poi sezione con due tab:
   - **Carica Foto** — drag & drop o click, JPG/PNG/WebP max 10MB
   - **Descrivi a Parole** — testo libero (es. "Rolex nero subacqueo")
2. Clic su "Analizza Orologio" → richiesta alla Edge Function
3. **Result page** — mostra:
   - Brand, modello, referenza
   - Barra di confidenza (verde ≥80%, giallo ≥50%, rosso <50%)
   - Specifiche tecniche (movimento, cassa, vetro, impermeabilità, ecc.)
   - Stima prezzo in EUR (mercato pre-owned)
   - Descrizione editoriale italiana (~200 parole)
   - Link a Chrono24, LuxuryInStock, sito ufficiale brand

---

## Struttura File Chiave

```
src/
  pages/
    Index.tsx          # homepage — compone tutti i sezioni
    Result.tsx         # pagina risultato identificazione
    NotFound.tsx       # 404
  components/
    IdentifierTabs.tsx # CORE: upload foto + testo, chiama Edge Function
    Hero.tsx           # sezione hero con CTA
    Navbar.tsx         # barra navigazione
    Footer.tsx         # footer
    TrustSection.tsx   # sezione "perché fidarsi"
    BrandMarquee.tsx   # scorrimento brand supportati
    ui/                # componenti shadcn/ui
  integrations/supabase/
    client.ts          # supabaseClient (anon key da .env)
    types.ts           # tipi DB generati da Supabase
supabase/functions/
  identify-watch/
    index.ts           # Edge Function Deno — tutta la logica AI
```

---

## Edge Function: `identify-watch`

**Runtime**: Deno (deploy su Supabase)
**Variabili d'ambiente richieste**:
- `LOVABLE_API_KEY` — chiave Lovable AI Gateway
- `SUPABASE_URL` — URL progetto Supabase (auto-inject)
- `SUPABASE_SERVICE_ROLE_KEY` — service role (auto-inject)

**AI Model**: `google/gemini-2.5-flash` via `https://ai.gateway.lovable.dev/v1/chat/completions`

**Input**:
```json
{ "input_type": "image", "image_base64": "data:image/jpeg;base64,..." }
{ "input_type": "text",  "text": "Rolex Submariner nero" }
```

**Output**:
```json
{
  "watch": {
    "brand": "Rolex", "model": "Submariner Date", "reference": "126610LN",
    "confidence": 0.92,
    "movement": "Automatico Cal. 3235",
    "case_material": "Acciaio Oystersteel",
    "case_size": "41mm", "crystal": "Zaffiro", "water_resistance": "300m",
    "bracelet": "Oyster", "dial_color": "Nero",
    "complications": ["Data"],
    "estimated_price_eur_min": 10000, "estimated_price_eur_max": 14000
  },
  "description": "Testo editoriale in italiano..."
}
```

---

## Database Supabase

**Tabella `identifications`** — log di ogni richiesta:
- `input_type`, `input_text`, `result_brand`, `result_model`, `result_reference`, `confidence`, `full_result` (JSON)

**Tabella `watches`** — catalogo orologi identificati (upsert per brand+model):
- Tutte le specifiche tecniche + `description`, `price_range_min/max`

---

## Configurazione Locale

File `.env` (già presente):
```
VITE_SUPABASE_URL=https://kqcknjzhxzjzfvbpmgud.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
VITE_SUPABASE_PROJECT_ID=kqcknjzhxzjzfvbpmgud
```

**Avvio**:
```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # build produzione
npm test           # vitest unit test
```

> La Edge Function viene eseguita su Supabase Cloud (non in locale).
> Per testare localmente serve `supabase start` + Supabase CLI.

---

## Note Architetturali

- **CORS**: la Edge Function usa `Access-Control-Allow-Origin: *` — adeguato per un'app pubblica senza autenticazione utente
- **Confidenza**: se `watch.confidence < 0.5` viene mostrato un avviso giallo nella Result page
- **Riferenza non rilevabile**: il prompt AI è istruito a non inventare referenze — scrive `"Non rilevabile"` se incerto
- **Rate limiting**: gestito dal gateway AI (HTTP 429 → messaggio all'utente)
- **Brand supportati** per link ufficiali: Rolex, Omega, Cartier, AP, Patek Philippe, Hublot, IWC, Breitling, TAG Heuer, Jaeger-LeCoultre, Chopard, Panerai, Tudor, Longines, Zenith, Vacheron Constantin, Blancpain
