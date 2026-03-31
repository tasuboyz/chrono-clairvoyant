"""Playwright orchestrator: gestisce il browser e delega ai singoli scraper."""

from playwright.sync_api import sync_playwright
from typing import Dict

import config
from services.scrapers.chrono24 import Chrono24Scraper


def scrape_market_data(brand: str, model: str, reference: str) -> Dict:
    # Prefer reference number for precision; fall back to brand+model
    query = (
        reference
        if reference and reference.lower() not in ("", "non rilevabile")
        else f"{brand} {model}"
    ).strip()

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
        return _empty(brand, model, reference)

    prices = [l["price"] for l in listings if l.get("price")]
    return {
        "brand": brand,
        "model": model,
        "reference": reference,
        "listingsCount": len(listings),
        "priceMin": min(prices) if prices else 0,
        "priceAvg": round(sum(prices) / len(prices)) if prices else 0,
        "priceMax": max(prices) if prices else 0,
        "listings": listings[:20],
        "priceHistory": [],
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
