# Jade Xmas26 fixed image worker

Temporary standalone Vercel function for the authorized 40-listing × 15-image
batch. Deploy these files as a **preview** of the existing Jade project, with
`target` omitted in the Vercel deployment API. `target: "staging"` assigns the
default project alias and must not be used. Do not change production domains or
project settings.

The worker accepts only the fixed B1–B10, N1–N10, E1–E10, P1–P10 catalog and
positions 1–15, mapped to source prompts 02–16. Sources are pinned to Git commit
`0ab1d3baf5fb08f17572a5b86715c785e3878cde`. The 600-entry QA override manifest is
bundled as gzip and checked against its SHA-256, then every source and corrected
prompt is checked before generation. No arbitrary prompt, URL, model or storage
destination can be submitted.

Authentication requires `JADE_XMAS26_WORKER_TOKEN` (preview-only, random, minimum
48 characters) in addition to Vercel Deployment Protection. The function is
inactive outside preview and expires on 2026-10-21 at 00:00 UTC. It uses the
existing server-side Supabase service-role key and Google Gemini API key;
neither is returned or logged. No production secret is copied locally.

The initial Google test was rejected for a zero-token free-tier quota. After
the user confirmed Google activation, the worker was switched back to direct
`gemini-nano-banana-2.1` on the Google Interactions API. A previous Vercel Gateway
probe authenticated successfully with runtime OIDC but found zero balance and
required a valid card. No Gateway generation request is made by this version.
The image request explicitly sets native `imageSize: "2K"` and `aspectRatio:
"4:3"`. JPEG and PNG bytes are parsed and dimensions must have a longest edge
of at least 2048 and a 4:3 ratio. Images are never resized to pass this check.

Each storage slot has an atomic lock and at most three provider attempts.
Rate-limit rejections do not consume a generation attempt. Existing images are
reused. A receipt is saved before image upload, and orphan images cannot trigger
another paid generation. The worker uploads to the fixed `listing-images`
bucket and returns metadata; it never inserts products, variants, or gallery
rows. Visual QA always remains `pending` until a reviewer checks the result.

The driver `../jade-xmas26-generate.py` accepts a mode-0600 JSON credential file
outside the repository containing `url`, `bearer`, and the deployment-specific
expiring share `bypass`. It obtains a scoped cookie, downloads every image,
verifies its public SHA-256 and decoded dimensions, and saves resumable
`verified-assets.json` plus `generation-attempts.jsonl`. The default output is
`/workspace/jade-xmas26-output`; no credentials are written there. Use a single
slot first, visually review it, then use `--all --concurrency 4`. The catalog is
interleaved across categories for parallel visual review. Normal retries are
off unless `--retries` is explicitly specified, and capped at two.

After completion, revoke the temporary share link and remove the preview-only
worker environment variable and temporary worker deployments. Keep the source,
verification manifest, provider request IDs, and QA records for reproducibility.
