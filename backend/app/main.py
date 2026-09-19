from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import config, export_utils, gemini_client, pricing, storage
from .models import ArticleEtat, ArticleInfo, ArticleType, ListingText, PriceSuggestion

app = FastAPI(title="Vinted Listing Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sert les photos brutes/générées pour la prévisualisation côté frontend.
app.mount("/data", StaticFiles(directory=str(config.DATA_DIR)), name="data")


@app.post("/api/articles")
async def create_article(photos: list[UploadFile] = File(...)):
    """Crée un nouvel article et enregistre ses photos brutes."""
    article_id = storage.new_article_id()
    for photo in photos:
        content = await photo.read()
        storage.save_raw_photo(article_id, photo.filename, content)
    return {"id": article_id, "nb_photos": len(photos)}


@app.get("/api/references")
def list_references():
    return {"references": [p.name for p in storage.list_reference_photos()]}


@app.post("/api/references")
async def add_reference(photo: UploadFile = File(...)):
    content = await photo.read()
    storage.save_reference_photo(photo.filename, content)
    return {"ok": True, "name": photo.filename}


@app.post("/api/articles/{article_id}/recognize")
def recognize(article_id: str):
    photos = storage.raw_photos(article_id)
    if not photos:
        raise HTTPException(404, "Aucune photo pour cet article")
    return gemini_client.recognize_article(photos)


@app.post("/api/articles/{article_id}/generate-tryon")
def generate_tryon(article_id: str, reference_name: str = Form(...)):
    photos = storage.raw_photos(article_id)
    if not photos:
        raise HTTPException(404, "Aucune photo pour cet article")

    reference_path = config.REFERENCES_DIR / reference_name
    if not reference_path.exists():
        raise HTTPException(404, "Image de référence introuvable")

    image_bytes = gemini_client.generate_tryon_image(reference_path, photos)
    storage.save_generated_image(article_id, "tryon.png", image_bytes)
    return {"ok": True, "path": "generated/tryon.png"}


@app.post("/api/articles/{article_id}/generate-flatlay")
def generate_flatlay(article_id: str, background_reference_name: Optional[str] = Form(None)):
    photos = storage.raw_photos(article_id)
    if not photos:
        raise HTTPException(404, "Aucune photo pour cet article")

    background_path = None
    if background_reference_name:
        background_path = config.REFERENCES_DIR / background_reference_name
        if not background_path.exists():
            raise HTTPException(404, "Image de fond de référence introuvable")

    image_bytes = gemini_client.generate_flatlay_image(photos, background_path)
    storage.save_generated_image(article_id, "flatlay.png", image_bytes)
    return {"ok": True, "path": "generated/flatlay.png"}


@app.post("/api/articles/{article_id}/listing")
def generate_listing(
    article_id: str,
    type: ArticleType = Form(...),
    marque: str = Form(...),
    couleur: str = Form(...),
    taille: str = Form(...),
    etat: ArticleEtat = Form(...),
    matiere: str = Form(""),
    prix_achat: float = Form(...),
    utiliser_prix_marche: bool = Form(False),
):
    article = ArticleInfo(
        id=article_id,
        type=type,
        marque=marque,
        couleur=couleur,
        taille=taille,
        etat=etat,
        matiere=matiere or None,
        prix_achat=prix_achat,
        utiliser_prix_marche=utiliser_prix_marche,
    )
    listing = gemini_client.generate_listing_text(article)
    price = pricing.compute_suggested_price(article)
    pricing.upsert_article_row(article, price)
    storage.save_listing(article_id, listing.titre, listing.description, price.prix_conseille)
    return {"listing": listing.model_dump(), "price": price.model_dump()}


@app.get("/api/articles/{article_id}/export")
def export_article(article_id: str):
    listing_data = storage.load_listing(article_id)
    if listing_data is None:
        raise HTTPException(400, "Génère d'abord le titre/description de cet article")
    listing = ListingText(titre=listing_data["titre"], description=listing_data["description"])
    price = PriceSuggestion(
        prix_achat=0,
        utiliser_prix_marche=False,
        prix_conseille=listing_data["prix_conseille"],
        detail="voir data/articles.xlsx pour le détail du calcul",
    )
    zip_path = export_utils.build_export_zip(article_id, listing, price)
    return FileResponse(zip_path, filename=zip_path.name)
