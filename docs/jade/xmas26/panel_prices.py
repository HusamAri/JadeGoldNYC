"""Jade Gold NYC, Christmas 2026: catalog.json -> panel_prices.sql (the 40 drafts' estimated prices).

Run: python3 -I docs/jade/xmas26/panel_prices.py     (reads catalog.json, writes panel_prices.sql)

The panel import (listing_metadata.import_batch jade-xmas26-600-2026-10-18) created one `products`
row per piece (sku JGN-X26-<ID>, status draft, no Etsy listing) with three `product_variants`
(Gold Karat 10K / 14K / 18K, all Yellow Gold) and left price and weight null. This script writes:

  product_variants.price_cents / weight_grams / weight_source   per karat, from price.karats
  products.price_cents                                           the lowest variant (10K): the
                                                                 Etsy "from" price, same convention
                                                                 as mirrored listings
  products.listing_metadata.retailPricePlan                      the full three-karat breakdown,
                                                                 discount, spot and sources, so the
                                                                 number can be re-derived later
  products.listing_metadata.approval.priceReadyForEtsy = true    livePublicationAuthorized stays false

Guards: every UPDATE is scoped to the Jade org, the exact sku, status draft, etsy_listing_id null
and archived_at null; the variant UPDATE only touches the three karat values. The statement is
idempotent in VALUE (a second run rewrites the same numbers), and the pre-check in the SQL comment
is the "has this already run?" gate: variant prices must be null before the first apply.
"""
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).parent
ORG = "f155b853-dfaf-48fd-94c5-ddfcb856e07c"  # Jade Gold NYC
# v1 (2026-10-18 19:07 UTC): discount 30 %, margin 25 %. v2 (same day, owner: "kâr marjı %50"):
# margin 50 %, same discount; re-priced in place, so the pre-check below gates on the v1 plan.
PLAN_VERSION = "xmas26-v2-disc30-m50"
PREVIOUS_PLAN_VERSION = "xmas26-v1-disc30"
KARATS = ("10K", "14K", "18K")

cat = json.load(open(HERE / "catalog.json"))
pr = cat["pricing"]
assert pr["discount"] == 0.30 and pr["target_margin"] == 0.50, pr
rows = []
for p in cat["products"]:
    k = p["price"]["karats"]
    assert set(k) == set(KARATS), p["id"]
    assert p["price"]["list_cents"] == k["14K"]["list_cents"], p["id"]
    rows.append((p["id"], k))
assert len(rows) == 40

# seal over (sku, karat, price, grams) in sku order: compare with the DB before and after
seal_src = ",".join(f"JGN-X26-{pid}-{kk}:{k[kk]['list_cents']}:{k[kk]['grams']:.2f}" for pid, k in sorted(rows) for kk in KARATS)
seal = hashlib.md5(seal_src.encode()).hexdigest()
total = sum(k[kk]["list_cents"] for _, k in rows for kk in KARATS)


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


# the plan's shared part is written ONCE in SQL; per-row numbers are the only transcribed values
common = {
    "version": PLAN_VERSION, "status": "ESTIMATE", "currency": "USD",
    "priceIs": "lowest variant (10K); 14K is the design price",
    "discountPercent": round(pr["discount"] * 100), "targetMargin": pr["target_margin"],
    "engine": cat["engine"], "source": "docs/jade/xmas26/catalog.json",
    "karatRule": pr["karat_rule"], "spotUsdPerOzt": pr["spot_usd_per_ozt"], "spotSource": pr["spot_source"],
    "costPerGram14kCents": pr["cost_per_gram_14k_cents"], "rateCentsPerGram": pr["rate_cents_per_gram"],
    "densityRatio": pr["density_ratio"],
    "authorizedOn": "2026-10-18",
    "authorizedBy": "owner 2026-10-18: 'tahmini fiyatları gir, mağazada %30 indirim var, bu halde bile kârlı olmalı' + 'fiyatların kar marjını %50 olarak belirle'",
}
values = []
for pid, k in rows:
    nums = ", ".join(f"{k[kk]['list_cents']}, {k[kk]['grams']}, {k[kk]['cost_cents']}, {k[kk]['paid_cents']}, {k[kk]['margin']}"
                     for kk in KARATS)
    values.append(f"({q(pid)}, {nums})")

