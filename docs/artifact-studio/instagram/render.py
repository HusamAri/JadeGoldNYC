# -*- coding: utf-8 -*-
"""
posts.py -> Instagram kareleri. Kullanım (repo kökünden):
    python3 docs/artifact-studio/instagram/render.py <font_dizin>
Çıktı: docs/artifact-studio/instagram/out/P2/01.jpg ... (feed 1080x1350, 4:5)
       docs/artifact-studio/instagram/out/P1/cover.jpg (reel kapağı 1080x1920)
Font dizini: cormorant.ttf, cormorant-italic.ttf, plexmono.ttf
(raw.githubusercontent.com/google/fonts/main/ofl/..., Pinterest render'ıyla aynı).

Dil Pinterest setiyle aynı: fildişi zemin, mürekkep metin, tek altın vurgu,
Cormorant başlık, Plex Mono geniş aralıklı etiket + kısa altın çizgi.
Reel kapağında metin 4:5 grid kırpımının içinde kalır (orta 1080x1350).
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS

FONTS = sys.argv[1]
ROOT = "public/artifact"
OUT = "docs/artifact-studio/instagram/out"
W, H = 1080, 1350
IVORY = (244, 239, 231)
INK = (28, 26, 23)
MUTED = (122, 114, 104)
GOLD = (168, 131, 74)
WHITE = (250, 247, 242)
M = 84
LNUM = ["lnum"]


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


SERIF = lambda s, w=500: font("cormorant.ttf", s, w)
MONO = lambda s: font("plexmono.ttf", s)


def load(code):
    return Image.open(os.path.join(ROOT, code + ".jpg")).convert("RGB")


def cover(im, w, h, fx=0.5, fy=0.5):
    s = max(w / im.width, h / im.height)
    nw, nh = round(im.width * s), round(im.height * s)
    im = im.resize((nw, nh), Image.LANCZOS)
    x = min(max(int(nw * fx - w / 2), 0), nw - w)
    y = min(max(int(nh * fy - h / 2), 0), nh - h)
    return im.crop((x, y, x + w, y + h))


def spaced(d, xy, text, f, fill, track=0.18):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + f.size * track
    return x - xy[0]


def idx(d, xy, text, f, fill, bar=GOLD):
    x, y = xy
    d.line((x, y + f.size * 0.62, x + 40, y + f.size * 0.62), fill=bar, width=3)
    spaced(d, (x + 58, y), text, f, fill)


def headline(d, xy, text, size, fill, lead=1.02):
    f = SERIF(size)
    x, y = xy
    for line in text.split("\n"):
        d.text((x, y), line, font=f, fill=fill, features=LNUM)
        y += int(size * lead)
    return y


def shade(im, top, bottom, alpha=170):
    """Metin okunurluğu için alttan koyu degrade."""
    g = Image.new("L", (1, im.height))
    for yy in range(im.height):
        t = 0 if yy < top else min(1, (yy - top) / max(1, bottom - top))
        g.putpixel((0, yy), int(alpha * t ** 1.4))
    g = g.resize(im.size)
    black = Image.new("RGB", im.size, (18, 16, 14))
    return Image.composite(black, im, g)


def text_block(im, kicker, head, y0, size=104, color=WHITE):
    d = ImageDraw.Draw(im)
    idx(d, (M, y0), kicker, MONO(26), color, bar=GOLD)
    headline(d, (M, y0 + 58), head, size, color)


def photo(sl):
    im = cover(load(sl["src"]), W, H, fy=sl.get("fy", 0.5))
    if "headline" in sl:
        lines = sl["headline"].count("\n") + 1
        y0 = H - M - 58 - lines * 106
        if sl.get("dark", True):
            im = shade(im, y0 - 260, H)
            text_block(im, sl["kicker"], sl["headline"], y0)
        else:
            band = Image.new("RGB", (W, H - y0 + 50), IVORY)
            im.paste(band, (0, y0 - 50))
            text_block(im, sl["kicker"], sl["headline"], y0, color=INK)
    if "num" in sl:
        d = ImageDraw.Draw(im)
        d.text((M, M - 20), sl["num"], font=SERIF(150, 500), fill=INK, features=LNUM)
        idx(d, (M, H - M - 26), sl["name"].upper(), MONO(24), INK)
    return im


def text_slide(sl):
    im = Image.new("RGB", (W, H), IVORY)
    d = ImageDraw.Draw(im)
    idx(d, (M, 150), sl["kicker"], MONO(26), MUTED)
    y = headline(d, (M, 214), sl["headline"], 96, INK)
    y += 70
    for k, v in sl.get("rows", []):
        d.line((M, y, W - M, y), fill=(214, 205, 192), width=2)
        d.text((M, y + 34), k, font=SERIF(84, 500), fill=GOLD, features=LNUM)
        d.text((M + 200, y + 62), v, font=SERIF(42, 500), fill=INK, features=LNUM)
        y += 170
    d.line((M, y, W - M, y), fill=(214, 205, 192), width=2)
    if sl.get("foot"):
        f = SERIF(40, 400)
        words, line, yy = sl["foot"].split(), "", H - 230
        for w_ in words:
            t = (line + " " + w_).strip()
            if d.textlength(t, font=f) > W - 2 * M:
                d.text((M, yy), line, font=f, fill=MUTED, features=LNUM); yy += 52; line = w_
            else:
                line = t
        d.text((M, yy), line, font=f, fill=MUTED, features=LNUM)
    return im


def cta(sl):
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)
    lines = sl["headline"].count("\n") + 1
    y0 = (H - lines * 112) // 2 - 40
    idx(d, (M, y0 - 80), sl["kicker"], MONO(26), (200, 190, 175))
    size = 110
    while max(d.textlength(l, font=SERIF(size)) for l in sl["headline"].split("\n")) > W - 2 * M:
        size -= 4
    y = headline(d, (M, y0), sl["headline"], size, WHITE)
    d.text((M, y + 50), sl["foot"], font=SERIF(42, 400), fill=(200, 190, 175), features=LNUM)
    spaced(d, (M, H - M - 26), "ARTIFACT STUDIO", MONO(24), GOLD)
    return im


def cover_grid(sl):
    im = Image.new("RGB", (W, H), IVORY)
    g, top = 12, 0
    cw = (W - g) // 2
    ch = 470
    for i, s in enumerate(sl["srcs"]):
        t = cover(load(s), cw, ch)
        im.paste(t, ((i % 2) * (cw + g), top + (i // 2) * (ch + g)))
    d = ImageDraw.Draw(im)
    y0 = 2 * ch + g + 60
    idx(d, (M, y0), sl["kicker"], MONO(26), MUTED)
    headline(d, (M, y0 + 56), sl["headline"], 100, INK)
    return im


def reel_cover(c):
    """1080x1920; metin orta 1350'lik grid kırpımının içinde kalır."""
    safe_bottom = (1920 + 1350) // 2  # 1635
    lines = c["headline"].count("\n") + 1
    y0 = safe_bottom - M - 58 - lines * 106
    band = c.get("band")
    if band is None:
        im = cover(load(c["src"]), 1080, 1920, fy=c.get("fy", 0.5))
        im = shade(im, y0 - 300, safe_bottom + 200)
        text_block(im, c["kicker"], c["headline"], y0)
    else:  # düz renk bant; ürün fotoğrafı bandın ÜSTÜNE sığdırılır, kesilmez
        im = Image.new("RGB", (1080, 1920), tuple(band))
        top = y0 - 70
        im.paste(cover(load(c["src"]), 1080, top, fy=c.get("fy", 0.5)), (0, 0))
        ink = INK if sum(band) > 450 else WHITE
        text_block(im, c["kicker"], c["headline"], y0, color=ink)
    return im


R = {"photo": photo, "text": text_slide, "cta": cta, "cover_grid": cover_grid}
n = 0
for p in POSTS:
    d_ = os.path.join(OUT, p["id"]); os.makedirs(d_, exist_ok=True)
    if p["format"] == "reel":
        reel_cover(p["cover"]).save(os.path.join(d_, "cover.jpg"), quality=90); n += 1
        continue
    for i, sl in enumerate(p["slides"], 1):
        im = R[sl["t"]](sl)
        assert im.size == (W, H), (p["id"], i, im.size)
        im.save(os.path.join(d_, f"{i:02d}.jpg"), quality=90); n += 1
print("rendered", n)
