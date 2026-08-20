#!/usr/bin/env python3
"""Generate the EON Kymation 1009 Etsy catalog and panel migration."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/eon/kymation-1009"
PANEL_REFRESH_FILE = OUT / "panel-refresh.sql"
MIGRATION_FILE = ROOT / "supabase/migrations/0135_eon_kymation_1009.sql"
BASE_SCRIPT = ROOT / "scripts/eon-maeander/generate_catalog.py"

WIDTHS = list(range(4, 13))
SIZES = [4 + index * 0.5 for index in range(25)]
QUANTITY = 20
THICKNESS_MM = 1.5
LABOR = 55.0

spec = importlib.util.spec_from_file_location("eon_maeander_generator", BASE_SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load {BASE_SCRIPT}")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

METALS = base.METALS
PURITY = base.PURITY

SCENES = {
    ("Yellow Gold", "10K"): {
        "glass": "a thin pale celadon smoke-glass fin",
        "ground": "cool limewash clay",
        "light": "hazy east-window morning light with one soft vertical beam",
        "cue": "asymmetrical folded-paper spacing",
    },
    ("Yellow Gold", "14K"): {
        "glass": "a small mineral-jade ribbed glass disc",
        "ground": "pale bone plaster",
        "light": "clean late-morning window light broken into two restrained bands",
        "cue": "a low circular counterpoint to the ring",
    },
    ("Yellow Gold", "18K"): {
        "glass": "a smoke-olive hand-blown glass dome",
        "ground": "warm wheat microcement",
        "light": "low amber daylight with a soft elongated shadow",
        "cue": "a quiet horizon composition with no plinth",
    },
    ("White Gold", "10K"): {
        "glass": "a clear ice-blue hand-cut glass arch",
        "ground": "chalk linen over a rigid board",
        "light": "cool north-window dawn light with diffused edge falloff",
        "cue": "open arch framing with imperfect linen texture",
    },
    ("White Gold", "14K"): {
        "glass": "a desaturated seafoam glass tube",
        "ground": "warm gray raw cotton paper",
        "light": "overcast side daylight interrupted by one narrow clear beam",
        "cue": "a diagonal balance between cylinder and ring",
    },
    ("White Gold", "18K"): {
        "glass": "a deep petrol hand-cast glass slab",
        "ground": "warm ivory mineral clay",
        "light": "restrained late-day window light with a long soft-edged beam",
        "cue": "low stepped geometry and generous upper negative space",
    },
    ("Rose Gold", "10K"): {
        "glass": "a pale smoke-lilac glass ribbon",
        "ground": "eggshell gypsum board",
        "light": "neutral early-morning daylight with a faint curved caustic",
        "cue": "a light ribbon gesture that never touches the ring",
    },
    ("Rose Gold", "14K"): {
        "glass": "a handmade clear peach glass wedge",
        "ground": "matte chalk-clay",
        "light": "late-morning window daylight shaped by lightly ribbed glass",
        "cue": "an off-center glass fold and calm open field",
    },
    ("Rose Gold", "18K"): {
        "glass": "a deep garnet smoke-glass crescent",
        "ground": "muted almond fiber paper",
        "light": "warm low window daylight with one restrained edge caustic",
        "cue": "a crescent shadow that leads toward the ring",
    },
}

PHOTO_ROLES = [
    (
        "01-hero.jpg",
        "Hero three-quarter view, ring upright on a low rectangular glass plinth, centered with generous clean negative space",
    ),
    (
        "02-macro.jpg",
        "Extreme macro across the satin center, one complete fine milgrain line and the adjacent mirror-polished planar bevel",
    ),
    (
        "03-side.jpg",
        "Low side view showing both crisp bevels, the 1.5mm wall and the uninterrupted polished comfort-fit interior",
    ),
    (
        "04-top.jpg",
        "Top view showing the complete circular silhouette, broad satin center and symmetrical twin edge construction",
    ),
    (
        "05-on-hand.jpg",
        "Natural on-hand scale photograph on one adult hand with realistic skin texture and a relaxed pose",
    ),
    (
        "06-editorial.jpg",
        "Bright editorial composition with limestone, one stepped glass object and a long physically plausible architectural shadow",
    ),
]

CARD_FILES = [
    "07-size-width-guide.jpg",
    "08-metal-karat-guide.jpg",
    "09-personalization-care.jpg",
    "10-made-to-order.jpg",
]


def tags_for(karat: str, metal: str) -> list[str]:
    color = METALS[metal]["short"]
    tags = [
        "beveled gold ring",
        "milgrain band",
        "satin wedding band",
        f"{karat.lower()} gold ring",
        f"{karat.lower()} wedding band",
        f"{color} gold band",
        "mens wedding band",
        "unisex gold ring",
        "comfort fit ring",
        "wide gold band",
        "matte gold ring",
        "anniversary band",
        "heirloom gold ring",
    ]
    assert len(tags) == 13
    assert all(len(tag) <= 20 for tag in tags), tags
    return tags


def title_for(karat: str, metal: str) -> str:
    title = (
        f"{karat} Solid {metal} Beveled Milgrain Wedding Band, "
        "Satin Center Ring, 4mm to 12mm"
    )
    assert len(title) <= 140
    assert len(title.replace(",", "").split()) <= 15
    return title


def description_for(karat: str, metal: str) -> str:
    k = karat.lower()
    color = metal.lower()
    tone_line = {
        "10K": "Its alloy tone is restrained and practical for daily wear.",
        "14K": "Its alloy tone balances warmth, durability and daily wear.",
        "18K": "Its higher gold content gives the surface a fuller, more saturated alloy tone.",
    }[karat]
    if metal == "White Gold":
        tone_line = {
            "10K": "Its alloy reads cool and silver white, without a chrome cast.",
            "14K": "Its alloy reads neutral and softly white, without a chrome cast.",
            "18K": "Its alloy carries a subtle warmth while remaining visibly white gold.",
        }[karat]
    elif metal == "Rose Gold":
        tone_line = {
            "10K": "Its alloy reads as a muted pale blush, never red.",
            "14K": "Its alloy carries a balanced blush copper tone, never red.",
            "18K": "Its higher gold content gives the rose tone a deeper, warmer presence, never red.",
        }[karat]

    return f"""A solid {k} {color} wedding band with a broad satin center, two fine milgrain borders and crisp mirror-polished beveled edges. Made to order in your size and width, never plated and never filled.

