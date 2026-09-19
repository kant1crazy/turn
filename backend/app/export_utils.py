"""Export final : zip des images + fichier texte prêt à copier-coller."""

import zipfile
from pathlib import Path

from . import config
from .models import ListingText, PriceSuggestion


def build_listing_text_file(listing: ListingText, price: PriceSuggestion) -> str:
    return (
        f"{listing.titre}\n"
        f"{'-' * len(listing.titre)}\n\n"
        f"{listing.description}\n\n"
        f"Prix conseillé : {price.prix_conseille} €\n"
    )


def build_export_zip(article_id: str, listing: ListingText, price: PriceSuggestion) -> Path:
    from . import storage

    article_path = storage.article_dir(article_id)
    generated_dir = article_path / "generated"
    raw_dir = article_path / "raw"

    zip_path = article_path / f"{article_id}_export.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for img_dir in (generated_dir, raw_dir):
            for img in img_dir.glob("*"):
                if img.is_file():
                    zf.write(img, arcname=f"photos/{img_dir.name}_{img.name}")
        zf.writestr("annonce.txt", build_listing_text_file(listing, price))
    return zip_path
