"""Leander brand system, direction A "Horizon": builds every SVG from one source.

Usage: python3 build.py <font_dir> <out_dir>

font_dir holds hanken-300.ttf, hanken-400.ttf, hanken-500.ttf (Hanken Grotesk
variable instantiated at wght 300/400/500). Text is shaped with HarfBuzz and
written as outlines, so the SVGs carry no font dependency.

Palette is the shop's own (docs/artifact-studio/pinterest/render.py): ivory
paper, ink, one warm gold. No gradients, no metallic rendering.

System in one sentence: the wordmark is LEANDER in light grotesk capitals with
wide tracking; the mark is a hairline (the water) with one gold point above its
far end (Hero's lamp). The point is the only colour.
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

WORD = "LEANDER"
DESCRIPTOR = "SOLID GOLD · MADE TO ORDER"

TRACK_WORD = 0.46       # em, wordmark
TRACK_SUB = 0.34        # em, descriptor


class Face:
    def __init__(self, path):
        self.tt = TTFont(path)
        self.upm = self.tt["head"].unitsPerEm
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.hb_font = hb.Font(hb.Face(hb.Blob.from_file_path(path)))

    def shape(self, text, size, tracking=0.0):
        """Returns (path_d, width). Baseline at y = 0, y grows downward."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb_font, buf, {"kern": True, "lnum": True})
        scale = size / self.upm
        x = 0.0
        d = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.order[info.codepoint]
            pen = SVGPathPen(self.glyphs, ntos=lambda v: f"{v:.2f}")
            tpen = TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale))
            self.glyphs[name].draw(tpen)
            if pen.getCommands():
                d.append(pen.getCommands())
            x += pos.x_advance * scale + tracking * size
        return " ".join(d), x - tracking * size


light = Face(os.path.join(FONTS, "hanken-300.ttf"))
regular = Face(os.path.join(FONTS, "hanken-400.ttf"))
medium = Face(os.path.join(FONTS, "hanken-500.ttf"))

CAP = 0.70  # Hanken cap height in em, used to centre the word on the mark


def word(size, fill=INK, face=None):
    """Wordmark. Light at 24 px and above, Regular under 24 px, Medium under 12 px."""
    face = face or (light if size >= 24 else regular if size >= 12 else medium)
    d, w = face.shape(WORD, size, TRACK_WORD)
    return d, w


def sub(size, fill=GOLD):
    d, w = regular.shape(DESCRIPTOR, size, TRACK_SUB)
    return d, w


def mark(x, y, L, ink=INK, gold=GOLD):
    """Hairline of length L at y, gold point above its far end.

    Stroke = L/60, point radius = L/30, point centre sits L/10 above the line.
    Returns (svg, height) where height spans from the point top to the line.
    """
    w = max(L / 60, 0.75)
    r = L / 30
    cx = x + L - r
    cy = y - L / 10
    s = (
        f'<rect x="{x:.2f}" y="{y - w/2:.2f}" width="{L:.2f}" height="{w:.2f}" fill="{ink}"/>'
        f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{gold}"/>'
    )
    return s, (L / 10 + r)


def path(d, x, y, fill):
    return f'<path transform="translate({x:.2f} {y:.2f})" d="{d}" fill="{fill}"/>'


def svg(w, h, body, bg=None):
    bgrect = f'<rect width="{w:.0f}" height="{h:.0f}" fill="{bg}"/>' if bg else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" '
        f'width="{w:.0f}" height="{h:.0f}">{bgrect}{body}</svg>'
    )


def write(name, content):
    with open(os.path.join(OUT, name), "w") as f:
        f.write(content)
    print("wrote", name)


def stacked(size, ink=INK, gold=GOLD, bg=None, pad=None, with_sub=True):
    """Mark above wordmark above descriptor, centred. size = wordmark size."""
    d, ww = word(size, face=light)
    sd, sw = sub(size * 0.265)
    L = size * 3.5
    pad = size * 1.2 if pad is None else pad
    W = max(ww, L, sw) + 2 * pad
    cx = W / 2
    y = pad + L / 10 + L / 30            # mark line y (point above it fits in pad)
    m, mh = mark(cx - L / 2, y, L, ink, gold)
    ty = y + size * 1.18 + size * CAP     # wordmark baseline
    body = m + path(d, cx - ww / 2, ty, ink)
    if with_sub:
        sy = ty + size * 0.62 + size * 0.265 * CAP
        body += path(sd, cx - sw / 2, sy, gold)
        H = sy + pad
    else:
        H = ty + pad
    return svg(W, H, body, bg), W, H


