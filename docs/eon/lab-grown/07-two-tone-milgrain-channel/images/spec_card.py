"""EON-TMC9 galerisinin 10. karesi: ölçü kartı, YERELDE dizilir (kredi yok, metni ve ölçüyü model yazmaz).

Run: python3 -I docs/eon/lab-grown/07-two-tone-milgrain-channel/images/spec_card.py OUT.png

Tek kaynak: ../listing.json (iki tonlu bant 7 × 2,0 mm, dokuz 2,75 mm round taş, karat ve beden aralığı, kamuya
açık gram). Çizimler ölçekli: üstten görünüş 1 mm = 32 px, kesit 1 mm = 90 px. Kare 2400×1792 (galeriyle aynı 4:3).
Kesitte sarı orta, beyaz altın gövdeye oturan bir şerit olarak çizilir; iki tonun iç yapısını üretici doğrulamadı,
kart bunu "proportions of the design" diye sunar (EON-PC9 kartıyla aynı dipnot). Sıra uzunluğu (~25 mm) 9 × 2,75'ten
türer; kanal son taştan bir taş boyu öteye uzanıp yuvarlak biter (sahibin fotoğrafları).
Kural (second-brain 2026-09-11): yazı/ölçü taşıyan görsel modele bırakılmaz, elle dizilir.
"""
import json
import math
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
L = json.loads((HERE.parent / "listing.json").read_text())
B, S, D = L["band"], L["stone"], L["description"]
assert (B["widthMm"], B["thicknessMm"], S["count"], S["sizeMm"], S["shape"]) == (7, 2.0, 9, "2.75", "round")
assert [k["karat"] for k in L["karats"]] == ["10K", "14K", "18K"]
assert (L["sizes"]["from"], L["sizes"]["to"], L["sizes"]["step"]) == (4, 16, 0.5)
for phrase in ("About 7 mm wide and about 2 mm thick", "about 2.75 mm each", "channel set side by side",
               "closes in a rounded end", "About 10 grams in 14K at US 8.5", "US 4 to US 16, including half sizes",
               "white gold rails and a yellow gold centre", "milgrain bead line"):
    assert phrase in D, phrase
STONE_MM = float(S["sizeMm"])
ROW_MM = S["count"] * STONE_MM                     # 24,75 mm
ROW_TXT = f"about {round(ROW_MM)} mm"              # "about 25 mm"
RAIL_MM = B["widthMm"] * 2 / 5 / 2                 # sarı orta genişliğin beşte üçü → ray başına 1,4 mm

W, H = 2400, 1792
BG, INK, SOFT, RULE = (245, 242, 237), (42, 40, 38), (122, 116, 108), (222, 216, 207)
YG, YG_EDGE, YG_HI, YG_SHADE = (214, 182, 118), (150, 118, 62), (238, 216, 168), (182, 148, 88)
WG, WG_EDGE, WG_HI, WG_SHADE = (214, 215, 216), (126, 128, 132), (242, 243, 244), (178, 180, 183)
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
F_TITLE, F_SUB, F_LABEL, F_DIM, F_KEY, F_VAL, F_FOOT, F_TAG = (
    font(SERIF, 92), font(SANS, 34), font(SANS_M, 30), font(SANS, 28), font(SANS_M, 31), font(SANS, 31),
    font(SANS, 26), font(SANS, 25))

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)


def text(xy, s, f, fill=INK, anchor="la"):
    d.text(xy, s, font=f, fill=fill, anchor=anchor)


def dim_h(x0, x1, y, label, tick=14, below=False):
    d.line([(x0, y), (x1, y)], fill=SOFT, width=2)
    for x in (x0, x1):
        d.line([(x, y - tick), (x, y + tick)], fill=SOFT, width=2)
    text(((x0 + x1) / 2, y + 24 if below else y - 22), label, F_DIM, SOFT, "ma" if below else "ms")


def dim_v(x, y0, y1, label, tick=14):
    d.line([(x, y0), (x, y1)], fill=SOFT, width=2)
    for y in (y0, y1):
        d.line([(x - tick, y), (x + tick, y)], fill=SOFT, width=2)
    text((x + 26, (y0 + y1) / 2), label, F_DIM, SOFT, "lm")


def brilliant(x, y, r):
    """Üstten round brilliant: sekizgen tabla, ana faset çizgileri, yıldız fasetleri."""
    d.ellipse([x - r, y - r, x + r, y + r], fill=STONE, outline=FACET, width=2)
    t = r * 0.55
    angles = [math.pi / 8 + k * math.pi / 4 for k in range(8)]
    table = [(x + t * math.cos(a), y + t * math.sin(a)) for a in angles]
    d.polygon(table, outline=FACET)
    for k, a in enumerate(angles):
        d.line([table[k], (x + r * math.cos(a), y + r * math.sin(a))], fill=FACET, width=1)
        mid = a + math.pi / 8
        g = (x + r * math.cos(mid), y + r * math.sin(mid))
        d.line([table[k], g], fill=FACET, width=1)
        d.line([table[(k + 1) % 8], g], fill=FACET, width=1)


