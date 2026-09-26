# -*- coding: utf-8 -*-
"""
pins.py → 1000x1500 JPG. Kullanım:
    python3 render.py <kaynak_dizin> <font_dizin> <çıktı_dizin>
Kaynak dizinde `<kod>.img` dosyaları (listing_images'ten indirilmiş),
font dizininde cormorant.ttf (değişken), cormorant-italic.ttf, inter.ttf,
plexmono.ttf bulunur.

Artifact Studio dili: fildişi zemin, mürekkep metin, tek sıcak altın vurgu;
serif başlık (Cormorant Garamond), mono etiket (IBM Plex Mono, geniş aralık,
BÜYÜK HARF) ve başında kısa vurgu çizgisi (.idx deseni, app/globals.css).
"""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from pins import PINS

W, H = 1000, 1500
IVORY = (244, 239, 231)
INK = (28, 26, 23)
MUTED = (122, 114, 104)
GOLD = (168, 131, 74)
WHITE = (250, 247, 242)
M = 64  # yan boşluk
# Cormorant varsayılanı eski stil rakam ("10K" → "1oK"); serif metinde düz rakam.
LNUM = ["lnum"]

SRC, FONTS, OUT = sys.argv[1:4]


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight is not None:
        try:
            f.set_variation_by_axes([weight] if name != "inter.ttf" else [min(max(size, 14), 32), weight])
        except Exception:
            pass
    return f


SERIF = lambda s, w=400: font("cormorant.ttf", s, w)
ITAL = lambda s, w=400: font("cormorant-italic.ttf", s, w)
MONO = lambda s: font("plexmono.ttf", s)


def load(code):
    return Image.open(os.path.join(SRC, code + ".img")).convert("RGB")


def cover(im, w, h, fx=0.5, fy=0.5):
    """Kutuyu dolduracak şekilde ölçekle, odak noktasından kırp."""
    s = max(w / im.width, h / im.height)
    nw, nh = round(im.width * s), round(im.height * s)
    im = im.resize((nw, nh), Image.LANCZOS)
    x = min(max(int(nw * fx - w / 2), 0), nw - w)
    y = min(max(int(nh * fy - h / 2), 0), nh - h)
    return im.crop((x, y, x + w, y + h))


