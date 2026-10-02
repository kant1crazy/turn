# -*- coding: utf-8 -*-
"""Génère retour-dossier/index.html (rapport de relecture page par page)."""
import re, html

OUT = "/home/user/turn/retour-dossier/index.html"
NB = " "  # espace fine insécable


def t(s):
    """Typographie française pour le contenu rédigé (pas pour les extraits « avant »)."""
    if s is None:
        return ""
    s = s.replace("'", "’")
    s = re.sub(r" ([:;?!%»])", NB + r"\1", s)
    s = s.replace("« ", "«" + NB)
    s = re.sub(r"(\d) (\d{3})\b", r"\1" + NB + r"\2", s)
    return s


def raw(s):
    return html.escape(s, quote=False)


# ---------------------------------------------------------------- maquettes
def wf(blocks, head="▶ ANALYSE STRATÉGIQUE", folio="00", label="Maquette proposée"):
    cells = []
    for b in blocks:
        k, c, cs, r, rs, txt = b[:6]
        extra = " ov" if len(b) > 6 and b[6] == "ov" else ""
        cells.append(
            f'<div class="b b-{k}{extra}" style="grid-column:{c}/span {cs};grid-row:{r}/span {rs}"><span>{t(txt)}</span></div>'
        )
    return (
        f'<div class="wf-page" role="img" aria-label="{label}">'
        f'<span class="wf-head">{head}</span><span class="wf-folio">{folio}</span>'
        + "".join(cells)
        + "</div>"
    )


def ul(items, cls=""):
    if not items:
        return ""
    return f'<ul class="{cls}">' + "".join(f"<li>{t(i)}</li>" for i in items) + "</ul>"


def keep(txt, label="À retenir (proposé)"):
    if not txt:
        return ""
    return f'<div class="keep"><span class="keep-label">▶ {label}</span><p>{t(txt)}</p></div>'


def fixes(rows):
    if not rows:
        return ""
    out = ['<div class="fixes">']
    for before, after in rows:
        out.append(
            '<div class="fix-row">'
            f'<p class="before"><span class="lbl">Avant</span>{raw(before)}</p>'
            f'<p class="after"><span class="lbl">Après</span>{t(after)}</p>'
            "</div>"
        )
    out.append("</div>")
    return "".join(out)


def pagetext(pid, rows, note=None):
    """rows : (étiquette, texte ou liste de paragraphes). L'étiquette « À retenir » prend le style sélection."""
    out = [f'<div class="ptext"><header><span>Texte de la page, prêt à coller</span>'
           f'<button type="button" class="copy" data-target="pt-{pid}">Copier</button></header>'
           f'<dl class="copy-src" id="pt-{pid}">']
    for lab, val in rows:
        paras = val if isinstance(val, list) else [val]
        cls = ' class="rt"' if lab == "À retenir" else ""
        out.append(f'<div{cls}><dt>{t(lab)}</dt><dd>' + "".join(f"<p>{t(x)}</p>" for x in paras) + "</dd></div>")
    out.append("</dl>")
    if note:
        out.append(f'<p class="hint">{t(note)}</p>')
    out.append("</div>")
    return "".join(out)


DENS = {
    "empty": "Trop vide",
    "unbal": "Déséquilibrée",
    "ok": "Équilibrée",
    "full": "Trop pleine",
    "text": "Texte seul",
}


def card(c):
    kind = c.get("kind", "exist")
    chips = "".join(f'<span class="chip {k}">{t(v)}</span>' for k, v in c.get("chips", []))
    if kind == "exist" and c.get("dens"):
        chips += f'<span class="chip dens-{c["dens"]}">Densité : {DENS[c["dens"]]}</span>'
    visuals = []
    for img, cap in c.get("imgs", []):
        visuals.append(
            f'<figure class="now"><img src="img/{img}" alt="{cap}" loading="lazy" width="640" height="453"><figcaption>{cap}</figcaption></figure>'
        )
    if c.get("wf"):
        visuals.append(
            f'<figure class="prop">{wf(c["wf"], c.get("head", "▶ ANALYSE STRATÉGIQUE"), c.get("folio", "00"))}<figcaption>{"Proposition de mise en page" if kind == "exist" else "Mise en page suggérée"}</figcaption></figure>'
        )
    notes = []
    if c.get("src"):
        notes.append(f'<p class="src"><span class="lbl">Contenu</span>{t(c["src"])}</p>')
    if c.get("ptext"):
        notes.append(pagetext(c["id"], c["ptext"], c.get("ptext_note")))
    if c.get("works"):
        notes.append("<h4>Ce qui marche</h4>" + ul(c["works"], "plus"))
    if c.get("todo"):
        notes.append("<h4>" + ("À faire" if kind == "exist" else ("Mise en page" if c.get("ptext") else "Ce que la page doit contenir")) + "</h4>" + ul(c["todo"], "todo"))
    if c.get("extra"):
        notes.append(c["extra"])
    if c.get("fixes"):
        notes.append("<h4>Corrections</h4>" + fixes(c["fixes"]))
    if not c.get("ptext"):
        notes.append(keep(c.get("keep")))
    return (
        f'<article class="pg {kind}" id="{c["id"]}">'
        f'<header class="pg-head"><span class="ref">{c["ref"]}</span><h3>{t(c["title"])}</h3><div class="chips">{chips}</div></header>'
        f'<div class="pg-body"><div class="pg-visuals">{"".join(visuals)}</div><div class="pg-notes">{"".join(notes)}</div></div>'
        "</article>"
    )


def beat_head(num, stc, name, target, note=""):
    return (
        f'<div class="beat-head"><span class="beat-num">{num}</span>'
        f'<div><p class="beat-stc">{stc}</p><h3 class="beat-name">{t(name)}</h3></div>'
        f'<p class="beat-target">{t(target)}</p></div>'
        + (f'<p class="beat-note">{t(note)}</p>' if note else "")
    )


# ---------------------------------------------------------------- données : chemin de fer
BEATS = [
    ("0", "Hors trame", "Couverture & sommaire", "", [("Couverture", "write"), ("Sommaire p.2", "fix")]),
    ("1", "Opening Image", "Brief / introduction", "1", [("Brief", "write")]),
    ("2", "Theme Stated", "Problématique", "1", [("Problé­matique", "new")]),
    ("3", "Set-Up", "État des lieux / étude de marché", "4–5", [
        ("p.1 Inter­calaire", "fix"), ("p.3 Contexte", "fix"), ("p.4 Ressource", "fix"), ("Usages actuels", "new"),
        ("p.5 Secteur", "fix"), ("p.6 Échelle", "fix"), ("p.7 PESTELÉ 1/2", "fix"), ("p.8 + p.11 PESTELÉ 2/2", "fix"), ("p.9 Marché", "fix")]),
    ("4", "Catalyst", "Déclencheur stratégique", "2", [("Brûlage", "new"), ("Matériaux", "new")]),
    ("5", "Debate", "Analyse de la concurrence", "8–10", [
        ("Typologie", "write"), ("Niko & Co", "new"), ("Princes Sarments", "new"), ("Vitis Valorem", "new"),
        ("Concurrent 4", "write"), ("Concurrent 5", "write"), ("Concurrent 6", "write"), ("Outils de com", "write"),
        ("Croix", "write"), ("Synthèse", "new")]),
    ("6", "Break into Two", "Concept / angle stratégique", "2", [("Le sarment reste sarment", "new"), ("Process", "new")]),
    ("7", "B Story", "Plateforme de marque", "4–5", [
        ("Mission & valeurs", "new"), ("Position­nement & cibles", "new"), ("Personas B2C", "new"), ("Persona B2B", "new"),
        ("p.10 SWOT", "fix"), ("4P", "write"), ("Naming", "later")]),
    ("8", "Fun and Games", "Moodboards / recherches graphiques", "5–6", [
        ("3 pistes", "write"), ("Mood­board 1", "fix"), ("Mood­board 2", "fix"), ("Mood­board 3", "fix"), ("Typo", "write"), ("Couleurs", "write")]),
    ("9", "Midpoint", "Axe 1 · Géométrie vivante", "3", [("Couverture", "fix"), ("Recherches", "write"), ("Bilan", "write")]),
    ("10", "Bad Guys Close In", "Axe 2 · La main à l'œuvre", "3", [("Couverture", "fix"), ("Recherches", "write"), ("Bilan", "write")]),
    ("11", "All Is Lost", "Axe 2.5 · Ombre & Lumière", "2", [("Couverture", "fix"), ("Recherches + bilan", "write")]),
    ("12", "Dark Night of the Soul", "Axe final", "1", [("Axe final", "later")]),
    ("13", "Break into Three", "Charte graphique", "6–8", [(x, "later") for x in ["Logo", "Construc­tion", "Typo", "Couleurs", "Motifs", "Photo", "Règles"]]),
    ("14", "Finale", "Déclinaisons & livrables", "6–7", [(x, "later") for x in ["Étiquette", "Packaging", "Site", "Instagram", "Boutique", "Papeterie"]]),
    ("15", "Final Image", "Conclusion", "1", [("Conclusion", "later")]),
    ("+", "Annexe", "Sources", "", [("Sources", "write")]),
]

STATUS = {
    "fix": "Existe, à retravailler",
    "new": "À créer, contenu prêt dans vos notes",
    "write": "À créer, à rédiger ou à produire",
    "later": "Étape suivante du projet",
}


def target_max(tgt):
    if not tgt:
        return None
    return int(tgt.split("–")[-1])


def chemin():
    rows = []
    counts = {k: 0 for k in STATUS}
    for num, stc, name, tgt, tiles in BEATS:
        for _, s in tiles:
            counts[s] += 1
        n = len(tiles)
        mx = target_max(tgt)
        flag = ""
        if mx and n > mx:
            flag = f'<span class="over">{n} prévues</span>'
        elif mx:
            flag = f'<span class="okc">{n} prévue{"s" if n > 1 else ""}</span>'
        tiles_html = "".join(f'<span class="tile {s}" title="{STATUS[s]}">{t(l)}</span>' for l, s in tiles)
        rows.append(
            f'<div class="beat"><span class="bn">{num}</span>'
            f'<div class="bname"><span class="stc">{stc}</span><strong>{t(name)}</strong></div>'
            f'<div class="btarget">{("cible " + t(tgt) + " p.") if tgt else "—"}{flag}</div>'
            f'<div class="tiles">{tiles_html}</div></div>'
        )
    legend = "".join(
        f'<span class="lg"><span class="tile mini {k}"></span>{STATUS[k]} <b>{counts[k]}</b></span>' for k in STATUS
    )
    return f'<div class="legend">{legend}</div><div class="beats">{"".join(rows)}</div>', counts


# ---------------------------------------------------------------- contenus spécifiques
FRISE = t("""
<div class="frise" role="img" aria-label="Frise : taille et collecte de novembre à mars, séchage d'avril à septembre, façonnage à l'automne">
  <div class="frise-row">
    <span class="m c">Nov</span><span class="m c">Déc</span><span class="m c">Jan</span><span class="m c">Fév</span><span class="m c">Mar</span>
    <span class="m s">Avr</span><span class="m s">Mai</span><span class="m s">Juin</span><span class="m s">Juil</span><span class="m s">Août</span>
    <span class="m f">Sep</span><span class="m f">Oct</span>
  </div>
  <div class="frise-leg"><span><i class="c"></i>Taille & collecte</span><span><i class="s"></i>Séchage (3 à 6 mois)</span><span><i class="f"></i>Façonnage</span></div>
</div>
<p class="hint">Exemple de frise pour le quart vide (données de vos notes ; le séchage « 3 à 6 mois » et « 6 mois minimum » se contredisent : choisissez).</p>
""")

SOMMAIRE = t("""
<ol class="toc-prop">
<li><b>01</b>Brief & problématique</li>
<li><b>02</b>Analyse stratégique <em>contexte, secteur, PESTELÉ, marché</em></li>
<li><b>03</b>Pourquoi maintenant</li>
<li><b>04</b>Concurrence</li>
<li><b>05</b>Concept & plateforme de marque <em>positionnement, cibles, personas, SWOT, 4P</em></li>
<li><b>06</b>Recherches graphiques <em>moodboards, axes 1 à 3, axe final</em></li>
<li><b>07</b>Charte graphique</li>
<li><b>08</b>Déclinaisons</li>
<li><b>09</b>Conclusion & sources</li>
</ol>
""")

USAGES = t("""
<div class="usages">
  <div><b>Retour au sol</b><span class="gauge g4" aria-label="usage majoritaire"></span><p>Broyage-épandage dans les rangs. Majoritaire.</p></div>
  <div><b>Brûlage</b><span class="gauge g2" aria-label="en recul"></span><p>À l'air libre, polluant. En recul.</p></div>
  <div><b>Énergie & compost</b><span class="gauge g2" aria-label="minoritaire"></span><p>Pellets, biogaz, compost.</p></div>
  <div><b>Matériaux</b><span class="gauge g1" aria-label="niche"></span><p>Vitis Valorem, Les Princes Sarments. Niche.</p></div>
</div>
<p class="hint">Jauges qualitatives : vos notes ne donnent pas de pourcentages par usage. N'inventez pas de chiffres ; si vous en trouvez, sourcez-les.</p>
""")

PESTEL_EX = t("""
<div class="pestel-ex">
<p class="pe-title">Exemple (Politique) : un mot-clé, une ligne, une étiquette</p>
<p><span class="tag up">Atout</span><b>Financements publics</b> ADEME, appels à projets type Agr'air.</p>
<p><span class="tag down">Frein</span><b>Pas de politique dédiée</b> Le sarment reste un sous-produit générique.</p>
<p><span class="tag up">Atout</span><b>Poids local de la filière</b> Collectivités attentives au secteur.</p>
</div>
<p class="hint">Version complète des 7 facteurs, étiquetée et corrigée : section « Textes corrigés ».</p>
""")

CONCURRENTS = t("""
<div class="scroll"><table class="conc">
<thead><tr><th>Type</th><th>Acteur</th><th>Pourquoi il compte</th><th>État</th></tr></thead>
<tbody>
<tr><td>Direct</td><td><b>Niko & Co</b> (Charente)</td><td>Mobilier design en piquets de vigne, pièce unique. Le comparable le plus proche.</td><td><span class="st new">Rédigé</span></td></tr>
<tr><td>Indirect</td><td><b>Les Princes Sarments</b> (Provence)</td><td>Même matière, broyée en composite de luxe (B2B). Référence de storytelling.</td><td><span class="st new">Rédigé</span></td></tr>
<tr><td>Indirect</td><td><b>Vitis Valorem</b></td><td>Filière nationale de collecte, matière Sarmine®. Prouve que la collecte à grande échelle est possible.</td><td><span class="st new">Rédigé</span></td></tr>
<tr><td>Substitut premium</td><td>Luminaires en fibres naturelles d'éditeur (ex. Market Set)</td><td>Donne le niveau de prix et de finition attendu par Camille.</td><td><span class="st write">À chercher</span></td></tr>
<tr><td>Substitut grand public</td><td>« Naturel » de grande distribution (ex. Maisons du Monde, IKEA)</td><td>Votre photo p. 9 : le naturel standardisé, votre contre-modèle.</td><td><span class="st write">À chercher</span></td></tr>
<tr><td>Substitut artisanal</td><td>Lampes en bois flotté ou bois brut (Etsy, marchés de créateurs)</td><td>Même promesse (pièce unique, bois brut), même cliente, mais sans origine tracée.</td><td><span class="st write">À chercher</span></td></tr>
</tbody>
</table></div>
<p class="hint">Les trois dernières lignes sont des pistes, pas des fiches : vérifiez chaque acteur (site, prix, canaux) avant de l'intégrer. Autre piste sur la cible œnophile : les objets en bois de barrique vendus en boutique de château.</p>
""")

CROIX = """
<figure class="croix">
<svg viewBox="0 0 560 430" role="img" aria-label="Croix de positionnement : Atelier Sarment seul en haut à droite (artisanal, lien fort à la vigne)">
  <rect class="free" x="280" y="40" width="220" height="180"/>
  <line class="ax" x1="50" y1="220" x2="510" y2="220"/>
  <line class="ax" x1="280" y1="30" x2="280" y2="405"/>
  <text class="axl" x="60" y="208">← Lien faible à la vigne</text>
  <text class="axl" x="500" y="208" text-anchor="end">Sarment tracé jusqu’au domaine →</text>
  <text class="axl" x="290" y="36">Artisanal · pièce unique</text>
  <text class="axl" x="290" y="418">Industriel · série</text>
  <circle class="pt" cx="104" cy="364" r="6"/><text class="ptl" x="114" y="368">Grande distribution</text>
  <circle class="pt" cx="115" cy="229" r="6"/><text class="ptl" x="125" y="252">Fibres naturelles premium</text>
  <circle class="pt" cx="159" cy="85" r="6"/><text class="ptl" x="169" y="89">Artisans bois flotté</text>
  <circle class="pt" cx="379" cy="364" r="6"/><text class="ptl" x="389" y="368">Vitis Valorem</text>
  <circle class="pt" cx="390" cy="238" r="6"/><text class="ptl" x="400" y="258">Les Princes Sarments</text>
  <circle class="pt" cx="324" cy="103" r="6"/><text class="ptl" x="334" y="124">Niko &amp; Co</text>
  <circle class="me" cx="467" cy="76" r="9"/><text class="mel" x="452" y="80" text-anchor="end">Atelier Sarment</text>
</svg>
<figcaption>Proposition d’axes et de placements, à ajuster avec vos fiches. Le quart teinté est l’espace libre.</figcaption>
</figure>
"""

PROCESS = t("""
<ol class="steps">
<li><b>Récolter</b>Sarments souples et épais, en hiver, juste après la taille.</li>
<li><b>Nettoyer & traiter</b>Brossage, trempage ou autoclave anti-insectes, ponçage léger des nœuds.</li>
<li><b>Cintrer & sécher</b>Cintrage sur gabarit quand le bois est vert, puis séchage.</li>
<li><b>Assembler</b>À compléter : douille, passage du câble, socle, abat-jour.</li>
<li><b>Tracer</b>Étiquette : domaine, cépage, saison de taille.</li>
</ol>
""")

