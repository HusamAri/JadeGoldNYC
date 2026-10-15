"""catalog.json -> supabase/migrations/0168_ophir_stellar.sql (+ seal.json).

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is written to Etsy.
Five listings, 495 variants. NO gallery rows: the images are not made yet, so every item carries
missingHero=true and etsyDraftCreationAuthorized=false — pushing a draft without images opens a
photo-less Etsy listing (second-brain 2026-09-25). When the frames land, only the image step
changes and these text/variant seals must come back IDENTICAL (second-brain 2026-10-01).

Run: python3 docs/ophir/stellar/gen_migration.py
"""
import hashlib, json, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
ORG = cat["org"]
PKG = "2026-10-15-ophir-stellar"
basis = cat["pricingBasis"]


def q(s):
    assert "$mo$" not in s
    return "$mo$" + s + "$mo$"


def axis_vals(v, axes):
    return [v["properties"][a] for a in axes]


blocks, seals = [], {}
for it in cat["items"]:
    axes = it["variationAxes"]
    seal_lines = sorted(
        ("|".join([v["sku"]] + axis_vals(v, axes) + [str(v["price_cents"]), f"{v['grams']:.2f}"])
         for v in it["variants"]), key=lambda s: s.encode())
    seal = hashlib.md5("\n".join(seal_lines).encode()).hexdigest()
    desc_md5 = hashlib.md5(it["description"].encode()).hexdigest()
    tag_seal = hashlib.md5((it["sku"] + "|" + ",".join(it["tags"])).encode()).hexdigest()
    seals[it["id"]] = {"variants": len(it["variants"]), "variantSeal": seal,
                       "descMd5": desc_md5, "tagSeal": tag_seal}

    meta = {
        "productType": it["productType"], "listingProtocol": it["listingProtocol"],
        "protocolVersion": "etsy-listing-v1", "offersPersonalization": False,
        "modelId": it["id"], "name": it["name"], "collection": "The Stellar Line",
        "enamel": [], "goldOnly": False, "dims": it["dims"], "variationAxes": axes,
        "sourcePackage": PKG, "sourcePackagePath": "docs/ophir/stellar",
        "generatorScript": "docs/ophir/stellar/gen_migration.py",
        "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"],
        "makerCost14KRefUsd": it["makerCost14KRefUsd"], "stonesRef": it["stonesRef"],
        "weightSource": "geometry_estimate", "missingHero": True,
        "pricing": {"goldSpotUsdPerOzt": basis["spotUsdOzt"], "goldQuoteSource": "gold-api.com",
                    "markup": 2.0, "status": "ESTIMATE_STONES_AND_GRAMS",
                    "methodology": basis["rule"] + ". " + basis["makerCost"]
                                   + ". Estimated parts: " + "; ".join(basis["estimated"]) + "."},
        "approval": {"blockers": [
            "ESTIMATED PRICE: 2 x maker cost on the shop's maker terms. The maker has NOT quoted this "
            "design, has not weighed a sample, and the maker band list carries NO diamond line.",
            f"Stones are costed at {basis['estimated'][0]}. One maker number replaces this and reprices "
            "the whole line; the generator prints the sensitivity.",
            "Grams are geometric estimates with a 1.15 safety factor; the signet also uses the owner's "
            "(top + shank) / 2 averaging rule rather than a measured section.",
            "NO IMAGES YET: the five hero frames are generated but unverified, and frames 02-10 are not "
            "built. Do not push to Etsy until the gallery is attached — a draft pushed now opens with no "
            "photographs.",
        ], "etsyDraftCreationAuthorized": False, "livePublicationAuthorized": False,
            "authority": "Owner 2026-10-13 scope (five lookbook products, 10 images each); "
                         "owner 2026-10-15 \"tahmini olarak kur\" authorises estimated pricing."},
        "variantSeal": seal,
    }

    SEP = ",\n"
    vrows = SEP.join(
        f"  ({q(v['sku'])}, {q(it['name'] + ': ' + ', '.join(axis_vals(v, axes)))}, "
        f"{q(json.dumps(v['properties']))}, {v['price_cents']}, {v['grams']:.2f})"
        for v in it["variants"])
    blocks.append(f"""
-- {it['id']} {it['name']} — {len(it['variants'])} variants ({' x '.join(axes)})
--   variants: {len(it['variants'])} / {seal}
--   md5(description) = {desc_md5}
--   md5(sku||'|'||array_to_string(tags, ',')) = {tag_seal}
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, num_images, product_type, listing_metadata
)
select {q(it['productId'])}::uuid, '{ORG}', {q(it['sku'])}, {q(it['title'])}, {q(it['description'])},
  ARRAY[{",".join(q(t) for t in it['tags'])}]::text[], ARRAY['Solid gold'], 'draft', 'USD',
  {min(v['price_cents'] for v in it['variants'])}, 20, true, 0, {q(it['productType'])},
  {q(json.dumps(meta, ensure_ascii=False))}::jsonb
where not exists (select 1 from public.products p where p.org_id = '{ORG}'
  and (p.sku = {q(it['sku'])} or p.id = {q(it['productId'])}::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}', v.sku, p.id, v.name, v.props::jsonb, v.price, 20, v.grams, 'geometry_estimate', true, 'USD'
from (values
{vrows}
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(it['sku'])} and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();
""")

total = sum(len(i["variants"]) for i in cat["items"])
sql = f"""-- 0168_ophir_stellar.sql
-- Ophir Gold USA: The Stellar Line, 5 listings, {total} variants. Panel drafts only;
-- this migration does not write to Etsy and attaches NO images (none are made yet).
-- Source package: docs/ophir/stellar/ (catalog.py). Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Prices are ESTIMATES: 2 x maker cost with an uncalibrated stone price and geometric grams.
-- Idempotent: products insert only when neither sku nor id exists; variants upsert on (org_id, sku).
begin;
{"".join(blocks)}
commit;
"""
out = ROOT / "supabase/migrations/0168_ophir_stellar.sql"
out.write_text(sql)
json.dump({"package": PKG, "total": total, "items": seals}, open(HERE / "seal.json", "w"), indent=1)
print(out.relative_to(ROOT), out.stat().st_size, "bytes,", total, "variants")
for k, v in seals.items():
    print(f"  {k}: {v['variants']:4} / {v['variantSeal']}  desc {v['descMd5'][:8]}  tags {v['tagSeal'][:8]}")
