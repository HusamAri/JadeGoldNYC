# Importing the 40 listing suggestions

Target: **Jade Gold NYC**, organization `f155b853-dfaf-48fd-94c5-ddfcb856e07c`,
Supabase project `sewbrqflcrlgczilrusw`, panel
<https://amuletta.artifactstudio.info/listing-onerileri>.

This batch adds 40 proposals, three karat choices per proposal, and 15 newly
generated images per proposal. The existing catalog's 14K weights and supplier
price calculations remain reference specifications. They are not confirmed
10K/14K/18K manufacturing quotes: all 120 variant prices and weights stay null.
No Etsy IDs, publication or live product changes are included.

`scripts/jade-xmas26-import.py` does **not** connect to a database or apply its
output. It creates a reviewable import after all images pass verification.

```sh
python scripts/jade-xmas26-import.py plan \
  --output-dir /workspace/jade-xmas26-delivery/import

# Optional resumable phase 1, when image generation is not yet complete:
python scripts/jade-xmas26-import.py drafts \
  --output-dir /workspace/jade-xmas26-delivery/import

python scripts/jade-xmas26-import.py prepare \
  --assets /workspace/jade-xmas26-delivery/assets.json \
  --assets-dir /workspace/jade-xmas26-delivery/images \
  --output-dir /workspace/jade-xmas26-delivery/import
```

The default copy source is `docs/jade/xmas26/listing-copy-2026-10-18.json`.
Use `--copy` to select another reviewed copy file. `plan` emits its SHA-256 for
the asset manifest. `prepare` requires the identical copy SHA, checks every
original local image, and downloads every permanent public URL to compare the
actual SHA-256. It refuses incomplete batches, duplicate image bytes, images
below 2048 pixels on the long side or 1536 on the short side, missing visual QA,
and missing generation provenance. The script never resizes images.

Asset manifest shape (one of 600 entries shown):

```json
{
  "batch_id": "jade-xmas26-600-2026-10-18",
  "copy_sha256": "<SHA-256 from upload-plan.json>",
  "images": [{
    "product_code": "B1",
    "position": 1,
    "shot_code": "02",
    "file": "B1/01.png",
    "provider": "google_gemini",
    "model": "<actual model ID>",
    "generation_id": "<actual generation/request ID>",
    "width": 2304,
    "height": 1728,
    "sha256": "<SHA-256 of original generated file>",
    "public_url": "https://sewbrqflcrlgczilrusw.supabase.co/storage/v1/object/public/listing-images/f155b853-dfaf-48fd-94c5-ddfcb856e07c/jade-xmas26-600-2026-10-18/B1/01.png",
    "storage_path": "f155b853-dfaf-48fd-94c5-ddfcb856e07c/jade-xmas26-600-2026-10-18/B1/01.png",
    "qa_status": "passed",
    "qa_note": "<reviewer's actual product identity and image-quality findings>",
    "alt": "<specific description of this image>"
  }]
}
```

The worker aliases `assets`, `code`, `url` and `request_id` are accepted for
`images`, `product_code`, `public_url` and `generation_id`. `provider` and
`model` can be set once at the top level. QA fields must reflect an actual
visual review. Expected IDs are B1–B10, N1–N10, E1–E10 and P1–P10; positions
are 1–15 (the source shot prompts are 02–16).

Images may instead use permanent URLs on the panel under `/jade/xmas26/` or
immutable GitHub commit URLs for `public/jade/xmas26/`. In that case omit
`storage_path`; the gallery records use source `url`. Signed and expiring URLs
are rejected.

`drafts` is a separate phase that emits `pending-drafts.json` and
`import-drafts.sql`: 40 suggestions, 120 variants, zero new gallery images,
`num_images = 0`, and `listing_metadata.generation_status = "pending"`.
Each cover is an **existing catalog reference** pinned to source commit
`0ab1d3baf5fb08f17572a5b86715c785e3878cde`; its URL and hash are recorded as
`original_reference` and it is explicitly not counted as a new generated image.
The listing-suggestions table uses native `<img>` and the detail strip uses
unoptimized `next/image`, so these permanent raw GitHub URLs need no app change.

The output SQL inserts the products, 120 SKU variants and 600 gallery rows in
one transaction. Stable UUIDs and SKUs (`JGN-X26-B1`, `JGN-X26-B1-10K`, etc.)
make reruns idempotent. Existing unrelated SKU collisions abort the transaction.
The `prepare` phase can resume after `drafts`: it updates only the batch's cover,
image count, and image-related `listing_metadata` fields. Owner edits to copy,
prices, weights, stock and listing lifecycle remain untouched. Nothing is
deleted. A final verified-gallery count check must find 40 products, 120 variants
and 600 gallery images. Image metadata and generation provenance are stored in
each product's `listing_metadata`. Re-running `drafts` after gallery completion
does not downgrade or erase completed data.

After applying reviewed SQL through the authorized Supabase connection,
verify the batch counts, each product's 3 variants and 15 images, and open the
panel under the Jade Gold NYC organization. No new schema migration or app
deployment is needed for the existing listing gallery.
