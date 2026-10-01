"""catalog.json -> supabase/migrations/0159_artifact_ss27_anklets.sql (+ MCP parts).

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is
written to Etsy. Run after catalog.py:
    python3 docs/artifact-studio/ss27-anklets/gen_migration.py [parts_dir]

The payload is kept small so it can be applied through MCP in two parts without
hand-transcription risk: price and grams do not depend on metal colour (one int[]
and one numeric[] over karat x length, expanded across colours in SQL), the
description and listing metadata are rebuilt in SQL from per-row fields and the
shared template, and the three shared tags are appended in SQL. Every rebuilt
value is checked here against catalog.json and sealed (md5); the seals must match
the database after apply.
"""
import hashlib, json, pathlib, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
items = cat["items"]
basis = cat["pricingBasis"]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
PKG = "2026-10-01-artifact-ss27-anklets"
KAR = ["10K", "14K", "18K"]
AXIS3 = "Anklet Length"
LENGTHS = ["9 inches", "10 inches", "11 inches"]
IMG_BASE = "https://amuletta.artifactstudio.info/artifact/ss27-anklets/"

METAL = "Metal: solid 10K, 14K or 18K gold in yellow, white or rose."
GOLD_LINE = "Charm: solid gold, sculpted, with a closed back; no enamel."
CHAIN_LINE = ("Chain: 1.0 mm solid gold cable chain with spring ring clasp; the charm hangs from a gold jump "
              "ring at the centre; choose 9, 10 or 11 inches.")
FIT_LINE = ("Fit: measure around the ankle just above the bone and add half an inch to one inch for an easy drape. "
            "Most ankles take 9 or 10 inches.")
SHIP = ("Each piece is made to order and ships free within the United States from New Jersey. Add a gift message "
        "at checkout and it ships with the piece.")
CARE_EN = ("Care: enamel is glass fused to gold. It keeps its colour, but it can chip on a hard knock, so take it off "
           "for the gym, rinse it in fresh water after the sea or the pool and dry it with a soft cloth.")
CARE_GOLD = ("Care: solid gold does not tarnish. Rinse it in fresh water after the sea or the pool and dry it with a "
             "soft cloth to keep the polish.")
IMAGE_LINE = "The product image is a design visualization of the finished piece; the handmade piece may vary slightly."
SHARED_TAGS = ["gold anklet", "anklet for women", "gift for her"]
NO_IMAGE_BLOCKER = "No hero image yet: this charm was not generated in Higgsfield; generate it from hero-prompts.html before pushing."


def rebuild(lead, story, enamel, gold, size):
    mat = GOLD_LINE if gold else ("Enamel: kiln-fired vitreous enamel in " + " and ".join(enamel)
                                  + ", set flush in recessed cells with polished gold rims.")
    return "\n\n".join([lead, story, "\n".join([METAL, mat, f"Size: charm {size} mm.", CHAIN_LINE, FIT_LINE]),
                        SHIP, CARE_GOLD if gold else CARE_EN, IMAGE_LINE])


def q(s):
    assert "$ss$" not in s
    return "$ss$" + s + "$ss$"


def meta_for(it):
    """Exactly what the SQL builds with jsonb_build_object (keys sorted by jsonb anyway)."""
    m = {
        "productType": "anklet", "listingProtocol": it["listingProtocol"], "protocolVersion": "etsy-listing-v1",
        "offersPersonalization": False, "family": it["family"], "modelId": it["id"], "name": it["name"],
        "enamel": it["enamel"], "goldOnly": it["goldOnly"], "dims": it["dims"], "variationAxes": it["variationAxes"],
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/ss27-anklets",
        "generatorScript": "docs/artifact-studio/ss27-anklets/gen_migration.py",
        "imageSha256": it["imageSha256"], "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"],
        "weightSource": "geometry_estimate",
    }
    if not it["imageUrl"]:
        m["missingHero"] = True
    return m


