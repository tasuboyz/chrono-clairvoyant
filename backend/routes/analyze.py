import time
import uuid
import threading
import config
from flask import Blueprint, request, jsonify, Response, stream_with_context
from services.ai_service import identify_watch, generate_description
from services.db_service import save_watch, search_similar_watches
from services.playwright_service import scrape_market_data
from services.fusion_service import fuse_results
from services.session_store import create_session, get_session, delete_session, format_sse

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.route("/analyze", methods=["POST"])
def start_analysis():
    body = request.get_json(force=True) or {}
    client_key = body.get("gemini_api_key")
    debug_mode = bool(body.get("debug", False))

    ai_key = (
        config.OPENROUTER_API_KEY
        or config.GEMINI_API_KEY
        or config.OPENAI_API_KEY
        or client_key
    )

    use_openrouter = (
        bool(config.OPENROUTER_API_KEY)
        or (client_key is not None and isinstance(client_key, str) and client_key.startswith("sk-or-"))
        or (config.OPENAI_API_KEY and config.OPENAI_API_KEY.startswith("sk-or-"))
    )
    if not ai_key:
        return jsonify({"error": "Nessuna API key AI configurata (imposta OPENROUTER_API_KEY o GEMINI_API_KEY)"}), 500

    use_openrouter = bool(config.OPENROUTER_API_KEY)
    session_id = str(uuid.uuid4())
    create_session(session_id)

    threading.Thread(
        target=_run_pipeline,
        args=(session_id, body, ai_key, use_openrouter, debug_mode),
        daemon=True,
    ).start()

    return jsonify({"session_id": session_id}), 202


