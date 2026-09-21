#!/bin/bash
# Double-clique sur ce fichier pour lancer l'appli : ça démarre le serveur
# (si besoin) et ouvre la page dans ton navigateur. Laisse cette fenêtre
# de terminal ouverte tant que tu utilises l'appli.

cd "$(dirname "$0")"

echo "Récupération des dernières mises à jour..."
if ! git pull --ff-only 2>/tmp/lancer_git_pull.log; then
  echo "⚠️  Impossible de mettre à jour automatiquement (pas de réseau, ou modifs locales en conflit)."
  echo "   On continue avec la version déjà présente sur ce Mac."
  cat /tmp/lancer_git_pull.log
fi

cd backend

if lsof -i :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Le serveur tourne déjà, ouverture de l'appli..."
  open ../frontend/index.html
  exit 0
fi

if [ ! -d venv ]; then
  echo "Première installation : création de l'environnement Python (ça peut prendre une minute)..."
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
else
  source venv/bin/activate
fi

if [ ! -f ../.env ]; then
  cp ../.env.example ../.env
  echo ""
  echo "⚠️  Fichier .env créé pour la première fois."
  echo "   Ajoute ta clé GEMINI_API_KEY dedans avant de générer des visuels :"
  echo "   open -e \"$(cd .. && pwd)/.env\""
  echo ""
fi

uvicorn app.main:app --reload &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null" EXIT

sleep 2
open ../frontend/index.html

echo ""
echo "L'appli tourne sur http://localhost:8000"
echo "Laisse cette fenêtre ouverte pendant que tu l'utilises."
echo "Ferme cette fenêtre (ou Ctrl+C) pour arrêter le serveur."
echo ""

wait $SERVER_PID
