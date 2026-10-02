# -*- coding: utf-8 -*-
"""Convertit MinionPro-Regular.otf (CFF) en TrueType sous-ensemble pour l'éditeur.
Usage : python3 tools_minion.py chemin/vers/MinionPro-Regular.otf
Le résultat va dans src/private/ (non versionné : police sous licence)."""
import sys, os
from fontTools.ttLib import TTFont, newTable
from fontTools import subset
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen

src = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(HERE, 'src', 'private', 'MinionPro-Regular.ttf')

UNI = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + list(range(0x2000, 0x2070)) + \
    list(range(0x2080, 0x20A0)) + [0x20AC, 0x2122, 0x2116, 0x2212, 0x2190, 0x2192, 0x2191, 0x2193, 0x2248, 0x2260, 0x2264, 0x2265, 0x00D7, 0x02C6, 0x02DC]
f = TTFont(src)
opts = subset.Options()
opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'onum', 'lnum', 'pnum', 'tnum', 'case']
opts.name_IDs = ['*']
opts.notdef_outline = True
opts.glyph_names = True
sub = subset.Subsetter(opts)
sub.populate(unicodes=UNI)
sub.subset(f)

# Courbes cubiques (CFF) -> quadratiques (glyf), seul format lu par le générateur de PDF
order = f.getGlyphOrder()
gs = f.getGlyphSet()
glyphs = {}
for name in order:
    tt = TTGlyphPen(gs)
    gs[name].draw(Cu2QuPen(tt, 1.0, reverse_direction=True))
    glyphs[name] = tt.glyph()
# espace fine insécable (U+202F) et espace fine (U+2009) : absentes de la Minion
thin = 'uni202F'
order.append(thin)
glyphs[thin] = TTGlyphPen(None).glyph()
f.setGlyphOrder(order)
f['loca'] = newTable('loca')
glyf = f['glyf'] = newTable('glyf')
glyf.glyphOrder = order
glyf.glyphs = glyphs
del f['CFF ']
for t in ('VORG', 'DSIG'):
    if t in f: del f[t]
hmtx = f['hmtx']
for name, g in glyphs.items():
    if name == thin:
        hmtx.metrics[name] = (150, 0)
        continue
    adv, _ = hmtx.metrics[name]
    g.recalcBounds(glyf)
    hmtx.metrics[name] = (adv, getattr(g, 'xMin', 0))
for t in f['cmap'].tables:
    if t.isUnicode():
        t.cmap[0x202F] = thin
        t.cmap[0x2009] = thin
maxp = f['maxp'] = newTable('maxp')
maxp.tableVersion = 0x00010000
for k in ('maxZones', 'maxTwilightPoints', 'maxStorage', 'maxFunctionDefs', 'maxInstructionDefs', 'maxStackElements', 'maxSizeOfInstructions'):
    setattr(maxp, k, 1 if k == 'maxZones' else 0)
maxp.maxComponentElements = 0
post = f['post']
post.formatType = 2.0
post.extraNames = []
post.mapping = {}
post.glyphOrder = order
f['head'].indexToLocFormat = 0
f['head'].glyphDataFormat = 0
f.sfntVersion = '\x00\x01\x00\x00'
f.save(out)
g = TTFont(out)
print('ok', out, os.path.getsize(out) // 1024, 'Ko', len(g.getGlyphOrder()), 'glyphes', 'cmap', len(g.getBestCmap()))
