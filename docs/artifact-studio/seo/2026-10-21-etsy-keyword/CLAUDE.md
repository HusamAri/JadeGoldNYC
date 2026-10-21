# byArtifactStudio Etsy keyword optimization

Shop: byArtifactStudio (Etsy shop id 68033014), US market, solid gold jewelry (10K/14K/18K), 210 active listings, 16 drafts.
Owner: Hüsam Arı. Project generated 21 Oct 2026 from a Cowork session that extracted every listing, the shop stats, the Etsy search terms, 20 Alura seeds (4,153 similar keywords) and 4 eRank bulk batches (80 keywords).

## The problem in one paragraph

In the last 30 days (22 Sep to 21 Oct 2026) the shop had 518 visits, 850 listing views, 1 order ($830.47) and a 0.2% conversion rate. Only 12 of those 518 visits came from Etsy Search (2.3%), and the 12 search terms behind them were one visit each, four of them irrelevant ("katze kleidung", "cute but psycho tshirt"). 114 visits were paid (Etsy Ads) and 175 came from Etsy's own marketing emails and SEO, so the shop is being shown, not found. The cause is in the listings: 1,378 of the 2,730 tags (50%) are word salad with no product noun ("handcrafted everyday", "gift tube him luxury", "sophisticated luxury"); 122 listings are SALAD class, 21 MIXED, 67 OK. 94 listings had zero views, 36 listings have zero attributes filled, 52 have fewer than four, 20 sit in "No Section", 110 have no video and one listing (4585880226, the purple button ring) is filed under Stud Earrings. Price is not the blocker: the average listing is $734 and the only order was a $830 wedding band. Etsy cannot match a $700 anklet to "gold anklet" when the tags say "dainty ankle woman" and "for her celestial".

## File map

- `data/listings.json` raw extraction of all 210 active listings (title, 13 tags, materials, category, section, price in cents, quantity, attributes, video, personalization, image count) plus the 10 shop sections and the attribute names per category.
- `data/master.json` listings merged with 30 day and 90 day stats, tag quality flags, price band, metal, section and video flags. Built by `scripts/build_master.py`.
- `data/diagnosis.json` roll ups: views and orders by tag class, price band, metal, video, section, category, plus the counts above.
- `data/shop-stats-30d.json` shop level stats and traffic sources (Etsy Search share is the KPI).
- `data/listing-stats-30d.tsv`, `data/listing-stats-90d.tsv` per listing views, orders, revenue, favorites (226 rows = 210 active + 16 drafts).
- `data/etsy-search-terms-30d.tsv`, `data/etsy-search-terms-90d.tsv` the real search terms from Stats > Etsy Search. Ground truth, currently too thin to decide title order on its own.
- `data/raw/alura-seeds.tsv`, `data/raw/alura-keywords-0.txt`, `data/raw/alura-keywords-1.txt` Alura seed stats and 1,520 similar keywords kept (format `keyword|volume|3mo change|competition|KD|score`).
- `data/raw/erank-batch1-head.tsv` to `erank-batch4-tags.tsv` eRank Bulk Keyword Tool results (Etsy avg searches, clicks, CTR, competition, KD, Google volume).
- `data/keyword-bank.json` merged keyword bank, 1,438 keywords, 960 tag valid (<= 20 chars), with an opportunity score (volume / competition). Built by `scripts/keyword_bank.py`.
- `data/optimization-matrix.json` and `.csv` the per listing plan: new title, 13 tags, attributes to fill, section fix, category fix, video gap, priority. Built by `scripts/generate_matrix.py`. Sorted by priority.
- `data/apply-state.json` created by `scripts/apply_matrix.py apply`; the resumable state (listing id -> status).
- `report/findings-tr-en.md` the bilingual findings report.
- `scripts/` see the loop below. Only `apply_matrix.py apply --yes` writes to Etsy.

## Rules (never break these)

1. Never edit a live listing except through `scripts/apply_matrix.py apply --yes`, and only after the owner has approved the batch shown by `plan`.
2. Only title, tags and shop section are written. Never touch price, quantity, images, variations, descriptions, materials, shipping or personalization settings.
3. Attributes, category changes, descriptions and video are manual tasks for the owner (list below). The API can set attributes, but the owner decides values; do not automate them in this project without an explicit go.
4. Titles: <= 140 characters, primary keyword inside the first 40 characters, never cut mid word (drop trailing comma clauses instead), no em dash, no en dash, no circumflex a. "Mens" without apostrophe (Etsy search ignores it and the apostrophe wastes characters).
5. Tags: exactly 13, <= 20 characters, lowercase, multi word, no fillers, no brand names, no materials the shop does not sell (no silver, plated, vermeil, filled, tungsten, moissanite, cz, 9k, 22k, 24k). "diamond" only on the two listings that contain diamonds.
6. No two listings share the same 13 tags unless they are true variants of the same design. `validate` enforces this.
7. Keyword evidence order: the shop's own Etsy search terms > eRank Etsy volumes (conservative, use for ranking head terms) > Alura (breadth, inflated absolute numbers, good for relative KD and score). Never report Alura volumes as Etsy searches.
8. "buyer" not "customer" in any copy. Report only actual values from the data files, never estimates presented as facts.
9. Write a 5 line state note (Done / Decisions / Open / Next action / Context) at the end of every batch into `STATE.md`.

