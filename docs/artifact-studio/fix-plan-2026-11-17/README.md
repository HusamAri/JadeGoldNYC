# Leander Etsy fix plan, 2026-11-17

Input: `report-2026-11-17.md` in this folder, a read-only investigation of the Etsy shop and Alura written by
another session. This file checks its claims against data that session could not see (panel database, Etsy
ledger, repo catalogs, public listing pages) and turns what holds up into steps.
Nothing was written to Etsy, Alura or the database for this plan.

Sources: panel mirror of the shop synced 2026-11-16 06:20 UTC; `etsy_ledger_entries`, `sales`, `sale_items`,
`etsy_listing_stats`, `audit_log`; catalogs under `docs/artifact-studio/`; 6 public listing pages read
2026-11-12; 5 Etsy search pages read 2026-11-17 (first page each, a small sample); USPS 2026 holiday dates;
`docs/etsy-playbook/` 04 to 07.

## 1. Check of the report

| Report | Measured | Verdict |
|---|---|---|
| 217 active, 14 drafts, 1 order refunded 883.20, 0 reviews | same | holds |
| A1: the order "never moved in the mail" and was refunded | paid 18 Oct 03:55 UTC, refunded in full 05:04 UTC, labels bought 08:10 and 16:24 UTC | order of events is reversed, see 2.1 |
| A2: 393.97 USD, 660 clicks, about 0.54 USD a click | 0.60 USD a click; ledger 141.54 USD for 1 to 16 Nov, 0 orders | holds, number corrected |
| A3: 20 Evil Eye listings at quantity 1 | 20 Evil Eye and the stub at 1; hammered band 4590704706 at 19 | holds, one more listing |
| A4: 7 inch stub 4612132585 is an unfinished live listing | it is a private custom order listing; parent 4590689501 sells 7.5, 8 and 8.5 in from 440 | misread, see 2.9 |
| A5: 98 listings say 3 to 5 days, 117 say nothing | 127 say 3 to 5 days, 2 say 2 business days, 88 say nothing; the Etsy profile itself is 3 to 5 days | counts differ, see 2.2 |
| A6: old brand name | 0 descriptions carry it; it lives in shop settings and messages | holds |
| B1: reprice from weight | gold is about a fifth of the cost of a small piece | does not work as written, see 2.3 |
| B2: 211 of 217 descriptions give no weight | 6 give one | holds |
| B6: 20 listings describe the photo; 89 descriptions and 5 titles carry dash characters | at least 30 listings; 85 descriptions, 5 titles; "listed as" in 5 | holds and is still growing, see 2.5 |
| B6: add a returns sentence to 177 descriptions | every listing page already shows "Returns & exchanges accepted within 30 days" (6 of 6 read) | not needed |
| B8: "summer anklet" on 24, "stocking stuffer" on 21 | same | holds |
| C3: 3 listings without SKU | 4581283366, 4581302864, 4612132585 | holds |
| C7: Offsite Ads are off | not readable from here; the 18 Oct order was charged the Offsite fee | open |

## 2. What changes the plan

### 2.1 The refunded order was refunded first and labelled later
Item BAS-HM-R06-14KY-US10, list 1,277.65, coupon 35% (447.18), tax 52.73, paid 883.20, Offsite Ads fee 100.00.

| UTC, 18 Oct | Event |
|---|---|
| 03:55 | payment |
| 05:04 | full refund, 68 minutes after payment; fees and the Offsite fee returned by 05:06 |
| 08:10 | first shipping label, 5.70 |
| 16:24 | second shipping label, 5.70; order marked shipped |
| 3 Nov | one label refunded; the other 5.70 is not, and the 10 day USPS window has passed |

The order carried an expected ship date of 19 Oct, the next business day. So the refund was a decision made in
the first hour, not the result of a parcel that failed to move. Possible causes: the buyer asked to cancel, the
promised date could not be met (2.2), or a test purchase. Only the owner can say which.

