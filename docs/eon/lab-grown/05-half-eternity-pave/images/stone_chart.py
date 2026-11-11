"""EON-HEP galerisinin 10. karesi: 20 taş seçeneğinin tablosu, YERELDE dizilir (kredi yok, metni model yazmaz).

Run: /usr/bin/python3 -I docs/eon/lab-grown/05-half-eternity-pave/images/stone_chart.py OUT.png

Tek kaynak: ../listing.json `stoneChoices` (etiketler Etsy açılır listesiyle birebir, köken ve işlem beyanı aynı
veriden). Renk daireleri temsilidir; altta "renkler yol göstericidir" notu var. Kare 2400×1792 (galeriyle aynı 4:3).
Kural (second-brain 2026-09-11): yazı/ölçü taşıyan görsel modele bırakılmaz, elle dizilir.
"""
import json
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
L = json.loads((HERE.parent / "listing.json").read_text())
C = L["stoneChoices"]
assert len(C) == 20

W, H = 2400, 1792
BG, INK, SOFT, RULE = (245, 242, 237), (42, 40, 38), (122, 116, 108), (222, 216, 207)


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
F_TITLE, F_SUB, F_NAME, F_ORIGIN, F_FOOT = (font(SERIF, 92), font(SANS, 34), font(SANS_M, 33), font(SANS, 25),
                                            font(SANS, 26))

# temsilî renkler (taban, vurgu) ve özel desenler
SWATCH = {
    "Lab Grown Diamond": ((214, 220, 226), "facet"),
    "Moissanite": ((222, 224, 226), "fire"),
    "Salt Pepper Diamond": ((150, 152, 154), "speckle"),
    "Black Diamond": ((28, 28, 30), "facet"),
    "Lab Created Sapphire": ((28, 58, 140), "facet"),
    "Lab Created Ruby": ((168, 16, 40), "facet"),
    "Lab Created Emerald": ((16, 112, 70), "facet"),
    "Created Alexandrite": ((52, 118, 108), "split"),
    "Amethyst": ((116, 70, 158), "facet"),
    "Aquamarine": ((132, 194, 212), "facet"),
    "Blue Topaz": ((56, 150, 204), "facet"),
    "Morganite": ((226, 176, 166), "facet"),
    "Pink Tourmaline": ((200, 72, 126), "facet"),
    "Tanzanite": ((70, 70, 160), "facet"),
    "Opal": ((228, 234, 236), "opal"),
    "Moonstone": ((214, 224, 234), "sheen"),
    "Rose Quartz": ((236, 190, 198), "cab"),
    "Turquoise": ((52, 176, 170), "cab"),
    "Black Onyx": ((20, 20, 20), "cab"),
    "Cultured Pearl": ((240, 234, 224), "pearl"),
}
ORIGIN = {"lab": "laboratory-created", "natural": "natural", "cultured": "cultured, freshwater"}


def origin_text(c):
    if c["label"] == "Lab Grown Diamond":
        return "laboratory-grown"
    t = ORIGIN[c["origin"]]
    if c.get("treatment"):
        t += ", " + c["treatment"].split(",")[0].replace("routinely ", "").replace("color-treated", "color-treated")
    return t


