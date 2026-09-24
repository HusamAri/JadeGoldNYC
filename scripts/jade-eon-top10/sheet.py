#!/usr/bin/env python3
"""Contact sheet for listing keys -> scratch path given as last arg."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
keys, out = sys.argv[1:-1], sys.argv[-1]
T = 400
W = Image.new("RGB", (T * 5, T * 2 * len(keys)), "white")
for y, k in enumerate(keys):
    for f in sorted((ROOT / "docs/jade/eon-top10/images" / k).glob("*.jpg")):
        n = int(f.name[:2]) - 1; x, yy = n % 5, y * 2 + n // 5
        im = Image.open(f); im.thumbnail((T, T)); W.paste(im, (x * T, yy * T))
        ImageDraw.Draw(W).text((x * T + 4, yy * T + 4), f"{k[:14]} {f.name[:2]}", fill="red")
W.save(out, quality=85)
