"""Low-profit list prices for the Leander gold listings whose cost comes from the maker's own words.

Owner 2026-11-12: "we need to sell with low profit ... set highly competitive prices for silver products and
the listings that we are secure about costs". Secure = the maker's band list or a per-piece maker quote
(docs/artifact-studio/maker_cost.py, WhatsApp 2026-10-07):
  - Christmas rings R01..R10: "price it as a 3 mm band from the list"; R02 = 4 mm band + 100 USD enamel.
  - Christmas N02: 1 g + 50 enamel (chain at the quoted 130 USD / 18 in). B09: 3 g + 50 enamel + 100 chain + 50 assembly.
  - For Him rings R01..R10: the maker's band list at each ring's width and wall.
Everything else in the shop is priced on estimated grams and is NOT touched here.

  list = ceil5((grams x RATE[karat] + extra + FIXED + 0.45) / ((1 - 0.095) x (1 - 0.25)))

  - RATE per alloy gram: 14K 100.00 (maker list, labor included); 10K 77.43 (same labor, gold by purity);
    18K 123.13 (the maker's own 18K table is 1.400 x 14K for the same piece; 140 / 1.137 density).
    The list was quoted at spot 4178 USD/ozt; spot on 2026-11-12 is 3874, so the rate is on the safe side.
  - FIXED 22.00: insured, signed shipping and box for a gold piece (the EON figure).
  - Etsy 9.5% + 0.45. The list price breaks even at a 25% sale (Cyber Specials); at the 15% shop sale it
    leaves 10.65% of the buyer price for ads and profit. Offsite Ads (15%, max 100 USD) is not in the floor.
Before: panel = catalog (2 x maker cost); live Etsy = catalog x LIVE_MULT (owner's +15% on 9 Oct and +10% on 12 Oct),
read per offering through ops/price-sync detail on 2026-11-12 (243/243 or 27/27 uniform per listing).
Run: python3 gen.py   -> summary.csv, seal.json, supabase/migrations/0188_artifact_gold_low_profit.sql
"""
import csv
import hashlib
import json
import math
import pathlib
from decimal import Decimal, ROUND_HALF_UP

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
RATE = {"10K": Decimal("77.43"), "14K": Decimal("100.00"), "18K": Decimal("123.13")}
EXTRA = {"BAS-XM-R02": 100, "BAS-XM-N02": 50, "BAS-XM-B09": 100}
FIXED = Decimal("22.00")
ETSY_FEE, ETSY_FIXED = Decimal("0.095"), Decimal("0.45")
DEEPEST_SALE, SALE_NOW = Decimal("0.25"), Decimal("0.15")
DENOM = (1 - ETSY_FEE) * (1 - DEEPEST_SALE)
SECURE = {"xmas26": [f"R{i:02d}" for i in range(1, 11)] + ["N02", "B09"],
          "him26": [f"R{i:02d}" for i in range(1, 11)]}
LIVE_MULT = {"BAS-HM-R05": Decimal("1.0"), "BAS-HM-R09": Decimal("1.2")}   # every other listing: 1.265
OUT = ROOT / "supabase/migrations/0188_artifact_gold_low_profit.sql"


def list_usd(g, k, extra):
    return int(math.ceil((g * RATE[k] + extra + FIXED + ETSY_FIXED) / DENOM / 5) * 5)


def seal(lines):
    return hashlib.md5("\n".join(sorted(lines)).encode()).hexdigest()


rows = []
for fam, ids in SECURE.items():
    items = {x["id"]: x for x in json.load(open(HERE.parent / fam / "catalog.json"))["items"]}
    for i in ids:
        it = items[i]
        extra = EXTRA.get(it["sku"], 0)
        for v in it["variants"]:
            k = v["properties"]["Karat"]
            assert v["sku"].split("-")[3][:3] == k, v["sku"]          # the karat in the SKU is the property
            g = Decimal(str(v["grams"]))
            cost = g * RATE[k] + extra
            # the catalog price is ceil10(2 x maker cost): the cost model must reproduce it (18K rate is the
            # maker's own table, up to 0.8% above the model, hence the 2% band)
            assert abs(2 * cost * 100 - v["price_cents"]) <= max(1000, v["price_cents"] * Decimal("0.02")), v["sku"]
            lst = list_usd(g, k, extra)
            b15 = (lst * (1 - SALE_NOW)).quantize(Decimal("0.01"), ROUND_HALF_UP)
            b25 = (lst * (1 - DEEPEST_SALE)).quantize(Decimal("0.01"), ROUND_HALF_UP)
            n15 = b15 * (1 - ETSY_FEE) - ETSY_FIXED - cost - FIXED
            n25 = b25 * (1 - ETSY_FEE) - ETSY_FIXED - cost - FIXED
            assert n25 >= 0 and n15 / b15 >= Decimal("0.10"), v["sku"]
            live_list = (v["price_cents"] * LIVE_MULT.get(it["sku"], Decimal("1.265")) / 100).quantize(Decimal("0.01"), ROUND_HALF_UP)
            rows.append(dict(fam=fam, id=i, psku=it["sku"], name=it["name"], sku=v["sku"], k=k, g=g, cost=cost, lst=lst,
                             b15=b15, b25=b25, n15=n15, cat=v["price_cents"], live_list=live_list,
                             live_buyer=(live_list * (1 - SALE_NOW)).quantize(Decimal("0.01"), ROUND_HALF_UP)))
assert len(rows) == 4914 and len({r["sku"] for r in rows}) == 4914, len(rows)
assert all(r["lst"] * 100 < r["cat"] for r in rows)                  # every list price falls below the catalog price

pre = seal(f"{r['sku']}|{r['cat']}|{r['g']:.2f}" for r in rows)
post = seal(f"{r['sku']}|{r['lst'] * 100}|{r['g']:.2f}" for r in rows)

