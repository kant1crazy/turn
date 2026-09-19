from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ArticleType(str, Enum):
    chemise = "Chemise"
    tshirt = "T-shirt"
    pull = "Pull"
    robe = "Robe"
    pantalon = "Pantalon"
    jean = "Jean"
    jupe = "Jupe"
    veste = "Veste"
    manteau = "Manteau"
    short = "Short"
    sweat = "Sweat"
    autre = "Autre"


class ArticleEtat(str, Enum):
    neuf_etiquette = "Neuf avec étiquette"
    neuf_sans_etiquette = "Neuf sans étiquette"
    tres_bon_etat = "Très bon état"
    bon_etat = "Bon état"
    satisfaisant = "Satisfaisant"


class ArticleInfo(BaseModel):
    id: str
    type: ArticleType
    marque: str
    couleur: str
    taille: str
    etat: ArticleEtat
    matiere: Optional[str] = None
    prix_achat: float
    utiliser_prix_marche: bool = False


class ListingText(BaseModel):
    titre: str
    description: str


class PriceSuggestion(BaseModel):
    prix_achat: float
    utiliser_prix_marche: bool
    prix_marche_constate: Optional[float] = None
    nb_annonces_comparables: int = 0
    prix_conseille: float
    detail: str
