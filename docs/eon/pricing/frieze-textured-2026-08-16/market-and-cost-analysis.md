# EON Frieze & Textured Pricing, Market and Cost Analysis

Date: 2026-08-16  
Currency: USD  
Recommended Etsy shop section: `Frieze & Textured Bands`

## Decision

Use one handfinished pricing class for all 24 Frieze & Textured products:

- 9 Milgrain listings
- 1 Hammered listing
- 2 Basketweave and Diagonal Ribbed drafts
- 3 Two-Tone Diamond-Cut drafts
- 9 Greek Key / Maeander listings and drafts

The approved production labor is 55 USD per ring. A market and margin optimization loop evaluated 99 multiplier pairs. The selected selling model is:

- 3mm to 7mm: 2.05 multiplier
- 8mm to 12mm: 2.20 multiplier
- Etsy list price: ceiling of engine price divided by 0.75, rounded up to 5 USD
- Visible Etsy sale: 25 percent below list price

Maeander availability begins at 5mm. The 3mm and 4mm Maeander options are removed from all nine metal and karat listing families, reducing the panel matrix from 2,250 to 1,800 variants. Narrower widths remain available only where another Frieze & Textured product family explicitly supports them.

The previous 1.75 and 2.00 model was profitable but underpriced against verified patterned solid-gold bands. The selected model lifts the minimum standard contribution margin to 40.58 percent and the minimum offsite-ad contribution margin to 25.58 percent.

The repeatable loop reads `market-comparables.json`, tests multiplier pairs in 0.05 increments, rejects candidates below the margin floors or above the controlled price-step limits and ranks the remaining candidates by distance from the target market position. Alura estimates provide secondary performance confidence. Direct Etsy variant prices remain the pricing authority.

## Gold basis

The panel's active gold basis remains 4,399.90 USD per troy ounce. The [live XAU source check](https://api.gold-api.com/price/XAU) was 4,377.600098 USD per troy ounce. The live value was 0.507 percent below the active basis, so reducing prices was not justified.

Inputs:

| Input | Value |
|---|---:|
| Gold basis | 4,399.90 USD/ozt |
| Fire factor | 1.07 |
| Handfinished labor | 55.00 USD |
| Packaging | 8.00 USD |
| Shipping allowance | 22.00 USD |
| Narrow multiplier | 2.05 |
| Wide multiplier | 2.20 |
| Visible sale rate | 0.75 |
| Standard Etsy net rate | 0.895 |
| Offsite Etsy net rate | 0.745 |
| Fixed transaction allowance | 0.45 USD |

## Live Etsy market evidence

Prices below were read in Etsy's USD locale on 2026-08-16. They are live sale prices and can change with promotions or selected variants.

