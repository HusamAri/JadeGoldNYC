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

The approved production labor is 55 USD per ring. The optimal selling model is:

- 3mm to 7mm: 1.75 multiplier
- 8mm to 12mm: 2.00 multiplier
- Etsy list price: ceiling of engine price divided by 0.75, rounded up to 5 USD
- Visible Etsy sale: 25 percent below list price

Maeander availability begins at 5mm. The 3mm and 4mm Maeander options are removed from all nine metal and karat listing families, reducing the panel matrix from 2,250 to 1,800 variants. Narrower widths remain available only where another Frieze & Textured product family explicitly supports them.

The 1.75 narrow multiplier is required because labor 55 USD with the former 1.55 multiplier leaves only about 10 percent contribution margin on an offsite-ad sale. The new model lifts the minimum standard contribution margin to 32.21 percent and the minimum offsite-ad contribution margin to 17.21 percent.

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
| Narrow multiplier | 1.75 |
| Wide multiplier | 2.00 |
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

The market has two distinct tiers. Lightweight 3mm rings can sit near 350 USD. Substantial patterned bands from 5.3mm to 8mm sit mainly between 770 USD and 1,696 USD in 14K. EON's 1.5mm production specification and gram-based pricing belong in the second tier.

## Recommended visible Etsy sale prices

US7 Frieze & Textured reference prices:

| Width | 10K | 14K | 18K |
|---:|---:|---:|---:|
| 3mm | 408.75 | 562.50 | 746.25 |
| 4mm | 498.75 | 701.25 | 952.50 |
| 5mm | 585.00 | 836.25 | 1,166.25 |
| 6mm | 671.25 | 975.00 | 1,357.50 |
| 7mm | 757.50 | 1,113.75 | 1,477.50 |
| 8mm | 963.75 | 1,428.75 | 1,841.25 |
| 9mm | 1,061.25 | 1,586.25 | 2,246.25 |
| 10mm | 1,162.50 | 1,743.75 | 2,475.00 |
| 11mm | 1,260.00 | 1,901.25 | 2,707.50 |
| 12mm | 1,361.25 | 2,058.75 | 2,936.25 |

Maeander listings use only the 5mm through 12mm rows above.

Full Maeander US4 to US16 listing ranges:

| Karat | List price range | Visible sale range |
|---|---:|---:|
| 10K | 705.00 to 2,415.00 | 528.75 to 1,811.25 |
| 14K | 1,000.00 to 3,700.00 | 750.00 to 2,775.00 |
| 18K | 1,410.00 to 5,325.00 | 1,057.50 to 3,993.75 |

Yellow, white and rose gold use the same price within a karat because the production weight table and purity are shared. The nine Maeander listing families therefore use three price ladders, one per karat.

## Positioning result

The new 14K US7 ladder is intentionally below the premium comparable set without presenting as a low-cost substitute:

- 5mm EON at 836.25 USD versus Raya at 1,025.00 USD
- 6mm EON at 975.00 USD versus comparable prices from 769.86 USD to 1,261.20 USD
- 7mm EON at 1,113.75 USD versus TrueLuxe at 1,412.10 USD
- 8mm EON at 1,428.75 USD versus WeddingRingsDepot at 1,695.75 USD

This places EON near the center of the substantial solid-gold patterned band market and preserves a clear value advantage against premium Greek Key references.

## Operational files

- `price-matrix.csv`: all 750 karat, width and size combinations
- `summary.json`: all Etsy listing ranges, assumptions and margin floors
- `supabase/migrations/0132_eon_frieze_textured_pricing.sql`: panel repricing migration
- `supabase/migrations/0133_eon_maeander_minimum_5mm.sql`: guarded deletion of the 450 Maeander variants below 5mm

The migration updates Amuletta panel prices and the 55 USD configuration. It does not push prices to Etsy. Etsy publication remains a separate human-approved operation.
