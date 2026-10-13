"""catalog.json -> supabase/migrations/0167_artifact_twig.sql (+ seal.json).

Panel draft only (products.status='draft', etsy_listing_id null); nothing is written to Etsy.
Same shape as him26/gen_migration.py: one product, 27 variants (Karat x Metal Color x Bracelet Length),
12 gallery images from public/artifact/twig/B01/01..12.jpg, every value sealed (md5).
Run: python3 docs/artifact-studio/twig/gen_migration.py
"""
import hashlib, json, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
ORG = cat["org"]
it = cat["items"][0]
PKG = "2026-10-13-artifact-twig"
BASE = "https://amuletta.artifactstudio.info/artifact/twig"
N_IMG = 12


def q(s):
    assert "$mo$" not in s
    return "$mo$" + s + "$mo$"


n = it["name"]
ALTS = [
    f"{n} in solid 14K yellow gold on frosted slate blue stone",
    f"{n} worn below a knit sweater cuff",
    f"{n} worn, hand holding a frosted twig",
    f"{n} on a wrist rising from a slate blue plinth",
    f"Scale view of the {n} beside a fingertip, twig 20 mm, pearl about 6 mm",
    f"Close-up of the gold twig and baroque pearl of the {n}",
    f"{n} lying in a circle around a frosted twig",
    f"{n} on a white card beside an open gift box",
    f"{n} shown in yellow, white and rose gold (colour visualization)",
    f"{n} worn with a wool coat collar",
    f"Side view of the gold twig and pearl cup of the {n}",
    f"{n} worn in winter window light",
]
assert len(ALTS) == N_IMG
files = sorted(p.name for p in (ROOT / "public/artifact/twig/B01").glob("[0-9][0-9].jpg"))
assert files == [f"{k:02d}.jpg" for k in range(1, N_IMG + 1)], files
gal = []
for pos, alt in enumerate(ALTS):
    for bad in ("—", "–", "â", "diamond", "engrav", " tag"):
        assert bad not in alt.lower(), alt
    gal.append((pos, f"{BASE}/B01/{pos + 1:02d}.jpg", alt))

seal_lines = sorted(
    ("|".join([v["sku"], v["properties"]["Karat"], v["properties"]["Metal Color"], v["properties"]["Bracelet Length"],
               str(v["price_cents"]), f"{v['grams']:.2f}"]) for v in it["variants"]), key=lambda s: s.encode())
SEAL = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
DESC_MD5 = hashlib.md5(it["description"].encode()).hexdigest()
TAG_SEAL = hashlib.md5((it["sku"] + "|" + ",".join(it["tags"])).encode()).hexdigest()
gal_seal = sorted((f"{it['sku']}|{p}|{u}|{a}" for p, u, a in gal), key=lambda s: s.encode())
GAL_SEAL = hashlib.md5("\n".join(gal_seal).encode()).hexdigest()

basis = cat["pricingBasis"]
meta = {
    "productType": "bracelet", "listingProtocol": it["listingProtocol"], "protocolVersion": "etsy-listing-v1",
    "offersPersonalization": False, "modelId": it["id"], "name": n, "collection": "Twig and Pearl",
    "enamel": [], "goldOnly": True, "dims": it["dims"], "variationAxes": it["variationAxes"],
    "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/twig",
    "generatorScript": "docs/artifact-studio/twig/gen_migration.py",
    "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"],
    "makerCost14KRefUsd": it["makerCost14KRefUsd"], "weightSource": "geometry_estimate", "missingHero": False,
    "pricing": {"goldSpotUsdPerOzt": basis["spotUsdOzt"], "goldQuoteSource": "gold-api.com",
                "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2",
                "methodology": basis["rule"] + ". " + basis["makerCost"] + ". Estimated parts: " + "; ".join(basis["estimated"]) + "."},
    "approval": {"blockers": [
        "ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.",
        "Station grams sit at the shop's 1 g unit floor and the pearl at 15 USD; no sample has been cast and no pearl sourced.",
        "Images are design visualizations (Higgsfield): frame 01 is the hero built on the owner's reference render, 09 a metal colour visualization; photograph the physical piece before or after the first sale.",
    ], "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
        "authority": "Owner brief 2026-10-13 (as-twig-baroque-pearl-bracelet); decisions: white pearl only, no diamond, no engraving (no tag, no extender); images generated on the owner's go; \"bitirene kadar devam\"."},
    "variantSeal": SEAL,
}

SEP = ",\n"
VROWS = SEP.join(f"  ({q(v['sku'])}, {q(n + ': ' + v['properties']['Karat'] + ' ' + v['properties']['Metal Color'] + ', ' + v['properties']['Bracelet Length'])}, {q(json.dumps(v['properties']))}, {v['price_cents']}, {v['grams']:.2f})" for v in it['variants'])
GROWS = SEP.join(f"  ({p}, {q(u)}, {q(a)})" for p, u, a in gal)
sql = f"""-- 0167_artifact_twig.sql
-- by Artifact Studio Jewelry: Twig and Baroque Pearl Bracelet, 1 listing, 27 variants
-- (Karat x Metal Color x Bracelet Length), 12 images. Panel draft only; this migration does not write to Etsy.
-- Source package: docs/artifact-studio/twig/ (catalog.py). Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku);
-- images insert only under a product still unpublished (etsy_listing_id is null).
-- Seals (run after apply):
--   variants: 27 / {SEAL}   (md5 of sku|Karat|Metal Color|Bracelet Length|price_cents|grams, order by sku collate "C")
--   md5(description) = {DESC_MD5}
--   md5(sku||'|'||array_to_string(tags, ',')) = {TAG_SEAL}
--   gallery: 12 / {GAL_SEAL}
begin;

insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select {q(it['productId'])}::uuid, '{ORG}', {q(it['sku'])}, {q(it['title'])}, {q(it['description'])},
  ARRAY[{",".join(q(t) for t in it['tags'])}]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  {min(v['price_cents'] for v in it['variants'])}, 20, true, '{BASE}/B01/01.jpg', {N_IMG}, 'bracelet',
  {q(json.dumps(meta, ensure_ascii=False))}::jsonb
where not exists (select 1 from public.products p where p.org_id = '{ORG}'
  and (p.sku = {q(it['sku'])} or p.id = {q(it['productId'])}::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
{VROWS}
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(it['sku'])} and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
{GROWS}
) g(pos, url, alt)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(it['sku'])} and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);

commit;
"""
out = ROOT / "supabase/migrations/0167_artifact_twig.sql"
out.write_text(sql)
json.dump({"variantSeal": SEAL, "variants": 27, "descMd5": DESC_MD5, "tagSeal": TAG_SEAL, "gallerySeal": GAL_SEAL},
          open(HERE / "seal.json", "w"), indent=1)
print(out.relative_to(ROOT), out.stat().st_size, SEAL, DESC_MD5, TAG_SEAL, GAL_SEAL)
