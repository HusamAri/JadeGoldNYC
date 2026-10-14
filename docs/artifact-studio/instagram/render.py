# -*- coding: utf-8 -*-
"""
posts.py -> Instagram kareleri. Kullanım (repo kökünden):
    python3 docs/artifact-studio/instagram/render.py <font_dizin>
Çıktı: out/P2/01.jpg ... (feed 1080x1350, 4:5), out/P1/cover.jpg (reel 1080x1920).
Font dizini: cormorant.ttf (değişken), plexmono.ttf; Pinterest setiyle aynı kaynak.

Sessiz lüks üst yazı sistemi (2026-10-14, sahip talimatı: "son derece sessiz
lüks, editorial, minimalist"). Araştırma özeti README'de. Kurallar:
- Fotoğraf asla karartılmaz: gölge bandı, degrade, kutu yok. Metin fotoğrafın
  BOŞ alanına girer (kağıt/keten zemin), ürünün üstüne binmez.
- Tek serif ses: Cormorant Garamond hafif (300/400), cümle düzeni, 56 px'i
  geçmeyen başlık; büyük harf başlık yok, kalın yok.
- Tek küçük mono etiket (IBM Plex Mono 19 px, geniş aralık), önünde 24 px altın
  çizgi; .idx deseni (app/globals.css). Etiket küçük harf değil BÜYÜK, ama 19 px.
- Çok boşluk: kenar boşluğu 108 px, metin kadrajın üst ya da alt 1/5'inde.
- Siyah kart yok; ivory zemin, mürekkep metin, tek altın vurgu.
- Numara karelerinde büyük serif numara yok; küçük mono "01".
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from posts import POSTS

FONTS = sys.argv[1]
ROOT = "public/artifact"
OUT = "docs/artifact-studio/instagram/out"
W, H = 1080, 1350
IVORY = (244, 240, 233)
INK = (34, 31, 28)
MUTED = (128, 120, 110)
GOLD = (168, 131, 74)
HAIR = (222, 215, 204)
M = 108
LNUM = ["lnum"]


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


SERIF = lambda s, w=400: font("cormorant.ttf", s, w)
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


def spaced(d, xy, text, f, fill, track=0.28):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + f.size * track
    return x - xy[0]


def idx(d, xy, text, fill, bar=GOLD):
    """.idx: 24 px altın çizgi + 19 px mono etiket."""
    f = MONO(19)
    x, y = xy
    d.line((x, y + 12, x + 24, y + 12), fill=bar, width=2)
    spaced(d, (x + 40, y), text, f, fill)


def headline(d, xy, text, size=56, fill=INK, weight=400, lead=1.12):
    f = SERIF(size, weight)
    x, y = xy
    for line in text.split("\n"):
        d.text((x, y), line, font=f, fill=fill, features=LNUM)
        y += int(size * lead)
    return y


def wrap(d, text, f, width):
    words, line, out = text.split(), "", []
    for w_ in words:
        t = (line + " " + w_).strip()
        if d.textlength(t, font=f) > width:
            out.append(line); line = w_
        else:
            line = t
    return out + [line]


def ink_for(im, box):
    """Metin alanı açık mı koyu mu: ortalama parlaklığa göre mürekkep/ivory."""
    g = im.crop(box).convert("L").resize((8, 8))
    return INK if sum(g.getdata()) / 64 > 120 else IVORY


def photo(sl):
    im = cover(load(sl["src"]), W, H, fy=sl.get("fy", 0.5))
    d = ImageDraw.Draw(im)
    if "headline" in sl:
        lines = sl["headline"].split("\n")
        pos = sl.get("pos", "bottom")
        block_h = 19 + 28 + len(lines) * int(56 * 1.12)
        y0 = M if pos == "top" else H - M - block_h
        col = ink_for(im, (M, y0, W - M, y0 + block_h))
        idx(d, (M, y0), sl["kicker"], col if col == IVORY else MUTED)
        headline(d, (M, y0 + 40), sl["headline"], fill=col)
    if "num" in sl:
        col = ink_for(im, (M, M, W // 2, M + 40))
        spaced(d, (M, M), sl["num"], MONO(19), col if col == IVORY else MUTED)
        idx(d, (M, H - M - 24), sl["name"].upper(), col if col == IVORY else MUTED)
    return im


def text_slide(sl):
    im = Image.new("RGB", (W, H), IVORY)
    d = ImageDraw.Draw(im)
    idx(d, (M, M), sl["kicker"], MUTED)
    y = headline(d, (M, M + 48), sl["headline"], 56)
    y += 96
    for k, v in sl.get("rows", []):
        d.line((M, y, W - M, y), fill=HAIR, width=1)
        d.text((M, y + 30), k, font=SERIF(44, 400), fill=GOLD, features=LNUM)
        d.text((M + 150, y + 36), v, font=SERIF(34, 400), fill=INK, features=LNUM)
        y += 112
    d.line((M, y, W - M, y), fill=HAIR, width=1)
    if sl.get("foot"):
        f = SERIF(30, 400)
        ls = wrap(d, sl["foot"], f, W - 2 * M)
        yy = H - M - len(ls) * 40
        for l in ls:
            d.text((M, yy), l, font=f, fill=MUTED, features=LNUM); yy += 40
    return im


def cta(sl):
    im = Image.new("RGB", (W, H), IVORY)
    d = ImageDraw.Draw(im)
    lines = sl["headline"].split("\n")
    y0 = H // 2 - (len(lines) * 63) // 2 - 40
    idx(d, (M, y0 - 56), sl["kicker"], MUTED)
    y = headline(d, (M, y0), sl["headline"], 56)
    f = SERIF(30, 400)
    for i, l in enumerate(wrap(d, sl["foot"], f, W - 2 * M)):
        d.text((M, y + 28 + i * 40), l, font=f, fill=MUTED, features=LNUM)
    spaced(d, (M, H - M - 24), "ARTIFACT STUDIO", MONO(19), GOLD)
    return im


def cover_single(sl):
    """Carousel kapağı: tek ürün fotoğrafı, metin üstteki boş kağıtta."""
    return photo({"src": sl["src"], "fy": sl.get("fy", 0.5), "kicker": sl["kicker"],
                  "headline": sl["headline"], "pos": "top"})


def reel_cover(c):
    """1080x1920; ürün fotoğrafı üstte tam, altta ivory alan, metin grid kırpımında."""
    im = Image.new("RGB", (1080, 1920), IVORY)
    safe_bottom = (1920 + 1350) // 2  # 1635
    lines = c["headline"].count("\n") + 1
    y0 = safe_bottom - M - 19 - 40 - lines * 63
    top = y0 - 80
    im.paste(cover(load(c["src"]), 1080, top, fy=c.get("fy", 0.5)), (0, 0))
    d = ImageDraw.Draw(im)
    idx(d, (M, y0), c["kicker"], MUTED)
    headline(d, (M, y0 + 40), c["headline"])
    return im


R = {"photo": photo, "text": text_slide, "cta": cta, "cover_single": cover_single}
n = 0
for p in POSTS:
    d_ = os.path.join(OUT, p["id"]); os.makedirs(d_, exist_ok=True)
    if p["format"] == "reel":
        reel_cover(p["cover"]).save(os.path.join(d_, "cover.jpg"), quality=92); n += 1
        continue
    for i, sl in enumerate(p["slides"], 1):
        im = R[sl["t"]](sl)
        assert im.size == (W, H), (p["id"], i, im.size)
        im.save(os.path.join(d_, f"{i:02d}.jpg"), quality=92); n += 1
print("rendered", n)
