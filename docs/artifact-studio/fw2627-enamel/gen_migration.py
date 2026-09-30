"""catalog.json -> supabase/migrations/0157_artifact_fw2627_enamel.sql (+ MCP parts).

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is
written to Etsy. Run after catalog.py:
    python3 docs/artifact-studio/fw2627-enamel/gen_migration.py [parts_dir]

Payload is kept small so it can be applied through MCP in parts without hand
transcription risk: price and grams do not depend on metal colour, so each
product carries one int[] of prices and one numeric[] of grams over karat x size
and SQL expands them across the three colours. Descriptions are rebuilt in SQL
from the shared template; every generated value is sealed (md5) here and must
match the database after apply.
"""
import hashlib, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"] if isinstance(cat, dict) else cat
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
PKG = "2026-09-30-artifact-fw2627-enamel"
KAR = ["10K", "14K", "18K"]
COL = [("Y", "Yellow Gold"), ("W", "White Gold"), ("R", "Rose Gold")]
TYPE = {"ring": "ring", "necklace": "necklace", "bracelet": "bracelet", "earring": "earrings"}
TAIL = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.\n\n"
        "Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, "
        "so take it off for the gym and the dishes and wipe it with a soft cloth.\n\n"
        "The product image is a design visualization of the finished piece; the handmade piece may vary slightly.")
METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose."


def q(s):
    assert "$fw$" not in s
    return "$fw$" + s + "$fw$"


def split_desc(it):
    parts = it["description"].split("\n\n")
    lead, story, spec = parts[0], parts[1], parts[2]
    assert "\n\n".join(parts[3:]) == TAIL, it["id"]
    lines = spec.split("\n")
    assert lines[0] == METAL and lines[1].startswith("Enamel: ") and lines[2].startswith("Size: "), it["id"]
    return lead, story, lines[1][len("Enamel: "):], lines[2][len("Size: "):], lines[3]


def rebuild(lead, story, enamel, size, detail):
    return "\n\n".join([lead, story, "\n".join([METAL, "Enamel: " + enamel, "Size: " + size, detail]), TAIL])


rows, seal_lines, desc_md5 = [], [], {}
for it in items:
    lead, story, enamel, size, detail = split_desc(it)
    assert rebuild(lead, story, enamel, size, detail) == it["description"], it["id"]
    axes = it["variationAxes"]
    third = axes[2] if len(axes) == 3 else None
    sizes = []
    for v in it["variants"]:
        s = v["properties"].get(third) if third else None
        if s not in sizes:
            sizes.append(s)
    # colour-independent grid, karat-major, size-minor (catalog loop order)
    price, grams = [], []
    for k in KAR:
        for s in sizes:
            vs = [v for v in it["variants"] if v["properties"]["Karat"] == k and (third is None or v["properties"][third] == s)]
            assert len(vs) == 3 and len({v["price_cents"] for v in vs}) == 1 and len({v["grams"] for v in vs}) == 1, it["id"]
            price.append(vs[0]["price_cents"])
            grams.append(vs[0]["grams"])
    assert all(p % 1000 == 0 for p in price)
    for v in it["variants"]:
        pr = v["properties"]
        seal_lines.append("|".join([v["sku"], pr["Karat"], pr["Metal Color"], pr.get(third, "") if third else "",
                                    str(v["price_cents"]), f"{v['grams']:.2f}"]))
    desc_md5[it["id"]] = hashlib.md5(it["description"].encode()).hexdigest()
    meta = {
        "productType": it["productType"], "listingProtocol": it["listingProtocol"], "protocolVersion": "etsy-listing-v1",
        "offersPersonalization": False, "family": it["family"], "modelId": it["id"], "name": it["name"],
        "enamel": it["enamel"], "dims": it["dims"], "variationAxes": axes,
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/fw2627-enamel",
        "generatorScript": "docs/artifact-studio/fw2627-enamel/gen_migration.py",
        "imageSha256": it["imageSha256"], "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"],
        "weightSource": "geometry_estimate",
    }
    rows.append(dict(it=it, lead=lead, story=story, enamel=enamel, size=size, detail=detail,
                     sizes=sizes, third=third, price=price, grams=grams, meta=meta))

seal_lines.sort(key=lambda s: s.encode())  # collate "C"
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
NV = len(seal_lines)
assert NV == 3060
SHARED_META = {
    "pricing": {"goldSpotUsdPerOzt": 4178.20, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z",
                "lossFactor": 1.07, "markup": 2.0,
                "methodology": "Estimated grams (14K geometry, density-scaled for 10K/18K) x spot per gram x karat fineness x 1.07, "
                               "plus category labor derived from the owner's 2027 enamel quotes; list price = 2 x cost rounded up to USD 10."},
    "approval": {"blockers": [
        "Grams are geometry estimates; no sample has been cast or weighed.",
        "Labor per category is derived from the 2027 enamel quotes; the workshop has not quoted these 40 designs.",
        "Hero image is a design visualization (Higgsfield), one image per listing; photograph the physical piece before or after the first sale.",
        "Etsy taxonomy names for dangle and hoop earrings are not verified against the live tree; the push stops if they are missing."],
        "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
        "authority": "Owner instruction 2026-09-30: create listing-ready enamel proposals in the panel (listing onerileri), images included (\"Gorselleri de uret hepsini yurut\")."},
    "variantSeal": SEAL,
}


