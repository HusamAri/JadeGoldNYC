"""Jade Gold NYC, Christmas 2026: catalog.json -> panel_prices.sql (the drafts' prices in the panel).

Run: python3 -I docs/jade/xmas26/panel_prices.py     (reads catalog.json, writes panel_prices.sql)

The panel import (listing_metadata.import_batch jade-xmas26-600-2026-10-18) created one `products`
row per piece with three `product_variants` (sku JGN-X26-<ID>-<karat>, Gold Karat 10K / 14K / 18K, all
Yellow Gold). v1/v2 (2026-10-18) wrote the ESTIMATES into price + weight; the 40 drafts were then
pushed to Etsy (all linked, status draft). Since then the daily Etsy mirror (2026-10-26 06:20 UTC)
rewrote `products.sku` to NULL (listing-level SKU is a list on Etsy), so every statement here scopes
by the import batch and the VARIANT sku, never by products.sku.

v3 (2026-10-28, maker quotes): only the pieces with a quote in work/maker_quotes.json are written
(`price.basis == "maker_quote"`); unquoted pieces keep their v2 rows untouched. v4 (same day, the
second batch of quotes, N6-N10): the script writes only the pieces whose `price.plan_version` is the
LATEST quote plan (`pricing.quote.plan_version`); everything already live (earlier quote batches and
the v2 estimates) is reconstructed from the catalog for the before-seal and left untouched. This
script writes:

  product_variants.price_cents                         per karat, from price.karats (quote basis)
                                                       weight_grams / weight_source are NOT touched:
                                                       the maker quoted body grams without the chain,
                                                       so the panel's total-gold estimate stays until
                                                       the pieces are weighed
  products.price_cents                                 the lowest variant (10K): the Etsy "from" price
  products.listing_metadata.retailPricePlan            version, the quote lines, the three-karat
                                                       breakdown (gold / chain / fixed / cost / list /
                                                       paid / margin), spot and sources, the v2 lists
                                                       it replaced
  products.listing_metadata.approval.pricePlanVersion  bumped; priceReadyForEtsy stays true,
                                                       livePublicationAuthorized stays false

Guards: every UPDATE is scoped to the Jade org, the import batch, the exact variant sku, status draft
and archived_at null; the variant UPDATE only touches the three karat values. The statement is
idempotent in VALUE; the pre-check in the SQL comment is the "has this already run?" gate (v2 plan on
all 40, v3 on none, and the live seal equal to the v2 seal).
"""
import hashlib
import json
import pathlib

HERE = pathlib.Path(__file__).parent
ORG = "f155b853-dfaf-48fd-94c5-ddfcb856e07c"  # Jade Gold NYC
BATCH_LIKE = "jade-xmas26%"
KARATS = ("10K", "14K", "18K")
DENSITY_RATIO = {"10K": 0.892, "14K": 1.0, "18K": 1.137}  # catalog.py, for the unchanged v2 weights
# The live seal before THIS run, read back from the panel (fiyatlandirma.md §13/§14). The catalog's
# reconstruction of the live state must equal it, or the run is refused: v2 828475ae91f2b6fe2ee9b7497eac967c
# (2026-10-18, before v3); v3 67f246863b3b4dcaf8d749a8d1107b8e (2026-10-28, before v4).
LIVE_SEAL_BEFORE = "67f246863b3b4dcaf8d749a8d1107b8e"

cat = json.load(open(HERE / "catalog.json"))
pr = cat["pricing"]
assert pr["discount"] == 0.30 and pr["target_margin"] == 0.50, pr
PLAN_VERSION = pr["quote"]["plan_version"]           # the latest quote batch: the only plan written by this run
ESTIMATE_PLAN_VERSION = pr["estimate_plan_version"]  # v2
assert PLAN_VERSION != ESTIMATE_PLAN_VERSION

quoted, before_rows, after_rows, versions = [], [], [], {}
for p in cat["products"]:
    pid, k, basis, plan = p["id"], p["price"]["karats"], p["price"]["basis"], p["price"]["plan_version"]
    assert set(k) == set(KARATS), pid
    assert p["price"]["list_cents"] == k["14K"]["list_cents"], pid
    grams = {kk: round(p["gold_grams"] * DENSITY_RATIO[kk], 2) for kk in KARATS}  # the weights the panel carries (v1/v2)
    live = {kk: (k[kk]["list_cents"], grams[kk]) for kk in KARATS}
    if plan == PLAN_VERSION:  # written by this run: the panel still carries the v2 estimate
        assert basis == "maker_quote", pid
        quoted.append((pid, p))
        before_rows.append((pid, {kk: (p["price"]["estimate_v2"][kk], grams[kk]) for kk in KARATS}))
    else:  # already live (an earlier quote batch, or the v2 estimate): unchanged by this run
        assert basis == "maker_quote" or plan == ESTIMATE_PLAN_VERSION, (pid, basis, plan)
        if basis == "estimate":
            assert all(abs(k[kk]["grams"] - grams[kk]) < 1e-9 for kk in KARATS), pid
        before_rows.append((pid, live))
    after_rows.append((pid, live))
    versions[pid] = plan
