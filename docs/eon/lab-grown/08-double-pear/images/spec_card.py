"""EON-PEAR2 galerisinin 10. karesi: ölçü kartı, YERELDE dizilir (kredi yok, metni ve ölçüyü model yazmaz).

Run: python3 -I docs/eon/lab-grown/08-double-pear/images/spec_card.py OUT.png

Tek kaynak: ../listing.json (1,8 × 1,6 mm bant, 8 × 6 mm ve 5 × 3,5 mm armut, beden aralığı, kamuya açık gram).
Çizimler ölçekli: taşlar üstten 1 mm = 46 px, bant kesiti 1 mm = 150 px. Kare 2400×1792 (galeriyle aynı 4:3).
Taş düzeni fotoğraflardaki ve referanstaki gibi: bant yatayken büyük taş solda ucu aşağıda, küçük taş sağda ucu
yukarıda, eksenler paralel ve banda dik; her taşta üç tırnak (uçta bir, yuvarlak uçta iki). Karat yazılmaz (sahip 3a,
üretici teyidine kadar). Kural (second-brain 2026-09-11): yazı/ölçü taşıyan görsel modele bırakılmaz, elle dizilir.
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
assert (B["widthMm"], B["thicknessMm"], S["count"], S["sizeMm"], S["shape"]) == (1.8, 1.6, 2, "8x6 + 5x3.5", "pear")
assert (L["sizes"]["from"], L["sizes"]["to"], L["sizes"]["step"]) == (4, 16, 0.5)
for phrase in ("about 1.8 mm wide and 1.6 mm thick", "about 8 x 6 mm", "about 5 x 3.5 mm", "points facing opposite ways",
               "three claw prongs, one guarding its point and two at its rounded end", "About 3.5 grams in US 8.5",
               "US 4 to US 16, including half sizes", "Solid 14K gold in yellow, white or rose"):
    assert phrase in D, phrase
BIG, SMALL = (8.0, 6.0), (5.0, 3.5)                 # uzunluk, genişlik (mm)

W, H = 2400, 1792
BG, INK, SOFT, RULE = (245, 242, 237), (42, 40, 38), (122, 116, 108), (222, 216, 207)
YG, YG_EDGE, YG_HI, YG_SHADE = (214, 182, 118), (150, 118, 62), (238, 216, 168), (182, 148, 88)
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


def dim_v(x, y0, y1, label, tick=14, left=False, label_y=None):
    d.line([(x, y0), (x, y1)], fill=SOFT, width=2)
    for y in (y0, y1):
        d.line([(x - tick, y), (x + tick, y)], fill=SOFT, width=2)
    ly = (y0 + y1) / 2 if label_y is None else label_y
    text((x - 26 if left else x + 26, ly), label, F_DIM, SOFT, "rm" if left else "lm")


def pear_outline(cx, cy, length, width, point_down, n=120):
    """Armut (damla) silueti: yuvarlak uç yarım daire, iki yan ucu sivri noktaya bağlanır. Uç aşağıda ya da yukarıda."""
    r = width / 2
    sign = 1 if point_down else -1
    tip = (cx, cy + sign * length / 2)
    rc = (cx, cy - sign * (length / 2 - r))          # yuvarlak ucun merkezi
    pts = []
    for k in range(n + 1):                            # yarım daire, yuvarlak uç tarafı
        a = math.pi * k / n
        pts.append((rc[0] + r * math.cos(a), rc[1] - sign * r * math.sin(a)))
    # yanlardan uca hafif dışbükey eğri (karesel Bézier), sağdan sola
    for side in (-1, 1):
        p0 = (rc[0] + side * r, rc[1])
        ctrl = (rc[0] + side * r * 0.98, rc[1] + sign * (length - r) * 0.55)
        seg = []
        for k in range(1, n + 1):
            t = k / n
            x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * ctrl[0] + t ** 2 * tip[0]
            y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * ctrl[1] + t ** 2 * tip[1]
            seg.append((x, y))
        pts.extend(seg if side == -1 else seg[::-1])
    # yarım daire sağdan (a=0) sola (a=π) gidiyor; sol yan uca, sağ yan uçtan geri gelir
    return pts[:n + 1] + pts[n + 1:n + 1 + n] + pts[n + 1 + n:]


def pear(cx, cy, length, width, point_down):
    pts = pear_outline(cx, cy, length, width, point_down)
    d.polygon(pts, fill=STONE, outline=FACET)
    d.line(pts + [pts[0]], fill=FACET, width=3)
    ccx = cx
    ccy = cy - (1 if point_down else -1) * length * 0.06
    table = [(ccx + (x - cx) * 0.5, ccy + (y - cy) * 0.5) for x, y in pts[::24]]
    d.polygon(table, outline=FACET)
    for (tx, ty), (ox, oy) in zip(table, pts[::24]):
        d.line([(tx, ty), (ox, oy)], fill=FACET, width=1)
    # tırnaklar: uçta V biçimli bir tırnak, yuvarlak uçta iki yuvarlak tırnak
    sign = 1 if point_down else -1
    tip = (cx, cy + sign * length / 2)
    v = width * 0.16
    d.polygon([(tip[0] - v, tip[1] - sign * v * 1.3), (tip[0], tip[1] + sign * v * 0.55),
               (tip[0] + v, tip[1] - sign * v * 1.3)], fill=YG, outline=YG_EDGE)
    r = width / 2
    rc = (cx, cy - sign * (length / 2 - r))
    for ang in (math.radians(50), math.radians(130)):
        px, py = rc[0] + r * math.cos(ang), rc[1] - sign * r * math.sin(ang)
        pr = width * 0.085
        d.ellipse([px - pr, py - pr, px + pr, py + pr], fill=YG, outline=YG_EDGE, width=2)


# ---- başlık
SUB = "Solid 14K gold toi et moi ring with two pear cut lab grown diamonds"
text((150, 120), "The details", F_TITLE)
text((154, 250), SUB, F_SUB, SOFT)
d.line([(150, 318), (W - 150, 318)], fill=RULE, width=2)

# ---- taşlar üstten (1 mm = 46 px): bant yatay, iki armut yan yana, eksenler banda dik ve paralel
K = 46
cx, cy = 820, 660
gap = 0.4
total = BIG[1] + gap + SMALL[1]
left = cx - total / 2 * K
big_cx = left + BIG[1] / 2 * K
small_cx = left + (BIG[1] + gap + SMALL[1] / 2) * K
band_half_len = 13.5 * K
bw = B["widthMm"] * K
d.rounded_rectangle([cx - band_half_len, cy - bw / 2, cx + band_half_len, cy + bw / 2], radius=bw / 2,
                    fill=YG, outline=YG_EDGE, width=3)
d.line([(cx - band_half_len + 30, cy - bw / 2 + 12), (cx + band_half_len - 30, cy - bw / 2 + 12)], fill=YG_HI, width=4)
pear(big_cx, cy, BIG[0] * K, BIG[1] * K, point_down=True)
pear(small_cx, cy, SMALL[0] * K, SMALL[1] * K, point_down=False)
big_top, big_bot = cy - BIG[0] / 2 * K, cy + BIG[0] / 2 * K
sm_top, sm_bot = cy - SMALL[0] / 2 * K, cy + SMALL[0] / 2 * K
# ölçü yazıları bandın üstüne binmesin: dikey ölçülerin etiketi bandın altına ya da üstüne alınır
band_top, band_bot = cy - bw / 2, cy + bw / 2
lab_big, lab_small = (band_bot + big_bot) / 2, (sm_top + band_top) / 2
dim_v(big_cx - BIG[1] / 2 * K - 46, big_top, big_bot, "about 8 mm", left=True, label_y=lab_big)
dim_h(big_cx - BIG[1] / 2 * K, big_cx + BIG[1] / 2 * K, big_bot + 48, "about 6 mm", below=True)
dim_v(small_cx + SMALL[1] / 2 * K + 46, sm_top, sm_bot, "about 5 mm", label_y=lab_small)
for ly in (lab_big, lab_small):
    assert not (band_top - 18 < ly < band_bot + 18), "ölçü yazısı bandın üstüne biniyor"
dim_h(small_cx - SMALL[1] / 2 * K, small_cx + SMALL[1] / 2 * K, sm_top - 40, "about 3.5 mm")
dim_v(cx + band_half_len + 40, cy - bw / 2, cy + bw / 2, f"{B['widthMm']:g} mm")
text((cx, big_bot + 150), "The two stones from above", F_LABEL, INK, "ma")
text((cx, big_bot + 204), "Their points face opposite ways; three claw prongs hold each stone.", F_DIM, SOFT, "ma")

# ---- bant kesiti (1 mm = 150 px): 1,8 × 1,6 mm, yumuşak yuvarlatılmış kenarlar
Q = 150
sx, sy = 1910, 640
w, t = B["widthMm"] * Q, B["thicknessMm"] * Q
x0, y0 = sx - w / 2, sy - t / 2
d.rounded_rectangle([x0, y0, x0 + w, y0 + t], radius=48, fill=YG, outline=YG_EDGE, width=3)
d.arc([x0 + 18, y0 + 14, x0 + w - 18, y0 + 90], start=200, end=340, fill=YG_HI, width=5)
dim_h(x0, x0 + w, y0 + t + 54, f"{B['widthMm']:g} mm", below=True)
dim_v(x0 + w + 44, y0, y0 + t, f"{B['thicknessMm']:g} mm")
text((sx, y0 + t + 170), "Cross-section of the band", F_LABEL, INK, "ma")
text((sx, y0 + t + 224), "Slim and polished all the way round.", F_DIM, SOFT, "ma")

# ---- künye: iki sütun, sütun başına dört satır
rows = [
    ("Metal", "Solid 14K gold: yellow, white or rose"),
    ("Stones", "Two pear cut lab grown diamonds"),
    ("Larger", "About 8 x 6 mm"),
    ("Smaller", "About 5 x 3.5 mm"),
    ("Setting", "Three claw prongs on each stone"),
    ("Band", f"About {B['widthMm']:g} mm wide and {B['thicknessMm']:g} mm thick"),
    ("Sizes", f"US {L['sizes']['from']} to US {L['sizes']['to']}, half sizes included"),
    ("Weight", "About 3.5 grams at US 8.5"),
]
d.line([(150, 1170), (W - 150, 1170)], fill=RULE, width=2)
for i, (k, v) in enumerate(rows):
    col, r = divmod(i, 4)
    x, y = 150 + col * 1080, 1230 + r * 82
    right_edge = (150 + 1080 - 40) if col == 0 else (W - 150)
    assert x + 190 + d.textlength(v, font=F_VAL) <= right_edge, f"taşan satır: {v}"
    text((x, y), k, F_KEY)
    text((x + 190, y), v, F_VAL, SOFT)
text((150, H - 110), "Drawings show the proportions of the design; sizes are approximate.", F_FOOT, SOFT)

# ---- kapı: kartın bütün metni FTC niteleyicisini taşır, karat yazmaz, moissanite yok
words = " ".join(v for _, v in rows) + " " + SUB
assert not re.search(r"(?<!lab grown )\bdiamonds?\b", words, re.I)
assert not re.search(r"\bct\b|carat|moissanite", words, re.I)

out = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "spec_card.png"
img.save(out)
print(f"wrote {out} {img.size}")
