# EON FINE JEWELRY — STRATEGY HANDOFF
## Prepared 2026-08-12. Transfers the strategy thread from Claude (Cowork) to Claude Code.

This document is the complete working memory of the EON strategy track between
2026-07-28 and 2026-08-12. It exists so the strategy layer and the panel layer
stop living in two places. Read it fully before acting. Nothing here is a
suggestion to be re-derived; the locked sections are decisions already paid for.

---

## 0. HOW TO USE THIS FILE

Treat it as four things at once: the business context, the locked rules, the
decision log, and the open questions. When you disagree with something here,
say so with data rather than silently working around it. Several conclusions in
this file were reversed once evidence arrived, and those reversals are recorded
on purpose. That is the standard.

Never invent a fact about the product, the pricing, or the buyer. If a number is
not in this file or in the database, say unknown and ask.

---

## 1. THE BUSINESS

**EONFineJewelry** on Etsy. Solid gold wedding bands, 10K / 14K / 18K.
Shop location New Jersey, United States. Ships from North Arlington, NJ.

The account was a dormant shop (YasoJewelry) acquired mid-July 2026 and rebuilt
under the EON name. This is why the shop header reads "11 months on Etsy" with a
small sale count. Every sale on the account happened after the takeover.

**Production.** Yasin makes every ring by hand in New Jersey. Ring making is his
trade, not a sideline. Capacity is roughly 60 to 70 plain rings a day, and 6 to 7
patterned rings a day (milgrain, hammered, textured). Capacity is not a
constraint at current volumes and should not be treated as one.

**Owner.** Husam Ari, Istanbul. Marketing manager by day, EON is his own venture.
Partner arrangement with Yasin, profit split pending a proper cost ledger.

**Brand.** Silent luxury in a dark register. Gold does not speak, it signals.
Tagline: Meaning Designed To Last / Zamani Asan Anlam.

---

## 2. HARD RULES — NEVER BREAK

1. **No unattended writes to Etsy. Ever.** No cron, no schedule, no automated
   price or listing push. A human taps approve on every write. This is permanent
   architecture, not a temporary safety measure.
2. **No hand-typed prices.** Every price derives from the pricing engine.
3. **Never copy one variant's price to other variants.** Correct prices inside a
   single listing span up to 5.9x because gram weight scales with width. A
   copy-across feature is a loss event, not a convenience.
4. **Never invent a product fact.** Measurements, karat, finish, capabilities,
   certificate text and logo geometry come from Husam or the database only.
5. **ha_\* tables belong to handover-atlas.** Frozen. Do not read, migrate or drop.
6. **The saved eon-logo-preview.png and SVG master are CORRUPT.** Never use them
   as a logo reference. Never generate a logo-bearing asset without an approved
   master fed to the model as a reference image.
7. **Never publish anything that could narrow down a single buyer.** No state,
   no order date plus size plus product combination. Tell stories through the
   product, not the person.
8. **Formatting.** No em dash, no en dash, no circumflex a. In Turkish, correct
   characters (ı ş ç ğ ö ü İ Ş Ç Ğ Ö Ü) and no comma before "ve". "Barceló" with
   the accent in prose. Guest, never customer.
9. **No placeholders, no draft-quality output.** Everything is presentation ready.

---

## 3. THE PRICING ENGINE

### The formula, verified against live orders

```
gram_price   = spot_usd_per_ozt / 31.1035
purity       = 10K 0.417 | 14K 0.583 | 18K 0.75
material     = grams * gram_price * purity * 1.07          (7 percent fire loss)
labor        = 30.00   (milgrain / hammered / handfinished: 40.00)
packaging    = 8.00
shipping     = 22.00
landed       = material + labor + packaging + shipping     KEEP UNROUNDED
multiplier   = 1.55 for widths 2 to 7mm, 2.00 for widths 8 to 12mm
engine_price = round(landed * multiplier, 0)
list_price   = ceiling(engine_price / 0.75, 5)
sale_price   = list_price * 0.75                            (permanent 25 percent sale)

floor         = round((landed + 0.45) / 0.895)
offsite_floor = round((landed + 0.45) / 0.745)
```

**Critical:** engine_price is computed from UNROUNDED landed. Rounding landed
first produces off-by-one errors at boundaries.

**Thickness is 1.5mm for every width and every profile.** Confirmed by Yasin.
Any 2.0mm table or asset derived from one is INVALID.

