"""Compact, equivalent SQL for applying 0169 through the Supabase MCP (one part per product).

The migration file stays the canonical record; this emits the SAME rows with the variant grid expanded in SQL
(prices and grams do not depend on metal colour, so each product carries karat x size rows cross-joined with its
three colours). The set seal after apply must equal seal.json. Run: python3 compact_sql.py <out_dir>
"""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
mig = (ROOT / "supabase/migrations/0170_artifact_winter27.sql").read_text()
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
ORG = cat["org"]
CODE = {"Yellow Gold": "Y", "White Gold": "W", "Rose Gold": "R", "Yellow/White Gold": "YW", "White/Yellow Gold": "WY", "Rose/White Gold": "RW"}

for it in cat["items"]:
    pid, sku, axes = it["id"], it["sku"], it["variationAxes"]
    # products + images blocks copied verbatim from the migration (they are already compact)
    start = mig.index(f"-- {pid} {it['name']}:")
    nxt = [i for i in (mig.find("\n-- W0", start + 1), mig.find("\ncommit;", start)) if i > 0]
    block = mig[start:min(nxt)]
    prod = block[block.index("insert into public.products ("):block.index("insert into public.product_variants (")]
    img = block[block.index("insert into public.listing_images"):]
    assert prod.count("insert into") == 1 and img.count("insert into") == 1, pid
    colours = []
    for v in it["variants"]:
        c = v["properties"]["Metal Color"]
        if c not in colours: colours.append(c)
    rows = {}
    for v in it["variants"]:
        k = v["properties"]["Karat"]; size = v["properties"][axes[2]] if len(axes) == 3 else ""
        code = v["sku"].split("-")[3] if len(axes) == 3 else ""
        key = (k, size, code)
        rows.setdefault(key, set()).add((v["price_cents"], v["grams"]))
    assert all(len(s) == 1 for s in rows.values()), pid
    vals = ",\n".join(f"  ('{k}','{s}','{c}',{list(pg)[0][0]},{list(pg)[0][1]:.2f})" for (k, s, c), pg in rows.items())
    cols = ",".join(f"('{CODE[c]}','{c}')" for c in colours)
    if len(axes) == 3:
        sku_expr = f"'{sku}-'||r.k||c.cc||'-'||r.code"
        name_expr = f"$wn${it['name']}: $wn$||r.k||' '||c.cn||', '||r.size"
        props = f"jsonb_build_object('Karat',r.k,'Metal Color',c.cn,'{axes[2]}',r.size)"
    else:
        sku_expr = f"'{sku}-'||r.k||c.cc"
        name_expr = f"$wn${it['name']}: $wn$||r.k||' '||c.cn"
        props = "jsonb_build_object('Karat',r.k,'Metal Color',c.cn)"
    var = f"""insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}', {sku_expr}, p.id, {name_expr}, {props}, r.price, 20, r.grams, 'geometry_estimate', true, 'USD'
from (values
{vals}
) r(k, size, code, price, grams)
cross join (values {cols}) c(cc, cn)
join public.products p on p.org_id = '{ORG}' and p.sku = $wn${sku}$wn$ and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();
"""
    part = "begin;\n" + prod + "\n" + var + "\n" + img + "commit;\n"
    (out / f"{pid}.sql").write_text(part)
    print(pid, len(part), "rows", len(rows), "x", len(colours), "=", len(it["variants"]))
