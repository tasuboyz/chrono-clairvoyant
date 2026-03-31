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

_MIGRATIONS = [
    "ALTER TABLE watches ADD COLUMN embedding           TEXT",
    "ALTER TABLE watches ADD COLUMN corrected_url       TEXT",
    "ALTER TABLE watches ADD COLUMN corrected_brand     TEXT",
    "ALTER TABLE watches ADD COLUMN corrected_model     TEXT",
    "ALTER TABLE watches ADD COLUMN corrected_reference TEXT",
]


def init_db() -> None:
    """Crea backend/data/ e la tabella watches se non esistono.
    Applica migrazioni incrementali per le nuove colonne.
    Chiamato una volta all'avvio da app.py. Rilancia eccezioni (config errata = fail early).
    """
    os.makedirs(os.path.dirname(_DB_PATH), exist_ok=True)
    con = sqlite3.connect(_DB_PATH)
    try:
        con.execute(_CREATE_TABLE)
        for sql in _MIGRATIONS:
            try:
                con.execute(sql)
            except sqlite3.OperationalError:
                pass  # colonna già presente
        con.commit()
    finally:
        con.close()


def search_similar_watches(brand: str, model: str, reference: str | None = None) -> list[dict]:
    """Cerca orologi simili nel DB per brand + model.
    Restituisce lista di dict con i campi principali, ordinati per created_at DESC.
    Errori gestiti internamente — restituisce lista vuota in caso di problema.
    """
    logger.debug("search_similar_watches brand=%s model=%s reference=%s", brand, model, reference)
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


def save_watch(watch: dict, description: str, input_type: str) -> int:
    """Salva un'identificazione completata in SQLite.
    Le eccezioni sono catturate e loggate — un errore DB non deve mai bloccare la pipeline.
    validated=1 se confidence >= 0.8 (threshold per RAG).
    Restituisce l'id del record inserito (0 in caso di errore).
    """
    logger.info(
        "save_watch brand=%s model=%s reference=%s confidence=%s input_type=%s",
        watch.get("brand"), watch.get("model"), watch.get("reference"),
        watch.get("confidence"), input_type,
    )
    try:
        validated = 1 if watch.get("confidence", 0) >= 0.8 else 0
        con = sqlite3.connect(_DB_PATH, check_same_thread=False)
        try:
            cur = con.execute(
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
            return cur.lastrowid or 0
        finally:
            con.close()
    except Exception:
        logger.exception("db_service.save_watch failed — watch not persisted")
        return 0


def update_watch_correction(
    watch_id: int,
    brand: str | None,
    model: str | None,
    reference: str | None,
    corrected_url: str | None,
    embedding: list[float] | None,
) -> None:
    """Aggiorna un record watches con i dati di correzione utente.
    Imposta validated=1 (correzione manuale = validata per definizione).
    """
    try:
        embedding_json = json.dumps(embedding) if embedding is not None else None
        con = sqlite3.connect(_DB_PATH, check_same_thread=False)
        try:
            con.execute(
                """
                UPDATE watches SET
                    corrected_brand     = COALESCE(?, corrected_brand),
                    corrected_model     = COALESCE(?, corrected_model),
                    corrected_reference = COALESCE(?, corrected_reference),
                    corrected_url       = COALESCE(?, corrected_url),
                    embedding           = COALESCE(?, embedding),
                    validated           = 1
                WHERE id = ?
                """,
                (brand, model, reference, corrected_url, embedding_json, watch_id),
            )
            con.commit()
        finally:
            con.close()
    except Exception:
        logger.exception("db_service.update_watch_correction failed for watch_id=%s", watch_id)


def get_validated_embeddings() -> list[dict]:
    """Restituisce tutti i record con embedding generato e validated=1.
    Usato dal rag_service per la similarity search.
    """
    try:
        con = sqlite3.connect(_DB_PATH, check_same_thread=False)
        try:
            cur = con.execute(
                """
                SELECT id,
                       COALESCE(corrected_brand, brand)         AS brand,
                       COALESCE(corrected_model, model)         AS model,
                       COALESCE(corrected_reference, reference) AS reference,
                       embedding
                FROM watches
                WHERE embedding IS NOT NULL AND validated = 1
                ORDER BY created_at DESC
                """,
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        finally:
            con.close()
    except Exception:
        logger.exception("db_service.get_validated_embeddings failed")
        return []