## Title and tag pattern (what the matrix already encodes)

Primary keyword by collection, decided from the stats and the keyword bank:

- Evil Eye (33 listings): `Evil Eye <Bracelet|Necklace|Ring|Anklet|Cuff Bracelet> in Solid Gold, <colour> Enamel Nazar <detail>, <karat> <chain|pendant|stacking ring>, Protection Gift for Her`. eRank: evil eye bracelet 2,146 avg searches, KD 57; evil eye ring 1,432, KD 39, 8.5k competition; evil eye anklet 1,195 searches against 1,231 competing listings (KD 1), the single best opportunity in the catalog.
- Anklets (38): `Solid Gold <Motif> Anklet, <colour> Enamel <Motif> Charm, 10K 14K 18K Ankle Bracelet, <Beach|Garden|Summer> Gift for Her`. Alura: solid gold anklet KD 17, gold anklet 81.9k volume, 37.8k competition; motif anklets (lemon, frog, wave) are nearly uncontested.
- Christmas (30): `<Motif> <Necklace|Bracelet|Ring>, Solid Gold <colour> Enamel Christmas <Pendant|Charm Bracelet|Band>, 10K 14K 18K Holiday Jewelry, Stocking Stuffer Gift for Her`. "christmas jewelry" is KD 100 with 1.47M competing listings, so the motif noun leads (snowflake necklace 1,174 avg searches, KD 43, 8.5k competition).
- Men (30): `Mens <Chain> Bracelet, Solid Gold <size> Chain, 10K 14K 18K Bracelet for Men, Gift for Him`; `Mens Wedding Band, Solid Gold <size> <finish> Ring, ...`; `Mens Signet Ring, Solid Gold <shape> Pinky Ring, ...`; `Mens Gold Stud Earrings, Solid <size> <shape> Studs, 10K 14K 18K Single or Pair, Gift for Him`. Men's chain bracelets were the best organic performers (wheat 35 views, figaro 31, curb 29) and "14k mens bracelet" is KD 29.
- Women core and enamel colour collection (79): `Solid Gold Bracelet, <Motif> <colour> Enamel Charm on Cable Chain, <karat> Chain Bracelet, Gift for Her`; `Solid Gold <Motif> Necklace, <colour> Enamel Pendant, <karat> Charm Necklace, Gift for Her`; `Gold Enamel Ring, Solid 14K <colour> Enamel <Motif> Band, Stacking Ring 10K 14K 18K, Gift for Her` (gold enamel ring KD 34, score 81; 14k enamel ring KD 14); `Gold Signet Ring, Solid Gold <colour> Enamel <shape> Signet, Custom Engraved Pinky Ring, ...` (gold signet ring 1,511 avg searches, KD 53); `Gold Huggie Earrings, Solid Gold <size> ... Hoops, ...` (gold huggie earrings 1,287 avg, KD 71; solid gold huggies KD 37); `14K Gold Stud Earrings` or `Solid Gold Stud Earrings` for studs.

Tag recipe (13): 3 head tags for the product and collection, 1 to 2 karat or material tags (14k gold anklet, solid gold bracelet), 4 style tags of which 2 are design specific from the listing's own good tags or motif (lemon anklet, hexagon ring), 2 size or colour tags (4mm wedding band, blue bracelet), 2 occasion tags (gift for her, push present, stocking stuffer, gift for him), plus an engraving tag when the listing is personalizable.

## The loop (Claude Code, resumable)

```
python3 scripts/build_master.py        # rebuild master.json and diagnosis.json from data/ (only if listings.json or stats change)
python3 scripts/keyword_bank.py        # rebuild keyword-bank.json (only if raw research files change)
python3 scripts/generate_matrix.py     # regenerate the matrix from master + bank
python3 scripts/apply_matrix.py validate                 # must end with "0 with rule violations" and "0 tag sets shared"
python3 scripts/apply_matrix.py plan --batch 20          # show the next 20 pending listings (old title, new title, tags, section fix)
python3 scripts/apply_matrix.py apply --batch 20         # dry run, prints what would change
python3 scripts/apply_matrix.py apply --batch 20 --yes   # writes title, tags, section through the Etsy Open API (needs env vars)
python3 scripts/apply_matrix.py verify                   # re-reads every applied listing and flags mismatches
python3 scripts/apply_matrix.py status                   # applied / error / mismatch / pending
```

