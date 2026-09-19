"""Régénère data/articles.xlsx à partir du schéma défini dans pricing.py.

Usage : python scripts/generate_excel_template.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import config, pricing  # noqa: E402


def main() -> None:
    if config.EXCEL_PATH.exists():
        answer = input(f"{config.EXCEL_PATH} existe déjà, écraser ? (o/N) ")
        if answer.strip().lower() != "o":
            print("Annulé.")
            return
    config.EXCEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    pricing.build_template().save(config.EXCEL_PATH)
    print(f"Créé : {config.EXCEL_PATH}")


if __name__ == "__main__":
    main()