def bead_line(x0, x1, y, r, step):
    x = x0
    while x <= x1:
        d.ellipse([x - r, y - r, x + r, y + r], fill=WG_HI, outline=WG_EDGE, width=1)
        x += step


# ---- başlık
SUB = "Two tone solid gold band with nine round lab grown diamonds, channel set"
text((150, 120), "The details", F_TITLE)
text((154, 250), SUB, F_SUB, SOFT)
d.line([(150, 318), (W - 150, 318)], fill=RULE, width=2)

# ---- üstten görünüş (1 mm = 32 px): bant ±18,5 mm, sıra ±12,375 mm, kanal sıradan bir taş boyu uzun, uçlar yuvarlak
K = 32
cx, cy = 760, 650
half_len, bw = 18.5 * K, B["widthMm"] * K
top, bot = cy - bw / 2, cy + bw / 2
rail = RAIL_MM * K
d.rounded_rectangle([cx - half_len, top, cx + half_len, bot], radius=16, fill=WG, outline=WG_EDGE, width=3)
d.line([(cx - half_len + 18, top + 12), (cx + half_len - 18, top + 12)], fill=WG_HI, width=3)
d.line([(cx - half_len + 18, bot - 12), (cx + half_len - 18, bot - 12)], fill=WG_SHADE, width=3)
d.rectangle([cx - half_len + 2, top + rail, cx + half_len - 2, bot - rail], fill=YG, outline=YG_EDGE, width=2)
d.line([(cx - half_len + 14, cy - 34), (cx + half_len - 14, cy - 34)], fill=YG_HI, width=5)      # kubbe ışığı
bead_r, bead_step = 0.16 * K, 0.42 * K
bead_line(cx - half_len + 12, cx + half_len - 12, top + rail - 0.26 * K, bead_r, bead_step)
bead_line(cx - half_len + 12, cx + half_len - 12, bot - rail + 0.26 * K, bead_r, bead_step)
s = STONE_MM * K
row_half = ROW_MM / 2 * K
ch_half = row_half + s                                                                          # kanal: sıra + 1 taş
d.rounded_rectangle([cx - ch_half, cy - s / 2 - 3, cx + ch_half, cy + s / 2 + 3], radius=s / 2 + 3,
                    fill=YG_SHADE, outline=YG_EDGE, width=3)
for i in range(S["count"]):
    brilliant(cx - row_half + s / 2 + i * s, cy, s / 2 - 1)
dim_h(cx - row_half, cx + row_half, top - 46, f"{ROW_TXT}, nine stones")
dim_h(cx - row_half, cx - row_half + s, bot + 44, f"{STONE_MM:g} mm", tick=10, below=True)
dim_v(cx + half_len + 40, top, bot, f"{B['widthMm']:g} mm")
text((cx, bot + 130), "Top of the band", F_LABEL, INK, "ma")
text((cx, bot + 184), "The channel closes in a rounded end a little past the last stone.", F_DIM, SOFT, "ma")

# ---- kesit, taşların hizasından (1 mm = 90 px): 7 × 2,0 mm; raylar 1,75 mm, sarı kubbe ortada 2,0 mm
Q = 90
sx, sy = 1900, 660
w, t = B["widthMm"] * Q, B["thicknessMm"] * Q
x0, y0 = sx - w / 2, sy - t / 2                      # y0 = kubbenin tepesi
yb = y0 + t                                          # iç yüzey
rail_top = yb - 1.75 * Q
rq = rail * Q / K                                    # ray genişliği kesit ölçeğinde
c_half = w / 2 - rq                                  # sarı ortanın yarı genişliği


def dome_y(x):
    u = (x - sx) / c_half
    return y0 + (rail_top - y0) * u * u


outline = [(x0 + 22, yb), (x0 + w - 22, yb), (x0 + w, yb - 22), (x0 + w, rail_top + 30)]
outline += [(x0 + w - 30 + 30 * math.cos(a), rail_top + 30 - 30 * math.sin(a))
            for a in [k * math.pi / 2 / 8 for k in range(9)]]
