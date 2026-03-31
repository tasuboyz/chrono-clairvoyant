import re
from datetime import date
from urllib.parse import urlencode
from typing import List, Dict

from .base import BaseScraper


class Chrono24Scraper(BaseScraper):
    BASE_URL = "https://www.chrono24.com/search/index.htm"

    def scrape(self, query: str) -> List[Dict]:
        # Se il parametro viene passato direttamente come url prodotto da chrono24
        if "chrono24.com" in query and query.lower().endswith(".htm"):
            return self._scrape_item_page(query)

        params = {
            "dosearch": "true",
            "query": query,
            "currencyId": "EUR",
            "resultview": "list",
        }
        url = f"{self.BASE_URL}?{urlencode(params)}"

        self.page.goto(url, wait_until="domcontentloaded", timeout=self.timeout_ms)

        # Accept cookie/consent banner if present
        for selector in (
            "#onetrust-accept-btn-handler",
            "button:has-text('Accept all')",
            "button:has-text('Accetta')",
            "button:has-text('Accept')",
        ):
            try:
                self.page.click(selector, timeout=3000)
                break
            except Exception:
                pass

        # Wait for listing cards
        card_selector = "[data-testid='article-item'], .article-item, .js-article-item"
        try:
            self.page.wait_for_selector(card_selector, timeout=self.timeout_ms)
        except Exception:
            return []

        cards = self.page.query_selector_all(card_selector)
        today = date.today().strftime("%d/%m/%y")
        listings: List[Dict] = []

        for card in cards[:25]:
            try:
                listing = self._parse_card(card, today)
                if listing:
                    listings.append(listing)
            except Exception:
                continue

        return listings

    def _scrape_item_page(self, item_url: str) -> List[Dict]:
        try:
            self.page.goto(item_url, wait_until="domcontentloaded", timeout=self.timeout_ms)
        except Exception:
            return []

        # Price
        price_el = self.page.query_selector(
            "[data-testid='price'] , .price , .js-price, .article-price, [class*='price']"
        )
        price = None
        if price_el:
            price = self._parse_price_eur(price_el.inner_text())

        # Condition
        condition_el = self.page.query_selector(
            "[data-testid='condition'], .watch-condition, .condition-badge, [class*='condition']"
        )
        condition_raw = condition_el.inner_text().strip() if condition_el else "Usato"
        condition = self._normalize_condition(condition_raw)

        # Image
        image_el = self.page.query_selector(
            "img[src*='chrono24'], img[src*='/content/'], .gallery__image img, .js-gallery-image"
        )
        image_url = None
        if image_el:
            image_url = image_el.get_attribute("src") or image_el.get_attribute("data-src")
            if image_url and image_url.startswith("//"):
                image_url = "https:" + image_url

        item = {
            "source": "Chrono24",
            "price": price if price is not None else 0,
            "condition": condition,
            "url": item_url,
            "date": date.today().strftime("%d/%m/%y"),
        }
        if image_url:
            item["image_url"] = image_url

        return [item]

    def _parse_card(self, card, today: str) -> Dict | None:
        # Price
        price_el = card.query_selector(
            "[data-testid='price'], .price, .js-price, .article-price, [class*='price']"
        )
        if not price_el:
            return None
        price = self._parse_price_eur(price_el.inner_text())
        if price is None:
            return None

        # Condition
        condition_el = card.query_selector(
            "[data-testid='condition'], .watch-condition, .condition-badge, [class*='condition']"
        )
        condition_raw = condition_el.inner_text().strip() if condition_el else "Usato"
        condition = self._normalize_condition(condition_raw)

        # URL
        link_el = card.query_selector("a[href]")
        href = link_el.get_attribute("href") if link_el else ""
        if href and href.startswith("/"):
            url = f"https://www.chrono24.com{href}"
        elif href:
            url = href
        else:
            url = self.BASE_URL

        return {
            "source": "Chrono24",
            "price": price,
            "condition": condition,
            "url": url,
            "date": today,
        }

    def _parse_price_eur(self, text: str) -> int | None:
        digits = re.sub(r"[^\d]", "", text.strip())
        if not digits:
            return None
        price = int(digits)
        if price < 100 or price > 2_000_000:
            return None
        return price
