# Leander gram audit and cost-floor pricing, 2026-11-18

Owner rule: cost = grams x gold price + 130 USD labor per piece. Prices must cover cost, margin stays low, no sale at a loss.
Exact weights are unknown, so every gold listing got a gram figure from the most trustworthy source available.

## What was wrong
Prices were built as 2 x cost on gram estimates, at gold 4,178.20. Spot on 2026-11-18 is 3,733.25 (api.gold-api.com).
Most gold listings sat 1.3 to 2.8 x above break-even; Christmas and For Him rings sat slightly below it.

## Gram sources, in order of trust
| Grade | Source | Listings |
|---|---|---|
| A | Maker's band list or written quote | 47 |
| B | Maker's own grams on similar pieces, as a ratio on our estimate (`anchors.py`): earring pair 2.78, bracelet stations 1.64, pendant 1.21, hoop 1.39; motif ring raised to his 3 mm band (3.59 g) | 130 |
| B | Supplier chain catalog converted from silver by density 1.262 (`chains.json`) | 3 |
| C | Blender model from the listing's stated dimensions, x 1.15 (`blender_models.py`, `models.json`) | 27 |
| D | No anchor, panel grams + 15% | 1 |

Comparable Etsy listings that state grams (anklets 1.0 to 1.8 g, a 7.4 mm enamel stud 0.6 g, hamsa pendants 0.8 to 1.2 g) are lighter than
the maker's figures. He bills by weight, so his ratios set the grams; the market figures are the low bound.
Cross-check: the Blender model of the 6.5 mm enamel signet gives 3.59 g, the same as the maker's 3 mm band figure.

## Price rule
`list = ceil((grams x gold per gram + 130 + 22.45) / (0.905 x 0.75))`; gold per gram 10K 50.05, 14K 70.22, 18K 90.02.
Break-even at a 25% sale with 9.5% Etsy fees. Karat density against 14K: 10K x 0.892, 18K x 1.137.

## Run
- `params.py` builds one rule per SKU family (`params.json`): new grams = panel grams x mult + add14 x density.
- Mirror refresh from Etsy: 203 of 208 listings; five 2027 necklaces failed because Etsy holds one SKU on two chain lengths.
  They are priced by SKU at the 18 inch weight.
- Panel write, one statement, guarded by the `+ga1118` tag on `weight_source` (a second run finds nothing to change):
  13,524 variants, 10,964 down, 2,557 up, 3 equal. Seal before `c487cf14a38a0c8e86fe8ebee5320928`, after
  `7bb4058e17d612e5632275279517f4e0` (md5 of `sku:price_cents:grams` ordered by sku, id); live seal equal after the write.
- Etsy dry run: 208 listings, 13,529 offerings, 0 without a panel match, 13,526 differ. Etsy total 12,192,679 to 8,915,708 USD.
- `table.py` builds the owner's table and `prices.csv` (every offering: Etsy price before, new price).

## Not changed
- 6 sterling silver listings (12 November rule).
- 4581283366 star lariat and 4581302864 V necklace with lab diamond: no variants and no SKU, the route cannot write them.
- 4612132585 private custom order listing.

## Open
- Earrings: the maker's written lines for an enamel pair (posts 100, enamel 50, assembly 50) exceed 130 before gold.
- Stones (Cercle pave, V necklace) are not in the cost.
- Offsite Ads fee is not in the floor. Gold is fixed at the day's spot.
- `weight_grams` on the panel now holds the careful pricing gram, not a measured weight. Replace with real weights as pieces are made.

## Etsy push, 2026-11-18
- Canary 4586539516: 27 written, fresh-token read 27 of 27 equal.
- Remaining 207 listings: 13,499 offerings written, 0 errors, every listing `synced` on the route's own read-back.
- Independent read with fresh tokens: 208 listings `unchanged`, 13,529 offerings, 0 mismatches, 13,524 panel variants in the map.
- Audit: 208 `etsy.reprice` rows, 203 `etsy.variant_sync` rows. Panel seal after the push still `7bb4058e17d612e5632275279517f4e0`.
- Tokens: 90 issued, 89 used, 1 burned, 0 open; the token file is deleted.
