"""Jade Gold NYC, Christmas 2026: 40 pieces -> catalog.json (prices + Etsy gates).

Run: python3 -I docs/jade/xmas26/catalog.py   (reads spec.json, writes catalog.json)

Prices come from the Jade engine (lib/jade/pricing.ts), mirrored here line for line and
cross-checked against the TypeScript itself (README, "Fiyat"). Only GOLD grams are priced:
enamel and stones are never multiplied by a gold rate. The listing discloses gold grams; total
grams on the scale (gold + enamel + stones) are carried separately so the two never get mixed.

The engine's per-gram cost is the supplier's all-in 14K invoice rate (pricing.ts header): there is
no separate labour line, and there is no verified 18K rate. A non-14K piece therefore fails here
instead of being priced at the 14K rate.

Karat variants (2026-10-18): the owner's panel import gave every piece three variants, Gold Karat
10K / 14K / 18K. The design is still 14K (`price` stays the 14K row); `price.karats` adds the
10K and 18K ESTIMATES with the panel's own rule, lib/gold-cost.ts `derivePurchaseCentsPerGram`:
the metal part of the $/g rate scales with purity at today's spot, the supplier's labour premium
(14K rate − 14K melt) does not; grams scale with alloy density. Both inputs are dated below and
must be refreshed before re-pricing. `panel_prices.py` turns `price.karats` into the panel SQL.
"""
import json
import math
import os
import pathlib
import re

HERE = pathlib.Path(__file__).parent

# lib/jade/pricing.ts
COST_PER_GRAM = 106_00      # supplier's all-in 14K rate, cents per gram
SHIPPING = 5_00
PACKAGING = 1_50
DISCOUNT = 0.30             # 2026-10-18: %25 → %30, owner's instruction (pricing.ts, fiyatlandirma.md §13)
ETSY_RATE = 0.095
ETSY_FIXED = 25
MARGIN = 0.25

# lib/gold-cost.ts: derivePurchaseCentsPerGram + KARAT_PURITY. Spot is an INPUT, dated.
SPOT_USD_PER_OZT = 4166.10  # gold-api.com, 2026-10-18 18:58 UTC
SPOT_SOURCE = "gold-api.com 2026-10-18T18:58Z"
TROY_OZ_GRAMS = 31.1035
PURITY = {"10K": 0.416, "14K": 0.585, "18K": 0.75}
# same casting volume, alloy density: docs/second-brain.md 2026-09-16 (maker tables, ×0.892 / ×1.137);
# Jade's own live catalog measures 0.880 / 1.121 on 750 cells, so these are the slightly heavier reading
DENSITY_RATIO = {"10K": 0.892, "14K": 1.0, "18K": 1.137}
KARATS = ("10K", "14K", "18K")


def rate_cents(karat):
    """$/g by karat: 14K is the invoice rate; 10K/18K = that karat's melt + the 14K labour premium."""
    if karat == "14K":
        return COST_PER_GRAM
    pure = SPOT_USD_PER_OZT * 100 / TROY_OZ_GRAMS
    premium = max(0.0, COST_PER_GRAM - pure * PURITY["14K"])
    return round(pure * PURITY[karat] + premium)


def karat_grams(g14, karat):
    return round(g14 * DENSITY_RATIO[karat], 2)


def cost_cents(g, karat="14K"):
    return round(g * rate_cents(karat)) + SHIPPING + PACKAGING


def list_cents(g, margin=MARGIN, karat="14K"):
    denom = (1 - DISCOUNT) * ((1 - ETSY_RATE) - margin)
    return math.ceil((cost_cents(g, karat) + ETSY_FIXED) / denom / 100) * 100


def margin_at(price, g, karat="14K"):
    gross = price * (1 - DISCOUNT)
    return (gross - (gross * ETSY_RATE + ETSY_FIXED) - cost_cents(g, karat)) / gross


def paid_cents(price):
    paid = price * (100 - round(DISCOUNT * 100)) // 100  # list is whole dollars, so this is exact
    assert price * (100 - round(DISCOUNT * 100)) % 100 == 0
    return paid


def karat_rows(g14):
    """The three variant rows the panel carries; 14K is the design, 10K/18K are density + rate estimates."""
    rows = {}
    for k in KARATS:
        g = karat_grams(g14, k)
        price = list_cents(g, karat=k)
        m = margin_at(price, g, k)
        assert m >= MARGIN - 1e-9, (k, g, m)
        rows[k] = {"grams": g, "rate_cents_per_gram": rate_cents(k), "cost_cents": cost_cents(g, k),
                   "list_cents": price, "paid_cents": paid_cents(price), "margin": round(m, 4)}
    assert rows["10K"]["list_cents"] < rows["14K"]["list_cents"] < rows["18K"]["list_cents"], rows
    return rows


