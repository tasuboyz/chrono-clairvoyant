"""Data Fusion: combina risultati AI, DB lookup e market data in un oggetto unificato."""

from datetime import datetime, timezone


def fuse_results(
    watch: dict,
    description: str,
    db_matches: list[dict],
    market_data: dict | None,
) -> dict:
    """Fonde tutti i dati raccolti dalla pipeline e calcola la confidenza aggregata.

    Returns:
        FusedResult con watch arricchito, description, market (opzionale),
        confidence_summary con level/score/factors.
    """
    db_match_count = len(db_matches)
    validated_count = sum(1 for m in db_matches if m.get("validated"))

    # Confidenza aggregata: base AI + bonus DB + bonus mercato
    base_conf = float(watch.get("confidence", 0.0))
    score = base_conf
    factors: list[str] = [f"AI {int(base_conf * 100)}%"]

    if db_match_count > 0:
        score = min(score + 0.05, 0.99)
        label = f"{db_match_count} occorrenz{'a' if db_match_count == 1 else 'e'} in DB"
        if validated_count:
            label += f" ({validated_count} validate)"
        factors.append(label)

    listings_count = market_data.get("listingsCount", 0) if market_data else 0
    if listings_count > 100:
        score = min(score + 0.03, 0.99)
        factors.append(f"{listings_count} listing Chrono24")

    if score >= 0.80:
        level = "high"
    elif score >= 0.55:
        level = "medium"
    else:
        level = "low"

    enriched_watch = {
        **watch,
        "db_matches": db_match_count,
        "validated_count": validated_count,
    }

    result: dict = {
        "watch": enriched_watch,
        "description": description,
        "confidence_summary": {
            "level": level,
            "score": round(score, 3),
            "factors": factors,
        },
    }

    if market_data and listings_count > 0:
        result["market"] = {
            "source": "chrono24",
            "listings_count": listings_count,
            "price_min": market_data.get("priceMin", 0),
            "price_avg": market_data.get("priceAvg", 0),
            "price_max": market_data.get("priceMax", 0),
            "listings": market_data.get("listings", [])[:10],
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }

    return result
