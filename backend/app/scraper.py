"""Estimation du prix marché Vinted.

⚠️ Interroge l'API interne (non documentée, non publique) que le site
vinted.fr utilise pour sa propre recherche. Ce n'est pas une API
officielle : ça viole les CGU de Vinted, ça peut casser sans préavis
(changement de format, blocage IP/captcha) et ça peut nécessiter un
cookie de session valide (VINTED_COOKIE dans .env) si les requêtes
anonymes sont bloquées. Utilisation prévue : recherche ponctuelle pour un
usage personnel, pas de volume — le délai entre requêtes est volontaire.

Si ça échoue, l'appelant doit pouvoir retomber sur le prix d'achat +
marge (voir pricing.py) plutôt que de bloquer toute l'annonce.
"""

import statistics
import time

import requests

from . import config

SEARCH_URL = "https://www.vinted.fr/api/v2/catalog/items"


class ScraperError(RuntimeError):
    pass


def _headers() -> dict:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
    }
    if config.VINTED_COOKIE:
        headers["Cookie"] = config.VINTED_COOKIE
    return headers


def search_market_prices(marque: str, couleur: str, taille: str, type_hint: str = "") -> list[float]:
    """Renvoie les prix (EUR) des annonces actives correspondant à la recherche.

    Lève ScraperError si la requête échoue (bloquée, cookie manquant,
    format de réponse changé, etc.) — à l'appelant de retomber sur le
    prix d'achat + marge dans ce cas.
    """
    query = " ".join(part for part in [marque, type_hint, couleur] if part)
    params = {
        "search_text": query,
        "size_ids": "",  # Vinted attend des IDs internes ; à défaut on filtre sur le texte
        "per_page": str(config.SCRAPER_MAX_RESULTS),
        "order": "relevance",
    }
    try:
        resp = requests.get(SEARCH_URL, params=params, headers=_headers(), timeout=10)
    except requests.RequestException as exc:
        raise ScraperError(f"Requête Vinted impossible : {exc}") from exc

    time.sleep(config.SCRAPER_DELAY_SECONDS)

    if resp.status_code in (401, 403):
        raise ScraperError(
            "Vinted a refusé la requête (401/403). Essaie de renseigner "
            "VINTED_COOKIE dans .env avec un cookie de session valide, ou "
            "décoche 'utiliser le prix marché' pour te baser uniquement sur "
            "le prix d'achat."
        )
    if resp.status_code != 200:
        raise ScraperError(f"Vinted a répondu {resp.status_code}")

    try:
        data = resp.json()
        items = data["items"]
        prices = []
        for item in items:
            price_field = item.get("price")
            if isinstance(price_field, dict):
                prices.append(float(price_field.get("amount")))
            elif isinstance(price_field, (int, float, str)):
                prices.append(float(price_field))
        # filtre grossier sur la taille annoncée quand elle est présente en texte
        if taille:
            filtered = [
                float(item.get("price", {}).get("amount"))
                for item in items
                if taille.lower() in (item.get("size_title") or "").lower()
            ]
            if filtered:
                prices = filtered
        return prices
    except (KeyError, TypeError, ValueError) as exc:
        raise ScraperError(f"Format de réponse Vinted inattendu : {exc}") from exc


def median_price(prices: list[float]) -> float | None:
    if not prices:
        return None
    return round(statistics.median(prices), 2)