THE DETAILS
Metal: Solid {k} {color}. Never plated, never filled.
Center: Broad satin finish with a quiet linear grain.
Borders: One continuous fine milgrain line on each side of the center.
Edges: Symmetrical mirror-polished planar bevels.
Fit: Polished comfort-fit interior with smooth edges.
Widths: 4mm through 12mm, in whole millimeters.
Thickness: 1.5mm production specification.
Sizes: US 4 through 16, whole and half sizes.
Hallmark: Stamped {k} inside the band.

The satin center holds the light softly. The milgrain lines define its boundaries and the polished bevels return a sharper reflection at each edge. {tone_line}

SIZE AND WIDTH
Choose Ring Size from US 4 through 16, including half sizes. Choose Width from 4mm through 12mm. A 4mm to 5mm band reads restrained. A 6mm to 8mm band has a balanced presence. A 9mm to 12mm band sits broad across the finger. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes.

MAKE IT YOURS
Add an inside engraving in the Personalization box or leave it blank. Engraving is included, up to 30 characters, and copied exactly as entered. Script is the default. Write block letters in your note if you prefer them.

MADE TO ORDER
I cut and finish each band for the width and size you select. The satin center, twin milgrain lines and polished bevels are finished as one coherent profile. Standard processing is 5 to 7 business days before dispatch. Shipping and return terms follow the shop policies shown at checkout.

CARE
Clean with warm water, mild soap and a soft cloth. Avoid chlorine and abrasive compounds. Store the ring separately when it is not being worn.

WHY EON
Kymation is built around the line where one surface becomes another. A soft center meets a precise edge, keeping detail close without turning ornamental.

---
[EON Kymation 1009 | {karat} {metal} | Width 4mm to 12mm | Ring Size US 4 to 16 whole and half | 1.5mm pricing and production specification | quantity {QUANTITY} per variant | personalization max 30 characters]"""


def prompt_for(karat: str, metal: str, role: str) -> str:
    tone = METALS[metal]["tones"][karat]
    scene = SCENES[(metal, karat)]
    return f"""Create one square 1:1 photorealistic Etsy listing photograph for EON Fine Jewelry at 2200 by 2200 pixels. No text, logo, border, watermark or packaging.