assert len(before_rows) == len(after_rows) == 40
assert set(q for q, _ in quoted) == set(pr["quote"]["plans"][PLAN_VERSION]), "the latest batch must equal the catalog's list"
version_counts = {v: sum(1 for x in versions.values() if x == v) for v in sorted(set(versions.values()))}


def seal_of(rows):
    src = ",".join(f"JGN-X26-{pid}-{kk}:{r[kk][0]}:{r[kk][1]:.2f}" for pid, r in sorted(rows) for kk in KARATS)
    return hashlib.md5(src.encode()).hexdigest(), sum(r[kk][0] for _, r in rows for kk in KARATS)


before_seal, before_total = seal_of(before_rows)
assert before_seal == LIVE_SEAL_BEFORE, (before_seal, "the catalog's reconstruction of the live panel must equal the live seal")
seal, total = seal_of(after_rows)
v2_seal, v2_total = before_seal, before_total  # names kept for the SQL header below


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


qp = pr["quote"]
common = {
    "version": PLAN_VERSION, "status": "MAKER_QUOTE", "currency": "USD",
    "priceIs": "lowest variant (10K); 14K is the design price",
    "discountPercent": round(pr["discount"] * 100), "targetMargin": pr["target_margin"],
    "engine": cat["engine"], "source": "docs/jade/xmas26/catalog.json + work/maker_quotes.json",
    "rule": qp["rule"], "karatRule": pr["karat_rule"],
    "spotUsdPerOzt": qp["spot_usd_per_ozt"], "spotSource": qp["spot_source"],
    "costPerGram14kCents": pr["cost_per_gram_14k_cents"], "rateCentsPerGram": qp["rate_cents_per_gram"],
    "chainKaratRatio": qp["chain_karat_ratio"], "densityRatio": pr["density_ratio"],
    "weightsNote": "variant weight_grams unchanged (v2 total-gold estimate); the maker quoted body grams without the chain",
    "authorizedOn": "2026-10-28",
    "authorizedBy": "owner 2026-10-28: 'Ürünlerin maliyet hesapları geldi, bunlara göre satış fiyatlarını hesapla' (discount 30 % + margin 50 % rule of 2026-10-18 carried)",
}
values = []
for pid, p in quoted:
    k, pq = p["price"]["karats"], p["price"]["quote"]
    nums = ", ".join(f"{k[kk]['list_cents']}, {k[kk]['grams']}, {k[kk]['gold_cents']}, {k[kk]['chain_cents']}, "
                     f"{k[kk]['cost_cents']}, {k[kk]['paid_cents']}, {k[kk]['margin']}" for kk in KARATS)
    fixed = k["14K"]["fixed_cents"]
    assert all(k[kk]["fixed_cents"] == fixed for kk in KARATS), pid
    qjson = {"text": pq["text"], "bodyGrams14k": pq["gram14_body"], "linesUsd": pq["lines_usd"]}
    for key in ("same_as", "flag", "note"):
        if pq.get(key):
            qjson[key] = pq[key]
    est = p["price"]["estimate_v2"]
    values.append(f"({q(pid)}, {nums}, {fixed}, {q(json.dumps(qjson, ensure_ascii=False))}::jsonb, "
                  f"{est['10K']}, {est['14K']}, {est['18K']})")

joined = ",\n".join(values)
cols = ", ".join(f"p{kk[:2]}, g{kk[:2]}, a{kk[:2]}, h{kk[:2]}, c{kk[:2]}, d{kk[:2]}, m{kk[:2]}" for kk in KARATS)
karat_json = ", ".join(
    f"'{kk}', jsonb_build_object('bodyGrams', t.g{kk[:2]}, 'goldCents', t.a{kk[:2]}, 'chainCents', t.h{kk[:2]}, "
    f"'fixedCents', t.fx, 'costCents', t.c{kk[:2]}, 'listCents', t.p{kk[:2]}, 'paidCents', t.d{kk[:2]}, 'margin', t.m{kk[:2]})"
    for kk in KARATS)
