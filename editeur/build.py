# -*- coding: utf-8 -*-
"""Assemble l'éditeur en une seule page HTML.

- index.html          : document complet (version publique : Crimson Pro à la place de la Minion)
- publish/editeur.html: contenu sans squelette, pour l'artifact privé ; embarque la Minion
                        si src/private/MinionPro-Regular.ttf existe (police sous licence,
                        jamais versionnée : voir tools_minion.py)
"""
import base64, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
FONTS = ['CrimsonPro-Regular', 'CrimsonPro-SemiBold', 'CrimsonPro-Italic', 'CrimsonPro-SemiBoldItalic',
         'InstrumentSans-Regular', 'InstrumentSans-SemiBold', 'InterTight-Light', 'InterTight-Regular', 'InterTight-Bold']
JS = ['core.js', 'store.js', 'render.js', 'templates.js', 'editor.js', 'panels.js', 'present.js', 'export.js']


def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def coverage(path):
    from fontTools.ttLib import TTFont
    cps = sorted(TTFont(path).getBestCmap().keys())
    out, start, prev = [], None, None
    for c in cps:
        if start is None:
            start = prev = c
        elif c == prev + 1:
            prev = c
        else:
            out.append([start, prev]); start = prev = c
    if start is not None:
        out.append([start, prev])
    return out


def bundle(private):
    files = {n: os.path.join(SRC, n + '.ttf') for n in FONTS}
    minion = os.path.join(SRC, 'private', 'MinionPro-Regular.ttf')
    if private and os.path.exists(minion):
        files['MinionPro-Regular'] = minion
    fontdata = {n: base64.b64encode(open(f, 'rb').read()).decode() for n, f in files.items()}
    cov = {n: coverage(f) for n, f in files.items()}
    css = read('ui.css') + '\n' + read('page.css')
    js = '\n'.join(read(n) for n in JS)
    sigs = {k: json.load(open(os.path.join(SRC, k.lower() + 'sig.json'), encoding='utf-8')) for k in ('V1', 'V2')}
    script = (
        '(() => {\n'
        f'const FONTDATA = {json.dumps(fontdata)};\n'
        f'const FONTCOV = {json.dumps(cov, separators=(",", ":"))};\n'
        + ''.join(f'const {k}SIG = {json.dumps(v, ensure_ascii=False, separators=(",", ":"))};\n' for k, v in sigs.items())
        + js +
        '\nwindow.__ed = { S, SAVE, FAM, buildPDF, buildDossier, renderPage, goPage, startPresent, stopPresent, flushSave, createFromTemplate, sanitizeHTML, checkTemplateUpdate, pageSig, LAYOUTS, PAGE };\n'
        'boot().catch(e => { console.error(e); const o = document.getElementById("onboard"); if (o) { o.hidden = false; o.textContent = "Erreur au démarrage : " + (e && e.message || e); } });\n'
        '})();\n'
    )
    return f'''<title>Éditeur Sarments</title>
<style>
{css}
</style>
<div id="app" hidden></div>
<div id="onboard" hidden></div>
<div id="modal" hidden></div>
<div id="present" hidden></div>
<div id="toasts" aria-live="polite"></div>
<div id="xhost" aria-hidden="true"></div>
<input type="file" id="filein" hidden>
<input type="file" id="jsonin" accept="application/json,.json" hidden>
<noscript>Cet éditeur a besoin de JavaScript.</noscript>
<script>
{script}</script>
'''


def build():
    os.makedirs(os.path.join(HERE, 'publish'), exist_ok=True)
    priv = bundle(True)
    with open(os.path.join(HERE, 'publish', 'editeur.html'), 'w', encoding='utf-8') as f:
        f.write(priv)
    pub = bundle(False)
    full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n'
            + pub + '</body></html>\n')
    with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(full)
    # aperçu local de la version privée (non versionné)
    with open(os.path.join(HERE, 'publish', 'apercu.html'), 'w', encoding='utf-8') as f:
        f.write(full.replace(pub, priv).replace('<meta charset="utf-8">', '<meta charset="utf-8"><base href="../">'))
    print('ok privé', len(priv) // 1024, 'Ko · public', len(pub) // 1024, 'Ko', '· Minion' if 'MinionPro-Regular' in priv else '· sans Minion')


if __name__ == '__main__':
    build()