def listing_values(r):
    it = r["it"]
    sizes = "ARRAY[" + ",".join(q(s) for s in r["sizes"]) + "]::text[]" if r["third"] else "ARRAY[NULL]::text[]"
    return "(" + ",\n ".join([
        q(it["id"]), q(it["productId"]), q(it["sku"]), q(TYPE[it["productType"]]), q(it["title"]),
        q(r["lead"]), q(r["story"]), q(r["enamel"]), q(r["size"]), q(r["detail"]),
        "ARRAY[" + ",".join(q(t) for t in it["tags"]) + "]::text[]",
        q(it["name"]), q(r["third"] or ""), sizes,
        "ARRAY[" + ",".join(str(p // 1000) for p in r["price"]) + "]::int[]",
        "ARRAY[" + ",".join(f"{g:.2f}" for g in r["grams"]) + "]::numeric[]",
        q(json.dumps(r["meta"], ensure_ascii=False)) + "::jsonb",
    ]) + ")"


def sql_block(chunk):
    values = ",\n".join(listing_values(r) for r in chunk)
    return f"""begin;

create temporary table _fw(mid text, pid uuid, sku text, ptype text, title text, lead text, story text, enamel text,
  size text, detail text, tags text[], name text, axis3 text, sizes text[], price_k int[], grams numeric[], meta jsonb) on commit drop;
insert into _fw values
{values};

create temporary table _fw_shared(meta jsonb, tail text, metal text) on commit drop;
insert into _fw_shared values ({q(json.dumps(SHARED_META, ensure_ascii=False))}::jsonb, {q(TAIL)}, {q(METAL)});

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select f.pid, '{ORG}', f.sku, f.title,
  f.lead || E'\\n\\n' || f.story || E'\\n\\n' || s.metal || E'\\nEnamel: ' || f.enamel || E'\\nSize: ' || f.size || E'\\n' || f.detail || E'\\n\\n' || s.tail,
  f.tags, ARRAY['Solid gold','Vitreous enamel']::text[], 'draft', 'USD',
  (select min(x) from unnest(f.price_k) x) * 1000, 20, true,
  'https://amuletta.artifactstudio.info/artifact/fw2627-enamel/' || f.mid || '.jpg', 1, f.ptype,
  s.meta || f.meta
from _fw f, _fw_shared s
where not exists (select 1 from public.products p where p.org_id = '{ORG}' and (p.sku = f.sku or p.id = f.pid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}',
  f.sku || '-' || k.k || c.cc || coalesce('-' || nullif(replace(replace(replace(z.s, 'US ', 'US'), ' inches', 'IN'), '.', '_'), ''), ''),
  p.id,
  f.name || ': ' || k.k || ' ' || c.cn || coalesce(', ' || z.s, ''),
  jsonb_build_object('Karat', k.k, 'Metal Color', c.cn) || case when f.axis3 <> '' then jsonb_build_object(f.axis3, z.s) else '{{}}'::jsonb end,
  f.price_k[(k.n - 1) * cardinality(f.sizes) + z.n] * 1000, 20,
  f.grams[(k.n - 1) * cardinality(f.sizes) + z.n], 'geometry_estimate', true, 'USD'
from _fw f
join public.products p on p.org_id = '{ORG}' and p.sku = f.sku and p.etsy_listing_id is null
cross join unnest(ARRAY['10K','14K','18K']) with ordinality k(k, n)
cross join (values ('Y','Yellow Gold'),('W','White Gold'),('R','Rose Gold')) c(cc, cn)
cross join unnest(f.sizes) with ordinality z(s, n)
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, p.image_url, 'url', f.title, 0
from _fw f
join public.products p on p.org_id = '{ORG}' and p.sku = f.sku and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = p.image_url);

commit;
"""


VERIFY = f"""-- Seal (run after apply; both must match):
--   select count(*), md5(string_agg(v.sku||'|'||(v.properties->>'Karat')||'|'||(v.properties->>'Metal Color')||'|'
--     ||coalesce(v.properties->>'Ring Size', v.properties->>'Chain Length', v.properties->>'Bracelet Length', '')
--     ||'|'||v.price_cents||'|'||to_char(v.weight_grams,'FM990.00'), E'\\n' order by v.sku collate "C"))
--   from product_variants v where v.org_id = '{ORG}' and v.sku like 'BAS-FW-%';
--   expected: {NV} / {SEAL}
--   select md5(string_agg(sku||'|'||md5(description), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-FW-%';
--   expected: {hashlib.md5(chr(10).join(sorted((it['sku'] + '|' + desc_md5[it['id']] for it in items), key=lambda s: s.encode())).encode()).hexdigest()}
"""

header = f"""-- 0157_artifact_fw2627_enamel.sql
-- by Artifact Studio Jewelry, FW 26/27 enamel set: 40 listing proposals (10 families x ring,
-- necklace, earrings, bracelet), 3,060 variants on the full grid (Karat x Metal Color x size;
-- earrings Karat x Metal Color). Panel drafts only; this migration does not write to Etsy.
-- Source package: docs/artifact-studio/fw2627-enamel/ (01-design-direction.md, catalog.py, images.json).
-- Generator: docs/artifact-studio/fw2627-enamel/gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: products insert only when neither sku nor id exists; variants upsert on (org_id, sku)
-- only under a product still unpublished (etsy_listing_id is null); image row skipped if present.
{VERIFY}"""

out = ROOT / "supabase/migrations/0157_artifact_fw2627_enamel.sql"
out.write_text(header + "\n" + sql_block(rows))
print(out.relative_to(ROOT), out.stat().st_size, "bytes", NV, SEAL)
if len(sys.argv) > 1:
    d = pathlib.Path(sys.argv[1]); d.mkdir(parents=True, exist_ok=True)
    for i in range(0, 40, 5):
        p = d / f"part{i // 5}.sql"
        p.write_text(sql_block(rows[i:i + 5]))
        print(p.name, p.stat().st_size)
json.dump({"variantSeal": SEAL, "variants": NV, "descMd5": desc_md5}, open(HERE / "seal.json", "w"), indent=1)
