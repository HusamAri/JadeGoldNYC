#!/usr/bin/env python3
"""Render EON Kymation Etsy information cards from the generated catalog."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "docs/eon/kymation-1009/catalog.json"
PUBLIC_ROOT = ROOT / "public/eon/kymation-1009"
SIZE = 2200

SERIF_PATH = "/System/Library/Fonts/Supplemental/Didot.ttc"
SANS_PATH = "/System/Library/Fonts/Avenir Next.ttc"


KARAT_PALETTES = {
    "10K": {
        "paper": "#EFF0EC",
        "paper_2": "#DDE5E4",
        "glass": "#8FB8BA",
        "ink": "#1C2423",
        "muted": "#586461",
    },
    "14K": {
        "paper": "#F0ECE3",
        "paper_2": "#D9DED5",
        "glass": "#72A9A2",
        "ink": "#1D2020",
        "muted": "#595B55",
    },
    "18K": {
        "paper": "#EEE5D8",
        "paper_2": "#D5C5B5",
        "glass": "#174B4D",
        "ink": "#211D1B",
        "muted": "#665B54",
    },
}

METAL_ACCENTS = {
    ("10K", "Yellow Gold"): "#A98843",
    ("14K", "Yellow Gold"): "#B98322",
    ("18K", "Yellow Gold"): "#B36D18",
    ("10K", "White Gold"): "#8F9D9D",
    ("14K", "White Gold"): "#8C8B86",
    ("18K", "White Gold"): "#A09480",
    ("10K", "Rose Gold"): "#B77E6E",
    ("14K", "Rose Gold"): "#B66D55",
    ("18K", "Rose Gold"): "#A95641",
}

METAL_TONES = {
    ("10K", "Yellow Gold"): "Pale straw yellow",
    ("14K", "Yellow Gold"): "Balanced honey yellow",
    ("18K", "Yellow Gold"): "Deep rich yellow",
    ("10K", "White Gold"): "Restrained steel white",
    ("14K", "White Gold"): "Neutral soft white",
    ("18K", "White Gold"): "Dense luminous white",
    ("10K", "Rose Gold"): "Muted blush",
    ("14K", "Rose Gold"): "Balanced blush copper",
    ("18K", "Rose Gold"): "Rich warm rose",
}


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


SERIF_164 = font(SERIF_PATH, 164)
SERIF_126 = font(SERIF_PATH, 126)
SERIF_88 = font(SERIF_PATH, 88)
SANS_58 = font(SANS_PATH, 58)
SANS_48 = font(SANS_PATH, 48)
SANS_42 = font(SANS_PATH, 42)
SANS_36 = font(SANS_PATH, 36)
SANS_30 = font(SANS_PATH, 30)
SANS_26 = font(SANS_PATH, 26)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def mix(color_a: str, color_b: str, amount: float) -> tuple[int, int, int]:
    a = hex_to_rgb(color_a)
    b = hex_to_rgb(color_b)
    return tuple(round(a[index] * (1 - amount) + b[index] * amount) for index in range(3))


def gradient(palette: dict[str, str]) -> Image.Image:
    vertical = Image.linear_gradient("L").resize((SIZE, SIZE))
    image = ImageOps.colorize(
        vertical,
        black=mix(palette["paper"], palette["paper_2"], 0.16),
        white=mix(palette["paper"], palette["paper_2"], 0.78),
    )
    horizontal = Image.linear_gradient("L").rotate(90, expand=False).resize((SIZE, SIZE))
    tint = ImageOps.colorize(horizontal, black="#FFFFFF", white=palette["paper_2"])
    return Image.blend(image, tint, 0.08)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        box = draw.textbbox((0, 0), trial, font=text_font)
        if box[2] - box[0] <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_paragraph(
    draw: ImageDraw.ImageDraw,
    position: tuple[int, int],
    text: str,
    text_font: ImageFont.FreeTypeFont,
    fill: str,
    max_width: int,
    line_gap: int = 18,
) -> int:
    x, y = position
    for line in wrap_text(draw, text, text_font, max_width):
        draw.text((x, y), line, font=text_font, fill=fill)
        y += text_font.size + line_gap
    return y


def draw_glass_geometry(canvas: Image.Image, palette: dict[str, str], card_index: int) -> None:
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    glass_rgb = hex_to_rgb(palette["glass"])
    offset = card_index * 42
    points = [
        (1460 + offset, -160),
        (2260, -160),
        (2260, 800 + offset),
        (2010, 800 + offset),
        (2010, 160 + offset),
        (1460 + offset, 160 + offset),
    ]
    draw.polygon(points, fill=(*glass_rgb, 42), outline=(*glass_rgb, 104))
    draw.line(points + [points[0]], fill=(*glass_rgb, 150), width=5)
    draw.line((1540 + offset, 100 + offset, 2050, 100 + offset, 2050, 690 + offset), fill=(*glass_rgb, 96), width=16)
    overlay = overlay.filter(ImageFilter.GaussianBlur(1.5))
    canvas.alpha_composite(overlay)


def draw_kymation_rule(draw: ImageDraw.ImageDraw, accent: str, y: int) -> None:
    """Echo Kymation's satin, milgrain and bevel order as a quiet footer rule."""
    draw.line((170, y - 18, 2030, y - 18), fill=accent, width=3)
    for x in range(176, 2026, 26):
        draw.ellipse((x, y - 5, x + 8, y + 3), fill=accent)
    draw.line((170, y + 16, 2030, y + 16), fill=accent, width=3)