**The gram table applies to every profile.** Flat, beveled, knife edge and dome
share identical grams at the same width and size. Only milgrain and hammered
differ, and only in labor. Source: `2026-07-16-eon-dome-grams.csv`, 858 rows.

**Half sizes** are the average of neighbours, rounded up to the nearest 5.

### Current state as of 2026-08-12

- `pricing_config.spot_usd_per_ozt` = 4399.8999, updated 2026-08-08.
- Live Etsy prices solve to approximately **4410** per troy ounce, verified
  independently three ways.
- Anchors that must hold at the ~4410 basis:
  - 10K 5mm US7 dome, list 640
  - 10K 5mm US7 milgrain, list 660
  - 10K 8mm US7 dome, list 1220
- Consistency check that holds at any spot: 10K 5mm dome and 10K 5mm milgrain
  must derive the identical material cost. They differ only by labor, 30 against
  40. If those two diverge by more than rounding, the gram lookup is wrong.

### The anchor architecture

List price is the anchor. The permanent 25 percent storewide sale makes the
visible price equal the engine target, producing roughly 24 to 25 percent net
margin. Verified on a live order: list 315.00, charged 236.25, exactly times
0.75, contribution about 59 USD at 24.8 percent.

The sale is 30-day rolling and must be renewed. **Renewal reminder set for
2026-08-26** (trig_01K58FSdLhHSk2t5HiG9mCsd). If it lapses, prices jump 33
percent overnight and every running experiment is contaminated.

### The single lever

The only editable pricing input is the gold spot price. Change spot, every
variant recalculates from its own gram weight, karat purity, width multiplier
and labor class. Labor, packaging, shipping allowance, fire loss and the two
multipliers are config, changed only through a confirmed settings screen that
writes to audit_log.

---

## 4. THE CATALOGUE

### Families

| Family | Profile |
|---|---|
| Meridian | Dome |
| Testament | Flat |
| Keystone | Beveled |
| Obelisk | Knife Edge |
| Cornice | Milgrain |
| Lintel | New, launched 2026-08-11 |

### SKU scheme, as far as it has been decoded

`[METAL]-R-[KARAT+PROFILE]-[WIDTH]-[SIZE]`

- METAL: GLD yellow, WHG white, RSG rose
- KARAT+PROFILE: first two digits karat (10 / 14 / 18), last two profile
  (01 dome, 02 flat, 04 milgrain, 08 Lintel)

**This scheme is not trusted.** See section 8, open contradiction 1.

### State as of 2026-08-12

82 products in the panel. 41 live on Etsy, 30 drafts (14 real Etsy drafts, 16
panel-only proposals), 10 archived with no Etsy link, 1 sold out.

Nine Lintel listings went live 2026-08-11, three karats times three colours,
225 variants each, all matched to Etsy. Price ranges:

- 10K: 470 to 2,350
- 14K: 670 to 3,635
- 18K: 970 to 5,255

**The 18K range is a known problem.** 5.4x spread inside one listing. Search
advertises "from 970" and a configured buyer can land on 5,255. This is the same
bait dynamic identified on the older listings, at greater magnitude. These
listings are new with no sales history, so narrowing them costs nothing now and
gets expensive later.

---

## 5. VERIFIED PRODUCT FACTS

These are confirmed and may be used in copy. Nothing else may.

- **Solid gold throughout.** Not plated, not filled, not hollow.
- **The interior is rounded on every ring.** "Comfort fit" is therefore a legal
  claim on every listing. It is also the highest scoring keyword in the catalogue.
- **Inside engraving is free.** Competitors charge 15 to 40 USD for it.
- **Free shipping within the United States**, dispatched from New Jersey.
- **Returns and exchanges accepted within 30 days.** Klarna available.
- **Thickness 1.5mm, every width.** Widths 2 to 12mm. US sizes 4 to 16 including
  half sizes.
- **Made by hand in New Jersey.** A plain band can be finished in a day.

**Not verified, do not claim:** any specific engraving character limit, any
resize policy (the old "30 day resize" claim must be removed wherever it survives),
any delivery promise beyond what Etsy itself displays.

---

## 6. COMMERCIAL STATE

### Sales

Ten orders total. First ever sale 2026-07-21.

| Period | Orders | Revenue (item) | AOV |
|---|---|---|---|
| July | 5 | 1,259.53 | 251.91 |
| August to 12th | 5 | 2,111.25 | 422.25 |

