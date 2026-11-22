#!/usr/bin/env bash
# Récupère sur cet ordinateur toutes les vidéos prêtes à publier.
# Chaque vidéo est livrée dans motion/publish/ sur sa propre branche claude/* du dépôt.
#   tools/fetch_videos.sh [dossier de destination]     (par défaut : ~/Movies/tiktok)
set -euo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
dest="${1:-$HOME/Movies/tiktok}"
mkdir -p "$dest"

git fetch --quiet origin 'refs/heads/claude/*:refs/remotes/origin/claude/*'

for branch in $(git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/claude/'); do
  for path in $(git ls-tree -r --name-only "$branch" motion/publish 2>/dev/null); do
    git show "$branch:$path" > "$dest/$(basename "$path")"
  done
done

echo "Vidéos dans $dest :"
for fiche in "$dest"/*.json; do
  [ -e "$fiche" ] || { echo "  (aucune)"; break; }
  python3 - "$fiche" <<'PY'
import json, os, sys
f = json.load(open(sys.argv[1]))
video = os.path.join(os.path.dirname(sys.argv[1]), f["fichier"])
etat = "à programmer" if not f.get("faits_non_verifies") else f"en attente : {len(f['faits_non_verifies'])} fait(s) non vérifié(s)"
taille = f"{os.path.getsize(video) / 1e6:.0f} Mo" if os.path.exists(video) else "MP4 manquant"
print(f"  {f['id']:24s} {f.get('duree_s', '?')} s  {taille:>6s}  {etat}")
PY
done
