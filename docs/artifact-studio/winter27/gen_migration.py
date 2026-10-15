"""catalog.json -> supabase/migrations/0170_artifact_winter27.sql (+ seal.json).

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is written to Etsy.
Same shape as twig/gen_migration.py, looped over the five pieces: one product each, its own variant grid
(27 / 243 / 9 / 27 / 9 = 315), 12 gallery images each from public/artifact/winter27/W0x/01..12.jpg,
every value sealed (md5). Run after catalog.py: python3 docs/artifact-studio/winter27/gen_migration.py
"""
import hashlib, json, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
cat = json.load(open(HERE / "catalog.json"))
ORG = cat["org"]
PKG = "2026-10-15-artifact-winter27"
N_IMG = 12
SEP = ",\n"


def q(s):
    assert "$wn$" not in s
    return "$wn$" + s + "$wn$"


# One alt line per slot, written per piece (template lines must be true for each piece).
ALTS = {
 "W01": ["{n} in solid 14K yellow gold with a white gold tip, standing on frozen river ice",
         "{n} worn below a knit sweater cuff", "Close-up of the molten rippled surface of the {n}",
         "Close-up of the melted seam between the yellow gold body and the white gold tip of the {n}",
         "Edge view of the {n} showing the 4 mm band and the 25 mm opening", "{n} worn, hand resting beside a cup of tea",
         "Scale view of the {n} beside a fingertip, band 4 mm wide", "{n} beside an open gift box",
         "{n} shown in the three two tone combinations: yellow with white tip, white with yellow tip, rose with white tip (colour visualization)",
         "{n} worn with a wool coat collar", "{n} seen from above showing the open C shape", "{n} worn in winter window light"],
 "W02": ["{n} in solid 14K yellow gold with oxblood enamel, standing on pinecone scales",
         "{n} worn on the ring finger", "Close-up of the carved pinecone scales and oxblood enamel of the {n}",
         "Side view of the carved shoulders and smooth shank of the {n}", "{n} worn, hand resting beside a cup of coffee",
         "Scale view of the {n} beside a fingernail, table 13 mm", "{n} lying flat showing the oval table and shank",
         "{n} in a ring cushion beside an open gift box",
         "{n} shown in yellow, white and rose gold (colour visualization)", "{n} worn with a wool coat collar",
         "Inside view of the smooth polished shank of the {n}", "{n} worn in winter window light"],
 "W03": ["{n} in solid 14K yellow gold with dusty blue enamel, on juniper green slate with juniper sprigs",
         "{n} worn on the ear", "Close-up of the four sphere cluster of the {n}",
         "Close-up of the dusty blue enamel sphere of the {n} beside a real juniper berry",
         "Side view of the French hook of the {n}", "Scale view of the {n} held between two fingers, cluster 10 mm",
         "{n} hanging from a juniper sprig", "{n} beside an open gift box",
         "{n} shown in yellow, white and rose gold (colour visualization)", "{n} worn with hair in a low bun",
         "One earring of the {n} standing on slate", "{n} worn in winter window light"],
 "W04": ["{n} in solid 14K yellow gold with an ember orange enamel eye, on ash grey slate",
         "{n} worn at the collarbone", "Close-up of the molten teardrop and ember orange enamel eye of the {n}",
         "Close-up of the domed ember orange enamel eye of the {n}", "Close-up of the slide ring and double strand of the {n}",
         "Scale view of the teardrop of the {n} beside a fingertip, 12 mm", "{n} coiled on slate",
         "{n} on a white card beside an open gift box", "{n} shown in yellow, white and rose gold (colour visualization)",
         "{n} worn with a wool coat", "Side view of the molten teardrop of the {n}", "{n} worn in winter window light"],
 "W05": ["{n} in solid 14K yellow gold on snow dusted pine bark", "{n} worn on a wool coat lapel",
         "Close-up of the matte brushed needle tips of the {n}", "Close-up of the central hub of the {n}",
         "Back of the {n} showing the pin stem and revolver catch", "Scale view of the {n} held between two fingers, 45 mm",
         "{n} pinned on a knit scarf", "{n} beside an open gift box",
         "{n} shown in yellow, white and rose gold (colour visualization)", "{n} worn on a knit sweater shoulder",
         "Low angle view across the needles of the {n}", "{n} worn in winter window light"],
}

