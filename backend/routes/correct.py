"""Routes per la correzione manuale dei risultati e l'aggiornamento del RAG.

POST /api/correct/scrape-url  — naviga un URL con Playwright, estrae specs con AI
POST /api/correct             — salva la correzione in DB e genera l'embedding RAG
"""

import base64
import logging
import traceback

from flask import Blueprint, request, jsonify
from playwright.sync_api import sync_playwright

import config
from services.ai_service import extract_watch_specs
from services.db_service import update_watch_correction, get_validated_embeddings
from services import rag_service

logger = logging.getLogger(__name__)

correct_bp = Blueprint("correct", __name__)


def _resolve_ai_key(body: dict) -> tuple[str, bool]:
    """Restituisce (ai_key, use_openrouter) con la stessa logica di analyze.py."""
    client_key = body.get("gemini_api_key")
    ai_key = (
        config.OPENROUTER_API_KEY
        or config.GEMINI_API_KEY
        or config.OPENAI_API_KEY
        or client_key
        or ""
    )
    use_openrouter = bool(config.OPENROUTER_API_KEY)
    return ai_key, use_openrouter


@correct_bp.route("/correct/scrape-url", methods=["POST"])
def scrape_url():
    """Naviga l'URL fornito con Playwright ed estrae le specifiche tecniche tramite AI vision.

    Body: { url: str, gemini_api_key?: str, auto_save?: bool, watch_id?: int, headless?: bool }
    Response: { specs: {...}, source_url: str, saved?: bool }

    Query params:
      - headless=false  : mostra il browser durante lo scraping (per debugging)
      - auto_save=true  : salva automaticamente le correzioni nel DB (richiede watch_id)
    """
    body = request.get_json(force=True) or {}
    url = (body.get("url") or "").strip()
    auto_save = body.get("auto_save", False) or request.args.get("auto_save", "").lower() == "true"
    watch_id = body.get("watch_id") if auto_save else None

    # Headless toggle: query param (true/false) or body param, default to config
    headless = config.SCRAPER_HEADLESS
    if "headless" in request.args:
        headless = request.args.get("headless", "true").lower() == "true"
    elif "headless" in body:
        headless = body.get("headless", True)

    if not url or not url.startswith("http"):
        return jsonify({"error": "URL non valido. Deve iniziare con http/https."}), 400

    ai_key, use_openrouter = _resolve_ai_key(body)
    if not ai_key:
        return jsonify({"error": "Nessuna API key AI configurata."}), 500

    try:
        logger.info("correct.scrape_url: starting Playwright for url=%s headless=%s", url, headless)
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=headless)
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
                locale="en-US",
                timezone_id="Europe/Rome",
                viewport={"width": 1280, "height": 900},
            )
            page = context.new_page()
            try:
                logger.debug("correct.scrape_url: goto url=%s", url)
                page.goto(url, wait_until="networkidle", timeout=20000)
                logger.info("correct.scrape_url: page loaded successfully, final_url=%s", page.url)

                # Accetta cookie banner se presente
                for sel in (
                    "#onetrust-accept-btn-handler",
                    "button:has-text('Accept all')",
                    "button:has-text('Accept')",
                    "button:has-text('Accetta')",
                ):
                    try:
                        page.click(sel, timeout=2000)
                        break
                    except Exception:
                        pass

                page.wait_for_timeout(800)
                screenshot_raw = page.screenshot(full_page=False, type="png")
                screenshot_b64 = base64.b64encode(screenshot_raw).decode()
                logger.info("correct.scrape_url: screenshot captured (%d bytes)", len(screenshot_raw))

                try:
                    page_text = page.inner_text("body")[:5000]
                    logger.info("correct.scrape_url: page text extracted (%d chars)", len(page_text))
                except Exception as e:
                    logger.warning("correct.scrape_url: failed to extract page text: %s", e)
                    page_text = ""

                final_url = page.url
            finally:
                browser.close()

        logger.info("correct.scrape_url: calling extract_watch_specs with ai_key=%s use_openrouter=%s", bool(ai_key), use_openrouter)
        specs = extract_watch_specs(
            page_screenshot_b64=screenshot_b64,
            page_text=page_text,
            ai_key=ai_key,
            use_openrouter=use_openrouter,
        )
        logger.info("correct.scrape_url: extract_watch_specs returned: %s", specs)

        # Auto-save if requested
        saved = False
        if auto_save and watch_id:
            logger.info("correct.scrape_url: auto_save enabled for watch_id=%s", watch_id)
            brand = specs.get("brand") or body.get("brand")
            model = specs.get("model") or body.get("model")
            reference = specs.get("reference") or body.get("reference")

            if any([brand, model, reference]):
                embedding = None
                if config.OPENROUTER_API_KEY and any([brand, model, reference]):
                    text = rag_service.build_watch_text(
                        brand=brand or "",
                        model=model or "",
                        reference=reference,
                    )
                    embedding = rag_service.generate_embedding(text)

                update_watch_correction(
                    watch_id=watch_id,
                    brand=brand,
                    model=model,
                    reference=reference,
                    corrected_url=final_url,
                    embedding=embedding,
                )
                saved = True
                logger.info("correct.scrape_url: auto_saved watch_id=%s", watch_id)

        response = {"specs": specs, "source_url": final_url}
        if auto_save:
            response["saved"] = saved
        return jsonify(response)

    except Exception as exc:
        logger.exception("correct.scrape_url failed for url=%s", url)
        return jsonify({"error": f"Impossibile raggiungere l'URL: {exc}"}), 502


@correct_bp.route("/correct", methods=["POST"])
def save_correction():
    """Salva la correzione manuale in DB e genera l'embedding RAG.

    Body: { watch_id: int, brand: str, model: str, reference: str, corrected_url?: str }
    Response: { ok: true, embedding_saved: bool }
    """
    body = request.get_json(force=True) or {}
    watch_id = body.get("watch_id")
    brand = (body.get("brand") or "").strip() or None
    model = (body.get("model") or "").strip() or None
    reference = (body.get("reference") or "").strip() or None
    corrected_url = (body.get("corrected_url") or "").strip() or None

    if not watch_id or not isinstance(watch_id, int):
        return jsonify({"error": "watch_id mancante o non valido."}), 400

    if not any([brand, model, reference]):
        return jsonify({"error": "Fornire almeno uno tra brand, model, reference."}), 400

    logger.info("correct.save_correction: watch_id=%s brand=%s model=%s reference=%s corrected_url=%s", watch_id, brand, model, reference, corrected_url)

    # Genera embedding se OPENROUTER_API_KEY disponibile
    embedding = None
    if config.OPENROUTER_API_KEY and any([brand, model, reference]):
        text = rag_service.build_watch_text(
            brand=brand or "",
            model=model or "",
            reference=reference,
        )
        logger.debug("correct.save_correction: generating embedding for text=%s", text)
        embedding = rag_service.generate_embedding(text)
        if embedding:
            logger.info("correct.save_correction: embedding generated (%d dims) for watch_id=%s", len(embedding), watch_id)
        else:
            logger.warning("correct.save_correction: embedding generation failed for watch_id=%s", watch_id)
    else:
        logger.warning("correct.save_correction: OPENROUTER_API_KEY not available or no data to embed")

    update_watch_correction(
        watch_id=watch_id,
        brand=brand,
        model=model,
        reference=reference,
        corrected_url=corrected_url,
        embedding=embedding,
    )

    return jsonify({"ok": True, "embedding_saved": embedding is not None})
