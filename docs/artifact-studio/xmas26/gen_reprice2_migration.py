"""Christmas 2026 reprice step 2 (owner 2026-10-07 "tahmini fiyatla"): necklaces and bracelets on estimates.

Follows 0163 (rings + raise-only bracelets). Writes every necklace and bracelet row at the catalog price,
guarded by the 0163 after-seal. Run: python3 docs/artifact-studio/xmas26/gen_reprice2_migration.py
"""
import json, hashlib, pathlib, re
HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
c = json.load(open(HERE / "catalog.json"))
ORG = c["org"]
V = sorted([v for i in c["items"] for v in i["variants"]], key=lambda v: v["sku"].encode())
BEFORE = "e8ed8f7b6324ec068243bc11ef44b265"          # after-seal of 0163
AFTER = hashlib.md5("\n".join(f"{v['sku']}:{v['price_cents']}" for v in V).encode()).hexdigest()
rows = {}
for v in V:
    m = re.fullmatch(r"BAS-XM-([NB]\d\d)-(\d+K)[YWR]-(.+)", v["sku"])
    if not m:
        continue
    k = "-".join(m.groups())
    assert rows.setdefault(k, (v["price_cents"], v["grams"])) == (v["price_cents"], v["grams"]), k
vals = ",\n".join(f"('{k}',{p},{g})" for k, (p, g) in sorted(rows.items()))
sql = f"""-- Christmas 2026 (BAS-XM-) step 2: necklaces and bracelets at 2 x maker cost on estimates
-- (owner 2026-10-07 "tahmini fiyatla"). Follows 0163. Generator gen_reprice2_migration.py.
-- before {BEFORE}  after {AFTER}
do $$
declare s text;
begin
  select md5(string_agg(sku||':'||price_cents, E'\\n' order by sku collate "C")) into s
    from product_variants where org_id = '{ORG}' and sku like 'BAS-XM-%';
  if s = '{AFTER}' then raise notice 'already applied'; return; end if;
  if s is distinct from '{BEFORE}' then raise exception 'BAS-XM- not in the 0163 state (seal %)', s; end if;
  update product_variants pv
     set price_cents = v.price, weight_grams = v.grams, weight_source = 'maker-v2-est'
    from (values
{vals}
    ) as v(k, price, grams)
   where pv.org_id = '{ORG}' and pv.sku ~ '^BAS-XM-[NB]'
     and regexp_replace(pv.sku, '^BAS-XM-([NB]\\d\\d)-(\\d+K)[YWR]-(.+)$', '\\1-\\2-\\3') = v.k;
  select md5(string_agg(sku||':'||price_cents, E'\\n' order by sku collate "C")) into s
    from product_variants where org_id = '{ORG}' and sku like 'BAS-XM-%';
  if s is distinct from '{AFTER}' then raise exception 'after-seal mismatch %', s; end if;
end $$;
"""
(ROOT / "supabase/migrations/0164_artifact_xmas26_maker_reprice_est.sql").write_text(sql)
print(len(rows), "keys", len(sql), "bytes", AFTER)
