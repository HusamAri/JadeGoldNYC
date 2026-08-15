# EON Maeander 1008

Production package for nine Etsy listing suggestions built from one patterned solid-gold wedding band.

## Listing matrix

| SKU | Metal | Karat | Preview price range at $4,090/ozt |
| --- | --- | --- | ---: |
| GLD-R-1008 | Yellow Gold | 10K | $395 to $2,220 |
| GLD-R-1408 | Yellow Gold | 14K | $540 to $3,415 |
| GLD-R-1808 | Yellow Gold | 18K | $720 to $4,925 |
| WHG-R-1008 | White Gold | 10K | $395 to $2,220 |
| WHG-R-1408 | White Gold | 14K | $540 to $3,415 |
| WHG-R-1808 | White Gold | 18K | $720 to $4,925 |
| RSG-R-1008 | Rose Gold | 10K | $395 to $2,220 |
| RSG-R-1408 | Rose Gold | 14K | $540 to $3,415 |
| RSG-R-1808 | Rose Gold | 18K | $720 to $4,925 |

Migration prices do not use the preview basis. They use the latest EON `gold_reprice_basis` at migration time, then `pricing_config`, then $4,090/ozt only as the final fallback.

## Product configuration

- Width: 3 mm through 12 mm, whole millimeters
- Ring size: US 4 through 16, whole and half sizes
- Thickness: 1.5 mm production specification
- Variants: 250 per listing, 2,250 total
- Quantity: 20 per variant
- Personalization: inside engraving up to 30 characters
- Etsy axes: Width and Ring Size

## Etsy content

Each listing includes:

- One Etsy-ready title under 140 characters and 15 words
- One complete product description
- 13 tags, each 20 characters or fewer
- Two material values
- Ten image records with alt text
- Six repeatable photography prompts

## Image set

Each SKU has ten 2200 by 2200 pixel RGB JPEG files:

1. Hero
2. Pattern macro
3. Side and comfort-fit profile
4. Top view
5. On-hand scale
6. Editorial Aegean Glass scene
7. Size and width guide
8. Metal and karat guide
9. Personalization and care
10. Made-to-order timing

The 10K scene uses glacial smoke glass and cool chalk. The 14K scene uses cobalt glass and pale limestone. The 18K scene uses smoked amethyst glass and warmer limestone light.

## Panel rollout

1. Deploy the branch so all `https://amuletta.artifactstudio.info/eon/maeander-1008/...` image URLs return HTTP 200.
2. Apply `supabase/migrations/0131_eon_maeander_1008.sql` to the panel database.
3. Confirm nine EON rows appear in Listing Suggestions with `etsy_listing_id` empty.
4. Open each composer and confirm Width, Ring Size, images, title, description, tags and materials.
5. Use the existing two-step send control to create Etsy drafts.

The migration does not send anything to Etsy. It only creates or refreshes panel draft suggestions.

## Verification

Run:

```sh
python3 scripts/eon-maeander/validate_package.py
npm run lint
npm run typecheck
npm run build
```

Expected package result:

- 9 listings
- 2,250 unique variant SKUs
- 90 unique JPEG files at 2200 by 2200 pixels
- 117 tags
- 0 failed automated checks

The migration was also parsed as 41 valid top-level PostgreSQL statements. A live database apply remains a deployment gate because the local Colima disk image was unavailable during production verification.

See `qa/qa-report.json` for machine-readable results and `qa/00-master-listing-contact-sheet.jpg` for the complete visual review matrix.
