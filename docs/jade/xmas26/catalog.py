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

Maker quotes (2026-10-28, work/maker_quotes.json): Görkem answered on WhatsApp per piece with BODY grams and
separate USD lines (chain, clean/assemble, enamel, push posts, lock). A quoted piece is priced from HIS lines:
body grams × the all-in 14K rate (he did not quote a $/g, so the documented 106 USD/g stays) + chain (gold,
scaled to the karat like the body) + the fixed lines (karat independent) + shipping + packaging, through the
same Jade formula. Its `price.basis` is "maker_quote". An unquoted piece keeps the v2 estimate untouched
(`price.basis` "estimate"; its spot stays frozen at the v2 value on purpose: an estimate is not re-derived
on a spot move, only replaced by a quote). Quoted pieces use the spot of the day the quote was applied.
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
# 2026-10-18, owner: "fiyatların kar marjını %50 olarak belirle". Net margin on what the shop
# receives (list × 0.70) after Etsy fees — the engine's own definition (jadeMarginAt). This is
# the COLLECTION's target; the engine default JADE_TARGET_MARGIN (0.25, catalog-wide) is
# unchanged and jadeTargetPriceCents takes the margin as a parameter.
MARGIN = 0.50

# lib/gold-cost.ts: derivePurchaseCentsPerGram + KARAT_PURITY. Spot is an INPUT, dated.
SPOT_USD_PER_OZT = 4166.10  # gold-api.com, 2026-10-18 18:58 UTC — v2 ESTIMATES, frozen (see header)
SPOT_SOURCE = "gold-api.com 2026-10-18T18:58Z"
SPOT_QUOTE_USD_PER_OZT = 4054.10  # gold-api.com, 2026-10-28 09:54 UTC — pieces priced from the maker's quote
SPOT_QUOTE_SOURCE = "gold-api.com 2026-10-28T09:54Z"
# Quote batches carry their own plan version: a quote without a "plan" key belongs to the first batch (v3,
# applied 2026-10-28 morning); later batches name theirs (v4: N6-N10, same day). QUOTE_PLAN is the LATEST.
QUOTE_PLAN_FIRST = "xmas26-v3-quote-disc30-m50"
QUOTE_PLAN = "xmas26-v4-quote-disc30-m50"
ESTIMATE_PLAN = "xmas26-v2-disc30-m50"
TROY_OZ_GRAMS = 31.1035
PURITY = {"10K": 0.416, "14K": 0.585, "18K": 0.75}
# same casting volume, alloy density: docs/second-brain.md 2026-09-16 (maker tables, ×0.892 / ×1.137);
# Jade's own live catalog measures 0.880 / 1.121 on 750 cells, so these are the slightly heavier reading
DENSITY_RATIO = {"10K": 0.892, "14K": 1.0, "18K": 1.137}
KARATS = ("10K", "14K", "18K")


def rate_cents(karat, spot=SPOT_USD_PER_OZT):
    """$/g by karat: 14K is the invoice rate; 10K/18K = that karat's melt + the 14K labour premium."""
    if karat == "14K":
        return COST_PER_GRAM
    pure = spot * 100 / TROY_OZ_GRAMS
    premium = max(0.0, COST_PER_GRAM - pure * PURITY["14K"])
    return round(pure * PURITY[karat] + premium)


def karat_grams(g14, karat):
    return round(g14 * DENSITY_RATIO[karat], 2)


def karat_ratio(karat, spot):
    """Cost of the same gold part made in `karat` relative to 14K (density × rate): used for the quoted chain."""
    return DENSITY_RATIO[karat] * rate_cents(karat, spot) / COST_PER_GRAM


def cost_cents(g, karat="14K"):
    return round(g * rate_cents(karat)) + SHIPPING + PACKAGING


def list_from_cost(cost, margin=MARGIN):
    denom = (1 - DISCOUNT) * ((1 - ETSY_RATE) - margin)
    return math.ceil((cost + ETSY_FIXED) / denom / 100) * 100


def list_cents(g, margin=MARGIN, karat="14K"):
    return list_from_cost(cost_cents(g, karat), margin)