FOURP = t("""
<dl class="fourp">
<div><dt>Produit</dt><dd>Lampe à poser, pied en sarment entier cintré, abat-jour en lin ou papier. Pièces numérotées avec étiquette de traçabilité. Gamme de lancement courte : 2 ou 3 modèles.</dd></div>
<div><dt>Prix</dt><dd>120 à 250 € (Camille se méfie sous 80 €, hésite au-delà de 250 €). Pièce signature au-delà de 300 €. B2B sur devis.</dd></div>
<div><dt>Distribution</dt><dd>Boutique en ligne, concept-stores bordelais, boutiques des domaines partenaires, marchés de créateurs, salons.</dd></div>
<div><dt>Communication</dt><dd>Instagram (du rang de vigne à la lampe), QR code de traçabilité, portes ouvertes pendant la taille, presse déco, co-branding avec les domaines.</dd></div>
</dl>
<p class="hint">Proposition cohérente avec vos notes (budget de Camille, objectif pied de lampe). À valider en groupe.</p>
""")

MISSION = t("""
<div class="mission">
<p><span class="lbl">Mission (proposition)</span>Donner une seconde vie au sarment de vigne en le transformant, sans le broyer ni le brûler, en luminaires artisanaux qui racontent le domaine d'où ils viennent.</p>
<p><span class="lbl">Vision (proposition)</span>Faire du sarment une matière reconnue du design d'intérieur.</p>
<p><span class="lbl">Valeurs (vos notes)</span>Authenticité de la matière · Traçabilité · Ancrage territorial · Équité envers les vignerons</p>
</div>
""")

# ---------------------------------------------------------------- cartes, dans l'ordre Save the Cat
H_AN = "▶ ANALYSE STRATÉGIQUE"
CARDS = []

CARDS.append(("beat", ("0", "Hors trame", "Couverture & sommaire", "")))
CARDS.append(dict(
    id="couv", kind="new", ref="Nouvelle", title="Couverture du dossier",
    chips=[("write", "À produire")],
    todo=["Le nom de la marque (naming à venir) et un visuel fort : votre lampe, ou un sarment dans la lumière.",
          "Sous-titre : « Matière première, seconde vie : création d'une marque produit ».",
          "Vos noms, l'école, l'année."],
    wf=[("im", 1, 12, 1, 8, "Photo pleine page : sarment dans la lumière"), ("ti", 1, 7, 6, 2, "Nom de marque", "ov"),
        ("lb", 1, 6, 8, 1, "Matière première, seconde vie", "ov")], head="", folio=""))
CARDS.append(dict(
    id="p02", ref="p. 02", title="Sommaire", imgs=[("p02.jpg", "Actuel")], dens="empty",
    chips=[("fix", "À refaire en fin de projet")],
    works=["Grande typo lisible, c'est une bonne base."],
    todo=["Il liste 4 parties alors que le dossier en comptera une dizaine. Le refaire à la fin, avec les numéros de pages.",
          "Regrouper les 15 temps du Save the Cat en 9 chapitres (proposition ci-dessous) : le lecteur voit tout le récit d'un coup d'œil.",
          "Ajouter le titre « Sommaire » et occuper la moitié haute : une photo, ou un sommaire sur deux colonnes."],
    extra=SOMMAIRE,
    fixes=[("1.Analyse contextuelle", "1. Analyse contextuelle (espace après le point)"),
           ("4. Marché de vente   (p. 9 : « Marché de ventes »)", "Un seul intitulé partout : « Marché de vente », ou plus précis : « Le marché du luminaire »")],
    wf=[("ti", 1, 5, 1, 2, "Sommaire"), ("li", 1, 3, 3, 6, "01 → 05 + pages"), ("li", 4, 3, 3, 6, "06 → 09 + pages"),
        ("im", 8, 5, 1, 8, "Photo matière")], head="", folio="02"))

CARDS.append(("beat", ("1", "Opening Image", "Brief / introduction", "1 page", "Manquant. Votre couverture « Analyse stratégique » ouvre une partie, elle ne présente pas le projet.")))
CARDS.append(dict(
    id="brief", kind="new", ref="Nouvelle", title="Brief",
    chips=[("write", "À rédiger (court)"), ("img", "Page image")],
    src="L'en-tête de votre p. 1 et vos notes (objectifs).",
    todo=["<b>La demande</b> : créer une marque produit à partir d'une matière première en seconde vie.",
          "<b>Le projet</b> : Atelier Sarment (nom provisoire), des luminaires artisanaux en sarment de vigne entier, tracé jusqu'au domaine, en Nouvelle-Aquitaine.",
          "<b>Les attentes</b> : plateforme de marque, identité visuelle (logo, charte), déclinaisons (étiquette de traçabilité, packaging, réseaux sociaux, site).",
          "Une photo pleine page d'une vigne taillée en hiver, le texte en surimpression."],
    wf=[("im", 1, 12, 1, 8, "Photo pleine page : vigne taillée en hiver"), ("lb", 1, 3, 1, 1, "Brief", "ov"),
        ("tx", 1, 5, 4, 5, "Demande · Projet · Attentes", "ov")], head="", folio="03"))

CARDS.append(("beat", ("2", "Theme Stated", "Problématique", "1 page", "Manquante dans le PDF. Vous en avez 4 versions dans vos notes : analyse et recommandation dans la section Problématique.")))
CARDS.append(dict(
    id="prob", kind="new", ref="Nouvelle", title="Problématique",
    chips=[("new", "Contenu prêt")],
    src="Version 4 de vos notes, légèrement ajustée (voir section Problématique).",
    todo=["La problématique seule, en grand, sur la page. Rien d'autre.",
          "Sélection bleue sur les mots qui portent le projet : « irrégularités », « brûlé ou broyé », « luminaire ».",
          "En petit dessous : les 3 mots-clés qui annoncent vos 3 axes (matière, geste, lumière)."],
    wf=[("lb", 1, 3, 1, 1, "Problématique"), ("qu", 1, 10, 3, 4, "Comment le design peut-il transformer les irrégularités…"),
        ("tx", 1, 5, 7, 2, "Matière · Geste · Lumière")], head="", folio="04"))

CARDS.append(("beat", ("3", "Set-Up", "État des lieux / étude de marché", "4 à 5 pages",
              "Vous êtes au-dessus de la cible : 9 pages. C'est acceptable, car c'est le socle du dossier, mais n'ajoutez rien de plus ici. La page « Usages actuels » remplace du texte déplacé vers le Catalyst.")))
CARDS.append(dict(
    id="p01", ref="p. 01", title="Intercalaire « Analyse stratégique »", imgs=[("p01.jpg", "Actuel")], dens="ok",
    chips=[("fix", "À repositionner")],
    works=["Typographie forte et motif de sélection bleue : une vraie signature, réutilisable partout.",
           "L'en-tête « ▶ Matière première, seconde vie… » est élégant : c'est le modèle de l'en-tête courant pour toutes les pages."],
    todo=["C'est un <b>intercalaire de partie</b>, pas la couverture du dossier. Le placer après le brief et la problématique.",
          "Ajouter une image sur la moitié droite (photo pleine hauteur de sarments) : l'intercalaire devient une page de respiration.",
          "Afficher le numéro de partie (« 02 ») et, en petit, son contenu : Contexte · Secteur · PESTELÉ · Marché."],
    wf=[("im", 8, 5, 1, 8, "Photo pleine hauteur : sarments"), ("lb", 1, 2, 4, 1, "02"), ("ti", 1, 7, 5, 3, "Analyse stratégique"),
        ("li", 1, 6, 8, 1, "Contexte · Secteur · PESTELÉ · Marché")], head="▶ MATIÈRE PREMIÈRE, SECONDE VIE", folio="05"))
CARDS.append(dict(
    id="p03", ref="p. 03", title="Analyse contextuelle", imgs=[("p03.jpg", "Actuel")], dens="full",
    chips=[("fix", "À alléger")],
    works=["Bon duo photo + camembert, et le gras sur les chiffres clés guide la lecture."],
    todo=["Déplacer le 2e paragraphe (Gironde, circulaire de 2011, 130 000 voitures) vers « Pourquoi maintenant ? » : c'est exactement votre déclencheur. La page respire.",
          "Sortir 3 chiffres clés en très grand : <b>2 t/ha/an</b>, <b>1,6 Mt de coproduits</b>, <b>93 % de sarments</b> (le camembert porte déjà le 93 %).",
          "Ajouter la source en pied de page (F.G.V.B.).",
          "Vérifier la portée de la circulaire du 18 novembre 2011 : elle vise les déchets verts, et le brûlage agricole relève souvent d'arrêtés préfectoraux avec dérogations (ce que vous dites vous-mêmes en Légal). Formulez les deux passages de façon cohérente, un jury peut relever l'écart."],
    fixes=[("l'épamprage · aujourd'hui  (droites)  /  l’échelle  (courbe)", "l'épamprage · aujourd'hui · l'échelle : apostrophes courbes partout"),
           ("co-produits (texte)  /  Coproduits (graphique)", "coproduits, partout")],
    keep="Une ressource massive (2 t/ha/an, 93 % des coproduits viticoles) encore traitée comme un déchet.",
    wf=[("ti", 1, 7, 1, 2, "Analyse contextuelle"), ("tx", 1, 6, 3, 3, "§ 1 : la ressource"), ("nu", 1, 6, 6, 2, "2 t · 1,6 Mt · 93 %"),
        ("rt", 1, 6, 8, 1, "À retenir"), ("im", 8, 5, 2, 4, "Photo : tas de sarments"), ("gr", 8, 5, 6, 3, "Camembert 93 %")], folio="06"))
CARDS.append(dict(
    id="p04", ref="p. 04", title="La ressource", imgs=[("p04.jpg", "Actuel")], dens="unbal",
    chips=[("fix", "À compléter")],
    works=["La photo pleine hauteur, avec les brins qui débordent du cadre : très bonne idée, à garder comme signature."],
    todo=["La photo montre des brins broyés, c'est-à-dire l'usage actuel que vous voulez dépasser. Légendez-la (« Sarment broyé : l'usage d'aujourd'hui ») ou remplacez-la par des sarments entiers.",
          "Ajouter un intertitre : « Une ressource disponible, gratuite et en quête de débouchés ».",
          "Remplir le quart vide en bas à droite avec une frise de saisonnalité (exemple ci-dessous)."],
    extra=FRISE,
    fixes=[("l'apport en déchèterie · l'approvisionnement", "l'apport en déchèterie · l'approvisionnement (apostrophes courbes)")],
    keep="Abondante, récurrente et gratuite : la matière est là, et les vignerons cherchent à s'en défaire proprement.",
    wf=[("im", 1, 5, 1, 8, "Photo pleine hauteur (débord)"), ("st", 7, 6, 1, 1, "Intertitre"), ("tx", 7, 6, 2, 3, "2 paragraphes"),
        ("gr", 7, 6, 5, 2, "Frise : nov. → mars · séchage"), ("rt", 7, 6, 8, 1, "À retenir")], folio="07"))
CARDS.append(dict(
    id="usages", kind="new", ref="Nouvelle", title="Usages actuels du sarment (segmentation)",
    chips=[("new", "Contenu prêt"), ("where", "Après la p. 4")],
    src="Vos notes, « Usages actuels (les segments) ». Votre tableau demande une segmentation dans le Set-up : elle manque dans le PDF.",
    todo=["4 colonnes, une par usage, chacune avec une photo et une jauge (majoritaire → niche).",
          "Garder la nuance de vos notes sur le retour au sol : certains experts jugent ces 2 t/ha un minimum pour la vie du sol. Précisez que le projet ne prélève qu'une petite part des sarments. Un jury vous posera la question."],
    extra=USAGES,
    keep="Aucun usage actuel ne conserve le sarment dans sa forme d'origine : il est broyé, brûlé ou composté.",
    wf=[("ti", 1, 6, 1, 2, "Usages actuels"), ("im", 1, 3, 3, 3, "Retour au sol"), ("im", 4, 3, 3, 3, "Brûlage"),
        ("im", 7, 3, 3, 3, "Énergie & compost"), ("im", 10, 3, 3, 3, "Matériaux"), ("tx", 1, 3, 6, 2, "Légende + jauge"),
        ("tx", 4, 3, 6, 2, "Légende + jauge"), ("tx", 7, 3, 6, 2, "Légende + jauge"), ("tx", 10, 3, 6, 2, "Légende + jauge"),
        ("rt", 1, 8, 8, 1, "À retenir")], folio="08"))
CARDS.append(dict(
    id="p05", ref="p. 05", title="Analyse du secteur", imgs=[("p05.jpg", "Actuel")], dens="text",
    chips=[("fix", "À illustrer")],
    works=["Le texte est clair et il contient la meilleure phrase de l'analyse : « Un secteur sous pression réglementaire, pas sous tension économique. »"],
    todo=["Aucune image ni visuel, et un grand vide entre le titre et le texte : le titre flotte.",
          "Faire de cette phrase une citation en grand, à droite du titre.",
          "Ajouter un petit schéma : une balance « ressource massive / valorisation faible »."],
    fixes=[("Une ressource massive et récurrente, mais sous-exploitée. Mais l'écrasante majorité de cette biomasse…",
            "…une ressource massive et récurrente, mais sous-exploitée : l'écrasante majorité de cette biomasse… (deux « mais » d'affilée)"),
           ("…un peu de compostage, et historiquement beaucoup de brûlage.", "…un peu de compostage et, historiquement, beaucoup de brûlage.")],
    keep="Pas de marché organisé : le sarment est géré comme un déchet en quête de débouchés.",
    wf=[("ti", 1, 6, 1, 2, "Analyse du secteur"), ("qu", 7, 6, 1, 3, "« Un secteur sous pression réglementaire… »"),
        ("gr", 1, 5, 3, 2, "Balance : massive / peu valorisée"), ("tx", 1, 6, 5, 3, "§ 1"), ("tx", 7, 6, 4, 4, "§ 2"),
        ("rt", 1, 6, 8, 1, "À retenir")], folio="09"))
CARDS.append(dict(
    id="p06", ref="p. 06", title="Le secteur, à petite et à grande échelle", imgs=[("p06.jpg", "Actuel")], dens="unbal",
    chips=[("fix", "À compléter")],
    works=["Photo forte (fagots liés) et débord du cadre, cohérent avec la p. 4."],
    todo=["Le bas gauche est vide. Y placer un comparatif en deux colonnes, tiré de votre 2e paragraphe :",
          "<b>Petite échelle ✓</b> peu de concurrence, matière accessible, pas de barrière financière. <b>Grande échelle ✗</b> pas de logistique de collecte, matière hétérogène, faible valeur au kilo."],
    fixes=[('Les voies de valorisation "nobles"', "Les voies de valorisation « nobles »"),
           ("…ne sont pas structurées à grande échelle, chaque tentative de valorisation reste…",
            "…ne sont pas structurées à grande échelle : chaque tentative de valorisation reste…")],
    keep="Facile d'entrer à petite échelle, difficile d'industrialiser : le modèle artisanal est le bon point de départ.",
    wf=[("tx", 1, 6, 1, 4, "Voies « nobles » + échelle"), ("gr", 1, 3, 5, 3, "Petite échelle ✓"), ("gr", 4, 3, 5, 3, "Grande échelle ✗"),
        ("rt", 1, 6, 8, 1, "À retenir"), ("im", 8, 5, 1, 8, "Photo : fagots (débord)")], folio="10"))
CARDS.append(dict(
    id="p07", ref="p. 07", title="PESTELÉ 1/2", imgs=[("p07.jpg", "Actuel")], dens="full",
    chips=[("fix", "À restructurer")],
    works=["Contenu solide et précis. L'ajout de l'Éthique est rare et apprécié."],
    todo=["Un seul nom partout : « PESTELE » ici, « PESTEL » au sommaire, « PESTELÉ » dans vos notes.",
          "Titre centré alors que les autres sont à gauche : l'aligner à gauche.",
          "Chaque facteur est un bloc de 3 idées sans puces. Passer en 3 puces avec un mot-clé en gras et une étiquette Atout / Frein / Vigilance : la lecture devient immédiate.",
          "Répartir le PESTELÉ sur 2 pages équilibrées : P · É · S · T puis É · L · É. Aujourd'hui il est sur 3 pages (3 + 2 + 2 blocs), dont une isolée après le SWOT."],
    extra=PESTEL_EX,
    fixes=[("Absence de politique agricole nationale dédiée spécifiquement au sarment traité comme sous-produit générique de la filière viti-vinicole",
            "Aucune politique agricole nationale n'est dédiée au sarment : il est traité comme un sous-produit générique de la filière vitivinicole"),
           ("…qui fragilise financièrement une partie des domaines argument supplémentaire pour eux…",
            "…qui fragilise financièrement une partie des domaines : un argument supplémentaire pour eux…"),
           ("Sociologique", "Socioculturel (terme habituel du PESTEL, facultatif)")],
    wf=[("ti", 1, 5, 1, 1, "PESTELÉ 1/2"), ("li", 1, 3, 2, 6, "Politique"), ("li", 4, 3, 2, 6, "Économique"),
        ("li", 7, 3, 2, 6, "Socioculturel"), ("li", 10, 3, 2, 6, "Technologique"), ("lb", 1, 8, 8, 1, "Légende : Atout · Frein · Vigilance")], folio="11"))
