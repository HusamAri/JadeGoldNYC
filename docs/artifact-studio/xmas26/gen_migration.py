"""catalog.json -> supabase/migrations/0160_artifact_xmas26.sql (+ MCP parts).

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is
written to Etsy and no image rows are created (images come after the owner's
Higgsfield prompt approval). Run after catalog.py:
    python3 docs/artifact-studio/xmas26/gen_migration.py [parts_dir]

Same shape as the FW 26/27 generator: price and grams do not depend on metal
colour, so each product carries one int[] of prices (USD x 10) and one
numeric[] of grams over karat x size and SQL expands them across the three
colours. Descriptions are rebuilt in SQL from shared pieces; every generated
value is sealed (md5) here and must match the database after apply.
"""
import hashlib, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]
ORG = cat["org"]
PKG = "2026-10-06-artifact-xmas26"
KAR = ["10K", "14K", "18K"]
METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose."
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE_EN = ("Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, "
           "so take it off for the gym and the dishes and wipe it with a soft cloth.")
CARE_GOLD = "Care: solid gold does not tarnish. Wipe it with a soft cloth to keep the polish."
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")
PER_PART = 5


def q(s):
    assert "$xm$" not in s
    return "$xm$" + s + "$xm$"


def split_desc(it):
    parts = it["description"].split("\n\n")
    assert len(parts) == 6, it["id"]
    lead, story, spec, ship, care, images = parts
    assert ship == SHIP and images == IMAGES and care == (CARE_GOLD if it["goldOnly"] else CARE_EN), it["id"]
    lines = spec.split("\n")
    assert len(lines) == 4 and lines[0] == METAL and lines[2].startswith("Size: "), it["id"]
    return lead, story, lines[1], lines[2][len("Size: "):], lines[3]


rows, seal_lines, desc_md5 = [], [], {}
for it in items:
    lead, story, finish, size, detail = split_desc(it)
    rebuilt = "\n\n".join([lead, story, "\n".join([METAL, finish, "Size: " + size, detail]), SHIP,
                           CARE_GOLD if it["goldOnly"] else CARE_EN, IMAGES])
    assert rebuilt == it["description"], it["id"]
    third = it["variationAxes"][2]
    sizes = []
    for v in it["variants"]:
        if v["properties"][third] not in sizes:
            sizes.append(v["properties"][third])
    price, grams = [], []
    for k in KAR:
        for s in sizes:
            vs = [v for v in it["variants"] if v["properties"]["Karat"] == k and v["properties"][third] == s]
            assert len(vs) == 3 and len({v["price_cents"] for v in vs}) == 1 and len({v["grams"] for v in vs}) == 1
            price.append(vs[0]["price_cents"])
            grams.append(vs[0]["grams"])
    assert all(p % 1000 == 0 for p in price)
    for v in it["variants"]:
        pr = v["properties"]
        seal_lines.append("|".join([v["sku"], pr["Karat"], pr["Metal Color"], pr[third], str(v["price_cents"]), f"{v['grams']:.2f}"]))
    desc_md5[it["id"]] = hashlib.md5(it["description"].encode()).hexdigest()
    meta = {
        "productType": it["productType"], "listingProtocol": it["listingProtocol"], "protocolVersion": "etsy-listing-v1",
        "offersPersonalization": False, "family": it["family"], "modelId": it["id"], "name": it["name"],
        "enamel": it["enamel"], "goldOnly": it["goldOnly"], "dims": it["dims"], "variationAxes": it["variationAxes"],
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/xmas26",
        "generatorScript": "docs/artifact-studio/xmas26/gen_migration.py",
        "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"], "weightSource": "geometry_estimate",
        "missingHero": True,
    }
    rows.append(dict(it=it, lead=lead, story=story, finish=finish, size=size, detail=detail,
                     third=third, sizes=sizes, price=price, grams=grams, meta=meta))

seal_lines.sort(key=lambda s: s.split("|")[0].encode())  # order by sku collate "C" (sku only, like the SQL)
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
NV = len(seal_lines)
assert NV == 2970
DESC_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + desc_md5[it["id"]] for it in items), key=lambda s: s.encode())).encode()).hexdigest()
TAG_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + ",".join(it["tags"]) for it in items), key=lambda s: s.encode())).encode()).hexdigest()

SHARED_META = {
    "pricing": {"goldSpotUsdPerOzt": 4178.20, "goldQuoteSource": "gold-api.com", "goldQuoteTimestamp": "2026-09-30T11:21:00Z",
                "lossFactor": 1.07, "markup": 2.0, "status": "PROVISIONAL",
                "methodology": "FW 26/27 rule: estimated grams (14K geometry, density-scaled for 10K/18K) x spot per gram x karat "
                               "fineness x 1.07, plus category labor derived from the owner's 2027 enamel quotes; list price = 2 x cost "
                               "rounded up to USD 10. Live spot 2026-10-06 was 4169.50 (-0.2%)."},
    "approval": {"blockers": [
        "PROVISIONAL PRICE: labor per category comes from the 2027 enamel quotes; the workshop has not quoted these 30 designs.",
        "Grams are geometry estimates; no sample has been cast or weighed.",
        "No images yet: the reference hero and 10 sales frames are generated in Higgsfield after the owner approves the prompts.",
    ],
        "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
        "authority": "Owner instruction 2026-10-06: Christmas set of 10 rings, 10 bracelets, 10 necklaces with 10 Etsy sales images each (\"sirayla yap hepsini\")."},
    "variantSeal": SEAL,
}


