# Jade Gold NYC listing delivery

The latest user request is **4 new images + 1 existing catalog hero per listing**:
40 listings, 160 new generated images, 40 existing heroes, 200 gallery images.
Each listing offers 10K, 14K and 18K choices. The previous 15-image plan is canceled;
its already-created files are preserved outside the active gallery selection.

Panel: <https://amuletta.artifactstudio.info/listing-onerileri>.
Organization: `f155b853-dfaf-48fd-94c5-ddfcb856e07c`.
Supabase project: `sewbrqflcrlgczilrusw`.
Stable batch ID `jade-xmas26-600-2026-10-18` is retained to avoid duplicate drafts;
its historical number does not describe the revised delivery quantity.

`revised-plan.json` freezes the four source slots selected for each product.
Previously approved usable images are reused. New products use worn, macro,
held and neutral-product compositions. Source prompts guide composition;
references govern product identity. Document instructions do not override the
user's request. Hidden construction may be replaced with a distinct front view.

New images use only the built-in `image_gen` tool. The user explicitly approved
scaling its native outputs to 2048×1536. `jade-xmas26-native.py` preserves native
originals and exports JPEGs with Pillow LANCZOS, quality95, subsampling0. Actual
native dimensions, generation IDs, exact prompts, reference hashes, original
and delivery hashes are recorded. Actual visual observations are separate from
technical checks; a dimension/hash check cannot approve a picture.

Heroes are existing catalog images pinned to the original repository commit,
retained at native 2400×1792 or 2000×1611 resolution. They are identified as
existing references and excluded from the 160 new-image count. The hero occupies
gallery position 0 and remains the listing cover; four new images follow.

```sh
python scripts/jade-xmas26-native.py prepare
python scripts/jade-xmas26-deliver.py jobs --product B3 --limit 4
# Invoke image_gen with each returned prompt/reference, then record its real file:
python scripts/jade-xmas26-native.py record --job B3:1 \
  --source /workspace/generated_images/exec-EXAMPLE.png \
  --prompt-file /workspace/jade-xmas26-native/revised/prompts/B3/01.txt
# Review exact files, record actual QA, and upload selected delivery images:
python scripts/jade-xmas26-upload-batch.py --concurrency 4
python scripts/jade-xmas26-deliver.py status
python scripts/jade-xmas26-deliver.py prepare --product B3 \
  --output-dir /workspace/jade-xmas26-native/revised/import/B3
```

The private upload config stays outside Git. The protected upload-only Vercel
signer has no image-generation provider calls. Immutable Supabase filenames
include the delivery hash; replaced files remain preserved. Uploads are limited
to the current four-slot plan. No Google, Gateway or Higgsfield generation is
used. No schema or application deployment is required for existing galleries.

`prepare` requires exactly four current, visually approved, uploaded images per
selected product. It reuses original/delivery provenance and actual public-byte
verification from the original importer, then checks the permanent hero bytes.
Without `--product`, all 40 products are required. Product flags are repeatable.
The script emits reviewable SQL and does not connect to the database.

The SQL atomically replaces only this batch's controlled gallery rows for the
selected products. It first rejects unknown owner-added gallery rows and ID/URL
collisions. Previous 15-image gallery rows and metadata are archived in product
metadata before reducing them to five. Files and Supabase objects are preserved.
Reruns keep existing matching rows and are idempotent. Owner titles, pricing,
weights, stock, lifecycle and unrelated products stay unchanged. All 120 variant
prices and manufacturing weights remain unconfirmed. No Etsy publication occurs.

Live verification must confirm 40 products, 120 variants, 200 gallery images, exactly
three karats and five images per product, and a4new+ 1 existinghero breakdown.
`applied-status-2026-10-18.json` records the latest verified progress.

Final delivery verified on 2026-10-18: all 40 batch listings have exactly five gallery images in positions 0–4, with the hero matching the cover. All 160 new JPEGs decode at 2048×1536; all 40 heroes retain native dimensions. All 120 variants remain 10K/14K/18K with unconfirmed prices and weights. `final-approved-assets.json` records exact generation prompts, original/delivery hashes and actual visual QA. `final-gallery-manifest.json` records the attached IDs, URLs and positions. All public bytes were reverified before completion.