outline += [(x0 + w - rq, rail_top)]
outline += [(sx + c_half - k * c_half / 20, dome_y(sx + c_half - k * c_half / 20)) for k in range(41)]
outline += [(x0 + rq, rail_top), (x0 + 30, rail_top)]
outline += [(x0 + 30 - 30 * math.sin(a), rail_top + 30 - 30 * math.cos(a))
            for a in [k * math.pi / 2 / 8 for k in range(9)]]
outline += [(x0, yb - 22)]
d.polygon(outline, fill=WG, outline=WG_EDGE)
inlay_floor = yb - 0.8 * Q
inlay = [(sx - c_half, rail_top)] + [(sx - c_half + k * c_half / 20, dome_y(sx - c_half + k * c_half / 20))
                                     for k in range(41)] + [(sx + c_half, rail_top), (sx + c_half, inlay_floor),
                                                            (sx - c_half, inlay_floor)]
d.polygon(inlay, fill=YG, outline=YG_EDGE)
for bx in (x0 + rq - 0.26 * Q, x0 + w - rq + 0.26 * Q):                                       # milgrain profilde
    d.ellipse([bx - 0.16 * Q, rail_top - 0.22 * Q, bx + 0.16 * Q, rail_top + 0.1 * Q], fill=WG_HI, outline=WG_EDGE)
cw = STONE_MM * Q
crown_top = y0 + 0.1 * Q
girdle_t = crown_top + 0.15 * STONE_MM * Q
girdle_b = girdle_t + 0.03 * STONE_MM * Q
culet = girdle_b + 0.43 * STONE_MM * Q
assert culet < yb - 0.15 * Q, "taş iç yüzeyden taşar"
d.rectangle([sx - cw / 2, dome_y(sx - cw / 2), sx + cw / 2, girdle_b], fill=YG_SHADE)            # kanalın arka duvarı
tb = 0.56 * STONE_MM * Q / 2
stone = [(sx - tb, crown_top), (sx + tb, crown_top), (sx + cw / 2, girdle_t), (sx + cw / 2, girdle_b),
         (sx, culet), (sx - cw / 2, girdle_b), (sx - cw / 2, girdle_t)]
d.polygon(stone, fill=STONE, outline=FACET)
d.line([(sx - cw / 2, girdle_t), (sx + cw / 2, girdle_t)], fill=FACET, width=2)
for px in (sx - tb, sx + tb):
    d.line([(px, crown_top), (sx, culet)], fill=FACET, width=1)
for lx, ly, label in ((x0 + rq / 2, rail_top + 10, "White gold"), (sx + c_half - 30, dome_y(sx + c_half - 30) + 8,
                                                                   "Yellow gold")):
    d.line([(lx, y0 - 66), (lx, ly)], fill=SOFT, width=2)
    text((lx, y0 - 78), label, F_TAG, SOFT, "ms")
text((sx, yb + 150), "Cross-section at the stones", F_LABEL, INK, "ma")
dim_h(x0, x0 + w, yb + 54, f"{B['widthMm']:g} mm", below=True)
dim_v(x0 + w + 44, y0, yb, f"{B['thicknessMm']:g} mm")

# ---- künye: iki sütun, sütun başına en çok dört satır
rows = [
    ("Metal", "Solid gold in two tones, 10K, 14K or 18K"),
    ("Design", "White gold milgrain rails, yellow gold dome"),
    ("Stones", f"Nine round lab grown diamonds, about {STONE_MM:g} mm each"),
    ("Setting", "Channel set side by side, no prongs"),
    ("Band", f"About {B['widthMm']:g} mm wide and {B['thicknessMm']:g} mm thick"),
    ("Sizes", f"US {L['sizes']['from']} to US {L['sizes']['to']}, half sizes included"),
    ("Weight", "About 10 grams in 14K at US 8.5"),
]
d.line([(150, 1060), (W - 150, 1060)], fill=RULE, width=2)
for i, (k, v) in enumerate(rows):
    col, r = divmod(i, 4)
    x, y = 150 + col * 1080, 1130 + r * 92
    right_edge = (150 + 1080 - 40) if col == 0 else (W - 150)
    assert x + 190 + d.textlength(v, font=F_VAL) <= right_edge, f"taşan satır: {v}"
    text((x, y), k, F_KEY)
    text((x + 190, y), v, F_VAL, SOFT)
text((150, H - 150), "Drawings show the proportions of the design; sizes are approximate.", F_FOOT, SOFT)

# ---- kapı: kartın bütün metni FTC niteleyicisini taşır, karat (ct) yazmaz
words = " ".join(v for _, v in rows) + " " + SUB
assert not re.search(r"(?<!lab grown )\bdiamonds?\b", words, re.I)
assert not re.search(r"\bct\b|carat", words, re.I)

out = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "spec_card.png"
img.save(out)
print(f"wrote {out} {img.size}")
