# The Stellar Line: panel drafts applied (2026-10-15)

Owner 2026-10-15: "tahmini olarak kur", then "kalsın" on the $5.00 stone estimate — so the
catalog was applied as generated, with the stone price unchanged.

## What is live in the panel

Five **drafts** under org `b7658ac4-7fb4-4fcb-836f-401efc3d9e5b`, 495 variants, **no images**,
`etsyDraftCreationAuthorized: false` on all five. Nothing was written to Etsy.

| id | sku | variants | 14K US 7 | span |
|----|-----|---------:|---------:|------|
| E01 | OPH-STL-E01 | 9 | $2,010 | $1,680–2,440 |
| N01 | OPH-STL-N01 | 27 | $1,160 | $780–1,650 |
| R01 | OPH-STL-R01 | 153 | $700 | $480–1,070 |
| R02 | OPH-STL-R02 | 153 | $1,630 | $1,180–2,390 |
| R03 | OPH-STL-R03 | 153 | $2,970 | $1,790–5,000 |

## How it was applied

`0168_ophir_stellar.sql` is 116 KB and this repo has a recorded transcription failure at 37 KB,
so the migration was NOT pasted. Instead the data was compressed before sending: price and grams
depend only on (karat, size) — metal colour changes neither density nor the maker price — so the
495 variants reduce to **165 (karat, size) pairs**, and the colour axis is CROSS JOINed in SQL.
Keys (SKU, name, properties) are generated in SQL and never retyped. Payload per listing 5.8–7.1 KB.

The compressed form is equivalent to the migration, not a substitute for it: the seals prove it.

## Verification

Canary E01 first, sealed, then the remaining four.

| id | variants | variant seal | matches seal.json | md5(description) | tag seal |
|----|---------:|--------------|:-----------------:|------------------|----------|
| E01 | 9 | `2d5f0645…` | yes | `932bc3aa` | `85ab5f6a` |
| N01 | 27 | `a988f8ad…` | yes | `df82334e` | `b33f7079` |
| R01 | 153 | `86c11428…` | yes | `650348b7` | `8d69c812` |
| R02 | 153 | `3a352abd…` | yes | `944a1fa8` | `c050f515` |
| R03 | 153 | `a40ff9ae…` | yes | `6b5458f7` | `1c85704b` |

Independent counts, not derived from those seals:

- 5 products, all `draft`, 0 with an `etsy_listing_id`, 0 with `etsyDraftCreationAuthorized`,
  5 carrying all 4 blockers.
- 495 variants / **495 distinct SKUs** (no collision), 0 `listing_images` rows.
- Ophir variants 36,784 before → **37,279** after, exactly +495: nothing else was touched.
- `audit_log` 500 rows in the window = 495 variants + 5 products, exactly.

## A bug the canary did not catch

The first compressed draft keyed the pairs on the **formatted** property value ("US 7",
"16 inches") and then re-applied the prefix, which would have written SKU `…-16 inchesIN` and
property `US US 7`. E01 passed anyway because it has no size axis — a one-listing canary only
proves that listing. Caught by reading the generated SQL before sending; the pairs now carry the
raw value.

## Still open

1. **Stone price.** $5.00 each is the owner's accepted estimate, not a maker quote. One number
   from the maker replaces it and reprices the line: at $3 / $5 / $8 the knot ring lists at
   $1,320 / $1,630 / $2,100.
2. **Grams.** Geometry × 1.15; no sample weighed. The signet is the most exposed (14.76 g at
   14K US 7) and its top variant (18K, US 12, 20.39 g, $5,000) clears Ophir's current $3,990 ceiling.
3. **Images.** Five heroes generated but unverified by the owner; frames 02–10 not built. Do not
   push to Etsy until the gallery is attached — these seals must come back identical afterwards.