def hero_crop(listing: dict, size: int = 510) -> Image.Image:
    path = PUBLIC_ROOT / listing["slug"] / "01-hero.jpg"
    image = Image.open(path).convert("RGB")
    image = ImageOps.fit(image, (size, size), method=Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, size, size), radius=58, fill=255)
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(image, (0, 0), mask)
    return output


def header(canvas: Image.Image, listing: dict, card_index: int, label: str) -> tuple[ImageDraw.ImageDraw, dict[str, str], str]:
    palette = KARAT_PALETTES[listing["karat"]]
    accent = METAL_ACCENTS[(listing["karat"], listing["metal"])]
    draw_glass_geometry(canvas, palette, card_index)
    draw = ImageDraw.Draw(canvas)
    draw.text((170, 150), "EON", font=SANS_36, fill=palette["ink"])
    draw.text((170, 215), "KYMATION 1009", font=SANS_26, fill=palette["muted"])
    draw.text((1650, 162), f"{card_index:02d} / 10", font=SANS_30, fill=palette["muted"])
    draw.text((170, 390), label.upper(), font=SANS_30, fill=accent)
    draw_kymation_rule(draw, accent, 1982)
    draw.text((170, 2087), listing["family_sku"], font=SANS_26, fill=palette["muted"])
    draw.text((1430, 2087), f'{listing["karat"]} {listing["metal"]}'.upper(), font=SANS_26, fill=palette["muted"])
    return draw, palette, accent


def new_canvas(listing: dict) -> Image.Image:
    return gradient(KARAT_PALETTES[listing["karat"]]).convert("RGBA")


def render_size_width(listing: dict) -> Image.Image:
    canvas = new_canvas(listing)
    draw, palette, accent = header(canvas, listing, 7, "Size and width")
    draw.text((170, 495), "Find your", font=SERIF_126, fill=palette["ink"])
    draw.text((170, 620), "proportion.", font=SERIF_164, fill=palette["ink"])

    draw.text((170, 940), "WIDTH", font=SANS_30, fill=palette["muted"])
    draw.text((170, 1000), "4 to 12 mm", font=SANS_58, fill=palette["ink"])
    baseline = 1208
    for index, width_mm in enumerate((4, 5, 7, 9, 12)):
        x = 170 + index * 235
        bar_width = 22 + width_mm * 8
        draw.rounded_rectangle((x, baseline - bar_width, x + 150, baseline), radius=8, fill=accent)
        draw.text((x, baseline + 25), f"{width_mm} mm", font=SANS_26, fill=palette["muted"])

    draw.text((170, 1360), "RING SIZE", font=SANS_30, fill=palette["muted"])
    draw.text((170, 1420), "US 4 to 16", font=SANS_58, fill=palette["ink"])
    draw.text((170, 1505), "Whole and half sizes", font=SANS_36, fill=palette["muted"])
    draw.rounded_rectangle((165, 1655, 1420, 1890), radius=42, outline=accent, width=4)
    draw_paragraph(
        draw,
        (220, 1715),
        "Wide bands can feel tighter. If you are between sizes, message us before ordering.",
        SANS_36,
        palette["ink"],
        1130,
        line_gap=16,
    )
    canvas.alpha_composite(hero_crop(listing, 480), (1545, 1020))
    return canvas.convert("RGB")


