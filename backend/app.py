import os
from flask import Flask, send_from_directory, send_file

import config
from routes import identify_bp, market_bp, analyze_bp
from services.db_service import init_db

app = Flask(__name__, static_folder=config.DIST_DIR, static_url_path="")

# API blueprints
app.register_blueprint(identify_bp, url_prefix="/api")
app.register_blueprint(market_bp, url_prefix="/api")
app.register_blueprint(analyze_bp, url_prefix="/api")

# Inizializza SQLite — crea backend/data/watches.db se non esiste
init_db()


# Serve Vite hashed assets (e.g. /assets/index-abc123.js)
@app.route("/assets/<path:filename>")
def assets(filename: str):
    return send_from_directory(os.path.join(config.DIST_DIR, "assets"), filename)


# SPA fallback — every non-API path returns index.html so React Router works
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def spa_fallback(path: str):
    index = os.path.join(config.DIST_DIR, "index.html")
    return send_file(index)


if __name__ == "__main__":
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=config.FLASK_DEBUG)