def margin_from_cost(price, cost):
    gross = price * (1 - DISCOUNT)
    return (gross - (gross * ETSY_RATE + ETSY_FIXED) - cost) / gross


def margin_at(price, g, karat="14K"):
    return margin_from_cost(price, cost_cents(g, karat))


QUOTE_FIXED_LINES = ("assembly_usd", "enamel_usd", "stone_usd", "post_usd", "lock_usd", "other_usd")


def quote_parts_cents(q, karat, spot=SPOT_QUOTE_USD_PER_OZT):
    """The maker's quote in cents for one karat: body gold, chain (gold), fixed lines, shipping + packaging."""
    g = karat_grams(q["gram14_body"], karat)
    gold = round(g * rate_cents(karat, spot))
    chain = round(q.get("chain_usd", 0) * 100 * karat_ratio(karat, spot))
    fixed = sum(q.get(k, 0) for k in QUOTE_FIXED_LINES) * 100
    return {"grams": g, "gold_cents": gold, "chain_cents": chain, "fixed_cents": fixed,
            "cost_cents": gold + chain + fixed + SHIPPING + PACKAGING}


def karat_rows_quote(q):
    rows = {}
    for k in KARATS:
        parts = quote_parts_cents(q, k)
        price = list_from_cost(parts["cost_cents"])
        m = margin_from_cost(price, parts["cost_cents"])
        assert m >= MARGIN - 1e-9, (k, q, m)
        rows[k] = {**parts, "rate_cents_per_gram": rate_cents(k, SPOT_QUOTE_USD_PER_OZT),
                   "list_cents": price, "paid_cents": paid_cents(price), "margin": round(m, 4)}
    assert rows["10K"]["list_cents"] < rows["14K"]["list_cents"] < rows["18K"]["list_cents"], rows
    return rows


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
quotes_doc = json.load(open(HERE / "work" / "maker_quotes.json"))
QUOTES = quotes_doc["quotes"]
assert set(QUOTES) | set(quotes_doc["not_quoted"]) == {f"{c}{i}" for c in "BNEP" for i in range(1, 11)}
assert not set(QUOTES) & set(quotes_doc["not_quoted"])
for qid, q in QUOTES.items():
    assert q["gram14_body"] > 0 and all(q.get(k, 0) >= 0 for k in QUOTE_FIXED_LINES + ("chain_usd",)), qid
    assert (qid[0] == "E") == (q.get("chain_usd", 0) == 0), (qid, "earrings have no chain line, everything else does")
    assert (qid[0] == "E") == (q.get("post_usd", 0) > 0 or q.get("lock_usd", 0) > 0), (qid, "earrings carry posts or a lock")
    if "same_as" in q:  # "ayni": the lines must equal the referenced message's lines (plus any explicit "plus")
        ref = QUOTES[q["same_as"]]
        for k in ("gram14_body", "chain_usd", "assembly_usd", "post_usd", "lock_usd", "other_usd"):
            assert q.get(k, 0) == ref.get(k, 0), (qid, k)
        assert q.get("enamel_usd", 0) >= ref.get("enamel_usd", 0), (qid, "enamel")

