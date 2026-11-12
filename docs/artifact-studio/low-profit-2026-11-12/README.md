# Leander shop check and low-profit reprice, 2026-11-12

Owner: "do end to end check and market research for the listings. I have doubt the prices are not competitive,
they are high. To do our first sale we need to sell with low profit ... competitive or cheaper than others,
especially silvers. 5 usd is each gram's cost in silvers. Assume ads cost and Etsy fees and set highly competitive
prices for silver products and the listings that we are secure about costs."

## What the check found (217 active listings, read live from Etsy per offering)

1. **The buyer pays more than the catalog intended.** The catalogs price at 2 x maker cost for a 30% sale, so the
   buyer was meant to pay 1.4 x cost. The owner raised Etsy prices 15% on 9 Oct (120 listings) and 10% on 12 Oct
   (165 listings), and the shop sale is now 15% (ends 23 Nov). On most gold listings the buyer pays
   2 x 1.265 x 0.85 = 2.15 x maker cost, 54% above the designed price. That is the "too high" the owner feels.
2. **Silver was the opposite problem.** The owner's 35% cut (8 to 11 Nov) plus the 15% sale put 63 of 144 silver
   variants below the 5.00 USD/g cost (worst -65.94 USD a sale). Fixed in `../silver-chains/` (0187).
3. **The panel is not the price source for 74 listings.** After today's work Etsy still differs from the panel on
   74 active listings: 53 at x 1.265, 17 at x 1.1, 1 at x 1.2 and 3 with other ratios (Christmas bracelets and
   necklaces, For Him earrings, anklets, evil eye, some winter 27). A `price-sync` on any of them would cut the live
   price by 9 to 21% (more on the three) without anyone asking. Read live before any price work there.
4. **Ads: 338.26 USD spent on Etsy Ads since 30 Sep (about 10 USD a day), no net order.** The shop's one order
   (18 Oct, hammered band, 830.47 after a 35% sale) was refunded the same day.
5. **Offsite Ads is on.** That order was charged the 100 USD Offsite fee (refunded with it). The catalogs and the
   2026-09-22 note assume it is off. Under 10K USD a year the shop can opt out.
6. **0 reviews, 5 shop favourites.** Silver gets 4 to 6 views a day per listing, the best gold listings 3 to 7.
7. **One active listing has no tags:** 4612132585 "Elongated Cable Chain Bracelet" (made on Etsy on 8 Nov, 400 USD,
   four-word title, no panel variants or images). It cannot be found in search as it stands.
8. Titles, tags and public text were rebuilt on 3 and 4 Nov (135 listings) and are not touched here.

## Market position in one line each

- Silver: after the reprice Leander sells at 6.4 to 7.7 USD/g, the low end of the US market, level with the
  22.7k-review leader on heavy Franco and under it on bracelets (`../silver-chains/market-2026-11-12.md`).
- Gold rings: Etsy "from" prices today are 194 to 249 for a 10K 3 mm band at established shops (Shule, Belaron,
  NorthernLights), 255 to 394 for a 14K 3 to 4 mm dome (Adela, Lavense, Kvs, Ferkos), 312 to 446 for a 4 mm hammered
  band (Kvs, GoldProject, Belaron, Tallie), 231 to 529 for a signet (Ike, Takar, Cittali). Leander's bands started at
  357 to 645 and now start at 259 to 400; its two signets started at 742 and 892 and now start at 459 and 544.
- In both metals the limit is the cost base, not the tag: silver at 3.4 x melt, 10K gold at 1.49 x melt
  (77.43 against 51.93 USD/g at spot 3873.60). Shops that manufacture themselves sell near the price we buy at.

## The rule (same for silver and gold)

    list = ceil((cost + fixed + 0.45) / ((1 - 0.095) x (1 - 0.25)))

The list price breaks even after Etsy fees at the deepest planned sale (25%, Cyber Specials 23 Nov to 1 Dec).
At the 15% sale running now the same list price leaves 10.65% of the buyer price for Etsy Ads and profit:
an organic sale earns about a tenth, an ad-driven sale about nothing, a Cyber sale breaks even.
Silver: cost 5.00 USD/g, fixed 8.50, whole dollars. Gold: cost = grams x maker rate + quoted extras, fixed 22.00
(insured, signed shipping and box), rounded up to 5.

## Gold: the 22 listings with a secure cost (`gen.py`, 0188)

