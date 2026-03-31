from abc import ABC, abstractmethod
from typing import List, Dict


class BaseScraper(ABC):
    def __init__(self, page, timeout_ms: int = 15000):
        self.page = page
        self.timeout_ms = timeout_ms

    @abstractmethod
    def scrape(self, query: str) -> List[Dict]:
        """Return a list of listing dicts compatible with MarketListing shape."""
        ...

    def _normalize_condition(self, raw: str) -> str:
        r = raw.lower()
        if any(w in r for w in ("new", "nuovo", "unworn", "neuve")):
            return "Nuovo"
        if any(w in r for w in ("mint", "ottim", "like new", "excellent")):
            return "Ottimo"
        if any(w in r for w in ("good", "buon", "good condition")):
            return "Buono"
        return "Usato"
