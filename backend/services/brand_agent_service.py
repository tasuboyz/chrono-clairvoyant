"""Brand Agent: naviga il sito ufficiale del brand, fa visual matching con l'immagine originale,
estrae reference + specs dalla pagina prodotto.

Flusso per ogni brand supportato:
  1. Navigazione — va alla pagina di ricerca/collezione del brand
  2. Visual Matching — screenshot + Gemini per trovare il prodotto corrispondente
  3. Estrazione specs — screenshot pagina prodotto + Gemini per estrarre reference e specifiche
"""

import base64
import time
from urllib.parse import urlencode
from typing import Any

import config
from services.ai_service import match_watch_on_page, extract_watch_specs

# ---------------------------------------------------------------------------
# Config brand: URL di ingresso e strategia di navigazione
# "search" → aggiunge ?{param}={model} all'URL e aspetta risultati
# "browse" → naviga all'URL e cerca link corrispondente al modello nel DOM
# ---------------------------------------------------------------------------
BRAND_CONFIG: dict[str, dict[str, Any]] = {
    "rolex": {
        "search_url": "https://www.rolex.com/en-us/watches",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "rolex.com",
    },
    "tudor": {
        "search_url": "https://www.tudorwatch.com/en/watches",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "tudorwatch.com",
    },
    "omega": {
        "search_url": "https://www.omegawatches.com/en/find-a-watch",
        "search_param": "q",
        "strategy": "search",
        "brand_site": "omegawatches.com",
    },
    "tag heuer": {
        "search_url": "https://www.tagheuer.com/en/search",
        "search_param": "q",
        "strategy": "search",
        "brand_site": "tagheuer.com",
    },
    "breitling": {
        "search_url": "https://www.breitling.com/int/en/watches",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "breitling.com",
    },
    "iwc": {
        "search_url": "https://www.iwc.com/en/watch-collections",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "iwc.com",
    },
    "cartier": {
        "search_url": "https://www.cartier.com/en-us/search",
        "search_param": "q",
        "strategy": "search",
        "brand_site": "cartier.com",
    },
    "patek philippe": {
        "search_url": "https://www.patek.com/en/collection",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "patek.com",
    },
    "audemars piguet": {
        "search_url": "https://www.audemarspiguet.com/com/en/search",
        "search_param": "q",
        "strategy": "search",
        "brand_site": "audemarspiguet.com",
    },
    "hublot": {
        "search_url": "https://www.hublot.com/en/search",
        "search_param": "q",
        "strategy": "search",
        "brand_site": "hublot.com",
    },
    "zenith": {
        "search_url": "https://www.zenith-watches.com/en_INT/watches",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "zenith-watches.com",
    },
    "longines": {
        "search_url": "https://www.longines.com/en/watches",
        "search_param": None,
        "strategy": "browse",
        "brand_site": "longines.com",
    },
}

_EMPTY_RESULT = {
    "found": False,
    "reference": None,
    "specs": {},
    "source_url": None,
    "brand_site": None,
    "match_confidence": 0.0,
}

# Selettori comuni per cookie banner
_COOKIE_SELECTORS = (
    "#onetrust-accept-btn-handler",
    "button:has-text('Accept all')",
    "button:has-text('Accept All')",
    "button:has-text('Accetta tutto')",
    "button:has-text('Accepter tout')",
    "button:has-text('Accept')",
    "button:has-text('Accetta')",
    "[aria-label*='accept']",
    "[data-testid*='accept']",
)


def _dismiss_cookies(page, timeout_ms: int = 3000) -> None:
    for sel in _COOKIE_SELECTORS:
        try:
            page.click(sel, timeout=timeout_ms)
            time.sleep(0.5)
            break
        except Exception:
            pass


def _page_screenshot_b64(page) -> str:
    raw = page.screenshot(full_page=False, type="png")
    return base64.b64encode(raw).decode()


def _navigate_search(page, cfg: dict, model: str, timeout_ms: int) -> bool:
    """Strategy 'search': costruisce URL con query param e naviga."""
    param = cfg["search_param"]
    url = f"{cfg['search_url']}?{urlencode({param: model})}"
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        _dismiss_cookies(page)
        page.wait_for_timeout(1500)
        return True
    except Exception:
        return False


def _navigate_browse(page, cfg: dict, model: str, timeout_ms: int) -> bool:
    """Strategy 'browse': naviga alla collection page, poi cerca link testuale per il modello."""
    try:
        page.goto(cfg["search_url"], wait_until="domcontentloaded", timeout=timeout_ms)
        _dismiss_cookies(page)
        page.wait_for_timeout(1000)
        # Prova a cliccare su un link che contiene il nome del modello (case-insensitive)
        model_lower = model.lower()
        links = page.query_selector_all("a[href]")
        for link in links:
            try:
                text = (link.inner_text() or "").lower()
                href = (link.get_attribute("href") or "").lower()
                if model_lower in text or model_lower in href:
                    link.click(timeout=3000)
                    page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)
                    _dismiss_cookies(page)
                    page.wait_for_timeout(1000)
                    return True
            except Exception:
                continue
        # Nessun link trovato, rimaniamo sulla collection page — il visual match funzionerà comunque
        return True
    except Exception:
        return False


