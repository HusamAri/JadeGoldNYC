#!/usr/bin/env python3
"""Prepare a verified, non-destructive import; never connect to or mutate a database.

plan: emit the 40 product / 120 variant IDs and 600 expected asset paths.
drafts: emit a separate, resumable 40-draft / 120-variant import with no new gallery.
prepare: verify all original image files, QA records and public bytes, then emit
         an atomic, idempotent SQL import and its reviewable JSON manifest.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import sys
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from PIL import Image

ORG_ID = "f155b853-dfaf-48fd-94c5-ddfcb856e07c"
PROJECT = "sewbrqflcrlgczilrusw"
BATCH = "jade-xmas26-600-2026-10-18"
BUCKET = "listing-images"
SUPABASE_PUBLIC = f"https://{PROJECT}.supabase.co/storage/v1/object/public/{BUCKET}/"
IDS = tuple(f"{category}{i}" for category in "BNEP" for i in range(1, 11))
KARATS = ("10K", "14K", "18K")
PROVIDERS = {"openai_imagegen"}
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_COPY = ROOT / "docs/jade/xmas26/listing-copy-2026-10-18.json"
SOURCE_COMMIT = "0ab1d3baf5fb08f17572a5b86715c785e3878cde"
SOURCE_REFERENCES = ROOT / "docs/jade/xmas26/images/heroes"


class InvalidBatch(ValueError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise InvalidBatch(message)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stable_id(kind: str, key: str) -> str:
    return str(uuid.uuid5(uuid.UUID(ORG_ID), f"{BATCH}/{kind}/{key}"))


def selected_products(products=None) -> tuple[str, ...]:
    require(products is None or bool(products) and not (set(products) - set(IDS)), "Invalid product selection")
    return tuple(code for code in IDS if products is None or code in products)


def read_copy(path: Path) -> tuple[dict, bytes]:
    raw = path.read_bytes()
    data = json.loads(raw)
    require(isinstance(data, dict), "Copy must be a JSON object")
    products = data.get("products", [])
    require(isinstance(products, list) and all(isinstance(p, dict) for p in products), "Copy products must be objects")
    require(len(products) == 40, "Copy must contain exactly 40 products")
    require({p.get("id") for p in products} == set(IDS), "Copy product IDs must be B1–B10, N1–N10, E1–E10, P1–P10")
    for p in products:
        code = p["id"]
        require(isinstance(p.get("title"), str) and 1 <= len(p["title"]) <= 140, f"{code}: invalid title")
        require(bool(p.get("description")), f"{code}: description is missing")
        require(len(p.get("tags", [])) == 13 and len(set(p["tags"])) == 13, f"{code}: expected 13 unique tags")
        require(all(isinstance(t, str) and 0 < len(t) <= 20 for t in p["tags"]), f"{code}: invalid Etsy tag")
        require(bool(p.get("materials")), f"{code}: materials missing")
        variants = p.get("variants", [])
        require(len(variants) == 3 and {v.get("karat") for v in variants} == set(KARATS), f"{code}: expected 10K, 14K, 18K")
        for variant in variants:
            require(variant.get("price_cents") is None and variant.get("weight_grams") is None,
                    f"{code}: prices and weights must remain unconfirmed (null)")
    return data, raw


def make_plan(copy: dict, copy_sha: str) -> dict:
    return {
        "batch_id": BATCH,
        "organization_id": ORG_ID,
        "supabase_project": PROJECT,
        "copy_sha256": copy_sha,
        "products": [{
            "code": code,
            "id": stable_id("product", code),
            "sku": f"JGN-X26-{code}",
            "variant_ids": {karat: stable_id("variant", f"{code}/{karat}") for karat in KARATS},
        } for code in IDS],
        "images": [{
            "product_code": code,
            "position": position,
            "id": stable_id("image", f"{code}/{position}"),
            "storage_path_template": f"{ORG_ID}/{BATCH}/{code}/{position:02d}-<sha256>.<extension>",
        } for code in IDS for position in range(1, 16)],
        "requirements": {
            "minimum_long_edge": 2048,
            "minimum_short_edge": 1536,
            "generated_files": 600,
            "approved_qa_required": True,
            "global_unique_sha256_required": True,
            "remote_sha256_verification_required": True,
            "providers": sorted(PROVIDERS),
            "prices_and_weights": "unconfirmed; remain null",
        },
    }


def check_public_url(url: str, storage_path: str | None) -> None:
    parsed = urllib.parse.urlsplit(url)
    require(parsed.scheme == "https" and not parsed.username and not parsed.password,
            "Asset URL must be plain HTTPS without credentials")
    require(not parsed.query and not parsed.fragment, "Asset URL must be permanent, without query or fragment")
    if storage_path:
        require(storage_path.startswith(f"{ORG_ID}/{BATCH}/") and ".." not in Path(storage_path).parts,
                "Storage path is outside the import batch")
        require(url == SUPABASE_PUBLIC + storage_path, "Storage path and public URL disagree")
    else:
        allowed = (
            parsed.hostname in {"amuletta.artifactstudio.info", "www.amuletta.artifactstudio.info"}
            and parsed.path.startswith("/jade/xmas26/")
        ) or (
            parsed.hostname == "raw.githubusercontent.com"
            and re.fullmatch(r"/HusamAri/JadeGoldNYC/[0-9a-f]{40}/public/jade/xmas26/.+", parsed.path)
        )
        require(allowed, "Remote image must be on the panel or an immutable commit in its repository")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise InvalidBatch("Public image URL redirected; use its permanent URL")


def verify_remote(asset: dict) -> None:
    opener = urllib.request.build_opener(NoRedirect)
    with opener.open(asset["public_url"], timeout=45) as response:
        require(response.headers.get_content_type().startswith("image/"), f"{asset['product_code']}: remote response is not an image")
        raw = response.read(15_000_001)
    require(len(raw) <= 15_000_000, "Remote image exceeds 15 MB")
    require(digest(raw) == asset["sha256"], f"{asset['product_code']}/{asset['position']}: public bytes differ from verified file")


def verify_assets(path: Path, assets_dir: Path, copy_sha: str, products=None, expected_slots=None) -> list[dict]:
    selected = selected_products(products)
    expected_keys = {(code, pos) for code in selected for pos in
                     (expected_slots[code] if expected_slots is not None else range(1, 16))}
    manifest = json.loads(path.read_text())
    require(isinstance(manifest, dict), "Asset manifest must be a JSON object")
    require(manifest.get("batch_id") == BATCH, "Asset manifest batch_id does not match")
    require(manifest.get("copy_sha256") == copy_sha, "Asset manifest was prepared for different listing copy")
    require(manifest.get("selected_products") is None or set(manifest["selected_products"]) == set(selected),
            "Asset manifest selection differs from requested products")
    images = manifest.get("images", manifest.get("assets", []))
    require(isinstance(images, list) and all(isinstance(a, dict) for a in images), "Asset entries must be objects")
    # The generation worker uses short aliases; keep its original report usable.
    images = [{**a,
               "product_code": a.get("product_code", a.get("code")),
               "public_url": a.get("public_url", a.get("url")),
               "generation_id": a.get("generation_id", a.get("request_id")),
               "provider": a.get("provider", manifest.get("provider")),
               "model": a.get("model", manifest.get("model"))} for a in images]
    require(len(images) == len(expected_keys), f"Expected {len(expected_keys)} generated assets; got {len(images)}")
    keys = {(a.get("product_code"), a.get("position")) for a in images}
    require(keys == expected_keys, "Asset slots differ from the expected product selection")
    seen = set()
    reference_hashes = {digest((SOURCE_REFERENCES / f"{code}.jpg").read_bytes()) for code in IDS}
    root = assets_dir.resolve()
    for a in images:
        label = f"{a['product_code']}/{a['position']}"
        require(type(a["position"]) is int, f"{label}: position must be an integer")
        require(all(isinstance(a.get(field), str) and bool(a[field]) for field in ("file", "public_url", "sha256")),
                f"{label}: file, public_url and sha256 must be non-empty strings")
        require(a.get("provider") in PROVIDERS, f"{label}: unsupported or missing image provider")
        require(bool(a.get("model")) and bool(a.get("generation_id")), f"{label}: generation provenance is missing")
        require(a.get("qa_status") == "passed" and bool(a.get("qa_note")), f"{label}: visual QA is incomplete")
        require(bool(a.get("alt")) and len(a["alt"]) <= 500, f"{label}: alt text must be 1–500 characters")
        file = (root / a["file"]).resolve()
        require(file.is_relative_to(root) and file.is_file(), f"{label}: missing or out-of-directory file")
        raw = file.read_bytes()
        require(0 < len(raw) <= 15_000_000, f"{label}: image exceeds 15 MB")
        actual_sha = digest(raw)
        require(actual_sha == a.get("sha256"), f"{label}: sha256 mismatch")
        require(actual_sha not in reference_hashes, f"{label}: existing reference cannot count as a newly generated image")
        require(actual_sha not in seen, f"{label}: duplicate image bytes")
        seen.add(actual_sha)
        with Image.open(file) as image:
            image.verify()
        with Image.open(file) as image:
            width, height = image.size
            require(image.format in {"JPEG", "PNG", "WEBP"}, f"{label}: unsupported image format")
        require(max(width, height) >= 2048 and min(width, height) >= 1536, f"{label}: image is below 2K ({width}×{height})")
        require((width, height) == (a.get("width"), a.get("height")), f"{label}: reported dimensions disagree")
        require((width, height) == (2048, 1536), f"{label}: authorized delivery must be 2048×1536")
        require(isinstance(a.get("original_file"), str) and bool(a["original_file"]),
                f"{label}: preserved original path is missing")
        original = (root / a["original_file"]).resolve()
        require(original.is_relative_to(root) and original.is_file(), f"{label}: preserved original is missing")
        require(digest(original.read_bytes()) == a.get("original_sha256"), f"{label}: original hash mismatch")
        with Image.open(original) as native:
            native_width, native_height = native.size
            require(native.size == (a.get("native_width"), a.get("native_height")),
                    f"{label}: original dimensions disagree")
            native.verify()
        require(abs(native_width / native_height - 4 / 3) <= 0.02,
                f"{label}: original aspect ratio would require distortion or cropping")
        actual_upscale = native_width < width or native_height < height
        require(type(a.get("upscaled")) is bool and a["upscaled"] == actual_upscale,
                f"{label}: upscaled flag disagrees with actual dimensions")
        if actual_upscale:
            require(bool(a.get("resize_authorization")) and bool(a.get("resize_method")),
                    f"{label}: user-authorized resize provenance is missing")
        check_public_url(a["public_url"], a.get("storage_path"))
    # No database-ready artifact is produced until actual public bytes pass too.
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for _ in pool.map(verify_remote, images):
            pass
    return sorted(images, key=lambda a: (IDS.index(a["product_code"]), a["position"]))


def make_payload(copy: dict, copy_sha: str, images: list[dict], *, pending: bool = False, products=None) -> dict:
    selected = selected_products(products)
    by_code = {code: [a for a in images if a["product_code"] == code] for code in selected}
    products, variants, gallery = [], [], []
    for p in sorted(copy["products"], key=lambda p: IDS.index(p["id"])):
        code = p["id"]
        if code not in selected:
            continue
        pid = stable_id("product", code)
        reference_url = f"https://raw.githubusercontent.com/HusamAri/JadeGoldNYC/{SOURCE_COMMIT}/docs/jade/xmas26/images/heroes/{code}.jpg"
        products.append({
            "id": pid, "org_id": ORG_ID, "sku": f"JGN-X26-{code}",
            "title": p["title"], "description": p["description"],
            "tags": p["tags"], "materials": p["materials"],
            "status": "draft", "currency": "USD", "price_cents": None,
            "weight_grams": None, "has_variations": True, "num_images": 0 if pending else 15,
            "image_url": reference_url if pending else next(a["public_url"] for a in by_code[code] if a["position"] == 15),
            "listing_metadata": {
                "import_batch": BATCH, "product_code": code,
                "collection": copy["collection"], "category": p["category"],
                "copy_sha256": copy_sha, "requested_karats": list(KARATS),
                "manufacturing_status": "unconfirmed_design_proposal",
                "generation_status": "pending" if pending else "complete",
                "expected_image_count": 15,
                "verified_image_count": 0 if pending else 15,
                "cover_gallery_position": None if pending else 15,
                "original_reference": {
                    "url": reference_url,
                    "sha256": digest((SOURCE_REFERENCES / f"{code}.jpg").read_bytes()),
                    "source_commit": SOURCE_COMMIT,
                    "kind": "existing_catalog_reference",
                    "counted_as_new_generated_image": False,
                },
                "source_specifications": p.get("source_specifications", {}),
                "notes": p.get("notes", []),
                "images": [{k: a.get(k) for k in (
                    "position", "sha256", "width", "height", "provider", "model",
                    "generation_id", "qa_status", "qa_note", "native_width", "native_height",
                    "original_sha256", "upscaled", "resize_method", "resize_authorization",
                )} for a in by_code[code]],
            },
        })
        for karat in KARATS:
            variants.append({
                "id": stable_id("variant", f"{code}/{karat}"), "org_id": ORG_ID,
                "product_id": pid, "sku": f"JGN-X26-{code}-{karat}",
                "name": f"{karat} Yellow Gold", "properties": {"Gold Karat": karat, "Gold Color": "Yellow Gold"},
                "price_cents": None, "weight_grams": None, "weight_source": None,
                "quantity": None, "currency": "USD", "active": True,
            })
        for a in by_code[code]:
            gallery.append({
                "id": stable_id("image", f"{code}/{a['position']}"), "org_id": ORG_ID,
                "product_id": pid, "url": a["public_url"], "storage_path": a.get("storage_path"),
                "source": "upload" if a.get("storage_path") else "url",
                "alt": a["alt"], "position": a["position"] - 1,
            })
    return {"batch_id": BATCH, "phase": "drafts_pending_images" if pending else "verified_gallery", "selected_products": list(selected), "products": products, "variants": variants, "images": gallery}


def make_sql(payload: dict) -> str:
    selected = selected_products(payload.get("selected_products"))
    pending = payload.get("phase") == "drafts_pending_images"
    expected_products = len(selected)
    expected_variants = 3 * expected_products
    expected_images = 0 if pending else 15 * expected_products
    require(len(payload["products"]) == expected_products and len(payload["variants"]) == expected_variants and len(payload["images"]) == expected_images,
            "Payload counts differ from selected product scope")
    require({p["id"] for p in payload["products"]} == {stable_id("product", code) for code in selected},
            "Payload product IDs differ from selected product scope")
    scope = "" if expected_products == 40 else " and p.id in (" + ",".join(f"'{stable_id('product', code)}'::uuid" for code in selected) + ")"
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    delimiter = "$jade_payload_" + digest(encoded.encode())[:16] + "$"
    image_update = "" if pending else f"""
  -- Phase 2 updates only image-related fields; preserve owner copy, prices and lifecycle.
  update public.products p set
    image_url=r.image_url,
    num_images=15,
    listing_metadata=p.listing_metadata || jsonb_build_object(
      'images',r.listing_metadata->'images',
      'generation_status','complete',
      'expected_image_count',15,
      'verified_image_count',15,
      'cover_gallery_position',r.listing_metadata->'cover_gallery_position',
      'last_image_import_copy_sha256',r.listing_metadata->>'copy_sha256')
  from jade_import_payload b,
    jsonb_populate_recordset(null::public.products,b.data->'products') r
  where p.id=r.id and p.org_id='{ORG_ID}'
    and p.listing_metadata->>'import_batch'='{BATCH}';