# working gram bands, gold grams incl. chain and findings (spec rule L7)
BANDS = {"bracelet": (3.2, 3.9), "necklace": (2.8, 4.2), "earrings": (1.40, 1.75), "brooch": (3.0, 4.2)}
TYPE_WORD = {"bracelet": "bracelet", "necklace": ("necklace", "pendant"), "earrings": ("earrings", "studs", "stud earrings"),
             "brooch": ("brooch", "lapel pin", "pin")}
# "horsebit": Gucci's trademarked design name; an equestrian bit is sold as "snaffle bit" instead
BANNED = ["vintage", "stocking stuffer", "aquamarine", "blue diamond", "real diamond", "horsebit", "horse bit"]

spec = json.load(open(HERE / "spec.json"))
out = []
for p in spec["products"]:
    pid, cat = p["id"], p["category"]
    assert p["karat"] == "14K", (pid, "only 14K has a verified supplier rate", p["karat"])
    g = p["gold_grams"]
    lo, hi = BANDS[cat]
    assert lo <= g <= hi, (pid, g, (lo, hi))
    assert p["total_grams"] >= g, pid
    karats = karat_rows(g)
    price, paid, m = karats["14K"]["list_cents"], karats["14K"]["paid_cents"], karats["14K"]["margin"]
    assert price == list_cents(g) and m >= MARGIN - 1e-9, (pid, m)

    # Etsy gates
    t = p["title"]
    assert len(t) <= 140, (pid, len(t))
    assert len(t.split()) < 15, (pid, "title words", len(t.split()))
    head = t[:55].lower()
    assert "14k" in head and "gold" in head, (pid, "karat + metal in first 55", t[:55])
    words = TYPE_WORD[cat] if isinstance(TYPE_WORD[cat], tuple) else (TYPE_WORD[cat],)
    assert any(w in head for w in words), (pid, "product type in first 55", t[:55])
    for ch in "%:&+":
        assert t.count(ch) <= 1, (pid, "special char", ch)
    tags = p["tags"]
    assert len(tags) == 13 and len(set(tags)) == 13, (pid, "13 unique tags", len(tags))
    for tg in tags:
        assert len(tg) <= 20, (pid, "tag over 20", tg)
    text = " ".join([t, p["description"], " ".join(tags), " ".join(p["materials"])]).lower()
    for b in BANNED:
        assert b not in text, (pid, "banned word", b)
    if p["stones"]:
        assert re.search(r"lab[- ]grown", t, re.I), (pid, "lab grown qualifier in title")
        assert "lab grown" in text or "lab-grown" in text
    desc = p["description"]
    assert f"{g:.2f} g" in desc or f"{g:.2f}g" in desc, (pid, "gold grams stated in description", g)
    assert f"{price // 100}" not in desc, (pid, "price must not be written into the description")
    if p.get("hollow"):
        assert "solid" not in t.lower(), (pid, "hollow piece cannot say solid in title")

    out.append({**p, "price": {"list_cents": price, "paid_cents": paid, "cost_cents": cost_cents(g),
                               "margin": round(m, 4), "discount": DISCOUNT, "karats": karats}})

ids = [p["id"] for p in out]
assert len(set(ids)) == len(ids), "duplicate ids"
assert len({p["title"] for p in out}) == len(out), "duplicate titles"
if not os.environ.get("PARTIAL"):  # a partial run (some categories still being written) skips the totals
    assert len(ids) == 40
    for cat in ("bracelet", "necklace", "earrings", "brooch"):
        assert sum(1 for p in out if p["category"] == cat) == 10, cat

json.dump({"collection": "Jade Gold NYC Christmas 2026", "engine": "lib/jade/pricing.ts",
           "pricing": {"discount": DISCOUNT, "target_margin": MARGIN, "cost_per_gram_14k_cents": COST_PER_GRAM,
                       "spot_usd_per_ozt": SPOT_USD_PER_OZT, "spot_source": SPOT_SOURCE,
                       "rate_cents_per_gram": {k: rate_cents(k) for k in KARATS}, "density_ratio": DENSITY_RATIO,
                       "karat_rule": "lib/gold-cost.ts derivePurchaseCentsPerGram; 14K is the design"},
           "products": out}, open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
for p in out:
    k = p["price"]["karats"]
    print(f"{p['id']:>4} {p['gold_grams']:.2f} g  14K ${k['14K']['list_cents'] // 100:>4} list "
          f"${k['14K']['paid_cents'] / 100:>7.2f} paid · 10K ${k['10K']['list_cents'] // 100:>4} · "
          f"18K ${k['18K']['list_cents'] // 100:>4}  {p['title'][:60]}")
print(f"{len(out)}/{len(out)} gates passed · discount {DISCOUNT:.0%} · $/g " +
      " ".join(f"{k} {rate_cents(k) / 100:.2f}" for k in KARATS) + f" @ spot {SPOT_USD_PER_OZT}")