Average order value up 68 percent month over month. August produced more
revenue from the same order count.

July discounting was inconsistent (0, 30 and 50 percent on different orders,
two of them deliberate loss leaders to acquire reviews). August is a clean 25
percent throughout.

### Star Seller

**The order and revenue leg is met.** The window is 1 August to 31 October and
requires 5 orders and 300 USD. As of 12 August: 5 orders, 2,111.25 USD, seven
times the revenue requirement.

Remaining conditions are time and service quality. First sale was 21 July, so
the 90 day rule clears 19 October and the realistic badge date is **1 November**.
The last populated snapshot showed 100 percent on time shipping, 100 percent
message response and a 5.0 rating across 2 reviews.

**Reviews are the real constraint, not orders.** Two reviews on a 450 dollar
heirloom purchase is the ceiling holding conversion down and it cannot be bought.
Every order from here should be worked into a review through service, never
through solicitation, which Etsy prohibits.

### Ads

Etsy Ads running. Budget was set at 5 USD a day on 2 August and raised to 15 on
3 August. That raise tripled the exposure and restarted Etsy's 7 to 14 day
learning period.

From the Etsy CSV, which is authoritative because the panel sync is behind:

| Window | Clicks | Spend | Orders | Revenue | ROAS |
|---|---|---|---|---|---|
| 12 Jul to 11 Aug | 217 | 229.20 | 2 | 800.00 | 3.49 |
| August alone | 100 | 105.00 | 1 | 465.00 | 4.43 |

Cost per click about 1.05 USD. Click through rate 2.2 to 2.4 percent, which is
above the Etsy benchmark. The ads get clicked. Whether they convert is still
open.

**Break-even is 4x return on ad spend, not the 3x quoted everywhere.** Our
contribution margin is about 25 percent, so 3x loses money. That benchmark is
calibrated for 30 dollar products. Target 5x or better.

Kill rules: switch off any single listing that spends 110 USD with zero orders.
Stop the whole test at day 30 if total ROAS is under 4x. **Do not touch the
budget again before 1 September.**

Economics by price point at 1.05 per click: a 450 dollar band carries about 112
USD contribution and tolerates roughly 106 clicks per order. A 236 dollar band
carries about 59 USD and tolerates 56. **The cheap 2mm end is the weakest place
to spend paid traffic.** If ads continue past the test, point them at the wide
and expensive bands.

### Editorial

One listing received **Etsy's Pick** on or around 5 August, a wide single-tone
band with chevron cuts, frosted against polish, faceted edges. Etsy's Pick is
awarded by human style editors, not an algorithm, and drives placement in Etsy
marketing emails and homepage collections. Ad impressions on that listing roughly
doubled on 7 to 9 August while click through rate halved, which is the normal
signature of broadened reach.

Notably the shop is not Star Seller, which is a common criterion, so the
photography alone carried the pick.

---

## 7. THE SEO SYSTEM

### The structural finding

Every generic karat and colour term is in decline. Every profile and detail term
is rising. EON sells profiles, so titles lead with the profile and let karat and
colour ride in the tail. This is permanent.

Rising: milgrain +22.1, comfort fit +17.6, rose gold +9.3, yellow gold +7.2,
thin gold band +1.8.
Falling: mens gold -38.8, solid gold ring -33.3, white gold -27.1, engraved
-26.8, 18k -23.7, dome -21.6.

### Measured keywords (Alura, 20 seeds, 2026-07-31)

| Keyword | Volume | 3mo | Competition | KD | Score |
|---|---|---|---|---|---|
| comfort fit wedding band | 224,963 | +17.6 | 35,387 | 32 | 78 |
| milgrain wedding band | 129,792 | +22.1 | 18,392 | 17 | 77 |
| flat wedding band | not read | not read | 11,218 | 24 | 76 |
| thin gold band | 213,842 | +1.8 | 45,313 | 37 | 72 |
| beveled wedding band | 146,492 | -6.6 | 29,506 | 34 | 71 |
| dome wedding band | 227,408 | -21.6 | 38,581 | 34 | 70 |
| wide gold band | 191,875 | -8.7 | 43,908 | 29 | 70 |
| engraved wedding band | 262,079 | -26.8 | 56,141 | 39 | 68 |
| his and hers wedding bands | not read | not read | 21,759 | 32 | 68 |
| rose gold wedding band | 1,105,979 | +9.3 | 475,833 | 55 | 68 |
| 10k gold wedding band | 778,296 | -8.6 | 261,641 | 39 | 67 |
| yellow gold wedding band | 1,075,983 | +7.2 | 512,968 | 55 | 66 |
| 14k gold wedding band | 932,488 | -7.9 | 444,464 | 55 | 63 |
| 18k gold wedding band | 690,475 | -23.7 | 308,637 | 47 | 62 |
| mens gold wedding band | 496,883 | -38.8 | 230,294 | 55 | 62 |
| womens gold wedding band | 1,064,121 | -15.7 | 551,358 | 57 | 61 |
| white gold wedding band | 924,067 | -27.1 | 491,639 | 55 | 60 |
| knife edge ring | 20,317 | -12.6 | 9,888 | 24 | 57 |
| solid gold ring | 1,585,629 | -33.3 | 1,062,799 | 70 | 57 |
| hammered wedding band | 0 | no data | 0 | 2 | 0 |