rows, seal_lines, desc_md5 = [], [], {}
for it in items:
    assert it["variationAxes"] == ["Karat", "Metal Color", AXIS3] and it["listingProtocol"] == "anklet"
    parts = it["description"].split("\n\n")
    lead, story = parts[0], parts[1]
    size = it["dims"].removeprefix("charm ").removesuffix(" mm")
    assert rebuild(lead, story, it["enamel"], it["goldOnly"], size) == it["description"], it["id"]
    assert it["tags"][-3:] == SHARED_TAGS and len(it["tags"]) == 13, it["id"]
    assert it["materials"] == (["Solid gold"] if it["goldOnly"] else ["Solid gold", "Vitreous enamel"])
    assert it["imageUrl"] in (None, IMG_BASE + it["id"] + ".jpg"), it["id"]
    price, grams = [], []
    for k in KAR:
        for L in LENGTHS:
            vs = [v for v in it["variants"] if v["properties"]["Karat"] == k and v["properties"][AXIS3] == L]
            assert len(vs) == 3 and len({v["price_cents"] for v in vs}) == 1 and len({v["grams"] for v in vs}) == 1, it["id"]
            price.append(vs[0]["price_cents"])
            grams.append(vs[0]["grams"])
    assert all(p % 1000 == 0 for p in price) and len(it["variants"]) == 27
    for v in it["variants"]:
        pr = v["properties"]
        assert v["sku"] == f"{it['sku']}-{pr['Karat']}{pr['Metal Color'][0]}-{pr[AXIS3].replace(' inches', 'IN')}", v["sku"]
        assert v["sku"].startswith("BAS-SS-" + it["id"]) and it["sku"] == "BAS-SS-" + it["id"]
        seal_lines.append("|".join([v["sku"], pr["Karat"], pr["Metal Color"], pr[AXIS3],
                                    str(v["price_cents"]), f"{v['grams']:.2f}"]))
    desc_md5[it["id"]] = hashlib.md5(it["description"].encode()).hexdigest()
    rows.append(dict(it=it, lead=lead, story=story, size=size, price=price, grams=grams))

seal_lines.sort(key=lambda s: s.split("|")[0].encode())  # order by sku collate "C" (sku only, like the SQL)
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
NV = len(seal_lines)
assert NV == 1080
DESC_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + desc_md5[it["id"]] for it in items),
                                          key=lambda s: s.encode())).encode()).hexdigest()
TAG_SEAL = hashlib.md5("\n".join(sorted((it["sku"] + "|" + ",".join(it["tags"]) for it in items),
                                         key=lambda s: s.encode())).encode()).hexdigest()
missing_img = [it["id"] for it in items if not it["imageUrl"]]
SHARED_META = {
    "pricing": {"goldSpotUsdPerOzt": basis["spotUsdOzt"], "goldQuoteSource": "gold-api.com",
                "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "lossFactor": basis["loss"], "markup": basis["markup"],
                "laborUsd": basis["laborUsd"], "chainGPerInch14K": basis["chainGPerInch14K"], "status": "PROVISIONAL",
                "methodology": "Estimated grams (charm + findings + 1.0 mm cable chain per inch, 14K, density-scaled for 10K/18K) "
                               "x spot per gram x karat fineness x 1.07, plus labor from the owner's 14K enamel bracelet quote; "
                               "list price = 2 x cost rounded up to USD 10."},
    "approval": {"blockers": [
        "PROVISIONAL PRICE: labor is the enamel bracelet quote; ask the workshop for an anklet quote before pushing to Etsy.",
        "Grams are geometry estimates (chain g/in scaled from the 1.1 mm FW chain); no sample has been cast or weighed.",
        "Hero image is a design visualization generated in Higgsfield by the owner; photograph the physical piece before or after the first sale.",
        "Etsy taxonomy name 'Anklets' (Jewelry root) is not verified against the live tree; the push stops if it is missing or ambiguous."],
        "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
        "authority": "Owner instruction 2026-10-01: 40 SS27 anklets approved (direction, 9/10/11 in, provisional FW pricing), panel import \"aktar\"."},
    "variantSeal": SEAL,
}


def arr_text(xs):
    return "ARRAY[" + ",".join(q(x) for x in xs) + "]::text[]"


