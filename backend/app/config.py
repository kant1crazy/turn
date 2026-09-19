import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

DATA_DIR = Path(os.getenv("DATA_DIR", "./data")).resolve()
ARTICLES_DIR = DATA_DIR / "articles"
REFERENCES_DIR = DATA_DIR / "references"
EXCEL_PATH = Path(os.getenv("EXCEL_PATH", str(DATA_DIR / "articles.xlsx"))).resolve()

DEFAULT_MARGIN_MULTIPLIER = float(os.getenv("DEFAULT_MARGIN_MULTIPLIER", "2.2"))

SCRAPER_MAX_RESULTS = int(os.getenv("SCRAPER_MAX_RESULTS", "30"))
SCRAPER_DELAY_SECONDS = float(os.getenv("SCRAPER_DELAY_SECONDS", "1.5"))
# Optionnel : cookie de session vinted.fr (copié depuis ton navigateur connecté)
# nécessaire si l'API interne renvoie 401/403 aux requêtes anonymes.
VINTED_COOKIE = os.getenv("VINTED_COOKIE", "")

ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
REFERENCES_DIR.mkdir(parents=True, exist_ok=True)
