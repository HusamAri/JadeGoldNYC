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

## Repriced for the 25% shop sale (2026-10-27, owner; listings live)
`pricing.py` SALE 0.70 -> 0.75 (buyer price unchanged, 50 + 6 USD/g). 0173 applied: precondition seal 8e85c330 matched,
post seal 84f0f796 = repo; 141/144 variants changed, audit 141. `ops/price-sync` dry 141 offering diffs (panel maps
30/18 full) -> apply 141 written, 0 left -> fresh-token read-back 6/6 unchanged, 0 diff.

## Repriced on cost (2026-11-12, owner: "5 usd is each gram's cost ... set highly competitive prices")
The market fit above is superseded. What was live: between 8 and 11 Nov the owner cut every Etsy price by 35% by
hand (Etsy list = 0173 list x 0.65, read per offering 144/144) and the shop runs a 15% sale until 23 Nov, so the
buyer paid 36.8 + 4.42 USD/g. At 5.00 USD/g that is below cost for 63 of 144 variants (from about 27 g up; worst -65.94 USD a sale).
- Rule (`pricing.py`): list = ceil((5.00 x grams + 8.50 + 0.45) / (0.905 x 0.75)). Fixed 8.50 = label 5.80 measured
  in `etsy_ledger_entries` + 2.70 packaging (assumption). The list price breaks even at the deepest planned sale
  (25%, Cyber Specials 23 Nov to 1 Dec); at today's 15% sale it leaves 10.65% of the buyer price for ads and profit.
- Result: 46 variants down (to -46%), 94 up (to +32%), 4 unchanged at the buyer. Every "from" price fell:
  S01 98.90 -> 92.65, S02 60.22 -> 43.35, S03 71.27 -> 59.50, S04 54.70 -> 29.75, S05 71.27 -> 56.10, S06 49.17 -> 28.90.
  Buyer price is 6.4 to 7.7 USD/g above 8 g; see `market-2026-11-12.md` (73 competitor listings read).
- Applied: 0187 (`gen_reprice_cost5.py`), precondition seal 84f0f796 = live, post seal 943509361507c0a24d27a69ae427f162
  = repo, 144 variant audit rows. `ops/price-sync` dry 144 offering diffs (maps 30/18 full) -> S06 canary 18 written,
  fresh-token read 18/18 -> 126 written, 0 left -> fresh-token read 144/144 equal to `prices.csv`. Public page checked:
  S06 "Now 28.90+, Original 34.00+, 15% off".
- Limits, in the owner's hands: (1) Offsite Ads is on (the 18 Oct order was charged 100 USD); an Offsite order at these
  prices nets -0.81 to -25.56 USD (`net_offsite_15_usd`), so opt out in Shop Manager > Settings > Offsite Ads while the
  shop is under 10K. (2) No sale or coupon deeper than 25% on silver without re-running `pricing.py`. (3) Etsy Ads
  has spent 338.26 USD since 30 Sep (about 10 USD a day) with no net order; the 10.65% cushion covers ads only once
  the shop sells about 2,800 USD a month. (4) Bracelet grams are scaled from the 18 in weight; weigh the first units.
- Second run guard: live seal already 94350936... means the job is done; the migration stops on it.

## Open
- **Supplier price** is the lever: 5.00 USD/g is 3.4 x melt (1.49 at spot 50.09). Each 0.50 USD/g off lowers every
  list price by 0.74 USD/g; change `COST_G` and re-run `pricing.py`, a seal-guarded migration and `ops/price-sync`.
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
- Done 2026-11-12: supplier cost 5.00 USD/g replaced the 4 USD/g assumption (see "Repriced on cost"). If the deepest sale changes, change `DEEPEST_SALE` in `pricing.py` the same way.
