"""catalog.json + shots.json -> supabase/migrations/0165_artifact_him26.sql (+ MCP parts + seal.json).

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is written to Etsy.
Run after catalog.py, shots.py and once every listing has public/artifact/him26/<ID>/01..10.jpg:
    python3 docs/artifact-studio/him26/gen_migration.py [parts_dir]

Same shape as the Christmas generators (xmas26/gen_migration.py + gen_images_migration.py) in one file:
price and grams do not depend on metal colour, so each product carries one int[] of prices (USD x 10)
and one numeric[] of grams over karat x size, and SQL expands them across the three colours. The gallery
(10 images per listing, frame 01 = the approved stone hero) is written in the same transaction. Every
generated value is sealed (md5) here and must match the database after apply.
"""
import hashlib, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]
shots = json.load(open(HERE / "shots.json"))
ORG = cat["org"]
PKG = "2026-10-07-artifact-him26"
BASE = "https://amuletta.artifactstudio.info/artifact/him26"
KAR = ["10K", "14K", "18K"]
METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose."
GOLD_LINE = "Finish: solid gold, no plating, no stones."
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. "
        "Add a gift message at checkout and it ships with the piece.")
CARE = "Care: solid gold does not tarnish. Wipe it with a soft cloth; a brushed finish can be refreshed by a jeweller."
IMAGES = ("The product images are design visualizations of the finished piece, and the three-metal image is a "
          "colour visualization of the same design in yellow, white and rose gold; the handmade piece may vary slightly.")
PER_PART = 5


def q(s):
    assert "$hm$" not in s
    return "$hm$" + s + "$hm$"


def split_desc(it):
    parts = it["description"].split("\n\n")
    assert len(parts) == 6, it["id"]
    lead, story, spec, ship, care, images = parts
    assert ship == SHIP and images == IMAGES and care == CARE, it["id"]
    lines = spec.split("\n")
    assert len(lines) == 4 and lines[0] == METAL and lines[1] == GOLD_LINE and lines[2].startswith("Size: "), it["id"]
    return lead, story, lines[2][len("Size: "):], lines[3]


def alts(it):
    n, t, g = it["name"], it["productType"], shots[it["id"]]["palette"]["backdrop"]
    worn = {"ring": "worn on a man's hand", "bracelet": "worn on a man's wrist", "earring": "worn as a single earring"}[t]
    a03 = {"ring": f"{n} on a hand resting on a wooden table", "bracelet": f"{n} on the wrist, hand on a wooden table",
           "earring": f"{n} worn with a turned-up coat collar"}[t]
    a04 = {"ring": f"{n} on a hand rising from a stone plinth", "bracelet": f"{n} on a wrist rising from a stone plinth",
           "earring": f"{n} in a profile portrait"}[t]
    a10 = {"ring": f"{n} worn with a wool suit jacket", "bracelet": f"{n} below the cuff of a wool suit jacket",
           "earring": f"{n} worn with an open shirt collar"}[t]
    pair = " pair" if t == "earring" else ""
    return [
        f"{n} in solid 14K yellow gold on grey stone",
        f"{n} {worn}",
        a03, a04,
        f"Scale view of the {n}, {it['dims']}",
        f"Close-up of the gold surface of the {n}",
        f"{n}{pair} in a minimal still life on {g} stone",
        f"{n}{pair} in an open gift box lined with linen",
        f"{n} shown in yellow, white and rose gold (colour visualization)",
        a10,
    ]


rows, seal_lines, desc_md5, gal_rows, gal_seal = [], [], {}, [], []
for it in items:
    lead, story, size, detail = split_desc(it)
    rebuilt = "\n\n".join([lead, story, "\n".join([METAL, GOLD_LINE, "Size: " + size, detail]), SHIP, CARE, IMAGES])
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
        "offersPersonalization": False, "modelId": it["id"], "name": it["name"], "collection": "For Him 2026",
        "enamel": [], "goldOnly": True, "dims": it["dims"], "variationAxes": it["variationAxes"],
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/him26",
        "generatorScript": "docs/artifact-studio/him26/gen_migration.py",
        "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"],
        "makerCost14KRefUsd": it["makerCost14KRefUsd"], "weightSource": "maker-v2-est", "missingHero": False,
    }
    rows.append(dict(it=it, lead=lead, story=story, size=size, detail=detail, third=third, sizes=sizes,
                     price=price, grams=grams, meta=meta))
    d = ROOT / "public/artifact/him26" / it["id"]
    files = sorted(p.name for p in d.glob("[0-9][0-9].jpg"))
    assert files == [f"{k:02d}.jpg" for k in range(1, 11)], (it["id"], files)
    for pos, alt in enumerate(alts(it)):
        for bad in ("—", "–", "â", "ring finger", "middle finger", "enamel"):
            assert bad not in alt, (it["id"], alt)
        assert len(alt) <= 250
        url = f"{BASE}/{it['id']}/{pos + 1:02d}.jpg"
        gal_rows.append((it["sku"], pos, url, alt))
        gal_seal.append(f"{it['sku']}|{pos}|{url}|{alt}")

