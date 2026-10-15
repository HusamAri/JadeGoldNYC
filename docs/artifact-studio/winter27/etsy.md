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
was cleared by hand. The route gained a read-only `?taxonomy=<term>` lookup to read the live tree.
