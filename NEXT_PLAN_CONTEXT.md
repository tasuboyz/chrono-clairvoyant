# Contesto per il prossimo piano: Sistema di Analisi AI Avanzato

## Visione

Trasformare l'identificazione da una singola chiamata AI a un **pipeline intelligente multi-step** che incrocia tre fonti di verità — database interno, memoria vettoriale (RAG) e ricerca internet in tempo reale — mostrando all'utente ogni passo con animazioni live.

---

## Stato attuale del sistema

### Frontend
- React + Vite + TypeScript, servito staticamente da Flask
- Input: immagine upload / URL / webcam / testo libero (`IdentifierTabs.tsx`)
- Output: pagina risultati con scheda tecnica, analisi mercato (dati mock), scheda SEO
- Nessun feedback visivo durante l'elaborazione (solo spinner generico)

### Backend Flask (Python, `backend/`)
- `POST /api/identify` → chiama Gemini/OpenRouter, restituisce `{ watch, description }`
- `POST /api/market` → Playwright scrapa Chrono24, restituisce listing prezzi
- Nessun DB locale, nessuna persistenza dei risultati, nessuna RAG

---

## Cosa deve diventare

### 1. Pipeline di analisi multi-step

Ogni identificazione attraversa questi step in sequenza, trasmessi al frontend via **Server-Sent Events (SSE)**:

```
STEP 1 — AI Vision          (analisi immagine con Gemini)
STEP 2 — DB Lookup          (cerca nel DB locale orologio corrispondente)
STEP 3 — RAG Cross-check    (confronta con risultati precedenti validati)
STEP 4 — Web Search         (sequenza ricerche internet: sito ufficiale → forum → marketplace)
STEP 5 — Data Fusion        (incrocia tutte le fonti, calcola confidenza per campo)
STEP 6 — Result             (risposta finale con incongruenze evidenziate)
```

Il frontend mostra ogni step con animazione dedicata in tempo reale.

---

### 2. Database locale + RAG

**Persistenza dei risultati validati:**
- Ogni identificazione completata viene salvata in SQLite (`backend/data/watches.db`)
- Schema: `watch_id, brand, model, reference, confidence, specs_json, sources_json, created_at, validated`
- I risultati con confidence > soglia (es. 80%) vengono marcati come `validated=true`

**RAG (Retrieval-Augmented Generation):**
- Embedding dei risultati validati con un modello locale leggero (es. `sentence-transformers/all-MiniLM-L6-v2` via `chromadb` o `faiss`)
- Alla nuova identificazione: recupera i K risultati più simili dal vettore store
- Passa i risultati simili come contesto aggiuntivo alla chiamata AI
- Librerie candidate: `chromadb` (più semplice) o `faiss-cpu` + `sentence-transformers`

---

### 3. Ricerca internet con Playwright (sequenza prioritizzata)

Per ogni orologio identificato, Playwright esegue una sequenza di ricerche ordinata:

**Priorità siti per dati tecnici:**
1. Sito ufficiale del brand (es. `rolex.com`, `omegawatches.com`) — dati ufficiali
2. WatchBase / WatchCuts — database tecnico di riferimento
3. Hodinkee / Revolution Watch — giornalismo settore, storia modello
4. Forum specializzati (WatchUSeek, Reddit r/Watches) — conferme community

**Priorità siti per prezzi di mercato:**
1. Chrono24 — listing volume maggiore, prezzi affidabili
2. Watchfinder — mercato premium EU
3. Bob's Watches — mercato US, buon riferimento Rolex
4. eBay completati — prezzi di vendita reale (non listing)
5. LuxuryInStock — spesso prezzi competitivi

Ogni sito restituisce dati con `source_url`, `source_name`, `scraped_at`, `confidence_weight`.

---

### 4. Data Fusion e confidenza per campo

Dopo aver raccolto dati da tutte le fonti, il sistema fonde i risultati:

```python
# Esempio output per ogni campo della scheda tecnica
{
  "brand": {
    "value": "Rolex",
    "confidence": 0.99,
    "sources": ["AI Vision", "rolex.com", "Chrono24"]
  },
  "reference": {
    "value": "126610LN",
    "confidence": 0.87,
    "sources": ["AI Vision", "Chrono24"],
    "warning": "Riferimento non trovato su sito ufficiale, possibile variante"
  },
  "case_size": {
    "value": "41mm",
    "confidence": 0.95,
    "sources": ["rolex.com", "WatchBase"]
  }
}
```

Le incongruenze (valore diverso tra fonti) vengono evidenziate nel risultato con badge `⚠ Dato incerto`.

---

### 5. Animazione frontend — Live Analysis Feed

Nuovo componente `AnalysisFeed.tsx` che si apre durante l'elaborazione:

