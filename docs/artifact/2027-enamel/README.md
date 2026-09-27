# Artifact Studio 2027 Color & Enamel

20 panel proposals: five rings, five necklaces, five flexible chain bracelets, five pairs of stud earrings. Each has exactly one AI concept image, English copy, 13 tags and a unique SKU.

Owner request: 14K gold + kiln-fired vitreous enamel, low labor, wearable scale, colorful minimalism; no Etsy publication. The final visual review replaced R01, N04, E01 and E05 to reduce cabochon-like enamel. N04 uses a closer crop to expose the enamel surface. All files are 1254 x 1254 PNG, not 2K. Physical alloy/firing/weight/durability qualification remains pending.

Import at /listing-onerileri/artifact-2027 using an authenticated Artifact Studio owner/admin account. Only the committed fixed catalog can be imported. All price and weight fields stay null and quantity is zero. Deterministic IDs plus insert-only conflict handling make retries safe. Existing unrelated or live records fail validation and are not overwritten. Exact single-image readback is required. The approval metadata disables Etsy draft creation and live publication. The production products_product_type_check rejects earring. Earrings retain productType=earring and listingProtocol=stud_earrings in listing_metadata, with the legacy product_type classifier left null rather than mislabeled as a ring or bracelet. Their future Etsy protocol and legacy classifier must be qualified before sending. The first all-or-nothing product insert was rejected by that constraint and created no package rows.

Research: Etsy Spring/Summer 2026 category signals are historical evidence, not proof of 2027 sales. WGSN/Coloro SS27 palette and runway/fabric reports inform the design direction.

Sources:
- https://www.etsy.com/seller-handbook/article/1473931456647
- https://www.wgsn.com/jp/node/2563
- https://www.premierevision.com/articles/e620fe9e-3407-f111-8333-000d3a2973d4/spring-summer-27-decodings-fabrics
- https://www.chanel.com/au/fashion/collection/cruise-2026-27/
- https://www.dior.com/en_us/fashion/womens-fashion/ready-to-wear-shows/cruise-2027-show
- https://thompsonenamel.com/enameling-help-and-information/

Drive finals: https://drive.google.com/drive/folders/1KT8_PgOIMo3Cb-09ooy70J5CV-wN_0bq

## User weight/cost/size update · 2026-09-27

The user requested estimated weights and supplied current total costs including gold and labor: earrings $350 per pair, chain bracelets $375, necklaces $380 and rings $365. USD follows the panel currency; these are fixed quote snapshots, not selling prices or gram rates. Do not add gold or labor again. No automatic size/spot repricing is authorized.

The user confirmed US 4–10 including half sizes: 13 variants per ring, 65 ring variants plus 15 other variants = 80 total. US 7 reuses each original variant ID; the other 12 sizes use stable new IDs. Product-level ring weight is the US 7 reference. Estimated net 14K gold excludes enamel, includes chains/clasps for necklaces/bracelets and both posts/backs for earring pairs. Variant weight_source=inferred and product production.weightVerified=false.

The guarded update preflights all 20 drafts, retains existing selling prices, changes no image, preserves Etsy authorization flags, and independently reads back 20 products, 80 variants and 20 images. The listing detail cost display and discount comparison use the saved quote instead of adding a gram-based cost on top. Other products keep existing behavior. Physical sample, exact alloy, chain specification and size tolerance remain unverified.

Weight method: 13.0 g/cm³ 14K yellow gold; 1.0–1.1 mm plate less 0.4 mm enamel recess; approximate silhouette areas; ring shank 1.8×1.45 mm rounded section with 0.85 shape factor. Ring sizes change effective circumference by about 2.55347 mm per full US size; displayed two-decimal weights are estimates, not scale precision. Planning range -20%/+25%. Reference 18-inch 1.2 mm cable necklace chain with clasp is 2.0 g; 17 cm bracelet chain/clasp/extender estimate 1.0 g. Earring backs 0.25 g per pair.

Sources: https://www.stuller.com/metals-comparison-charts/ ; https://www.rcjewelry.com/Product/Extendable-Cable-Chain-in-14k-Yellow-Gold-(120-mm)-40545.aspx