REFERENCE AUTHORITY
The supplied IMG_8554, IMG_8555, IMG_8556 and IMG_8557 stills plus representative frames from IMG_8558 and IMG_8559 are the absolute product geometry authority. Copy the ring construction exactly. Other EON imagery may influence only brightness, glass and natural shadows. Never borrow another ring design.

PRODUCT LOCK
Show one single solid-gold, stone-free, closed comfort-fit wedding band. Preserve this exact symmetrical order across the width: mirror-polished planar bevel, one extremely fine continuous milgrain line, broad satin center, one extremely fine continuous milgrain line, mirror-polished planar bevel. The satin center occupies about 68 percent of the width. Both milgrain lines together occupy about 5 percent. Both bevels together occupy about 27 percent. Bevels are crisp and faceted, never domed, rolled or rope-shaped. Interior is smooth and highly polished. No central groove, Greek key, hammering, diagonal ribs, stones, letters, engraving or extra jewelry.

MATERIAL LOCK
Render {karat} {metal} as {tone}. Geometry and finish placement must not change with metal or karat. Show the 5mm photography sample at its believable real-world scale unless the shot is an extreme macro. The production thickness is 1.5mm.

KYMATION GLASS SCENE
Use {scene['glass']}, {scene['ground']}, {scene['light']} and {scene['cue']}. This listing must have its own composition and light behavior. Never reuse another metal or karat listing's scene as a recolor. The result should feel like inventive professional home-studio photography, not a generic luxury template. Keep physically plausible refraction, restrained highlights, natural micro-detail and a contact shadow that connects the ring to its surface. Use neutral color science and soft highlight rolloff. Reject artificial HDR, synthetic vibrancy, cinematic grading, plastic smoothing, excessive sharpening, fake sparkle, haze, glowing edges and impossible reflections.

