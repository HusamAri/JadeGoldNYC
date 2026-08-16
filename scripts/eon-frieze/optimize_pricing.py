#!/usr/bin/env python3
"""Select the EON handfinished price ladder from market and margin evidence."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT = ROOT / "docs" / "eon" / "pricing" / "frieze-textured-2026-08-16"
DEFAULT_MARKET = DEFAULT_OUT / "market-comparables.json"
GENERATOR_PATH = ROOT / "scripts" / "eon-frieze" / "generate_pricing.py"

CURRENT_NARROW = 1.75
CURRENT_WIDE = 2.0
TARGET_MARKET_RATIO = 0.92
MIN_STANDARD_MARGIN_PCT = 40.0
MIN_OFFSITE_MARGIN_PCT = 25.0
MAX_NARROW_INCREASE_RATIO = 1.18
MAX_WIDE_INCREASE_RATIO = 1.12


def load_generator():
    spec = importlib.util.spec_from_file_location("eon_frieze_pricing", GENERATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load the Frieze price generator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def candidate_values(start: float, stop: float, step: float) -> list[float]:
    count = int(round((stop - start) / step))
    return [round(start + index * step, 2) for index in range(count + 1)]


def market_score(prices: dict[int, float], comparables: list[dict]) -> float:
    weighted_error = 0.0
    weight_total = 0.0
    for comparable in comparables:
        if not comparable.get("include_in_model"):
            continue
        if comparable.get("karat") != "14K":
            continue
        width = int(comparable.get("model_width_mm", round(comparable["width_mm"])))
        market_price = float(comparable["sale_price_usd"])
        weight = float(comparable.get("model_weight", 1.0))
        ratio = prices[width] / market_price
        weighted_error += weight * (
            math.log(ratio) - math.log(TARGET_MARKET_RATIO)
        ) ** 2
        weight_total += weight
    if weight_total == 0:
        raise ValueError("No market comparables are eligible for optimization")
    return weighted_error / weight_total


def evaluate_candidate(generator, weights: dict, narrow: float, wide: float) -> dict:
    generator.MULTIPLIER_NARROW = narrow
    generator.MULTIPLIER_WIDE = wide
    rows = [
        generator.price_row(weights, karat, width, size)
        for karat in generator.KARATS
        for width in generator.WIDTHS
        for size in generator.SIZES
    ]
    us7_prices = {
        width: generator.price_row(weights, "14K", width, 7)["sale_price_usd"]
        for width in generator.WIDTHS
    }
    return {
        "narrow_multiplier": narrow,
        "wide_multiplier": wide,
        "minimum_standard_margin_pct": min(row["standard_margin_pct"] for row in rows),
        "minimum_offsite_margin_pct": min(row["offsite_margin_pct"] for row in rows),
        "us7_14k_sale_prices": us7_prices,
    }


def optimize(market_path: Path) -> tuple[list[dict], dict]:
    market = json.loads(market_path.read_text())
    comparables = market["comparables"]
    generator = load_generator()
    weights = generator.load_weights()
    ranking = []

    for narrow in candidate_values(1.75, 2.25, 0.05):
        for wide in candidate_values(2.0, 2.4, 0.05):
            row = evaluate_candidate(generator, weights, narrow, wide)
            row["market_score"] = market_score(
                row["us7_14k_sale_prices"], comparables
            )
            reasons = []
            if row["minimum_standard_margin_pct"] < MIN_STANDARD_MARGIN_PCT:
                reasons.append("standard_margin")
            if row["minimum_offsite_margin_pct"] < MIN_OFFSITE_MARGIN_PCT:
                reasons.append("offsite_margin")
            if narrow / CURRENT_NARROW > MAX_NARROW_INCREASE_RATIO:
                reasons.append("narrow_price_step")
            if wide / CURRENT_WIDE > MAX_WIDE_INCREASE_RATIO:
                reasons.append("wide_price_step")
            row["eligible"] = not reasons
            row["rejection_reasons"] = reasons
            ranking.append(row)

    eligible = sorted(
        (row for row in ranking if row["eligible"]),
        key=lambda row: (
            row["market_score"],
            row["narrow_multiplier"],
            row["wide_multiplier"],
        ),
    )
    if not eligible:
        raise RuntimeError("No candidate satisfies the pricing constraints")

    selected = eligible[0]
    current = evaluate_candidate(
        generator, weights, CURRENT_NARROW, CURRENT_WIDE
    )
    selected["market_position"] = []
    for comparable in comparables:
        if not comparable.get("include_in_model") or comparable.get("karat") != "14K":
            continue
        width = int(comparable.get("model_width_mm", round(comparable["width_mm"])))
        eon_price = selected["us7_14k_sale_prices"][width]
        market_price = float(comparable["sale_price_usd"])
        selected["market_position"].append(
            {
                "comparable_id": comparable["id"],
                "width_mm": width,
                "eon_sale_price_usd": eon_price,
                "market_sale_price_usd": market_price,
                "eon_to_market_ratio": round(eon_price / market_price, 4),
            }
        )
    selected["price_change_vs_current_pct"] = {
        str(width): round(
            (
                selected["us7_14k_sale_prices"][width]
                / current["us7_14k_sale_prices"][width]
                - 1
            )
            * 100,
            2,
        )
        for width in generator.WIDTHS
    }
    decision = {
        "as_of": market["as_of"],
        "selected": selected,
        "current": current,
        "constraints": {
            "target_market_ratio": TARGET_MARKET_RATIO,
            "minimum_standard_margin_pct": MIN_STANDARD_MARGIN_PCT,
            "minimum_offsite_margin_pct": MIN_OFFSITE_MARGIN_PCT,
            "maximum_narrow_increase_pct": round(
                (MAX_NARROW_INCREASE_RATIO - 1) * 100, 2
            ),
            "maximum_wide_increase_pct": round(
                (MAX_WIDE_INCREASE_RATIO - 1) * 100, 2
            ),
        },
        "eligible_candidate_count": len(eligible),
        "total_candidate_count": len(ranking),
        "top_eligible_candidates": eligible[:10],
    }
    return ranking, decision


def write_outputs(out_dir: Path, ranking: list[dict], decision: dict) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "optimization.json").write_text(
        json.dumps(decision, indent=2) + "\n"
    )
    fieldnames = [
        "narrow_multiplier",
        "wide_multiplier",
        "eligible",
        "market_score",
        "minimum_standard_margin_pct",
        "minimum_offsite_margin_pct",
        "rejection_reasons",
    ]
    with (out_dir / "candidate-ranking.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in sorted(
            ranking,
            key=lambda item: (
                not item["eligible"],
                item["market_score"],
                item["narrow_multiplier"],
                item["wide_multiplier"],
            ),
        ):
            writer.writerow(
                {
                    **{key: row[key] for key in fieldnames if key != "rejection_reasons"},
                    "rejection_reasons": "|".join(row["rejection_reasons"]),
                }
            )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--market", type=Path, default=DEFAULT_MARKET)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    ranking, decision = optimize(args.market)
    write_outputs(args.out, ranking, decision)
    selected = decision["selected"]
    print(
        json.dumps(
            {
                "narrow_multiplier": selected["narrow_multiplier"],
                "wide_multiplier": selected["wide_multiplier"],
                "minimum_standard_margin_pct": selected[
                    "minimum_standard_margin_pct"
                ],
                "minimum_offsite_margin_pct": selected[
                    "minimum_offsite_margin_pct"
                ],
                "market_score": selected["market_score"],
            }
        )
    )


if __name__ == "__main__":
    main()
