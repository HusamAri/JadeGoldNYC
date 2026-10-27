"""listings.json + prices.csv -> supabase/migrations/0172_artifact_silver_chains.sql (+ seal.json, + parts/*.sql)

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is written to Etsy.
Six products (S01..S06), full Width x Length grid each. Panel price = the Etsy list price from pricing.py
(the shop's permanent 30% sale shows list x 0.70), same convention as FW26 (0171).
Images: five design visualizations per listing, picks.json, served from public/artifact/silver/Sxx/.
Run after listings.py and pricing.py: python3 gen_migration.py
"""
import csv, hashlib, json, pathlib, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
PKG = "2026-10-27-artifact-silver-chains"
PREFIX = "BAS-SLV"
BASE_URL = "https://amuletta.artifactstudio.info/artifact/silver"
QTY = 20
PROTOCOL = {"necklace": "chain_necklace", "bracelet": "chain_bracelet"}
CHAIN_NAME = {"franco": "Franco", "cuban": "Cuban curb", "figaro": "Figaro"}
SCENE = {"S01": "slate", "S02": "indigo denim", "S03": "black marble", "S04": "olive canvas",
         "S05": "pale grey concrete", "S06": "espresso leather"}


def alts(lid, chain, piece):
    c = CHAIN_NAME[chain]
    n = f"{c} chain {piece}"
    worn = ("worn at the collarbone, clasp at the back" if piece == "necklace" else "worn on a man's wrist")
    return [f"Sterling silver {n} on {SCENE[lid]}",
            f"Sterling silver {n} {worn}",
            f"Close-up of the {c} links in sterling silver",
            f"Lobster clasp and tag plate stamped 925 on the {n}",
            f"Sterling silver {n} laid flat, seen from above"]


def q(s):
    assert "$sv$" not in s
    return "$sv$" + s + "$sv$"


L = json.load(open(HERE / "listings.json", encoding="utf-8"))
P = list(csv.DictReader(open(HERE / "prices.csv", encoding="utf-8")))
picks = json.load(open(HERE / "picks.json", encoding="utf-8"))
assert sorted(L) == sorted(picks) == [f"S0{i}" for i in range(1, 7)]
assert all(sorted(v) == ["01", "02", "03", "04", "05"] for v in picks.values())