CARDS.append(dict(
    id="p08", ref="p. 08 + p. 11", title="PESTELÉ 2/2 (fusion des p. 8 et 11)", imgs=[("p08.jpg", "Actuel p. 8"), ("p11.jpg", "Actuel p. 11")], dens="empty",
    chips=[("fix", "À fusionner"), ("alert", "Texte coupé p. 11")],
    todo=["La p. 11 (Légal, Éthique) est rangée après le Marché et le SWOT : la ramener ici. Les deux pages sont à moitié vides, fusionnées elles tiennent sur une.",
          "<b>Le texte Éthique est coupé</b> : « …si elle ne peut pas être réellement garantie à » (il manque la fin).",
          "Terminer par le « À retenir » de tout le PESTELÉ.",
          "L'Éthique est un point fort de votre dossier : vous y répondrez dans la plateforme de marque (valeur « équité envers les vignerons »)."],
    fixes=[("…si elle ne peut pas être réellement garantie à", "…si elle ne peut pas être réellement garantie à l'échelle du projet."),
           ("Peu d'innovation technologique intermédiaire le secteur manque d'outils…", "Peu d'innovation technologique intermédiaire : le secteur manque d'outils…"),
           ("(arrêtés préfectoraux, RIPFCI en Gironde/Landes) cadre légal fragmenté",
            "(arrêtés préfectoraux, RIPFCI en Gironde et dans les Landes) : un cadre légal fragmenté. Écrire RIPFCI en toutes lettres une fois (règlement interdépartemental de protection de la forêt contre l'incendie, à vérifier)."),
           ("…en mobilier ou objet design vide juridique à la fois…", "…en mobilier ou en objet design : un vide juridique à la fois…"),
           ("(évitement d'émissions vs brûlage)", "(émissions évitées par rapport au brûlage)")],
    keep="Un contexte porteur (réglementation, envie de sens, image de la vigne), à condition de rester honnête : pas de greenwashing, équité avec les vignerons, traçabilité réelle.",
    wf=[("ti", 1, 5, 1, 1, "PESTELÉ 2/2"), ("li", 1, 3, 2, 5, "Écologique"), ("li", 4, 3, 2, 5, "Légal"), ("li", 7, 3, 2, 5, "Éthique"),
        ("im", 10, 3, 2, 5, "Photo"), ("rt", 1, 9, 7, 2, "À retenir du PESTELÉ")], folio="12"))
CARDS.append(dict(
    id="p09", ref="p. 09", title="Marché de vente", imgs=[("p09.jpg", "Actuel")], dens="ok",
    chips=[("fix", "À clarifier")],
    works=["Bonne mise en page texte + photo, chiffres sourcés."],
    todo=["Le dernier paragraphe répète les chiffres du précédent : en faire le « À retenir ».",
          "Mettre les chiffres en visuel : deux flèches, « Grand public France −1,7 % » et « Haut de gamme monde +7,7 %/an ».",
          "Légender la photo : c'est un rayon de grande distribution en fibres « naturelles » industrielles, votre contre-modèle. Dites-le : « Le naturel standardisé ».",
          "Les chiffres mélangent 2021, 2022, 2023 et 2024, et la France et le monde : indiquer année et périmètre à chaque chiffre."],
    fixes=[("Marché de ventes", "Marché de vente (comme au sommaire)"),
           ("Taille : lampes et luminaires pèsent 4,165 Md€ en France en 2022 vs 2023 : 4,094 Md€, soit environ −1,7 %. (Derniers chiffres du Syndicat du luminaire).",
            "Taille : les lampes et luminaires pesaient 4,165 Md€ en France en 2022, contre 4,094 Md€ en 2023, soit environ −1,7 % (derniers chiffres du Syndicat du luminaire)."),
           ("20,26 Md USD", "20,26 Md$"),
           ("stagne/recule (−1,7 % en France) .", "stagne, voire recule (−1,7 % en France).")],
    keep="Le haut de gamme progresse (+7,7 %/an) pendant que le grand public recule (−1,7 %) : la place est du côté du luminaire durable et premium.",
    wf=[("ti", 1, 6, 1, 2, "Marché de vente"), ("nu", 1, 6, 3, 2, "4,1 Md€ · 790 M€ · 20,26 Md$"), ("gr", 1, 6, 5, 2, "−1,7 % ↘  vs  ↗ +7,7 %/an"),
        ("lb", 1, 6, 7, 1, "Sources et années"), ("rt", 1, 6, 8, 1, "À retenir"), ("im", 8, 5, 2, 6, "Photo + légende « contre-modèle »")], folio="13"))

CARDS.append(("beat", ("4", "Catalyst", "Pourquoi maintenant ?", "2 pages", "Manquant dans le PDF. Le texte des deux pages est rédigé ci-dessous, prêt à coller : il reprend le 2e paragraphe de la p. 3 et vos notes sur les matériaux du luminaire.")))
CARDS.append(dict(
    id="cat1", kind="new", ref="Nouvelle", title="Le brûlage n'est plus une option",
    chips=[("new", "Contenu prêt")],
    src="2e paragraphe de la p. 3 (déplacé), complété par les alternatives de la p. 4.",
    todo=["Un chiffre choc en très grand : <b>130 000 voitures par jour</b> (4 300 à 5 500 t de bois de vigne brûlées en trois mois).",
          "Le cadre : circulaire du 18 novembre 2011, zones forestières de Gironde, pression citoyenne.",
          "Nommer l'association qui a fait le calcul (source en pied de page).",
          "Une photo de fumée de brûlage dans les vignes."],
    keep="Brûler n'est plus possible, broyer ne rapporte rien : les vignerons ont besoin d'un débouché.",
    wf=[("ti", 1, 6, 1, 2, "Pourquoi maintenant ?"), ("nu", 1, 6, 3, 2, "130 000 voitures / jour"), ("tx", 1, 6, 5, 2, "Réglementation + pression citoyenne"),
        ("rt", 1, 6, 8, 1, "À retenir"), ("im", 8, 5, 1, 8, "Photo : fumée de brûlage")], head="▶ POURQUOI MAINTENANT", folio="14"))
CARDS.append(dict(
    id="cat2", kind="new", ref="Nouvelle", title="Le luminaire cherche d'autres matières",
    chips=[("new", "Contenu prêt")],
    src="Vos notes : « Le problème des matériaux du mobilier actuel » et « Les recycler, c'est ».",
    todo=["4 familles de matériaux, chacune avec une photo et une ligne : métal (l'aluminium neuf est très énergivore), plastiques (fossiles, peu recyclés), verre et céramique (cuisson à haute température), bois, rotin, osier, papier, tissu (surtout pour les abat-jour).",
          "Puis « Recycler le sarment, c'est » en 5 pictogrammes : du temps gagné pour les vignerons, un engagement pour l'environnement, moins de CO₂, pas de fumée toxique, moins de risques d'incendie."],
    keep="La contrainte crée le besoin (le brûlage recule), la tendance crée la demande (matériaux durables) : c'est le bon moment.",
    wf=[("ti", 1, 11, 1, 1, "Le luminaire aujourd'hui"), ("im", 1, 3, 2, 3, "Métal"), ("im", 4, 3, 2, 3, "Plastique"), ("im", 7, 3, 2, 3, "Verre, céramique"),
        ("im", 10, 3, 2, 3, "Fibres"), ("gr", 1, 12, 5, 2, "Recycler le sarment : 5 pictos"), ("rt", 1, 8, 8, 1, "À retenir")], head="▶ POURQUOI MAINTENANT", folio="15"))

CARDS.append(("beat", ("5", "Debate", "Analyse de la concurrence", "8 à 10 pages", "Entièrement manquante dans le PDF. 3 concurrents sont rédigés dans vos notes, il en faut 6, plus la synthèse des outils de communication.")))
CARDS.append(dict(
    id="conc", kind="new", ref="Nouvelles", title="Typologie + 6 fiches concurrents",
    chips=[("new", "3 prêtes"), ("write", "3 à chercher")],
    src="Vos notes : Niko & Co, Les Princes Sarments, Vitis Valorem (positionnement, force, faiblesse déjà rédigés).",
    todo=["1 page d'intro : trois familles, directs (même matière, même usage), indirects (même matière, autre usage), substituts (autre matière, même besoin, même cible).",
          "1 page par concurrent, toujours le même gabarit : logo et 3 photos produits ; positionnement, cible, prix, canaux ; force et faiblesse ; identité visuelle (palette, typo, ton) ; « Ce qu'on en retient » en À retenir."],
    extra=CONCURRENTS,
    fixes=[("Positionnement :Luxe", "Positionnement : luxe"), ("…la logistique de collecte à grande échelle est possible..", "…est possible."),
           ("(Niko & Co) … d'autres bois de la vigne", "d'autres bois du vignoble : leurs piquets sont en acacia, pin ou châtaignier, ce n'est pas du bois de vigne")],
    wf=[("ti", 1, 6, 1, 1, "Nom + logo"), ("im", 1, 6, 2, 5, "3 photos produits"), ("li", 7, 6, 1, 3, "Positionnement · cible · prix · canaux"),
        ("li", 7, 3, 4, 2, "Force"), ("li", 10, 3, 4, 2, "Faiblesse"), ("gr", 1, 6, 7, 2, "Identité : palette · typo · ton"),
        ("rt", 7, 6, 7, 2, "Ce qu'on en retient")], head="▶ CONCURRENCE", folio="17"))
CARDS.append(dict(
    id="com", kind="new", ref="Nouvelles", title="Outils de communication + croix de positionnement",
    chips=[("write", "À produire")],
    todo=["Un tableau comparatif : 6 acteurs × 8 critères (site ou e-shop, Instagram, ton, palette, typographie, packaging, traçabilité affichée, prix).",
          "Une page tendances : ce que tous font, ce que personne ne fait.",
          "La croix de positionnement : votre tableau la place dans le Set-up, mais elle ne se lit qu'une fois les concurrents présentés. Mettez-la ici, en fin de concurrence."],
    extra=CROIX,
    keep="Seul acteur à relier un sarment conservé entier à son domaine d'origine, en production artisanale.",
    wf=[("gr", 1, 7, 1, 8, "Croix de positionnement"), ("st", 9, 4, 1, 1, "Positionnement"), ("tx", 9, 4, 2, 4, "Lecture des axes"),
        ("rt", 9, 4, 7, 2, "À retenir")], head="▶ CONCURRENCE", folio="24"))
CARDS.append(dict(
    id="synth", kind="new", ref="Nouvelle", title="Synthèse de l'analyse",
    chips=[("new", "Contenu prêt")],
    src="Vos notes, « Synthèse de l'analyse ». Elle clôt la partie analyse avant le concept.",
    todo=["Les trois paragraphes de vos notes, et une photo de respiration.",
          "Remplacer « mobilier » par « luminaire », comme partout."],
    fixes=[("…avec traçabilité du domaine d'origine en Nouvelle-Aquitaine c'est l'espace de différenciation…",
            "…avec traçabilité du domaine d'origine en Nouvelle-Aquitaine : c'est l'espace de différenciation…")],
    keep="Aucun acteur n'occupe le luminaire en sarment brut, tracé jusqu'au domaine, en Nouvelle-Aquitaine.",
    wf=[("ti", 1, 6, 1, 2, "Synthèse"), ("tx", 1, 6, 3, 5, "3 paragraphes (notes)"), ("rt", 1, 6, 8, 1, "À retenir"),
        ("im", 8, 5, 1, 8, "Photo de respiration")], head="▶ CONCURRENCE", folio="26"))

CARDS.append(("beat", ("6", "Break into Two", "Concept / angle stratégique", "2 pages", "Manquant. C'est pourtant votre idée la plus forte, et elle est déjà écrite : « On ne dénature pas le sarment ».")))
CARDS.append(dict(
    id="concept", kind="new", ref="Nouvelle", title="Le sarment reste sarment",
    chips=[("new", "Contenu prêt"), ("img", "Page image")],
    src="Vos notes, « Pourquoi on est différent ? » (corrigé dans la section Textes corrigés).",
    todo=["Un diptyque photo : à gauche le sarment broyé (ce que font les autres), à droite le sarment entier et cintré (ce que vous faites).",
          "Une phrase en surimpression, et votre paragraphe en petit."],
    keep="Là où les autres broient le sarment, nous le gardons entier.",
    wf=[("im", 1, 6, 1, 8, "Sarment broyé (brisures)"), ("im", 7, 6, 1, 8, "Sarment entier, cintré"),
        ("qu", 2, 10, 6, 2, "Le sarment reste sarment", "ov")], head="▶ CONCEPT", folio="27"))
CARDS.append(dict(
    id="process", kind="new", ref="Nouvelle", title="De la vigne à la lampe (process)",
    chips=[("new", "Contenu prêt")],
    src="Vos notes : les étapes de fabrication, le partenariat vannier ou sculpteur, et Niko & Co comme preuve que c'est faisable.",
    todo=["5 étapes photographiées (idéalement vos propres photos), une ligne chacune.",
          "L'étape « Choisir la typologie d'objet » est une décision de design, pas une étape de fabrication : puisque vous avez choisi le pied de lampe, remplacez-la par « Façonner le pied ».",
          "L'étape « Assembler la structure » est vide dans vos notes : à compléter.",
          "Un encadré « Partenaire » : le vannier ou sculpteur qui crédibilise la production."],
    extra=PROCESS,
    fixes=[("Un léger ponçage des nœuds éviter les échardes", "Un léger ponçage des nœuds évite les échardes"),
           ("séchage à l'air libre 3-6 mois suffit  /  ailleurs : 6 mois de séchage minimum", "Un seul chiffre partout (3 à 6 mois, ou 6 mois minimum)")],
    keep="Un procédé simple et sans broyage : récolter, nettoyer, cintrer, sécher, assembler.",
    wf=[("ti", 1, 10, 1, 1, "De la vigne à la lampe"), ("im", 1, 2, 2, 3, "1"), ("im", 3, 2, 2, 3, "2"), ("im", 5, 2, 2, 3, "3"),
        ("im", 7, 2, 2, 3, "4"), ("im", 9, 2, 2, 3, "5"), ("tx", 1, 10, 5, 2, "Une ligne par étape"),
        ("gr", 11, 2, 2, 5, "Partenaire vannier"), ("rt", 1, 8, 8, 1, "À retenir")], head="▶ CONCEPT", folio="28"))

CARDS.append(("beat", ("7", "B Story", "Plateforme de marque", "4 à 5 pages", "Manquante, sauf le SWOT (p. 10) qui doit venir ici. Positionnement, valeurs, objectifs, cibles et deux personas sont dans vos notes.")))
CARDS.append(dict(
    id="mission", kind="new", ref="Nouvelle", title="Mission, vision, valeurs",
    chips=[("new", "Valeurs prêtes"), ("write", "Mission à valider")],
    src="Vos notes : valeurs et objectifs. La mission et la vision sont des propositions.",
    extra=MISSION,
    todo=["Les 4 valeurs en 4 blocs égaux, une phrase chacune (déjà rédigée dans vos notes).",
          "Objectifs : court terme, le pied de lampe ; long terme, le petit mobilier et les accessoires."],
    keep="Une seule matière, un seul objet pour commencer : le pied de lampe en sarment.",
    wf=[("ti", 1, 9, 1, 1, "Mission & valeurs"), ("qu", 1, 12, 2, 2, "Mission (une phrase)"), ("li", 1, 3, 4, 3, "Authenticité"),
        ("li", 4, 3, 4, 3, "Traçabilité"), ("li", 7, 3, 4, 3, "Ancrage"), ("li", 10, 3, 4, 3, "Équité"), ("rt", 1, 8, 8, 1, "À retenir")],
    head="▶ PLATEFORME DE MARQUE", folio="29"))
CARDS.append(dict(
    id="posi", kind="new", ref="Nouvelles", title="Positionnement, cibles, personas",
    chips=[("new", "Contenu prêt, à harmoniser")],
    src="Vos notes. Tout est détaillé plus bas : sections Cible et Personas.",
    todo=["1 page positionnement + cibles (schéma en cercles).",
          "1 page personas B2C (Camille, Laurent), 1 page persona B2B (Sophie).",
          "Vos notes donnent trois tranches d'âge différentes pour la cible (30-55, 25-45, 25-45) : à harmoniser."],
    keep="Cœur de cible : les 25-45 ans qui achètent une histoire plus qu'une lampe.",
    wf=[("im", 1, 4, 1, 8, "Portrait"), ("ti", 5, 8, 1, 1, "Nom, âge, métier"), ("qu", 5, 8, 2, 2, "Citation"),
        ("li", 5, 4, 4, 3, "Motivations · freins"), ("li", 9, 4, 4, 3, "Canaux · budget · parcours"),
        ("rt", 5, 8, 7, 2, "Ce qu'Atelier Sarment lui apporte")], head="▶ PLATEFORME DE MARQUE", folio="31"))
CARDS.append(dict(
    id="p10", ref="p. 10", title="SWOT", imgs=[("p10.jpg", "Actuel")], dens="unbal",
    chips=[("fix", "À déplacer"), ("fix", "À réordonner")],
    todo=["Le déplacer dans la plateforme de marque, comme prévu dans votre tableau : ce SWOT parle de votre projet, pas du secteur.",
          "Ordre des cases : la convention est Forces | Faiblesses en haut (interne), Opportunités | Menaces en bas (externe). Ici Opportunités et Faiblesses sont inversées, ce qui perturbe la lecture.",
          "Passer chaque case en 3 ou 4 puces courtes. La case Faiblesses ne fait que 2 lignes : la compléter pour équilibrer (propositions dans la section Textes corrigés).",
          "Couleur : Forces et Opportunités d'une teinte, Faiblesses et Menaces d'une autre."],
    fixes=[("Peu de concurrence directe sur le segment mobilier en sarment brut", "…sur le segment luminaire en sarment brut")],
    keep="Une matière gratuite et un récit fort ; les défis sont la technique et l'approvisionnement.",
    wf=[("ti", 1, 4, 1, 1, "SWOT"), ("li", 1, 6, 2, 3, "Forces"), ("li", 7, 6, 2, 3, "Faiblesses"), ("li", 1, 6, 5, 3, "Opportunités"),
        ("li", 7, 6, 5, 3, "Menaces"), ("rt", 1, 8, 8, 1, "À retenir")], head="▶ PLATEFORME DE MARQUE", folio="33"))