**Banned as head terms.** `solid gold ring` is a vanity trap at over a million
competing listings. The words "Solid Gold" survive only as an adjective, because
they separate us from the plated and hollow comp pool. `hammered wedding band`
returns no data at all in Alura; do not build a listing around it.

**Best cell in the catalogue: milgrain.** Difficulty 17, the lowest measured.
Competition 18,392. Rising 22.1 percent. And the competitive report found the
market sells milgrain at 910 to 932 while EON was selling at 465.

### Etsy's current title rules

Etsy revised its title guidance in late 2025 and added a warning layer in the
listing editor. Etsy's own words: keep titles short and easy to read, use less
than 15 words, clearly name the item for sale, include the most important traits
early, avoid repeating words, save subjective language for the description.
Search engines show only the first 50 to 60 characters.

The old long comma-stuffed title format is dead. A 19 word title that repeats
words and carries "for Her" and "Free Engraving" breaks four rules at once.

### The title formula

```
[Profile] Wedding Band, [Karat] Solid Gold, [Width]mm Comfort Fit, Engravable
```

Karat and colour never lead. Their difficulty runs 47 to 57 while profile terms
run 17 to 37. Audience, occasion and promotional words never enter the title.
They go to tags, attributes, personalization and the description.

Tags: 13 per listing, each 20 characters maximum, natural search phrases only.
Etsy's test is whether you can imagine someone typing it into Google.

### Ranking mechanics

Keywords buy eligibility. Placement is decided by click through rate, favorites,
add to cart and conversion. Etsy needs 7 to 14 days to settle after a meaningful
edit and 30 days to be judged. Do not modify listings that are selling well.

### Still unmeasured

Width long tails (2mm, 4mm, 6mm, 8mm gold band). Finish and texture terms
(chevron, textured, brushed, matte, faceted). Origin and speed (made in usa,
american made, handmade, last minute). Intent (unisex, minimalist, anniversary
band, promise ring). Personalization (personalized wedding band, custom engraved
ring).

The keyword_research table holds 50 rows for EON, last run 2026-08-02. The
`keywordResearch` feature flag is currently **off** for EON.

---

## 8. OPEN CONTRADICTIONS AND QUESTIONS

### 1. SKU and title disagree — highest priority

The 2026-08-07 order carries SKU `WHG-R-1402-5MM-7` with the title
"10K Solid Gold Hammered Wedding Band, Milgrain Comfort Fit".

The SKU encodes 14K white flat. The title says 10K yellow hammered milgrain.
Karat, colour and profile all contradict. The 2026-07-24 order has no SKU at all.

This is not cosmetic. Reading by SKU makes August 66 percent plain. Reading by
title makes it majority patterned. The two readings support opposite catalogue
strategies. **Until this is audited, no family level conclusion is trustworthy.**

Required: decode the SKU scheme, compare karat, colour and profile against the
title and against product_variants for every live listing, and report every
mismatch before fixing anything.

### 2. The pricing dry run engine computes nothing

Two rows in `pricing_runs`, both at spot 4343.2998, both 7,475 rows, both
returning 7,475 unknown and zero computed. One cancelled, one still dry_run,
neither approved or completed. Root cause visible in the row notes: Etsy
inventory could not be read.

Not urgent for money, because live prices are already current at ~4410. Urgent
before the next gold move, because this is the mechanism the entire pricing
system depends on.

### 3. Ad data sync is stopped

