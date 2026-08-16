#!/usr/bin/env python3
"""Generate the EON Maeander 1008 Etsy catalog and SQL migration."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "eon" / "maeander-1008"
WEIGHTS_FILE = ROOT / "docs" / "eon" / "eon-weight-tables.json"
MIGRATION_FILE = ROOT / "supabase" / "migrations" / "0131_eon_maeander_1008.sql"

WIDTHS = list(range(3, 13))
SIZES = [4 + i * 0.5 for i in range(25)]
QUANTITY = 20
THICKNESS_MM = 1.5
BASE_SPOT = 4090.0
TROY_OZ_GRAMS = 31.1034768
FIRE = 0.07
LABOR = 40.0
PACKAGING = 8.0
SHIPPING = 22.0
PURITY = {"10K": 0.417, "14K": 0.583, "18K": 0.75}

METALS = {
    "Yellow Gold": {
        "prefix": "GLD",
        "slug": "yellow-gold",
        "short": "yellow",
        "tones": {
            "10K": "pale straw yellow gold",
            "14K": "balanced natural honey yellow gold",
            "18K": "deep rich yellow gold",
        },
    },
    "White Gold": {
        "prefix": "WHG",
        "slug": "white-gold",
        "short": "white",
        "tones": {
            "10K": "cool silver white gold, never chrome",
            "14K": "neutral soft white gold, never chrome",
            "18K": "warm champagne white gold, never yellow and never chrome",
        },
    },
    "Rose Gold": {
        "prefix": "RSG",
        "slug": "rose-gold",
        "short": "rose",
        "tones": {
            "10K": "muted pale blush rose gold, never red",
            "14K": "balanced blush copper rose gold, never red",
            "18K": "rich rose gold, warm but never red",
        },
    },
}

SCENES = {
    "10K": {
        "glass": "glacial smoke glass",
        "ground": "cool chalk limestone",
        "light": "clear pale late-morning daylight",
    },
    "14K": {
        "glass": "deep cobalt blue glass",
        "ground": "pale honed limestone",
        "light": "clean Mediterranean late-morning sunlight",
    },
    "18K": {
        "glass": "smoked amethyst glass",
        "ground": "warm limestone",
        "light": "restrained amber late-afternoon sunlight",
    },
}

PHOTO_ROLES = [
    (
        "01-hero.jpg",
        "Hero, upright three-quarter view on a low angular glass plinth, centered with clean negative space",
    ),
    (
        "02-macro.jpg",
        "Extreme macro of the coherent Greek key repeat, fine milgrain borders and braided rope rails",
    ),
    (
        "03-side.jpg",
        "Low side view showing the rail order, 1.5mm profile and polished comfort-fit interior",
    ),
    (
        "04-top.jpg",
        "Top view with the full circular silhouette and an abstract right-angle glass rhythm",
    ),
    (
        "05-on-hand.jpg",
        "Natural on-hand scale photograph on an adult hand, realistic skin texture and a relaxed pose",
    ),
    (
        "06-editorial.jpg",
        "Bright editorial composition using limestone, one geometric glass object and a long natural architectural shadow",
    ),
]

CARD_FILES = [
    "07-size-width-guide.jpg",
    "08-metal-karat-guide.jpg",
    "09-personalization-care.jpg",
    "10-made-to-order.jpg",
]


def size_text(value: float) -> str:
    return str(int(value)) if value.is_integer() else f"{value:.1f}"


def sql_lit(value: str) -> str:
    if "$maeander$" in value:
        raise ValueError("Invalid dollar quote content")
    return f"$maeander${value}$maeander$"


def sql_array(values: list[str]) -> str:
    return "ARRAY[" + ",".join(sql_lit(v) for v in values) + "]::text[]"


def excel_round(value: float) -> int:
    return math.floor(value + 0.5)


def list_price_cents(karat: str, width: int, grams: float, spot: float = BASE_SPOT) -> int:
    raw = grams * (spot / TROY_OZ_GRAMS) * PURITY[karat] * (1 + FIRE)
    raw += LABOR + PACKAGING + SHIPPING
    motor = excel_round(raw * (1.55 if width <= 7 else 2.0))
    return math.ceil((motor * 4) / 15) * 5 * 100


def load_weights() -> dict:
    return json.loads(WEIGHTS_FILE.read_text())["weights_grams"]


def grams_for(weights: dict, karat: str, width: int, size: float) -> float:
    row = weights[karat][str(width)]["1.5"]
    if size.is_integer():
        return float(row[int(size) - 4])
    low = int(math.floor(size))
    a = float(row[low - 4])
    b = float(row[low - 3])
    return round((a + b) / 2, 3)


def tags_for(karat: str, metal: str) -> list[str]:
    color = METALS[metal]["short"]
    tags = [
        "greek key ring",
        "meander wedding band",
        f"{karat.lower()} gold ring",
        f"{karat.lower()} wedding band",
        f"{color} gold ring",
        "rope edge ring",
        "mens gold band",
        "unisex wedding ring",
        "comfort fit band",
        "patterned gold ring",
        "engraved gold band",
        "anniversary ring",
        "heirloom gold ring",
    ]
    assert len(tags) == 13
    assert all(len(tag) <= 20 for tag in tags), tags
    return tags


def description_for(karat: str, metal: str) -> str:
    k = karat.lower()
    color = metal.lower()
    tone_line = {
        "10K": "Its color is restrained and practical, with a quieter alloy tone for daily wear.",
        "14K": "Its color holds a balanced midpoint between warmth, durability and daily wear.",
        "18K": "Its higher gold content gives the surface a fuller, more saturated alloy tone.",
    }[karat]
    if metal == "White Gold":
        tone_line = {
            "10K": "Its alloy reads cool and silver white, without a chrome cast.",
            "14K": "Its alloy reads neutral and softly white, without a chrome cast.",
            "18K": "Its alloy carries a quiet champagne warmth while remaining white gold.",
        }[karat]
    elif metal == "Rose Gold":
        tone_line = {
            "10K": "Its alloy reads as a muted pale blush, never red.",
            "14K": "Its alloy carries a balanced blush copper tone, never red.",
            "18K": "Its higher gold content gives the rose tone a deeper, warmer presence, never red.",
        }[karat]

    return f"""A solid {k} {color} Greek key wedding band, cut with a continuous Maeander center and framed by braided rope rails. Made to order in your size and width, never plated and never filled.

