import json
import queue
import threading
import time

_sessions: dict[str, dict] = {}
_lock = threading.Lock()
SESSION_TTL = 600  # 10 minuti


def format_sse(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def create_session(session_id: str) -> queue.Queue:
    _cleanup_expired()
    q: queue.Queue = queue.Queue()
    with _lock:
        _sessions[session_id] = {"queue": q, "created_at": time.time()}
    return q


def get_session(session_id: str) -> dict | None:
    with _lock:
        return _sessions.get(session_id)


def delete_session(session_id: str) -> None:
    with _lock:
        _sessions.pop(session_id, None)


def _cleanup_expired() -> None:
    now = time.time()
    with _lock:
        expired = [sid for sid, s in _sessions.items() if now - s["created_at"] > SESSION_TTL]
        for sid in expired:
            del _sessions[sid]