`ad_daily_stats` has nothing after 2026-08-05. The panel therefore disagrees with
the Etsy CSV on every ads figure. The 1 September decision depends on this being
current. Also, the table is shop level only, with no listing dimension, so it
cannot say which listing earned an order.

### 4. Cost ledger has no payer column

Yasin pays production costs personally, Husam pays others. Without a payer
column and a reimbursement state, the profit split cannot be computed honestly.
Two questions Husam must answer before this is built: whether Yasin's costs are
recorded in USD or TRY and which FX rate settles them, and whether the split is
flat or comes after each partner is made whole on what they personally paid.

### 5. Housekeeping

`opsEonPricePush15` is a leftover single-use confirmation token in EON's feature
flags. Its expiry passed on 28 July. Delete it.

---

## 9. DECISION LOG

### Locked decisions

| Decision | Date | Rationale |
|---|---|---|
| Thickness is 1.5mm, all widths | 07-30 | Production reality per Yasin. 2.0mm assets invalidated. |
| Split multiplier 1.55 / 2.00 at 8mm | 07-30 | Husam's wide premium instinct, encoded explicitly after a data argument. |
| Permanent 25 percent sale as anchor | 07-30 | List price becomes the anchor, visible price equals engine target. |
| Do not touch prices on competitive grounds | 07-30 | Core 4 to 7mm sits average to high in every karat band. Correct position. |
| Profile leads the title, karat and colour follow | 07-31 | Profile KD 17 to 37 against karat and colour KD 47 to 57. |
| Comfort fit is legal on every listing | 07-31 | Husam confirmed the interior is rounded. |
| Engraving is free and must be visible | 07-31 | Husam confirmed. Competitors charge 15 to 40 USD. |
| Break-even ROAS is 4x, not 3x | 08-02 | 25 percent contribution margin. The 3x benchmark is for cheap products. |
| Ads at 5 USD a day, four listings | 08-02 | One karat and colour held constant so profile is the only variable. |
| Do not build a karat comparison from three photos | 08-05 | Lighting changed more than the metal. Only a single frame proves karat. |
| 18K as separate listings, not variants | 08-05 | Existing listings already span 5.9x. Adding 18K worsens the bait. |

### Reversals, recorded on purpose

Seven positions changed once evidence arrived. Each is listed so the standard is
visible: update on data, say so out loud, do not quietly redraft history.

1. **Title format.** The first title written was the 2023 comma-stuffed playbook,
   19 words with repeated words, an audience phrase and a promotional phrase. It
   broke four of Etsy's current rules. Corrected after reading Etsy's own guidance.
2. **Photography.** Criticised from eight search grid thumbnails before seeing the
   full listing pages. The work is good. Etsy's own editors later picked it.
3. **Ads.** Yes, then no on a suspicion the page was broken, then yes again once a
   full funnel audit found no defect.
4. **Cost per click.** Estimated at 0.50, corrected to 1.45 from a partial day,
   corrected again to about 1.05 from the full CSV.
5. **Stale pricing.** Claimed live prices were on a 4090 basis and 6.19 percent
   underpriced. They were already on ~4410. The alarm was wrong and no money was
   left on the table.
6. **Capacity.** Warned that one ring a day would break Star Seller on time
   shipping under an Etsy's Pick surge. Real capacity is 60 to 70 plain rings a
   day. Capacity is not a constraint.
7. **Patterned versus plain.** Concluded that the expensive patterned end was
   winning, based on reading the 08-07 order by its title. Read by its SKU the
   conclusion flips. Currently unproven, pending the SKU audit.

### Findings that still stand

- Bench economics are badly misaligned with labor pricing. A patterned ring takes
  about 74 minutes against about 7 for a plain one, a tenfold difference, for a
  labor charge that differs by 33 percent. Effective hourly value is roughly 244
  USD on plain against 32 on patterned. Both the bench and the market say
  patterned labor is underpriced. A modelled option: raise milgrain labor from 40
  to 120, which moves 10K 5mm milgrain from 465 to about 592 at the old spot and
  still leaves it well below the market band. **Not yet applied. Scheduled for the
  1 September review.**
- Three genuine advantages are still under-advertised: free engraving, free fast
  US shipping from New Jersey, and solid gold in a comp pool polluted by plated
  and hollow listings.
- Two mandatory dropdowns sit above Add to cart. Most buyers cannot answer either.
  Ring size requires leaving to measure. Width is worse, because a buyer does not
  know that they do not know what 4mm versus 5mm means on a hand.

