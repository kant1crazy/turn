# Passation — pour la conversation Claude sur le Mac de l'auteur

État au 22 novembre 2026. La fabrication des vidéos reste dans le cloud ; cette conversation-ci prend en charge
ce qui demande le Mac et le Chrome de l'auteur : récupérer les vidéos, analyser le compte TikTok, programmer les publications.

À lire : `CLAUDE.md` (le format et ses règles), `PUBLICATION.md` (la marche à suivre pour publier), ce fichier (où on en est).

## Le compte

- Plus de 10 000 abonnés, déjà inscrit au programme de récompenses, avec un RPM tombé à environ 2 centimes.
- Les anciennes vidéos sont des republications de contenus YouTube sur Fortnite : TikTok ne rémunère que l'original de plus d'une minute.
- L'auteur envisage de passer ces anciennes vidéos en privé. Ne le faire qu'avec son accord explicite, après l'analyse.

## À faire, dans l'ordre

1. Récupérer les vidéos : `motion/tools/fetch_videos.sh` (les dépose dans `~/Movies/tiktok` et liste leur état).
2. Analyser le compte comme décrit dans `PUBLICATION.md`, **sans rien modifier ni publier**, et remettre le rapport à l'auteur.
3. Programmer les vidéos prêtes, deux par jour, selon les règles de `PUBLICATION.md`.
4. Chaque jour, relancer `fetch_videos.sh` : deux nouvelles vidéos arrivent quotidiennement jusqu'au 27 novembre.
5. Tenir le relevé du test (voir plus bas).

## Les vidéos

| Vidéo | Branche | État |
|---|---|---|
| `ne-en-2006` | `claude/ecstatic-mccarthy-fcx7dy` | Validée par l'auteur, à programmer |
| `ne-en-2008` | `claude/video-ne-en-2008` | Une phrase à corriger (« à peine treize ans »), nouveau rendu attendu |
| `prenom-yanis` | `claude/video-prenom-yanis` | Chiffres issus de sites qui reprennent l'INSEE : les vérifier sur insee.fr avant de programmer |
| `ville-bordeaux` | `claude/video-ville-bordeaux` | En attente des retours de l'auteur (levées du pont Chaban-Delmas à confirmer) |

Chaque vidéo a sa propre conversation cloud, où l'auteur donne ses retours ; un nouveau rendu remplace le fichier sur la branche.
Ne pas modifier ces branches depuis le Mac.

À venir (deux par jour, lancées à 8 h 47 par une tâche planifiée de la conversation cloud d'origine) :
23 nov. `fortnite-chapitre-1`, `ne-en-2007` · 24 nov. `prenom-lucas`, `ville-marseille` · 25 nov. `ne-en-2005`, `prenom-lea` ·
26 nov. `fratrie-petit-dernier`, `ville-lyon` · 27 nov. `objet-ds`, `ne-en-2009`.
Pour suspendre la fabrication : l'auteur écrit « pause » dans la conversation cloud d'origine ou désactive la tâche
« Production vidéos TikTok (test 1 semaine) ».

## Le test d'une semaine

But : comparer les séries (années, prénoms, villes, autres) et savoir si le RPM remonte avec du contenu original.
Pour chaque vidéo publiée, relever à 24 h et à 72 h dans TikTok Studio : vues, durée moyenne de visionnage,
part de vues complètes, partages, commentaires, nouveaux abonnés, vues qualifiées et RPM.
Mettre `fortnite-chapitre-1` parmi les premières publications : c'est elle qui parle au public actuel du compte.