def _run_pipeline(session_id: str, body: dict, ai_key: str, use_openrouter: bool, debug_mode: bool) -> None:
    session = get_session(session_id)
    if not session:
        return
    q = session["queue"]

    if debug_mode:
        q.put(format_sse({
            "event": "debug",
            "label": "Modalità test attiva",
            "detail": "Verranno mostrati dettagli di AI e scraping",
        }))

    try:
        # STEP 1 — AI Vision
        t0 = time.monotonic()
        q.put(format_sse({
            "event": "step_start", "step": 1,
            "label": "Analisi AI immagine",
            "detail": "Elaborazione con AI vision...",
        }))

        watch = identify_watch(
            input_type=body.get("input_type", "image"),
            image_b64=body.get("image_base64"),
            text=body.get("text"),
            ai_key=ai_key,
            use_openrouter=use_openrouter,
        )
        ms1 = int((time.monotonic() - t0) * 1000)
        conf = int(watch.get("confidence", 0) * 100)
        detail1 = f"{watch.get('brand', '?')} {watch.get('model', '?')} ({conf}%)"
        q.put(format_sse({
            "event": "step_complete", "step": 1,
            "label": "Analisi AI immagine",
            "detail": detail1,
            "duration_ms": ms1,
        }))

        # STEP 2 — Descrizione editoriale
        t0 = time.monotonic()
        q.put(format_sse({
            "event": "step_start", "step": 2,
            "label": "Generazione descrizione",
            "detail": "Scrittura descrizione editoriale...",
        }))

        description = generate_description(
            brand=watch.get("brand", ""),
            model=watch.get("model", ""),
            reference=watch.get("reference", ""),
            ai_key=ai_key,
            use_openrouter=use_openrouter,
        )
        ms2 = int((time.monotonic() - t0) * 1000)
        q.put(format_sse({
            "event": "step_complete", "step": 2,
            "label": "Generazione descrizione",
            "detail": "Descrizione generata",
            "duration_ms": ms2,
        }))

        # STEP 3 — DB Lookup
        t0 = time.monotonic()
        q.put(format_sse({
            "event": "step_start", "step": 3,
            "label": "Ricerca database",
            "detail": "Cerco occorrenze simili nel DB locale...",
        }))
        db_matches = search_similar_watches(
            brand=watch.get("brand", ""),
            model=watch.get("model", ""),
            reference=watch.get("reference"),
        )
        ms3 = int((time.monotonic() - t0) * 1000)
        if db_matches:
            n = len(db_matches)
            v = sum(1 for m in db_matches if m.get("validated"))
            detail3 = f"{n} occorrenz{'a' if n == 1 else 'e'} trovate" + (f" ({v} validate)" if v else "")
        else:
            detail3 = "Nessuna occorrenza trovata"
        q.put(format_sse({
            "event": "step_complete", "step": 3,
            "label": "Ricerca database",
            "detail": detail3,
            "duration_ms": ms3,
        }))

        # STEP 4 — Ricerca Mercato (Chrono24)
        t0 = time.monotonic()
        q.put(format_sse({
            "event": "step_start", "step": 4,
            "label": "Ricerca mercato",
            "detail": "Cercando listing su Chrono24...",
        }))
        market_data = None

        if debug_mode:
            market_query = (
                watch.get("reference")
                if watch.get("reference") and watch.get("reference").lower() not in ("", "non rilevabile")
                else f"{watch.get('brand', '')} {watch.get('model', '')}".strip()
            )
            q.put(format_sse({
                "event": "debug",
                "step": 4,
                "label": "Debug ricerca mercato",
                "detail": f"Query Chrono24: {market_query}",
            }))

        try:
            market_data = scrape_market_data(
                brand=watch.get("brand", ""),
                model=watch.get("model", ""),
                reference=watch.get("reference", ""),
                debug=debug_mode,
            )
            ms4 = int((time.monotonic() - t0) * 1000)
            count = market_data.get("listingsCount", 0)
            avg = market_data.get("priceAvg", 0)
            if count > 0:
                detail4 = f"{count} listing trovati · prezzo medio {avg:,.0f} €".replace(",", ".")
            else:
                detail4 = "Nessun listing trovato"
            q.put(format_sse({
                "event": "step_complete", "step": 4,
                "label": "Ricerca mercato",
                "detail": detail4,
                "duration_ms": ms4,
            }))
        except Exception as exc:
            ms4 = int((time.monotonic() - t0) * 1000)
            q.put(format_sse({
                "event": "step_skipped", "step": 4,
                "label": "Ricerca mercato",
                "detail": f"Non disponibile ({exc})",
                "duration_ms": ms4,
            }))

        # STEP 5 — Data Fusion
        t0 = time.monotonic()
        q.put(format_sse({
            "event": "step_start", "step": 5,
            "label": "Sintesi dati",
            "detail": "Fusione risultati e calcolo confidenza...",
        }))
        fused = fuse_results(
            watch=watch,
            description=description,
            db_matches=db_matches,
            market_data=market_data,
        )
        ms5 = int((time.monotonic() - t0) * 1000)
        cs = fused["confidence_summary"]
        level_label = {"high": "alta", "medium": "media", "low": "bassa"}.get(cs["level"], cs["level"])
        detail5 = f"Confidenza: {int(cs['score'] * 100)}% ({level_label})"
        q.put(format_sse({
            "event": "step_complete", "step": 5,
            "label": "Sintesi dati",
            "detail": detail5,
            "duration_ms": ms5,
        }))

        # Salva in SQLite — errori gestiti internamente, non propagano nella pipeline
        save_watch(
            watch=watch,
            description=description,
            input_type=body.get("input_type", "image"),
        )

        q.put(format_sse({
            "event": "done",
            "data": fused,
        }))

    except Exception as e:
        q.put(format_sse({"event": "error", "message": str(e)}))
    finally:
        q.put(None)  # sentinel: segnala al generatore SSE che la pipeline è terminata


@analyze_bp.route("/analyze/stream", methods=["GET"])
def stream_analysis():
    session_id = request.args.get("session_id", "")
    if not get_session(session_id):
        return jsonify({"error": "Session not found"}), 404

    def _generate():
        yield "retry: 0\n\n"  # disabilita reconnect automatico del browser
        session = get_session(session_id)
        if not session:
            yield format_sse({"event": "error", "message": "Session not found"})
            return
        q = session["queue"]
        try:
            while True:
                item = q.get(timeout=120)
                if item is None:
                    break
                yield item
        except Exception:
            yield format_sse({"event": "error", "message": "Stream timeout"})
        finally:
            delete_session(session_id)

    return Response(
        stream_with_context(_generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
