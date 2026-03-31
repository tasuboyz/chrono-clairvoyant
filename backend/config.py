import os
from dotenv import load_dotenv

load_dotenv()

# AI provider — set one of these
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# Flask
FLASK_HOST: str = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT: int = int(os.getenv("FLASK_PORT", "5000"))
FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "false").lower() == "true"

# Static files: path to the Vite build output (../dist relative to backend/)
DIST_DIR: str = os.getenv(
    "DIST_DIR",
    os.path.join(os.path.dirname(__file__), "..", "dist"),
)

# Playwright scraper
SCRAPER_TIMEOUT_MS: int = int(os.getenv("SCRAPER_TIMEOUT_MS", "15000"))
SCRAPER_HEADLESS: bool = os.getenv("SCRAPER_HEADLESS", "true").lower() == "true"