def listing_values(r):
    it = r["it"]
    return "(" + ",".join([
        q(it["id"]), q(it["productId"]), q(it["title"]), q(r["lead"]), q(r["story"]), q(r["size"]),
        arr_text(it["tags"][:10]), q(it["name"]), q(it["family"]), arr_text(it["enamel"]),
        "true" if it["goldOnly"] else "false", "true" if it["imageUrl"] else "false",
        q(it["imageSha256"]) if it["imageSha256"] else "NULL", f"{it['grams14Ref']}", str(it["refPriceCents"]),
        "ARRAY[" + ",".join(str(p // 1000) for p in r["price"]) + "]",
        "ARRAY[" + ",".join(f"{g:.2f}" for g in r["grams"]) + "]",
    ]) + ")"


def sql_block(chunk):
    values = ",\n".join(listing_values(r) for r in chunk)
    shared = [json.dumps(SHARED_META, ensure_ascii=False), NO_IMAGE_BLOCKER, METAL, GOLD_LINE, CHAIN_LINE,
              FIT_LINE, SHIP, CARE_EN, CARE_GOLD, IMAGE_LINE]
    return f"""begin;

create temporary table _ss(mid text, pid uuid, title text, lead text, story text, size text, tags text[], name text,
  family text, enamel text[], gold boolean, has_img boolean, img_sha text, g14 numeric, ref_cents int,
  price_k int[], grams numeric[]) on commit drop;
insert into _ss values
{values};

create temporary table _ss_c(meta jsonb, noimg text, metal text, goldline text, chain text, fit text, ship text,
  care_en text, care_gold text, imgline text) on commit drop;
insert into _ss_c values ({q(shared[0])}::jsonb, {", ".join(q(x) for x in shared[1:])});

create temporary table _ss_p on commit drop as
select f.*, 'BAS-SS-' || f.mid as sku,
  case when f.has_img then '{IMG_BASE}' || f.mid || '.jpg' end as image_url,
  f.lead || E'\\n\\n' || f.story || E'\\n\\n' || c.metal || E'\\n' ||
    case when f.gold then c.goldline
         else 'Enamel: kiln-fired vitreous enamel in ' || array_to_string(f.enamel, ' and ') || ', set flush in recessed cells with polished gold rims.' end
    || E'\\nSize: charm ' || f.size || E' mm.\\n' || c.chain || E'\\n' || c.fit || E'\\n\\n' || c.ship || E'\\n\\n'
    || case when f.gold then c.care_gold else c.care_en end || E'\\n\\n' || c.imgline as description,
  f.tags || ARRAY['gold anklet','anklet for women','gift for her'] as all_tags,
  case when f.gold then ARRAY['Solid gold'] else ARRAY['Solid gold','Vitreous enamel'] end as materials,
  case when f.has_img then c.meta
       else jsonb_set(c.meta, '{{approval,blockers}}', (c.meta #> '{{approval,blockers}}') || to_jsonb(c.noimg)) end
  || jsonb_build_object(
       'productType', 'anklet', 'listingProtocol', 'anklet', 'protocolVersion', 'etsy-listing-v1',
       'offersPersonalization', false, 'family', f.family, 'modelId', f.mid, 'name', f.name,
       'enamel', to_jsonb(f.enamel), 'goldOnly', f.gold, 'dims', 'charm ' || f.size || ' mm',
       'variationAxes', jsonb_build_array('Karat', 'Metal Color', '{AXIS3}'),
       'sourcePackage', '{PKG}', 'sourcePackagePath', 'docs/artifact-studio/ss27-anklets',
       'generatorScript', 'docs/artifact-studio/ss27-anklets/gen_migration.py',
       'imageSha256', f.img_sha, 'grams14Ref', f.g14, 'refPriceCents', f.ref_cents, 'weightSource', 'geometry_estimate')
  || case when f.has_img then '{{}}'::jsonb else jsonb_build_object('missingHero', true) end as meta
from _ss f, _ss_c c;

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select f.pid, '{ORG}', f.sku, f.title, f.description, f.all_tags, f.materials, 'draft', 'USD',
  (select min(x) from unnest(f.price_k) x) * 1000, 20, true,
  f.image_url, case when f.has_img then 1 else 0 end, 'anklet', f.meta
from _ss_p f
where not exists (select 1 from public.products p where p.org_id = '{ORG}' and (p.sku = f.sku or p.id = f.pid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}',
  f.sku || '-' || k.k || c.cc || '-' || replace(z.s, ' inches', 'IN'),
  p.id,
  f.name || ': ' || k.k || ' ' || c.cn || ', ' || z.s,
  jsonb_build_object('Karat', k.k, 'Metal Color', c.cn, '{AXIS3}', z.s),
  f.price_k[(k.n - 1) * 3 + z.n] * 1000, 20,
  f.grams[(k.n - 1) * 3 + z.n], 'geometry_estimate', true, 'USD'
from _ss_p f
join public.products p on p.org_id = '{ORG}' and p.sku = f.sku and p.etsy_listing_id is null
cross join unnest(ARRAY['10K','14K','18K']) with ordinality k(k, n)
cross join (values ('Y','Yellow Gold'),('W','White Gold'),('R','Rose Gold')) c(cc, cn)
cross join unnest(ARRAY['9 inches','10 inches','11 inches']) with ordinality z(s, n)
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, p.image_url, 'url', f.title, 0
from _ss_p f
join public.products p on p.org_id = '{ORG}' and p.sku = f.sku and p.etsy_listing_id is null
where p.image_url is not null
  and not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = p.image_url);

commit;
"""


VERIFY = f"""-- Seals (run after apply; all must match):
--   select count(*), md5(string_agg(v.sku||'|'||(v.properties->>'Karat')||'|'||(v.properties->>'Metal Color')||'|'
--     ||(v.properties->>'{AXIS3}')||'|'||v.price_cents||'|'||to_char(v.weight_grams,'FM990.00'), E'\\n' order by v.sku collate "C"))
--   from product_variants v where v.org_id = '{ORG}' and v.sku like 'BAS-SS-%';
--   expected: {NV} / {SEAL}
--   select md5(string_agg(sku||'|'||md5(description), E'\\n' order by sku collate "C")),
--          md5(string_agg(sku||'|'||array_to_string(tags, ','), E'\\n' order by sku collate "C")) from products
--   where org_id = '{ORG}' and sku like 'BAS-SS-%';
--   expected: {DESC_SEAL} / {TAG_SEAL}
--   products 40, listing_images 38 (no hero yet: {", ".join(missing_img)})
"""

header = f"""-- 0159_artifact_ss27_anklets.sql
-- by Artifact Studio Jewelry, SS27 anklets: 40 listing proposals (10 families x 4 charms),
-- 1,080 variants on the full grid (Karat x Metal Color x Anklet Length 9/10/11 in).
-- Panel drafts only; this migration does not write to Etsy. Prices are PROVISIONAL.
-- Source package: docs/artifact-studio/ss27-anklets/ (01-design-direction.md, catalog.py, images.json).
-- Generator: docs/artifact-studio/ss27-anklets/gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: products insert only when neither sku nor id exists; variants upsert on (org_id, sku)
-- only under a product still unpublished (etsy_listing_id is null); image row skipped if present.
{VERIFY}"""

out = ROOT / "supabase/migrations/0159_artifact_ss27_anklets.sql"
out.write_text(header + "\n" + sql_block(rows))
print(out.relative_to(ROOT), out.stat().st_size, "bytes", NV, SEAL, DESC_SEAL, TAG_SEAL)
if len(sys.argv) > 1:
    d = pathlib.Path(sys.argv[1]); d.mkdir(parents=True, exist_ok=True)
    for old in d.glob("part*.sql"):
        old.unlink()
    for i in range(0, 40, 10):
        p = d / f"part{i // 10}.sql"
        p.write_text(sql_block(rows[i:i + 10]))
        print(p.name, p.stat().st_size)
json.dump({"variantSeal": SEAL, "variants": NV, "descSeal": DESC_SEAL, "tagSeal": TAG_SEAL, "descMd5": desc_md5},
          open(HERE / "seal.json", "w"), indent=1)