THE DETAILS
Metal: Solid {k} {color}. Never plated, never filled.
Pattern: Continuous Greek key center with recessed microtexture.
Borders: Fine milgrain directly framing the center, with one braided rope rail on each outer side.
Fit: Polished comfort-fit interior with smooth edges.
Widths: 3mm through 12mm, in whole millimeters.
Thickness: 1.5mm production specification.
Sizes: US 4 through 16, whole and half sizes.
Hallmark: Stamped {k} inside the band.

The meander turns through one unbroken line. The rope rails protect that rhythm at both edges while the recessed fields hold a softer surface. {tone_line}

SIZE AND WIDTH
Choose Ring Size from US 4 through 16, including half sizes. Choose Width from 3mm through 12mm. A 3mm to 5mm band reads restrained. A 6mm to 8mm band has a balanced presence. A 9mm to 12mm band sits broad across the finger. Wider bands can feel tighter than narrow bands, so message us before ordering if you are between sizes.

MAKE IT YOURS
Add an inside engraving in the Personalization box or leave it blank. Engraving is included, up to 30 characters, and copied exactly as entered. Script is the default. Write block letters in your note if you prefer them.

MADE TO ORDER
I cut and finish each band for the width and size you select. The Greek key repeat, milgrain borders and rope rails are finished as one coherent pattern. Standard processing is 5 to 7 business days before dispatch. Shipping and return terms follow the shop policies shown at checkout.

