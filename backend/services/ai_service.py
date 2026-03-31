"""AI service: porta la logica di identify-watch/index.ts in Python.

Usa l'endpoint OpenAI-compat di Gemini oppure OpenRouter (stessa struttura payload).
Nessun SDK google-generativeai necessario — solo httpx.
"""

import json
import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL_OR = "google/gemini-2.5-flash"
MODEL_GEMINI = "gemini-2.5-flash"

IMAGE_SYSTEM_PROMPT = (
    "Sei un esperto orologiaio e identificatore di orologi di lusso. Analizza l'immagine fornita e identifica l'orologio.\n\n"
    "Esamina attentamente:\n"
    "- La lunetta (bezel): materiale, scala, colore\n"
    "- Il quadrante (dial): colore, indici, sotto-quadranti\n"
    "- Le lancette: forma, colore, luminescenza\n"
    "- La cassa: forma, materiale, dimensioni stimate\n"
    "- Il bracciale o cinturino: tipo, materiale\n"
    "- Il logo o scritte visibili\n"
    "- La corona e eventuali pusher\n\n"
    "Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza testo aggiuntivo.\n\n"
    "REGOLE CRITICHE:\n"
    "- Se non sei sicuro del numero di referenza, scrivi \"Non rilevabile\". MAI inventare referenze.\n"
    "- Il campo confidence deve riflettere la tua reale certezza.\n"
    "- Se l'immagine è sfocata o parziale, fai del tuo meglio ma abbassa la confidence.\n"
    "- Prezzi in EUR basati sul mercato pre-owned attuale."
)

TEXT_SYSTEM_PROMPT = (
    "Sei un esperto orologiaio. L'utente descriverà un orologio in modo anche vago. Il tuo compito è identificare l'orologio più probabile.\n\n"
    "Esempi di input vaghi che devi saper gestire:\n"
    "- \"rolex nero subacqueo\" → Rolex Submariner Date con quadrante nero\n"
    "- \"orologio oro quadrante blu\" → potrebbe essere Rolex Day-Date, AP Royal Oak, ecc.\n"
    "- \"cronografo vintage omega\" → Omega Speedmaster Professional\n\n"
    "Se la descrizione è troppo vaga per un'identificazione singola, restituisci il match più probabile con confidence bassa "
    "e aggiungi nel campo \"alternatives\" fino a 3 alternative.\n\n"
    "Restituisci ESCLUSIVAMENTE un oggetto JSON valido, senza testo aggiuntivo."
)

WATCH_JSON_SCHEMA = {
    "type": "function",
    "function": {
        "name": "identify_watch",
        "description": "Identify a watch and return structured data",
        "parameters": {
            "type": "object",
            "properties": {
                "brand": {"type": "string"},
                "model": {"type": "string"},
                "reference": {"type": "string"},
                "confidence": {"type": "number"},
                "movement": {"type": "string"},
                "case_material": {"type": "string"},
                "case_size": {"type": "string"},
                "crystal": {"type": "string"},
                "water_resistance": {"type": "string"},
                "bracelet": {"type": "string"},
                "dial_color": {"type": "string"},
                "complications": {"type": "array", "items": {"type": "string"}},
                "visual_features": {"type": "array", "items": {"type": "string"}},
                "estimated_price_eur_min": {"type": "number"},
                "estimated_price_eur_max": {"type": "number"},
                "alternatives": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "brand": {"type": "string"},
                            "model": {"type": "string"},
                            "confidence": {"type": "number"},
                        },
                    },
                },
            },
            "required": ["brand", "model", "reference", "confidence"],
        },
    },
}


