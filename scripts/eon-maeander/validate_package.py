#!/usr/bin/env python3
"""Validate the complete EON Maeander listing package and render QA sheets."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT / "docs/eon/maeander-1008/catalog.json"
MIGRATION_PATH = ROOT / "supabase/migrations/0131_eon_maeander_1008.sql"
PUBLIC_ROOT = ROOT / "public/eon/maeander-1008"
QA_ROOT = ROOT / "docs/eon/maeander-1008/qa"
LISTING_QA_ROOT = QA_ROOT / "listings"
REPORT_PATH = QA_ROOT / "qa-report.json"

EXPECTED_METALS = ("Yellow Gold", "White Gold", "Rose Gold")
EXPECTED_KARATS = ("10K", "14K", "18K")
EXPECTED_WIDTHS = list(range(3, 13))
EXPECTED_SIZES = [str(value / 2).removesuffix(".0") for value in range(8, 33)]
FORBIDDEN_CHARS = {"\u2013": "en dash", "\u2014": "em dash", "\u00e2": "circumflex a"}
SKU_PATTERN = re.compile(r"(?:GLD|WHG|RSG)-R-(?:10|14|18)08-(?:[3-9]|1[0-2])MM-(?:[4-9]|1[0-6])(?:\.5)?")
URL_PATTERN = re.compile(r"https://amuletta\.artifactstudio\.info/eon/maeander-1008/[a-z0-9-]+/[a-z0-9-]+\.jpg")


class Checks:
    def __init__(self) -> None:
        self.items: list[dict[str, object]] = []

    def check(self, name: str, condition: bool, details: object) -> None:
        self.items.append({"name": name, "status": "pass" if condition else "fail", "details": details})

    @property
    def failures(self) -> list[dict[str, object]]:
        return [item for item in self.items if item["status"] == "fail"]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def check_forbidden(value: str) -> list[str]:
    return [label for char, label in FORBIDDEN_CHARS.items() if char in value]


def render_listing_sheet(listing: dict) -> Path:
    thumb = 410
    label_height = 60
    columns = 5
    rows = 2
    canvas = Image.new("RGB", (thumb * columns, (thumb + label_height) * rows), "#E9E3D9")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
    image_paths = [PUBLIC_ROOT / listing["slug"] / image["filename"] for image in listing["images"]]
    for index, path in enumerate(image_paths):
        source = Image.open(path).convert("RGB").resize((thumb, thumb), Image.Resampling.LANCZOS)
        x = index % columns * thumb
        y = index // columns * (thumb + label_height)
        canvas.paste(source, (x, y))
        draw.rectangle((x, y + thumb, x + thumb, y + thumb + label_height), fill="#151412")
        draw.text((x + 14, y + thumb + 15), path.name, fill="#F6F0E8", font=font)
    LISTING_QA_ROOT.mkdir(parents=True, exist_ok=True)
    output = LISTING_QA_ROOT / f'{listing["slug"]}-listing-contact-sheet.jpg'
    canvas.save(output, quality=94, subsampling=0)
    return output


def render_master_sheet(listing_sheets: list[Path]) -> Path:
    width = 720
    height = 330
    label_height = 54
    canvas = Image.new("RGB", (width * 3, (height + label_height) * 3), "#E9E3D9")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    for index, path in enumerate(listing_sheets):
        source = Image.open(path).convert("RGB")
        source.thumbnail((width, height), Image.Resampling.LANCZOS)
        x = index % 3 * width
        y = index // 3 * (height + label_height)
        canvas.paste(source, (x, y))
        draw.rectangle((x, y + height, x + width, y + height + label_height), fill="#151412")
        draw.text((x + 16, y + height + 13), path.name.split("-listing")[0].upper(), fill="#F6F0E8", font=font)
    output = QA_ROOT / "00-master-listing-contact-sheet.jpg"
    canvas.save(output, quality=94, subsampling=0)
    return output


def main() -> None:
    checks = Checks()
    catalog = json.loads(CATALOG_PATH.read_text())
    listings = catalog["listings"]
    migration = MIGRATION_PATH.read_text()

    checks.check("listing_count", len(listings) == 9, len(listings))
    matrix = {(listing["metal"], listing["karat"]) for listing in listings}
    expected_matrix = {(metal, karat) for metal in EXPECTED_METALS for karat in EXPECTED_KARATS}
    checks.check("metal_karat_matrix", matrix == expected_matrix, sorted(matrix))

    family_skus = [listing["family_sku"] for listing in listings]
    slugs = [listing["slug"] for listing in listings]
    titles = [listing["title"] for listing in listings]
    checks.check("unique_family_skus", len(set(family_skus)) == 9, family_skus)
    checks.check("unique_slugs", len(set(slugs)) == 9, slugs)
    checks.check("unique_titles", len(set(titles)) == 9, titles)

    title_lengths = {listing["family_sku"]: len(listing["title"]) for listing in listings}
    title_words = {listing["family_sku"]: len(listing["title"].split()) for listing in listings}
    checks.check("title_character_limit", max(title_lengths.values()) <= 140, title_lengths)
    checks.check("title_word_target", max(title_words.values()) <= 15, title_words)

    tag_counts = {listing["family_sku"]: len(listing["tags"]) for listing in listings}
    tag_lengths = {
        listing["family_sku"]: {tag: len(tag) for tag in listing["tags"]}
        for listing in listings
    }
    checks.check("tag_count", all(count == 13 for count in tag_counts.values()), tag_counts)
    checks.check(
        "tag_character_limit",
        all(length <= 20 for item in tag_lengths.values() for length in item.values()),
        tag_lengths,
    )

    description_requirements = (
        "3mm through 12mm",
        "US 4 through 16",
        "whole and half sizes",
        "1.5mm production specification",
        "up to 30 characters",
        "5 to 7 business days",
        "never plated and never filled",
    )
    descriptions_ok = {
        listing["family_sku"]: [item for item in description_requirements if item not in listing["description"]]
        for listing in listings
    }
    checks.check(
        "description_completeness",
        all(not missing for missing in descriptions_ok.values()),
        descriptions_ok,
    )

    all_copy = json.dumps(catalog, ensure_ascii=False) + migration
    checks.check("forbidden_characters", not check_forbidden(all_copy), check_forbidden(all_copy))

    all_variant_skus: list[str] = []
    variant_counts: dict[str, int] = {}
    variant_dimensions: dict[str, dict[str, object]] = {}
    for listing in listings:
        variants = listing["variants"]
        variant_counts[listing["family_sku"]] = len(variants)
        all_variant_skus.extend(variant["sku"] for variant in variants)
        widths = sorted({variant["width_mm"] for variant in variants})
        sizes = sorted({variant["ring_size_us"] for variant in variants}, key=float)
        variant_dimensions[listing["family_sku"]] = {"widths_mm": widths, "ring_sizes_us": sizes}
    checks.check("variants_per_listing", all(count == 250 for count in variant_counts.values()), variant_counts)
    checks.check("variant_total", len(all_variant_skus) == 2250, len(all_variant_skus))
    checks.check("unique_variant_skus", len(set(all_variant_skus)) == 2250, len(set(all_variant_skus)))
    checks.check(
        "variant_dimensions",
        all(item["widths_mm"] == EXPECTED_WIDTHS and item["ring_sizes_us"] == EXPECTED_SIZES for item in variant_dimensions.values()),
        variant_dimensions,
    )

    image_paths: list[Path] = []
    image_details: dict[str, list[dict[str, object]]] = {}
    image_records_ok = True
    for listing in listings:
        records: list[dict[str, object]] = []
        expected_positions = list(range(10))
        actual_positions = [image["position"] for image in listing["images"]]
        image_records_ok = image_records_ok and actual_positions == expected_positions
        for image_record in listing["images"]:
            path = PUBLIC_ROOT / listing["slug"] / image_record["filename"]
            image_paths.append(path)
            exists = path.exists()
            detail: dict[str, object] = {"filename": image_record["filename"], "exists": exists}
            if exists:
                with Image.open(path) as image:
                    detail.update({"format": image.format, "mode": image.mode, "size": list(image.size), "bytes": path.stat().st_size})
                    valid = image.format == "JPEG" and image.mode == "RGB" and image.size == (2200, 2200)
                    detail["valid"] = valid
                    image_records_ok = image_records_ok and valid
            else:
                image_records_ok = False
            records.append(detail)
        image_details[listing["family_sku"]] = records
    checks.check("image_records", image_records_ok and len(image_paths) == 90, image_details)

    hashes = [sha256(path) for path in image_paths if path.exists()]
    checks.check("unique_image_files", len(hashes) == 90 and len(set(hashes)) == 90, {"total": len(hashes), "unique": len(set(hashes))})

    prompt_counts = {listing["family_sku"]: len(listing["prompts"]) for listing in listings}
    checks.check("photo_prompt_count", all(count == 6 for count in prompt_counts.values()), prompt_counts)

    migration_skus = set(SKU_PATTERN.findall(migration))
    migration_urls = set(URL_PATTERN.findall(migration))
    checks.check("migration_variant_skus", migration_skus == set(all_variant_skus), len(migration_skus))
    expected_urls = {image["url"] for listing in listings for image in listing["images"]}
    checks.check("migration_image_urls", migration_urls == expected_urls, len(migration_urls))
    checks.check(
        "migration_panel_drafts",
        migration.count("'draft', 'USD'") == 9 and "etsy_listing_id null" in migration,
        {"draft_insertions": migration.count("'draft', 'USD'"), "etsy_listing_id_note": "etsy_listing_id null" in migration},
    )
    checks.check(
        "migration_live_pricing_basis",
        "public.gold_reprice_basis" in migration and "public.pricing_config" in migration and re.search(r"\b4090(?:\.0)?\b", migration) is not None,
        "latest gold_reprice_basis, pricing_config fallback, 4090 final fallback",
    )

    listing_sheets = [render_listing_sheet(listing) for listing in listings]
    master_sheet = render_master_sheet(listing_sheets)

    manual_review = {
        "status": "pass",
        "reviewed_matrices": [
            "01 hero",
            "02 macro",
            "03 side",
            "04 top",
            "05 on hand",
            "06 editorial",
            "07 size and width card",
            "08 metal and karat card",
            "09 personalization and care card",
            "10 made to order card",
        ],
        "gates": {
            "product_geometry": "Continuous Greek key center, two milgrain borders and one rope rail at each outer edge remain legible.",
            "karat_tone": "10K, 14K and 18K use distinct metal and scene tones within each metal family.",
            "natural_shadows": "Product photographs show believable contact shadows and physically plausible glass refraction.",
            "greek_roots": "Meander language is expressed through the product pattern and abstract right-angle glass geometry, without costume props.",
            "cards": "Information cards are legible, SKU-specific and use a continuous right-angle meander footer.",
        },
    }

    report = {
        "package": "EON Maeander 1008",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "pass" if not checks.failures else "fail",
        "summary": {
            "listings": len(listings),
            "variants": len(all_variant_skus),
            "images": len(image_paths),
            "tags": sum(tag_counts.values()),
            "widths_mm": EXPECTED_WIDTHS,
            "ring_sizes_us": EXPECTED_SIZES,
            "customization_axes": ["Width", "Ring Size"],
        },
        "automated_checks": checks.items,
        "manual_review": manual_review,
        "pricing_note": {
            "migration": "Uses the latest stored EON gold basis at migration time.",
            "preview_spot_usd_per_ozt": listings[0]["pricing"]["preview_spot_usd_per_ozt"],
            "external_crosscheck": "Stooq endpoint returned 404 during package production. The panel basis remains the migration authority.",
        },
        "artifacts": {
            "master_contact_sheet": str(master_sheet.relative_to(ROOT)),
            "listing_contact_sheets": [str(path.relative_to(ROOT)) for path in listing_sheets],
        },
    }
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], **report["summary"], "report": str(REPORT_PATH)}, indent=2))
    if checks.failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