| Product | Comparable specification | Live sale price |
|---|---|---:|
| [Greekrootsshop Greek Key](https://www.etsy.com/listing/1333345810/) | 14K, 3mm, about 1g | 350.46 USD |
| [RayaRoseJewelry Greek Key](https://www.etsy.com/listing/4478680144/) | 14K, 5.3mm, 1.4mm thick, about 5g at US7 | 1,025.00 USD at US7 |
| [ForiaJewelry Textured Greek Key](https://www.etsy.com/listing/1905763733/) | 14K, 6mm, 1.4mm thick | 1,261.20 USD at US7 |
| [KvsJewelery Hammered Milgrain](https://www.etsy.com/listing/4317473844/) | 14K, 6mm | 769.86 USD at US7 |
| [DIAMONDFORLOVE Hand Hammered](https://www.etsy.com/listing/1723815903/) | 14K, 6mm | 1,219.99 USD at US8 |
| [TrueLuxeDesignsCo Hammered Milgrain](https://www.etsy.com/listing/1109847365/) | 14K, 7mm | 1,412.10 USD |
| [WeddingRingsDepot Greek Key](https://www.etsy.com/listing/690347859/) | 14K, 8mm | 1,695.75 USD |
| [WeddingRingsDepot Greek Key](https://www.etsy.com/listing/690347859/) | 18K, 8mm | 2,290.75 USD |
| [DiaFineJewelry Milgrain](https://www.etsy.com/listing/1269650286/) | 14K, 3.95mm, 1.05mm thick | 640.50 USD at US7 |
| [RevolutionBA Hammered](https://www.etsy.com/listing/208112020/) | 14K, 5mm, 1.5mm thick | 1,197.12 USD |
| [YourWeddingBandShop Pattern Milgrain](https://www.etsy.com/listing/1365802901/) | 14K, 6mm | 1,130.50 USD at US7 |

The market has two distinct tiers. Lightweight 3mm rings can sit near 350 USD. Substantial patterned bands from 5mm to 8mm sit mainly between 770 USD and 1,696 USD in 14K. EON's 1.5mm production specification and gram-based pricing belong in the second tier.

Alura showed the 5mm RevolutionBA listing at about 1,100 estimated sales and 1.7 million USD estimated revenue. The 6mm YourWeddingBandShop listing showed about 85 estimated sales and 77,300 USD estimated revenue. These are directional estimates, not audited seller figures, but they support using the direct Etsy prices as proven demand anchors.

## Recommended visible Etsy sale prices

US7 Frieze & Textured reference prices:

| Width | 10K | 14K | 18K |
|---:|---:|---:|---:|
| 3mm | 480.00 | 660.00 | 873.75 |
| 4mm | 581.25 | 821.25 | 1,117.50 |
| 5mm | 682.50 | 982.50 | 1,368.75 |
| 6mm | 783.75 | 1,140.00 | 1,590.00 |
| 7mm | 885.00 | 1,301.25 | 1,732.50 |
| 8mm | 1,061.25 | 1,571.25 | 2,025.00 |
| 9mm | 1,166.25 | 1,747.50 | 2,471.25 |
| 10mm | 1,278.75 | 1,920.00 | 2,722.50 |
| 11mm | 1,387.50 | 2,092.50 | 2,977.50 |
| 12mm | 1,496.25 | 2,265.00 | 3,232.50 |

Maeander listings use only the 5mm through 12mm rows above.

Full Maeander US4 to US16 listing ranges:

| Karat | List price range | Visible sale range |
|---|---:|---:|
| 10K | 825.00 to 2,655.00 | 618.75 to 1,991.25 |
| 14K | 1,175.00 to 4,070.00 | 881.25 to 3,052.50 |
| 18K | 1,650.00 to 5,855.00 | 1,237.50 to 4,391.25 |

Yellow, white and rose gold use the same price within a karat because the production weight table and purity are shared. The nine Maeander listing families therefore use three price ladders, one per karat.

## Positioning result

The new 14K US7 ladder is intentionally below the premium comparable set without presenting as a low-cost substitute:

- 5mm EON at 982.50 USD versus Raya at 1,025.00 USD and RevolutionBA at 1,197.12 USD
- 6mm EON at 1,140.00 USD versus comparable prices from 769.86 USD to 1,261.20 USD
- 7mm EON at 1,301.25 USD versus TrueLuxe at 1,412.10 USD
- 8mm EON at 1,571.25 USD versus WeddingRingsDepot at 1,695.75 USD

This places EON near the center of the substantial solid-gold patterned band market and preserves a clear value advantage against premium Greek Key references.

## Operational files

- `market-comparables.json`: direct Etsy price evidence plus secondary Alura signals
- `candidate-ranking.csv`: all 99 evaluated multiplier pairs
- `optimization.json`: constraints, winner and market-position checks
- `price-matrix.csv`: all 750 karat, width and size combinations
- `summary.json`: all Etsy listing ranges, assumptions and margin floors
- `supabase/migrations/0132_eon_frieze_textured_pricing.sql`: panel repricing migration
- `supabase/migrations/0133_eon_maeander_minimum_5mm.sql`: guarded deletion of the 450 Maeander variants below 5mm
- `supabase/migrations/0134_eon_frieze_market_optimized_pricing.sql`: market-optimized panel repricing

The migration updates Amuletta panel prices and the 55 USD configuration. It does not push prices to Etsy. Etsy publication remains a separate human-approved operation.
