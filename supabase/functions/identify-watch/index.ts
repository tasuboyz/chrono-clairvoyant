import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_SYSTEM_PROMPT = `Sei un esperto orologiaio e identificatore di orologi di lusso. Analizza l'immagine fornita e identifica l'orologio.

Esamina attentamente:
- La lunetta (bezel): materiale, scala, colore
- Il quadrante (dial): colore, indici, sotto-quadranti
- Le lancette: forma, colore, luminescenza
- La cassa: forma, materiale, dimensioni stimate
- Il bracciale o cinturino: tipo, materiale
- Il logo o scritte visibili
- La corona e eventuali pusher

Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza testo aggiuntivo.

REGOLE CRITICHE:
- Se non sei sicuro del numero di referenza, scrivi "Non rilevabile". MAI inventare referenze.
- Il campo confidence deve riflettere la tua reale certezza.
- Se l'immagine è sfocata o parziale, fai del tuo meglio ma abbassa la confidence.
- Prezzi in EUR basati sul mercato pre-owned attuale.`;

const TEXT_SYSTEM_PROMPT = `Sei un esperto orologiaio. L'utente descriverà un orologio in modo anche vago. Il tuo compito è identificare l'orologio più probabile.

Esempi di input vaghi che devi saper gestire:
- "rolex nero subacqueo" → Rolex Submariner Date con quadrante nero
- "orologio oro quadrante blu" → potrebbe essere Rolex Day-Date, AP Royal Oak, ecc.
- "cronografo vintage omega" → Omega Speedmaster Professional

Se la descrizione è troppo vaga per un'identificazione singola, restituisci il match più probabile con confidence bassa e aggiungi nel campo "alternatives" fino a 3 alternative.

Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza testo aggiuntivo.`;

const WATCH_JSON_SCHEMA = {
  type: "function",
  function: {
    name: "identify_watch",
    description: "Identify a watch and return structured data",
    parameters: {
      type: "object",
      properties: {
        brand: { type: "string" },
        model: { type: "string" },
        reference: { type: "string" },
        confidence: { type: "number" },
        movement: { type: "string" },
        case_material: { type: "string" },
        case_size: { type: "string" },
        crystal: { type: "string" },
        water_resistance: { type: "string" },
        bracelet: { type: "string" },
        dial_color: { type: "string" },
        complications: { type: "array", items: { type: "string" } },
        visual_features: { type: "array", items: { type: "string" } },
        estimated_price_eur_min: { type: "number" },
        estimated_price_eur_max: { type: "number" },
        alternatives: {
          type: "array",
          items: {
            type: "object",
            properties: {
              brand: { type: "string" },
              model: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
      },
      required: ["brand", "model", "reference", "confidence"],
    },
  },
};

const DESCRIPTION_PROMPT = (brand: string, model: string, reference: string) =>
  `Sei un giornalista esperto di orologeria di lusso che scrive per una rivista italiana di alto livello.

Genera una descrizione editoriale dell'orologio identificato:
- Brand: ${brand}
- Modello: ${model}
- Referenza: ${reference}

La descrizione deve essere:
- In italiano elegante e coinvolgente
- 150-250 parole
- Includere storia del modello, caratteristiche tecniche salienti, posizionamento nel mercato
- Tono: autorevole ma accessibile, come un articolo di Hodinkee in italiano
- NON usare frasi come "questo orologio è perfetto per chi..." o altri cliché commerciali`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) throw new Error("No AI API key configured (set GEMINI_API_KEY or LOVABLE_API_KEY)");

    const AI_URL = GEMINI_API_KEY
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const AI_KEY = (GEMINI_API_KEY ?? LOVABLE_API_KEY)!;
    const AI_MODEL = GEMINI_API_KEY ? "gemini-2.5-flash" : "google/gemini-2.5-flash";

    const { input_type, image_base64, text } = await req.json();

    // Step 1: Identify the watch
    let messages: any[];
    if (input_type === "image") {
      if (!image_base64) throw new Error("No image provided");
      messages = [
        { role: "system", content: IMAGE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Identifica questo orologio e restituisci i dati strutturati." },
            { type: "image_url", image_url: { url: image_base64 } },
          ],
        },
      ];
    } else {
      if (!text) throw new Error("No text provided");
      messages = [
        { role: "system", content: TEXT_SYSTEM_PROMPT },
        { role: "user", content: `Identifica questo orologio: "${text}"` },
      ];
    }

    const identifyResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        tools: [WATCH_JSON_SCHEMA],
        tool_choice: { type: "function", function: { name: "identify_watch" } },
      }),
    });

    if (!identifyResponse.ok) {
      const status = identifyResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Troppi tentativi. Riprova tra qualche istante." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crediti esauriti." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await identifyResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    const identifyData = await identifyResponse.json();
    const toolCall = identifyData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const watch = JSON.parse(toolCall.function.arguments);

    // Step 2: Generate expert description
    const descResponse = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: DESCRIPTION_PROMPT(watch.brand, watch.model, watch.reference) },
          { role: "user", content: "Genera la descrizione editoriale." },
        ],
      }),
    });

    let description = "";
    if (descResponse.ok) {
      const descData = await descResponse.json();
      description = descData.choices?.[0]?.message?.content || "";
    }

    // Step 3: Log identification to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(`${supabaseUrl}/rest/v1/identifications`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        input_type,
        input_text: text || null,
        result_brand: watch.brand,
        result_model: watch.model,
        result_reference: watch.reference,
        confidence: watch.confidence,
        full_result: watch,
      }),
    });

    // Step 4: Upsert watch to watches table (check if exists)
    const searchRes = await fetch(
      `${supabaseUrl}/rest/v1/watches?brand=eq.${encodeURIComponent(watch.brand)}&model=eq.${encodeURIComponent(watch.model)}&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const existing = await searchRes.json();

    if (!existing || existing.length === 0) {
      await fetch(`${supabaseUrl}/rest/v1/watches`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          brand: watch.brand,
          model: watch.model,
          reference: watch.reference,
          movement: watch.movement,
          case_material: watch.case_material,
          case_size: watch.case_size,
          crystal: watch.crystal,
          water_resistance: watch.water_resistance,
          bracelet: watch.bracelet,
          dial_color: watch.dial_color,
          complications: watch.complications,
          price_range_min: watch.estimated_price_eur_min,
          price_range_max: watch.estimated_price_eur_max,
          description,
        }),
      });
    }

    return new Response(JSON.stringify({ watch, description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("identify-watch error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