def _chat(messages: list, tools, tool_choice, ai_key: str, use_openrouter: bool, timeout: int = 60) -> dict:
    url = OPENROUTER_URL if use_openrouter else GEMINI_URL
    model = MODEL_OR if use_openrouter else MODEL_GEMINI

    payload: dict = {"model": model, "messages": messages}
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = tool_choice

    # Google Gemini API requires key in URL query params, not in Authorization header
    if not use_openrouter:
        url = f"{url}?key={ai_key}"
        resp = httpx.post(
            url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
        )
    else:
        resp = httpx.post(
            url,
            headers={"Authorization": f"Bearer {ai_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=timeout,
        )

    if resp.status_code == 429:
        raise ValueError("Troppi tentativi. Riprova tra qualche istante.")
    if resp.status_code == 402:
        raise ValueError("Crediti esauriti.")
    if resp.status_code >= 400:
        error_detail = resp.text
        try:
            error_json = resp.json()
            error_detail = error_json.get("error", {}).get("message", error_detail)
        except:
            pass
        raise ValueError(f"API Error ({resp.status_code}): {error_detail}")
    return resp.json()


def identify_watch(input_type: str, image_b64: str | None, text: str | None, ai_key: str, use_openrouter: bool) -> dict:
    if input_type == "image":
        if not image_b64:
            raise ValueError("No image provided")
        # Convert raw base64 to data URI if needed
        if not image_b64.startswith("data:"):
            image_b64 = f"data:image/jpeg;base64,{image_b64}"
        
        messages = [
            {"role": "system", "content": IMAGE_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Identifica questo orologio e restituisci i dati strutturati."},
                    {"type": "image_url", "image_url": {"url": image_b64}},
                ],
            },
        ]
    else:
        if not text:
            raise ValueError("No text provided")
        messages = [
            {"role": "system", "content": TEXT_SYSTEM_PROMPT},
            {"role": "user", "content": f'Identifica questo orologio: "{text}"'},
        ]

    data = _chat(
        messages=messages,
        tools=[WATCH_JSON_SCHEMA],
        tool_choice={"type": "function", "function": {"name": "identify_watch"}},
        ai_key=ai_key,
        use_openrouter=use_openrouter,
    )

    tool_call = data["choices"][0]["message"]["tool_calls"][0]
    return json.loads(tool_call["function"]["arguments"])


MATCH_WATCH_SCHEMA = {
    "type": "function",
    "function": {
        "name": "match_watch_on_page",
        "description": "Identify which product on the page matches the original watch",
        "parameters": {
            "type": "object",
            "properties": {
                "match_index": {
                    "type": ["integer", "null"],
                    "description": "1-based index of matching product (left-to-right, top-to-bottom), or null if none matches",
                },
                "confidence": {"type": "number", "description": "Confidence 0.0-1.0"},
                "reason": {"type": "string", "description": "Brief explanation"},
            },
            "required": ["match_index", "confidence", "reason"],
        },
    },
}

SPECS_EXTRACTION_SCHEMA = {
    "type": "function",
    "function": {
        "name": "extract_watch_specs",
        "description": "Extract technical specifications from an official brand watch product page",
        "parameters": {
            "type": "object",
            "properties": {
                "reference": {"type": "string"},
                "case_material": {"type": "string"},
                "case_size_mm": {"type": "string"},
                "movement_type": {"type": "string"},
                "caliber": {"type": "string"},
                "power_reserve_h": {"type": "string"},
                "water_resistance_m": {"type": "string"},
                "crystal": {"type": "string"},
                "bracelet_material": {"type": "string"},
                "dial_color": {"type": "string"},
                "complications": {"type": "array", "items": {"type": "string"}},
                "official_price_eur": {"type": "string"},
            },
            "required": ["reference"],
        },
    },
}