CARDS.append(dict(
    id="fourp", kind="new", ref="Nouvelle", title="Mix marketing (4P)",
    chips=[("write", "À rédiger")],
    src="Demandé par votre tableau, absent des notes.",
    extra=FOURP,
    keep="Une lampe unique à 120-250 €, vendue là où Camille et Sophie achètent déjà.",
    wf=[("ti", 1, 9, 1, 1, "Mix marketing (4P)"), ("li", 1, 3, 2, 6, "Produit"), ("li", 4, 3, 2, 6, "Prix"), ("li", 7, 3, 2, 6, "Distribution"),
        ("li", 10, 3, 2, 6, "Communication"), ("rt", 1, 8, 8, 1, "À retenir")], head="▶ PLATEFORME DE MARQUE", folio="34"))

CARDS.append(("beat", ("8 → 12", "Fun and Games → Dark Night", "Moodboards et axes", "5–6 + 3 + 3 + 2 + 1 pages", "Détail dans les sections Moodboards et Axes, plus bas.")))
CARDS.append(("beat", ("13 → 15", "Break into Three → Final Image", "Charte, déclinaisons, conclusion", "6–8 + 6–7 + 1 pages", "À venir. Pour la conclusion : reprenez la problématique mot pour mot et montrez comment l'identité y répond.")))
CARDS.append(("beat", ("+", "Annexe", "Sources", "1 page", "")))
CARDS.append(dict(
    id="sources", kind="new", ref="Nouvelle", title="Sources",
    chips=[("write", "À rédiger")],
    todo=["F.G.V.B. (Fédération des Grands Vins de Bordeaux), chiffres de la p. 3.",
          "Syndicat du luminaire (via Lightzoomlumière), chiffres de la p. 9 ; la source du marché haut de gamme mondial (20,26 Md$).",
          "Circulaire du 18 novembre 2011 ; ADEME, appel à projets Agr'air ; l'association à l'origine du calcul « 130 000 voitures ».",
          "Toutlevin.com (« La surprenante seconde vie de la vigne et du raisin ») ; sites de Vitis Valorem, Les Princes Sarments, Niko & Co.",
          "Format : auteur ou organisme, titre, date, lien. Et une ligne de source en pied de chaque page chiffrée."],
    wf=[("ti", 1, 4, 1, 1, "Sources"), ("li", 1, 6, 2, 6, "Chiffres & études"), ("li", 7, 6, 2, 6, "Sites & entreprises")], head="▶ ANNEXES", folio="60"))


PTEXT = {
    "brief": [
        ("Titre", "Brief"),
        ("La demande", "Créer une marque produit à partir d'une matière première en seconde vie."),
        ("Le projet", "Atelier Sarment (nom provisoire) transforme le sarment de vigne, coproduit brûlé ou broyé chaque hiver, en luminaires artisanaux. Le sarment est conservé entier et tracé jusqu'à son domaine d'origine, en Nouvelle-Aquitaine."),
        ("Les attentes", "Une plateforme de marque, une identité visuelle (logo, charte graphique) et ses déclinaisons : étiquette de traçabilité, packaging, réseaux sociaux, site."),
    ],
    "usages": [
        ("Titre", "Usages actuels du sarment"),
        ("Chapeau", "Avec environ deux tonnes par hectare et par an, la ressource est massive et récurrente. Elle part aujourd'hui dans quatre directions."),
        ("Retour au sol", "C'est l'usage majoritaire : le sarment est broyé et laissé dans les rangs. Certains experts jugent ces 2 tonnes restituées comme un minimum pour entretenir la vie du sol."),
        ("Brûlage", "Encore souvent pratiqué à l'air libre, il génère une fumée polluante. La réglementation se durcit dans les régions où il était traditionnel."),
        ("Énergie et compost", "Transformation en pellets, en biogaz ou en compost."),
        ("Matériaux", "Vitis Valorem en est le pionnier : l'entreprise collecte en moyenne 300 hectares de sarments et de ceps par an, de novembre à mars, pour fabriquer des tuteurs, des piquets et des agrafes. Elle prévoit de s'étendre à la cosmétique, à l'automobile et au bâtiment."),
        ("Source", "Toutlevin.com, « La surprenante seconde vie de la vigne et du raisin »."),
        ("À retenir", "Aucun usage actuel ne conserve le sarment dans sa forme d'origine : il est broyé, brûlé ou composté."),
    ],
    "cat1": [
        ("Sur-titre", "Pourquoi maintenant ?"),
        ("Titre", "Le brûlage n'est plus une option"),
        ("Chiffre clé", "130 000 voitures par jour"),
        ("Légende du chiffre", "C'est la pollution équivalente aux 4 300 à 5 500 tonnes de bois de vigne brûlées en trois mois en Gironde, selon une association environnementale."),
        ("Texte", [
            "En Gironde, premier vignoble de Nouvelle-Aquitaine, le brûlage à l'air libre des déchets verts viticoles est interdit ou fortement encadré dans les zones à dominante forestière. Le cadre réglementaire de référence est la circulaire du 18 novembre 2011, qui interdit le brûlage à l'air libre des déchets verts à l'échelle nationale.",
            "La pression s'est accentuée à la suite d'épisodes de brûlage de 4 300 à 5 500 tonnes de bois de vigne en trois mois, une pratique dénoncée par une association environnementale comme équivalente à la pollution de 130 000 voitures ou 24 000 camions par jour.",
            "Les alternatives recommandées (broyage, compostage, paillage, déchèterie) ne valorisent pas économiquement la matière. Les vignerons cherchent donc surtout à se débarrasser proprement de leurs sarments.",
        ]),
        ("Source", "Circulaire du 18 novembre 2011 ; [nom de l'association environnementale] ; F.G.V.B."),
        ("À retenir", "Brûler n'est plus possible, broyer ne rapporte rien : les vignerons ont besoin d'un débouché."),
    ],
    "cat2": [
        ("Sur-titre", "Pourquoi maintenant ?"),
        ("Titre", "Le luminaire cherche d'autres matières"),
        ("Chapeau", "Le luminaire d'aujourd'hui repose surtout sur des matériaux énergivores ou d'origine fossile."),
        ("Métal", "Acier, aluminium, laiton : très courants pour les pieds et les structures. L'aluminium neuf est particulièrement énergivore à produire."),
        ("Plastiques", "ABS, polycarbonate, polypropylène : dominants dans l'entrée de gamme, d'origine fossile et peu recyclés."),
        ("Verre et céramique", "Cuits à haute température, donc énergivores."),
        ("Fibres naturelles", "Bois, rotin, osier, papier, tissu : surtout pour les abat-jour et les modèles « naturels »."),
        ("Encadré", ["Recycler le sarment, c'est :", "du temps gagné pour les vignerons ;", "un engagement fort pour l'environnement ;", "moins de CO₂ ;", "pas de fumée toxique ;", "moins de risques d'incendie."]),
        ("Phrase de lien", "Et la demande suit : le luminaire haut de gamme progresse de plus de 7,7 % par an dans le monde, et les fabricants misent sur les matériaux durables pour se repositionner."),
        ("Source", "Vos notes ; chiffres du marché : voir p. 9 (Syndicat du luminaire, étude de marché haut de gamme)."),
        ("À retenir", "La contrainte crée le besoin (le brûlage recule), la tendance crée la demande (matériaux durables) : c'est le bon moment."),
    ],
    "synth": [
        ("Titre", "Synthèse de l'analyse"),
        ("Texte", [
            "La viticulture française génère plus de 2 tonnes de sarments par hectare et par an, une biomasse aujourd'hui très peu valorisée (broyage-épandage majoritaire, brûlage en recul sous la pression réglementaire). En Gironde, l'encadrement croissant du brûlage pousse les domaines à chercher activement des débouchés, ce qui rend la matière première accessible gratuitement ou à faible coût.",
            "Le secteur reste peu structuré : ce n'est pas un marché organisé avec acheteurs et vendeurs, mais une gestion de déchet agricole en quête de valorisation. Trois types d'acteurs comparables existent : Niko & Co (Charente), artisanal, sur piquets de vigne et plusieurs essences de bois ; Les Princes Sarments, matériau composite haut de gamme pour l'architecture de luxe ; Vitis Valorem, filière B2B nationale multisecteur. Aucun n'occupe le segment précis du luminaire en sarment brut avec traçabilité du domaine d'origine en Nouvelle-Aquitaine : c'est l'espace de différenciation identifié pour ce projet.",
            "L'analyse PESTELÉ confirme un contexte favorable : une dynamique réglementaire et institutionnelle favorable à l'économie circulaire, une sensibilité sociétale à l'upcycling et à la pollution du brûlage. Elle signale aussi des points de vigilance éthiques : risque de greenwashing, équité de valeur avec les vignerons fournisseurs, transparence sur la traçabilité annoncée.",
        ]),
        ("À retenir", "Aucun acteur n'occupe le luminaire en sarment brut, tracé jusqu'au domaine, en Nouvelle-Aquitaine."),
    ],
    "concept": [
        ("Titre", "Le sarment reste sarment"),
        ("Texte", "On ne dénature pas le sarment. Là où les autres entreprises le broient pour l'utiliser en brisures, nous le conservons dans sa structure naturelle, en y ajoutant des courbes organiques pour le sublimer. Nous mettons en valeur ce qui est habituellement broyé ou brûlé."),
        ("Légende photo gauche", "Ce que font les autres : le sarment broyé, réduit en brisures."),
        ("Légende photo droite", "Ce que nous faisons : le sarment entier, cintré, reconnaissable."),
        ("À retenir", "Là où les autres broient le sarment, nous le gardons entier."),
    ],
    "process": [
        ("Titre", "De la vigne à la lampe"),
        ("1. Récolter", "Choisir des sarments encore souples (récolte hivernale, juste après la taille) et épais, pour la structure."),
        ("2. Nettoyer et traiter", "Brosser pour enlever la terre et l'écorce abîmée. Faire tremper ou passer à l'autoclave (traitement anti-insectes) pour que le bois dure en intérieur. Un léger ponçage des nœuds évite les échardes sur les zones de préhension."),
        ("3. Cintrer et sécher", "Pour les formes courbes, cintrer les sarments encore verts autour d'un gabarit et laisser sécher plusieurs semaines : le bois garde la forme. Pour un usage droit, un séchage à l'air libre de 3 à 6 mois suffit."),
        ("4. Façonner le pied", "[À compléter : assemblage, fixation de la douille, passage du câble, socle, abat-jour.]"),
        ("5. Tracer", "Chaque pied reçoit une étiquette : domaine, cépage, saison de taille."),
        ("Encadré partenaire", "Un partenariat avec un vannier ou un sculpteur sur bois apporte la technique d'exécution et montre une vraie réflexion sur le mode de production."),
        ("Preuve de faisabilité", "Niko & Co, jeune entreprise charentaise, transforme déjà des piquets de vigne en mobilier design vendu aux particuliers et aux professionnels."),
        ("À retenir", "Un procédé simple et sans broyage : récolter, nettoyer, cintrer, sécher, assembler."),
    ],
}
PTEXT_NOTE = {
    "cat1": "Remplacez [nom de l'association] par la source exacte. Le 3e paragraphe reprend la p. 4 : supprimez-le de la p. 4 si vous le gardez ici.",
    "cat2": "« Recycler » est le mot de vos notes ; « valoriser » serait plus juste, puisque le sarment n'est pas transformé en nouvelle matière.",
    "synth": "Quand vos 6 fiches concurrents seront faites, remplacez « Trois types d'acteurs » par « Six acteurs » et ajoutez les trois nouveaux.",
    "process": "L'étape 5 est un ajout, cohérent avec votre valeur « traçabilité ». L'étape 4 reste à écrire.",
}
for _c in CARDS:
    if isinstance(_c, dict) and _c["id"] in PTEXT:
        _c["ptext"] = PTEXT[_c["id"]]
        if _c["id"] in PTEXT_NOTE:
            _c["ptext_note"] = PTEXT_NOTE[_c["id"]]


def render_cards():
    out = []
    for c in CARDS:
        if isinstance(c, tuple) and c[0] == "beat":
            args = c[1]
            out.append(beat_head(*args) if len(args) == 5 else beat_head(*args, ""))
        else:
            out.append(card(c))
    return "".join(out)


# ---------------------------------------------------------------- moodboards
MB = [
    dict(n=1, title="Géométrie vivante", axe="Axe 1", img="mb1.jpg",
         kw=["strates", "courbes de niveau", "cernes", "vrilles", "écorce"],
         pal=[("#224939", "vert forêt"), ("#643B24", "brun sarment"), ("#755E49", "écorce"), ("#BEB59C", "sauge"), ("#E2D4C7", "papier"), ("#E9A23B", "accent vrille")],
         works=["Très cohérent : lignes, strates et cernes partout, bon dosage entre photo et graphisme.",
                "« SAGE GLOW » ouvre une piste typo : une serif organique, aux formes végétales."],
         watch=["Les courbes de niveau sont un code très répandu (outdoor, marques « nature ») : il faut le rendre propre au sarment.",
                "L'image la plus spécifique est la vrille sur ciel bleu : c'est la seule qui ne peut venir que de la vigne. En faire la signature ?",
                "Ajouter une vue en coupe d'un vrai sarment (moelle, cernes), photographiée par vous."],
         keep="La vrille et les strates du sarment, plutôt que les courbes de niveau génériques."),
    dict(n=2, title="La main à l'œuvre", axe="Axe 2", img="mb2.jpg",
         kw=["geste", "outil", "empreinte", "assemblage", "kraft"],
         pal=[("#F1EAE3", "crème"), ("#C5A88A", "kraft"), ("#9A7D65", "bois clair"), ("#412F22", "noyer"), ("#595B49", "olive"), ("#111910", "encre")],
         works=["Belles textures (kraft, papier, bois matelassé) et empreintes de cernes façon tampon.",
                "Références typo fortes : « Angle Violin », « Die Jelk » (serif très contrastée, à ligatures). Un contraste intéressant entre artisanat et haut de gamme."],
         watch=["Mains, atelier, kraft : ces codes sont partagés par toutes les marques artisanales, la différenciation est faible.",
                "L'étagère en MDF (en bas à droite) est industrielle : elle contredit « la main ». À remplacer.",
                "Idée à tester : encrer de vraies sections de sarment comme des tampons pour créer vos propres textures."],
         keep="Garder l'empreinte (le tampon) plutôt que l'image de l'atelier."),
    dict(n=3, title="Ombre & Lumière", axe="Axe 3", img="mb3.jpg",
         kw=["projection", "révélation", "contraste", "chaleur", "motif"],
         pal=[("#010101", "noir"), ("#423931", "ombre"), ("#674F3B", "bois"), ("#A28669", "ambre"), ("#BAAD9B", "pierre"), ("#E0D7C6", "lumière")],
         works=["La piste la plus liée au produit : une lampe révèle le sarment par son ombre.",
                "Les ombres typographiques (« HONOR », « Even in the shadow we can see », « 光影造化 ») suggèrent une idée forte : un logo qui n'apparaît que dans l'ombre de la lampe ou d'une découpe du packaging."],
         watch=["La plupart des motifs sont géométriques (moucharabieh, polyèdres) alors que le sarment est organique. Ajouter des ombres de branches.",
                "Faites le test vous-mêmes : un sarment, une lampe torche, un mur blanc. Vos photos d'ombres vaudront mieux que ces références."],
         keep="La lumière révèle le sarment : la piste la plus proche de votre produit."),
]


def render_mb():
    out = []
    for m in MB:
        sw = "".join(
            f'<span class="sw"><i style="background:{h}"></i><b>{t(n)}</b><code>{h}</code></span>' for h, n in m["pal"]
        )
        kw = "".join(f"<span>{t(k)}</span>" for k in m["kw"])
        out.append(
            f'<article class="mb" id="mb{m["n"]}"><figure><img src="img/{m["img"]}" alt="Moodboard {m["n"]} : {t(m["title"])}" loading="lazy" width="1100" height="778"></figure>'
            f'<div class="mb-notes"><p class="ref">Moodboard {m["n"]} · {m["axe"]}</p><h3>{t(m["title"])}</h3>'
            f'<div class="kw">{kw}</div><div class="palette">{sw}</div>'
            f'<h4>Ce qui marche</h4>{ul(m["works"], "plus")}<h4>À surveiller</h4>{ul(m["watch"], "todo")}{keep(m["keep"], "Ce qu’on retient (proposé)")}</div></article>'
        )
    return "".join(out)


