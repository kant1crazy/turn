"""Gestion des dossiers par article sur disque.

Chaque article a un dossier `data/articles/{id}/` avec :
  raw/         photos brutes importées
  generated/   tryon.png, flatlay.png produites par Gemini
  listing.json titre/description générés
"""

import json
import uuid
from pathlib import Path
from typing import Optional

from . import config


def new_article_id() -> str:
    return uuid.uuid4().hex[:10]


def article_dir(article_id: str) -> Path:
    d = config.ARTICLES_DIR / article_id
    (d / "raw").mkdir(parents=True, exist_ok=True)
    (d / "generated").mkdir(parents=True, exist_ok=True)
    return d


def save_raw_photo(article_id: str, filename: str, content: bytes) -> Path:
    d = article_dir(article_id) / "raw"
    path = d / filename
    path.write_bytes(content)
    return path


def raw_photos(article_id: str) -> list[Path]:
    d = article_dir(article_id) / "raw"
    return sorted(p for p in d.iterdir() if p.is_file())


def save_generated_image(article_id: str, name: str, content: bytes) -> Path:
    d = article_dir(article_id) / "generated"
    path = d / name
    path.write_bytes(content)
    return path


def save_reference_photo(name: str, content: bytes) -> Path:
    path = config.REFERENCES_DIR / name
    path.write_bytes(content)
    return path


def list_reference_photos() -> list[Path]:
    return sorted(p for p in config.REFERENCES_DIR.iterdir() if p.is_file())


def save_listing(article_id: str, titre: str, description: str, prix_conseille: float) -> Path:
    path = article_dir(article_id) / "listing.json"
    data = {"titre": titre, "description": description, "prix_conseille": prix_conseille}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    return path


def load_listing(article_id: str) -> Optional[dict]:
    path = article_dir(article_id) / "listing.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())