out = []
for p in spec["products"]:
    pid, cat = p["id"], p["category"]
    assert p["karat"] == "14K", (pid, "only 14K has a verified supplier rate", p["karat"])
    g = p["gold_grams"]
    lo, hi = BANDS[cat]
    assert lo <= g <= hi, (pid, g, (lo, hi))
    assert p["total_grams"] >= g, pid
    estimate = karat_rows(g)
    if pid in QUOTES:
        karats = karat_rows_quote(QUOTES[pid])
        basis, plan = "maker_quote", QUOTES[pid].get("plan", QUOTE_PLAN_FIRST)
        assert plan in (QUOTE_PLAN_FIRST, QUOTE_PLAN), (pid, plan)
        assert karats["14K"]["list_cents"] == list_from_cost(quote_parts_cents(QUOTES[pid], "14K")["cost_cents"])
    else:
        karats = estimate
        basis, plan = "estimate", ESTIMATE_PLAN
        assert karats["14K"]["list_cents"] == list_cents(g)
    price, paid, m = karats["14K"]["list_cents"], karats["14K"]["paid_cents"], karats["14K"]["margin"]
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

    price_block = {"list_cents": price, "paid_cents": paid, "cost_cents": karats["14K"]["cost_cents"],
                   "margin": round(m, 4), "discount": DISCOUNT, "basis": basis, "plan_version": plan, "karats": karats}
    if pid in QUOTES:
        q = QUOTES[pid]
        price_block["quote"] = {k: q[k] for k in q if k not in ("shot", "time")}
        price_block["quote"]["lines_usd"] = {k.removesuffix("_usd"): q[k] for k in ("chain_usd",) + QUOTE_FIXED_LINES if q.get(k)}
        price_block["estimate_v2"] = {k: estimate[k]["list_cents"] for k in KARATS}  # what the panel carried before
    out.append({**p, "price": price_block})

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
                       "karat_rule": "lib/gold-cost.ts derivePurchaseCentsPerGram; 14K is the design",
                       "quote": {"plan_version": QUOTE_PLAN, "source": "docs/jade/xmas26/work/maker_quotes.json",
                                 "plans": {pv: sorted((q for q in QUOTES if QUOTES[q].get("plan", QUOTE_PLAN_FIRST) == pv), key=lambda s: (s[0], int(s[1:])))
                                           for pv in (QUOTE_PLAN_FIRST, QUOTE_PLAN)},
                                 "quoted": sorted(QUOTES, key=lambda s: (s[0], int(s[1:]))), "not_quoted": quotes_doc["not_quoted"],
                                 "spot_usd_per_ozt": SPOT_QUOTE_USD_PER_OZT, "spot_source": SPOT_QUOTE_SOURCE,
                                 "rate_cents_per_gram": {k: rate_cents(k, SPOT_QUOTE_USD_PER_OZT) for k in KARATS},
                                 "chain_karat_ratio": {k: round(karat_ratio(k, SPOT_QUOTE_USD_PER_OZT), 4) for k in KARATS},
                                 "rule": "cost = body grams × density × $/g + chain × karat ratio + assembly/enamel/stone/posts/lock + shipping + packaging; the all-in 14K $/g was not quoted and stays 106"},
                       "estimate_plan_version": ESTIMATE_PLAN},
           "products": out}, open(HERE / "catalog.json", "w"), ensure_ascii=False, indent=1)
for p in out:
    k = p["price"]["karats"]
    tag = "QUOTE" if p["price"]["basis"] == "maker_quote" else "est  "
    was = p["price"].get("estimate_v2", {}).get("14K")
    delta = f" (v2 ${was // 100}, {k['14K']['list_cents'] / was - 1:+.0%})" if was else ""
    print(f"{p['id']:>4} {tag} cost ${k['14K']['cost_cents'] / 100:>7.2f}  14K ${k['14K']['list_cents'] // 100:>4} list "
          f"${k['14K']['paid_cents'] / 100:>7.2f} paid · 10K ${k['10K']['list_cents'] // 100:>4} · "
          f"18K ${k['18K']['list_cents'] // 100:>4}{delta}  {p['title'][:48]}")
nq = sum(1 for p in out if p["price"]["basis"] == "maker_quote")
print(f"{len(out)}/{len(out)} gates passed · {nq} quoted / {len(out) - nq} estimate · discount {DISCOUNT:.0%} · margin {MARGIN:.0%}")
print("estimate $/g " + " ".join(f"{k} {rate_cents(k) / 100:.2f}" for k in KARATS) + f" @ spot {SPOT_USD_PER_OZT} (frozen)")
print("quote    $/g " + " ".join(f"{k} {rate_cents(k, SPOT_QUOTE_USD_PER_OZT) / 100:.2f}" for k in KARATS)
      + f" @ spot {SPOT_QUOTE_USD_PER_OZT} · chain karat ratio "
      + " ".join(f"{k} {karat_ratio(k, SPOT_QUOTE_USD_PER_OZT):.4f}" for k in KARATS))