joined = ",\n".join(values)
cols = ", ".join(f"p{kk[:2]}, g{kk[:2]}, c{kk[:2]}, d{kk[:2]}, m{kk[:2]}" for kk in KARATS)
karat_json = ", ".join(
    f"'{kk}', jsonb_build_object('grams', t.g{kk[:2]}, 'costCents', t.c{kk[:2]}, 'listCents', t.p{kk[:2]}, "
    f"'paidCents', t.d{kk[:2]}, 'margin', t.m{kk[:2]})" for kk in KARATS)
sql = f"""-- Jade Gold NYC · Noel 2026 · 40 taslağın tahmini fiyatları (panel), üretici: panel_prices.py
-- plan {PLAN_VERSION} · indirim %{round(pr['discount'] * 100)} · hedef marj %{round(pr['target_margin'] * 100)}
-- spot {pr['spot_usd_per_ozt']} ({pr['spot_source']}) · $/g {pr['rate_cents_per_gram']}
-- beklenen mühür (sku-karat:liste:gram, sku sırası): {seal} · liste toplamı {total} cent / 120 varyant
--
-- ÖN KOŞUL (uygulamadan önce koş; 40 / 120 / 40 / 0 beklenir, aksi hâlde DUR — "zaten koşmuş mu?" kapısı):
--   select count(distinct p.id), count(v.id),
--          count(distinct p.id) filter (where p.listing_metadata->'retailPricePlan'->>'version' = '{PREVIOUS_PLAN_VERSION}'),
--          count(distinct p.id) filter (where p.listing_metadata->'retailPricePlan'->>'version' = '{PLAN_VERSION}')
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = '{ORG}' and p.sku like 'JGN-X26-%' and p.status = 'draft'
--     and p.etsy_listing_id is null and p.archived_at is null
--     and v.properties->>'Gold Karat' in ('10K','14K','18K');
--
-- GERİ OKUMA (uygulamadan sonra; mühür yukarıdakiyle birebir tutmalı):
--   select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku)),
--          sum(v.price_cents), count(*)
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = '{ORG}' and p.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K');
with common as (select {q(json.dumps(common, ensure_ascii=False))}::jsonb as plan),
t(code, {cols}) as (values
{joined}
), v_upd as (
  update product_variants v
     set price_cents = case v.properties->>'Gold Karat' when '10K' then t.p10 when '14K' then t.p14 else t.p18 end,
         weight_grams = case v.properties->>'Gold Karat' when '10K' then t.g10 when '14K' then t.g14 else t.g18 end,
         weight_source = 'xmas26 estimate: 14K gold grams from catalog.json × alloy density (10K ×0.892, 18K ×1.137); not weighed'
    from products p, t
   where p.id = v.product_id and p.org_id = '{ORG}' and p.sku = 'JGN-X26-' || t.code
     and p.status = 'draft' and p.etsy_listing_id is null and p.archived_at is null
     and v.properties->>'Gold Karat' in ('10K', '14K', '18K')
  returning v.id
), p_upd as (
  update products p
     set price_cents = t.p10,
         listing_metadata = coalesce(p.listing_metadata, '{{}}'::jsonb)
           || jsonb_build_object('retailPricePlan', common.plan
                || jsonb_build_object('priceCents', t.p10, 'karats', jsonb_build_object({karat_json})))
           || jsonb_build_object('approval', coalesce(p.listing_metadata->'approval', '{{}}'::jsonb)
                || jsonb_build_object('priceReadyForEtsy', true, 'livePublicationAuthorized', false,
                                      'pricePlanVersion', '{PLAN_VERSION}'))
    from t, common
   where p.org_id = '{ORG}' and p.sku = 'JGN-X26-' || t.code
     and p.status = 'draft' and p.etsy_listing_id is null and p.archived_at is null
  returning p.id
)
select (select count(*) from v_upd) as variants_updated, (select count(*) from p_upd) as products_updated;
"""
open(HERE / "panel_prices.sql", "w").write(sql)
print(f"panel_prices.sql: 40 products / 120 variants · seal {seal} · list total {total} cent")
for pid, k in rows:
    print(f"{pid:>4}  10K ${k['10K']['list_cents'] // 100:>4} ({k['10K']['grams']:.2f} g) · "
          f"14K ${k['14K']['list_cents'] // 100:>4} ({k['14K']['grams']:.2f} g) · "
          f"18K ${k['18K']['list_cents'] // 100:>4} ({k['18K']['grams']:.2f} g)")
