#!/usr/bin/env python3
"""Create diagnostic review sheets; never edit generated originals or approve images."""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


REPO = Path(__file__).resolve().parents[1]
BASE = REPO / "docs/jade/xmas26"
PRODUCTS = [f"{category}{n}" for category in "BNEP" for n in range(1, 11)]
SHOT_CODES = [f"{n:02}" for n in range(2, 17)]
PANEL_W, PANEL_H, LABEL_H, GAP = 768, 576, 58, 16


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def font(size):
    candidate = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(str(candidate), size) if candidate.exists() else ImageFont.load_default()


def put_panel(sheet, x, y, path, label, sublabel):
    draw = ImageDraw.Draw(sheet)
    draw.rectangle((x, y, x + PANEL_W, y + PANEL_H + LABEL_H), fill="#e9e7e1")
    if path:
        # Resize only an in-memory diagnostic copy. Never write back to a source path.
        with Image.open(path) as source:
            preview = ImageOps.contain(source.convert("RGB"), (PANEL_W, PANEL_H), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x + (PANEL_W - preview.width) // 2, y + (PANEL_H - preview.height) // 2))
    else:
        draw.text((x + 24, y + PANEL_H // 2), "MISSING — NOT GENERATED", font=font(28), fill="#a02222")
    draw.text((x + 10, y + PANEL_H + 6), label, font=font(20), fill="#161616")
    draw.text((x + 10, y + PANEL_H + 32), sublabel, font=font(15), fill="#454545")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True, help="JSON array or {images: [...]} of product_code, shot_code/source_shot_code, local_path")
    parser.add_argument("--output-dir", type=Path, required=True, help="Separate diagnostic output directory")
    parser.add_argument("--category", choices=list("BNEP"), help="Only produce one category's diagnostic sheets")
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    entries = manifest if isinstance(manifest, list) else manifest["images"]
    output_dir = args.output_dir.resolve()
    source_paths = {Path(entry["local_path"]).resolve() for entry in entries}
    if any(output_dir == path or output_dir in path.parents for path in source_paths):
        raise ValueError("Diagnostic output must be separate from the originals' directory tree")
    output_dir.mkdir(parents=True, exist_ok=True)
    slots, diagnostic_index, hashes = {}, [], {}
    for entry in entries:
        product = entry["product_code"]
        shot = str(entry.get("source_shot_code", entry.get("shot_code", ""))).zfill(2)
        if product not in PRODUCTS or shot not in SHOT_CODES:
            raise ValueError(f"Unknown product/source shot: {product}/{shot}; do not pass gallery position")
        if (product, shot) in slots:
            raise ValueError(f"Duplicate manifest slot: {product}/{shot}")
        path = Path(entry["local_path"]).resolve(strict=True)
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            width, height = image.size
        digest = sha256(path)
        prior = hashes.get(digest)
        hashes.setdefault(digest, f"{product}-{shot}")
        row = {
            "product_code": product, "source_shot_code": shot, "local_path": str(path),
            "sha256": digest, "width": width, "height": height,
            "technical_size_pass": max(width, height) >= 2048 and abs(width / height - 4 / 3) <= 0.02,
            "duplicate_of": prior, "visual_status": "unreviewed", "reviewer": None,
            "reviewed_at": None, "reason": None,
        }
        diagnostic_index.append(row)
        slots[(product, shot)] = row
    prompts = json.loads((BASE / "prompts.json").read_text())
    sheets = []
    for product in PRODUCTS:
        if args.category and not product.startswith(args.category):
            continue
        reference = BASE / "images/heroes/crops" / f"{product}.jpg"
        for group in range(5):
            codes = SHOT_CODES[group * 3:(group + 1) * 3]
            sheet = Image.new("RGB", (PANEL_W * 2 + GAP * 3, (PANEL_H + LABEL_H) * 2 + GAP * 3), "#ffffff")
            put_panel(sheet, GAP, GAP, reference, f"{product} — SOURCE REFERENCE", "DIAGNOSTIC ONLY • Generated images require visual review")
            for cell, shot in enumerate(codes, start=1):
                row = slots.get((product, shot))
                path = Path(row["local_path"]) if row else None
                purpose = next(item["purpose"] for item in prompts[product] if item["code"] == shot)
                x = GAP + (cell % 2) * (PANEL_W + GAP)
                y = GAP + (cell // 2) * (PANEL_H + LABEL_H + GAP)
                status = f"{row['width']}×{row['height']} • UNREVIEWED" if row else "MISSING"
                put_panel(sheet, x, y, path, f"{product}-{shot} — {status}", purpose[:87])
            destination = output_dir / f"{product}-{codes[0]}-{codes[-1]}-diagnostic.jpg"
            sheet.save(destination, quality=94, subsampling=0)
            sheets.append({"product_code": product, "source_shot_codes": codes, "path": str(destination)})
    result = {"scope": "Diagnostic review material only; originals unchanged; no visual approvals implied", "images": diagnostic_index, "sheets": sheets}
    (output_dir / "diagnostic-index.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"images_indexed": len(diagnostic_index), "diagnostic_sheets": len(sheets), "technical_size_failures": sum(not row["technical_size_pass"] for row in diagnostic_index), "duplicate_hashes": sum(row["duplicate_of"] is not None for row in diagnostic_index), "visual_pass_count": 0, "index": str(output_dir / "diagnostic-index.json")}))


if __name__ == "__main__":
    main()