### 2.2 Production time: the Etsy profile is right, the messages around it are not
Corrected on 17 Nov. The quantity dry run (P1) read the shop's processing profile from the API: one definition,
made to order, 3 to 5 days, on every one of the 2,079 offerings read. The first version of this section said
Etsy promised about one business day. That was inferred from the buyer estimate and is wrong for the setting.
What is still off: the order message says 2 business days (report), two silver descriptions say 2 business
days, 88 descriptions give no time, and the buyer estimate starts two days out ("Get it by Nov 19-Dec 1" on
17 Nov). Etsy builds that estimate from carrier times and shipping history as well, and the shop's only order
was marked shipped on the day it was placed. The 18 Oct order carried a ship date of 19 Oct, so the profile was
shorter then or has been edited since.
Fix order: the owner confirms that 3 to 5 days is the real number (the report says Leander's standard is 4 to
5), the order message and templates follow, and the copy pass (P3) writes the same number into every
description. Playbook 06 baseline is 5 to 7 production plus 3 to 5 transit business days.

### 2.3 Prices: the formula is not the problem, the maker quote for small pieces is
Buyer price is the Etsy price after today's 15% sale. Rule = the 12 Nov break-even rule:
list = ceil5((cost + 22.00 + 0.45) / (0.905 x 0.75)).

| Family | Listings | Buyer pays today | Cost basis | Rule would give | Page one of Etsy search |
|---|---|---|---|---|---|
| 2027 enamel set, studs | 5 | 752.68 | owner quote 350 a pair, 0.8 to 1.0 g | 467.50 | 14K enamel studs 109 to 280 |
| 2027 enamel set, bracelets | 5 | 806.44 | owner quote 375 | 501.50 | |
| 2027 enamel set, necklaces | 5 | 817.19 | owner quote 380 | 505.75 | |
| 2027 enamel set, rings | 5 | 784.93 | owner quote 365 | 488.75 | 14K enamel rings 383 to 395 (2 cards) |
| FW 26/27 enamel | 36 | 559 to 935 | estimated grams, labor from the same quotes | about 38% lower | |
| SS27 anklets | 39 | 617 to 731 | no anklet quote; labor 250.55 borrowed from a bracelet quote | about 450 | solid gold anklets 155 to 300 |
| Evil Eye bracelets | 10 | 400 to 655 | estimate | | median 281, quartiles 177 and 374 |

Reading: a pair of 0.9 g studs holds about 66 USD of gold at spot 3,873.60; the other 284 of the quote is
labor. Weight cannot carry the price down. At break-even the studs still cost the buyer 467.50 against a page
one market of 109 to 280, and the anklets about 450 against 155 to 300. Two consequences:
1. The 20 listings of the 2027 set sit on the owner's own quotes, so the rule can be applied now for a 38%
   lower buyer price. They were left out on 12 Nov as "category quote"; the owner confirms the four numbers.
2. Anklets, studs and evil eye pieces need a maker quote per archetype before any formula helps. P6 prepares it.

### 2.4 Discounts on the 28 break-even listings
The 6 silver and 22 gold listings repriced on 12 Nov break even at 25% off. Coupon MAKEITYOURS at 35% loses
money on each: silver Franco 2.2 mm 18 in, list 109, buyer 70.85, net -9.33. The 25% abandoned cart offer leaves
zero. Etsy applies the single highest discount and offers do not stack (playbook 07). Cyber Specials at 25%
(owner decision 22 Oct) is the designed floor; nothing deeper may run beside it.

### 2.5 Listings are still being rewritten on Etsy
`audit_log` records every difference the mirror sync finds. Text changed on Etsy outside the panel on:

| Sync date | Descriptions | Titles | Tag sets |
|---|---|---|---|
| 28 Oct | 8 | 11 | 12 |
| 31 Oct | 4 | 5 | 5 |
| 2 Nov | 15 | 9 | 9 |
| 16 Nov (edits made 14 to 16 Nov) | 18 | 19 | 21 |

13 of those description edits brought in photo wording and 14 brought in dash characters. The B6 defects are
not old debris: a tool or a person is producing them, most recently this weekend. Cleaning the copy before that
stops is wasted work, and the 21 tag sets changed on 14 to 16 Nov sit on top of the 3 Nov tag pass that the
21 Nov search read is meant to measure.

### 2.6 Real photos are a rule, not only a conversion lever
Playbook 04: since 2026-10-22 Etsy requires at least one unedited photo of the real product on every listing;
for made to order, a photo of a piece made before. The sets built in this repo were published with
visualizations; whether any listing has a real photo cannot be read from here. Silver is the fastest to fix
because the chains are supplier stock.

