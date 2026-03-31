"""Playwright orchestrator: gestisce il browser e delega ai singoli scraper."""

from playwright.sync_api import sync_playwright
from typing import Dict

import config
from services.scrapers.chrono24 import Chrono24Scraper
from services.brand_agent_service import search_on_brand_site


def scrape_market_data(brand: str, model: str, reference: str, debug: bool = False) -> Dict:
    # Prefer reference number for precision; fall back to brand+model
    query = (
        reference
        if reference and reference.lower() not in ("", "non rilevabile")
        else f"{brand} {model}"
    ).strip()

    if debug:
        print(f"[DEBUG] Chrono24 query usato: '{query}'")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=config.SCRAPER_HEADLESS)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            timezone_id="Europe/Rome",
        )
        page = context.new_page()

        try:
            scraper = Chrono24Scraper(page, timeout_ms=config.SCRAPER_TIMEOUT_MS)
            listings = scraper.scrape(query=query)
        finally:
            browser.close()

    if not listings:
        empty = _empty(brand, model, reference)
        empty["query"] = query
        return empty

    prices = [l["price"] for l in listings if l.get("price")]
    return {
        "brand": brand,
        "model": model,
        "reference": reference,
        "query": query,
        "listingsCount": len(listings),
        "priceMin": min(prices) if prices else 0,
        "priceAvg": round(sum(prices) / len(prices)) if prices else 0,
        "priceMax": max(prices) if prices else 0,
        "listings": listings[:20],
        "priceHistory": [],
    }


def run_brand_agent(
    brand: str,
    model: str,
    image_b64: str | None,
    ai_key: str,
    use_openrouter: bool,
) -> Dict:
    """Apre un browser Playwright dedicato, naviga il sito ufficiale del brand
    e restituisce {found, reference, specs, source_url, brand_site, match_confidence}.
    Gestisce eccezioni internamente — non propaga mai errori alla pipeline.
    """
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=config.SCRAPER_HEADLESS)
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
                result = search_on_brand_site(
                    brand=brand,
                    model=model,
                    image_b64=image_b64,
                    page=page,
                    ai_key=ai_key,
                    use_openrouter=use_openrouter,
                    timeout_ms=config.SCRAPER_TIMEOUT_MS,
                )
            finally:
                browser.close()
        return result
    except Exception as exc:
        return {
            "found": False,
            "reference": None,
            "specs": {},
            "source_url": None,
            "brand_site": brand.lower(),
            "match_confidence": 0.0,
            "error": str(exc),
        }


def _empty(brand: str, model: str, reference: str) -> Dict:
    return {
        "brand": brand,
        "model": model,
        "reference": reference,
        "listingsCount": 0,
        "priceMin": 0,
        "priceAvg": 0,
        "priceMax": 0,
        "listings": [],
        "priceHistory": [],
    }
