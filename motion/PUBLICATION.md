# Publication sur TikTok

Cette marche à suivre s'adresse à une conversation Claude qui tourne **sur l'ordinateur de l'auteur**, avec l'extension
Claude in Chrome connectée à son Chrome, où il est déjà connecté à TikTok. Une session cloud ne peut pas publier.

## Où sont les vidéos

Chaque vidéo terminée est livrée dans `motion/publish/` : `<id>.mp4` et `<id>.json` (légende, hashtags, faits non vérifiés).
Elles sont réparties sur plusieurs branches du dépôt `kant1crazy/turn` : `claude/ecstatic-mccarthy-fcx7dy` (la vidéo 2006)
et une branche `claude/video-<id>` par vidéo suivante.

```bash
git fetch origin 'refs/heads/claude/*:refs/remotes/origin/claude/*'
for b in $(git branch -r | grep 'origin/claude/'); do
  for f in $(git ls-tree -r --name-only "$b" motion/publish 2>/dev/null); do
    mkdir -p ~/Movies/tiktok && git show "$b:$f" > ~/Movies/tiktok/"$(basename "$f")"
  done
done
```

## Règles fixées par l'auteur

- **Deux vidéos par jour**, programmées dans TikTok Studio (tiktok.com/tiktokstudio) plutôt que publiées à la main :
  12 h 15 et 18 h 45, heure de Paris, tant que les statistiques ne suggèrent pas mieux.
- **Validation facultative** : l'auteur peut modifier ou annuler une vidéo programmée ; s'il ne l'a pas fait à l'heure dite, elle sort telle quelle.
- **Jamais deux vidéos de la même série à la suite** (années, prénoms, villes, autres) : alterner.
- Ne programmer aucune vidéo dont `faits_non_verifies` n'est pas vide : le signaler à l'auteur à la place.
- Légende et hashtags : ceux du fichier `.json`. Une phrase avec les mots que les gens cherchent, puis 3 à 5 hashtags.
- Activer la mention « contenu généré par IA » : la voix est synthétique.
- Ne jamais supprimer une vidéo. Passer une ancienne vidéo en privé seulement si l'auteur l'a demandé pour cette vidéo ou ce lot.
- Agir à un rythme humain, sans script ni rafale de clics ; au moindre captcha ou message inhabituel de TikTok, s'arrêter et prévenir l'auteur.

## Analyse du compte (à faire avant la première publication)

Dans TikTok Studio, relever et rapporter à l'auteur :
1. **Statut du compte** : avertissements, contenus signalés comme non originaux, restrictions.
2. **Programme de récompenses** : RPM actuel, vues qualifiées des 30 derniers jours, vidéos éligibles ou non, et pourquoi.
3. **Audience** : pays, âge, sexe, heures d'activité des abonnés.
4. **Contenu** : les vidéos qui apportent encore des vues ou des abonnés, leur durée, leur taux de visionnage complet.
5. Ce que cela implique : heures de publication, anciennes vidéos à passer en privé, sujets à privilégier.