### 2.7 Drafts and Christmas
The 14 Etsy drafts are 3 candle pieces (4585875225, 4585876779, 4585878002), 4 winter pieces (4595935038,
4595935302, 4595938530, 4596613506) and 7 trend edit pieces (4597921253, 4597921327, 4597921387, 4597921435,
4597921475, 4597921557, 4597942764). 217 live listings draw 746 visits in 17 days, 0.2 visits a listing a day;
14 more add about 3 visits a day and 14 more listings without a real photo. Keep them as drafts until photos and
the first reviews exist.
Last order date: USPS Ground Advantage send-by is 17 Dec for the lower 48. Minus 5 production business days and
2 safety days (playbook 07) gives Tuesday 8 December. Each extra production day moves it one business day earlier.

### 2.8 Ads
Ledger: 141.54 USD for 1 to 16 Nov, 8.85 a day. Since the 12 Nov silver reprice: 45.36 USD, 173 silver listing
views, 5 new favorites, 0 orders. Silver took 484 of 1,478 listing views since 31 Oct, so the ads deliver
traffic that does not buy. The cushion at the 15% sale is 10.65% of the buyer price, 3.08 to 9.87 USD on the
entry sizes; at 0.60 a click one order would have to come from every 5 to 16 clicks. Playbook 05 stops a
listing when spend reaches its max CPA with no order: each silver listing spent about 24 USD in November.
If gold is tested, judge each listing when its spend reaches its own cushion (37 to 64 USD on the 22 repriced
listings), not at a fixed 150 clicks.

### 2.9 The 7 inch stub is a private custom order listing
Read on 17 Nov before writing to it. Its only photo is Etsy's placeholder graphic, not the bracelet. The public
page says "This is a private listing" and the API returns `is_private: true`. Created 7 Nov.

| Field | Stub 4612132585 | Parent 4590689501 |
|---|---|---|
| Private | yes | no |
| Category | 1179, top level Jewelry | 1196, Chain & Link Bracelets |
| Shipping profile | 319275908785 | 315603072096 |
| Return policy | none | 1514623111550 |
| Processing | 3 to 5 days | 3 to 5 days |
| Quantity, price | 1, 400.00 | 20, from 440.00 |
| Tags, section | none | 13, section 60800935 |

A private listing is not in search and not in the shop, so 13 tags and a section do nothing there. What matters
is what the buyer who opens the link sees: the text and the picture. The missing return policy is the likely
reason Etsy marks it "Update required"; that is set in the editor.

## 3. Steps

Owner steps happen in Etsy Shop Manager or Alura. Panel steps run through the ops routes with the usual chain:
dry run, canary, apply, read back with a fresh token, audit check.

| # | Who | Step | Time | Needs |
|---|---|---|---|---|
| O1 | owner | Pause the six silver ads | 2 min | |
| O2 | owner | Deactivate coupon MAKEITYOURS; no offer above 25% | 3 min | |
| O3 | owner | Find and stop whatever rewrote 18 descriptions, 19 titles and 21 tag sets on 14 to 16 Nov; keep the Alura no-sales automation paused | 5 min | |
| O4 | owner | Confirm the production time. The Etsy profile reads 3 to 5 days; change it only if the real number differs | 2 min | |
| O5 | owner | One line on the 18 Oct order: who asked for the refund | 2 min | |
| P1 | panel | DONE 17 Nov. Quantity 20 on the 20 Evil Eye listings and on 4590704706 (19), through `ops/quantity-set` | | |
| P2 | panel | DONE 17 Nov. Stub 4612132585: title and description written through `ops/listing-text`. No tags and no section, the listing is private (2.9) | | |
| O12 | owner | Stub 4612132585: replace the placeholder picture with the bracelet photos, attach a return policy in the editor, send the link to the buyer who asked for 7 inch | 5 min | |
| P3 | panel | One copy pass over the live text of all 217: photo clauses (30+), "listed as" (5), dash characters (85 descriptions, 5 titles), one production line, weight line on the 28 listings with firm grams | half a day, one dry run to read | O3, O4 |
| P4 | panel | 2027 enamel set, 20 listings: break-even rule, buyer price about 38% lower. Mirror refresh first (`price-sync ?mirror=1`) | 1 h | owner confirms quotes 350, 375, 380, 365 |
| P6 | panel | Quote sheet for the maker: anklet, stud, evil eye bracelet and enamel ring archetypes with our assumed grams and labor | 30 min | |
| O6 | owner | Send P6 to the maker | 5 min | P6 |
| O7 | owner | Order message, About headline and message signature: Leander and the O4 number | 10 min | O4 |
| O8 | owner | Announcement: "Order by December 8 for Christmas delivery"; drafts stay drafts; Cyber Specials at 25% | 5 min | O4 |
| O9 | owner | Real photos: the six silver chains first, then every gold piece that gets made | ongoing | |
| O10 | owner | First reviews: share the silver bracelets (from 28.90) with the Leander audience through Share & Save links; no incentive for a review | ongoing | O9 |
| P7 | panel | After the 21 Nov search read: swap "summer anklet" (24) and "stocking stuffer" (21); compare the 21 tag sets changed on 14 to 16 Nov with the 3 Nov pass | 1 h | 21 Nov |
| P8 | panel | Weights on the remaining gold listings | 1 h | maker confirms grams |
| O11 | owner | Reply to the open stamp thread; shop profile; Leander costs in Alura (report C1, C2, C4, C5) | 30 min | |

