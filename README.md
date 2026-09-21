# Vinted Listing Optimizer

Outil perso pour générer des annonces Vinted complètes (photos, titre,
description, prix conseillé) en un minimum de temps.

## Pipeline

1. **Import** — tu uploades les photos brutes de l'article + tu choisis une
   image de référence (parmi tes propres photos de pose) dans laquelle
   Gemini viendra habiller le mannequin avec l'article.
2. **Génération visuelle (Gemini 2.5 Flash Image)**
   - `tryon` : remplace le vêtement de l'image de référence par l'article,
     sans jamais modifier sa texture/couleur/motif.
   - `flatlay` : photo de l'article bien plié, sur le même fond que tes
     autres photos.
3. **Classification** — menus déroulants (type, marque, couleur, taille,
   état, matière) renseignés par toi, avec une reconnaissance assistée par
   Gemini à partir des photos en pré-remplissage.
4. **Génération texte** — titre + description courts et orientés
   mots-clés Vinted (marque, type, taille, matière, état en tête ; 2-3
   lignes de description max, pas de remplissage).
5. **Prix conseillé** — basé sur `data/articles.xlsx` :
   - toujours : prix d'achat + marge par défaut,
   - si la case "utiliser le prix marché" est cochée sur la ligne : on
     mélange avec une estimation de marché scrapée sur Vinted pour la même
     marque/couleur/taille (voir avertissement ci-dessous).
6. **Export** — zip des images finales + fichier texte prêt à copier-coller
   (titre, description, prix).

## ⚠️ Scraping Vinted — à savoir avant d'activer la case

`backend/app/scraper.py` interroge l'API interne (non documentée, non
publique) que le site vinted.fr utilise pour sa propre recherche. Ce n'est
pas une API officielle :
- ça viole les conditions d'utilisation de Vinted,
- ça peut casser sans préavis (changement de format, blocage IP/captcha),
- à utiliser avec modération (le module respecte un délai entre requêtes),
  pour un usage personnel de recherche de prix, pas en masse.

Si la case n'est pas cochée sur une ligne, le prix conseillé ignore
totalement le scraping et se base uniquement sur `prix_achat` + la marge —
c'est le mode par défaut, sans aucun risque.

## Structure

```
backend/app/
  config.py         variables d'environnement (clé Gemini, chemins)
  models.py         schémas de données (Pydantic)
  storage.py         gestion des dossiers par article (photos brutes/générées)
  gemini_client.py   appels Gemini (images + texte)
  pricing.py         lecture/écriture Excel + calcul du prix conseillé
  scraper.py         estimation de prix marché Vinted (voir avertissement)
  export_utils.py    zip images + fichier texte
  main.py            API FastAPI qui orchestre tout
frontend/            page unique (upload, dropdowns, prévisualisation, export)
data/articles.xlsx   ta base (prix d'achat, infos article, prix conseillé)
scripts/generate_excel_template.py   régénère data/articles.xlsx si besoin
```

## Mise en route

**Le plus simple : double-clique sur `Lancer.command`** à la racine du
projet. Il installe l'environnement Python au premier lancement, crée
`.env` s'il n'existe pas encore (pense à y ajouter ta `GEMINI_API_KEY`),
démarre le serveur et ouvre l'appli dans ton navigateur. Laisse la fenêtre
de terminal ouverte tant que tu utilises l'appli ; la refermer arrête le
serveur. Si tu double-cliques dessus alors que le serveur tourne déjà, il
se contente de rouvrir l'appli sans rien casser.

(Au tout premier lancement, macOS peut demander de confirmer l'ouverture
d'un fichier venant d'un développeur non identifié : fais un clic droit
dessus → *Ouvrir*, une seule fois.)

Manuellement, si tu préfères garder la main :
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env   # puis renseigne GEMINI_API_KEY
uvicorn app.main:app --reload
```

Ouvre ensuite `frontend/index.html` dans le navigateur (il appelle
`http://localhost:8000`).

## État actuel

Ceci est le squelette du pipeline complet (V1 "tout d'un coup", décisions
prises le 19/09/2026) : les endpoints, la logique de prix et la structure
Excel sont fonctionnels ; les appels Gemini sont écrits pour l'API réelle
mais n'ont pas encore été testés avec une vraie clé. Prochaine étape :
brancher `GEMINI_API_KEY` et tester le premier article de bout en bout,
puis ajuster les prompts d'image selon la qualité des rendus (texture et
couleur sont les points à surveiller en premier).
