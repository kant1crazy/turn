# -*- coding: utf-8 -*-
"""Assemble l'éditeur en une seule page HTML.

- index.html          : document complet, à ouvrir via un petit serveur local
- publish/editeur.html: même contenu, sans squelette (pour la publication en artifact)
"""
import base64, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src')
FONTS = ['CrimsonPro-Regular', 'CrimsonPro-SemiBold', 'CrimsonPro-Italic', 'CrimsonPro-SemiBoldItalic',
         'InstrumentSans-Regular', 'InstrumentSans-SemiBold']
JS = ['core.js', 'store.js', 'render.js', 'templates.js', 'editor.js', 'panels.js', 'present.js', 'export.js']


def read(name):
    with open(os.path.join(SRC, name), encoding='utf-8') as f:
        return f.read()


def build():
    fontdata = {n: base64.b64encode(open(os.path.join(SRC, n + '.ttf'), 'rb').read()).decode() for n in FONTS}
    cov = json.load(open(os.path.join(SRC, 'coverage.json')))
    css = read('ui.css') + '\n' + read('page.css')
    js = '\n'.join(read(n) for n in JS)
    script = (
        '(() => {\n'
        f'const FONTDATA = {json.dumps(fontdata)};\n'
        f'const FONTCOV = {json.dumps(cov, separators=(",", ":"))};\n'
        f'const V1SIG = {json.dumps(json.load(open(os.path.join(SRC, "v1sig.json"), encoding="utf-8")), ensure_ascii=False, separators=(",", ":"))};\n'
        + js +
        '\nwindow.__ed = { S, SAVE, buildPDF, buildDossier, renderPage, goPage, startPresent, stopPresent, flushSave, createFromTemplate, sanitizeHTML, checkTemplateUpdate, pageSig };\n'
        'boot().catch(e => { console.error(e); const o = document.getElementById("onboard"); if (o) { o.hidden = false; o.textContent = "Erreur au démarrage : " + (e && e.message || e); } });\n'
        '})();\n'
    )
    body = f'''<title>Éditeur Sarments</title>
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
    os.makedirs(os.path.join(HERE, 'publish'), exist_ok=True)
    with open(os.path.join(HERE, 'publish', 'editeur.html'), 'w', encoding='utf-8') as f:
        f.write(body)
    full = ('<!doctype html><html lang="fr"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n'
            + body + '</body></html>\n')
    with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(full)
    print('ok', len(body) // 1024, 'Ko')


if __name__ == '__main__':
    build()