Evil Eye listings at quantity 1: 4592082029, 4592082893, 4592096604, 4592333961, 4592334779, 4592338309,
4592348106, 4592348314, 4592349382, 4592349816, 4592350012, 4592351486, 4592352688, 4592357610, 4592377541,
4592377769, 4592378585, 4592378879, 4592392914, 4592393844.

Listings with a photo sentence or "listed as" found in the mirror (the dry run of P3 reads the live text and
decides): 4579027067, 4585875186, 4585879436, 4586568322, 4586568636, 4586575520, 4590335799, 4590337023,
4590337459, 4590337951, 4590338425, 4590349492, 4590687777, 4590688355, 4590692297, 4590692641, 4590700108,
4590703614, 4590704706, 4591200606, 4592333265, 4592348106, 4592353386, 4597921031, 4604339049, 4604339755,
4604339881, 4604362346, 4604362590. The report also names Pinky Signet Ring, Poinsettia Ring and Berry Pink
Heart Ring.

## 4. Not readable from here
Alura (scores, automations, costs, follow-ups), buyer messages, the order message and About text, the list of
coupons and targeted offers, per listing ad clicks, the Offsite Ads switch, whether Cyber Specials is joined,
whether any listing has a real photo.

## 5. Log
- 2026-11-17: report checked, plan written. No writes.
- 2026-11-17: P1 applied on the owner's "start with 4". Route `app/api/ops/quantity-set` (commit b3e6b1c, tests
  `tests/quantity-set.test.ts` 11 of 11). Dry run 21 of 21 would-set: 20 listings at 1, 4590704706 at 19, 2,079
  offerings, no quantity on a variation, no mixed quantities. Canary 4592082029 set, re-read with a fresh token
  20 seconds later. The other 20 set in three calls. Fresh-token re-read of all 21: quantity 20, 2,079 offerings.
  Every write kept the price and structure fingerprint. Panel `products.quantity` is 20 on all 21; 21
  `etsy.stock_push` audit rows (source `ops/quantity-set`); 12 tokens minted, 11 used, 1 closed, 0 open.
  The same dry run read the processing profile and corrected section 2.2.
- 2026-11-17: P2 applied on the owner's "Go", narrowed after reading the listing (2.9). Route
  `app/api/ops/listing-text` (commit a7160b4, tests `tests/listing-text.test.ts` 8 of 8), spec
  `listing-text.json` key `elongated-cable-7in`. Dry run: plan would-write title and description, 0 spec
  problems, live text equal to the expected old text. Apply: written, state active and private unchanged.
  Fresh-token re-read 25 seconds later: already. Public page shows the new title and the 549 character
  description, price 340.00 at the sale unchanged. Panel row equals the spec (description md5 e76be7cf),
  1 `etsy.rewrite` audit row holding the old title and the old one-line description, 0 open tokens.
  Left out on purpose: metal color, production days and a free shipping claim, none of which can be read
  for this listing; tags, section, quantity and price untouched.
