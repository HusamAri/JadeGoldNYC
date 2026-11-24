"""Leander rings: price from the Blender gram sheet plus labour, enamel and assembly (2026-11-24).

Input: the "Leander Ring Gold Weights" sheet, Variants tab (10,195 rows, two weights per variant), saved as JSON.
usage: python3 plan.py <variants.json> <current prices.csv>  -> plan.csv, summary.json

Cost per piece = fine gold x spot + labour 130 + assembly 50 + enamel 50 (enamel rings only).
Grams: the sheet's "at listing sizes" weight. That model follows the dimensions the listing promises, which is what the
maker builds, and it is the one the sheet's two real checks match (EON 6 mm band invoice 4.72 g at US 8.5; pinky signet
stated 11 to 12 g in 14K at US 10.25). The "as pictured" model takes each product render as a US 7 ring, an assumption
no measurement backs; taking the heavier of the two tripled some prices (checkerboard signet 14.5 g against 6.6 g).
One exception, PICTURED_ONLY: the paperclip ring's listing-size model uses 0.44 mm wire, a first-pass estimate and not
listing text, too thin to cast; the photo shows 1.0 mm links (0.72 g against 2.35 g at US 7).
List price: at the shop's 25% sale, after 9.5% Etsy fees, 22.45 shipping, packaging and fixed fee, 10% of what
the buyer pays is left. list = ceil((cost + 22.45) / (0.75 x (0.905 - 0.10))).
"""
import csv, json, math, sys
from decimal import Decimal, ROUND_CEILING
from pathlib import Path

SPOT = Decimal("3563.30")          # USD per troy ounce, api.gold-api.com, 2026-11-24 17:38 UTC
OZT = Decimal("31.1035")
LABOUR, ASSEMBLY, ENAMEL = Decimal(130), Decimal(50), Decimal(50)
FIXED, FEE, SALE, MARGIN = Decimal("22.45"), Decimal("0.905"), Decimal("0.75"), Decimal("0.10")
ENAMEL_LISTINGS = {  # titles say enamel; bell 4590349790 and snowflake 4590338425 say "no enamel"
    "4585880602", "4585869551", "4583755083", "4583765514", "4583754889", "4592349382", "4592333585", "4592333265",
    "4592096604", "4590339167", "4590339015", "4590349652", "4590349492", "4590349140", "4590348976", "4590337951",
    "4585881020", "4585880790", "4585880432", "4585880226", "4585880046", "4583765684", "4585875423", "4583765750",
    "4592334997", "4592334779", "4592334585", "4592348314", "4592348106", "4592333961", "4590345620", "4585856383"}
PICTURED_ONLY = {"4592333265"}
HERE = Path(__file__).resolve().parent
rows = json.load(open(sys.argv[1]))
cur = {r["sku"]: r for r in csv.DictReader(open(sys.argv[2]))}


def sku_for(r):
    if r["sku"]:
        return r["sku"]
    if r["lid"] == "4578936078":  # sheet has no SKU for Two Peaks; panel pattern BAS-F26-OPENARC-14K-RG-10
        size = r["size"]
        s = str(int(size)) if size == int(size) else str(size)
        return f"BAS-F26-OPENARC-14K-{r['color'][0]}G-{s}"
    return None


out, skipped = [], []
for r in rows:
    sku = sku_for(r)
    if not sku or sku not in cur:
        skipped.append((r["lid"], r["ring"], sku))
        continue
    heavier_listed = r["gl"] is not None and r["lid"] not in PICTURED_ONLY
    grams = Decimal(str(r["gl"] if heavier_listed else r["gp"]))
    fine = Decimal(str(r["fl"] if heavier_listed else r["fp"]))
    gold = fine * SPOT / OZT
    enamel = ENAMEL if r["lid"] in ENAMEL_LISTINGS else Decimal(0)
    cost = gold + LABOUR + ASSEMBLY + enamel
    price = ((cost + FIXED) / (SALE * (FEE - MARGIN))).to_integral_value(ROUND_CEILING)
    paid = price * SALE
    left = paid * FEE - FIXED - cost
    out.append(dict(listing=r["lid"], ring=r["ring"], sku=sku, karat=r["karat"], color=r["color"], size=r["size"],
                    option=r["option"] or "", basis="at listing sizes" if heavier_listed else "as pictured",
                    grams=float(grams), fine_gold_g=float(fine), gold_usd=round(float(gold), 2), labour=130,
                    assembly=50, enamel=int(enamel), cost_usd=round(float(cost), 2), price_now=float(cur[sku]["new_usd"]),
                    new_price=int(price), buyer_pays_at_25=float(paid), left_after_costs=round(float(left), 2)))
assert all(o["left_after_costs"] >= 0 for o in out)
with open(HERE / "plan.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]))
    w.writeheader(); w.writerows(out)
lids = sorted({o["listing"] for o in out})
summary = dict(variants=len(out), listings=len(lids), skipped=sorted(set(skipped)),
               up=sum(o["new_price"] > o["price_now"] for o in out), down=sum(o["new_price"] < o["price_now"] for o in out),
               total_now=sum(o["price_now"] for o in out), total_new=sum(o["new_price"] for o in out),
               ids=",".join(lids))
json.dump(summary, open(HERE / "summary.json", "w"), indent=1)
print({k: v for k, v in summary.items() if k != "ids"})
