# Jade Gold NYC · EON Top 10 Ring Transfer (2026-09-24)

EON's 10 best-selling ring designs, rebuilt as Jade Gold NYC listing suggestions
(panel drafts, `etsy_listing_id` empty → `/listing-onerileri`).
10 models × 3 metals = **30 listings**, 10 images each = **300 images**.

## 1. Top 10 (EON sales, cancelled excluded, same design merged across metals)

| # | Model | Units | Source grid (EON listing · karat) | Widths | Sizes |
|---|---|---|---|---|---|
| 01 | Satin center, stepped polished rails | 7 | 4554025310 · 14K | 4-8mm (5) | US 4-16 whole+half (25) |
| 02 | Flat comfort fit | 6 | 4539777986 · 10K | 2-12mm (11) | 25 |
| 03 | Dome comfort fit | 6 | 4539666999 · 10K | 2-12mm (11) | 25 |
| 04 | Milgrain edge | 4 | 4542485142 · 14K | 2-12mm (11) | 25 |
| 05 | Hammered with milgrain | 3 | 4543442596 · 14K pricing* | 4-12mm (9) | 25 |
| 06 | Diamond-cut crosshatch | 1 | 4565352791 · 18K | 4-8mm (5) | US 3-13 whole+half (21) |
| 07 | Kinetic bead (moving band) | 1 | 4561855998 · 14K | fixed | US 3-13 (21) |
| 08 | Greek key milgrain | 1 | 4556710904 · 10K | 5-12mm (8) | 25 |
| 09 | Two-tone diamond cut | 1 | 4550516268 · 10K | 6-12mm (7) | 25 |
| 10 | Beveled | 1 | 4544213291 · 14K | 2-12mm (11) | 25 |

\* EON title says 10k but SKU `HMW-R-1402` and price level match 14K; treated as 14K.

## 2. Variation structure (corrected 2026-09-24)

Etsy now supports **three** variation properties (`max_variations_supported=3`,
[Etsy third-variation tutorial](https://developers.etsy.com/documentation/tutorials/third-variation/));
this repo already runs them live on EON Flat Milgrain (Karat 516, Width 513,
Ring Size 514). The earlier "fold karat into width" plan is dropped.

- Axes: `Karat` (10K/14K/18K) · `Width` ("6 mm") · `Ring Size` ("US 7.5").
  Kinetic bead has no width: `Karat` · `Ring Size`.
- Etsy caps a listing at **400 products** when price/SKU vary on every
  property, so each grid is trimmed to 5 widths: 3 x 5 x 25 = 375
  (US 4 to 16 whole+half). Crosshatch/Kinetic keep the EON US 3 to 13 range (21).
- Widths used: Satin/Flat/Dome/Milgrain/Beveled/Crosshatch 4 to 8mm;
  Hammered/Greek Key/Two-Tone 6 to 10mm.
- SKU: `JGN-E<model><Y|W|R>-<karat>-<width>-<size x10>`, e.g. `JGN-E02Y-14-06-075`.

## 3. Pricing

Source cell price → 10K basis → target karat, using EON's own live karat ratio
(measured on 3,300 matched cells, 2026-09-24): **10K 1.000 · 14K 1.474 · 18K 2.019**.

    jade_price = ceil(src_price / ratio[src_karat] * ratio[target_karat] / 500) * 500

Then a running max across ring sizes (EON grids have a few half sizes priced
below the smaller size; a bigger ring never costs less here). Same price across
yellow/white/rose (EON convention). Free-shipping allowance is already inside
the EON source price.

## 4. Visual canon · "NYC architecture, window light"

Clichés avoided: cream linen, marble, velvet boxes, dried flowers, lava rock,
acrylic arches, workshop tools (EON's own language).

| Metal | Surface | Light |
|---|---|---|
| Yellow | weathered black SoHo cast-iron facade | hard low late-afternoon sun |
| White | Brooklyn brownstone stoop, chocolate sandstone | golden hour |
| Rose | honed Indiana limestone window lintel | cool clear morning |

Signatures: multi-pane loft window-grid shadow (hero + editorial only, not
every frame); a thin out-of-focus verdigris copper sliver = the brand's jade note.
Product lock: EON hero is the geometry reference; only metal color changes.

### 10-shot list per listing
01 hero three-quarter · 02 macro surface detail · 03 side profile (width + comfort fit)
· 04 top-down full circle · 05 on-hand · 06 NYC editorial context · 07 interior polish
· 08 width comparison (3 widths) · 09 karat color comparison (10K/14K/18K) · 10 pair on two hands

Model: `gpt_image_2_5`, 1:1, 2K, medium quality = 1 credit/image.

## Status
- [x] Step 1 · matrix + pricing rule verified against live EON grids
- [x] Step 2 · canon test, model 01 × 3 metals (`test/`)
- [x] Step 3 · 300 images in `public/jade/eon-top10/` (10-beveled-rose 04 re-rendered 2026-09-25 with anti-signet lock; 07 still shows a thickened top, open)
- [x] Step 4 · titles, descriptions, tags (`catalog.json`, generator `scripts/jade-eon-top10/catalog.py`)
- [x] Step 5 · 30 panel drafts live in Listing Önerileri (migration `0151`)
- [ ] Step 6 · Etsy canary: flag set true 2026-09-24; generic create path supports 3 axes (this PR). Needs merge + deploy first

## Panel write record (2026-09-24)

30 drafts, 10,134 variants, 300 `listing_images` rows (url source, prod domain
`/jade/eon-top10/<key>/<shot>.jpg`, served once images land in `public/`).
Read-back: text md5 `c55846c132146340518175f053a81b5c` = `text-md5.txt`
aggregate; variant price sum 1,678,096,500 cents; 0 duplicate combos, 0 SKU > 32,
max 375 per listing, `approval.etsyDraftCreationAuthorized` flipped to true on user request (2026-09-24).