def _click_nth_product(page, index: int, timeout_ms: int) -> str | None:
    """Clicca sull'n-esimo prodotto cliccabile nella pagina (1-based).
    Restituisce l'URL della pagina dopo il click, o None in caso di errore.
    """
    # Selettori candidati per card prodotto cliccabili
    product_selectors = [
        "a[href*='/watches/']",
        "a[href*='/watch/']",
        "a[href*='/timepieces/']",
        "a[href*='/collection/']",
        ".product-card a",
        ".watch-card a",
        "article a",
    ]
    for sel in product_selectors:
        try:
            items = page.query_selector_all(sel)
            # Filtra i link che puntano a pagine prodotto (contengono un'immagine o hanno href non-root)
            product_links = [
                el for el in items
                if el.get_attribute("href") and len(el.get_attribute("href")) > 5
            ]
            if len(product_links) >= index:
                target = product_links[index - 1]
                target.scroll_into_view_if_needed()
                target.click(timeout=3000)
                page.wait_for_load_state("domcontentloaded", timeout=timeout_ms)
                _dismiss_cookies(page)
                page.wait_for_timeout(1000)
                return page.url
        except Exception:
            continue
    return None


def search_on_brand_site(
    brand: str,
    model: str,
    image_b64: str | None,
    page,
    ai_key: str,
    use_openrouter: bool,
    timeout_ms: int = 12000,
) -> dict:
    """Naviga il sito ufficiale del brand, fa visual matching e estrae reference + specs.

    Args:
        brand: nome del brand (case-insensitive)
        model: nome del modello
        image_b64: immagine originale in base64 (per visual matching); None per input testuale
        page: Playwright page già aperta
        ai_key: chiave AI
        use_openrouter: True se OpenRouter, False se Gemini diretto
        timeout_ms: timeout per le operazioni Playwright

    Returns:
        {found, reference, specs, source_url, brand_site, match_confidence}
    """
    brand_key = brand.lower().strip()
    cfg = BRAND_CONFIG.get(brand_key)
    if not cfg:
        return {**_EMPTY_RESULT, "brand_site": brand_key}

    # --- Fase 1: Navigazione ---
    strategy = cfg["strategy"]
    if strategy == "search":
        ok = _navigate_search(page, cfg, model, timeout_ms)
    else:
        ok = _navigate_browse(page, cfg, model, timeout_ms)

    if not ok:
        return {**_EMPTY_RESULT, "brand_site": cfg["brand_site"]}

    # --- Fase 2: Visual Matching ---
    screenshot_b64 = _page_screenshot_b64(page)

    if image_b64:
        # Input immagine: usa Gemini per visual match
        match_result = match_watch_on_page(
            page_screenshot_b64=screenshot_b64,
            original_image_b64=image_b64,
            ai_key=ai_key,
            use_openrouter=use_openrouter,
        )
        match_idx = match_result.get("match_index")
        match_conf = float(match_result.get("confidence", 0.0))

        if not match_idx or match_conf < 0.5:
            return {**_EMPTY_RESULT, "brand_site": cfg["brand_site"]}

        # Clicca sul prodotto corrispondente
        product_url = _click_nth_product(page, match_idx, timeout_ms)
        if not product_url:
            return {**_EMPTY_RESULT, "brand_site": cfg["brand_site"]}
    else:
        # Input testuale: salta visual match, usa il primo risultato della pagina corrente
        match_conf = 0.6
        product_url = _click_nth_product(page, 1, timeout_ms)
        if not product_url:
            # Se non riesce a cliccare, estrae dalla pagina corrente
            product_url = page.url

    # --- Fase 3: Estrazione specs ---
    screenshot_b64 = _page_screenshot_b64(page)
    try:
        page_text = page.inner_text("body")
    except Exception:
        page_text = ""

    specs = extract_watch_specs(
        page_screenshot_b64=screenshot_b64,
        page_text=page_text,
        ai_key=ai_key,
        use_openrouter=use_openrouter,
    )

    reference = specs.pop("reference", None) or None
    if reference and reference.lower() in ("", "non rilevabile", "n/a", "not available"):
        reference = None

    return {
        "found": True,
        "reference": reference,
        "specs": specs,
        "source_url": product_url or page.url,
        "brand_site": cfg["brand_site"],
        "match_confidence": match_conf,
    }
