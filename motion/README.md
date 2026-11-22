# motion — vidéos TikTok en motion design, générées par code

Chaîne complète : un script JSON → voix off + bruitages + musique → animation → MP4 vertical 1080×1920.

## Fabriquer une vidéo

```bash
npm install
pip install -r requirements.txt
tools/get_models.sh                         # une seule fois (≈ 1,2 Go)

python3 tools/build_audio.py ne-en-2006     # bande-son + timeline (mots horodatés)
node tools/render.mjs ne-en-2006            # → out/ne-en-2006.mp4
```

Aperçus image par image : `node tools/still.mjs ne-en-2006 0 300 900` (dans `out/stills/`).
Prévisualisation interactive : `npm run studio`.

## Organisation

| Dossier | Rôle |
|---|---|
| `content/<id>.json` | Le script : scènes, répliques, pauses, bruitages, moment où le point tombe |
| `tools/build_audio.py` | Synthèse vocale ligne par ligne, relecture par reconnaissance vocale (horodatage mot à mot + contrôle de prononciation), bruitages et musique synthétisés, mixage à −14 LUFS |
| `src/generated/<id>.timeline.json` | Sortie du script audio : c'est elle qui cadence l'animation |
| `src/videos/<id>/` | Une vidéo par dossier : sa composition et ses scènes ; chaque animation se cale sur un repère `"ligne#mot"` |
| `src/components/` | Briques communes : sous-titres, compteur de points, gros mots, transitions |
| `CLAUDE.md` | Les règles du format et la marche à suivre pour une nouvelle vidéo |

## Écrire le script

- `[affiché|prononcé]` : quand l'orthographe à l'écran diffère de ce que la voix doit lire
  (`[CM2,|cé ème deux,]`, `[Fortnite.|Fortnaïte.]`).
- `/` : césure de sous-titre.
- `"kind": "riddle"` puis `"reveal"` : la pause de suspense, la montée sonore et l'impact sont ajoutés tout seuls.
- Le script audio signale par `⚠` les lignes que le modèle de reconnaissance n'a pas comprises :
  c'est le signe d'un mot mal prononcé, à réécrire phonétiquement.

## Voix

`--voice kokoro` (par défaut, féminine) ou `--voice tom` (masculine). Ce sont des voix libres qui tournent
hors ligne ; une voix ElevenLabs ou une vraie voix enregistrée donnera un meilleur résultat.