def swatch(d, kind, base):
    """d px'lik bir taş dairesi (RGBA), radyal gölgeleme + desen."""
    s = 4 * d
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    px = img.load()
    r0 = s / 2
    rnd = random.Random(sum(base) * 7 + len(kind))
    flecks = [(rnd.uniform(-0.6, 0.6), rnd.uniform(-0.6, 0.6), rnd.choice([(255, 170, 120), (140, 220, 170),
              (150, 180, 255), (255, 140, 200)])) for _ in range(28)]
    specks = [(rnd.uniform(-0.8, 0.8), rnd.uniform(-0.8, 0.8), rnd.choice([45, 80, 205])) for _ in range(130)]
    for y in range(s):
        for x in range(s):
            dx, dy = (x - r0) / r0, (y - r0) / r0
            rr = math.hypot(dx, dy)
            if rr > 1:
                continue
            light = 1.0 + 0.35 * (-(dx + dy) / 1.4) - 0.25 * rr ** 2      # ışık sol üstten
            col = [min(255, max(0, int(c * light))) for c in base]
            if kind == "facet":
                ang = math.atan2(dy, dx)
                band = (math.cos(8 * ang) * 0.5 + 0.5) * (rr > 0.42)
                k = 0.94 + 0.11 * band if rr > 0.42 else 1.05
                col = [min(255, int(c * k)) for c in col]
            elif kind == "fire":
                ang = math.atan2(dy, dx)
                col = [min(255, int(c * (0.9 + 0.2 * (math.cos(8 * ang) * 0.5 + 0.5)))) for c in col]
                hue = (math.cos(3 * ang) + 1) / 2
                col = [int(col[0] * (1 - 0.08 * hue)), int(col[1] * (1 - 0.04 * (1 - hue))), col[2]]
            elif kind == "split":
                if dx - dy > 0.15:
                    col = [min(255, max(0, int(c * light))) for c in (112, 62, 132)]
            elif kind == "opal":
                for fx, fy, fc in flecks:
                    if math.hypot(dx - fx, dy - fy) < 0.12:
                        col = [int(0.68 * a + 0.32 * b) for a, b in zip(col, fc)]
            elif kind == "speckle":
                for fx, fy, g in specks:
                    if math.hypot(dx - fx, dy - fy) < 0.032:
                        col = [g, g, g]
            elif kind == "sheen":
                glow = max(0.0, 1 - math.hypot(dx + 0.15, dy + 0.2) / 0.7)
                col = [int(c + (170 - c) * 0.0 + (200 - c) * 0.35 * glow) if i < 2 else min(255, int(c + 40 * glow))
                       for i, c in enumerate(col)]
            elif kind == "pearl":
                glow = max(0.0, 1 - math.hypot(dx + 0.35, dy + 0.35) / 0.5)
                col = [min(255, int(c + 22 * glow)) for c in col]
            if rr > 0.96:                                                   # ince koyu kenar
                col = [int(c * 0.72) for c in col]
            px[x, y] = (*col, 255)
    hl = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([s * 0.24, s * 0.20, s * 0.40, s * 0.34], fill=(255, 255, 255, 150 if kind != "cab" else 110))
    img = Image.alpha_composite(img, hl.filter(ImageFilter.GaussianBlur(s * 0.025)))
    return img.resize((d, d), Image.LANCZOS)


def main(out):
    im = Image.new("RGB", (W, H), BG)
    dr = ImageDraw.Draw(im)
    dr.text((W / 2, 150), "Choose your stone", font=F_TITLE, fill=INK, anchor="mm")
    dr.text((W / 2, 250), "20 choices, one price. Every stone in your ring is the stone you choose.",
            font=F_SUB, fill=SOFT, anchor="mm")
    dr.line([(W / 2 - 90, 310), (W / 2 + 90, 310)], fill=RULE, width=3)
    cols, rows, mx, top, bottom = 5, 4, 120, 370, H - 150
    cw, rh, d = (W - 2 * mx) / cols, (bottom - top) / rows, 132
    # gölge: tek renk + bulanık "L" maske (RGBA bulanıklığı saydam kenarda kutu izi bırakıyordu)
    shadow = Image.new("L", (d + 60, d + 60), 0)
    ImageDraw.Draw(shadow).ellipse([30, 40, d + 30, d + 48], fill=70)
    shadow = shadow.filter(ImageFilter.GaussianBlur(9))
    for i, c in enumerate(C):
        cx = mx + cw * (i % cols) + cw / 2
        cy = top + rh * (i // cols) + 18
        base, kind = SWATCH[c["label"]]
        im.paste((60, 50, 40), (int(cx - d / 2 - 30), int(cy - 30)), shadow)
        sw = swatch(d, kind, base)
        im.paste(sw, (int(cx - d / 2), int(cy)), sw)
        dr.text((cx, cy + d + 44), c["label"], font=F_NAME, fill=INK, anchor="mm")
        dr.text((cx, cy + d + 88), origin_text(c), font=F_ORIGIN, fill=SOFT, anchor="mm")
    dr.text((W / 2, H - 92), "Colors are a guide: natural stones vary a little. Opal, moonstone, turquoise and "
            "pearl are softer gems.", font=F_FOOT, fill=SOFT, anchor="mm")
    im.save(out)
    print(f"wrote {out} {im.size}")


if __name__ == "__main__":
    main(sys.argv[1])