seal_lines.sort(key=lambda s: s.split("|")[0].encode())  # order by sku collate "C"
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
NV = len(seal_lines)
assert NV == 2880
DESC_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + desc_md5[it["id"]] for it in items), key=lambda s: s.encode())).encode()).hexdigest()
TAG_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + ",".join(it["tags"]) for it in items), key=lambda s: s.encode())).encode()).hexdigest()
assert len(gal_rows) == 300
gal_seal.sort(key=lambda s: s.encode())
GAL_SEAL = hashlib.md5("\n".join(gal_seal).encode()).hexdigest()

basis = cat["pricingBasis"]
SHARED_META = {
    "pricing": {"goldSpotUsdPerOzt": basis["spotUsdOzt"], "goldQuoteSource": "gold-api.com",
                "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2",
                "methodology": basis["rule"] + ". " + basis["makerCost"] + ". Estimated parts: " + "; ".join(basis["estimated"]) + "."},
    "approval": {"blockers": [
        "ESTIMATED PRICE: rings use the maker's band list; chain grams and earring work are estimates (owner approved pricing on estimates 2026-10-07).",
        "Grams are list or geometry estimates; no sample has been cast or weighed.",
        "Images are design visualizations (Higgsfield): frame 01 is the stone hero, frames 02-10 the sales set, 09 a metal colour visualization; photograph the physical piece before or after the first sale.",
    ],
        "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
        "authority": "Owner instruction 2026-10-07: 30 minimalist men's designs, 10 bracelets, 10 earrings (single and pair), 10 rings; images approved (\"Onayla, uret\")."},
    "variantSeal": SEAL,
}


# products.product_type check allows the plural "earrings"; listing metadata keeps the catalog word.
PRODUCT_TYPE = {"ring": "ring", "bracelet": "bracelet", "earring": "earrings"}