def spaced(d, xy, text, f, fill, track=0.16):
    """Harf aralıklı mono metin; genişliği döner."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + f.size * track
    return x - xy[0]


def spaced_w(d, text, f, track=0.16):
    return sum(d.textlength(ch, font=f) + f.size * track for ch in text)


def idx(d, xy, text, f, fill, bar=GOLD):
    """.idx: kısa altın çizgi + mono etiket."""
    x, y = xy
    d.line((x, y + f.size * 0.62, x + 36, y + f.size * 0.62), fill=bar, width=2)
    spaced(d, (x + 52, y), text, f, fill)


def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f, features=LNUM) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def fit_lines(d, text, maker, sizes, maxw, maxlines):
    for s in sizes:
        f = maker(s)
        ls = wrap(d, text, f, maxw)
        if len(ls) <= maxlines:
            return f, ls
    return f, ls


def draw_lines(d, x, y, lines, f, fill, lead=1.12):
    for ln in lines:
        d.text((x, y), ln, font=f, fill=fill, features=LNUM)
        y += f.size * lead
    return y


def footer(d, text, y, fill=MUTED):
    f = MONO(17)
    spaced(d, (M, y), text, f, fill)
    brand = "ARTIFACT STUDIO"
    if "ARTIFACT" not in text:
        bw = spaced_w(d, brand, f)
        spaced(d, (W - M - bw, y), brand, f, fill)


def editorial(p):
    img = Image.new("RGB", (W, H), IVORY)
    ph = 1040
    img.paste(cover(load(p["img"][0]), W, ph, p.get("focus", [0.5])[0]), (0, 0))
    d = ImageDraw.Draw(img)
    idx(d, (M, ph + 52), p["label"], MONO(20), GOLD)
    f, ls = fit_lines(d, p["head"], SERIF, [74, 66, 60], W - 2 * M, 2)
    draw_lines(d, M, ph + 100, ls, f, INK, 1.08)
    d.line((M, H - 92, W - M, H - 92), fill=(214, 206, 194), width=1)
    footer(d, p["foot"], H - 66)
    return img


def story(p):
    img = Image.new("RGB", (W, H), IVORY)
    d = ImageDraw.Draw(img)
    spaced(d, (M, 58), "ARTIFACT STUDIO", MONO(17), MUTED)
    side = W - 2 * M
    img.paste(cover(load(p["img"][0]), side, side), (M, 110))
    y = 110 + side + 46
    idx(d, (M, y), p["label"], MONO(20), GOLD)
    f, ls = fit_lines(d, p["body"], ITAL, [42, 39, 36, 33], W - 2 * M, 5)
    draw_lines(d, M, y + 52, ls, f, INK, 1.18)
    footer(d, p["foot"], H - 66)
    return img


def word(p):
    img = cover(load(p["img"][0]), W, H, p.get("focus", [0.5])[0])
    # alt gölge: okunurluk için yumuşak mürekkep gradyanı
    grad = Image.new("L", (1, H))
    for yy in range(H):
        t = max(0.0, (yy - H * 0.52) / (H * 0.48))
        grad.putpixel((0, yy), int(215 * t ** 1.3))
    shade = Image.new("RGB", (W, H), (18, 16, 14))
    img = Image.composite(shade, img, grad.resize((W, H)))
    top = Image.new("L", (1, H))
    for yy in range(H):
        top.putpixel((0, yy), int(120 * max(0.0, 1 - yy / 220)))
    img = Image.composite(shade, img, top.resize((W, H)))
    d = ImageDraw.Draw(img)
    spaced(d, (M, 56), "ARTIFACT STUDIO", MONO(17), WHITE)
    f = SERIF(168, 400)
    d.text((M - 6, H - 360), p["word"], font=f, fill=WHITE, features=LNUM)
    idx(d, (M, H - 150), p["sub"], MONO(19), WHITE, bar=(214, 186, 132))
    return img


def diptych(p):
    img = Image.new("RGB", (W, H), IVORY)
    ph = 610
    img.paste(cover(load(p["img"][0]), W, ph, p["focus"][0]), (0, 0))
    img.paste(cover(load(p["img"][1]), W, ph, p["focus"][1]), (0, ph + 14))
    d = ImageDraw.Draw(img)
    y = 2 * ph + 14 + 40
    idx(d, (M, y), p["label"], MONO(20), GOLD)
    f, ls = fit_lines(d, p["head"], SERIF, [60, 54], W - 2 * M, 1)
    draw_lines(d, M, y + 44, ls, f, INK)
    return img


def guide(p):
    img = Image.new("RGB", (W, H), IVORY)
    d = ImageDraw.Draw(img)
    spaced(d, (M, 58), "ARTIFACT STUDIO · NOTES", MONO(17), MUTED)
    f, ls = fit_lines(d, p["head"], SERIF, [74, 66, 60], W - 2 * M, 2)
    y = draw_lines(d, M, 104, ls, f, INK, 1.04) + 26
    n = len(p["items"])
    list_h = (n + 1) // 2 * 62 if n > 3 else n * 62
    side = min(W - 2 * M, H - y - list_h - 150)
    img.paste(cover(load(p["img"][0]), W - 2 * M, side), (M, int(y)))
    y = y + side + 40
    fi, fn = SERIF(40, 500), MONO(20)

    def item(x, yy, it):
        # "01  metin": numara mono altın (Cormorant'ın eski stil rakamı "o1" okunur)
        num, txt = it.split(None, 1)
        spaced(d, (x, yy + 14), num, fn, GOLD)
        d.text((x + 54, yy), txt, font=fi, fill=INK, features=LNUM)

    if n > 3:  # iki sütun
        colw = (W - 2 * M) // 2
        rows = (n + 1) // 2
        for i, it in enumerate(p["items"]):
            item(M + (i // rows) * colw, y + (i % rows) * 60, it)
    else:
        for i, it in enumerate(p["items"]):
            item(M, y + i * 60, it)
    footer(d, p["foot"], H - 66)
    return img


def trio(p):
    img = Image.new("RGB", (W, H), IVORY)
    ph, gap = 1080, 10
    cw = (W - 2 * gap) // 3
    for i, code in enumerate(p["img"]):
        img.paste(cover(load(code), cw, ph, p["focus"][i]), (i * (cw + gap), 0))
    d = ImageDraw.Draw(img)
    idx(d, (M, ph + 52), p["label"], MONO(20), GOLD)
    f, ls = fit_lines(d, p["head"], SERIF, [72, 64], W - 2 * M, 2)
    draw_lines(d, M, ph + 100, ls, f, INK, 1.08)
    footer(d, "SOLID GOLD · MADE TO ORDER", H - 66)
    return img


R = dict(editorial=editorial, story=story, word=word, diptych=diptych, guide=guide, trio=trio)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[4].split(",")) if len(sys.argv) > 4 else None
    for p in PINS:
        if only and str(p["n"]) not in only:
            continue
        im = R[p["t"]](p)
        assert im.size == (W, H), (p["n"], im.size)
        im.save(os.path.join(OUT, f"pin-{p['n']:02d}.jpg"), quality=90, optimize=True, progressive=True)
    print("ok")