# ---------------------------------------------------------------- personas
PERSONAS = [
    dict(name="Camille Rousseau", age="32 ans", tag="Cœur de cible · B2C", src="Vos notes, précisées",
         meta="Chargée de communication dans une agence bordelaise · Bac+5 · 2 200 à 2 800 € net/mois",
         quote="Je préfère une seule belle pièce qui a une histoire à trois objets sans âme.",
         rows=[("Situation", "En couple depuis 4 ans, locataire à Bacalan (Bordeaux). Projet d'achat immobilier d'ici 2 à 3 ans."),
               ("Style de vie", "Suit des créateurs et artisans locaux sur Instagram et TikTok, achète sur les marchés d'art et en concept-store plutôt qu'en grande distribution. Écolo sans être militante."),
               ("Motivations", "Un objet qui raconte quelque chose, soutenir le local, une pièce unique. Un cadeau à soi-même ou pour une crémaillère."),
               ("Freins", "Le « naturel » de grande surface qui sonne faux, le greenwashing. Sous 80 €, elle doute de l'authenticité ; au-delà de 250 €, elle compare et hésite."),
               ("Parcours d'achat", "Découvre sur Instagram → vérifie l'histoire sur le site → voit la lampe en concept-store ou sur un marché → achète."),
               ("Canaux", "Instagram, Pinterest, TikTok, concept-stores du centre de Bordeaux, marchés de créateurs.")],
         brings="Une lampe unique dont elle peut raconter l'origine (domaine, cépage), dans son budget."),
    dict(name="Laurent Mercier", age="58 ans", tag="Cible principale · B2C", src="Nouveau persona proposé",
         meta="Cadre dirigeant dans l'industrie · Nantes · revenus confortables",
         quote="Offrir encore un tire-bouchon ? Non. Je veux offrir un vrai morceau de vigne.",
         rows=[("Situation", "Marié, deux enfants adultes, propriétaire d'une maison. Cave d'environ 300 bouteilles, membre d'un club de dégustation."),
               ("Habitudes", "Séjourne deux fois par an dans le Bordelais (Médoc, Saint-Émilion), visite des domaines, achète en boutique de propriété."),
               ("Motivations", "Un cadeau original et symbolique pour un ami amateur de vin, un souvenir de visite, un objet pour son bureau ou sa cave."),
               ("Freins", "Les gadgets « vin » génériques (bouchons recyclés, tonneaux). Il exige une finition irréprochable."),
               ("Déclencheurs", "Une visite de domaine, un salon (Bordeaux Fête le Vin, Vinexpo), un caviste."),
               ("Budget", "150 à 300 €.")],
         brings="Le sarment du domaine qu'il vient de visiter, devenu lampe : un souvenir qui vient littéralement de la vigne."),
    dict(name="Sophie Lartigue", age="45 ans", tag="Cible secondaire · B2B", src="Vos notes, précisées",
         meta="Co-gérante du Vignoble Lartigue · Entre-deux-Mers · domaine familial, 3e génération, 15 à 25 ha",
         quote="Nos visiteurs repartent avec une bouteille. J'aimerais qu'ils repartent aussi avec un morceau de notre vigne.",
         rows=[("Rôle", "Responsable de l'œnotourisme et de la boutique (visites, dégustations, chambres d'hôtes). Son frère gère la vigne et la cave. Équipe de 4 à 6 permanents."),
               ("Enjeux", "Se différencier des domaines voisins aux offres similaires, diversifier les revenus, gérer ses sarments depuis le durcissement des règles anti-brûlage."),
               ("Point clé", "Elle est à la fois <b>fournisseuse</b> (ses sarments) et <b>cliente</b> (lampes pour ses chambres et sa boutique) : un circuit fermé, très fort à raconter."),
               ("Freins", "Peu de temps, ne pas gêner la taille (elle consulte son frère), rentabilité des objets en boutique."),
               ("Décision", "Seule pour tout ce qui touche à l'accueil et à l'image. Pas de comité d'achat."),
               ("Besoin", "Une petite série (10 à 30 lampes) au nom du domaine, avec une fiche histoire pour les visiteurs."),
               ("Canaux", "Salons professionnels (Wine Paris & Vinexpo Paris), syndicat d'appellation, réseau de vignerons, Instagram du domaine.")],
         brings="Une offre qui transforme un déchet de son domaine en objet de boutique à son nom."),
]


def render_personas():
    out = []
    for p in PERSONAS:
        rows = "".join(f"<div><dt>{t(k)}</dt><dd>{t(v)}</dd></div>" for k, v in p["rows"])
        out.append(
            f'<article class="persona"><p class="ptag">{t(p["tag"])} <span>{t(p["src"])}</span></p>'
            f'<h3>{t(p["name"])}<span>{t(p["age"])}</span></h3><p class="pmeta">{t(p["meta"])}</p>'
            f'<blockquote><span class="sel">{t("« " + p["quote"] + " »")}</span></blockquote>'
            f"<dl>{rows}</dl>{keep(p['brings'], 'Ce qu’Atelier Sarment lui apporte')}</article>"
        )
    return "".join(out)


# ---------------------------------------------------------------- textes corrigés (à copier)
def ins(s):
    return f"<ins>{t(s)}</ins>"


PESTEL_FULL = [
    ("Politique", [
        ("up", "Financements publics", "Politiques publiques d'économie circulaire et de transition écologique (ADEME, appels à projets type Agr'air) qui orientent les financements vers la valorisation des déchets agricoles plutôt que vers leur élimination."),
        ("down", "Pas de politique dédiée", "Aucune politique agricole nationale n'est dédiée au sarment : il est traité comme un sous-produit générique de la filière vitivinicole, pas comme une ressource stratégique."),
        ("up", "Poids local de la filière", "Poids politique local fort de la filière viticole (en Gironde notamment, premier poste excédentaire de la balance commerciale départementale), ce qui rend les collectivités attentives aux enjeux du secteur.")]),
    ("Économique", [
        ("down", "Bois peu cher", "Coût du bois globalement bas, ce qui réduit l'incitation économique des domaines à valoriser plutôt qu'à éliminer leurs sarments."),
        ("mix", "Filière non structurée", "Filière de collecte non structurée à grande échelle : pas de marché organisé avec prix de référence, des accords de gré à gré souvent gratuits plutôt qu'une économie d'achat-revente."),
        ("up", "Crise viticole", "Crise viticole en toile de fond (arrachages, vignes abandonnées) qui fragilise financièrement une partie des domaines : un argument supplémentaire pour eux d'accepter une valorisation à coût nul.")]),
    ("Socioculturel", [
        ("up", "Envie de local et d'histoire", "Attentes croissantes des consommateurs pour le local, l'upcycling et les objets porteurs d'une histoire (traçabilité du terroir, storytelling du domaine d'origine)."),
        ("up", "Rejet du brûlage", "Sensibilité citoyenne grandissante à la pollution de l'air liée au brûlage agricole, qui crée une pression sociale sur les pratiques traditionnelles."),
        ("up", "Image patrimoniale", "Image patrimoniale forte de la vigne en France, qui donne une valeur symbolique au matériau au-delà de sa fonction.")]),
    ("Technologique", [
        ("mix", "Deux niveaux de transformation", "L'artisanal simple (vannerie, ligature, séchage), accessible sans investissement lourd, et l'industriel avancé (matériaux composites brevetés type Sarmine® ou Terrazzo Vigne), qui demande R&D et machines spécifiques."),
        ("down", "Pas d'outils intermédiaires", "Peu d'innovation technologique intermédiaire : le secteur manque d'outils standardisés pour transformer le sarment à échelle moyenne."),
        ("up", "Traçabilité numérique", "Émergence de technologies de traçabilité numérique (QR code, scan) comme argument de différenciation chez certains acteurs premium.")]),
    ("Écologique", [
        ("up", "Ressource renouvelable", "Le sarment est une biomasse renouvelée chaque année, ressource durable tant que le vignoble existe."),
        ("up", "Brûlage polluant", "Le brûlage à l'air libre génère des particules fines (PM2,5) et des composés potentiellement cancérigènes : c'est le principal moteur environnemental qui pousse le secteur à se réinventer."),
        ("up", "Bilan carbone", "Bilan carbone valorisable dans la communication (émissions évitées par rapport au brûlage), argument déjà exploité commercialement par des acteurs comme Vitis Valorem."),
        ("warn", "Retour au sol (ajout proposé)", "Le broyage-épandage nourrit le sol : certains experts jugent ces 2 t/ha un minimum pour sa vie biologique. Le projet ne prélève qu'une faible part des sarments.")]),
    ("Légal", [
        ("down", "Cadre fragmenté", "Réglementation du brûlage variable selon les départements et les zones (arrêtés préfectoraux, RIPFCI en Gironde et dans les Landes) : un cadre légal fragmenté plutôt qu'uniforme."),
        ("up", "Flou juridique souple", "L'obligation d'éliminer certains sous-produits vinicoles (marcs, lies) est encadrée depuis 2014 ; le sarment reste dans un flou juridique plus souple."),
        ("mix", "Aucune norme", "Aucune norme ni certification spécifique n'encadre à ce jour la transformation du sarment en mobilier ou en objet design : un vide juridique à la fois facilitateur et risqué.")]),
    ("Éthique", [
        ("warn", "Risque de greenwashing", "Le discours écologique (upcycling, local, économie circulaire) peut masquer un positionnement avant tout esthétique et commercial : l'honnêteté sur ce que l'objet résout réellement doit être assumée."),
        ("warn", "Équité avec les vignerons", "La matière est aujourd'hui récupérée gratuitement ; si le produit fini se vend cher, il y a une asymétrie de valeur à interroger (visibilité, traçabilité, voire partage de valeur)."),
        ("warn", "Transparence sur l'origine", "Ne pas promettre une traçabilité précise (domaine, cépage) si elle ne peut pas être réellement garantie à l'échelle du projet.")]),
]
TAGS = {"up": "Atout", "down": "Frein", "mix": "Mixte", "warn": "Vigilance"}


def render_pestel():
    out = ['<div class="pestel">']
    for fac, items in PESTEL_FULL:
        li = "".join(
            f'<p><span class="tag {k}">{TAGS[k]}</span><b>{t(kw)}</b> {t(txt)}</p>' for k, kw, txt in items
        )
        out.append(f'<section class="pf"><h4>{t(fac)}</h4>{li}</section>')
    out.append("</div>")
    return "".join(out)


SWOT = [
    ("Forces", "up", ["Matière gratuite ou peu coûteuse.", "Ancrage territorial fort.", "Technique accessible en autodidacte (vannerie).",
                      "Storytelling puissant autour du patrimoine viticole.", ins("Sarment conservé entier : une matière reconnaissable, que personne d'autre ne propose.")]),
    ("Faiblesses", "down", ["Difficile à standardiser et à industrialiser.", "Traitement du bois exigeant.", "Savoir-faire technique à acquérir ou à externaliser.",
                            ins("Production lente (3 à 6 mois de séchage)."), ins("Marque inconnue au lancement.")]),
    ("Opportunités", "up", ["Peu de concurrence directe sur le " + ins("luminaire") + " en sarment brut en Nouvelle-Aquitaine.",
                            "Dynamique réglementaire et institutionnelle favorable à l'économie circulaire viticole.", "Marché de l'upcycling en croissance.",
                            ins("Luminaire haut de gamme en croissance (+7,7 %/an).")]),
    ("Menaces", "down", ["Acteurs mieux financés sur le segment composite (Les Princes Sarments) qui pourraient élargir leur gamme vers le mobilier.",
                         "Dépendance à la bonne volonté des domaines pour l'approvisionnement.", ins("Récolte saisonnière (novembre à mars)."),
                         ins("Arrachages de vignes liés à la crise viticole.")]),
]


def render_swot():
    out = ['<div class="swot">']
    for name, k, items in SWOT:
        out.append(f'<section class="sq {k}"><h4>{name}</h4><ul>' + "".join(f"<li>{t(i)}</li>" for i in items) + "</ul></section>")
    out.append("</div>")
    return "".join(out)


TEXTS = [
    ("t-p03", "p. 3 · Analyse contextuelle, § 1", "Apostrophes courbes, « coproduits ».",
     "La viticulture française produit plus de 2 tonnes de sarments par hectare et par an, générés lors de la taille et de l'épamprage. Cette biomasse est aujourd'hui majoritairement brûlée, broyée ou compostée et rarement valorisée comme matière noble. À l'échelle nationale, la filière génère plus de 1,6 million de tonnes de " + ins("coproduits") + " agricoles par an, dont 93 % de sarments."),
    ("t-cat", "p. 3 § 2 → Pourquoi maintenant ?", "Virgule avant « qui », « à la suite de ».",
     "En Gironde, premier vignoble de Nouvelle-Aquitaine, le brûlage à l'air libre des déchets verts viticoles est interdit ou fortement encadré dans les zones à dominante forestière. Le cadre réglementaire de référence est la circulaire du 18 novembre 2011" + ins(",") + " qui interdit le brûlage à l'air libre des déchets verts à l'échelle nationale. La pression s'est accentuée " + ins("à la suite d'épisodes de brûlage de 4 300 à 5 500 tonnes") + " de bois de vigne en trois mois, une pratique dénoncée par une association environnementale comme équivalente à la pollution de 130 000 voitures ou 24 000 camions par jour."),
    ("t-p05", "p. 5 · Analyse du secteur, § 1", "Un seul « mais », ponctuation.",
     "Le secteur du sarment de vigne se caractérise avant tout par un déséquilibre entre l'abondance de la ressource et la faiblesse de sa valorisation" + ins(" : une") + " ressource massive et récurrente, mais sous-exploitée. " + ins("L'écrasante") + " majorité de cette biomasse reste traitée comme un déchet agricole plutôt que comme une matière première : broyage-épandage direct dans les rangs de vigne, un peu de compostage " + ins("et, historiquement,") + " beaucoup de brûlage. Un secteur sous pression réglementaire, pas sous tension économique."),
    ("t-p06", "p. 6 · Secteur, § 1", "Guillemets français, deux-points.",
     "Les voies de valorisation " + ins("« nobles »") + " (énergie, matériaux composites, mobilier, cosmétique) existent et sont documentées depuis les années 2010-2015 par les instituts techniques de la filière, mais restent à l'état de niches. Le gisement mobilisable pour ces usages est qualifié de faible par les organismes du secteur eux-mêmes, non pas parce que la matière manque, mais parce que les filières de collecte, " + ins("de transport et de transformation") + " ne sont pas structurées à grande échelle" + ins(" : chaque") + " tentative de valorisation reste largement artisanale ou expérimentale."),
    ("t-p09", "p. 9 · Marché de vente", "Phrase de taille réécrite, « Md$ », dernier paragraphe → À retenir.",
     ins("Taille : les lampes et luminaires pesaient 4,165 Md€ en France en 2022, contre 4,094 Md€ en 2023, soit environ −1,7 % (derniers chiffres du Syndicat du luminaire).") + " La part B2C est plus petite : la consommation des ménages en appareils d'éclairage était de 790 M€ en 2021.\nTendance : les acteurs misent sur les matériaux durables pour se repositionner.\nHaut de gamme (monde) : 20,26 " + ins("Md$") + " en 2024, avec une croissance attendue de plus de 7,7 % par an jusqu'en 2034.\nÀ retenir : le marché du luminaire haut de gamme croît (+7,7 %/an dans le monde) pendant que le marché grand public stagne, " + ins("voire recule") + " (−1,7 % en France)."),
    ("t-posi", "Notes · Positionnement", "« artisan », « Atelier Sarment », « luminaires », ordre des cibles (B2C d'abord, B2B en perspective comme dans vos objectifs), ponctuation, « bois du vignoble ».",
     "Pour les amateurs de design local en Nouvelle-Aquitaine " + ins("et, à terme, les domaines viticoles") + ", " + ins("Atelier Sarment est l'artisan") + " qui transforme le sarment de vigne brut, tracé jusqu'au domaine d'origine, en " + ins("luminaires utilitaires et décoratifs. Contrairement aux acteurs existants,") + " qui travaillent soit d'autres bois " + ins("du vignoble") + " (Niko & Co), soit un matériau composite industriel coupé du geste artisanal (Les Princes Sarments, Vitis Valorem), " + ins("Atelier Sarment conserve le sarment dans sa forme naturelle. Conçue") + " pour les 25-45 ans urbains ou périurbains, déjà acheteurs de pièces artisanales ou de créateurs, " + ins("ainsi que pour les domaines viticoles") + " et les acteurs de l'œnotourisme (B2B), " + ins("la marque fait du sarment") + " une matière première accessible et moderne."),
    ("t-diff", "Notes · Pourquoi sommes-nous différents ?", "« le sarment », « là où », « nous mettons », « en valeur ».",
     "On ne dénature pas " + ins("le sarment. Là où") + " les autres entreprises le broient pour l'utiliser en brisures, nous le conservons dans sa structure naturelle, en y ajoutant des courbes organiques pour le sublimer. " + ins("Nous mettons en valeur") + " ce qui est habituellement broyé ou brûlé."),
    ("t-recy", "Notes · Recycler le sarment, c'est", "« vignerons », CO₂, formulation parallèle.",
     ins("Du temps gagné pour les vignerons") + "\nUn engagement fort pour l'environnement\n" + ins("Moins de CO₂") + "\nPas de fumée toxique\n" + ins("Moins de risques d'incendie")),
    ("t-marche", "Notes · Marché du sarment", "La Chine n'est pas en Europe occidentale ; « utilisé », « initiale ».",
     ins("Le marché du sarment se concentre dans les grands pays viticoles : Espagne, France et Italie en Europe, mais aussi la Chine.") + "\nLe sarment n'est actuellement pas " + ins("utilisé") + " dans sa forme " + ins("initiale") + "."),
]

VOCAB = [
    ("mobilier (problématique, SWOT, synthèse, positionnement)", "luminaire, tant que l'objectif est le pied de lampe"),
    ("PESTEL · PESTELE · PESTELÉ", "PESTELÉ"),
    ("co-produits · Coproduits", "coproduits"),
    ("Marché de vente · Marché de ventes", "Marché de vente"),
    ("Atelier sarment · Atelier Sarment", "Atelier Sarment"),
    ("récolte nov.–fév. · collecte nov.–mars", "de novembre à mars"),
    ("séchage 3–6 mois · 6 mois minimum", "un seul chiffre"),
    ("≈ 1,5 Mt de sarments · 1,6 Mt de coproduits", "1,6 Mt de coproduits, dont 93 % de sarments (≈ 1,5 Mt) ; attention, 2 t × 793 900 ha donne ≈ 1,6 Mt, pas 1,5"),
    ("cible 30-55 ans · 25-45 ans", "25-45 ans pour le cœur de cible"),
]


def render_texts():
    out = []
    for tid, title, why, body in TEXTS:
        paras = "".join(f"<p>{t(p)}</p>" for p in body.split("\n"))
        out.append(
            f'<article class="txt"><header><h4>{t(title)}</h4><p>{t(why)}</p>'
            f'<button type="button" class="copy" data-target="{tid}">Copier</button></header>'
            f'<div class="copy-src" id="{tid}">{paras}</div></article>'
        )
    return "".join(out)


def fix_ins(p):
    # applique la typographie hors balises (les segments <ins> sont déjà traités)
    parts = re.split(r"(<ins>.*?</ins>)", p)
    return "".join(x if x.startswith("<ins>") else t(x) for x in parts)