def horizontal(size, ink=INK, gold=GOLD, bg=None, pad=None):
    """Mark on the left, wordmark to its right on the line's level, descriptor under the wordmark."""
    d, ww = word(size, face=light)
    sd, sw = sub(size * 0.265)
    L = size * 2.6
    pad = size * 1.0 if pad is None else pad
    gap = size * 1.1
    x0 = pad
    cap_mid = size * CAP / 2
    ty = pad + L / 10 + L / 30 + size * CAP      # wordmark baseline
    y = ty - cap_mid                               # hairline at the cap mid-height
    m, mh = mark(x0, y, L, ink, gold)
    body = m + path(d, x0 + L + gap, ty, ink)
    sy = ty + size * 0.62 + size * 0.265 * CAP
    body += path(sd, x0 + L + gap + size * 0.02, sy, gold)
    W = x0 + L + gap + max(ww, sw) + pad
    H = sy + pad
    return svg(W, H, body, bg), W, H


# 1. Wordmark alone, Light, ink on transparent (24 px and above).
S = 120
d, ww = word(S, face=light)
write("leander-wordmark.svg", svg(ww + S * 0.4, S * 1.1, path(d, S * 0.2, S * 0.2 + S * CAP, INK)))

# 1b. Wordmark small, Regular, for signatures under 24 px (corner of photos, invoices).
S = 16
d, ww = word(S, face=regular)
write("leander-wordmark-small.svg", svg(ww + S, S * 1.4, path(d, S * 0.5, S * 0.35 + S * CAP, INK)))

# 2. Mark alone: hairline and point, ink and gold on transparent.
L = 360
m, mh = mark(20, 80, L)
write("leander-mark.svg", svg(400, 100, m))

# 3. Maker's mark: single colour, for engraving inside bands (1.5 mm tall) and stamps.
m1, _ = mark(20, 80, 360, ink=INK, gold=INK)
write("leander-makers-mark.svg", svg(400, 100, m1))

# 4. Stacked lockup (primary).
s, W, H = stacked(64)
write("leander-lockup-stacked.svg", s)

# 5. Stacked reversed: ink paper, ivory wordmark and line, gold point.
s, W, H = stacked(64, ink=IVORY, bg=INK)
write("leander-lockup-stacked-reversed.svg", s)

# 6. Horizontal lockup.
s, W, H = horizontal(48)
write("leander-lockup-horizontal.svg", s)

# 7. Etsy shop icon 500 x 500: ivory, mark inside the 60 percent safe circle.
L = 170
m, mh = mark(250 - L / 2, 262, L)
write("leander-etsy-icon-line.svg", svg(500, 500, m, bg=IVORY))

# 7b. Etsy icon, primary: single L (Light) with the point. Etsy shows the icon at 170 px
# in search and 75 px in messages; the hairline disappears there, the letter does not.
def letter(size, ink=INK, gold=GOLD):
    d, lw = light.shape("L", size, 0)
    r = size * 0.04
    pt = f'<circle cx="{lw + size*0.19:.2f}" cy="{-size*CAP + r + size*0.02:.2f}" r="{r:.2f}" fill="{gold}"/>'
    return f'<path d="{d}" fill="{ink}"/>' + pt, lw + size * 0.19 + r

lt, lw = letter(230)
write("leander-etsy-icon.svg", svg(500, 500, f'<g transform="translate({250 - lw/2:.2f} {250 + 230*CAP/2:.2f})">{lt}</g>', bg=IVORY))

# 7c. Maker's mark, letter form: L and point in one colour, for engraving inside bands.
lt, lw = letter(230, gold=INK)
write("leander-makers-mark-letter.svg", svg(lw + 40, 230 * CAP + 40, f'<g transform="translate(20 {230*CAP + 20:.2f})">{lt}</g>'))

# 8. Favicon 32 x 32: ivory, whole-pixel hairline and a 3 px point.
fav = f'<rect x="6" y="19" width="20" height="1" fill="{INK}"/><circle cx="24.5" cy="13.5" r="2.5" fill="{GOLD}"/>'
write("leander-favicon.svg", svg(32, 32, fav, bg=IVORY))

# 9. Etsy big banner 1200 x 300: ivory, stacked lockup centred, lots of paper.
s, W, H = stacked(40, pad=0, with_sub=True)
inner = s.split(">", 1)[1].rsplit("</svg>", 1)[0]
body = f'<g transform="translate({(1200 - W)/2:.2f} {(300 - H)/2:.2f})">{inner}</g>'
write("leander-etsy-banner.svg", svg(1200, 300, body, bg=IVORY))