---

## 10. DEPLOYED COPY

### Description block, top of every advertised listing

```
Free inside engraving. Free shipping within the US, dispatched from New Jersey.

Solid gold throughout. Not plated, not filled, not hollow.

Not sure which width? 2mm and 3mm sit low and delicate. 4mm and 5mm are the classic wedding band. 6mm and wider read broader on the hand. Every width is the same 1.5mm thickness with a rounded comfort fit interior.

Not sure of your size? Message us before you order and we will walk you through measuring it at home.
```

### Shop About section

```
Every band here is solid gold. Not plated, not filled, not hollow. 10K, 14K or 18K, and the same metal runs from the outside of the ring to the inside.

They are made in New Jersey, by hand, one at a time. Ring making is not a sideline here, it is a trade, and a band can be finished in a day.

Five profiles: dome, flat, beveled, knife edge and milgrain. Widths from 2mm to 12mm, US sizes 4 to 16 including half sizes. Every band is 1.5mm thick with a rounded comfort fit interior, so it sits without catching.

Inside engraving is included at no cost. Initials, a date, a line only the two of you will read. Shipping within the United States is free.

The shop is new under this name. The bench behind it is not.
```

Note: an earlier draft in `2026-07-31-eon-etsy-seo-oyun-kitabi-v3.xlsx` sheet 5
says "Made to order in Istanbul". That is **wrong** and must be deleted from the
file. Production is in New Jersey.

---

## 11. VOICE

Body copy is quiet, exact and unhurried. No marketing hype. No emoji, anywhere.
Concrete nouns and real numbers do the work; adjectives do not. Observe, do not
perform. Show, do not explain.

Bilingual EN/TR, English first for Etsy. Display and wordmark are Cinzel caps
with wide tracking. Technical labels are mono, letter-spaced caps.

Working language with Husam: Turkish when he writes Turkish, English for code,
technical and strategic content. Code topics default to English even mid-Turkish.

**How Husam works.** He has ADHD and the following is structural support, not
style preference. One question at a time, never a list of clarifying questions.
Every task response ends with a single NEXT STEP that is doable in under five
minutes. Big requests get numbered micro-steps first, not a wall of plan. Do not
open new threads of possibility at the end of an answer; one next step, not five
options to wander into. Lead with the answer, then the reasoning. Challenge weak
ideas directly, with data rather than instinct.

---

## 12. SCHEDULED AND REFERENCE

**2026-08-26** storewide 25 percent sale renewal (trig_01K58FSdLhHSk2t5HiG9mCsd).
Mandatory. The sale ends 28 August, inside the ads window. If it lapses the ads
test is contaminated and prices jump 33 percent.

**2026-09-01** thirty day review (trig_01VYsXbAF4VivKkBb1HfkJg6). Three decisions
due: the ads verdict against the 4x rule, the patterned labor repricing, and 18K
expansion.

### Identifiers

- Supabase project `sewbrqflcrlgczilrusw`
- EON org_id `9d0336c0-8772-456d-a80c-a5f2cfe7bbd0`, slug `eon-266055`
- Feature flags: externalPricing true, keywordResearch false, buyerFollowup false
- Drive root "oo6 | EON" `1V1qPmVK0ZUqXY8LOA_eIj9itYFcKigJ5`
- Drive 05-strategy-sessions `1IGq8bc_heYqZGnjCVlQ4WOY4oCeS1wZb`
- Session log v5 (2026-08-02) lives in 05-strategy-sessions

### Ring size reference, US inner diameter mm

5 = 15.7, 6 = 16.5, 7 = 17.3, 8 = 18.1, 9 = 19.0, 10 = 19.8, 11 = 20.6,
12 = 21.4, 13 = 22.2

---

## 13. WHAT IS NOT DONE

1. SKU integrity audit. Blocks every family level conclusion.
2. Ad data sync restored, ideally with a listing dimension.
3. Pricing dry run engine fixed.
4. Description block applied to every advertised listing.
5. About section published.
6. 18K Lintel width range narrowed before it accumulates history.
7. Core 2 to 7mm split from wide 8 to 12mm into separate listings.
8. Second keyword batch: widths, finishes, origin, intent, personalization.
9. Cost ledger payer column and partner settlement view.
10. Per-order contribution model in the panel.
11. `prune-widths` for hammered 2mm and 3mm, held pending the SKU audit.
12. The expired `opsEonPricePush15` token deleted.
13. The Istanbul line removed from the SEO playbook file.
14. The "30 day resize" claim removed wherever it survives.