def values(r):
    it = r["it"]
    return "(" + ",\n ".join([
        q(it["id"]), q(it["productId"]), q(it["sku"]), q(PRODUCT_TYPE[it["productType"]]), q(it["title"]),
        q(r["lead"]), q(r["story"]), q(r["size"]), q(r["detail"]),
        "ARRAY[" + ",".join(q(t) for t in it["tags"]) + "]::text[]",
        q(it["name"]), q(r["third"]), "ARRAY[" + ",".join(q(s) for s in r["sizes"]) + "]::text[]",
        "ARRAY[" + ",".join(str(p // 1000) for p in r["price"]) + "]::int[]",
        "ARRAY[" + ",".join(f"{g:.2f}" for g in r["grams"]) + "]::numeric[]",
        q(json.dumps(r["meta"], ensure_ascii=False)) + "::jsonb",
    ]) + ")"


def block(chunk):
    vals = ",\n".join(values(r) for r in chunk)
    skus = {r["it"]["sku"] for r in chunk}
    gvals = ",\n".join(f"({q(s)}, {p}, {q(u)}, {q(a)})" for s, p, u, a in gal_rows if s in skus)
    return f"""begin;

create temporary table _hm(mid text, pid uuid, sku text, ptype text, title text, lead text, story text,
  size text, detail text, tags text[], name text, axis3 text, sizes text[], price_k int[], grams numeric[], meta jsonb) on commit drop;
insert into _hm values
{vals};

create temporary table _hm_s(meta jsonb, metal text, gold text, ship text, care text, images text) on commit drop;
insert into _hm_s values ({q(json.dumps(SHARED_META, ensure_ascii=False))}::jsonb, {q(METAL)}, {q(GOLD_LINE)}, {q(SHIP)}, {q(CARE)}, {q(IMAGES)});

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select f.pid, '{ORG}', f.sku, f.title,
  f.lead || E'\\n\\n' || f.story || E'\\n\\n' || s.metal || E'\\n' || s.gold || E'\\nSize: ' || f.size || E'\\n' || f.detail
    || E'\\n\\n' || s.ship || E'\\n\\n' || s.care || E'\\n\\n' || s.images,
  f.tags, ARRAY['Solid gold'], 'draft', 'USD',
  (select min(x) from unnest(f.price_k) x) * 1000, 20, true, '{BASE}/' || f.mid || '/01.jpg', 10, f.ptype, s.meta || f.meta
from _hm f, _hm_s s
where not exists (select 1 from public.products p where p.org_id = '{ORG}' and (p.sku = f.sku or p.id = f.pid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}',
  f.sku || '-' || k.k || c.cc || '-' || case z.s when 'Single' then '1PC' when 'Pair' then 'PAIR'
    else replace(replace(replace(z.s, 'US ', 'US'), ' inches', 'IN'), '.', '_') end,
  p.id,
  f.name || ': ' || k.k || ' ' || c.cn || ', ' || z.s,
  jsonb_build_object('Karat', k.k, 'Metal Color', c.cn, f.axis3, z.s),
  f.price_k[(k.n - 1) * cardinality(f.sizes) + z.n] * 1000, 20,
  f.grams[(k.n - 1) * cardinality(f.sizes) + z.n], 'maker-v2-est', true, 'USD'
from _hm f
join public.products p on p.org_id = '{ORG}' and p.sku = f.sku and p.etsy_listing_id is null
cross join unnest(ARRAY['10K','14K','18K']) with ordinality k(k, n)
cross join (values ('Y','Yellow Gold'),('W','White Gold'),('R','Rose Gold')) c(cc, cn)
cross join unnest(f.sizes) with ordinality z(s, n)
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

create temporary table _hg(sku text, pos int, url text, alt text) on commit drop;
insert into _hg values
{gvals};

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from _hg g
join public.products p on p.org_id = '{ORG}' and p.sku = g.sku and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

commit;
"""


VERIFY = f"""-- Seals (run after apply; all must match):
--   select count(*), md5(string_agg(v.sku||'|'||(v.properties->>'Karat')||'|'||(v.properties->>'Metal Color')||'|'
--     ||coalesce(v.properties->>'Ring Size', v.properties->>'Bracelet Length', v.properties->>'Pieces')
--     ||'|'||v.price_cents||'|'||to_char(v.weight_grams,'FM990.00'), E'\\n' order by v.sku collate "C"))
--   from product_variants v where v.org_id = '{ORG}' and v.sku like 'BAS-HM-%';
--   expected: {NV} / {SEAL}
--   select md5(string_agg(sku||'|'||md5(description), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-HM-%';                      expected: {DESC_SEAL}
--   select md5(string_agg(sku||'|'||array_to_string(tags, ','), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-HM-%';                      expected: {TAG_SEAL}
--   select count(*), md5(string_agg(p.sku||'|'||li.position||'|'||li.url||'|'||li.alt, E'\\n'
--     order by p.sku||'|'||li.position||'|'||li.url||'|'||li.alt collate "C"))
--   from listing_images li join products p on p.id = li.product_id
--   where p.org_id = '{ORG}' and p.sku like 'BAS-HM-%';                  expected: 300 / {GAL_SEAL}
"""
header = f"""-- 0165_artifact_him26.sql
-- by Artifact Studio Jewelry, For Him 2026: 30 minimalist men's listings (10 rings, 10 bracelets,
-- 10 earrings sold single or pair), {NV} variants on the full grid (Karat x Metal Color x size/pieces),
-- 10 images per listing. Panel drafts only; this migration does not write to Etsy.
-- Source package: docs/artifact-studio/him26/ (catalog.py, shots.py, images.json).
-- Generator: docs/artifact-studio/him26/gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: products insert only when neither sku nor id exists; variants upsert on (org_id, sku)
-- and images insert only under a product still unpublished (etsy_listing_id is null).
{VERIFY}"""

out = ROOT / "supabase/migrations/0165_artifact_him26.sql"
out.write_text(header + "\n" + block(rows))
print(out.relative_to(ROOT), out.stat().st_size, "bytes", NV, SEAL, DESC_SEAL, TAG_SEAL, GAL_SEAL)
if len(sys.argv) > 1:
    d = pathlib.Path(sys.argv[1])
    d.mkdir(parents=True, exist_ok=True)
    for i in range(0, len(rows), PER_PART):
        p = d / f"part{i // PER_PART}.sql"
        p.write_text(block(rows[i:i + PER_PART]))
        print(p.name, p.stat().st_size, [r["it"]["id"] for r in rows[i:i + PER_PART]])
json.dump({"variantSeal": SEAL, "variants": NV, "descSeal": DESC_SEAL, "tagSeal": TAG_SEAL, "gallerySeal": GAL_SEAL,
           "descMd5": desc_md5}, open(HERE / "seal.json", "w"), indent=1)
