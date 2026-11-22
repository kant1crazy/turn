# motion — vidéos TikTok « Si tu… » en motion design

Série de vidéos verticales (1080×1920, plus d'une minute) où le spectateur se reconnaît dès la première
seconde : « Si t'es né en 2006 », « Si tu t'appelles Yanis », « Si t'habites à Bordeaux »…
Tout est généré par code : voix off, sous-titres mot à mot, animations, bruitages.
La vidéo de référence est `ne-en-2006` : la lire avant d'en écrire une autre.

## Règles du format (retours de l'auteur — à respecter)

1. **Durée** : entre 62 et 75 s. En dessous de 60 s, la vidéo ne compte pas ; ajouter un fait plutôt que ralentir la voix.
2. **Accroche** : la première image affiche déjà « SI T'ES… » en grand, la voix démarre tout de suite, sans intro.
3. **Ton naturel** : la plupart des faits se disent directement, comme à un pote, avec une petite anecdote
   (« L'été d'avant, tu passais tes journées sur le téléphone de ta mère, à jouer à Pokémon GO. Tu lui rendais à 2 % de batterie. »).
   Le format devinette puis réponse (`riddle` → `reveal`) reste l'exception : environ un fait sur trois, jamais deux de suite.
   Varier les tournures : pas trois répliques de suite qui commencent pareil.
4. **Des faits propres à la cible** : chaque fait doit être vrai pour cette année, ce prénom ou cette ville, et pas pour tout le monde.
   « T'as eu ton bac à 18 ans » a été refusé : c'est vrai pour toutes les générations. « L'été de tes 18 ans, c'était les JO de Paris » passe.
   Vérifier chaque affirmation (dates, chiffres) ; ne jamais inventer un chiffre.
5. **Un seul élément principal à l'écran** : une illustration *ou* un gros mot, jamais un empilement.
   Autour : le sous-titre et le bandeau du haut, c'est tout. Pas d'étiquettes, de tampons, de légendes ni de dates en coin.
   Ne jamais afficher deux fois le même texte : quand un `BigWord` dit le mot-clé, masquer le sous-titre correspondant (liste `HIDE`),
   et faire apparaître le gros mot pile au début du passage masqué.
6. **Rétention** : le score (« compte un point à chaque fois que c'est vrai »), une relance à mi-parcours,
   l'appel à commenter placé avant le dernier fait, une chute, et une dernière image identique à la première pour que la vidéo boucle.
7. **Zone sûre TikTok** : rien d'important au-dessus de y = 190, en dessous de y = 1480, ni à droite de x = 930 quand y > 850.
   Illustration centrée vers y = 760, sous-titres à y = 1345.
8. **Respect** : complicité, jamais de moquerie. Pas de clichés sur l'origine ou le milieu social d'un prénom ou d'une ville.

## Fabriquer une nouvelle vidéo

```bash
npm install && pip install -r requirements.txt && tools/get_models.sh   # une fois (≈ 1,2 Go de modèles)
python3 tools/build_audio.py <id>     # voix + bruitages + musique + timeline ; lire les lignes marquées ⚠
node tools/still.mjs <id> 0 300 900   # aperçus dans out/stills/ : les regarder avant le rendu
node tools/render.mjs <id>            # out/<id>.mp4, environ 4 minutes
```

1. Écrire `content/<id>.json` sur le modèle de `content/ne-en-2006.json` (scènes, répliques, pauses, bruitages, moment du point).
2. Lancer `build_audio.py`, corriger les prononciations signalées, viser 62–75 s.
3. Créer `src/videos/<id>/index.tsx` et `src/videos/<id>/scenes/*.tsx` en partant de `src/videos/ne-en-2006/`,
   puis ajouter une ligne dans `src/Root.tsx`. Chaque animation se cale sur un repère `"ligne"` ou `"ligne#début-de-mot"`.
4. Regarder des aperçus de chaque scène (débordements, chevauchements, écran vide) avant le rendu final.
5. Contrôler le MP4 (`ffprobe` : durée, 1080×1920, 30 i/s) et l'envoyer à l'auteur.

Ne modifier que les fichiers de sa propre vidéo : plusieurs vidéos sont produites en parallèle sur des branches séparées.
Les briques communes (`src/components`, `src/anim.ts`, `tools/`) ne se changent que pour corriger un vrai défaut.

## Voix : pièges connus

- Garder `sherpa-onnx==1.12.40` : la version 2 n'embarque plus la phonétisation française et ne produit aucun son.
- Écrire les nombres en toutes lettres et réécrire phonétiquement les mots étrangers avec `[affiché|prononcé]` :
  `[Fortnite.|Fortnaïte.]`, `[hand|hannd] [spinner.|spineur.]`, `[L'iPhone.|L'aïfone.]`, `[CM2,|cé ème deux,]`.
- La voix avale certains débuts de phrase : « Un … » seul, « T'as » suivi d'une consonne. Préférer « Et un point. », « Et t'as crié… ».
- « JO » est mal lu : écrire « Jeux olympiques ».
- Le script audio relit chaque ligne par reconnaissance vocale. Un `⚠` avec un texte « entendu » différent de « dit »
  signale un mot mal prononcé, sauf quand la seule différence est un nombre écrit en chiffres.
- `--voice tom` donne une voix masculine ; elle demande ses propres réécritures phonétiques.