def render_metal_karat(listing: dict) -> Image.Image:
    canvas = new_canvas(listing)
    draw, palette, accent = header(canvas, listing, 8, "Metal and karat")
    draw.text((170, 490), listing["karat"], font=SERIF_164, fill=accent)
    draw.text((170, 690), listing["metal"], font=SERIF_126, fill=palette["ink"])
    draw.text((170, 870), "Solid gold. Never plated. Never filled.", font=SANS_42, fill=palette["ink"])

    facts = [
        ("COLOR", METAL_TONES[(listing["karat"], listing["metal"])]),
        ("CENTER", "Quiet fine satin"),
        ("EDGES", "Fine milgrain and mirror bevels"),
        ("PROFILE", "1.5 mm production specification"),
        ("HALLMARK", f'{listing["karat"]} inside the band'),
    ]
    y = 1090
    for label, value in facts:
        draw.text((170, y), label, font=SANS_26, fill=palette["muted"])
        draw.text((560, y - 8), value, font=SANS_36, fill=palette["ink"])
        draw.line((170, y + 62, 1420, y + 62), fill=accent, width=2)
        y += 140
    canvas.alpha_composite(hero_crop(listing, 520), (1510, 1160))
    return canvas.convert("RGB")


def render_personalization_care(listing: dict) -> Image.Image:
    canvas = new_canvas(listing)
    draw, palette, accent = header(canvas, listing, 9, "Personalization and care")
    draw.text((170, 500), "Your private", font=SERIF_126, fill=palette["ink"])
    draw.text((170, 625), "line.", font=SERIF_164, fill=palette["ink"])

    draw.rounded_rectangle((170, 930, 1060, 1440), radius=54, fill=(*hex_to_rgb(palette["paper"]), 170), outline=accent, width=4)
    draw.text((230, 1000), "INSIDE ENGRAVING", font=SANS_30, fill=accent)
    draw.text((230, 1090), "Up to 30", font=SANS_58, fill=palette["ink"])
    draw.text((230, 1170), "characters", font=SANS_58, fill=palette["ink"])
    draw_paragraph(draw, (230, 1285), "Script is the default. Request block letters in your note if preferred.", SANS_30, palette["muted"], 750, 12)

    draw.text((1180, 930), "CARE", font=SANS_30, fill=accent)
    care = [
        "Warm water and mild soap",
        "Dry with a soft cloth",
        "Avoid chlorine and abrasives",
        "Store separately when unworn",
    ]
    y = 1025
    for item in care:
        draw.ellipse((1182, y + 15, 1200, y + 33), fill=accent)
        y = draw_paragraph(draw, (1230, y), item, SANS_36, palette["ink"], 760, 12) + 35

    draw.text((170, 1640), "Copied exactly as entered.", font=SANS_42, fill=palette["ink"])
    draw_paragraph(draw, (170, 1725), "Leave the personalization box blank for an unengraved interior.", SANS_36, palette["muted"], 1350, 14)
    return canvas.convert("RGB")


def render_made_to_order(listing: dict) -> Image.Image:
    canvas = new_canvas(listing)
    draw, palette, accent = header(canvas, listing, 10, "Made to order")
    draw.text((170, 500), "Made for", font=SERIF_126, fill=palette["ink"])
    draw.text((170, 625), "your order.", font=SERIF_164, fill=palette["ink"])
    draw.text((170, 955), "5 to 7", font=SERIF_164, fill=accent)
    draw.text((170, 1135), "business days before dispatch", font=SANS_42, fill=palette["ink"])

    steps = [
        ("01", "Select size", "US 4 to 16, whole and half sizes"),
        ("02", "Select width", "4 mm through 12 mm"),
        ("03", "Hand finishing", "Satin, milgrain and mirror bevels"),
        ("04", "Dispatch", "Shipping terms appear at checkout"),
    ]
    y = 1335
    for number, title, detail in steps:
        draw.text((170, y), number, font=SANS_30, fill=accent)
        draw.text((300, y - 8), title, font=SANS_42, fill=palette["ink"])
        draw.text((860, y), detail, font=SANS_30, fill=palette["muted"])
        y += 145
    canvas.alpha_composite(hero_crop(listing, 470), (1535, 485))
    return canvas.convert("RGB")


def save_cards(listing: dict) -> Iterable[Path]:
    output_dir = PUBLIC_ROOT / listing["slug"]
    output_dir.mkdir(parents=True, exist_ok=True)
    cards = [
        ("07-size-width-guide.jpg", render_size_width(listing)),
        ("08-metal-karat-guide.jpg", render_metal_karat(listing)),
        ("09-personalization-care.jpg", render_personalization_care(listing)),
        ("10-made-to-order.jpg", render_made_to_order(listing)),
    ]
    for filename, image in cards:
        path = output_dir / filename
        image.save(path, format="JPEG", quality=95, subsampling=0, optimize=True)
        yield path


def main() -> None:
    catalog = json.loads(CATALOG_PATH.read_text())
    outputs = [path for listing in catalog["listings"] for path in save_cards(listing)]
    print(f"Rendered {len(outputs)} cards at {SIZE} by {SIZE} pixels")


if __name__ == "__main__":
    main()
