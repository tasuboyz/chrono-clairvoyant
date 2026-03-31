"""RAG service basilare: embeddings via OpenRouter + cosine similarity in Python puro.

Zero dipendenze extra (usa httpx già installato + math stdlib).
Se nessuna API key disponibile, le funzioni di embedding ritornano None silenziosamente.
"""

import json
import logging
import math

import httpx
import config

logger = logging.getLogger(__name__)

OPENROUTER_EMBED_URL = "https://openrouter.ai/api/v1/embeddings"
OPENROUTER_EMBED_MODEL = "openai/text-embedding-3-small"


def build_watch_text(brand: str, model: str, reference: str | None) -> str:
    """Costruisce la stringa canonica da embeddare per un orologio."""
    ref = reference or "unknown"
    return f"Brand: {brand} | Model: {model} | Reference: {ref}"


def generate_embedding(text: str) -> list[float] | None:
    """Genera un embedding vettoriale tramite OpenRouter (text-embedding-3-small).

    Ritorna None se la chiamata fallisce o nessuna API key è disponibile.
    Non propaga mai eccezioni — usare in contesti di pipeline.
    """
    api_key = config.OPENROUTER_API_KEY
    if not api_key:
        logger.debug("rag_service.generate_embedding: no OPENROUTER_API_KEY available")
        return None
    try:
        logger.debug("rag_service.generate_embedding: requesting OpenRouter for text: %s", text[:100])
        resp = httpx.post(
            OPENROUTER_EMBED_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENROUTER_EMBED_MODEL,
                "input": text,
            },
            timeout=15,
        )
        if resp.status_code != 200:
            logger.warning("rag_service.generate_embedding: status %s response: %s", resp.status_code, resp.text[:500])
            return None
        data = resp.json()
        values = data["data"][0]["embedding"]
        logger.info("rag_service.generate_embedding: success, %d dimensions", len(values))
        return values
    except Exception:
        logger.warning("rag_service.generate_embedding failed", exc_info=True)
        return None


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def find_similar(
    query_embedding: list[float],
    candidates: list[dict],
    top_k: int = 3,
    threshold: float = 0.85,
) -> list[dict]:
    """Trova i candidati più simili tramite cosine similarity.

    Args:
        query_embedding: embedding del watch da cercare
        candidates: lista di dict con chiave 'embedding' (JSON string di list[float])
                    + id, brand, model, reference (da get_validated_embeddings())
        top_k: numero massimo di risultati
        threshold: soglia minima di similarity (0.0-1.0)

    Returns:
        Lista di dict con campo 'rag_similarity' aggiunto, ordinata desc per similarity.
    """
    results = []
    for candidate in candidates:
        raw = candidate.get("embedding")
        if not raw:
            continue
        try:
            vec = json.loads(raw) if isinstance(raw, str) else raw
            sim = _cosine_similarity(query_embedding, vec)
            if sim >= threshold:
                results.append({**candidate, "rag_similarity": round(sim, 4), "validated": True})
        except Exception:
            continue

    results.sort(key=lambda x: x["rag_similarity"], reverse=True)
    return results[:top_k]