- **Layout**: drawer/modal laterale o inline sotto l'upload box
- **Ogni step** ha una riga con:
  - Icona animata (spinner → check ✓ quando completo)
  - Label del passo ("Analisi visiva con AI", "Ricerca database", ecc.)
  - Dettaglio live ("Trovato: Rolex Submariner (82% conf.)", "Cercando su rolex.com...")
  - Durata step

```
┌─────────────────────────────────────────┐
│  Analisi in corso...                    │
│                                         │
│  ✓  Visione AI           1.2s           │
│     Rolex Submariner rilevato (82%)     │
│                                         │
│  ✓  Database interno     0.1s           │
│     3 occorrenze simili trovate         │
│                                         │
│  ⟳  Ricerca web          ...            │
│     rolex.com → scheda tecnica ✓        │
│     chrono24.com → 847 listing trovati  │
│     watchfinder.co.uk → in corso...     │
│                                         │
│  ○  Sintesi dati                        │
│  ○  Risultato finale                    │
└─────────────────────────────────────────┘
```

Comunicazione backend→frontend: **SSE** (`text/event-stream`) sull'endpoint `GET /api/analyze/stream?session_id=xxx` (il POST `/api/analyze` avvia la sessione e restituisce subito il `session_id`).

---

### 6. Pagina risultati arricchita

Il componente `Result.tsx` va esteso per mostrare:

**Scheda tecnica:**
- Ogni campo ha accanto: badge confidenza (colore verde/giallo/rosso) + tooltip con fonti
- Incongruenze evidenziate in giallo con spiegazione
- Pulsante "Vedi fonti" espandibile per ogni dato

**Analisi mercato (dati reali):**
- Prezzi min/avg/max aggregati da tutte le fonti (non più mock)
- Tabella listing reali con: fonte, prezzo, condizione, link, data scraping
- Grafico storico prezzi (se disponibile da Chrono24 o WatchCharts API)
- Badge liquidità calcolato su volume listing

**Dove acquistare:**
- Card per ogni marketplace con: logo, prezzo migliore trovato, numero listing, link diretto alla ricerca
- Ordinati per prezzo crescente
- Evidenziato il "miglior prezzo trovato"

---

## Stack tecnico aggiuntivo necessario

### Backend Python
```
chromadb>=0.5          # vector store per RAG
sentence-transformers  # embedding locale (all-MiniLM-L6-v2)
sqlalchemy             # ORM per SQLite
flask-cors             # già presente implicitamente, da aggiungere formalmente
```

### Frontend
- `EventSource` API (nativa browser) per consumare SSE — nessuna libreria extra
- Nuovo componente `AnalysisFeed.tsx`
- Aggiornamenti a `Result.tsx` per i nuovi campi con confidenza/fonti

---

## Struttura backend aggiornata

```
backend/
├── run.py
├── app.py
├── config.py
├── data/
│   ├── watches.db          # SQLite: risultati validati
│   └── chroma/             # ChromaDB vector store
├── routes/
│   ├── identify.py         # ora avvia pipeline asincrona
│   ├── analyze.py          # NUOVO: POST /api/analyze + GET /api/analyze/stream
│   └── market.py
└── services/
    ├── ai_service.py
    ├── pipeline.py          # NUOVO: orchestratore dell'intera pipeline multi-step
    ├── db_service.py        # NUOVO: SQLite CRUD + query per similarità
    ├── rag_service.py       # NUOVO: embedding + ChromaDB query/upsert
    ├── web_search_service.py # NUOVO: sequenza ricerche Playwright per siti ufficiali
    ├── fusion_service.py    # NUOVO: data fusion + calcolo confidenza per campo
    ├── playwright_service.py
    └── scrapers/
        ├── chrono24.py
        ├── watchfinder.py   # NUOVO
        └── official_brand.py # NUOVO: siti ufficiali brand
```

---

## Priorità di implementazione

1. **SSE + animazione frontend** — impatto visivo immediato, anche con dati mock
2. **SQLite persistenza** — base per tutto il resto
3. **RAG con ChromaDB** — migliora qualità identificazione nel tempo
4. **Web search sequenziata** — dati tecnici reali da siti ufficiali
5. **Data fusion + confidenza per campo** — il cuore del sistema intelligente
6. **Prezzi reali multi-source** — Chrono24 + Watchfinder + eBay
7. **UI risultati arricchita** — badge confidenza, fonti, incongruenze

---

## Note importanti

- Il sistema deve funzionare anche senza tutti i siti (graceful degradation): se un sito è irraggiungibile, salta e annota l'errore nelle fonti
- Il RAG migliora nel tempo: più identificazioni validate → risultati più precisi
- La confidenza per campo è il differenziatore chiave rispetto ai competitor
- Tutta la comunicazione SSE usa `session_id` per permettere analisi parallele multiple
