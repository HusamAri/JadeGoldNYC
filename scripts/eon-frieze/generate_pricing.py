#!/usr/bin/env python3
"""Generate the EON Frieze & Textured price matrix and summary."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WEIGHTS_FILE = ROOT / "docs" / "eon" / "eon-weight-tables.json"
OUT = ROOT / "docs" / "eon" / "pricing" / "frieze-textured-2026-08-16"

ACTIVE_BASIS_USD_PER_OZT = 4399.90
LIVE_CHECK_USD_PER_OZT = 4377.600098
TROY_OUNCE_GRAMS = 31.1034768
FIRE_FACTOR = 1.07
LABOR_USD = 55.0
PACKAGING_USD = 8.0
SHIPPING_USD = 22.0
MULTIPLIER_NARROW = 1.75
MULTIPLIER_WIDE = 2.0
SALE_RATE = 0.75
ETSY_FIXED_FEE_USD = 0.45
STANDARD_NET_RATE = 0.895
OFFSITE_NET_RATE = 0.745

KARATS = ("10K", "14K", "18K")
PURITY = {"10K": 0.417, "14K": 0.583, "18K": 0.75}
WIDTHS = tuple(range(3, 13))
SIZES = tuple(4 + index * 0.5 for index in range(25))
METALS = (
    ("Yellow Gold", "GLD"),
    ("White Gold", "WHG"),
    ("Rose Gold", "RSG"),
)


def round_half_up(value: float) -> int:
    return math.floor(value + 0.5)


def size_text(value: float) -> str:
    return str(int(value)) if value.is_integer() else f"{value:.1f}"


def load_weights() -> dict:
    return json.loads(WEIGHTS_FILE.read_text())["weights_grams"]


def grams_for(weights: dict, karat: str, width: int, size: float) -> float:
    row = weights[karat][str(width)]["1.5"]
    if size.is_integer():
        return float(row[int(size) - 4])
    lower = int(math.floor(size))
    return round((float(row[lower - 4]) + float(row[lower - 3])) / 2, 3)


def price_row(weights: dict, karat: str, width: int, size: float) -> dict:
    grams = grams_for(weights, karat, width, size)
    material = (
        grams
        * (ACTIVE_BASIS_USD_PER_OZT / TROY_OUNCE_GRAMS)
        * PURITY[karat]
        * FIRE_FACTOR
    )
    landed = material + LABOR_USD + PACKAGING_USD + SHIPPING_USD
    multiplier = MULTIPLIER_NARROW if width <= 7 else MULTIPLIER_WIDE
    engine = round_half_up(landed * multiplier)
    list_price = math.ceil((engine * 4) / 15) * 5
    sale_price = list_price * SALE_RATE
    floor = round_half_up((landed + ETSY_FIXED_FEE_USD) / STANDARD_NET_RATE)
    offsite_floor = round_half_up(
        (landed + ETSY_FIXED_FEE_USD) / OFFSITE_NET_RATE
    )
    standard_contribution = sale_price * STANDARD_NET_RATE - ETSY_FIXED_FEE_USD - landed
    offsite_contribution = sale_price * OFFSITE_NET_RATE - ETSY_FIXED_FEE_USD - landed
    return {
        "karat": karat,
        "width_mm": width,
        "size_us": size_text(size),
        "grams": round(grams, 3),
        "material_usd": round(material, 2),
        "labor_usd": LABOR_USD,
        "packaging_usd": PACKAGING_USD,
        "shipping_usd": SHIPPING_USD,
        "landed_usd": round(landed, 2),
        "multiplier": multiplier,
        "list_price_usd": list_price,
        "sale_price_usd": round(sale_price, 2),
        "floor_usd": floor,
        "offsite_floor_usd": offsite_floor,
        "standard_contribution_usd": round(standard_contribution, 2),
        "standard_margin_pct": round(standard_contribution / sale_price * 100, 2),
        "offsite_contribution_usd": round(offsite_contribution, 2),
        "offsite_margin_pct": round(offsite_contribution / sale_price * 100, 2),
    }


def generate() -> tuple[list[dict], dict]:
    weights = load_weights()
    rows = [
        price_row(weights, karat, width, size)
        for karat in KARATS
        for width in WIDTHS
        for size in SIZES
    ]
    assert len(rows) == 750

    by_key = {
        (row["karat"], row["width_mm"], row["size_us"]): row for row in rows
    }
    listing_ranges = []
    for metal, prefix in METALS:
        for karat in KARATS:
            code = karat.removesuffix("K")
            low = by_key[(karat, 3, "4")]
            high = by_key[(karat, 12, "16")]
            listing_ranges.append(
                {
                    "metal": metal,
                    "karat": karat,
                    "maeander_family": f"{prefix}-R-{code}08",
                    "list_price_min_usd": low["list_price_usd"],
                    "list_price_max_usd": high["list_price_usd"],
                    "sale_price_min_usd": low["sale_price_usd"],
                    "sale_price_max_usd": high["sale_price_usd"],
                }
            )

    width_ranges = []
    for karat in KARATS:
        for width in WIDTHS:
            low = by_key[(karat, width, "4")]
            high = by_key[(karat, width, "16")]
            width_ranges.append(
                {
                    "karat": karat,
                    "width_mm": width,
                    "list_price_min_usd": low["list_price_usd"],
                    "list_price_max_usd": high["list_price_usd"],
                    "sale_price_min_usd": low["sale_price_usd"],
                    "sale_price_max_usd": high["sale_price_usd"],
                }
            )

    summary = {
        "as_of": "2026-08-16",
        "currency": "USD",
        "active_panel_basis_usd_per_ozt": ACTIVE_BASIS_USD_PER_OZT,
        "live_spot_check_usd_per_ozt": LIVE_CHECK_USD_PER_OZT,
        "live_vs_basis_pct": round(
            (LIVE_CHECK_USD_PER_OZT / ACTIVE_BASIS_USD_PER_OZT - 1) * 100, 3
        ),
        "assumptions": {
            "labor_usd": LABOR_USD,
            "fire_factor": FIRE_FACTOR,
            "packaging_usd": PACKAGING_USD,
            "shipping_usd": SHIPPING_USD,
            "narrow_multiplier_3_to_7mm": MULTIPLIER_NARROW,
            "wide_multiplier_8_to_12mm": MULTIPLIER_WIDE,
            "sale_rate": SALE_RATE,
            "standard_net_rate": STANDARD_NET_RATE,
            "offsite_net_rate": OFFSITE_NET_RATE,
            "fixed_fee_usd": ETSY_FIXED_FEE_USD,
        },
        "matrix": {
            "rows": len(rows),
            "karats": list(KARATS),
            "widths_mm": list(WIDTHS),
            "sizes_us": [size_text(size) for size in SIZES],
        },
        "listing_ranges": listing_ranges,
        "width_ranges": width_ranges,
        "minimum_standard_margin_pct": min(
            row["standard_margin_pct"] for row in rows
        ),
        "minimum_offsite_margin_pct": min(
            row["offsite_margin_pct"] for row in rows
        ),
    }
    assert summary["minimum_standard_margin_pct"] >= 31.5
    assert summary["minimum_offsite_margin_pct"] >= 16.5
    return rows, summary


def main() -> None:
    rows, summary = generate()
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "price-matrix.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(
        json.dumps(
            {
                "rows": len(rows),
                "matrix": str(OUT / "price-matrix.csv"),
                "summary": str(OUT / "summary.json"),
                "minimum_standard_margin_pct": summary[
                    "minimum_standard_margin_pct"
                ],
                "minimum_offsite_margin_pct": summary["minimum_offsite_margin_pct"],
            }
        )
    )


if __name__ == "__main__":
    main()