nq = len(quoted)
sql = f"""-- Jade Gold NYC · Noel 2026 · üretici teklifi gelen {nq} taslağın fiyatı (panel), üretici: panel_prices.py
-- plan {PLAN_VERSION} · indirim %{round(pr['discount'] * 100)} · hedef marj %{round(pr['target_margin'] * 100)}
-- teklif spotu {qp['spot_usd_per_ozt']} ({qp['spot_source']}) · $/g {qp['rate_cents_per_gram']} · zincir karat oranı {qp['chain_karat_ratio']}
-- bu koşu ({PLAN_VERSION}): {' '.join(pid for pid, _ in quoted)} · dokunulmayan: {' '.join(pid for pid in sorted(versions, key=lambda s: (s[0], int(s[1:]))) if versions[pid] != PLAN_VERSION)}
-- beklenen mühür SONRA (120 varyant, sku-karat:liste:gram, sku sırası): {seal} · liste toplamı {total} cent
-- beklenen mühür ÖNCE (canlı, bu koşudan önce): {v2_seal} · toplam {v2_total} cent
--
-- ÖN KOŞUL (uygulamadan önce koş; plan sayıları { {v: (0 if v == PLAN_VERSION else n) for v, n in version_counts.items()} } ile
--   yani bu koşunun planı 0, önceki planlar {dict((v, n) for v, n in version_counts.items() if v != PLAN_VERSION)}, ve mühür {v2_seal}
--   beklenir; aksi hâlde DUR — "zaten koşmuş mu?" kapısı):
--   with p as (select p.id, p.listing_metadata->'retailPricePlan'->>'version' ver from products p
--              where p.org_id = '{ORG}' and p.listing_metadata->>'import_batch' like '{BATCH_LIKE}'
--                and p.status = 'draft' and p.archived_at is null)
--   select count(distinct p.id), count(v.id),
--          jsonb_object_agg(ver, n) from (select ver, count(*) n from p group by ver) x,
--          (select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku))
--             from p join product_variants v on v.product_id = p.id
--            where v.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K')) s;
--
-- GERİ OKUMA (uygulamadan sonra; mühür yukarıdaki SONRA mührüyle birebir tutmalı):
--   select md5(string_agg(v.sku||':'||v.price_cents||':'||to_char(v.weight_grams,'FM999990.00'), ',' order by v.sku)),
--          sum(v.price_cents), count(*)
--   from products p join product_variants v on v.product_id = p.id
--   where p.org_id = '{ORG}' and p.listing_metadata->>'import_batch' like '{BATCH_LIKE}'
--     and v.sku like 'JGN-X26-%' and v.properties->>'Gold Karat' in ('10K','14K','18K');
with common as (select {q(json.dumps(common, ensure_ascii=False))}::jsonb as plan),
t(code, {cols}, fx, quote, e10, e14, e18) as (values
{joined}
), v_upd as (
  update product_variants v
     set price_cents = case v.properties->>'Gold Karat' when '10K' then t.p10 when '14K' then t.p14 else t.p18 end
    from products p, t
   where p.id = v.product_id and p.org_id = '{ORG}'
     and p.listing_metadata->>'import_batch' like '{BATCH_LIKE}'
     and p.status = 'draft' and p.archived_at is null
     and v.properties->>'Gold Karat' in ('10K', '14K', '18K')
     and v.sku = 'JGN-X26-' || t.code || '-' || (v.properties->>'Gold Karat')
  returning v.id
), p_upd as (
  update products p
     set price_cents = t.p10,
         listing_metadata = coalesce(p.listing_metadata, '{{}}'::jsonb)
           || jsonb_build_object('retailPricePlan', common.plan
                || jsonb_build_object('priceCents', t.p10, 'quote', t.quote,
                                      'estimateV2ListCents', jsonb_build_object('10K', t.e10, '14K', t.e14, '18K', t.e18),
                                      'karats', jsonb_build_object({karat_json})))
           || jsonb_build_object('approval', coalesce(p.listing_metadata->'approval', '{{}}'::jsonb)
                || jsonb_build_object('priceReadyForEtsy', true, 'livePublicationAuthorized', false,
                                      'pricePlanVersion', '{PLAN_VERSION}'))
    from t, common
   where p.org_id = '{ORG}' and p.listing_metadata->>'import_batch' like '{BATCH_LIKE}'
     and p.status = 'draft' and p.archived_at is null
     and exists (select 1 from product_variants v where v.product_id = p.id and v.sku = 'JGN-X26-' || t.code || '-14K')
  returning p.id
)
select (select count(*) from v_upd) as variants_updated, (select count(*) from p_upd) as products_updated;
"""
open(HERE / "panel_prices.sql", "w").write(sql)
print(f"panel_prices.sql: plan {PLAN_VERSION} · {nq} products / {3 * nq} variants · seal before {v2_seal} · after {seal} · "
      f"list total {v2_total} -> {total} cent · plan counts after {version_counts}")
for pid, p in quoted:
    k, est = p["price"]["karats"], p["price"]["estimate_v2"]
    print(f"{pid:>4}  10K ${k['10K']['list_cents'] // 100:>4} (v2 {est['10K'] // 100:>4}) · "
          f"14K ${k['14K']['list_cents'] // 100:>4} (v2 {est['14K'] // 100:>4}) · "
          f"18K ${k['18K']['list_cents'] // 100:>4} (v2 {est['18K'] // 100:>4})  cost14 ${k['14K']['cost_cents'] / 100:.2f}")
