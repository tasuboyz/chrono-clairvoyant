import json
import logging
import os
import sqlite3

import config

logger = logging.getLogger(__name__)

_DB_PATH: str = config.DB_PATH

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS watches (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    brand       TEXT    NOT NULL,
    model       TEXT    NOT NULL,
    reference   TEXT,
    confidence  REAL,
    specs_json  TEXT,
    description TEXT,
    input_type  TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    validated   INTEGER DEFAULT 0
)
"""


def init_db() -> None:
    """Crea backend/data/ e la tabella watches se non esistono.
    Chiamato una volta all'avvio da app.py. Rilancia eccezioni (config errata = fail early).
    """
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    con = sqlite3.connect(_DB_PATH)
    try:
        con.execute(_CREATE_TABLE)
        con.commit()
    finally:
        con.close()


def search_similar_watches(brand: str, model: str, reference: str | None = None) -> list[dict]:
    """Cerca orologi simili nel DB per brand + model.
    Restituisce lista di dict con i campi principali, ordinati per created_at DESC.
    Errori gestiti internamente — restituisce lista vuota in caso di problema.
    """
    try:
        con = sqlite3.connect(_DB_PATH, check_same_thread=False)
        try:
            cur = con.execute(
                """
                SELECT id, brand, model, reference, confidence, created_at, validated
                FROM watches
                WHERE brand = ? AND model = ?
                ORDER BY created_at DESC
                LIMIT 5
                """,
                (brand, model),
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        finally:
            con.close()
    except Exception:
        logger.exception("db_service.search_similar_watches failed")
        return []


def save_watch(watch: dict, description: str, input_type: str) -> None:
    """Salva un'identificazione completata in SQLite.
    Le eccezioni sono catturate e loggate — un errore DB non deve mai bloccare la pipeline.
    validated=1 se confidence >= 0.8 (threshold per futura RAG).
    """
    try:
        validated = 1 if watch.get("confidence", 0) >= 0.8 else 0
        con = sqlite3.connect(_DB_PATH, check_same_thread=False)
        try:
            con.execute(
                """
                INSERT INTO watches
                    (brand, model, reference, confidence, specs_json,
                     description, input_type, validated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    watch.get("brand", ""),
                    watch.get("model", ""),
                    watch.get("reference"),
                    watch.get("confidence"),
                    json.dumps(watch, ensure_ascii=False),
                    description,
                    input_type,
                    validated,
                ),
            )
            con.commit()
        finally:
            con.close()
    except Exception:
        logger.exception("db_service.save_watch failed — watch not persisted")