def match_watch_on_page(
    page_screenshot_b64: str,
    original_image_b64: str | None,
    ai_key: str,
    use_openrouter: bool,
) -> dict:
    """Invia screenshot della pagina + immagine originale a Gemini.
    Restituisce {match_index, confidence, reason} — match_index è 1-based o None.
    """
    if not original_image_b64:
        return {"match_index": None, "confidence": 0.0, "reason": "No original image"}

    if not page_screenshot_b64.startswith("data:"):
        page_screenshot_b64 = f"data:image/png;base64,{page_screenshot_b64}"
    if not original_image_b64.startswith("data:"):
        original_image_b64 = f"data:image/jpeg;base64,{original_image_b64}"

    system_prompt = (
        "Sei un esperto di orologeria. Ti vengono mostrate due immagini:\n"
        "1. IMMAGINE ORIGINALE: la foto dell'orologio da identificare\n"
        "2. SCREENSHOT PAGINA: una pagina web con prodotti orologi\n\n"
        "Identifica quale prodotto nello screenshot corrisponde all'orologio nell'immagine originale. "
        "Conta i prodotti da sinistra a destra, dall'alto in basso (1-based). "
        "Se nessuno corrisponde, restituisci null. Sii preciso: confronta lunetta, quadrante, cassa, bracciale."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "IMMAGINE ORIGINALE (orologio da identificare):"},
                {"type": "image_url", "image_url": {"url": original_image_b64}},
                {"type": "text", "text": "SCREENSHOT PAGINA (prodotti sul sito ufficiale):"},
                {"type": "image_url", "image_url": {"url": page_screenshot_b64}},
                {"type": "text", "text": "Quale prodotto nella pagina corrisponde all'orologio originale?"},
            ],
        },
    ]

    data = _chat(
        messages=messages,
        tools=[MATCH_WATCH_SCHEMA],
        tool_choice={"type": "function", "function": {"name": "match_watch_on_page"}},
        ai_key=ai_key,
        use_openrouter=use_openrouter,
        timeout=30,
    )
    tool_call = data["choices"][0]["message"]["tool_calls"][0]
    return json.loads(tool_call["function"]["arguments"])


def extract_watch_specs(
    page_screenshot_b64: str,
    page_text: str,
    ai_key: str,
    use_openrouter: bool,
) -> dict:
    """Estrae specifiche tecniche da screenshot + testo di una pagina prodotto ufficiale.
    Restituisce dict con reference, case_material, case_size_mm, movement_type, caliber, ecc.
    """
    if not page_screenshot_b64.startswith("data:"):
        page_screenshot_b64 = f"data:image/png;base64,{page_screenshot_b64}"

    # Tronca il testo pagina per non saturare il contesto
    truncated_text = page_text[:4000] if page_text else ""

    system_prompt = (
        "Sei su una pagina prodotto del sito ufficiale di un brand di orologi. "
        "Estrai le specifiche tecniche dalla pagina. "
        "Restituisci SOLO i dati effettivamente presenti — non inventare nulla. "
        "Se un campo non è presente, omettilo o usa stringa vuota."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"TESTO PAGINA:\n{truncated_text}\n\nSCREENSHOT PAGINA:"},
                {"type": "image_url", "image_url": {"url": page_screenshot_b64}},
                {"type": "text", "text": "Estrai le specifiche tecniche dell'orologio."},
            ],
        },
    ]

    data = _chat(
        messages=messages,
        tools=[SPECS_EXTRACTION_SCHEMA],
        tool_choice={"type": "function", "function": {"name": "extract_watch_specs"}},
        ai_key=ai_key,
        use_openrouter=use_openrouter,
        timeout=30,
    )
    tool_call = data["choices"][0]["message"]["tool_calls"][0]
    return json.loads(tool_call["function"]["arguments"])


def generate_description(brand: str, model: str, reference: str, ai_key: str, use_openrouter: bool) -> str:
    prompt = (
        f"Sei un giornalista esperto di orologeria di lusso che scrive per una rivista italiana di alto livello.\n\n"
        f"Genera una descrizione editoriale dell'orologio identificato:\n"
        f"- Brand: {brand}\n"
        f"- Modello: {model}\n"
        f"- Referenza: {reference}\n\n"
        f"La descrizione deve essere:\n"
        f"- In italiano elegante e coinvolgente\n"
        f"- 150-250 parole\n"
        f"- Includere storia del modello, caratteristiche tecniche salienti, posizionamento nel mercato\n"
        f"- Tono: autorevole ma accessibile, come un articolo di Hodinkee in italiano\n"
        f"- NON usare frasi come \"questo orologio è perfetto per chi...\" o altri cliché commerciali"
    )

    data = _chat(
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": "Genera la descrizione editoriale."},
        ],
        tools=None,
        tool_choice=None,
        ai_key=ai_key,
        use_openrouter=use_openrouter,
    )
    return data["choices"][0]["message"].get("content") or ""