Secure means the cost is the maker's own word for that piece (`../maker_cost.py`, WhatsApp 2026-10-07): Christmas
rings R01 to R10 ("price it as a 3 mm band from the list"; R02 a 4 mm band + 100 enamel), Christmas N02 (1 g + 50
enamel, chain at the quoted 130 for 18 in) and B09 (3 g + 50 enamel + 100 chain + 50 assembly), For Him rings R01
to R10 (the maker's band list at each ring's width and wall; signets by the owner's "top + shank, halve it" rule).
Maker rate per alloy gram: 14K 100.00, 10K 77.43, 18K 123.13 (the maker's own 18K table, 1.400 x 14K). The list
was quoted at spot 4178; spot is 3873.60 today, so the rate is on the safe side until the maker re-quotes.

Buyer price at the 15% sale, before and now (4,914 variants; full ranges per karat in `summary.csv`):

| Listing | Name | From, before | From, now | 14K before | 14K now | Change |
|---|---|---|---|---|---|---|
| BAS-XM-R01, R03 to R10 | Christmas motif rings (9) | 451.61 | 289.00 | 645.15 to 1075.25 | 403.75 to 654.50 | -40 to -36% |
| BAS-XM-R02 | Candy Cane Stripe Ring | 806.44 | 497.25 | 1075.25 to 1645.13 | 650.25 to 986.00 | -40 to -38% |
| BAS-XM-N02 | Candy Cane Hook Necklace | 430.10 | 280.50 | 580.64 to 634.40 | 361.25 to 399.50 | -38 to -35% |
| BAS-XM-B09 | Poinsettia Station Bracelet | 806.44 | 493.00 | 1064.50 to 1096.76 | 646.00 to 667.25 | -40 to -39% |
| BAS-HM-R01 | Brushed Flat Band | 559.13 | 348.50 | 795.69 to 1333.31 | 493.00 to 807.50 | -40 to -37% |
| BAS-HM-R02 | Polished Dome Band | 451.61 | 289.00 | 645.15 to 1075.25 | 403.75 to 654.50 | -40 to -36% |
| BAS-HM-R03 | Square Signet Ring | 892.46 | 544.00 | 1279.55 to 2150.50 | 773.50 to 1279.25 | -41 to -39% |
| BAS-HM-R04 | Bar Signet Ring | 741.92 | 459.00 | 1075.25 to 1784.92 | 650.25 to 1071.00 | -40 to -38% |
| BAS-HM-R05 | Knife Edge Band | 357.00 | 289.00 | 510.00 to 850.00 | 403.75 to 654.50 | -24 to -19% |
| BAS-HM-R06 | Hammered Band | 559.13 | 348.50 | 795.69 to 1333.31 | 493.00 to 807.50 | -40 to -37% |
| BAS-HM-R07 | Centre Line Band | 645.15 | 399.50 | 924.72 to 1548.36 | 569.50 to 930.75 | -40 to -37% |
| BAS-HM-R08 | Square Wire Ring | 397.84 | 259.25 | 569.88 to 956.97 | 361.25 to 586.50 | -39 to -35% |
| BAS-HM-R09 | Octagon Facet Band | 489.60 | 331.50 | 714.00 to 1193.40 | 463.25 to 756.50 | -37 to -32% |
| BAS-HM-R10 | Open Bar Ring | 397.84 | 259.25 | 569.88 to 956.97 | 361.25 to 586.50 | -39 to -35% |

Not touched, on purpose: the other 189 gold listings. Their grams are estimates (pendants, bracelets, earrings,
anklets, enamel pieces priced from a category quote), and a break-even price on an estimated cost can be a loss.
The same rule would lower them by roughly 30 to 40%; a maker quote or a weighed sample per family moves them into this file.

## Applied

- 0188 (`gen.py`): precondition seal 0f49501f32a2d3d5ea0105e211893176 = live panel = catalog, post seal
  aef08ece5ae02842664f762ea6e7974e = repo, 4,914 variant audit rows, 22 products marked `lowProfit20261112`.
- `ops/price-sync?org=by Artifact Studio Jewelry`: dry 22 listings, 4,914 offering diffs, 0 unmatched SKUs, every
  panel price under the live price -> N02 canary 27 written, fresh-token read 27/27 -> 21 listings 4,887 written,
  0 left -> fresh-token read 4,914/4,914 equal to prices recomputed from the catalogs. 28 `etsy.reprice` audit rows
  (6 silver + 22 gold), all "read-back doğrulandı". Tokens: 38 minted, 33 used, the rest burned.
- Undo: `audit_log` holds every variant's price before (`diff.before.price_cents`); the live Etsy price before was
  the catalog price x 1.265 (R05 x 1.0, R09 x 1.2), recorded in `gen.py` `LIVE_MULT`.

## Limits the owner controls

1. Turn Offsite Ads off (Shop Manager > Settings > Offsite Ads) or accept that an Offsite order on these 28 listings
   loses up to 15% of the order.
2. No sale or coupon deeper than 25% on these 28 listings; the list prices break even at exactly 25%.
3. If the maker re-quotes above 100 USD/g for 14K, or silver above 5.00 USD/g, re-run the generators.
