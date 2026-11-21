"""EON-SDE6 galerisinin 10. karesi: ölçü kartı, YERELDE dizilir (kredi yok, metni ve ölçüyü model yazmaz).

Run: python3 -I docs/eon/lab-grown/09-satin-diamond-edge/images/spec_card.py OUT.png

Tek kaynak: ../listing.json (6,0 × 1,8 mm bant, iki kenarda 45° pah, her pahta tam tur tek sıra ~1,3 mm round taş, beden
aralığı, resize yok). Çizimler ölçekli: (1) halka eksenden (yan yüz), 1 mm = 24 px, US 8½ tasarım ölçüsü: iç çap
18,54 mm, iç dudak 0,8 mm, pah 1,0 mm, taş merkezleri 1,5 mm adımla tam tur; (2) bant kesiti, 1 mm = 130 px: 6,0 × 1,8 mm,
üst iki köşe 1,0 mm × 45° pah, her pahta pahına dik eksenli bir round brilliant profili (kuşak 1,3 mm, taç %16, alt %43).
Karat ve gram yazılmaz (kamuya açık metinde yok; üretici teyidine kadar). Kural (second-brain 2026-09-11): yazı/ölçü
taşıyan görsel modele bırakılmaz, elle dizilir.
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
assert (B["widthMm"], B["thicknessMm"], B["rows"], S["sizeMm"], S["shape"], S["origin"]) == (6, 1.8, 2, "1.3", "round", "lab")
assert (L["sizes"]["from"], L["sizes"]["to"], L["sizes"]["step"]) == (4, 16, 0.5) and L["resizable"] is False
for phrase in ("About 6 mm wide and about 1.8 mm thick", "about 1.3 mm each", "each bevel holds a single row of round "
               "brilliant lab grown diamonds", "all the way around the band", "US 4 to US 16, including half sizes",
               "THIS BAND CANNOT BE RESIZED", "Solid gold in 10K, 14K or 18K, in yellow, white or rose gold",
               "fine brushed satin finish; the bevels and the inside are polished",
               "The number of stones depends on the ring size"):
    assert phrase in D, phrase

W, H = 2400, 1792
BG, INK, SOFT, RULE = (245, 242, 237), (42, 40, 38), (122, 116, 108), (222, 216, 207)
YG, YG_EDGE, YG_HI, YG_SHADE = (214, 182, 118), (150, 118, 62), (238, 216, 168), (182, 148, 88)
BRUSH_A, BRUSH_B = (204, 176, 120), (196, 167, 110)
STONE, FACET, STONE_DEEP = (229, 234, 239), (160, 170, 182), (206, 214, 224)


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
    font(SERIF, 92), font(SANS, 34), font(SANS_M, 30), font(SANS, 28), font(SANS_M, 31), font(SANS, 31),
    font(SANS, 26))

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


def ellipse_pts(cx, cy, a, b, ang, n=36):
    """a = yarı eksen teğet yönde, b = yarı eksen radyal yönde; ang = teğet yönün açısı (radyan)."""
    ca, sa = math.cos(ang), math.sin(ang)
    out = []
    for k in range(n):
        t = 2 * math.pi * k / n
        x, y = a * math.cos(t), b * math.sin(t)
        out.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return out


# ---- başlık
SUB = "Solid gold band with a row of lab grown diamonds on each beveled edge"
text((150, 120), "The details", F_TITLE)
text((154, 250), SUB, F_SUB, SOFT)
d.line([(150, 318), (W - 150, 318)], fill=RULE, width=2)

# ---- (1) halka eksenden: yan yüz, tam tur taş dairesi (US 8½, 1 mm = 24 px)
K1 = 24
US = 8.5
id_mm = 11.63 + 0.8128 * US
r_in = id_mm / 2
r_lip = r_in + (B["thicknessMm"] - 1.0)          # iç dudak 0,8 mm
r_out = r_in + B["thicknessMm"]                  # dış kenar
r_row = (r_lip + r_out) / 2
pitch = 1.5
n_row = math.ceil(math.pi * (id_mm + 2.0) / pitch)
assert n_row == 44, n_row                        # tasarım: US 8½'te sıra başına 44 (listing countBySize)
cx1, cy1 = 720, 720
R = lambda mm: mm * K1
d.ellipse([cx1 - R(r_out), cy1 - R(r_out), cx1 + R(r_out), cy1 + R(r_out)], fill=YG_SHADE, outline=YG_EDGE, width=3)
d.ellipse([cx1 - R(r_lip), cy1 - R(r_lip), cx1 + R(r_lip), cy1 + R(r_lip)], fill=YG_HI, outline=YG_EDGE, width=2)
d.ellipse([cx1 - R(r_in), cy1 - R(r_in), cx1 + R(r_in), cy1 + R(r_in)], fill=BG, outline=YG_EDGE, width=3)
stone_mm = float(S["sizeMm"])
for k in range(n_row):
    ang = 2 * math.pi * k / n_row
    sx, sy = cx1 + R(r_row) * math.cos(ang), cy1 + R(r_row) * math.sin(ang)
    tang = ang + math.pi / 2
    pts = ellipse_pts(sx, sy, R(stone_mm) / 2, R(stone_mm * math.cos(math.radians(45))) / 2, tang)
    d.polygon(pts, fill=STONE, outline=FACET)
    tab = ellipse_pts(sx, sy, R(stone_mm) * 0.26, R(stone_mm * 0.707) * 0.26, tang, n=8)
    d.polygon(tab, outline=FACET)
    bang = ang + math.pi / n_row                  # taşlar arası boncuk
    bx, by = cx1 + R(r_row) * math.cos(bang), cy1 + R(r_row) * math.sin(bang)
    d.ellipse([bx - 3.5, by - 3.5, bx + 3.5, by + 3.5], fill=YG_HI, outline=YG_EDGE, width=1)
y_lab1 = cy1 + R(r_out) + 52
text((cx1, y_lab1), "Each row closes the full circle", F_LABEL, INK, "ma")
text((cx1, y_lab1 + 54), "on both edges, so the band cannot be resized.", F_DIM, SOFT, "ma")

# ---- (2) bant kesiti (1 mm = 130 px): 6,0 × 1,8 mm, üst köşelerde 1,0 mm 45° pah, her pahta bir taş
Q = 130
w, t, c = B["widthMm"] * Q, B["thicknessMm"] * Q, 1.0 * Q
x0, y0 = 1340, 560
x1, y1 = x0 + w, y0 + t
poly = [(x0, y1), (x0, y0 + c), (x0 + c, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1)]
d.polygon(poly, fill=YG, outline=YG_EDGE)
d.line(poly + [poly[0]], fill=YG_EDGE, width=3)
for yy in range(int(y0) + 4, int(y0) + 16, 4):    # üst yüz: fırçalı (ince çizgiler)
    d.line([(x0 + c + 6, yy), (x1 - c - 6, yy)], fill=BRUSH_A if (yy // 4) % 2 else BRUSH_B, width=2)
d.line([(x0 + 10, y1 - 12), (x1 - 10, y1 - 12)], fill=YG_HI, width=4)   # cilalı iç

g = stone_mm * Q                                  # kuşak çapı
for side in (-1, 1):
    if side < 0:
        m = (x0 + c / 2, y0 + c / 2)
        n = (-1 / math.sqrt(2), -1 / math.sqrt(2))     # dışa (sol üst)
        tv = (1 / math.sqrt(2), -1 / math.sqrt(2))
    else:
        m = (x1 - c / 2, y0 + c / 2)
        n = (1 / math.sqrt(2), -1 / math.sqrt(2))      # dışa (sağ üst)
        tv = (1 / math.sqrt(2), 1 / math.sqrt(2))
    gc = (m[0] - n[0] * 0.05 * Q, m[1] - n[1] * 0.05 * Q)
    P = lambda along, out: (gc[0] + tv[0] * along + n[0] * out, gc[1] + tv[1] * along + n[1] * out)
    hc, hp, tab = 0.162 * g, 0.431 * g, 0.28 * g
    crown = [P(-g / 2, 0), P(-tab, hc), P(tab, hc), P(g / 2, 0)]
    pav = [P(-g / 2, 0), P(g / 2, 0), P(0, -hp)]
    d.polygon(pav, fill=STONE_DEEP, outline=FACET)     # alt kısım metalin içinde (yuva): koyu
    d.polygon(crown, fill=STONE, outline=FACET)        # taç pahın dışında: açık
    d.line(crown + [P(0, -hp), crown[0]], fill=FACET, width=3)
    d.line([P(-tab, hc), P(0, -hp)], fill=FACET, width=1)
    d.line([P(tab, hc), P(0, -hp)], fill=FACET, width=1)
    ends = [(x0, y0 + c), (x0 + c, y0)] if side < 0 else [(x1 - c, y0), (x1, y0 + c)]
    d.line(ends, fill=YG_EDGE, width=2)                # pah çizgisi taşın kuşağından geçer
    if side < 0:
        top = P(0, hc)
        tx, ty = x0 - 40, y0 - 70
        d.line([(tx + 8, ty + 8), top], fill=SOFT, width=2)
        text((tx, ty), f"stone about {stone_mm:g} mm", F_DIM, SOFT, "rs")
        assert tx - d.textlength(f"stone about {stone_mm:g} mm", font=F_DIM) > cx1 + R(r_out) + 20, "yazı halkaya biniyor"

d.line([(x0 + c, y0 - 34), (x1 - c, y0 - 34)], fill=SOFT, width=2)
for xx in (x0 + c, x1 - c):
    d.line([(xx, y0 - 46), (xx, y0 - 22)], fill=SOFT, width=2)
text(((x0 + x1) / 2, y0 - 56), "brushed face", F_DIM, SOFT, "ms")
dim_h(x0, x1, y1 + 54, f"{B['widthMm']:g} mm", below=True)
dim_v(x1 + 44, y0, y1, f"{B['thicknessMm']:g} mm")
assert x1 + 44 + 26 + d.textlength(f"{B['thicknessMm']:g} mm", font=F_DIM) < W - 60, "kesit ölçüsü taşıyor"
text(((x0 + x1) / 2, y1 + 170), "Cross-section of the band", F_LABEL, INK, "ma")
text(((x0 + x1) / 2, y1 + 224), "A row of stones in the polished bevel at each edge.", F_DIM, SOFT, "ma")
assert y1 + 224 + 40 < 1170 and y_lab1 + 54 + 40 < 1170, "çizim yazıları künyeye biniyor"

# ---- künye: iki sütun, sütun başına dört satır
rows = [
    ("Metal", "Solid 10K, 14K or 18K gold"),
    ("Colors", "Yellow, white or rose gold"),
    ("Stones", f"Round lab grown diamonds, about {stone_mm:g} mm"),
    ("Rows", "One on each beveled edge, all the way round"),
    ("Finish", "Brushed face, polished bevels and inside"),
    ("Band", f"About {B['widthMm']:g} mm wide and {B['thicknessMm']:g} mm thick"),
    ("Sizes", f"US {L['sizes']['from']} to US {L['sizes']['to']}, half sizes included"),
    ("Resizing", "Not possible: the stones circle the band"),
]
d.line([(150, 1170), (W - 150, 1170)], fill=RULE, width=2)
for i, (k, v) in enumerate(rows):
    col, r = divmod(i, 4)
    x, y = 150 + col * 1080, 1230 + r * 82
    right_edge = (150 + 1080 - 40) if col == 0 else (W - 150)
    assert x + 190 + d.textlength(v, font=F_VAL) <= right_edge, f"taşan satır: {v}"
    text((x, y), k, F_KEY)
    text((x + 190, y), v, F_VAL, SOFT)
text((150, H - 110), "Drawings show the proportions of the design at US 8.5; sizes are approximate and the number of "
                     "stones depends on the ring size.", F_FOOT, SOFT)
assert 150 + d.textlength("Drawings show the proportions of the design at US 8.5; sizes are approximate and the number "
                          "of stones depends on the ring size.", font=F_FOOT) < W - 150

# ---- kapı: kartın bütün metni FTC niteleyicisini taşır, karat/gram yazmaz, moissanite yok
words = " ".join(v for _, v in rows) + " " + SUB
assert not re.search(r"(?<!lab grown )\bdiamonds?\b", words, re.I)
assert not re.search(r"\bct\b|carat|moissanite|gram", words, re.I)

out = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "spec_card.png"
img.save(out)
print(f"wrote {out} {img.size}")