def render_vocab():
    rows = "".join(f"<tr><td>{t(a)}</td><td>{t(b)}</td></tr>" for a, b in VOCAB)
    return f'<div class="scroll"><table class="vocab"><thead><tr><th>Aujourd’hui</th><th>Partout</th></tr></thead><tbody>{rows}</tbody></table></div>'


# ---------------------------------------------------------------- page
chemin_html, counts = chemin()

PRIORITIES = [
    ("Il manque la moitié du récit.", "Le PDF couvre surtout le Set-up. Manquent : brief, problématique, « Pourquoi maintenant », concurrence, concept, plateforme de marque (cibles, personas, 4P). Presque tout est déjà écrit dans vos notes : il reste surtout à le mettre en page."),
    ("Remettre les pages dans l'ordre.", "Légal et Éthique (p. 11) sont séparés du PESTELÉ par le Marché et le SWOT : les ramener après la p. 8. Déplacer le SWOT dans la plateforme de marque, comme prévu dans votre tableau. Déplacer le paragraphe Gironde de la p. 3 vers « Pourquoi maintenant »."),
    ("Réparer le texte coupé.", "p. 11 : « …garantie à » → « …garantie à l'échelle du projet. » Puis les corrections listées plus bas (apostrophes, ponctuation, vocabulaire)."),
    ("Un « À retenir » sur chaque page de contenu.", "Même composant, même place, 25 mots maximum. Votre motif de sélection bleue s'y prête parfaitement : sélectionner, c'est retenir. Une proposition de phrase est donnée pour chaque page."),
    ("Six niveaux de texte au lieu de deux.", "Aujourd'hui : un très grand titre et du texte courant. Ajoutez chapeau, intertitres, chiffres clés, légendes, sources et folios."),
    ("Rééquilibrer les densités.", "p. 3 et 7 trop pleines ; p. 2, 8 et 11 trop vides ; p. 4, 6 et 10 déséquilibrées ; p. 5 sans aucun visuel. Chaque vide devient une info visuelle : chiffre, frise, schéma, À retenir."),
    ("Un seul vocabulaire.", "« Luminaire » et non « mobilier » (votre objectif est le pied de lampe), « PESTELÉ » partout, une seule tranche d'âge pour la cible, un seul temps de séchage."),
]

RULES = f"""
<div class="rules">
<article class="rule"><h3>Une grille, une place pour chaque chose</h3>
<p>{t("Les titres sont tantôt à gauche (p. 3), décalés (p. 5, 9) ou centrés (p. 7, 10). Fixez une grille (par exemple 12 colonnes, marges de 20 mm en A3 paysage) et une zone titre fixe : toujours à gauche, même ligne de base, sélection bleue sur le mot important.")}</p></article>
<article class="rule"><h3>Six niveaux de texte</h3>
<div class="specimen">
<p class="s1">Titre de section</p><p class="s2">Intertitre de page</p><p class="s3">{t("Chapeau : deux ou trois lignes qui résument la page.")}</p>
<p class="s4">{t("Texte courant, approche 0, interlignage d'environ 1,4.")}</p><p class="s5">93 %</p><p class="s6">{t("Légende · source · folio")}</p>
</div>
<p>{t("Le texte courant actuel est trop serré (approche négative) : les lettres se touchent. Remettez l'approche à 0.")}</p></article>
<article class="rule"><h3>{t("Le composant « À retenir »")}</h3>
<p>{t("En bas de la colonne de texte, sur chaque page de contenu, 25 mots maximum. Il reprend votre motif de sélection :")}</p>
{keep("Une ressource massive, encore traitée comme un déchet.", "À retenir")}
<p class="hint">{t("Le lecteur pressé lit les titres et les « À retenir » : ensemble, ils doivent raconter tout le dossier.")}</p></article>
<article class="rule"><h3>{t("Des pages d'images")}</h3>
<p>{t("Prévoyez 3 ou 4 pages de respiration (photo pleine page) aux ouvertures de parties. La taille des vignes a lieu de novembre à mars : organisez une séance photo dans un domaine (mains, sécateur, fagots, lumière rasante). Vos propres photos valent plus que des images de banque.")}</p>
<p>{t("Gardez le débord du cadre des p. 4 et 6 (les sarments sortent de l'image) comme signature, une fois par double page au maximum.")}</p></article>
<article class="rule"><h3>Folios et en-tête courant</h3>
<p>{t("Seule la p. 1 est numérotée. Mettez le numéro de page en bas à droite et le nom de la partie en haut à gauche, dans le style de « ▶ MATIÈRE PREMIÈRE, SECONDE VIE » de la couverture. Toutes les maquettes de ce retour les montrent.")}</p></article>
<article class="rule"><h3>Une source sous chaque chiffre</h3>
<p>{t("Une ligne de source en pied de page (F.G.V.B., Syndicat du luminaire…) et une page Sources en annexe. Un jury vérifie les chiffres, et les vôtres sont bons : montrez d'où ils viennent.")}</p></article>
<article class="rule"><h3>Typographie française</h3>
<div class="scroll"><table class="vocab"><thead><tr><th>Aujourd’hui</th><th>À faire</th></tr></thead><tbody>
<tr><td>l'épamprage (droite) et l’échelle (courbe)</td><td>{t("apostrophe courbe ’ partout")}</td></tr>
<tr><td>"nobles"</td><td>{t("« nobles »")}</td></tr>
<tr><td>Forces : · 93 %</td><td>{t("espace fine insécable avant : ; ? ! et %")}</td></tr>
<tr><td>4 300 · 130 000</td><td>{t("espace insécable dans les milliers")}</td></tr>
<tr><td>{t("idées enchaînées sans puces (PESTEL)")}</td><td>{t("une puce par idée")}</td></tr>
</tbody></table></div></article>
<article class="rule"><h3>La couleur de sélection</h3>
<p>{t("Le bleu est une bonne signature pour le dossier, et il tranche avec les photos chaudes. Si c'est voulu, gardez-le partout. Sinon, remplacez-le par une couleur de la charte finale une fois l'axe choisi : le dossier deviendra une première démonstration de votre identité.")}</p></article>
</div>
"""

AXES = f"""
<div class="axes-now">
<figure><img src="img/axe1.jpg" alt="Axe 1 Géométrie vivante, page actuelle" loading="lazy" width="640" height="453"><figcaption>Axe 1 · Géométrie vivante</figcaption></figure>
<figure><img src="img/axe2.jpg" alt="Axe 2 La main à l'œuvre, page actuelle" loading="lazy" width="640" height="453"><figcaption>{t("Axe 2 · La main à l'œuvre")}</figcaption></figure>
<figure><img src="img/axe3.jpg" alt="Axe 3 Ombre et Lumière, page actuelle" loading="lazy" width="640" height="453"><figcaption>Axe 3 · Ombre & Lumière</figcaption></figure>
</div>
<div class="two">
<div>
<h3>Diagnostic des 3 pages</h3>
{ul([
 "Ce sont des couvertures : un titre et une phrase. Il manque tout ce qui prouve la piste : recherches, application, bilan. Votre tableau prévoit 3 + 3 + 2 + 1 pages.",
 "Plus de la moitié de chaque page est vide : ajoutez l'image clé du moodboard correspondant sur la moitié droite, comme pour l'intercalaire.",
 "La sélection bleue est sur la 2e ligne pour les axes 1 et 3 (« Vivante », « & Lumière »), mais sur la 1re pour l'axe 2 (« La main »). Choisissez une règle, par exemple toujours le mot le plus important.",
 "Dans le PSD, le calque « À l'œuvre » commence par une espace : l'alignement du titre est faussé.",
 "Les trois phrases d'intention sont bonnes : gardez-les telles quelles.",
], "todo")}
<h3>Chaque axe sur 3 pages</h3>
{ul([
 "<b>Page 1 · Intention</b> : la couverture actuelle + l'image clé du moodboard + 3 mots-clés.",
 "<b>Page 2 · Recherches</b> : croquis de logo, essais typo, palette, motifs.",
 "<b>Page 3 · Application et bilan</b> : une mise en situation (étiquette, post Instagram) + « Ce qui marche / Ce qui manque ». Le « À retenir » dit pourquoi on passe à l'axe suivant.",
])}
</div>
<div class="wf-trio">
<figure>{wf([("lb",1,2,1,1,"AXE 1"),("ti",1,6,5,3,"Géométrie vivante"),("tx",1,6,8,1,"Intention + mots-clés"),("im",7,6,1,8,"Image clé du moodboard")], "▶ RECHERCHES GRAPHIQUES", "40")}<figcaption>1 · Intention</figcaption></figure>
<figure>{wf([("ti",1,6,1,1,"Recherches"),("gr",1,4,2,4,"Croquis logo"),("gr",5,4,2,4,"Essais typo"),("gr",9,4,2,4,"Motifs"),("gr",1,6,6,3,"Palette"),("tx",7,6,6,3,"Notes")], "▶ RECHERCHES GRAPHIQUES", "41")}<figcaption>2 · Recherches</figcaption></figure>
<figure>{wf([("im",1,7,1,8,"Mise en situation"),("li",8,5,1,3,"Ce qui marche"),("li",8,5,4,3,"Ce qui manque"),("rt",8,5,7,2,"→ pourquoi l'axe suivant")], "▶ RECHERCHES GRAPHIQUES", "42")}<figcaption>3 · Application et bilan</figcaption></figure>
</div>
</div>
<h3>Un récit possible avec vos 3 axes</h3>
<ol class="story">
<li><span class="stc">9 · Midpoint</span><b>Axe 1 · Géométrie vivante</b>{t("Base solide : parle directement de la matière (nœuds, strates). Incomplète : ne dit rien de la lumière, donc du produit, et les courbes de niveau sont un code très utilisé.")}</li>
<li><span class="stc">10 · Bad Guys</span><b>{t("Axe 2 · La main à l'œuvre")}</b>{t("Authentique, mais les codes de l'artisanat (mains, atelier, kraft) sont ceux de toutes les marques artisanales : faiblesse de différenciation.")}</li>
<li><span class="stc">11 · Axe 2.5</span><b>Axe 3 · Ombre & Lumière</b>{t("Le plus proche du produit : une lampe révèle le sarment par son ombre. Encore insatisfaisant : des références trop géométriques pour une matière organique.")}</li>
<li><span class="stc">12 · Axe final</span><b>{t("Synthèse")}</b>{t("La ligne vivante du sarment (axe 1) révélée par la lumière (axe 3), avec la trace de la main (axe 2) dans les textures et l'étiquette.")}</li>
</ol>
<p class="hint">{t("Ce n'est qu'une proposition : c'est à vous de décider quel axe l'emporte. L'important est que chaque bilan justifie l'axe suivant.")}</p>
"""

PROB = f"""
<div class="scroll"><table class="probs">
<thead><tr><th>Vos versions</th><th>Avis</th></tr></thead><tbody>
<tr><td>{t("1. Comment valoriser le sarment de vigne dans un secteur peu exploité afin de l'intégrer dans le paysage du mobilier artisanal.")}</td><td>{t("Trop générale, pas de point d'interrogation, « mobilier » alors que vous faites du luminaire.")}</td></tr>
<tr><td>{t("2. Comment transformer le sarment de vigne afin de le revaloriser dans un secteur peu exploité.")}</td><td>{t("Ne dit pas le rôle du design, ni ce qu'on produit.")}</td></tr>
<tr><td>{t("3. Comment le design peut-il révéler le potentiel esthétique et fonctionnel du sarment de vigne pour transformer un coproduit agricole en une matière de mobilier artisanal contemporain ?")}</td><td>{t("Bonne, mais « potentiel » reste vague.")}</td></tr>
<tr class="best"><td>{t("4. Comment le design peut-il transformer les irrégularités naturelles du sarment de vigne en qualités esthétiques et fonctionnelles pour créer un mobilier artisanal contemporain ?")}</td><td>{t("La meilleure : elle contient une tension (irrégularité → qualité) et annonce directement votre axe 1.")}</td></tr>
</tbody></table></div>
<div class="prob-final">
<p class="lbl">Recommandation : votre version 4, deux ajustements</p>
<p class="big">{t("Comment le design peut-il transformer les ")}<span class="sel">irrégularités</span>{t(" naturelles du sarment de vigne, ")}<span class="sel">{t("aujourd'hui brûlé ou broyé")}</span>{t(", en qualités esthétiques et fonctionnelles pour créer un ")}<span class="sel">luminaire</span>{t(" artisanal contemporain ?")}</p>
<p>{t("Ajouts : « aujourd'hui brûlé ou broyé » pose l'enjeu ; « luminaire » remplace « mobilier » pour coller à votre objectif (le pied de lampe).")}</p>
</div>
<div class="prob-alt">
<p class="lbl">{t("Variante, si votre jury attend une problématique centrée sur la marque")}</p>
<p>{t("« Comment une marque peut-elle faire du sarment de vigne, aujourd'hui brûlé ou broyé, une matière désirable, en rendant visibles son origine et le geste qui le transforme ? »")}</p>
<p class="hint">{t("Elle annonce aussi vos 3 axes : l'origine (matière), le geste (main), rendre visible (lumière).")}</p>
</div>
"""

CIBLE = f"""
<p class="lead-s">{t("Vos notes donnent deux « cibles primaires » et trois tranches d'âge différentes (30-55, 25-45, 25-45). Voici une structure à 4 niveaux qui reprend tout votre contenu sans contradiction.")}</p>
<div class="rings">
<article class="ring r1"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="8"/><circle class="on" cx="20" cy="20" r="4"/></svg>
<div><p class="rl">Cœur de cible · B2C</p><h3>{t("Les éco-design lovers")}</h3><p>{t("25-45 ans, urbains ou périurbains (métropole bordelaise d'abord), cadres et professions intermédiaires. Déjà acheteurs de pièces de créateurs (marchés d'art, concept-stores, Etsy). Ils achètent une histoire plus qu'une fonction : matière rare, geste visible, origine tracée. Budget 100 à 250 €. La cible la plus accessible pour un lancement en petite série.")}</p><p class="rp">Persona : Camille</p></div></article>
<article class="ring r2"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><circle cx="20" cy="20" r="13"/><circle class="on" cx="20" cy="20" r="8"/><circle cx="20" cy="20" r="4"/></svg>
<div><p class="rl">Cible principale · B2C</p><h3>{t("Les œnophiles et œnotouristes")}</h3><p>{t("40-65 ans, pouvoir d'achat élevé, cave à vin, visites de châteaux. Ils cherchent un cadeau ou un souvenir à forte charge symbolique. Achat déclenché par une visite de domaine, un salon ou une boutique de propriété. Budget 150 à 300 €.")}</p><p class="rp">Persona : Laurent</p></div></article>
<article class="ring r3"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><circle class="on" cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="8"/><circle cx="20" cy="20" r="4"/></svg>
<div><p class="rl">Cible secondaire · B2B, en développement</p><h3>{t("Domaines viticoles et œnotourisme")}</h3><p>{t("Domaines, chambres d'hôtes viticoles, boutiques de propriété, restaurants gastronomiques en Nouvelle-Aquitaine. Ils ne rachètent pas une histoire extérieure : ils voient leur propre patrimoine transformé en objet exposable. Hôtellerie de charme en second temps.")}</p><p class="rp">Persona : Sophie</p></div></article>
<article class="ring r4"><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="on" cx="20" cy="20" r="18"/><circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="8"/><circle cx="20" cy="20" r="4"/></svg>
<div><p class="rl">Cible périphérique · prescripteurs et relais</p><h3>{t("Ceux qui font connaître")}</h3><p>{t("Concept-stores et cavistes premium, architectes d'intérieur et décorateurs, presse déco et comptes Instagram déco, institutions (ADEME, Région Nouvelle-Aquitaine, interprofession viticole). Et les vignerons partenaires, qui sont aussi vos fournisseurs.")}</p></div></article>
</div>
"""

NEXT = [
    ("n1", "Corriger les textes (section Textes corrigés) : 30 minutes, gain immédiat."),
    ("n2", "Réordonner : p. 11 après p. 8, SWOT vers la plateforme, paragraphe Gironde vers « Pourquoi maintenant »."),
    ("n3", "Créer le gabarit : grille, en-tête courant, folios, composant « À retenir »."),
    ("n4", "Mettre en page ce qui est déjà écrit dans vos notes : problématique, usages actuels, pourquoi maintenant, concept, process, valeurs, positionnement, personas."),
    ("n5", "Chercher et rédiger 3 concurrents de plus, puis le tableau des outils de communication et la croix."),
    ("n6", "Rédiger les 4P, la mission et la page Sources."),
    ("n7", "Annoter les moodboards (mots-clés, palette, À retenir) et monter chaque axe à 3 pages."),
    ("n8", "Planifier une séance photo pendant la taille (dès novembre)."),
    ("n9", "M'envoyer le naming et la suite pour la relecture suivante."),
]
NEXT_HTML = '<ul class="checks">' + "".join(
    f'<li><input type="checkbox" id="{i}"><label for="{i}">{t(x)}</label></li>' for i, x in NEXT
) + "</ul>"

total_new = counts["new"] + counts["write"]