blocks, seal_rows, seals = [], [], {}
for lid, l in L.items():
    chain, piece = l["chain"], l["piece"]
    axes = ["Width", "Length"]
    rows = []
    for r in (x for x in P if x["listing"] == lid):
        w = f"{float(r['width_mm']):g}"
        props = {"Width": f"{w} mm", "Length": f"{r['length_in']} in"}
        sku = f"{PREFIX}-{lid}-{w.replace('.', '_')}MM-{r['length_in']}IN"
        assert len(sku) <= 32, sku
        rows.append({"sku": sku, "props": props, "price_cents": int(r["list_usd"]) * 100,
                     "grams": round(float(r["grams_est"]), 2),
                     "name": f"{CHAIN_NAME[chain]} {piece}: {props['Width']}, {props['Length']}"})
    assert len(rows) == (30 if piece == "necklace" else 18), (lid, len(rows))
    assert len({r["sku"] for r in rows}) == len(rows)
    pid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"artifact-studio/silver-chains/{lid}"))
    psku = f"{PREFIX}-{lid}"
    lines = sorted(("|".join([r["sku"], r["props"]["Width"], r["props"]["Length"], str(r["price_cents"]), f"{r['grams']:.2f}"])
                    for r in rows), key=lambda s: s.encode())
    seal_rows += lines
    vseal = hashlib.md5("\n".join(lines).encode()).hexdigest()
    dmd5 = hashlib.md5(l["description"].encode()).hexdigest()
    tseal = hashlib.md5((psku + "|" + ",".join(l["tags"])).encode()).hexdigest()
    seals[lid] = {"sku": psku, "productId": pid, "variants": len(rows), "variantSeal": vseal, "descMd5": dmd5, "tagSeal": tseal}
    materials = ["925 sterling silver"] + (["rhodium plating"] if chain == "franco" else [])
    meta = {
        "productType": piece, "listingProtocol": PROTOCOL[piece], "protocolVersion": "etsy-listing-v1",
        "offersPersonalization": False, "modelId": lid, "name": f"{CHAIN_NAME[chain]} {piece}",
        "collection": "Sterling Silver Chains", "variationAxes": axes, "metal": "925 sterling silver",
        "processing": {"min": 1, "max": 2, "note": "made to order, ships within 2 business days (owner 2026-10-27)"},
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/silver-chains",
        "generatorScript": "docs/artifact-studio/silver-chains/gen_migration.py",
        "weightSource": "supplier_catalog", "missingHero": False,
        "pricing": {"model": "pricing.py: buyer price 50 + 6.0 USD/g (market fit 2026-10-27); list = that / 0.70, ends in 9",
                    "status": "ESTIMATE_MARKET", "panelPriceIs": "Etsy list price",
                    "floor": "pessimistic cost 4 USD/g + 12 + 0.45, fees 9.5% + worst Offsite: all positive"},
        "approval": {"blockers": [
            "Images are design visualizations (Higgsfield, picks.json); the owner adds one real unedited photo per listing in the Etsy editor before publishing.",
            "ESTIMATED PRICE: no supplier quote yet; pricing.py assumes 4 USD/g.",
        ], "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
            "authority": "Owner 2026-10-27: six silver chain listings (Franco, Cuban, Figaro x necklace, bracelet)."},
        "variantSeal": vseal,
    }
    vrows = ",\n".join(f"  ({q(r['sku'])}, {q(r['name'])}, {q(json.dumps(r['props']))}, {r['price_cents']}, {r['grams']:.2f})" for r in rows)
    block = f"""-- {lid} {l['title']}: {len(rows)} variants (Width x Length), seal {vseal}, md5(description) {dmd5}, tags {tseal}
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select {q(pid)}::uuid, '{ORG}', {q(psku)}, {q(l['title'])}, {q(l['description'])},
  ARRAY[{",".join(q(t) for t in l['tags'])}]::text[], ARRAY[{",".join(q(m) for m in materials)}]::text[], 'draft', 'USD',
  {min(r['price_cents'] for r in rows)}, {QTY}, true, {q(f"{BASE_URL}/{lid}/01.jpg")}, 5, '{piece}',
  {q(json.dumps(meta, ensure_ascii=False))}::jsonb
where not exists (select 1 from public.products p where p.org_id = '{ORG}'
  and (p.sku = {q(psku)} or p.id = {q(pid)}::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}', v.sku, p.id, v.name, v.props::jsonb, v.price, {QTY}, v.grams, 'supplier_catalog', true, 'USD'
from (values
{vrows}
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(psku)} and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();
"""
    imgs = ",\n".join(f"  ({i}, {q(f'{BASE_URL}/{lid}/{i + 1:02d}.jpg')}, {q(a)})" for i, a in enumerate(alts(lid, chain, piece)))
    block += f"""
insert into public.listing_images (org_id, product_id, url, source, alt, position)
select p.org_id, p.id, g.url, 'url', g.alt, g.pos
from (values
{imgs}
) g(pos, url, alt)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(psku)} and p.etsy_listing_id is null
where not exists (select 1 from public.listing_images li where li.product_id = p.id and li.url = g.url);
"""
    blocks.append(block)
    (HERE / "parts").mkdir(exist_ok=True)
    (HERE / "parts" / f"{lid}.sql").write_text("begin;\n" + block + "commit;\n", encoding="utf-8")

SET_SEAL = hashlib.md5("\n".join(sorted(seal_rows, key=lambda s: s.encode())).encode()).hexdigest()
sql = f"""-- 0172_artifact_silver_chains.sql
-- by Artifact Studio Jewelry: sterling silver chains, 6 listings, {len(seal_rows)} variants, 30 images (design visualizations).
-- Panel drafts only; this migration does not write to Etsy. Source: docs/artifact-studio/silver-chains/.
-- Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku) under a
-- product still unpublished (etsy_listing_id is null).
-- Set seal (run after apply): {len(seal_rows)} variants / {SET_SEAL}
--   (md5 of sku|Width|Length|price_cents|grams over all six products, order by line collate "C")
begin;

{chr(10).join(blocks)}
commit;
"""
out = ROOT / "supabase/migrations/0172_artifact_silver_chains.sql"
out.write_text(sql, encoding="utf-8")
json.dump({"setVariants": len(seal_rows), "setSeal": SET_SEAL, "items": seals}, open(HERE / "seal.json", "w"), indent=1)
assert not any(c in sql for c in "—–âÂ")
print(out.relative_to(ROOT), out.stat().st_size, len(seal_rows), SET_SEAL)
print({k: (v["variants"], len((HERE / "parts" / f"{k}.sql").read_text())) for k, v in seals.items()})