CARE
Clean with warm water, mild soap and a soft cloth. Avoid chlorine and abrasive compounds. Store the ring separately when it is not being worn.

WHY EON
The pattern is old, but the object belongs to one life. The continuous line holds a private meaning: what is carried, kept and passed forward.

---
[EON Maeander 1008 | {karat} {metal} | Width 3mm to 12mm | Ring Size US 4 to 16 whole and half | 1.5mm pricing and production specification | quantity {QUANTITY} per variant | personalization max 30 characters]"""


def title_for(karat: str, metal: str) -> str:
    title = (
        f"{karat} Solid {metal} Greek Key Wedding Band, "
        "Maeander Rope Edge Ring, 3mm to 12mm"
    )
    assert len(title) <= 140
    assert len(title.replace(",", "").split()) <= 15
    return title


def prompt_for(karat: str, metal: str, role: str) -> str:
    tone = METALS[metal]["tones"][karat]
    scene = SCENES[karat]
    return f"""Create one square 1:1 photorealistic Etsy listing photograph for EON Fine Jewelry at 2048 by 2048 pixels or larger. No text, logo, border, watermark or packaging.

REFERENCE ROLES
References 1 and 2 are the absolute product geometry authority. Preserve one single solid-gold comfort-fit wedding band with a coherent continuous Greek key center, two fine milgrain borders directly framing the center and one braided rope rail on each outer side. Preserve crisp right-angle turns, recessed negative spaces, polished edge rails and a polished interior. References 3, 4 and 5 define only the bright product-photography language, physical glass, natural daylight and shadows. Do not copy their rings, colors, arches or exact compositions.

PRODUCT LOCK
One ring only. No stones, engraving, letters, symbols or extra jewelry. Render {karat} {metal} as {tone}. Show a believable 6mm sample unless the camera angle is a macro. The Greek key repeat must remain coherent around the visible circumference with no broken turns or random glyphs.

AEGEAN GLASS SCENE
Use {scene['glass']}, {scene['ground']} and {scene['light']}. Glass geometry is abstract and angular, suggesting one right-angle meander turn without becoming a literal Greek prop. Keep physically plausible refraction, restrained highlights and a soft natural contact shadow that connects the ring to its surface. Bright, calm, conversion-oriented product photography, never black museum lighting and never fantasy.