"""
    image_count_check = "" if pending else f"""
  select count(*) into expected_count from public.listing_images i join public.products p on p.id=i.product_id
    where p.org_id='{ORG_ID}' and p.listing_metadata->>'import_batch'='{BATCH}'{scope};
  if expected_count<>{expected_images} then raise exception 'Expected {expected_images} scoped batch images, found %',expected_count; end if;
"""
    return f"""-- Reviewed data import, not a schema migration. No Etsy publication.
-- Phase: {payload.get('phase')}; {expected_products} selected products, {expected_variants} variants, {expected_images} verified images.
-- Selected product codes: {', '.join(selected)}. Default full batch still requires40products/120variants/600images.
-- Preserve owner copy/prices; only the verified gallery phase updates image fields.
-- Any unrelated collision aborts. No existing records are deleted.
begin;
set local lock_timeout = '10s';
select pg_advisory_xact_lock(hashtext('{BATCH}'));
create temporary table jade_import_payload (data jsonb) on commit drop;
insert into jade_import_payload values ({delimiter}{encoded}{delimiter}::jsonb);
do $jade_import$
declare item jsonb; existing public.products%rowtype; expected_count integer;
begin
  if not exists (select 1 from public.organizations where id = '{ORG_ID}' and name = 'Jade Gold NYC') then
    raise exception 'Jade Gold NYC organization does not match the reviewed target';
  end if;
  for item in select jsonb_array_elements(data->'products') from jade_import_payload loop
    select count(*) into expected_count from public.products
      where org_id = '{ORG_ID}' and (sku = item->>'sku' or id = (item->>'id')::uuid);
    if expected_count>1 then
      raise exception 'Multiple product collisions for %; no changes applied', item->>'sku';
    end if;
    select * into existing from public.products
      where org_id = '{ORG_ID}' and (sku = item->>'sku' or id = (item->>'id')::uuid);
    if found then
      if existing.id <> (item->>'id')::uuid or existing.sku is distinct from item->>'sku'
        or existing.listing_metadata->>'import_batch' is distinct from '{BATCH}' then
        raise exception 'Unrelated product collision for %; no changes applied', item->>'sku';
      end if;
    else
      insert into public.products (id,org_id,sku,title,description,tags,materials,status,currency,
        price_cents,weight_grams,has_variations,num_images,image_url,listing_metadata)
      select r.id,r.org_id,r.sku,r.title,r.description,r.tags,r.materials,r.status,r.currency,
        r.price_cents,r.weight_grams,r.has_variations,r.num_images,r.image_url,r.listing_metadata
      from jsonb_populate_record(null::public.products,item) r;
    end if;
  end loop;
  if exists (
    select 1 from jade_import_payload b, jsonb_array_elements(b.data->'variants') incoming(data)
    join public.product_variants v on v.org_id = '{ORG_ID}' and (v.sku=incoming.data->>'sku' or v.id=(incoming.data->>'id')::uuid)
    where v.id<>(incoming.data->>'id')::uuid or v.product_id<>(incoming.data->>'product_id')::uuid or v.sku is distinct from incoming.data->>'sku'
  ) then raise exception 'Unrelated variant collision; no changes applied'; end if;
  insert into public.product_variants (id,org_id,product_id,sku,name,properties,price_cents,weight_grams,
    weight_source,quantity,currency,active)
  select r.id,r.org_id,r.product_id,r.sku,r.name,r.properties,r.price_cents,r.weight_grams,
    r.weight_source,r.quantity,r.currency,r.active
  from jade_import_payload b, jsonb_populate_recordset(null::public.product_variants,b.data->'variants') r
  on conflict (id) do nothing;
  if exists (
    select 1 from jade_import_payload b, jsonb_array_elements(b.data->'images') incoming(data)
    join public.listing_images i on i.id=(incoming.data->>'id')::uuid
    where i.org_id<>'{ORG_ID}' or i.product_id<>(incoming.data->>'product_id')::uuid or i.url<>incoming.data->>'url'
  ) then raise exception 'Image collision or changed image; no changes applied'; end if;
  insert into public.listing_images (id,org_id,product_id,url,storage_path,source,alt,position)
  select r.id,r.org_id,r.product_id,r.url,r.storage_path,r.source,r.alt,r.position
  from jade_import_payload b, jsonb_populate_recordset(null::public.listing_images,b.data->'images') r
  on conflict (id) do nothing;
{image_update}
  select count(*) into expected_count from public.products p where p.org_id='{ORG_ID}'
    and p.listing_metadata->>'import_batch'='{BATCH}'{scope};
  if expected_count<>{expected_products} then raise exception 'Expected {expected_products} scoped batch products, found %',expected_count; end if;
  select count(*) into expected_count from public.product_variants v join public.products p on p.id=v.product_id
    where p.org_id='{ORG_ID}' and p.listing_metadata->>'import_batch'='{BATCH}'{scope};
  if expected_count<>{expected_variants} then raise exception 'Expected {expected_variants} scoped batch variants, found %',expected_count; end if;
{image_count_check}
end $jade_import$;
commit;
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("plan", "drafts", "prepare"))
    parser.add_argument("--copy", type=Path, default=DEFAULT_COPY)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--assets", type=Path)
    parser.add_argument("--assets-dir", type=Path)
    parser.add_argument("--product", choices=IDS, action="append", help="Prepare exactly15approved images per selected product; repeatable. Default: all600.")
    args = parser.parse_args()
    if args.command == 'prepare' and (ROOT / 'docs/jade/xmas26/import/revised-plan.json').exists():
        raise InvalidBatch('The15-image workflow was canceled. Use jade-xmas26-deliver.py for4new images+1hero.')
    require(not args.product or args.command == "prepare", "--product is only supported for prepare")
    copy, raw = read_copy(args.copy)
    copy_sha = digest(raw)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    if args.command == "plan":
        output = args.output_dir / "upload-plan.json"
        output.write_text(json.dumps(make_plan(copy, copy_sha), ensure_ascii=False, indent=2) + "\n")
        print(f"Prepared plan: 40 products, 120 variants, 600 expected assets → {output}")
        return
    if args.command == "drafts":
        payload = make_payload(copy, copy_sha, [], pending=True)
        (args.output_dir / "pending-drafts.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        (args.output_dir / "import-drafts.sql").write_text(make_sql(payload))
        print(f"Prepared 40 pending draft suggestions, 120 variants and 0 new gallery images → {args.output_dir}. No database changes made.")
        return
    require(args.assets is not None and args.assets_dir is not None, "prepare needs --assets and --assets-dir")
    images = verify_assets(args.assets, args.assets_dir, copy_sha, args.product)
    payload = make_payload(copy, copy_sha, images, products=args.product)
    (args.output_dir / "verified-import.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    (args.output_dir / "import.sql").write_text(make_sql(payload))
    print(f"Verified {len(images)} local and public images for {len(payload['products'])} products; wrote reviewable import to {args.output_dir}. No database changes made.")


if __name__ == "__main__":
    try:
        main()
    except (InvalidBatch, OSError, ValueError) as error:
        print(f"Import preparation refused: {error}", file=sys.stderr)
        sys.exit(1)