PAGE = f"""<title>Retour dossier Atelier Sarment</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet">
<style>
/* Mise en page : colonne de lecture unique ; chaque page du dossier = une fiche (visuels à gauche, retour à droite). Signature : le motif de sélection bleue du dossier, réemployé pour les « À retenir ». */
:root{{
  --paper:#FFFFFF; --ink:#16171A; --muted:#5B616B; --line:#E2E4E8; --soft:#F3F4F6;
  --sel:#A9D3F3; --sel-ink:#101418; --handle:#0A72EE;
  --fix:#9A5A2E; --fix-bg:#F6ECE3; --new:#2F6B47; --new-bg:#E5F0E9; --write:#B0392A; --later:#8A9099;
  --wf-img:#DCD2C7; --wf-line:#C3C8CF; --wf-bg:#FFFFFF;
  --f-display:'Newsreader', 'Iowan Old Style', Georgia, serif;
  --f-body:'Instrument Sans', 'Segoe UI', system-ui, sans-serif;
  --f-mono:'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
}}
@media (prefers-color-scheme: dark){{ :root:not([data-theme="light"]){{
  --paper:#111316; --ink:#ECEDEF; --muted:#A2A8B2; --line:#2B2F36; --soft:#1A1D22;
  --sel:#1E4C75; --sel-ink:#F3F7FB; --handle:#4EA2FF;
  --fix:#D9985F; --fix-bg:#2E2319; --new:#79BC93; --new-bg:#1A2A20; --write:#EC7A68; --later:#7E858F;
  --wf-img:#3F3833; --wf-line:#3A4048; --wf-bg:#16191D; color-scheme:dark }} }}
:root[data-theme="dark"]{{
  --paper:#111316; --ink:#ECEDEF; --muted:#A2A8B2; --line:#2B2F36; --soft:#1A1D22;
  --sel:#1E4C75; --sel-ink:#F3F7FB; --handle:#4EA2FF;
  --fix:#D9985F; --fix-bg:#2E2319; --new:#79BC93; --new-bg:#1A2A20; --write:#EC7A68; --later:#7E858F;
  --wf-img:#3F3833; --wf-line:#3A4048; --wf-bg:#16191D; color-scheme:dark }}
*{{box-sizing:border-box}}
body{{background:var(--paper);color:var(--ink);font:400 16px/1.55 var(--f-body);-webkit-font-smoothing:antialiased}}
.wrap{{max-width:1180px;margin:0 auto;padding-inline:clamp(16px,4vw,44px);padding-block:36px 96px}}
a{{color:inherit;text-decoration-color:var(--handle);text-underline-offset:3px}}
a:focus-visible,button:focus-visible,input:focus-visible+label{{outline:2px solid var(--handle);outline-offset:3px}}
h1,h2,h3,h4{{text-wrap:balance;margin:0}}
p{{margin:0}}
ul,ol{{margin:0;padding:0}}
ins{{text-decoration:none;background:linear-gradient(transparent 62%,var(--sel) 62%);color:inherit}}
.hint{{font-size:13.5px;color:var(--muted);margin-top:10px}}
.lbl{{display:block;font:500 11px/1.3 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}}
.scroll{{overflow-x:auto;max-width:100%}}

/* sélection bleue (motif du dossier) */
.sel{{position:relative;background:var(--sel);color:var(--sel-ink);padding:0 .14em;box-decoration-break:clone;-webkit-box-decoration-break:clone}}
h1 .sel{{display:inline-block;padding:0 .18em;margin-left:.12em}}
h1 .sel::before,h1 .sel::after,.keep::before,.keep::after{{content:"";position:absolute;width:12px}}
h1 .sel::before,.keep::before{{left:-6px;top:-9px;bottom:0;background:radial-gradient(circle at 6px 6px,var(--handle) 5px,transparent 5.6px) no-repeat,linear-gradient(var(--handle),var(--handle)) 5px 0/2px 100% no-repeat}}
h1 .sel::after,.keep::after{{right:-6px;top:0;bottom:-9px;background:radial-gradient(circle at 6px calc(100% - 6px),var(--handle) 5px,transparent 5.6px) no-repeat,linear-gradient(var(--handle),var(--handle)) 5px 0/2px 100% no-repeat}}
.keep{{position:relative;background:var(--sel);color:var(--sel-ink);padding:12px 16px 14px;margin-top:18px}}
.keep-label{{display:block;font:500 11px/1.3 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;opacity:.8}}
.keep p{{font:400 19px/1.35 var(--f-display)}}

/* en-tête */
.eyebrow{{font:500 12px/1.4 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}}
.top h1{{font:400 clamp(44px,8vw,92px)/1.02 var(--f-display);letter-spacing:-.015em;margin:22px 0 22px}}
.lead{{font:400 clamp(18px,2.2vw,21px)/1.5 var(--f-display);max-width:62ch}}
.meta-row{{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:18px;font:500 12.5px/1.4 var(--f-mono);color:var(--muted)}}
.toc{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px 24px;margin-top:32px;padding-top:18px;border-top:1px solid var(--line);list-style:none;counter-reset:toc}}
.toc li{{counter-increment:toc}}
.toc a{{display:flex;gap:10px;padding:6px 0;text-decoration:none;border-bottom:1px solid var(--line)}}
.toc a::before{{content:counter(toc,decimal-leading-zero);font:500 12px/1.9 var(--f-mono);color:var(--muted)}}
.toc a:hover{{color:var(--handle)}}

section.part{{padding-top:64px;margin-top:48px;border-top:2px solid var(--ink)}}
.part > .eyebrow{{display:block;margin-bottom:10px}}
.part > h2{{font:400 clamp(32px,4.4vw,48px)/1.08 var(--f-display);letter-spacing:-.01em;margin-bottom:12px}}
.part > .intro{{max-width:66ch;color:var(--muted);margin-bottom:28px}}
.lead-s{{max-width:66ch;margin-bottom:22px}}

/* priorités */
.prio{{list-style:none;display:grid;gap:0;counter-reset:p}}
.prio li{{counter-increment:p;display:grid;grid-template-columns:56px 1fr;gap:14px;padding:16px 0;border-bottom:1px solid var(--line)}}
.prio li::before{{content:counter(p);font:400 40px/1 var(--f-display);color:var(--handle)}}
.prio b{{display:block;font:500 20px/1.3 var(--f-display);margin-bottom:4px}}
.prio p{{max-width:70ch}}

/* chemin de fer */
.legend{{display:flex;flex-wrap:wrap;gap:10px 22px;margin-bottom:18px;font-size:13.5px;color:var(--muted)}}
.lg{{display:inline-flex;align-items:center;gap:8px}}
.lg b{{color:var(--ink);font-family:var(--f-mono);font-weight:500}}
.beats{{border-top:1px solid var(--line)}}
.beat{{display:grid;grid-template-columns:40px minmax(170px,230px) 120px 1fr;gap:14px;align-items:start;padding:12px 0;border-bottom:1px solid var(--line)}}
.bn{{font:400 24px/1 var(--f-display);color:var(--muted);padding-top:2px}}
.bname .stc,.stc{{display:block;font:500 11px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.bname strong{{font:500 16px/1.3 var(--f-body)}}
.btarget{{font:400 13px/1.4 var(--f-mono);color:var(--muted);display:flex;flex-direction:column;gap:2px}}
.over{{color:var(--write);font-weight:500}} .okc{{color:var(--ink)}}
.tiles{{display:flex;flex-wrap:wrap;gap:6px;min-width:0}}
.tile{{width:76px;aspect-ratio:1.414;border:1.5px solid var(--line);font:500 10.5px/1.15 var(--f-body);padding:4px 5px;display:flex;align-items:flex-end;overflow:hidden;hyphens:auto;overflow-wrap:anywhere}}
.tile.mini{{width:22px;padding:0}}
.tile.fix{{background:var(--fix-bg);border-color:var(--fix);color:var(--ink)}}
.tile.new{{background:var(--new-bg);border-color:var(--new);color:var(--ink)}}
.tile.write{{border-style:dashed;border-color:var(--write);color:var(--write)}}
.tile.later{{border-style:dotted;border-color:var(--later);color:var(--muted)}}
.tot{{margin-top:16px;font:400 18px/1.45 var(--f-display);max-width:70ch}}

/* règles */
.rules{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:34px 36px}}
.rule{{border-top:2px solid var(--ink);padding-top:14px;display:flex;flex-direction:column;gap:10px;min-width:0}}
.rule h3{{font:500 21px/1.25 var(--f-display)}}
.specimen{{border:1px solid var(--line);padding:14px 16px;display:grid;gap:6px}}
.s1{{font:400 34px/1 var(--f-display)}} .s2{{font:500 21px/1.2 var(--f-display)}} .s3{{font:400 16.5px/1.35 var(--f-display);color:var(--muted)}}
.s4{{font:400 14px/1.45 var(--f-body)}} .s5{{font:400 38px/1 var(--f-display);color:var(--handle)}} .s6{{font:500 10.5px/1.3 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}}
table{{border-collapse:collapse;width:100%;font-size:14px}}
th{{text-align:left;font:500 11px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:6px 10px 6px 0;border-bottom:1px solid var(--ink)}}
td{{padding:8px 10px 8px 0;border-bottom:1px solid var(--line);vertical-align:top}}
.vocab td:first-child{{color:var(--muted)}}

/* fiches pages */
.beat-head{{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:end;margin-top:56px;padding-bottom:10px;border-bottom:2px solid var(--ink)}}
.beat-num{{font:400 44px/0.9 var(--f-display);color:var(--handle)}}
.beat-stc{{font:500 11.5px/1.3 var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}}
.beat-name{{font:400 28px/1.15 var(--f-display)}}
.beat-target{{font:400 13px/1.3 var(--f-mono);color:var(--muted);text-align:right}}
.beat-note{{margin-top:10px;max-width:74ch;color:var(--muted)}}
.pg{{padding:28px 0 30px;border-bottom:1px solid var(--line)}}
.pg-head{{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px 14px;margin-bottom:18px}}
.pg-head .ref{{font:500 12px/1 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;padding:5px 7px;border:1px solid var(--ink)}}
.pg.new .pg-head .ref{{border-style:dashed}}
.pg-head h3{{font:400 26px/1.15 var(--f-display);flex:1 1 280px}}
.chips{{display:flex;flex-wrap:wrap;gap:6px}}
.chip{{font:500 12px/1 var(--f-body);padding:6px 9px;border-radius:999px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}}
.chip.fix{{background:var(--fix-bg);border-color:var(--fix);color:var(--ink)}}
.chip.new{{background:var(--new-bg);border-color:var(--new);color:var(--ink)}}
.chip.write{{border:1px dashed var(--write);color:var(--write)}}
.chip.alert{{background:var(--write);border-color:var(--write);color:var(--paper)}}
.chip.img,.chip.where{{border-color:var(--ink);color:var(--ink)}}
.chip[class*="dens-"]{{font-family:var(--f-mono);font-weight:400}}
.chip.dens-full,.chip.dens-empty,.chip.dens-unbal,.chip.dens-text{{border-color:var(--fix);color:var(--fix)}}
.chip.dens-ok{{border-color:var(--new);color:var(--new)}}
.pg-body{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:30px 40px;align-items:start}}
.pg-visuals{{display:grid;gap:16px;min-width:0}}
.pg-visuals figure{{margin:0}}
figcaption{{font:500 11px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:6px}}
.now img{{display:block;width:100%;height:auto;border:1px solid var(--line);background:#fff}}
.pg-notes{{display:flex;flex-direction:column;gap:10px;min-width:0}}
.pg-notes h4{{font:600 13px/1.3 var(--f-body);letter-spacing:.02em;margin-top:8px}}
.pg-notes .src{{padding:10px 12px;background:var(--soft);font-size:14.5px}}
ul.plus,ul.todo,.pg-notes ul{{list-style:none;display:grid;gap:7px}}
ul.plus li,ul.todo li,.pg-notes ul li{{position:relative;padding-left:22px;max-width:68ch}}
ul.plus li::before{{content:"✓";position:absolute;left:0;color:var(--new);font-weight:600}}
ul.todo li::before,.pg-notes ul:not(.plus) li::before{{content:"→";position:absolute;left:0;color:var(--fix)}}
.fixes{{display:grid;gap:8px}}
.fix-row{{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line)}}
.fix-row p{{background:var(--paper);padding:9px 11px;font-size:14px;min-width:0;overflow-wrap:anywhere}}
.fix-row .before{{color:var(--muted)}}
.fix-row .before .lbl{{color:var(--write)}} .fix-row .after .lbl{{color:var(--new)}}

/* maquettes (A3 paysage, grille 12 × 8) */
.wf-page{{position:relative;aspect-ratio:1.414;max-width:100%;container-type:inline-size;background:var(--wf-bg);border:1px solid var(--muted);display:grid;grid-template-columns:repeat(12,1fr);grid-template-rows:repeat(8,1fr);gap:1.3cqw;padding:5.4cqw 4cqw 5cqw}}
.wf-head{{position:absolute;left:4cqw;top:1.7cqw;font:500 max(7px,1.7cqw)/1 var(--f-mono);letter-spacing:.05em;color:var(--muted)}}
.wf-folio{{position:absolute;right:4cqw;bottom:1.6cqw;font:500 max(7px,1.7cqw)/1 var(--f-mono);color:var(--muted)}}
.b{{position:relative;min-width:0;min-height:0;overflow:hidden;display:flex;align-items:flex-end;padding:.8cqw;font:500 max(8px,2.05cqw)/1.15 var(--f-body);color:var(--muted)}}
.b span{{position:relative}}
.b-ti{{font:400 max(12px,5.6cqw)/.98 var(--f-display);color:var(--ink);padding:0;letter-spacing:-.01em}}
.b-st{{font:500 max(9px,2.6cqw)/1.1 var(--f-display);color:var(--ink);padding:0;align-items:center}}
.b-tx{{background:repeating-linear-gradient(to bottom,var(--wf-line) 0 .55cqw,transparent .55cqw 1.7cqw);align-items:flex-start}}
.b-tx span,.b-li span{{background:var(--wf-bg);padding:0 .5cqw}}
.b-li{{border-top:.35cqw solid var(--ink);background:repeating-linear-gradient(to bottom,transparent 0 2cqw,var(--wf-line) 2cqw 2.5cqw);align-items:flex-start;padding-top:1cqw}}
.b-im{{background:var(--wf-img);color:var(--ink);align-items:flex-end}}
.b-nu{{font:400 max(10px,3.6cqw)/1 var(--f-display);color:var(--handle);align-items:center;border-top:1px solid var(--wf-line);border-bottom:1px solid var(--wf-line)}}
.b-qu{{font:italic 400 max(10px,3.4cqw)/1.1 var(--f-display);color:var(--ink);align-items:center}}
.b-gr{{border:1px dashed var(--muted);align-items:center;justify-content:center;text-align:center}}
.b-lb{{font:500 max(7px,1.8cqw)/1.2 var(--f-mono);letter-spacing:.05em;text-transform:uppercase;padding:0;align-items:center}}
.b-rt{{background:var(--sel);color:var(--sel-ink);align-items:center;overflow:visible}}
.b-rt::before{{content:"";position:absolute;left:-.3cqw;top:-.9cqw;bottom:0;width:.4cqw;background:var(--handle)}}
.b-rt::after{{content:"";position:absolute;right:-.3cqw;bottom:-.9cqw;top:0;width:.4cqw;background:var(--handle)}}
.b.ov{{z-index:2}}
.b-tx.ov{{background:var(--wf-bg);outline:.5cqw solid var(--wf-bg)}}
.b-ti.ov,.b-lb.ov,.b-qu.ov{{color:var(--ink)}}
.b-qu.ov span{{background:var(--sel);color:var(--sel-ink);padding:0 .6cqw}}

/* contenus spécifiques */
.frise{{border:1px solid var(--line);padding:10px}}
.frise-row{{display:grid;grid-template-columns:repeat(12,1fr);gap:2px}}
.m{{font:500 10.5px/1 var(--f-mono);text-align:center;padding:9px 0;overflow:hidden}}
.m.c,.frise-leg i.c{{background:var(--fix);color:var(--paper)}}
.m.s,.frise-leg i.s{{background:var(--fix-bg);color:var(--ink)}}
.m.f,.frise-leg i.f{{background:var(--sel);color:var(--sel-ink)}}
.frise-leg{{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px;font-size:12.5px;color:var(--muted)}}
.frise-leg i{{display:inline-block;width:12px;height:12px;margin-right:6px;vertical-align:-1px}}
.toc-prop{{list-style:none;display:grid;gap:0;border-top:1px solid var(--line)}}
.toc-prop li{{display:grid;grid-template-columns:34px 1fr;padding:6px 0;border-bottom:1px solid var(--line);font:400 17px/1.3 var(--f-display)}}
.toc-prop b{{font:500 12px/1.9 var(--f-mono);color:var(--muted)}}
.toc-prop em{{display:block;font:400 13px/1.35 var(--f-body);color:var(--muted);font-style:normal}}
.usages{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}}
.usages b{{display:block;font:500 15px/1.25 var(--f-display)}}
.usages p{{font-size:13px;color:var(--muted)}}
.gauge{{display:block;height:6px;margin:8px 0 6px;background:linear-gradient(to right,var(--fix) var(--w),var(--line) var(--w))}}
.g4{{--w:90%}} .g2{{--w:35%}} .g1{{--w:12%}}
.pestel-ex{{border:1px solid var(--line);padding:12px 14px;display:grid;gap:7px;font-size:14px}}
.pe-title{{font:500 11px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.tag{{display:inline-block;font:500 10.5px/1 var(--f-mono);text-transform:uppercase;letter-spacing:.05em;padding:4px 6px;margin-right:8px;border:1px solid;vertical-align:1px}}
.tag.up{{color:var(--new);border-color:var(--new)}} .tag.down{{color:var(--fix);border-color:var(--fix)}}
.tag.mix{{color:var(--muted);border-color:var(--muted)}} .tag.warn{{color:var(--write);border-color:var(--write)}}
.pestel-ex b,.pf b{{margin-right:4px}}
.conc td:nth-child(1){{font:500 11.5px/1.35 var(--f-mono);color:var(--muted);white-space:nowrap}}
.st{{font:500 11px/1 var(--f-mono);padding:4px 6px;white-space:nowrap}}
.st.new{{background:var(--new-bg);color:var(--new)}} .st.write{{border:1px dashed var(--write);color:var(--write)}}
.croix{{margin:0}}
.croix svg{{width:100%;height:auto;display:block;border:1px solid var(--line)}}
.croix .ax{{stroke:var(--muted);stroke-width:1.2}}
.croix .free{{fill:var(--sel);opacity:.45}}
.croix .axl{{fill:var(--muted);font:500 12px var(--f-mono)}}
.croix .pt{{fill:var(--ink)}} .croix .ptl{{fill:var(--ink);font:400 13px var(--f-body)}}
.croix .me{{fill:var(--handle)}} .croix .mel{{fill:var(--ink);font:600 14px var(--f-body)}}
.steps{{list-style:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;counter-reset:s}}
.steps li{{counter-increment:s;border-top:2px solid var(--ink);padding-top:8px;font-size:13px;color:var(--muted)}}
.steps li::before{{content:counter(s);display:block;font:400 26px/1 var(--f-display);color:var(--handle)}}
.steps b{{display:block;color:var(--ink);font-size:14px;margin:4px 0 2px}}
.fourp{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px;margin:0}}
.fourp div{{border-top:2px solid var(--ink);padding-top:8px}}
.fourp dt{{font:500 18px/1.2 var(--f-display);margin-bottom:4px}} .fourp dd{{margin:0;font-size:14px}}
.mission{{display:grid;gap:10px}}
.mission p{{font:400 17px/1.4 var(--f-display);padding:10px 12px;background:var(--soft)}}

/* axes */
.axes-now{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-bottom:28px}}
.axes-now figure{{margin:0}} .axes-now img{{width:100%;height:auto;display:block;border:1px solid var(--line)}}
.two{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:28px 40px;align-items:start}}
.two h3,.part > h3{{font:500 21px/1.25 var(--f-display);margin:6px 0 12px}}
.two ul{{list-style:none;display:grid;gap:8px}}
.two ul li{{position:relative;padding-left:22px}}
.two ul li::before{{content:"→";position:absolute;left:0;color:var(--fix)}}
.wf-trio{{display:grid;gap:14px}} .wf-trio figure{{margin:0}}
.story{{list-style:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:6px}}
.story li{{border-top:2px solid var(--ink);padding-top:10px;font-size:14px;color:var(--muted);display:flex;flex-direction:column;gap:4px}}
.story li:last-child{{border-top-color:var(--handle)}}
.story b{{color:var(--ink);font:500 17px/1.25 var(--f-display)}}
.part > h3{{margin-top:34px}}

/* moodboards */
.mb{{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:24px 36px;padding:26px 0;border-bottom:1px solid var(--line);align-items:start}}
.mb figure{{margin:0}} .mb img{{width:100%;height:auto;display:block;border:1px solid var(--line)}}
.mb-notes{{display:flex;flex-direction:column;gap:10px;min-width:0}}
.mb-notes .ref{{font:500 12px/1 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.mb-notes h3{{font:400 30px/1.1 var(--f-display)}}
.mb-notes h4{{font:600 13px/1.3 var(--f-body);margin-top:6px}}
.kw{{display:flex;flex-wrap:wrap;gap:6px}}
.kw span{{font:500 12.5px/1 var(--f-body);padding:6px 9px;border:1px solid var(--ink)}}
.palette{{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}}
.sw{{display:flex;flex-direction:column;gap:3px;min-width:0}}
.sw i{{display:block;aspect-ratio:1;border:1px solid var(--line)}}
.sw b{{font:500 11px/1.2 var(--f-body)}} .sw code{{font:400 10px/1 var(--f-mono);color:var(--muted)}}
.mb-notes ul{{list-style:none;display:grid;gap:7px}}
.mb-notes ul li{{position:relative;padding-left:22px}}
.mb-notes ul.plus li::before{{content:"✓";position:absolute;left:0;color:var(--new);font-weight:600}}
.mb-notes ul.todo li::before{{content:"→";position:absolute;left:0;color:var(--fix)}}

/* problématique */
.probs tr.best td{{background:var(--new-bg)}}
.probs td:first-child{{font:400 16px/1.4 var(--f-display);width:62%}}
.prob-final{{margin-top:26px;padding:22px 0;border-top:2px solid var(--ink);border-bottom:1px solid var(--line)}}
.prob-final .big{{font:400 clamp(22px,3vw,32px)/1.35 var(--f-display);max-width:44ch;margin:8px 0 12px}}
.prob-alt{{margin-top:18px;max-width:72ch}}
.prob-alt p{{font:400 18px/1.45 var(--f-display)}}
.prob-alt p.lbl{{font:500 11px/1.3 var(--f-mono)}}
.prob-alt p.hint{{font:400 13.5px/1.5 var(--f-body)}}

/* cible */
.rings{{display:grid;gap:0;border-top:1px solid var(--line)}}
.ring{{display:grid;grid-template-columns:56px minmax(0,1fr);gap:18px;padding:18px 0;border-bottom:1px solid var(--line)}}
.ring svg{{width:56px;height:56px}}
.ring circle{{fill:none;stroke:var(--line);stroke-width:1.5}}
.ring circle.on{{fill:var(--sel);stroke:var(--handle);stroke-width:2}}
.rl{{font:500 11px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.ring h3{{font:400 23px/1.2 var(--f-display);margin:2px 0 6px}}
.ring p{{max-width:72ch}}
.rp{{margin-top:6px;font:500 13px/1 var(--f-mono);color:var(--handle)}}

/* personas */
.personas{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:28px}}
.persona{{border-top:2px solid var(--ink);padding-top:14px;display:flex;flex-direction:column;gap:10px;min-width:0}}
.ptag{{font:500 11px/1.3 var(--f-mono);letter-spacing:.06em;text-transform:uppercase}}
.ptag span{{color:var(--muted);margin-left:6px}}
.persona h3{{font:400 30px/1.05 var(--f-display)}}
.persona h3 span{{font:400 17px/1 var(--f-display);color:var(--muted);margin-left:10px}}
.pmeta{{font-size:13.5px;color:var(--muted)}}
.persona blockquote{{margin:6px 0 4px;font:italic 400 19px/1.45 var(--f-display)}}
.persona dl{{margin:0;display:grid;gap:8px}}
.persona dl div{{display:grid;grid-template-columns:104px minmax(0,1fr);gap:10px;font-size:14px;border-bottom:1px solid var(--line);padding-bottom:8px}}
.persona dt{{font:500 11px/1.5 var(--f-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}}
.persona dd{{margin:0}}

/* texte de page prêt à coller */
.ptext{{border:1px solid var(--ink);margin:4px 0 6px}}
.ptext header{{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:9px 12px;border-bottom:1px solid var(--ink)}}
.ptext header span{{font:500 11px/1.3 var(--f-mono);letter-spacing:.08em;text-transform:uppercase}}
.ptext dl{{margin:0;padding:4px 12px 10px;display:grid;gap:0;font:400 16px/1.5 var(--f-display);max-width:none}}
.ptext dl div{{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}}
.ptext dl div:last-child{{border-bottom:0}}
.ptext dt{{font:500 10.5px/1.6 var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}}
.ptext dd{{margin:0;display:grid;gap:6px;min-width:0}}
.ptext dl div.rt{{background:var(--sel);color:var(--sel-ink);margin:6px -12px 0;padding:10px 12px;border-bottom:0}}
.ptext dl div.rt dt{{color:var(--sel-ink);opacity:.8}}
.ptext .hint{{padding:0 12px 10px}}
@media (max-width:560px){{ .ptext dl div{{grid-template-columns:minmax(0,1fr);gap:2px}} }}

/* textes corrigés */
.txts{{display:grid;gap:18px}}
.txt{{border:1px solid var(--line)}}
.txt header{{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 14px;padding:12px 14px;background:var(--soft);align-items:center}}
.txt h4{{font:500 16px/1.3 var(--f-display)}}
.txt header p{{grid-column:1;font-size:13px;color:var(--muted)}}
.copy{{grid-column:2;grid-row:1/span 2;font:500 13px/1 var(--f-body);padding:9px 12px;border:1px solid var(--ink);background:var(--paper);color:var(--ink);cursor:pointer}}
.copy:hover{{background:var(--sel);color:var(--sel-ink)}}
.copy-src{{padding:14px;display:grid;gap:8px;font:400 16px/1.55 var(--f-display);max-width:80ch}}
.pestel{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:18px 28px}}
.pf{{border-top:2px solid var(--ink);padding-top:10px;display:grid;gap:8px;font-size:14px}}
.pf h4{{font:500 19px/1.2 var(--f-display)}}
.swot{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--ink);border:1px solid var(--ink)}}
.sq{{background:var(--paper);padding:14px 16px}}
.sq h4{{font:500 20px/1.2 var(--f-display);margin-bottom:8px}}
.sq.up h4{{color:var(--new)}} .sq.down h4{{color:var(--fix)}}
.sq ul{{list-style:disc;padding-left:18px;display:grid;gap:5px;font-size:14px}}

/* prochaines étapes */
.checks{{list-style:none;display:grid;gap:0;border-top:1px solid var(--line)}}
.checks li{{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}}
.checks input{{width:18px;height:18px;margin-top:3px;accent-color:var(--handle);flex:none}}
.checks input:checked+label{{color:var(--muted);text-decoration:line-through}}
.foot{{margin-top:56px;font-size:13px;color:var(--muted)}}

@media (max-width:900px){{
  .pg-body,.two,.mb{{grid-template-columns:minmax(0,1fr)}}
  .beat{{grid-template-columns:34px minmax(0,1fr);}}
  .beat .btarget{{grid-column:2;flex-direction:row;gap:10px}}
  .beat .tiles{{grid-column:1/-1}}
  .story{{grid-template-columns:repeat(2,minmax(0,1fr))}}
  .usages,.steps{{grid-template-columns:repeat(2,minmax(0,1fr))}}
}}
@media (max-width:560px){{
  .fix-row,.fourp,.swot,.axes-now{{grid-template-columns:minmax(0,1fr)}}
  .story{{grid-template-columns:minmax(0,1fr)}}
  .palette{{grid-template-columns:repeat(3,minmax(0,1fr))}}
  .beat-head{{grid-template-columns:auto 1fr}} .beat-target{{grid-column:1/-1;text-align:left}}
  .persona dl div{{grid-template-columns:minmax(0,1fr);gap:2px}}
  .prio li{{grid-template-columns:36px 1fr}} .prio li::before{{font-size:30px}}
}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
</style>

<div class="wrap" lang="fr">
<header class="top">
<p class="eyebrow">▶ Matière première, seconde vie · retour de relecture</p>
<h1>Retour page <span class="sel">par page</span></h1>
<p class="lead">{t("Relecture de l'analyse stratégique (11 pages), des 3 axes créatifs, des 3 moodboards et de vos notes, dans l'ordre de votre trame Save the Cat. Pour chaque page : ce qui marche, ce qu'il faut changer, les corrections de texte, une proposition d'« À retenir » et une maquette.")}</p>
<p class="meta-row"><span>Atelier Sarment (nom provisoire)</span><span>29 septembre 2026</span><span>{t("Naming : relecture à venir")}</span></p>
<ol class="toc">
<li><a href="#essentiel">L’essentiel</a></li>
<li><a href="#chemin">Chemin de fer</a></li>
<li><a href="#regles">Règles communes</a></li>
<li><a href="#pages">Page par page</a></li>
<li><a href="#problematique">Problématique</a></li>
<li><a href="#cible">Cible</a></li>
<li><a href="#personas">Personas</a></li>
<li><a href="#moodboards">Moodboards</a></li>
<li><a href="#axes">Axes</a></li>
<li><a href="#textes">Textes corrigés</a></li>
<li><a href="#suite">Prochaines étapes</a></li>
</ol>
</header>

<section class="part" id="essentiel">
<span class="eyebrow">01</span><h2>{t("L'essentiel")}</h2>
<p class="intro">{t("Vos textes sont bien écrits et bien documentés : je les ai très peu retouchés. Les vrais chantiers sont la structure, la hiérarchie visuelle et les pages manquantes. Par ordre d'importance :")}</p>
<ol class="prio">{"".join(f"<li><div><b>{t(a)}</b><p>{t(b)}</p></div></li>" for a, b in PRIORITIES)}</ol>
</section>

<section class="part" id="chemin">
<span class="eyebrow">02</span><h2>Chemin de fer Save the Cat</h2>
<p class="intro">{t("Chaque rectangle est une page du futur dossier, dans l'ordre de votre tableau. Ce chemin de fer répond à la question « est-ce qu'il manque des pages ? ».")}</p>
{chemin_html}
<p class="tot">{t(f"Sans compter la charte, les déclinaisons et la conclusion : {counts['fix']} pages existent et sont à retravailler, {counts['new']} sont à créer avec un contenu déjà prêt dans vos notes, {counts['write']} sont à rédiger ou à produire. Le Set-up et la plateforme dépassent le nombre de pages prévu par votre tableau : gardez-les serrés.")}</p>
</section>

<section class="part" id="regles">
<span class="eyebrow">03</span><h2>Règles communes à tout le dossier</h2>
<p class="intro">{t("À régler une fois dans le gabarit, avant de reprendre les pages une par une.")}</p>
{RULES}
</section>

<section class="part" id="pages">
<span class="eyebrow">04</span><h2>Page par page, dans le nouvel ordre</h2>
<p class="intro">{t("Les pages existantes (p. 01 à 11) sont remises à leur place dans la trame. Les pages marquées « Nouvelle » sont à créer. Chaque maquette est une grille de 12 colonnes au format A3 paysage ; le bloc bleu est l'« À retenir ».")}</p>
{render_cards()}
</section>

<section class="part" id="problematique">
<span class="eyebrow">05</span><h2>Problématique</h2>
<p class="intro">{t("Elle manque dans le PDF alors que c'est la page 2 de votre trame. Vous avez déjà la bonne dans vos notes.")}</p>
{PROB}
</section>

<section class="part" id="cible">
<span class="eyebrow">06</span><h2>Cible</h2>
{CIBLE}
</section>

<section class="part" id="personas">
<span class="eyebrow">07</span><h2>Personas</h2>
<p class="intro">{t("Camille et Sophie viennent de vos notes, précisées (citation, freins, parcours, canaux). Laurent est nouveau : il incarne la cible œnophile, présente dans vos notes mais sans persona. Mise en page conseillée : un portrait libre de droits, la citation en sélection bleue, et « Ce qu'Atelier Sarment lui apporte » en À retenir.")}</p>
<div class="personas">{render_personas()}</div>
<p class="hint">{t("Dans vos notes, Camille est « chargée de communication ou chef de projet marketing » et vit « à Bacalan ou Saint-Michel » : un persona ne garde qu'une seule option, sinon il perd sa crédibilité.")}</p>
</section>

<section class="part" id="moodboards">
<span class="eyebrow">08</span><h2>Moodboards</h2>
<p class="intro">{t("Sélections justes et bien liées à chaque axe. Il leur manque de la hiérarchie et de l'annotation : aujourd'hui ce sont des collages, sans titre, sans mots-clés, sans palette, et les images se chevauchent au point de couper des textes (« 35.78789 N », « Celebrate Father »). Pour chaque moodboard : une image dominante, le nom de l'axe, 5 mots-clés, une palette extraite, 2 références typo et un « Ce qu'on retient ». Les palettes ci-dessous sont extraites des images elles-mêmes.")}</p>
{render_mb()}
</section>

<section class="part" id="axes">
<span class="eyebrow">09</span><h2>Axes créatifs</h2>
{AXES}
</section>

<section class="part" id="textes">
<span class="eyebrow">10</span><h2>Textes corrigés, prêts à coller</h2>
<p class="intro">{t("Corrections minimales : ponctuation, typographie, cohérence. Les passages modifiés sont soulignés en bleu. Le bouton copie le texte brut.")}</p>
<div class="txts">{render_texts()}</div>
<h3 style="font:400 28px/1.15 var(--f-display);margin:40px 0 8px">{t("PESTELÉ complet, en puces étiquetées")}</h3>
<p class="hint" style="margin-bottom:16px">{t("Votre texte, découpé en une idée par ligne, avec un mot-clé et une étiquette. Seul ajout : « Retour au sol ».")}</p>
{render_pestel()}
<h3 style="font:400 28px/1.15 var(--f-display);margin:40px 0 8px">{t("SWOT réordonné")}</h3>
<p class="hint" style="margin-bottom:16px">{t("Interne en haut, externe en bas. Les ajouts proposés sont soulignés en bleu.")}</p>
{render_swot()}
<h3 style="font:400 28px/1.15 var(--f-display);margin:40px 0 8px">Vocabulaire à harmoniser</h3>
{render_vocab()}
</section>

<section class="part" id="suite">
<span class="eyebrow">11</span><h2>Prochaines étapes</h2>
<p class="intro">{t("Dans cet ordre. Les cases se souviennent de votre avancement dans ce navigateur.")}</p>
{NEXT_HTML}
<p class="foot">{t("Retour établi à partir de ANALYSE.pdf (11 p.), du fichier AXES (3 plans de travail), des 3 moodboards, du tableau Save the Cat et de vos notes du projet « Lampes sarments de vignes ».")}</p>
</section>
</div>

<script>
(function(){{
  var store = null;
  try {{ store = window.localStorage; }} catch (e) {{ store = null; }}
  document.querySelectorAll('.checks input').forEach(function(cb){{
    try {{ if (store && store.getItem('retour-' + cb.id) === '1') cb.checked = true; }} catch (e) {{}}
    cb.addEventListener('change', function(){{
      try {{ if (store) store.setItem('retour-' + cb.id, cb.checked ? '1' : '0'); }} catch (e) {{}}
    }});
  }});
  document.querySelectorAll('button.copy').forEach(function(btn){{
    btn.addEventListener('click', function(){{
      var el = document.getElementById(btn.getAttribute('data-target'));
      if (!el) return;
      var text = Array.prototype.map.call(el.querySelectorAll('p'), function(p){{ return p.innerText; }}).join(el.tagName === 'DL' ? '\\n\\n' : '\\n');
      var done = function(){{ btn.textContent = 'Copié'; setTimeout(function(){{ btn.textContent = 'Copier'; }}, 1800); }};
      var fallback = function(){{
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'Sélectionné : Ctrl+C';
        setTimeout(function(){{ btn.textContent = 'Copier'; }}, 2600);
      }};
      if (navigator.clipboard && navigator.clipboard.writeText) {{
        navigator.clipboard.writeText(text).then(done, fallback);
      }} else {{ fallback(); }}
    }});
  }});
}})();
</script>
"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(PAGE)
print("ok", len(PAGE), counts)