---

## 14. THE ONE PARAGRAPH VERSION

The pricing engine works and is verified on live orders. The catalogue is priced
correctly at a current gold basis. Star Seller's order and revenue requirement is
already met with two and a half months to spare, so the badge now depends on
service quality and the calendar. Traffic is not the problem; the shop converts
organically and an Etsy editor picked its photography. What is unresolved is
whether the money is in the plain bands or the patterned ones, and that question
cannot be answered until the SKU data stops contradicting the titles. Everything
else is execution.

---

## APPENDIX A, SKU AUDIT
### Produced 2026-08-12 in Claude Code against live Supabase. Read only, nothing was fixed.

### The verdict in one line

**The title is trustworthy. The SKU is trustworthy on 41 of 42 live listings and
wrong on exactly one, and that one listing is the 7 August order.** Section 8
item 1 is resolved: read by title, not by SKU, and August is 66 percent
patterned by revenue, not 66 percent plain.

### Scope

EON 42 live listings (41 active, 1 sold out), 14 Etsy backed drafts, 13,750
variant rows. Jade Gold NYC 118 live listings and 1,945 variants checked as a
control. Every live listing was decoded and compared on three fields against the
title and against `product_variants`.

### The scheme, fully decoded from live data

```
[METAL]-R-[KARAT][PROFILE]-[WIDTH]MM-[SIZE]
METAL    GLD yellow | WHG white | RSG rose | TTG two tone
KARAT    10 | 14 | 18
PROFILE  01 dome | 02 flat | 03 beveled | 04 milgrain | 05 knife
         06 basketweave AND two tone | 07 ribbed | 08 satin centre (Lintel)
```

Section 4 of this file lists four profile codes. Live data carries eight, plus a
fourth metal value TTG that section 4 does not mention. Section 4 is stale on
this point.

### What is clean

| Check | Result |
|---|---|
| Colour prefix against title | 41 of 42 agree |
| Karat digits against title | 41 of 42 agree |
| Profile code against title | 41 of 42 agree |
| SKU width token against the `Width` property | 13,750 of 13,750 agree |
| SKU size token against the `Ring Size` property | 13,750 of 13,750 agree |
| Unparseable SKUs | 0 |
| One SKU owned by two products | 0, in both orgs |
| Variant `etsy_listing_id` disagreeing with its parent | 0 |
| The 14 Etsy backed 18K drafts | 14 of 14 agree |

The SKU scheme is therefore sound as a scheme. It has one corrupted instance,
not a systemic decoding problem.

### B1. The single divergence

Listing `4543442596`, "10K Solid Gold Hammered Wedding Band, Milgrain Comfort
Fit Ring", carries variant family `HMW-R-1402` across 225 variants.

| Field | SKU says | Title says |
|---|---|---|
| Metal | `HMW`, not a value in the metal set | Yellow, "Solid Gold" |
| Karat | 14 | 10K |
| Profile | 02, flat | hammered and milgrain |

`HMW` appears in no migration in the repository. All 225 rows were created in a
single write at 2026-08-11 13:49:12. The prefix looks like a profile abbreviation
placed in the metal slot, most likely a manual rename to break a SKU uniqueness
collision after the listing was produced with Etsy's copy listing function.

### B2. The damage to the 7 August order

Order `4138365859` carries `WHG-R-1402-5MM-7`. That SKU is live and belongs to a
**different listing**, `4543427531`, "14K White Gold Flat Wedding Band".

The order row's own `product_id` and `etsy_listing_id` both point correctly at
the hammered listing `4543442596`. So the panel knows which listing sold. Only
the SKU string is wrong, and only on that one row.

**This is why the title wins.** The title, the product link and the listing id
all agree with each other. The SKU is the lone dissenter, and it can be shown to
belong somewhere else.

### The patterned versus plain question, settled

August, by item revenue, five orders:

| Reading | Patterned | Plain |
|---|---|---|
| By title, correct | 1,395.00, 66.1 percent | 716.25, 33.9 percent |
| By SKU, corrupted | 712.50, 33.7 percent | 1,398.75, 66.3 percent |

The two readings are mirror images of each other, which is exactly what section 8
predicted. Reversal 7 in section 9 can now be closed: the original conclusion was
right. The expensive patterned end is winning August.

