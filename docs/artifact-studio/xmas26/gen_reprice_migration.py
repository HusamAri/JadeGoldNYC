"""Christmas 2026 reprice to 2 x maker cost (owner 2026-10-07) -> supabase/migrations/0163.

Rings: one price per (band width group, karat, size); bracelets: per (id, karat, length); necklaces held.
Colour does not change price or grams, so keys strip it. Guarded by the before-seal; aborts if the live
prices are not exactly v1 (second run, or someone edited them). Run: python3 .../gen_reprice_migration.py
"""
import json, hashlib, pathlib, re
HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
c = json.load(open(HERE / "catalog.json"))
ORG = c["org"]
V = sorted([v for i in c["items"] for v in i["variants"]], key=lambda v: v["sku"].encode())
seal = lambda key: hashlib.md5("\n".join(f"{v['sku']}:{v[key]}" for v in V).encode()).hexdigest()
BEFORE, AFTER = seal("price_cents_v1"), seal("price_cents")

def key(sku):
    m = re.fullmatch(r"BAS-XM-([RBN])(\d\d)-(\d+K)[YWR]-(.+)", sku)
    cat, n, k, size = m.groups()
    grp = ("B4" if n == "02" else "B3") if cat == "R" else cat + n
    return f"{grp}-{k}-{size}"

rows = {}
for v in V:
    if v["sku"].startswith("BAS-XM-N"):
        continue
    kk = key(v["sku"])
    val = (v["price_cents"], v["grams"])
    assert rows.setdefault(kk, val) == val, (kk, rows[kk], val)   # colour-free key really is colour-free
vals = ",\n".join(f"('{k}',{p},{g})" for k, (p, g) in sorted(rows.items()))
sql = f"""-- Christmas 2026 (by Artifact Studio Jewelry, BAS-XM-): reprice rings and bracelets to 2 x maker cost.
-- Owner decision 2026-10-07; maker terms in docs/artifact-studio/maker_cost.py; generator gen_reprice_migration.py.
-- Necklaces are NOT touched (chain not quoted). Bracelets other than B09 only rise (station grams estimated).
-- Seal = md5(string_agg(sku||':'||price_cents, E'\\n' order by sku collate "C")) over all 2970 BAS-XM- variants.
-- before {BEFORE}  after {AFTER}
do $$
declare s text;
begin
  select md5(string_agg(sku||':'||price_cents, E'\\n' order by sku collate "C")) into s
    from product_variants where org_id = '{ORG}' and sku like 'BAS-XM-%';
  if s = '{AFTER}' then raise notice 'already repriced, nothing to do'; return; end if;
  if s is distinct from '{BEFORE}' then raise exception 'BAS-XM- prices are not the expected v1 state (seal %)', s; end if;

  update product_variants pv
     set price_cents = v.price, weight_grams = v.grams, weight_source = 'maker-v2'
    from (values
{vals}
    ) as v(k, price, grams)
   where pv.org_id = '{ORG}' and pv.sku like 'BAS-XM-%' and pv.sku not like 'BAS-XM-N%'
     and regexp_replace(pv.sku, '^BAS-XM-([RB])(\\d\\d)-(\\d+K)[YWR]-(.+)$',
           case when pv.sku like 'BAS-XM-R02-%' then 'B4-\\3-\\4' when pv.sku like 'BAS-XM-R%' then 'B3-\\3-\\4' else '\\1\\2-\\3-\\4' end) = v.k;

  select md5(string_agg(sku||':'||price_cents, E'\\n' order by sku collate "C")) into s
    from product_variants where org_id = '{ORG}' and sku like 'BAS-XM-%';
  if s is distinct from '{AFTER}' then raise exception 'after-seal mismatch %', s; end if;
end $$;
"""
out = ROOT / "supabase/migrations/0163_artifact_xmas26_maker_reprice.sql"
out.write_text(sql)
print(len(rows), "keys", len(sql), "bytes", BEFORE, AFTER, out.name)