blocks, seal_rows, seals = [], [], {}
for it in cat["items"]:
    pid, n = it["id"], it["name"]
    alts = [a.format(n=n) for a in ALTS[pid]]
    assert len(alts) == N_IMG
    files = sorted(p.name for p in (ROOT / f"public/artifact/winter27/{pid}").glob("[0-9][0-9].jpg"))
    assert files == [f"{k:02d}.jpg" for k in range(1, N_IMG + 1)], (pid, files)
    gal = []
    for pos, alt in enumerate(alts):
        for bad in ("—", "–", "â", "diamond", "engrav"):
            assert bad not in alt.lower(), alt
        gal.append((pos, f"{it['imageBase']}/{pos + 1:02d}.jpg", alt))
    axes = it["variationAxes"]
    lines = sorted(("|".join([v["sku"]] + [v["properties"][a] for a in axes] + [str(v["price_cents"]), f"{v['grams']:.2f}"])
                    for v in it["variants"]), key=lambda s: s.encode())
    seal_rows += lines
    vseal = hashlib.md5("\n".join(lines).encode()).hexdigest()
    dmd5 = hashlib.md5(it["description"].encode()).hexdigest()
    tseal = hashlib.md5((it["sku"] + "|" + ",".join(it["tags"])).encode()).hexdigest()
    gseal = hashlib.md5("\n".join(sorted((f"{it['sku']}|{p}|{u}|{a}" for p, u, a in gal), key=lambda s: s.encode())).encode()).hexdigest()
    seals[pid] = {"variants": len(it["variants"]), "variantSeal": vseal, "descMd5": dmd5, "tagSeal": tseal, "gallerySeal": gseal}
    basis = cat["pricingBasis"]
    meta = {
        "productType": it["metaProductType"], "listingProtocol": it["listingProtocol"], "protocolVersion": "etsy-listing-v1",
        "offersPersonalization": it["offersPersonalization"], "modelId": pid, "name": n, "collection": "Winter 26/27",
        "enamel": it["enamel"], "goldOnly": it["goldOnly"], "dims": it["dims"], "variationAxes": axes,
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/winter27",
        "generatorScript": "docs/artifact-studio/winter27/gen_migration.py",
        "grams14Ref": it["grams14Ref"], "refPriceCents": it["refPriceCents"],
        "makerCost14KRefUsd": it["makerCost14KRefUsd"], "weightSource": "geometry_estimate", "missingHero": False,
        "pricing": {"goldSpotUsdPerOzt": basis["spotUsdOzt"], "goldQuoteSource": "gold-api.com",
                    "goldQuoteTimestamp": "2026-09-30T11:21:00Z", "markup": 2.0, "status": "ESTIMATE_MAKER_V2",
                    "methodology": basis["rule"] + ". " + basis["makerCost"] + ". Estimated parts: " + "; ".join(basis["estimated"]) + "."},
        "approval": {"blockers": [
            "ESTIMATED PRICE: 2 x maker cost on the shop's maker terms; the maker has not quoted this design or weighed a sample.",
            "Grams are geometry estimates (pricing.py); no sample has been cast.",
            "Images are design visualizations (Higgsfield): frame 01 is the approved hero, 09 a metal colour visualization; photograph the physical piece before or after the first sale.",
        ], "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
            "authority": "Owner brief 2026-10-15 (five winter listings); concepts, cuff width 4 mm, five heroes and 55 gallery prompts approved 2026-10-15."},
        "variantSeal": vseal,
    }
    vname = lambda v: n + ": " + " ".join(v["properties"][a] for a in axes[:2]) + ("" if len(axes) == 2 else ", " + v["properties"][axes[2]])
    vrows = SEP.join(f"  ({q(v['sku'])}, {q(vname(v))}, {q(json.dumps(v['properties']))}, {v['price_cents']}, {v['grams']:.2f})" for v in it["variants"])
    grows = SEP.join(f"  ({p}, {q(u)}, {q(a)})" for p, u, a in gal)
    blocks.append(f"""-- {pid} {n}: {len(it['variants'])} variants ({' x '.join(axes)}), seal {vseal}, md5(description) {dmd5},
-- tags {tseal}, gallery {gseal}
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select {q(it['productId'])}::uuid, '{ORG}', {q(it['sku'])}, {q(it['title'])}, {q(it['description'])},
  ARRAY[{",".join(q(t) for t in it['tags'])}]::text[], ARRAY['Solid gold'{", 'Vitreous enamel'" if it['enamel'] else ""}], 'draft', 'USD',
  {min(v['price_cents'] for v in it['variants'])}, 20, true, '{it['imageBase']}/01.jpg', {N_IMG}, '{it['productType']}',
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

insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
{grows}
) g(pos, url, alt)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(it['sku'])} and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
""")

SET_SEAL = hashlib.md5("\n".join(sorted(seal_rows, key=lambda s: s.encode())).encode()).hexdigest()
sql = f"""-- 0170_artifact_winter27.sql
-- by Artifact Studio Jewelry: Winter 26/27 set, 5 listings, 315 variants, 60 images. Panel drafts only;
-- this migration does not write to Etsy. Source package: docs/artifact-studio/winter27/ (catalog.py).
-- Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku);
-- images insert only under a product still unpublished (etsy_listing_id is null).
-- Set seal (run after apply): 315 variants / {SET_SEAL}
--   (md5 of sku|axis values|price_cents|grams over all five products, order by line collate "C")
begin;

{chr(10).join(blocks)}
commit;
"""
out = ROOT / "supabase/migrations/0170_artifact_winter27.sql"
out.write_text(sql)
json.dump({"setVariants": len(seal_rows), "setSeal": SET_SEAL, "items": seals}, open(HERE / "seal.json", "w"), indent=1)
print(out.relative_to(ROOT), out.stat().st_size, len(seal_rows), SET_SEAL)
