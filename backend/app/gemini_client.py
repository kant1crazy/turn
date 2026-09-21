"""Tous les appels à l'API Gemini.

Deux familles d'appels :
- images (gemini-2.5-flash-image, alias "nano banana") pour le photo mannequin
  et la photo produit pliée ;
- texte (gemini-2.5-flash) pour la reconnaissance assistée de l'article et
  la génération du titre/description.

Point d'attention constant : les prompts insistent explicitement pour que
Gemini NE MODIFIE JAMAIS la texture, la couleur ou le motif de l'article.
Le rendu doit être vérifié à l'œil pour chaque annonce avant publication —
c'est un point encore non testé avec une vraie clé API (voir README).
"""

from __future__ import annotations

import json
from pathlib import Path

from google import genai
from google.genai import types

from . import config
from .models import ArticleInfo, ListingText

IMAGE_MODEL = "gemini-2.5-flash-image"
TEXT_MODEL = "gemini-2.5-flash"

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not config.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY manquant : renseigne-le dans .env")
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


def _image_part(path: Path) -> types.Part:
    mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    return types.Part.from_bytes(data=path.read_bytes(), mime_type=mime)


def _first_image_bytes(response) -> bytes:
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            return part.inline_data.data
    raise RuntimeError("Gemini n'a renvoyé aucune image dans la réponse")


def generate_tryon_image(reference_path: Path, product_photo_paths: list[Path]) -> bytes:
    """Habille le mannequin de `reference_path` avec l'article des photos produit."""
    prompt = (
        "Utilise la première image comme référence pour le personnage (même "
        "visage, même carnation, même corpulence, mêmes accessoires comme la "
        "montre) et les images suivantes comme référence pour le vêtement. "
        "Remplace le vêtement porté par la personne de la première image par "
        "celui des images suivantes, en respectant fidèlement sa couleur, ses "
        "motifs, sa coupe et sa texture. Garde le même décor et le même "
        "éclairage que la première image. Le rendu doit être photoréaliste, "
        "sans déformation du tissu, sans aspect \"généré par IA\"."
    )
    parts = [prompt, _image_part(reference_path)] + [_image_part(p) for p in product_photo_paths]
    response = _get_client().models.generate_content(model=IMAGE_MODEL, contents=parts)
    return _first_image_bytes(response)


def generate_flatlay_image(product_photo_paths: list[Path], background_reference_path: Path | None) -> bytes:
    """Recompose une photo produit bien pliée, sur le même fond que les autres photos."""
    prompt = (
        "Voici des photos d'un vêtement. Génère une photo du même vêtement "
        "présenté parfaitement plié (pliage soigné, symétrique, comme en "
        "boutique), vu de dessus ou de face selon ce qui met le mieux le "
        "vêtement en valeur. Conserve EXACTEMENT sa couleur, sa texture et "
        "son motif d'origine, sans les modifier."
    )
    parts = [prompt] + [_image_part(p) for p in product_photo_paths]
    if background_reference_path is not None:
        parts.append("Utilise le même fond/éclairage que sur cette photo de référence :")
        parts.append(_image_part(background_reference_path))
    response = _get_client().models.generate_content(model=IMAGE_MODEL, contents=parts)
    return _first_image_bytes(response)


def recognize_article(product_photo_paths: list[Path]) -> dict:
    """Pré-remplissage assisté des menus déroulants à partir des photos."""
    prompt = (
        "Analyse ces photos d'un vêtement à vendre sur Vinted. Réponds "
        "uniquement en JSON avec les clés : marque (chaîne, vide si "
        "illisible), type (une valeur parmi Chemise, T-shirt, Pull, Robe, "
        "Pantalon, Jean, Jupe, Veste, Manteau, Short, Sweat, Autre), "
        "couleur (chaîne courte), matiere (chaîne courte, vide si "
        "inconnue). Ne renvoie rien d'autre que le JSON."
    )
    parts = [prompt] + [_image_part(p) for p in product_photo_paths]
    response = _get_client().models.generate_content(
        model=TEXT_MODEL,
        contents=parts,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(response.text)


def generate_listing_text(article: ArticleInfo) -> ListingText:
    """Titre + description courts, orientés mots-clés Vinted."""
    prompt = (
        "Rédige une annonce Vinted pour cet article :\n"
        f"- Type : {article.type.value}\n"
        f"- Marque : {article.marque}\n"
        f"- Couleur : {article.couleur}\n"
        f"- Taille : {article.taille}\n"
        f"- État : {article.etat.value}\n"
        f"- Matière : {article.matiere or 'non précisée'}\n\n"
        "Contraintes strictes (une annonce ne doit jamais donner envie de "
        "zapper — trop d'info tue l'info) :\n"
        "- titre : max 60 caractères, format 'Marque Type Couleur Taille', "
        "pas de ponctuation superflue ;\n"
        "- description : 2 lignes maximum, jamais de paragraphe. Ligne 1 : "
        "les infos clés séparées par ' · ' (marque, type, taille, matière, "
        "état) — pas de phrase, juste les valeurs. Ligne 2 (optionnelle) : "
        "une accroche courte de 8 mots max sur un vrai détail qui vend "
        "(coupe, occasion portée). Zéro remplissage, zéro emoji, zéro "
        "hashtag, zéro phrase du type 'superbe article à ne pas manquer'.\n"
        "Réponds uniquement en JSON avec les clés 'titre' et 'description'."
    )
    response = _get_client().models.generate_content(
        model=TEXT_MODEL,
        contents=[prompt],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    data = json.loads(response.text)
    return ListingText(**data)
