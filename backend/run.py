"""
Script di avvio: installa le dipendenze, builda il frontend e avvia il backend Flask.

Unico comando necessario:
    cd backend
    poetry run python run.py

Alla prima esecuzione installa anche Chromium per Playwright automaticamente.
Il frontend viene raggiunto su http://localhost:5000
"""

import os
import sys
import subprocess

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
CHROMIUM_SENTINEL = os.path.join(BACKEND_DIR, ".playwright_installed")


def run(cmd: list, cwd=None, check=True):
    result = subprocess.run(cmd, cwd=cwd or BACKEND_DIR)
    if check and result.returncode != 0:
        print(f"ERRORE: {' '.join(cmd)} ha restituito {result.returncode}")
        sys.exit(result.returncode)
    return result


def main():
    # Assicura che i moduli backend siano importabili nel processo corrente
    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)

    # 0. Installa/aggiorna le dipendenze Poetry nella venv corrente
    print("==> poetry install...")
    run(["poetry", "install", "--no-interaction"])
    print()

    # 1. Installa Chromium (solo la prima volta, poi salta)
    if not os.path.isfile(CHROMIUM_SENTINEL):
        print("==> playwright install chromium (prima esecuzione)...")
        run(["poetry", "run", "playwright", "install", "chromium"])
        open(CHROMIUM_SENTINEL, "w").close()
        print()

    # 2. Build del frontend React
    print("==> npm run build...")
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    run([npm, "run", "build"], cwd=ROOT_DIR)
    print("==> Frontend buildato in dist/\n")

    # 3. Avvia Flask (serve dist/ + /api/identify + /api/market)
    import config
    from app import app

    print(f"==> Applicazione disponibile su http://localhost:{config.FLASK_PORT}")
    print("    Premi CTRL+C per fermare.\n")
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=config.FLASK_DEBUG)


if __name__ == "__main__":
    main()