SHOT
{role}. Use realistic macro jewelry optics, accurate materials, safe square thumbnail composition and natural depth of field."""


def alt_texts(karat: str, metal: str) -> list[str]:
    k = karat.lower()
    color = metal.lower()
    return [
        f"{k} {color} Greek key wedding band on geometric glass, three-quarter view",
        f"Macro detail of the Maeander pattern, milgrain and rope rails in {k} {color}",
        f"Side view of the {k} {color} Greek key band and polished comfort-fit interior",
        f"Top view of the solid {k} {color} Maeander wedding band",
        f"{k} {color} Greek key wedding band worn on an adult hand",
        f"EON Maeander {k} {color} ring in Aegean Glass light and natural shadow",
        "Ring size and width guide for US 4 to 16 and 3mm to 12mm",
        f"{karat} {metal} material and color guide",
        "Inside engraving and solid gold ring care guide",
        "Made-to-order processing and shipping expectations",
    ]


def build_catalog() -> dict:
    weights = load_weights()
    listings = []
    research_group = 43
    for metal, metal_spec in METALS.items():
        for karat in ("10K", "14K", "18K"):
            family = f"{metal_spec['prefix']}-R-{karat[:2]}08"
            slug = family.lower()
            variants = []
            for width in WIDTHS:
                for size in SIZES:
                    grams = grams_for(weights, karat, width, size)
                    variants.append(
                        {
                            "sku": f"{family}-{width}MM-{size_text(size)}",
                            "width_mm": width,
                            "ring_size_us": size_text(size),
                            "weight_grams": grams,
                            "price_preview_cents_spot_4090": list_price_cents(
                                karat, width, grams
                            ),
                            "quantity": QUANTITY,
                            "properties": {
                                "Karat": karat,
                                "Metal": metal,
                                "Width": f"{width}mm",
                                "Ring Size": size_text(size),
                            },
                        }
                    )

            alts = alt_texts(karat, metal)
            images = []
            prompts = []
            for index, (filename, role) in enumerate(PHOTO_ROLES, start=1):
                url = f"https://amuletta.artifactstudio.info/eon/maeander-1008/{slug}/{filename}"
                images.append({"position": index - 1, "filename": filename, "url": url, "alt": alts[index - 1], "kind": "photo"})
                prompts.append({"position": index, "filename": filename, "prompt": prompt_for(karat, metal, role)})
            for offset, filename in enumerate(CARD_FILES, start=7):
                url = f"https://amuletta.artifactstudio.info/eon/maeander-1008/{slug}/{filename}"
                images.append({"position": offset - 1, "filename": filename, "url": url, "alt": alts[offset - 1], "kind": "information-card"})

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
                    "research_keyword": f"{karat.lower()} {metal.lower()} Greek key wedding band",
                    "research_group": research_group,
                    "quantity": QUANTITY,
                    "thickness_mm": THICKNESS_MM,
                    "widths_mm": WIDTHS,
                    "ring_sizes_us": [size_text(s) for s in SIZES],
                    "pricing": {
                        "migration_strategy": "latest gold_reprice_basis, fallback 4090 USD per troy ounce",
                        "preview_spot_usd_per_ozt": BASE_SPOT,
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
        "generated_at": "2026-08-16",
        "collection": "EON Maeander 1008",
        "listing_count": len(listings),
        "variants_per_listing": len(WIDTHS) * len(SIZES),
        "total_variants": len(listings) * len(WIDTHS) * len(SIZES),
        "listings": listings,
    }


def write_catalog(catalog: dict) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "catalog.json").write_text(json.dumps(catalog, indent=2) + "\n")
    (OUT / "prompts.json").write_text(
        json.dumps(
            {
                listing["family_sku"]: listing["prompts"]
                for listing in catalog["listings"]
            },
            indent=2,
        )
        + "\n"
    )

    with (OUT / "listings.csv").open("w", newline="") as handle:
        fields = [
            "family_sku",
            "karat",
            "metal",
            "title",
            "description",
            "tags",
            "materials",
            "research_keyword",
            "variant_count",
            "image_count",
        ]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for listing in catalog["listings"]:
            writer.writerow(
                {
                    "family_sku": listing["family_sku"],
                    "karat": listing["karat"],
                    "metal": listing["metal"],
                    "title": listing["title"],
                    "description": listing["description"],
                    "tags": "|".join(listing["tags"]),
                    "materials": "|".join(listing["materials"]),
                    "research_keyword": listing["research_keyword"],
                    "variant_count": len(listing["variants"]),
                    "image_count": len(listing["images"]),
                }
            )

    with (OUT / "variants.csv").open("w", newline="") as handle:
        fields = [
            "family_sku",
            "sku",
            "karat",
            "metal",
            "width_mm",
            "ring_size_us",
            "weight_grams",
            "price_preview_cents_spot_4090",
            "quantity",
        ]
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for listing in catalog["listings"]:
            for variant in listing["variants"]:
                writer.writerow(
                    {
                        "family_sku": listing["family_sku"],
                        "sku": variant["sku"],
                        "karat": listing["karat"],
                        "metal": listing["metal"],
                        "width_mm": variant["width_mm"],
                        "ring_size_us": variant["ring_size_us"],
                        "weight_grams": variant["weight_grams"],
                        "price_preview_cents_spot_4090": variant[
                            "price_preview_cents_spot_4090"
                        ],
                        "quantity": variant["quantity"],
                    }
                )


def emit_migration(catalog: dict) -> str:
    lines = [
        "-- Generated by scripts/eon-maeander/generate_catalog.py.",
        "-- Creates nine EON Maeander 1008 listing suggestions.",
        "-- Etsy remains untouched. Each row is a panel draft with etsy_listing_id null.",
        "-- Prices use the latest EON gold_reprice_basis at migration time, with 4090 fallback.",
        "",
    ]

    for listing in catalog["listings"]:
        family = listing["family_sku"]
        lines.extend(
            [
                "insert into public.products (",
                "  org_id, sku, title, description, tags, materials, status, currency,",
                "  price_cents, quantity, has_variations, image_url, num_images,",
                "  research_keyword, research_group",
                ")",
                "select",
                f"  o.id, {sql_lit(family)},",
                f"  {sql_lit(listing['title'])},",
                f"  {sql_lit(listing['description'])},",
                f"  {sql_array(listing['tags'])},",
                f"  {sql_array(listing['materials'])},",
                "  'draft', 'USD', 1, 20, true,",
                f"  {sql_lit(listing['images'][0]['url'])}, 10,",
                f"  {sql_lit(listing['research_keyword'])}, {listing['research_group']}",
                "from public.organizations o",
                "where o.name = 'EON'",
                "  and not exists (",
                "    select 1 from public.products p",
                f"    where p.org_id = o.id and p.sku = {sql_lit(family)}",
                "  );",
                "",
                "update public.products p set",
                f"  title = {sql_lit(listing['title'])},",
                f"  description = {sql_lit(listing['description'])},",
                f"  tags = {sql_array(listing['tags'])},",
                f"  materials = {sql_array(listing['materials'])},",
                f"  image_url = {sql_lit(listing['images'][0]['url'])},",
                "  num_images = 10,",
                f"  research_keyword = {sql_lit(listing['research_keyword'])},",
                f"  research_group = {listing['research_group']},",
                "  has_variations = true,",
                "  updated_at = now()",
                "from public.organizations o",
                f"where p.org_id = o.id and o.name = 'EON' and p.sku = {sql_lit(family)};",
                "",
            ]
        )

    lines.extend(
        [
            "create temp table _maeander_variants (",
            "  family text, karat text, metal text, purity numeric,",
            "  sku text, width_mm integer, ring_size text, grams numeric",
            ");",
            "insert into _maeander_variants",
            "  (family, karat, metal, purity, sku, width_mm, ring_size, grams)",
            "values",
        ]
    )
    rows = []
    for listing in catalog["listings"]:
        for variant in listing["variants"]:
            rows.append(
                "  ("
                + ", ".join(
                    [
                        sql_lit(listing["family_sku"]),
                        sql_lit(listing["karat"]),
                        sql_lit(listing["metal"]),
                        str(PURITY[listing["karat"]]),
                        sql_lit(variant["sku"]),
                        str(variant["width_mm"]),
                        sql_lit(variant["ring_size_us"]),
                        str(variant["weight_grams"]),
                    ]
                )
                + ")"
            )
    lines.append(",\n".join(rows) + ";")
    lines.extend(
        [
            "",
            "insert into public.product_variants (",
            "  org_id, sku, product_id, properties, price_cents, quantity,",
            "  weight_grams, weight_source, active, currency",
            ")",
            "select",
            "  p.org_id, v.sku, p.id,",
            "  jsonb_build_object(",
            "    'Karat', v.karat, 'Metal', v.metal,",
            "    'Width', v.width_mm || 'mm', 'Ring Size', v.ring_size",
            "  ),",
            "  (ceil(round((",
            "    v.grams * (basis.spot_per_ozt / 31.1034768) * v.purity * 1.07",
            "    + 40 + 8 + 22",
            "  ) * case when v.width_mm <= 7 then 1.55 else 2.0 end) * 4.0 / 15.0) * 5 * 100)::integer,",
            f"  {QUANTITY}, v.grams, 'catalog_maeander_1_5mm', true, 'USD'",
            "from _maeander_variants v",
            "join public.products p on p.sku = v.family",
            "join public.organizations o on o.id = p.org_id and o.name = 'EON'",
            "cross join lateral (",
            "  select coalesce(",
            "    (select b.spot_per_ozt from public.gold_reprice_basis b",
            "     where b.org_id = o.id order by b.created_at desc limit 1),",
            "    (select c.spot_usd_per_ozt from public.pricing_config c where c.org_id = o.id),",
            "    4090",
            "  )::numeric as spot_per_ozt",
            ") basis",
            "on conflict (org_id, sku) do update set",
            "  product_id = excluded.product_id,",
            "  properties = excluded.properties,",
            "  price_cents = excluded.price_cents,",
            "  quantity = excluded.quantity,",
            "  weight_grams = excluded.weight_grams,",
            "  weight_source = excluded.weight_source,",
            "  active = excluded.active,",
            "  currency = excluded.currency,",
            "  updated_at = now();",
            "",
            "drop table _maeander_variants;",
            "",
            "update public.products p",
            "set price_cents = m.min_cents, updated_at = now()",
            "from (",
            "  select product_id, min(price_cents) as min_cents",
            "  from public.product_variants",
            "  where weight_source = 'catalog_maeander_1_5mm'",
            "  group by product_id",
            ") m",
            "where p.id = m.product_id;",
            "",
        ]
    )

    for listing in catalog["listings"]:
        family = listing["family_sku"]
        prefix = f"https://amuletta.artifactstudio.info/eon/maeander-1008/{listing['slug']}/%"
        lines.extend(
            [
                "delete from public.listing_images li",
                "using public.products p",
                "where li.product_id = p.id",
                f"  and p.sku = {sql_lit(family)}",
                f"  and li.url like {sql_lit(prefix)};",
                "",
                "insert into public.listing_images (org_id, product_id, url, source, alt, position)",
                "select p.org_id, p.id, i.url, 'url', i.alt, i.position",
                "from public.products p",
                "join public.organizations o on o.id = p.org_id and o.name = 'EON'",
                "cross join (values",
            ]
        )
        image_rows = [
            f"  ({sql_lit(image['url'])}, {sql_lit(image['alt'])}, {image['position']})"
            for image in listing["images"]
        ]
        lines.append(",\n".join(image_rows))
        lines.extend(
            [
                ") as i(url, alt, position)",
                f"where p.sku = {sql_lit(family)};",
                "",
            ]
        )

    return "\n".join(lines).rstrip() + "\n"


def verify(catalog: dict) -> None:
    assert catalog["listing_count"] == 9
    assert catalog["variants_per_listing"] == 250
    assert catalog["total_variants"] == 2250
    families = {listing["family_sku"] for listing in catalog["listings"]}
    assert len(families) == 9
    skus = {
        variant["sku"]
        for listing in catalog["listings"]
        for variant in listing["variants"]
    }
    assert len(skus) == 2250
    for listing in catalog["listings"]:
        assert len(listing["title"]) <= 140
        assert len(listing["tags"]) == 13
        assert all(len(tag) <= 20 for tag in listing["tags"])
        assert len(listing["images"]) == 10
        assert len(listing["prompts"]) == 6
        assert len(listing["variants"]) == 250
        assert listing["widths_mm"] == WIDTHS
        assert listing["ring_sizes_us"][0] == "4"
        assert listing["ring_sizes_us"][-1] == "16"


def main() -> None:
    catalog = build_catalog()
    verify(catalog)
    write_catalog(catalog)
    MIGRATION_FILE.write_text(emit_migration(catalog))
    print(
        json.dumps(
            {
                "catalog": str(OUT / "catalog.json"),
                "migration": str(MIGRATION_FILE),
                "listings": catalog["listing_count"],
                "variants": catalog["total_variants"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