def values(r):
    it = r["it"]
    return "(" + ",\n ".join([
        q(it["id"]), q(it["productId"]), q(it["sku"]), q(it["productType"]), q(it["title"]),
        q(r["lead"]), q(r["story"]), q(r["finish"]), q(r["size"]), q(r["detail"]),
        "ARRAY[" + ",".join(q(t) for t in it["tags"]) + "]::text[]",
        q(it["name"]), q(r["third"]), "ARRAY[" + ",".join(q(s) for s in r["sizes"]) + "]::text[]",
        "true" if it["goldOnly"] else "false",
        "ARRAY[" + ",".join(str(p // 1000) for p in r["price"]) + "]::int[]",
        "ARRAY[" + ",".join(f"{g:.2f}" for g in r["grams"]) + "]::numeric[]",
        q(json.dumps(r["meta"], ensure_ascii=False)) + "::jsonb",
    ]) + ")"


def block(chunk):
    vals = ",\n".join(values(r) for r in chunk)
    return f"""begin;

create temporary table _xm(mid text, pid uuid, sku text, ptype text, title text, lead text, story text, finish text,
  size text, detail text, tags text[], name text, axis3 text, sizes text[], gold boolean, price_k int[], grams numeric[], meta jsonb) on commit drop;
insert into _xm values
{vals};

create temporary table _xm_s(meta jsonb, metal text, ship text, care_en text, care_gold text, images text) on commit drop;
insert into _xm_s values ({q(json.dumps(SHARED_META, ensure_ascii=False))}::jsonb, {q(METAL)}, {q(SHIP)}, {q(CARE_EN)}, {q(CARE_GOLD)}, {q(IMAGES)});

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select f.pid, '{ORG}', f.sku, f.title,
  f.lead || E'\\n\\n' || f.story || E'\\n\\n' || s.metal || E'\\n' || f.finish || E'\\nSize: ' || f.size || E'\\n' || f.detail
    || E'\\n\\n' || s.ship || E'\\n\\n' || case when f.gold then s.care_gold else s.care_en end || E'\\n\\n' || s.images,
  f.tags, case when f.gold then ARRAY['Solid gold'] else ARRAY['Solid gold','Vitreous enamel'] end, 'draft', 'USD',
  (select min(x) from unnest(f.price_k) x) * 1000, 20, true, null, 0, f.ptype, s.meta || f.meta
from _xm f, _xm_s s
where not exists (select 1 from public.products p where p.org_id = '{ORG}' and (p.sku = f.sku or p.id = f.pid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}',
  f.sku || '-' || k.k || c.cc || '-' || replace(replace(replace(z.s, 'US ', 'US'), ' inches', 'IN'), '.', '_'),
  p.id,
  f.name || ': ' || k.k || ' ' || c.cn || ', ' || z.s,
  jsonb_build_object('Karat', k.k, 'Metal Color', c.cn, f.axis3, z.s),
  f.price_k[(k.n - 1) * cardinality(f.sizes) + z.n] * 1000, 20,
  f.grams[(k.n - 1) * cardinality(f.sizes) + z.n], 'geometry_estimate', true, 'USD'
from _xm f
join public.products p on p.org_id = '{ORG}' and p.sku = f.sku and p.etsy_listing_id is null
cross join unnest(ARRAY['10K','14K','18K']) with ordinality k(k, n)
cross join (values ('Y','Yellow Gold'),('W','White Gold'),('R','Rose Gold')) c(cc, cn)
cross join unnest(f.sizes) with ordinality z(s, n)
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

commit;
"""


VERIFY = f"""-- Seals (run after apply; all must match):
--   select count(*), md5(string_agg(v.sku||'|'||(v.properties->>'Karat')||'|'||(v.properties->>'Metal Color')||'|'
--     ||coalesce(v.properties->>'Ring Size', v.properties->>'Chain Length', v.properties->>'Bracelet Length')
--     ||'|'||v.price_cents||'|'||to_char(v.weight_grams,'FM990.00'), E'\\n' order by v.sku collate "C"))
--   from product_variants v where v.org_id = '{ORG}' and v.sku like 'BAS-XM-%';
--   expected: {NV} / {SEAL}
--   select md5(string_agg(sku||'|'||md5(description), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-XM-%';                      expected: {DESC_SEAL}
--   select md5(string_agg(sku||'|'||array_to_string(tags, ','), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-XM-%';                      expected: {TAG_SEAL}
"""
header = f"""-- 0160_artifact_xmas26.sql
-- by Artifact Studio Jewelry, Christmas 2026: 30 listing proposals (10 families x ring, bracelet,
-- necklace), {NV} variants on the full grid (Karat x Metal Color x size). Panel drafts only; this
-- migration does not write to Etsy and adds no images (they follow the owner's prompt approval).
-- Source package: docs/artifact-studio/xmas26/ (01-design-direction.md, catalog.py).
-- Generator: docs/artifact-studio/xmas26/gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: products insert only when neither sku nor id exists; variants upsert on (org_id, sku)
-- only under a product still unpublished (etsy_listing_id is null).
{VERIFY}"""

out = ROOT / "supabase/migrations/0160_artifact_xmas26.sql"
out.write_text(header + "\n" + block(rows))
print(out.relative_to(ROOT), out.stat().st_size, "bytes", NV, SEAL, DESC_SEAL, TAG_SEAL)
if len(sys.argv) > 1:
    d = pathlib.Path(sys.argv[1])
    d.mkdir(parents=True, exist_ok=True)
    for i in range(0, len(rows), PER_PART):
        p = d / f"part{i // PER_PART}.sql"
        p.write_text(block(rows[i:i + PER_PART]))
        print(p.name, p.stat().st_size, [r["it"]["id"] for r in rows[i:i + PER_PART]])
json.dump({"variantSeal": SEAL, "variants": NV, "descSeal": DESC_SEAL, "tagSeal": TAG_SEAL, "descMd5": desc_md5},
          open(HERE / "seal.json", "w"), indent=1)
