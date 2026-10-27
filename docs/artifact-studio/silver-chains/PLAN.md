# Sterling silver chains (S01 to S06): plan

First silver line in the by Artifact Studio Jewelry shop. Source: supplier catalog photos (owner, 2026-10-27).
Weights below are the catalog's 18" weights; other lengths scale with length (gram/inch = 18" weight / 18).

| Listing | Chain | Piece | Hero palette |
|---|---|---|---|
| S01 | Franco | Necklace | graphite |
| S02 | Franco | Bracelet | ink navy |
| S03 | Cuban curb | Necklace | black |
| S04 | Cuban curb | Bracelet | olive |
| S05 | Figaro | Necklace | fog grey |
| S06 | Figaro | Bracelet | espresso |

## Variation axes (2 axes: Width x Length, full grid)
The gold rule (Karat x Metal Color x size) does not apply: one metal, no karat. Lengths from the catalog's
"available in" line: necklace 18/20/22/24/26 in, bracelet 7/8/9 in.

| Chain | Widths offered (catalog code, 18" g) | Grid N / B |
|---|---|---|
| Franco (catalog: RH Solid Franco, rhodium plated) | 2.2 mm (230, 12.9) · 3 (300, 21.7) · 3.4 (370, 28.3) · 4.1 (420, 41.1) · 4.8 (470, 56) · 5.2 (550, 65.3) | 30 / 18 |
| Cuban curb | 3.3 (100, 7.6) · 4.8 (150, 14.8) · 6.5 (180, 25.1) · 7.6 (200, 32.6) · 8.5 (220, 41.6) · 10.2 (250, 52.8) | 30 / 18 |
| Figaro | 3.4 (100, 7.1) · 4.6 (150, 12.5) · 6.6 (180, 23.5) · 7.2 (200, 30.7) · 8.3 (220, 35.1) · 10.3 (250, 55.3) | 30 / 18 |

Widths under 2 mm left out (read as women's chains); over 10.3 mm left out (55 g+ per necklace, price jump).

## Copy rules
- "925 Sterling Silver"; Franco also "rhodium plated" (catalog says RH). Curb and Figaro: plating not stated in
  the catalog, so no plating or "tarnish-free" claim until confirmed.
- The catalog's "Curb" is a flat diamond-cut curb. Title uses "Cuban Curb" (buyer search term), the description
  says flat diamond-cut curb, no "Miami Cuban" claim.
- Production partner (supplier) is disclosed; AI visualization disclosure in every description.

## Images
`image-prompts.md` (from `prompts.py`): 5 frames per listing, one palette per listing. Etsy since 2026-10-22: each
listing also needs one real unedited photo of the actual chain (slot 06).

## Market and prices (2026-10-27)
Owner: "market research, competitive prices, I edit manually if needed". `pricing.py` -> `prices.csv` (144 variants).
- Silver spot 53-55 USD/ozt (Fortune, Kitco, APMEX 2026-10-27), so sterling metal is about 1.6 USD/g.
- Solid 925 Italian chains, buyer-paid price per gram: Franco 4mm 22" 38.4 g 279.65 sale / 329 list (Etsy);
  curb 6mm 22" 197 (Italia Chains), 6.5mm 22" 409 (The Gold Gods); Figaro 6mm 22" 300 / 25.75 g (Etsy),
  319 / 22.5 g (Proclamation), 146 (Jewlr); Figaro bracelet 8" 9.5mm 35.5 g 210, 13mm 47.5 g 280, 7mm 10 g 100.
  Under ~4 USD/g (JTV flash sale, eBay) treated as hollow/plated or outliers.
- Fit: buyer price = 50 + 6.0 x grams (mid-market, under the DTC premium of 11-14 USD/g).
  List = that / 0.70 (shop's permanent 30% sale), rounded up to end in 9.
- Floor (no quote yet): pessimistic cost 4 USD/g + 12 USD + 0.45, fees 9.5% + worst Offsite: every variant positive
  (lowest 27 USD net).
- Franco is priced on catalog weight, which runs heavier than the market's 4mm (41.1 g vs about 31 g at 18"),
  so S01 4.1mm 22" sells at 356 vs a competitor's 280.

## Open
- **Supplier cost** replaces the 4 USD/g assumption; re-run `pricing.py`.
- Curb/Figaro plating status.

## Panel load (2026-10-27, owner "evet")
Applied 0172 through `compact_sql.py` (text pasted, Width x Length grid generated in SQL), one product at a time,
S01 canary first. Live: 6 products / 144 variants / 30 images, set seal 8e85c330f76fa1511bee63664a01e817 = `seal.json`;
audit_log 6 + 144 + 30 inserts, 2 updates (S02/S04 metadata seal refreshed). Two Python float artifacts found by the
seal and fixed to match Postgres numeric (grams half-up; one price, S04 6.5 mm x 9 in = 179).

## Etsy drafts (2026-10-27, owner "evet")
`ops/drafts-push` org=by Artifact Studio Jewelry, prefix=BAS-SLV: dry run 6/6 (0 blocked) -> S01 canary + independent
verify (11/11 checks) -> S02-S06 (5 created, 0 warnings) -> independent verify 6/6, 0 mismatch, 0 price mismatch.
Panel: 6 linked, 6 distinct ids, 6 `etsy.listing_create` audit rows; open tokens 0. All drafts, nothing published.

| Listing | Etsy draft | Category | Variants | Images |
|---|---|---|---|---|
| S01 Franco necklace | 4604339049 | 1221 Chains | 30 | 5 |
| S02 Franco bracelet | 4604362346 | 1196 Chain & Link Bracelets | 18 | 5 |
| S03 Cuban curb necklace | 4604362474 | 1221 Chains | 30 | 5 |
| S04 Cuban link bracelet | 4604362590 | 1196 Chain & Link Bracelets | 18 | 5 |
| S05 Figaro necklace | 4604339755 | 1221 Chains | 30 | 5 |
| S06 Figaro bracelet | 4604339881 | 1196 Chain & Link Bracelets | 18 | 5 |

## Open
- Owner adds one real unedited photo per draft in the Etsy editor (Etsy rule since 2026-10-22), then publishes.
- Shipping profile and shop section are set in the Etsy editor before publishing.
- Supplier cost replaces the 4 USD/g assumption; re-run `pricing.py` and `ops/price-sync` (panel price = Etsy list price).
