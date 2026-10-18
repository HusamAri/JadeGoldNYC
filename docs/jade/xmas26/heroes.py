"""Jade Gold NYC, Christmas 2026: turn downloaded hero renders into the three files each one needs.

Run: python3 docs/jade/xmas26/heroes.py   (needs Pillow + numpy)
In:  images/heroes/raw/<ID>.png        the untouched Higgsfield download
Out: images/heroes/<ID>.jpg            Etsy upload: sRGB JPEG, no metadata, under 1 MB
     images/heroes/crops/<ID>.jpg      tight crop of the piece: the ONLY reference for frames 02-16
     web/<ID>.jpg                      1600 px copy for the image book

Metadata is dropped by re-encoding pixels only: Higgsfield PNGs carry a tEXt hf-job-id chunk, and an
image going out to Etsy must not carry the generator's label (second-brain, "Dışa çıkan görselden
köken meta verisi sök"). This does NOT remove a watermark embedded in the pixels.

The crop is a reference, so it must hold the piece and as little of the set as possible: a
reference leaks its composition into every frame it is attached to (second-brain 2026-09-27).
The piece is found as the saturated warm-yellow pixels (gold) plus anything saturated touching
them (enamel); linen, stone and the jade card are all low-saturation and fall outside.
"""
import pathlib

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).parent
RAW = HERE / "images" / "heroes" / "raw"
OUT = HERE / "images" / "heroes"
CROPS = OUT / "crops"
WEB = HERE / "web"
for d in (CROPS, WEB):
    d.mkdir(parents=True, exist_ok=True)


def save_jpeg(img, path, max_bytes, quality=92):
    while True:
        img.save(path, "JPEG", quality=quality, optimize=True, progressive=True, subsampling=0)
        if path.stat().st_size <= max_bytes or quality <= 70:
            return quality
        quality -= 3


def piece_box(img):
    hsv = np.asarray(img.convert("HSV")).astype(np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    gold = (h >= 25) & (h <= 60) & (s >= 0.35) & (v >= 0.30)
    colour = (s >= 0.40) & (v >= 0.15)  # enamel and stones sit inside or beside the gold
    mask = gold | colour
    ys, xs = np.nonzero(mask)
    if len(xs) < 500:
        return None
    # trim stray specks: keep the central 99% of mask pixels on each axis
    x0, x1 = np.percentile(xs, [0.5, 99.5])
    y0, y1 = np.percentile(ys, [0.5, 99.5])
    return x0, y0, x1, y1


def crop(img):
    W, H = img.size
    box = piece_box(img)
    if box is None:
        side = int(min(W, H) * 0.7)
        cx, cy = W / 2, H / 2
    else:
        x0, y0, x1, y1 = box
        side = int(max(x1 - x0, y1 - y0) * 1.16)  # 8% margin per side
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    side = max(min(side, W, H), 256)
    left = int(min(max(cx - side / 2, 0), W - side))
    top = int(min(max(cy - side / 2, 0), H - side))
    return img.crop((left, top, left + side, top + side))


report = []
for raw in sorted(RAW.glob("*.png")) + sorted(RAW.glob("*.jpg")) + sorted(RAW.glob("*.webp")):
    pid = raw.stem
    img = Image.open(raw).convert("RGB")  # drops alpha and every text chunk
    q = save_jpeg(img, OUT / f"{pid}.jpg", 1_000_000)
    c = crop(img)
    if c.size[0] > 1024:
        c = c.resize((1024, 1024), Image.LANCZOS)
    save_jpeg(c, CROPS / f"{pid}.jpg", 400_000, 90)
    w = img.resize((1600, round(1600 * img.size[1] / img.size[0])), Image.LANCZOS)
    save_jpeg(w, WEB / f"{pid}.jpg", 350_000, 84)
    report.append(f"{pid}: {img.size[0]}x{img.size[1]} q{q} {(OUT / f'{pid}.jpg').stat().st_size // 1024} KB")
print("\n".join(report) or "no raw heroes yet")