SHOT
{role}. Use realistic macro jewelry optics, accurate materials, safe square thumbnail composition and natural depth of field. Reject any result whose ring differs from the supplied reference construction."""


def alt_texts(karat: str, metal: str) -> list[str]:
    k = karat.lower()
    color = metal.lower()
    return [
        f"{k} {color} beveled milgrain wedding band on geometric glass",
        f"Macro of the satin center, fine milgrain and polished bevel in {k} {color}",
        f"Side view of the {k} {color} beveled band and comfort-fit interior",
        f"Top view of the solid {k} {color} satin milgrain wedding band",
        f"{k} {color} beveled milgrain wedding band worn on an adult hand",
        f"EON Kymation {k} {color} ring in mineral glass light and natural shadow",
        "Ring size and width guide for US 4 to 16 and 4mm to 12mm",
        f"{karat} {metal} material and color guide",
        "Inside engraving and solid gold ring care guide",
        "Made-to-order processing and shipping expectations",
    ]


def build_catalog() -> dict:
    weights = base.load_weights()
    listings = []
    research_group = 52
    for metal, metal_spec in METALS.items():
        for karat in ("10K", "14K", "18K"):
            family = f"{metal_spec['prefix']}-R-{karat[:2]}09"
            slug = family.lower()
            variants = []
            for width in WIDTHS:
                for size in SIZES:
                    grams = base.grams_for(weights, karat, width, size)
                    variants.append(
                        {
                            "sku": f"{family}-{width}MM-{base.size_text(size)}",
                            "width_mm": width,
                            "ring_size_us": base.size_text(size),
                            "weight_grams": grams,
                            "price_preview_cents_active_basis": base.list_price_cents(
                                karat, width, grams
                            ),
                            "quantity": QUANTITY,
                            "properties": {
                                "Karat": karat,
                                "Metal": metal,
                                "Width": f"{width}mm",
                                "Ring Size": base.size_text(size),
                            },
                        }
                    )

            alts = alt_texts(karat, metal)
            images = []
            prompts = []
            for index, (filename, role) in enumerate(PHOTO_ROLES, start=1):
                url = f"https://amuletta.artifactstudio.info/eon/kymation-1009/{slug}/{filename}"
                images.append(
                    {
                        "position": index - 1,
                        "filename": filename,
                        "url": url,
                        "alt": alts[index - 1],
                        "kind": "photo",
                    }
                )
                prompts.append(
                    {
                        "position": index,
                        "filename": filename,
                        "prompt": prompt_for(karat, metal, role),
                    }
                )
            for position, filename in enumerate(CARD_FILES, start=7):
                url = f"https://amuletta.artifactstudio.info/eon/kymation-1009/{slug}/{filename}"
                images.append(
                    {
                        "position": position - 1,
                        "filename": filename,
                        "url": url,
                        "alt": alts[position - 1],
                        "kind": "information-card",
                    }
                )

            listings.append(
                {
                    "family_sku": family,
                    "slug": slug,
                    "karat": karat,
                    "metal": metal,
                    "title": title_for(karat, metal),
                    "description": description_for(karat, metal),
                    "tags": tags_for(karat, metal),
                    "materials": [f"Solid {karat.lower()} gold", metal],
                    "shop_section": "Frieze & Textured Bands",
                    "research_keyword": f"{karat.lower()} {metal.lower()} beveled milgrain wedding band",
                    "research_group": research_group,
                    "quantity": QUANTITY,
                    "thickness_mm": THICKNESS_MM,
                    "widths_mm": WIDTHS,
                    "ring_sizes_us": [base.size_text(size) for size in SIZES],
                    "pricing": {
                        "migration_strategy": "latest gold_reprice_basis, fallback 4399.90 USD per troy ounce",
                        "preview_spot_usd_per_ozt": base.BASE_SPOT,
                        "profile": "handfinished",
                        "labor_usd": LABOR,
                    },
                    "images": images,
                    "prompts": prompts,
                    "variants": variants,
                }
            )
            research_group += 1

    return {
        "schema_version": 1,
        "generated_at": "2026-08-20",
        "collection": "EON Kymation 1009",
        "listing_count": len(listings),
        "variants_per_listing": len(WIDTHS) * len(SIZES),
        "total_variants": len(listings) * len(WIDTHS) * len(SIZES),
        "listings": listings,
    }


def emit_migration(catalog: dict) -> str:
    migration = base.emit_migration(catalog)
    replacements = (
        ("scripts/eon-maeander/generate_catalog.py", "scripts/eon-kymation/generate_catalog.py"),
        ("Maeander 1008", "Kymation 1009"),
        ("maeander-1008", "kymation-1009"),
        ("_maeander_variants", "_kymation_variants"),
        ("catalog_maeander_1_5mm", "catalog_kymation_1_5mm"),
        ("$maeander$", "$kymation$"),
        (")08$'",
        ")09$'",
        ),
        ("::integer < 5;", "::integer < 4;"),
    )
    for old, new in replacements:
        migration = migration.replace(old, new)
    return migration


def verify(catalog: dict, migration: str) -> None:
    assert catalog["listing_count"] == 9
    assert catalog["variants_per_listing"] == 225
    assert catalog["total_variants"] == 2025
    assert len({item["family_sku"] for item in catalog["listings"]}) == 9
    all_skus = [
        variant["sku"]
        for listing in catalog["listings"]
        for variant in listing["variants"]
    ]
    assert len(all_skus) == len(set(all_skus)) == 2025
    for listing in catalog["listings"]:
        assert listing["widths_mm"] == WIDTHS
        assert listing["ring_sizes_us"][0] == "4"
        assert listing["ring_sizes_us"][-1] == "16"
        assert len(listing["variants"]) == 225
        assert len(listing["images"]) == 10
        assert len(listing["prompts"]) == 6
        assert len(listing["tags"]) == 13
        assert all(len(tag) <= 20 for tag in listing["tags"])
        assert listing["pricing"]["labor_usd"] == 55.0
    assert "catalog_kymation_1_5mm" in migration
    assert "::integer < 4;" in migration
    assert "etsy_listing_id null" in migration


def main() -> None:
    base.OUT = OUT
    catalog = build_catalog()
    base.write_catalog(catalog)
    migration = emit_migration(catalog)
    verify(catalog, migration)
    PANEL_REFRESH_FILE.write_text(migration)
    MIGRATION_FILE.write_text(migration)
    print(
        json.dumps(
            {
                "catalog": str(OUT / "catalog.json"),
                "panel_refresh": str(PANEL_REFRESH_FILE),
                "migration": str(MIGRATION_FILE),
                "listings": catalog["listing_count"],
                "variants": catalog["total_variants"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
