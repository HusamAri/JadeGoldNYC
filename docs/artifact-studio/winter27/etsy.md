# Winter 26/27: Etsy drafts (2026-10-15)

Panel: migration `0170_artifact_winter27.sql` applied through the Supabase MCP as five per-product parts
(`compact_sql.py`, same rows with the variant grid expanded in SQL). Seals after apply, all five products:
variants 315 / 02c411ef (set), W01 27 / 9bb926df, W02 243 / b4a5e63a, W03 9 / c4c5f100, W04 27 / a0a4f86b,
W05 9 / d1270f76; description, tag and gallery md5 of every product equal to `seal.json`.

Live images: 60/60 `public/artifact/winter27/W0x/NN.jpg` answered 200 on the custom domain before the push
(one URL returned 000 on the first pass and 200 on retry), W02/07 byte-identical to the repo.

Push: `ops/drafts-push?org=by Artifact Studio Jewelry&prefix=BAS-W0`, one-time tokens (`ops_tokens`,
purpose drafts-push). Dry run: 5 targets, protocols cuff_bracelet / signet_ring / dangle_earrings /
pendant_necklace / brooch, 27 / 243 / 9 / 27 / 9 variants, 12 images each, no personalization, writeEnabled.

Canary W05 (brooch, the shop's first): `needs_review` at step create, "Etsy kategorisi çözülemedi
(Brooches, kök Jewelry)". No Etsy call was made (taxonomy is resolved before create), the draftTransfer lock
was cleared by hand. The route gained a read-only `?taxonomy=<term>` lookup to read the live tree; it returned
1201 `Accessories > Pins & Clips > Brooches` (Weddings twin 1682, craft supply 6769). The brooch protocol's
root moved to `Accessories` (commit cb3756c, test asserts 1201 on a two-Brooches fake tree).

## Result (2026-10-15 W01 to W04, 2026-10-16 W05)

| Piece | Listing | Protocol | Taxonomy | Variants | Images |
|---|---|---|---|---|---|
| W01 Thaw Cuff | 4595934362 | cuff_bracelet | 1198 | 27 | 12 |
| W02 Pinecone Signet | 4595935302 | signet_ring | 2152 | 243 | 12 |
| W03 Juniper Drops | 4595938530 | dangle_earrings | 1208 | 9 | 12 |
| W04 Ember Lariat | 4595935038 | pendant_necklace | 1229 | 27 | 12 |
| W05 Pine Needle Brooch | 4596613506 | brooch | 1201 | 9 | 12 |

All five are Etsy drafts (not published). Independent read-back with a fresh token (`verify=1`,
2026-10-16 07:10 UTC): 5 targets, 5 verified, 0 mismatch; every check (draft, shop, title, tags,
description, variants, SKUs, prices, images, taxonomy, personalization) true on all five. Panel: 5 products
linked to 5 distinct listing ids, one `etsy.listing_create` audit row per listing. Unused one-time tokens
were burned after the run.

Open: prices are estimates (`ESTIMATE_MAKER_V2`, 2 x maker cost on geometry grams); the maker has not
quoted or weighed any of the five. Publication is the owner's call in the Etsy editor.
