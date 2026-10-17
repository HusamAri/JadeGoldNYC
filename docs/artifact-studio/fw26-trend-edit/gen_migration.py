"""listings/*.json -> supabase/migrations/0171_artifact_fw26_trend_edit.sql (+ seal.json, + parts/*.sql)

Panel drafts only (products.status='draft', etsy_listing_id null); nothing is written to Etsy.
Ten products, one per listing, with the full variant grid each listing declares. Panel price = the
Etsy list price (base x 1.265): the shop's live Etsy prices sit at panel x 1.265 on the reference
listing 4590337023 (price-sync detail, read 2026-10-17), so the new rows store the number Etsy shows.
No images: the brief allows real sample photos only and none exist yet.
Run after build_listings.py: python3 gen_migration.py
"""
import hashlib, itertools, json, pathlib, sys, uuid

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(HERE.parent))
from maker_cost import DENSITY  # noqa: E402  10K x 0.892, 18K x 1.137 (shop maker model)

ORG = "2c254edf-2119-4079-b09e-dc672e32c1f9"
PKG = "2026-10-17-artifact-fw26-trend-edit"
PREFIX = "BAS-FW26"
SEP = ",\n"

CODES = {
    "Karat": lambda v: v,
    "Metal Color": lambda v: {"Yellow Gold": "Y", "White Gold": "W", "Rose Gold": "R",
                              "Yellow/White Gold": "YW", "Rose/White Gold": "RW"}[v],
    "Chain": lambda v: "N" if v == "None" else v.split()[0],
    "Chain Length": lambda v: v.split()[0],
    "Ring Size": lambda v: v.split()[1].replace(".", "_"),
    "Palette": lambda v: {"Ur": "UR", "Festival": "FE"}[v],
    "Sign": lambda v: v.split()[0],
    "Paw Finish": lambda v: {"Plain gold": "PG", "Cobalt enamel": "CO", "Cranberry enamel": "CR", "Black enamel": "BK"}[v],
    "Set": lambda v: v.split()[0] + "P",
    "Length": lambda v: v.split()[0].replace(".", "_"),
}


def q(s):
    assert "$fw$" not in s
    return "$fw$" + s + "$fw$"


def grid(l):
    axes = [v["property"] for v in l["variations"]]
    vp = l.get("variant_prices")
    price_axis = None
    if vp:
        keys = set(next(iter(vp.values())))
        price_axis = next(a["property"] for a in l["variations"] if set(a["values"]) == keys)
    rows = []
    for combo in itertools.product(*[v["values"] for v in l["variations"]]):
        props = dict(zip(axes, combo))
        k = props["Karat"]
        pr = vp[k][props[price_axis]] if price_axis else l["prices"][k]
        g14 = l["set_options"][props["Set"]]["grams14"] if l.get("set_options") else l["pricing_basis"]["grams14"]
        sku = "-".join([PREFIX, l["id"]] + [CODES[a](props[a]) for a in axes])
        assert len(sku) <= 32, sku
        rows.append({"sku": sku, "props": props, "price_cents": int(round(pr["list"] * 100)),
                     "grams": round(g14 * DENSITY[k], 2),
                     "name": f"{l['name']}: " + ", ".join(combo)})
    assert len({r["sku"] for r in rows}) == len(rows), l["id"]
    assert len(rows) <= 400, (l["id"], len(rows))  # Etsy cap for three variation properties
    return axes, rows


L = [json.load(open(p, encoding="utf-8")) for p in sorted((HERE / "listings").glob("L*.json"))]
assert len(L) == 10
state = json.load(open(HERE / "state.json", encoding="utf-8"))
assert all(v["status"] == "approved" for v in state["listings"].values()), "every listing must be approved before the panel load"

