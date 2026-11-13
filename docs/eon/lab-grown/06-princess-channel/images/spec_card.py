"""EON-PC9 galerisinin 10. karesi: ölçü kartı, YERELDE dizilir (kredi yok, metni ve ölçüyü model yazmaz).

Run: /usr/bin/python3 -I docs/eon/lab-grown/06-princess-channel/images/spec_card.py OUT.png

Tek kaynak: ../listing.json (bant 3 × 1,8 mm, dokuz 2 mm prenses taş, ~18 mm sıra, beden aralığı, kamuya açık gram).
Çizimler ölçekli: üstten görünüş 1 mm = 42 px, kesit 1 mm = 120 px. Kare 2400×1792 (galeriyle aynı 4:3).
Kural (second-brain 2026-09-11): yazı/ölçü taşıyan görsel modele bırakılmaz, elle dizilir.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
L = json.loads((HERE.parent / "listing.json").read_text())
B, S = L["band"], L["stone"]
assert (B["widthMm"], B["thicknessMm"], S["count"], S["sizeMm"], S["shape"]) == (3, 1.8, 9, "2.0", "princess")
STONE_MM = float(S["sizeMm"])
ROW_MM = S["count"] * STONE_MM
assert ROW_MM == 18 and "about 18 mm long" in L["description"]
assert "About 4 grams in US 8.5" in L["description"]

W, H = 2400, 1792
BG, INK, SOFT, RULE = (245, 242, 237), (42, 40, 38), (122, 116, 108), (222, 216, 207)
GOLD, GOLD_EDGE, GOLD_HI, GOLD_SHADE = (214, 182, 118), (150, 118, 62), (236, 214, 166), (184, 150, 90)
STONE, FACET = (229, 234, 239), (160, 170, 182)


def font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)


SERIF = ["/root/.fonts/Prata-Regular.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"]
SANS = ["/usr/share/fonts/opentype/inter/Inter-Regular.otf"]
SANS_M = ["/usr/share/fonts/opentype/inter/Inter-Medium.otf"]
F_TITLE, F_SUB, F_LABEL, F_DIM, F_KEY, F_VAL, F_FOOT = (
    font(SERIF, 92), font(SANS, 34), font(SANS_M, 30), font(SANS, 28), font(SANS_M, 31), font(SANS, 31), font(SANS, 26))

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)


def text(xy, s, f, fill=INK, anchor="la"):
    d.text(xy, s, font=f, fill=fill, anchor=anchor)


def dim_h(x0, x1, y, label, tick=14, below=False):
    d.line([(x0, y), (x1, y)], fill=SOFT, width=2)
    for x in (x0, x1):
        d.line([(x, y - tick), (x, y + tick)], fill=SOFT, width=2)
    if below:
        text(((x0 + x1) / 2, y + 24), label, F_DIM, SOFT, "ma")
    else:
        text(((x0 + x1) / 2, y - 22), label, F_DIM, SOFT, "ms")


def dim_v(x, y0, y1, label, tick=14, side="r"):
    d.line([(x, y0), (x, y1)], fill=SOFT, width=2)
    for y in (y0, y1):
        d.line([(x - tick, y), (x + tick, y)], fill=SOFT, width=2)
    if side == "r":
        text((x + 26, (y0 + y1) / 2), label, F_DIM, SOFT, "lm")
    else:
        text((x - 26, (y0 + y1) / 2), label, F_DIM, SOFT, "rm")


def princess(x0, y0, size):
    """Üstten prenses taş: kare, köşeden köşeye X fasetleri, iç kare tabla."""
    d.rectangle([x0, y0, x0 + size, y0 + size], fill=STONE, outline=FACET, width=2)
    d.line([(x0, y0), (x0 + size, y0 + size)], fill=FACET, width=2)
    d.line([(x0 + size, y0), (x0, y0 + size)], fill=FACET, width=2)
    m = size * 0.28
    d.rectangle([x0 + m, y0 + m, x0 + size - m, y0 + size - m], outline=FACET, width=2)


# ---- başlık
text((150, 120), "The details", F_TITLE)
text((154, 250), "Solid 14K gold band with nine princess cut lab grown diamonds, channel set", F_SUB, SOFT)
d.line([(150, 318), (W - 150, 318)], fill=RULE, width=2)

# ---- üstten görünüş (1 mm = 42 px): bant ±13 mm, sıra ±9 mm, raylar 0,5 mm
K = 42
cx, cy = 720, 640
band_half_len, band_w = 13 * K, B["widthMm"] * K
top, bot = cy - band_w / 2, cy + band_w / 2
d.rounded_rectangle([cx - band_half_len, top, cx + band_half_len, bot], radius=18, fill=GOLD, outline=GOLD_EDGE, width=3)
d.line([(cx - band_half_len + 20, top + 10), (cx + band_half_len - 20, top + 10)], fill=GOLD_HI, width=4)
row_half = ROW_MM / 2 * K
rail = (B["widthMm"] - STONE_MM) / 2 * K
d.rectangle([cx - row_half - 6, top + rail - 4, cx + row_half + 6, bot - rail + 4], fill=GOLD_EDGE)   # kanal + uç duvarları
s = STONE_MM * K
for i in range(S["count"]):
    princess(cx - row_half + i * s, top + rail, s)
text((cx, bot + 130), "Top of the band", F_LABEL, INK, "ma")
dim_h(cx - row_half, cx + row_half, top - 46, f"about {ROW_MM:g} mm, nine stones")
dim_h(cx - row_half, cx - row_half + s, bot + 44, f"{STONE_MM:g} mm", tick=10, below=True)
dim_v(cx + band_half_len + 40, top, bot, f"{B['widthMm']:g} mm")
text((cx, bot + 184), "A flat polished wall of gold closes each end of the row.", F_DIM, SOFT, "ma")

# ---- kesit (1 mm = 120 px): 3 × 1,8 mm, üstte 2 mm kanal, taşın tepesi raylarla aynı hizada
Q = 120
sx, sy = 1880, 660
w, t = B["widthMm"] * Q, B["thicknessMm"] * Q
x0, y0 = sx - w / 2, sy - t / 2
d.rounded_rectangle([x0, y0, x0 + w, y0 + t], radius=26, fill=GOLD, outline=GOLD_EDGE, width=3)
cw, depth = STONE_MM * Q, 1.4 * Q
d.rectangle([sx - cw / 2, y0, sx + cw / 2, y0 + depth], fill=GOLD_SHADE)                 # kanalın iç duvarı (kesit düzleminin arkası)
crown = 0.35 * Q
d.polygon([(sx - cw / 2, y0), (sx + cw / 2, y0), (sx + cw / 2, y0 + crown), (sx, y0 + depth),
           (sx - cw / 2, y0 + crown)], fill=STONE, outline=FACET)                            # prenses taş kesiti
d.line([(sx - cw / 2, y0 + crown), (sx + cw / 2, y0 + crown)], fill=FACET, width=2)
d.line([(x0 + 3, y0), (sx - cw / 2, y0)], fill=GOLD_EDGE, width=3)
d.line([(sx + cw / 2, y0), (x0 + w - 3, y0)], fill=GOLD_EDGE, width=3)
text((sx, y0 + t + 120), "Cross-section", F_LABEL, INK, "ma")
dim_h(x0, x0 + w, y0 + t + 54, f"{B['widthMm']:g} mm")
dim_v(x0 + w + 44, y0, y0 + t, f"{B['thicknessMm']:g} mm")

# ---- künye
rows = [
    ("Metal", "Solid 14K gold: yellow, white or rose"),
    ("Stones", f"Nine princess cut lab grown diamonds, about {STONE_MM:g} mm square"),
    ("Setting", "Channel set edge to edge, no prongs"),
    ("Band", f"About {B['widthMm']:g} mm wide and {B['thicknessMm']:g} mm thick, flat top"),
    ("Sizes", f"US {L['sizes']['from']} to US {L['sizes']['to']}, half sizes included"),
    ("Weight", "About 4 grams in US 8.5"),
]
d.line([(150, 1060), (W - 150, 1060)], fill=RULE, width=2)
for i, (k, v) in enumerate(rows):
    col, r = divmod(i, 3)
    x, y = 150 + col * 1080, 1130 + r * 96
    text((x, y), k, F_KEY)
    text((x + 190, y), v, F_VAL, SOFT)
text((150, H - 150), "Drawings show the proportions of the design; sizes are approximate.", F_FOOT, SOFT)

# ---- kapı: kartın bütün metni FTC niteleyicisini taşır, karat yazmaz
words = " ".join(v for _, v in rows) + " Solid 14K gold band with nine princess cut lab grown diamonds, channel set"
assert not re.search(r"(?<!lab grown )\bdiamonds?\b", words, re.I)
assert not re.search(r"\bct\b|carat", words, re.I)

out = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "spec_card.png"
img.save(out)
print(f"wrote {out} {img.size}")
