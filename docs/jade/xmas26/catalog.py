"""Jade Gold NYC, Christmas 2026: 40 pieces -> catalog.json (prices + Etsy gates).

Run: python3 -I docs/jade/xmas26/catalog.py   (reads spec.json, writes catalog.json)

Prices come from the Jade engine (lib/jade/pricing.ts), mirrored here line for line and
cross-checked against the TypeScript itself (README, "Fiyat"). Only GOLD grams are priced:
enamel and stones are never multiplied by a gold rate. The listing discloses gold grams; total
grams on the scale (gold + enamel + stones) are carried separately so the two never get mixed.

The engine's per-gram cost is the supplier's all-in 14K invoice rate (pricing.ts header): there is
no separate labour line, and there is no verified 18K rate. A non-14K piece therefore fails here
instead of being priced at the 14K rate.
"""
import json
import math
import pathlib
import re

HERE = pathlib.Path(__file__).parent

# lib/jade/pricing.ts
COST_PER_GRAM = 106_00
SHIPPING = 5_00
PACKAGING = 1_50
DISCOUNT = 0.25
ETSY_RATE = 0.095
ETSY_FIXED = 25
MARGIN = 0.25


def cost_cents(g):
    return round(g * COST_PER_GRAM) + SHIPPING + PACKAGING


def list_cents(g, margin=MARGIN):
    denom = (1 - DISCOUNT) * ((1 - ETSY_RATE) - margin)
    return math.ceil((cost_cents(g) + ETSY_FIXED) / denom / 100) * 100


def margin_at(price, g):
    gross = price * (1 - DISCOUNT)
    return (gross - (gross * ETSY_RATE + ETSY_FIXED) - cost_cents(g)) / gross


# working gram bands, gold grams incl. chain and findings (spec rule L7)
BANDS = {"bracelet": (3.2, 3.9), "necklace": (2.8, 4.2), "earrings": (1.40, 1.75), "brooch": (3.0, 4.2)}
TYPE_WORD = {"bracelet": "bracelet", "necklace": ("necklace", "pendant"), "earrings": ("earrings", "studs", "stud earrings"),
             "brooch": ("brooch", "lapel pin", "pin")}
BANNED = ["vintage", "stocking stuffer", "aquamarine", "blue diamond", "real diamond"]

spec = json.load(open(HERE / "spec.json"))
out = []
for p in spec["products"]:
    pid, cat = p["id"], p["category"]
    assert p["karat"] == "14K", (pid, "only 14K has a verified supplier rate", p["karat"])
    g = p["gold_grams"]
    lo, hi = BANDS[cat]
    assert lo <= g <= hi, (pid, g, (lo, hi))
    assert p["total_grams"] >= g, pid
    price = list_cents(g)
    paid = price * 3 // 4  # list is whole dollars, so this is exact
    assert price * 3 % 4 == 0
    m = margin_at(price, g)
    assert m >= MARGIN - 1e-9, (pid, m)

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
                               "margin": round(m, 4)}})

ids = [p["id"] for p in out]
assert len(ids) == 40 and len(set(ids)) == 40
for cat, n in (("bracelet", 10), ("necklace", 10), ("earrings", 10), ("brooch", 10)):
    assert sum(1 for p in out if p["category"] == cat) == n, cat
titles = [p["title"] for p in out]
assert len(set(titles)) == 40, "duplicate titles"

json.dump({"collection": "Jade Gold NYC Christmas 2026", "engine": "lib/jade/pricing.ts",
           "products": out}, open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
for p in out:
    print(f"{p['id']:>4} {p['gold_grams']:.2f} g  ${p['price']['list_cents'] // 100:>4} list  "
          f"${p['price']['paid_cents'] / 100:>7.2f} paid  {p['title'][:70]}")
print("40/40 gates passed")
