#!/usr/bin/env python3
"""Build labeled contact sheets for Kymation visual QA."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_ROOT = ROOT / "public/eon/kymation-1009"
QA_ROOT = ROOT / "docs/eon/kymation-1009/qa"
SLUGS = (
    "gld-r-1009",
    "gld-r-1409",
    "gld-r-1809",
    "whg-r-1009",
    "whg-r-1409",
    "whg-r-1809",
    "rsg-r-1009",
    "rsg-r-1409",
    "rsg-r-1809",
)
ROLES = (
    "01-hero.jpg",
    "02-macro.jpg",
    "03-side.jpg",
    "04-top.jpg",
    "05-on-hand.jpg",
    "06-editorial.jpg",
    "07-size-width-guide.jpg",
    "08-metal-karat-guide.jpg",
    "09-personalization-care.jpg",
    "10-made-to-order.jpg",
)
CELL = 640
LABEL = 76
GAP = 18
SHEET = CELL * 3 + GAP * 4
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT = ImageFont.truetype(FONT_PATH, 34)


def make_sheet(role: str) -> Path:
    canvas = Image.new("RGB", (SHEET, SHEET + LABEL), "#151515")
    draw = ImageDraw.Draw(canvas)
    draw.text((GAP, 19), role.removesuffix(".jpg").upper(), font=FONT, fill="#F2F0EA")
    for index, slug in enumerate(SLUGS):
        row, column = divmod(index, 3)
        x = GAP + column * (CELL + GAP)
        y = LABEL + GAP + row * (CELL + GAP)
        image = Image.open(PUBLIC_ROOT / slug / role).convert("RGB")
        image = ImageOps.fit(image, (CELL, CELL), method=Image.Resampling.LANCZOS)
        canvas.paste(image, (x, y))
        draw.rectangle((x, y + CELL - 58, x + CELL, y + CELL), fill="#151515")
        draw.text((x + 18, y + CELL - 49), slug.upper(), font=FONT, fill="#F2F0EA")
    path = QA_ROOT / f"{role.removesuffix('.jpg')}-contact-sheet.jpg"
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, "JPEG", quality=92, optimize=True)
    return path


def main() -> None:
    outputs = [make_sheet(role) for role in ROLES]
    print(f"Rendered {len(outputs)} contact sheets")


if __name__ == "__main__":
    main()