blocks, seal_rows, seals = [], [], {}
for l in L:
    axes, rows = grid(l)
    pid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"artifact-studio/fw26-trend-edit/{l['id']}"))
    psku = f"{PREFIX}-{l['id']}"
    lines = sorted(("|".join([r["sku"]] + [r["props"][a] for a in axes] + [str(r["price_cents"]), f"{r['grams']:.2f}"]) for r in rows),
                   key=lambda s: s.encode())
    seal_rows += lines
    vseal = hashlib.md5("\n".join(lines).encode()).hexdigest()
    dmd5 = hashlib.md5(l["description"].encode()).hexdigest()
    tseal = hashlib.md5((psku + "|" + ",".join(l["tags"])).encode()).hexdigest()
    seals[l["id"]] = {"sku": psku, "productId": pid, "variants": len(rows), "variantSeal": vseal, "descMd5": dmd5, "tagSeal": tseal}
    p = l["personalization"]
    meta = {
        "productType": "earring" if l["product_type"] == "earrings" else l["product_type"],
        "listingProtocol": l["listing_protocol"], "protocolVersion": "etsy-listing-v1",
        "offersPersonalization": bool(p["enabled"]), "modelId": l["id"], "name": l["name"], "collection": "FW26 Trend Edit",
        "variationAxes": axes, "category": l["category"], "section": l["section"], "attributes": l["attributes"],
        "processing": l["processing_days"], "trend": l["trend"],
        "sourcePackage": PKG, "sourcePackagePath": "docs/artifact-studio/fw26-trend-edit",
        "generatorScript": "docs/artifact-studio/fw26-trend-edit/gen_migration.py",
        "weightSource": "geometry_estimate", "missingHero": True,
        "pricing": {"model": "BRIEF.md section 4: 14K base = 320 per piece + 100 per gram + adders; 10K = 14K / 1.349; 18K = 14K x 1.31; list = base x 1.265; the 30% shop sale shows list x 0.70",
                    "basis": l["pricing_basis"], "set_options": l.get("set_options"), "status": "ESTIMATE_BRIEF_FW26",
                    "panelPriceIs": "Etsy list price (base x 1.265)"},
        "approval": {"blockers": [
            "NO PHOTOS: the brief allows real photographs of real samples only; no sample exists yet (photography/photo-plan.md).",
            "ESTIMATED PRICE: grams are design estimates; Efe's cast weights override them (production/manufacturing-brief-efe.md).",
        ], "etsyDraftCreationAuthorized": True, "livePublicationAuthorized": False,
            "authority": "Owner brief 2026-10-17 (FW26 Trend Edit, 10 listings); every listing approved 2026-10-17."},
        "variantSeal": vseal,
    }
    if p["enabled"]:
        meta["personalizationQuestions"] = [{"question_type": "text_input", "question_text": p["question_text"],
                                             "instructions": p["instructions"], "required": bool(p["required"]),
                                             "max_allowed_characters": p["max_chars"]}]
    vrows = SEP.join(f"  ({q(r['sku'])}, {q(r['name'])}, {q(json.dumps(r['props']))}, {r['price_cents']}, {r['grams']:.2f})" for r in rows)
    block = f"""-- {l['id']} {l['name']}: {len(rows)} variants ({' x '.join(axes)}), seal {vseal}, md5(description) {dmd5}, tags {tseal}
insert into public.products (
  id, org_id, sku, title, description, tags, materials, status, currency,
  price_cents, quantity, has_variations, image_url, num_images, product_type, listing_metadata
)
select {q(pid)}::uuid, '{ORG}', {q(psku)}, {q(l['title'])}, {q(l['description'])},
  ARRAY[{",".join(q(t) for t in l['tags'])}]::text[], ARRAY[{",".join(q(m) for m in l['materials'])}]::text[], 'draft', 'USD',
  {min(r['price_cents'] for r in rows)}, {l['quantity']}, true, null, 0, '{l['product_type']}',
  {q(json.dumps(meta, ensure_ascii=False))}::jsonb
where not exists (select 1 from public.products p where p.org_id = '{ORG}'
  and (p.sku = {q(psku)} or p.id = {q(pid)}::uuid));

insert into public.product_variants (
  org_id, sku, product_id, name, properties, price_cents, quantity, weight_grams, weight_source, active, currency
)
select '{ORG}', v.sku, p.id, v.name, v.props::jsonb, v.price, {l['quantity']}, v.grams, 'geometry_estimate', true, 'USD'
from (values
{vrows}
) v(sku, name, props, price, grams)
join public.products p on p.org_id = '{ORG}' and p.sku = {q(psku)} and p.etsy_listing_id is null
on conflict (org_id, sku) do update set
  product_id = excluded.product_id, name = excluded.name, properties = excluded.properties,
  price_cents = excluded.price_cents, quantity = excluded.quantity, weight_grams = excluded.weight_grams,
  weight_source = excluded.weight_source, active = excluded.active, updated_at = now();
"""
    blocks.append(block)
    (HERE / "parts").mkdir(exist_ok=True)
    (HERE / "parts" / f"{l['id']}.sql").write_text("begin;\n" + block + "commit;\n", encoding="utf-8")

SET_SEAL = hashlib.md5("\n".join(sorted(seal_rows, key=lambda s: s.encode())).encode()).hexdigest()
sql = f"""-- 0171_artifact_fw26_trend_edit.sql
-- by Artifact Studio Jewelry: FW26 Trend Edit, 10 listings, {len(seal_rows)} variants, no images yet. Panel drafts only;
-- this migration does not write to Etsy. Source: docs/artifact-studio/fw26-trend-edit/ (build_listings.py).
-- Generator: gen_migration.py. DO NOT EDIT BY HAND.
-- Idempotent: product inserts only when neither sku nor id exists; variants upsert on (org_id, sku) under a
-- product still unpublished (etsy_listing_id is null).
-- Set seal (run after apply): {len(seal_rows)} variants / {SET_SEAL}
--   (md5 of sku|axis values|price_cents|grams over all ten products, order by line collate "C")
begin;

{chr(10).join(blocks)}
commit;
"""
out = ROOT / "supabase/migrations/0171_artifact_fw26_trend_edit.sql"
out.write_text(sql, encoding="utf-8")
json.dump({"setVariants": len(seal_rows), "setSeal": SET_SEAL, "items": seals}, open(HERE / "seal.json", "w"), indent=1)
for t in [sql] + [b for b in blocks]:
    assert not any(c in t for c in "—–âÂ")
print(out.relative_to(ROOT), out.stat().st_size, len(seal_rows), SET_SEAL)
print({k: (v["variants"], len((HERE / "parts" / f"{k}.sql").read_text())) for k, v in seals.items()})
