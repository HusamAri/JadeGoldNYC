"""pricing.py -> supabase/migrations/0187_artifact_silver_chains_cost5.sql (cost-plus reprice, owner 2026-11-12).

Proves the seal format first: the 0173 list prices must reproduce the 0173 post seal (84f0f796...), which is
also this migration's precondition. Then writes the migration with the new post seal. Products are matched by
variant SKU prefix and org: products.sku is NULL since the Etsy mirror of 2026-10-26 (a `p.sku like` scope
would touch 0 rows and still report success).
Run: python3 gen_reprice_cost5.py
"""
import hashlib
import pathlib
from decimal import Decimal, ROUND_HALF_UP

import pricing

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
PRE = "84f0f7969e89e3d9e01819b7c681bd2e"   # 0173 post seal
OUT = ROOT / "supabase/migrations/0187_artifact_silver_chains_cost5.sql"


def line(r, price_usd):
    w = f"{float(r['w']):g}"
    sku = f"BAS-SLV-{r['lid']}-{w.replace('.', '_')}MM-{r['L']}IN"
    g = r["g"].quantize(Decimal("0.1"), ROUND_HALF_UP)
    return f"{sku}|{w} mm|{r['L']} in|{price_usd * 100}|{g:.2f}"


def seal(lines):
    return hashlib.md5("\n".join(sorted(lines)).encode()).hexdigest()


R = list(pricing.rows())
assert len(R) == 144
pre = seal(line(r, r["prev"]) for r in R)
assert pre == PRE, f"seal format drift: {pre}"
post = seal(line(r, r["lst"]) for r in R)
changed = sum(r["prev"] != r["lst"] for r in R)
assert changed == 144, changed

vals = ",".join(f"('{lid}',{float(w):g},{g18})" for (chain, piece), lid in pricing.IDS.items()
                for w, g18 in pricing.CHAINS[chain].items())
seal_expr = ("v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || "
             "v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00')")
scope = f"v.org_id = '{ORG}' and v.sku like 'BAS-SLV-S0_-%'"
model = ("pricing.py: cost-plus (owner 2026-11-12): list = ceil((5.00 USD/g x grams + 8.50 + 0.45) / (0.905 x 0.75)); "
         "breaks even at a 25% sale, leaves 10.65% for ads and profit at the 15% sale; Offsite Ads not in the floor")
sql = f"""-- 0187_artifact_silver_chains_cost5.sql
-- by Artifact Studio Jewelry (Leander) silver chains S01-S06: list prices rebuilt on the supplier cost.
-- Owner 2026-11-12: "5 usd is each gram's cost in silvers. Assume ads cost and Etsy fees and set highly competitive prices."
-- list = ceil((5.00 x grams + 8.50 + 0.45) / (0.905 x 0.75)), grams = catalog 18 in weight x length / 18
-- (docs/artifact-studio/silver-chains/pricing.py). The list price breaks even at the deepest planned sale (25%);
-- at the 15% shop sale it leaves 10.65% of the buyer price for Etsy Ads and profit.
-- Live Etsy was the 0173 list x 0.65 (owner's own cut, 8 to 11 Nov); 63 of 144 variants were below cost there.
-- Precondition: live set seal = {PRE} (0173 as applied); postcondition: {post}.
-- Runs once: a second run finds the post seal and stops.
do $$
declare s text; n int;
begin
  select md5(string_agg(line, E'\\n' order by line collate "C")), count(*) into s, n from (
    select {seal_expr} line from public.product_variants v where {scope}) x;
  if s = '{post}' then raise notice 'already repriced'; return; end if;
  if n <> 144 or s is distinct from '{PRE}' then raise exception 'precondition: % variants, seal %', n, s; end if;

  update public.product_variants v
  set price_cents = (ceil((5.00 * m.g18 * (split_part(v.properties->>'Length', ' ', 1))::numeric / 18 + 8.95) / 0.67875) * 100)::int,
      updated_at = now()
  from (values {vals}) m(lid, width, g18)
  where {scope} and v.sku like 'BAS-SLV-' || m.lid || '-%'
    and v.properties->>'Width' = trim_scale(m.width) || ' mm';
  get diagnostics n = row_count;
  if n <> 144 then raise exception 'updated % variants, expected 144', n; end if;

  update public.products p
  set price_cents = (select min(price_cents) from public.product_variants v where v.product_id = p.id),
      listing_metadata = jsonb_set(jsonb_set(listing_metadata, '{{pricing,model}}', to_jsonb('{model}'::text)),
        '{{variantSeal}}', to_jsonb((select md5(string_agg({seal_expr}, E'\\n' order by {seal_expr} collate "C")) from public.product_variants v where v.product_id = p.id))),
      updated_at = now()
  where p.org_id = '{ORG}' and p.id in (select v.product_id from public.product_variants v where {scope});
  get diagnostics n = row_count;
  if n <> 6 then raise exception 'updated % products, expected 6', n; end if;

  select md5(string_agg(line, E'\\n' order by line collate "C")) into s from (
    select {seal_expr} line from public.product_variants v where {scope}) x;
  if s <> '{post}' then raise exception 'postcondition seal %', s; end if;
end $$;
"""
OUT.write_text(sql, encoding="utf-8")
print(f"pre {pre}\npost {post}\nchanged {changed}/144\nwrote {OUT.relative_to(ROOT)} ({len(sql)} bytes)")