Then append the 5 line state note to `STATE.md` and continue with the next batch. `--start N` skips N pending rows. Batches are priority ordered, so the first 20 are the men's chain bracelets, cuffs, the evil eye bracelet with blue stone, the hammered wedding band and the men's studs: the listings that already get views and are throwing them away on salad tags.

Environment for `apply --yes` and `verify`: `ETSY_API_KEY` (app keystring), `ETSY_ACCESS_TOKEN` (OAuth2 token with `listings_w` and `listings_r` scopes, refreshed with the app's refresh token), `ETSY_SHOP_ID=68033014`. Endpoint used: `PATCH /v3/application/shops/{shop_id}/listings/{listing_id}` with `title`, `tags` (comma separated), `shop_section_id`. The script retries 429 and 5xx with backoff and sleeps 0.6 s between calls. Never commit tokens; keep them in the shell or a local `.env` that is git ignored.

If a listing was edited by hand in Shop Manager after the matrix was generated, `verify` will mark it `mismatch`; re-run `generate_matrix.py` after refreshing `data/listings.json` (re-extract with the Cowork workflow) rather than overwriting the owner's edit.

## Manual tasks for the owner (not automated)

1. Attributes: 36 listings have zero attributes, 52 have fewer than four. The matrix column `attributes_to_fill` lists the empty attribute names with suggested values per listing (Materials: Gold; Gold solidity: Solid gold; Gold purity: 14k; 18k; 10k; Primary color: Gold; Gem color and Secondary color from the enamel colour; Recipient; Holiday: Christmas; Theme: Evil eye; Occasion). Start with the 36 zero attribute listings: 14 anklets, 13 Christmas pieces, 6 evil eye pieces and 3 men's chains.
2. Category: move 4585880226 (Purple Enamel Button Ring) from Jewelry > Earrings > Stud Earrings to Jewelry > Rings > Stackable Rings.
3. Sections: `apply` sets the section for the 25 listings flagged `section_fix`: 20 in "No Section" (14 anklets, 2 bracelets, 1 necklace, 1 men's piece, 1 Christmas piece, 1 evil eye piece), the two 14K evil eye stone bracelets that sit in Bracelets instead of Evil Eye, and three non holiday pieces parked in Christmas Collection (the V necklace with lab grown diamond, the star lariat, the diamond pave bracelet). The empty "Winter Collection" section can be deleted or used for the Fall and Winter 2026 trend edit.
4. Video: 110 listings have no video. Listings with video took 487 of the 850 views (57%) while being 48% of the catalog. Priority order is the matrix order; a 6 to 10 second turntable or hand shot clip is enough. Do not shoot new photos (decision 29 Sep 2026: the photos are real and sufficient).
5. Descriptions: not touched by this project. Rewrite the first 160 characters of each description to repeat the primary keyword and state the karat, weight and made to order time, starting with the evil eye and men's collections.
6. Etsy Ads: 114 of 518 visits are paid and produced 0 orders in 30 days. After the first 100 listings are applied, pause ads on SALAD listings that still have no attributes and move the budget to the men's chains, the evil eye bracelet and the signet rings.

## Measurement baseline and targets

Baseline (22 Sep to 21 Oct 2026): 518 visits, 850 listing views, Etsy Search 12 visits (2.3%), Etsy Ads 114, 1 order, $830.47 revenue, 0.2% conversion, 49 favorites, 7 abandoned carts worth $3,901, 94 listings with zero views, 12 distinct search terms.

30 day target (after all 210 are applied, read Stats > Last 30 days on 21 Nov 2026): Etsy Search >= 80 visits (15% of visits), distinct search terms >= 60, zero view listings <= 40, favorites >= 90, orders >= 2 of which 1 organic.

60 day target (21 Dec 2026, includes the Christmas collection window): Etsy Search >= 25% of visits, orders >= 5, conversion >= 0.8%, every evil eye listing with full attributes and video.

How to measure: rerun the Cowork extraction for `shop-stats-30d.json`, `listing-stats-30d.tsv` and `etsy-search-terms-30d.tsv`, drop them into `data/`, run `build_master.py`, and compare `diagnosis.json` with the committed baseline copy in `data/baseline-2026-10-21/`.

## Research notes

- Alura "Valid Etsy tag" filter returns only 10 rows per seed; the unfiltered Similar Keywords table paginates to 140 to 270 rows, and validity was recomputed locally as <= 20 characters. The filter switch and pagination state live in the SPA, so navigating with `?q=` resets them; the scraper stores results in localStorage keyed by the `q` parameter.
- The per listing stats endpoint (`/api/v3/ajax/bespoke/shop/68033014/shop-analytics-stats/listings`) sometimes returns an empty page for a valid offset; retry up to four times before accepting an empty page. `date_range=last_3_months` works, `last_90` does not. The endpoint's "visits" column is listing views (sums to 850, matching the stats page), not shop visits.
- The 3 month range returned the same totals as 30 days: the shop only started receiving traffic on 25 Sep 2026.
- Marmalead was skipped (login needed, no credentials typed by the agent).
