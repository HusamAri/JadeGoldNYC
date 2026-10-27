"""Compact apply SQL for 0172 (same rows as gen_migration.py): the Width x Length grid, SKUs, prices and
grams are generated in SQL from the catalog axes and the pricing.py formula, so only text is transcribed.
The variant seal in seal.json is the check that both paths produce the same rows. Usage: python3 compact_sql.py S01"""
import json, sys, re, pathlib
HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
from pricing import CHAINS, LENGTHS
import gen_migration as G  # noqa: rebuilds the full migration as a side effect (idempotent)

lid = sys.argv[1]
part = (HERE / "parts" / f"{lid}.sql").read_text()
L = json.load(open(HERE / "listings.json"))[lid]
chain, piece = L["chain"], L["piece"]
prod = part[part.index("insert into public.products"):part.index("insert into public.product_variants")]
widths = ",".join(f"({w},{g})" for w, g in CHAINS[chain].items())
lens = ",".join(f"({x})" for x in LENGTHS[piece])
name = f"{G.CHAIN_NAME[chain]} {piece}"
alts = ",".join(f"({i},{G.q(a)})" for i, a in enumerate(G.alts(lid, chain, piece)))
psku = f"BAS-SLV-{lid}"
sql = f"""begin;
{prod}
insert into public.product_variants (org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency)
select p.org_id, '{psku}-' || replace(trim_scale(w.width)::text, '.', '_') || 'MM-' || l.len || 'IN', p.id,
  '{name}: ' || trim_scale(w.width) || ' mm, ' || l.len || ' in',
  jsonb_build_object('Width', trim_scale(w.width) || ' mm', 'Length', l.len || ' in'),
  ((ceil(((50 + 6.0 * w.g18 * l.len / 18) / 0.70 + 1) / 10) * 10 - 1) * 100)::int, 20,
  round(w.g18 * l.len / 18, 1), 'supplier_catalog', true, 'USD'
from (values {widths}) w(width, g18) cross join (values {lens}) l(len)
join public.products p on p.org_id = '{G.ORG}' and p.sku = '{psku}' and p.etsy_listing_id is null
on conflict (org_id, sku) do nothing;
insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, '{G.BASE_URL}/{lid}/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg', 'url', g.alt, g.pos
from (values {alts}) g(pos, alt)
join public.products p on p.org_id = '{G.ORG}' and p.sku = '{psku}' and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = '{G.BASE_URL}/{lid}/' || lpad((g.pos + 1)::text, 2, '0') || '.jpg');
commit;
select md5(string_agg(line, E'\\n' order by line collate "C")) seal, count(*) n from (
  select v.sku || '|' || (v.properties->>'Width') || '|' || (v.properties->>'Length') || '|' || v.price_cents || '|' || to_char(v.weight_grams, 'FM9990.00') line
  from public.product_variants v join public.products p on p.id = v.product_id where p.sku = '{psku}') s;
"""
(HERE / "parts" / f"{lid}.compact.sql").write_text(sql)
print(len(sql))
