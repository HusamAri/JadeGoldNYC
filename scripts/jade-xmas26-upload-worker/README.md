# JADE Christmas 2026 storage upload

This isolated, protected Vercel preview signs uploads into the existing Supabase
`listing-images` bucket. It does not call an image generation provider, edit images,
or change catalog/gallery database rows.

Only 40 fixed codes (`B1`–`B10`, `N1`–`N10`, `E1`–`E10`, `P1`–`P10`) and positions
1–15 are accepted, with PNG/JPEG extensions. Every signed upload is restricted to
`f155b853-dfaf-48fd-94c5-ddfcb856e07c/jade-xmas26-600-2026-10-18/{code}/{position}-{sha256}.{extension}`.
The upload uses `upsert=false`, so existing objects cannot be replaced. A QA
regeneration uses its delivery SHA256 in a new immutable filename; the previous
object remains available for audit. The uploader archives previous manifest
metadata in `superseded_images` and records the new current image as QA pending.

Authentication uses a dedicated preview-only `JADE_XMAS26_UPLOAD_TOKEN`, separate
from the cancelled generation worker. The service-role credential remains inside
Vercel. The client receives a two-hour token for one exact storage object. The
worker also requires Vercel deployment protection and expires on 2026-10-21 UTC.

Run the uploader with a native original and the user-authorized 2048×1536 delivery:

```sh
python scripts/jade-xmas26-upload.py \
  --code B1 --position 1 \
  --original /absolute/path/native.png \
  --file /absolute/path/delivery.png \
  --generation-id image_gen_request_id \
  --user-authorized-upscale
```

The private connection file is `/tmp/jade-xmas26-upload-client.json` (mode0600,
outside Git). The uploader checks decoded dimensions and SHA256, downloads the
public object, and verifies byte equality before appending to
`/workspace/jade-xmas26-output/verified-assets.json`. Concurrent processes share an
atomic manifest lock. Metadata preserves native/delivery dimensions and hashes,
provider `openai_imagegen`, and the explicit scaling authorization. Visual QA
remains pending until a reviewer inspects the actual image.

After uploads finish, revoke the temporary deployment share link, remove the
preview deployment and preview-only token where deletion is available, and delete
the exact private client file. Preserve original production deployments/domains and
existing provider/Supabase credentials. Never print private config or signed URLs.