August item revenue totals 2,111.25, matching section 6 exactly.

### B3. The finding that matters most, and it is not the SKU

The `HMW-R-1402` price ladder is identical **to the cent** to the `WHG-R-1402`
ladder, the 14K white flat listing, in all 36 sampled width and size cells.

| Cell | 10K hammered, live | 14K white flat | 10K yellow flat |
|---|---|---|---|
| 5mm US7 | 940.00 | 940.00 | 640.00 |
| 8mm US7 | 1,840.00 | 1,840.00 | 1,220.00 |
| 12mm US16 | 3,635.00 | 3,635.00 | 2,350.00 |

A hammered and milgrain labour premium is legitimate. Cent for cent identity
with a 14K ladder is not a pricing decision, it is a copied listing. The 10K
hammered listing is running 44 to 55 percent above the 10K flat ladder.

**And it sold.** The 7 August order is the largest in the shop's history, 682.50
charged against a 910.00 list, on a listing priced roughly 50 percent above where
the engine would have put it. That is a live willingness to pay signal on
patterned work, obtained by accident, and it argues the same direction as the
bench economics in section 9: patterned labour at 40 flat is undercharged. This
belongs in the 1 September repricing decision.

### B4. Two live listings cannot be costed at all

| Listing | Family | Rows with no gram value |
|---|---|---|
| `4544441878`, Solid 14K Yellow Gold Dome, the star product | `GLD-R-1401` | 275 of 275 |
| `4543442596`, 10K Solid Gold Hammered | `HMW-R-1402` | 225 of 225 |

Without grams there is no material cost, no margin, and the pricing engine
cannot compute these rows. The star product is one of the two.

### B5. The profile code is not unique

| Code | Meanings found live | Prefixes |
|---|---|---|
| 02 | flat, and hammered | GLD, RSG, WHG, and HMW |
| 06 | basketweave, and two tone diamond cut | GLD, and TTG |

Migration `0124` uses 06 for basketweave. Migration `0127` states in its own
header that profile 06 is two tone diamond cut. The code book has two
definitions. A profile code alone cannot key a profile.

### B6. No listing carries a product level SKU

All 42 live listings have `products.sku` empty. Family identity survives only in
the variant SKUs. Two live listings have no variants at all and therefore no SKU
anywhere: `4543000739`, sold out, and `4553003504`.

**This is the origin of the 24 July order having no SKU.** That listing has no
variations on Etsy, so Etsy generates no SKU for it. It is structural, not
corruption. The cost is that both listings are invisible to any SKU keyed report.

### B7. Jade Gold NYC, control

118 live listings, 1,945 variants. The SKUs are opaque supplier codes such as
`B1523519158` and `RWB6-9`. They encode neither karat nor colour nor profile, so
a SKU against title comparison is not possible there. No duplicate SKUs, no blank
variant SKUs. This is not a defect, it is a different scheme.

### Side observation

The hammered listing's 2mm and 3mm variants, 50 rows, were already deleted on the
panel side at 2026-08-11 16:16. Item 11 in section 13 is therefore half done. The
Etsy side state cannot be read from this container because the OAuth token is
bound to the production app.

### Recommended sequence, not applied

1. Rename `HMW-R-1402` to a correct code, on the panel **and on Etsy in the same
   pass**. A one sided rename is reverted by the next sync.
2. Remap the 7 August order line to the new identity, or historical reports keep
   the wrong family.
3. Decide B3 as a pricing question, not a data question.
4. Fill the 500 missing gram values, star product included.
5. Fix the code book before the next profile is added.

### Where this file is now stale

| Section | Says | Live data says |
|---|---|---|
| 4, SKU scheme | four profile codes, three metals | eight profile codes, four metals plus one rogue |
| 8 item 1 | unresolved | resolved, title wins, see above |
| 8 item 3 | the ad sync stopped | there was never an automatic sync, Etsy publishes no ads API, every row came from a manual CSV upload, and the upload surface itself was deleted on 2026-08-11 |
| 8 item 2 | root cause visible in the row notes | the notes name the failing step, not the reason, which was swallowed by an empty catch block, now surfaced |
| 8 item 5 | delete `opsEonPricePush15` | already deleted 2026-08-12, `externalPricing` left true |
| 9, reversal 7 | unproven pending audit | proven, patterned is winning August |
| 12 | the sale ends 28 August, renewal reminder 26 August | flagged as an internal inconsistency in this file, not verified against Etsy |