with open(HERE / "summary.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow("collection,listing,name,karat,variants,grams_min,grams_max,maker_cost_min,maker_cost_max,list_min,list_max,"
               "buyer_15_min,buyer_15_max,buyer_25_min,live_buyer_before_min,live_buyer_before_max,change_pct_min,change_pct_max".split(","))
    keys = []
    for r in rows:
        if (r["psku"], r["k"]) not in keys:
            keys.append((r["psku"], r["k"]))
    for psku, k in keys:
        rs = [r for r in rows if r["psku"] == psku and r["k"] == k]
        chg = [float(r["b15"] / r["live_buyer"] - 1) * 100 for r in rs]
        w.writerow([rs[0]["fam"], psku, rs[0]["name"], k, len(rs), min(r["g"] for r in rs), max(r["g"] for r in rs),
                    f"{min(r['cost'] for r in rs):.0f}", f"{max(r['cost'] for r in rs):.0f}",
                    min(r["lst"] for r in rs), max(r["lst"] for r in rs), min(r["b15"] for r in rs), max(r["b15"] for r in rs),
                    min(r["b25"] for r in rs), min(r["live_buyer"] for r in rs), max(r["live_buyer"] for r in rs),
                    f"{min(chg):+.0f}", f"{max(chg):+.0f}"])

scope = (f"v.org_id = '{ORG}' and (v.sku ~ '^BAS-XM-R(0[1-9]|10)-' or v.sku like 'BAS-XM-N02-%' "
         "or v.sku like 'BAS-XM-B09-%' or v.sku ~ '^BAS-HM-R(0[1-9]|10)-')")
line = "v.sku || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00')"
rule = ("low profit (owner 2026-11-12): list = ceil5((grams x maker rate + extras + 22.00 + 0.45) / (0.905 x 0.75)); "
        "maker rate per alloy gram 10K 77.43, 14K 100.00, 18K 123.13; breaks even at a 25% sale; "
        "docs/artifact-studio/low-profit-2026-11-12/gen.py")
sql = f"""-- 0188_artifact_gold_low_profit.sql
-- by Artifact Studio Jewelry (Leander): low-profit list prices for the 22 gold listings whose cost is the maker's
-- own band list or a per-piece quote (Christmas rings R01-R10, N02, B09; For Him rings R01-R10). 4,914 variants.
-- Owner 2026-11-12: "sell with low profit ... set highly competitive prices for ... the listings that we are secure about costs".
-- list = ceil5((grams x rate + extras + 22.00 + 0.45) / (0.905 x 0.75)); see docs/artifact-studio/low-profit-2026-11-12/gen.py.
-- Before: panel = catalog (2 x maker cost); live Etsy was the catalog x 1.265 (two listings x 1.0 and x 1.2).
-- Precondition: set seal = {pre} (catalog as applied); postcondition: {post}.
-- Runs once: a second run finds the post seal and stops.
do $$
declare s text; n int;
begin
  select md5(string_agg(line, E'\\n' order by line collate "C")), count(*) into s, n from (
    select {line} line from public.product_variants v where {scope}) x;
  if s = '{post}' then raise notice 'already repriced'; return; end if;
  if n <> 4914 or s is distinct from '{pre}' then raise exception 'precondition: % variants, seal %', n, s; end if;

  update public.product_variants v
  set price_cents = (ceil((v.weight_grams * r.rate
        + (case when v.sku like 'BAS-XM-R02-%' then 100 when v.sku like 'BAS-XM-N02-%' then 50 when v.sku like 'BAS-XM-B09-%' then 100 else 0 end)
        + 22.45) / 0.67875 / 5) * 5 * 100)::int,
      updated_at = now()
  from (values ('10K', 77.43), ('14K', 100.00), ('18K', 123.13)) r(k, rate)
  where {scope} and v.properties->>'Karat' = r.k;
  get diagnostics n = row_count;
  if n <> 4914 then raise exception 'updated % variants, expected 4914', n; end if;

  update public.products p
  set price_cents = (select min(price_cents) from public.product_variants v where v.product_id = p.id),
      listing_metadata = jsonb_set(coalesce(listing_metadata, '{{}}'::jsonb), '{{lowProfit20261112}}', to_jsonb('{rule}'::text)),
      updated_at = now()
  where p.org_id = '{ORG}' and p.id in (select v.product_id from public.product_variants v where {scope});
  get diagnostics n = row_count;
  if n <> 22 then raise exception 'updated % products, expected 22', n; end if;

  select md5(string_agg(line, E'\\n' order by line collate "C")) into s from (
    select {line} line from public.product_variants v where {scope}) x;
  if s <> '{post}' then raise exception 'postcondition seal %', s; end if;
end $$;
"""
OUT.write_text(sql, encoding="utf-8")
json.dump({"variants": len(rows), "listings": 22, "preSeal": pre, "postSeal": post,
           "sealLine": "sku|price_cents|grams(0.00), sorted bytewise, joined by newline, md5"}, open(HERE / "seal.json", "w"), indent=1)
chg = [float(r["b15"] / r["live_buyer"] - 1) * 100 for r in rows]
print(f"variants {len(rows)}  pre {pre}  post {post}")
print(f"list {min(r['lst'] for r in rows)}..{max(r['lst'] for r in rows)}  buyer15 {min(r['b15'] for r in rows)}..{max(r['b15'] for r in rows)}"
      f"  change vs live {min(chg):+.0f}%..{max(chg):+.0f}%  min cushion at 15% {min(float(r['n15'] / r['b15']) for r in rows):.4f}")
print(f"wrote {OUT.relative_to(ROOT)} ({len(sql)} bytes), summary.csv, seal.json")
