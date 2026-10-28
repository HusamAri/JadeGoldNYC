"""Leander brand system: builds every SVG lockup from one source of truth.

Usage: python3 build.py <font_dir> <out_dir>

font_dir holds cormorant-500.ttf (Cormorant Garamond instantiated at wght 500),
plexmono.ttf (IBM Plex Mono Regular). Text is shaped with HarfBuzz and written as
outlines, so the SVGs carry no font dependency.

Palette is the shop's own (docs/artifact-studio/pinterest/render.py): ivory paper,
ink, one warm gold. Nothing else, no gradients, no metallic rendering.
"""
import os
import sys

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS, OUT = sys.argv[1:3]
os.makedirs(OUT, exist_ok=True)

IVORY = "#F4EFE7"
INK = "#1C1A17"
GOLD = "#A8834A"

WORD = "leander"
DESCRIPTOR = "SOLID GOLD · MADE TO ORDER"


class Face:
    def __init__(self, path):
        self.tt = TTFont(path)
        self.upm = self.tt["head"].unitsPerEm
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        blob = hb.Blob.from_file_path(path)
        self.hb_font = hb.Font(hb.Face(blob))

    def shape(self, text, size, tracking=0.0, features=None):
        """Returns (path_d, width) for text at size px, tracking in em."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb_font, buf, features or {})
        scale = size / self.upm
        x = 0.0
        d = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.order[info.codepoint]
            pen = SVGPathPen(self.glyphs, ntos=lambda v: f"{v:.2f}")
            tpen = TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale))
            self.glyphs[name].draw(tpen)
            cmd = pen.getCommands()
            if cmd:
                d.append(cmd)
            x += pos.x_advance * scale + tracking * size
        width = x - tracking * size  # no trailing track
        return " ".join(d), width


serif = Face(os.path.join(FONTS, "cormorant-500.ttf"))
mono = Face(os.path.join(FONTS, "plexmono.ttf"))

LNUM = {"lnum": True}


def mark_paths(x, y, s, ink=INK, gold=GOLD):
    """The mark: an L that is the tower on the near shore and the water, with Hero's
    lamp lit on the far shore, above the end of the water line.

    s is the side of the mark's square. Stroke is 6% of s (survives a 1.5 mm
    engraving and a 32 px favicon). The lamp is the only gold in the system. The
    lamp sits at the far end, never above the tower: above the tower it reads as
    the dot of a lowercase i.
    """
    w = s * 0.06
    vx = x + s * 0.24            # tower axis
    top = y + s * 0.22           # tower top
    base = y + s * 0.76          # water line
    right = x + s * 0.80
    r = s * 0.065                # lamp radius
    cx = right - r               # lamp on the far shore
    cy = base - w / 2 - r - s * 0.10
    return (
        f'<path d="M{vx:.2f} {top:.2f} V{base:.2f} H{right:.2f}" fill="none" '
        f'stroke="{ink}" stroke-width="{w:.2f}" stroke-linecap="butt" stroke-linejoin="miter"/>'
        f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{gold}"/>'
    )


def svg(w, h, body, bg=None):
    bgrect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
        f"{bgrect}{body}</svg>"
    )


def write(name, content):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(content)
    print("wrote", name)


def wordmark(size, x=0, y=0, fill=INK):
    d, w = serif.shape(WORD, size, tracking=0.06)
    return f'<path transform="translate({x:.2f} {y:.2f})" d="{d}" fill="{fill}"/>', w


def descriptor(size, x=0, y=0, fill=GOLD):
    d, w = mono.shape(DESCRIPTOR, size, tracking=0.22, features=LNUM)
    return f'<path transform="translate({x:.2f} {y:.2f})" d="{d}" fill="{fill}"/>', w


# 1. Wordmark alone (ink on transparent). Cap height sits on y = baseline.
S = 200
wm, ww = wordmark(S)
W = int(ww + S * 0.2)
H = int(S * 1.05)
write("leander-wordmark.svg", svg(W, H, f'<g transform="translate({S*0.1:.2f} {S*0.72:.2f})">{wm}</g>'))

# 2. Mark alone (ink + gold on transparent), square.
write("leander-mark.svg", svg(400, 400, mark_paths(0, 0, 400)))

# 3. Maker's mark: single colour, for engraving inside bands (1.5 mm tall) and for stamps.
write("leander-makers-mark.svg", svg(400, 400, mark_paths(0, 0, 400, ink=INK, gold=INK)))

# 4. Horizontal lockup: mark, wordmark, descriptor under the wordmark.
S = 160
m = S * 1.15
wm, ww = wordmark(S)
ds, dw = descriptor(S * 0.11)
gap = S * 0.28
W = int(m + gap + max(ww, dw) + S * 0.3)
H = int(m + S * 0.2)
body = mark_paths(S * 0.15, S * 0.1, m)
body += f'<g transform="translate({S*0.15 + m + gap:.2f} {S*0.1 + m*0.62:.2f})">{wm}</g>'
body += f'<g transform="translate({S*0.15 + m + gap + S*0.02:.2f} {S*0.1 + m*0.62 + S*0.30:.2f})">{ds}</g>'
write("leander-lockup-horizontal.svg", svg(W, H, body))

# 5. Stacked lockup: mark above wordmark above descriptor, centred.
S = 160
m = S * 1.1
wm, ww = wordmark(S)
ds, dw = descriptor(S * 0.105)
W = int(max(ww, dw) + S * 0.8)
H = int(m + S * 1.45)
cx = W / 2
body = mark_paths(cx - m / 2, S * 0.1, m)
body += f'<g transform="translate({cx - ww/2:.2f} {S*0.1 + m + S*0.62:.2f})">{wm}</g>'
body += f'<g transform="translate({cx - dw/2:.2f} {S*0.1 + m + S*0.62 + S*0.30:.2f})">{ds}</g>'
write("leander-lockup-stacked.svg", svg(W, H, body))

# 6. Etsy shop icon 500x500: ivory, mark inside the 60 percent safe circle (Etsy crops round).
s = 500 * 0.56
write("leander-etsy-icon.svg", svg(500, 500, mark_paths(250 - s / 2, 250 - s / 2, s), bg=IVORY))

# 7. Favicon 32x32: ivory, mark only, strokes snapped to whole pixels.
fav = (
    '<path d="M8 7 V25 H26" fill="none" stroke="%s" stroke-width="2"/>'
    '<circle cx="23.5" cy="18.5" r="2.5" fill="%s"/>' % (INK, GOLD)
)
write("leander-favicon.svg", svg(32, 32, fav, bg=IVORY))

# 8. Etsy banner 1200x300: ivory, horizontal lockup left, the rest is paper.
S = 92
m = S * 1.15
wm, ww = wordmark(S)
ds, dw = descriptor(S * 0.11)
x0, y0 = 96, 150 - m / 2
body = mark_paths(x0, y0, m)
body += f'<g transform="translate({x0 + m + S*0.3:.2f} {y0 + m*0.62:.2f})">{wm}</g>'
body += f'<g transform="translate({x0 + m + S*0.3 + S*0.02:.2f} {y0 + m*0.62 + S*0.30:.2f})">{ds}</g>'
write("leander-etsy-banner.svg", svg(1200, 300, body, bg=IVORY))

# 9. Reversed: ink paper, ivory wordmark, gold lamp (packaging, dark surfaces).
S = 160
m = S * 1.1
d, ww = serif.shape(WORD, S, tracking=0.06)
ds, dw = descriptor(S * 0.105, fill=GOLD)
W = int(max(ww, dw) + S * 0.8)
H = int(m + S * 1.45)
cx = W / 2
body = mark_paths(cx - m / 2, S * 0.1, m, ink=IVORY, gold=GOLD)
body += f'<path transform="translate({cx - ww/2:.2f} {S*0.1 + m + S*0.62:.2f})" d="{d}" fill="{IVORY}"/>'
body += f'<g transform="translate({cx - dw/2:.2f} {S*0.1 + m + S*0.62 + S*0.30:.2f})">{ds}</g>'
write("leander-lockup-stacked-reversed.svg", svg(W, H, body, bg=INK))
