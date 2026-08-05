# Amuletta PHASE 0 — Inventory (no code)

_Scan date: 2026-07-28 · Repo `JadeGoldNYC` · Live DB `sewbrqflcrlgczilrusw`_
_**Revision: ADDENDUM 1 (multi-tenant correction) applied.** Where the v2 brief and ADDENDUM 1 conflict, ADDENDUM 1 wins._

Graded against **THE ONE RULE**: _a metric may exist in the panel only if crossing a
threshold creates a concrete task._
Tree: `Revenue = Visits × Conversion × AOV`; `Visits = Etsy search + Etsy internal + Ads + External`; plus `Contribution margin per order`.

**Nothing has been deleted or changed. PHASE 4 cleanup is blocked until you confirm the per-shop usage table in §3.**

---

## 0. The three shops

| Shop | Platform | Products | Sales | Ledger | Listing stats | Reviews | Costs | Tasks |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **EON Fine Jewelry** | Etsy | 41 | 5 | 205 | 300 | 0 | 25 | 16 |
| **Jade Gold NYC** | Etsy + ShipStation | 121 | 10,848 | 70,722 | 4,172 | 3,012 | 16,560 | 42 |
| **Seselka Home** | Shopier | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Two facts that govern every verdict below:

1. **Jade Gold is the data-rich shop**, by three orders of magnitude. Read as "the EON
   panel", this codebase looks full of dead features. It is not — Jade Gold is the sole
   user of six subsystems.
2. **Seselka is a shell.** Zero rows in every org-scoped table; only a
   `shopier_connection`. It uses nothing yet. So _"Seselka doesn't use it"_ is never a
   valid deletion argument, and Seselka's four screens will be empty until it has data.

### Verdict counts

| Surface | KEEP | KEEP+FLAG | MERGE | DELETE |
| --- | ---: | ---: | ---: | ---: |
| Screens / routes | 13 | 9 | 14 | 12 |
| API routes | 8 | 0 | 2 | 6 |
| lib subsystems | 12 | 5 | 1 | 3 |
| Query modules | 30 | 9 | 0 | 8 |
| DB tables | 40 | 8 | 6 | 5 |

DELETE is now **34 items**, down from 116 in the single-shop first pass. §2 is the
accounting of what ADDENDUM 1 rescued.

---

## 1. Five findings that change the plan

### 1.1 Sample-size guards behave oppositely on the two live shops

| Guard | Threshold | EON | Jade Gold |
| --- | --- | --- | --- |
| Listing level | ≥ 100 views | **2 of 54** pass | most pass |
| Shop level | ≥ 10 orders / 7d | **5 lifetime** → fails | 10,848 sales → passes |

EON's July actuals: **261 visits · 5 orders · 1.92% conversion · $1,356.29 revenue ·
$271.26 AOV · $116.12 ad spend.** Max views on any EON listing: 148. Average: 10.

So the same screen must suppress on EON and publish on Jade Gold — which is exactly why
ADDENDUM 1 §6 makes the guards per shop. At launch EON shows one live number
(contribution margin, which always fires) and gray boxes elsewhere. Recommend showing
the gray value with an "n of 100" distance-to-significance affordance rather than a bare
gray box: same honesty, non-zero information.

### 1.2 Per-listing views and favorites ARE available from the API

The v2 brief lists traffic as CSV-only. True for **traffic by source** and **search
terms** — but `views` and `num_favorers` are fields on the Etsy **listing** resource, and
`lib/etsy/sync.ts` already snapshots them daily into `etsy_listing_stats` (EON 300 rows,
Jade 4,172).

Two of your eight rules therefore need **no CSV at all**:
`views > 25 AND favorites = 0` (fires on **1 EON listing today**) and the favorites term
of the ads-pause rule.

### 1.3 Etsy Ads spend is in the ledger — the Ads CSV is only partly needed

`etsy_ledger_entries` already carries, per order: `transaction` fee,
`PAYMENT_PROCESSING_FEE`, `shipping_labels`, `prolist` (**onsite Ads spend**),
`offsite_ads_fee` (**the 15%**), `PAYMENT_GROSS`. Every cash term in your
contribution-margin formula except gold/labor/packaging is already there, from the API.
The Ads CSV is still needed for **clicks and per-listing attribution** — not for spend.

### 1.4 Contribution margin exists once, and is wrong in one specific way

`operating_profit_monthly` (migration `0097`) is the only correct variable/fixed split in
the repo — but it classifies cost category `reklam` as **fixed**, and both
`offsite_ads_fee` and `prolist` land in `reklam`. Offsite Ads is a **per-order 15%
variable fee**. So contribution margin today **excludes ad cost entirely and overstates
per-order profitability.**

Also: `PAYMENT_PROCESSING_FEE` is deliberately excluded from per-order fees (migration
`0040`) because its `reference_id` doesn't map to a receipt. Per-order fee is real but
incomplete.

All three ingredients for a true per-order margin already exist per order
(`sales.etsy_fees_cents`, gold COGS from `0060`/`0061`, ShipStation actual postage).
Nothing joins them. **One join plus one `is_fixed` correction**, not a build.

Verified: **10,668 of 10,668 EON variants have `weight_grams`.** COGS input is complete.

### 1.5 A second pricing engine is wired to a cron — and it is EON-only

`app/api/cron/reprice` → `evaluateRepriceRules()` → anchors to a competitor `$/gram` band
→ computes a target price → in `mode='otomatik'` **PUTs it to live Etsy inventory** and
mirrors into `products.price_cents`. No human in the loop.

`reprice_rules` (4 rows) and `reprice_log` (8 rows) are **EON-only; Jade Gold has zero**.
That makes it the one large deletion that survives ADDENDUM 1 — EON-only _and_ obsolete
under EON's own external-pricing rule.

**Recommend disabling this cron first, before anything else.** It can mutate the live
shop while we work.

---

## 2. What ADDENDUM 1 changed — the rescue list

**The most important section.** A single-shop reading produces a DELETE list that
destroys the working shop.

### 2.1 Rescued because Jade Gold uses them and EON does not

| Item | EON | Jade | Single-shop verdict | Corrected | Why the first read was wrong |
| --- | ---: | ---: | --- | --- | --- |
| `reviews` + review surfaces | 0 | **3,012** | DELETE | **KEEP+FLAG** | Jade's entire review history and conversion signal. Alura boundary is EON-only. |
| `generated_images` | 0 | **171** | DELETE | **KEEP** | 171 Jade production images — deleting the table deletes the studio. |
| `photo_production` | 0 | **64** | DELETE | **KEEP** | 64 live Jade photo jobs. |
| `seo_tag_optimizations` | 0 | **19** | DELETE | **KEEP+FLAG** | Jade is the *only* user; flag OFF for EON, code stays. |
| `cart_recoveries` | 0 | **2** | DELETE | **KEEP+FLAG** | Low volume ≠ zero volume. |
| `ads_actions` | 0 | **2** | DELETE | **KEEP** | The write side of the Ads branch; Screens 2 and 4 both need it. |
| `star_seller_snapshots` | 0 | **1** | DELETE | **KEEP** | Already capability-gated by `starSeller`. |
| `task_notes` | 0 | **1** | DELETE | **KEEP** | **This table _is_ the decision log** — half of Screen 4. |

### 2.2 Rescued because both shops use them

| Item | EON | Jade | Corrected | Note |
| --- | ---: | ---: | --- | --- |
| `keyword_research` | 44 | **62** | **KEEP+FLAG** | Jade uses it *more* than EON. Flag OFF for EON only. |
| `keyword_ideas` | 3 | 2 | **KEEP+FLAG** | Same flag. |
| `competitor_prices` | 663 | 106 | **KEEP+FLAG** | Same flag. |
| `competitor_watch` | 105 | 18 | **KEEP+FLAG** | Same flag. |
| `designs` / `design_boards` | 3 / 3 | 6 / 8 | **KEEP** | Both shops. |
| `ad_daily_stats` | 209 | 208 | **KEEP** | Both shops; feeds Screen 2. |
| `product_metrics` | 56 | 15 | **KEEP** | Both shops; feeds Screen 3. |
| `reports` | 1 | 3 | **MERGE** | Report→task linkage seeds the decision log. |

### 2.3 The Alura boundary is a flag, not a deletion

`/anahtar-kelime`, `/seo-etiketleri`, `/seo-yardimcisi`, `/sepet-kurtarma`,
`/yorumlar/[id]/duzenle` (AI reply drafting), `KeywordResearchPanel`, `lib/keywords`,
`lib/seo/keyword-engine` — all **KEEP+FLAG**, off for EON, on for Jade Gold.

Only the DataForSEO paid dependency is worth a separate decision: Jade uses the
keyword tables, but whether it needs live DataForSEO enrichment (vs. the stored rows) is
a cost question for you, not a scope question.

---

## 3. Per-shop usage table

Legend — **Tree**: R=Revenue, V=Visits, C=Conversion, AOV, CM=Contribution margin,
I=Infrastructure, — =outside tree.

### 3.1 Screens

| Route | Used by | Metric | Task | Tree | Verdict | Note |
| --- | --- | --- | --- | --- | --- | --- |
| `/analizler` 6 KPI cards | EON+Jade | conversion, visits, orders, revenue, AOV | conv <1%, visits −15% | R/V/C/AOV | **KEEP** | → Screen 1. Already the tree. |
| `/analizler` alerts (`lib/performance.ts`) | EON+Jade | 6 numeric thresholds | all six | mixed | **KEEP** | → Screen 4. Cleanest threshold logic in repo. |
| `/analizler` Trafik Kaynakları | EON+Jade | visits per source | source shift | V | **KEEP** | → Screen 2. |
| `/analizler/yeni`, `[id]/duzenle` | EON+Jade | input form | weekly entry | V/C | **KEEP** | Only path for traffic data. Strip embedded `KeywordResearchPanel`. |
| `/analizler/urunler` | EON+Jade | views, orders, conv, revenue, ad spend, ROAS | zero-sales, ad-waste | R/C | **KEEP** | → Screen 3. Missing favorites + margin. |
| `/analizler/urunler/yeni`, `[id]/duzenle` | EON+Jade | per-product entry | — | R | **KEEP** | Input to Screen 3. |
| `/maliyetler` OperatingProfitCard | EON+Jade | contribution, EBITDA, breakeven | breakeven not met | CM | **KEEP** | → Screen 1. See §1.4 bug. |
| `/maliyetler` cost ledger | EON+Jade | per-cost rows | — | CM | **KEEP** | Input. Jade 16,560 rows. |
| `/reklamlar` §01+§02 | EON+Jade | ad spend, ROAS, offsite fee | ROAS <1 | V/CM | **KEEP** | → Screen 2 + margin. |
| `/reklamlar` §04 signal cards | EON+Jade | spend + organic + reason | pause/reduce/increase | V/C | **KEEP** | → Screen 4. Best action generator in repo. |
| `/reklamlar` §05 action queue | Jade | before/after spend + ROAS | — (it *is* the log) | mixed | **KEEP** | → Screen 4. Needs explicit measure-date. |
| `/gorevler` + `[id]` + `yeni` + `duzenle` | EON+Jade | open P0 | work the P0 | I | **KEEP** | → Screen 4 sink. |
| `/satislar` order table + `[id]` + `yeni` | EON+Jade | order records | — | R | **KEEP** | Raw record, not a screen. Strip PinBoard. |
| `/satislar/ice-aktar`, `/reklamlar/ice-aktar` | EON+Jade | — | weekly import | I | **KEEP** | CSV spine. |
| `/ayarlar` + `/etsy` + `/profil` + `/ekip` | all three | connection state | reconnect | I | **KEEP** | Gates every number. Drop `EtsyPushButton`. |
| `/ayarlar/altin` | EON+Jade | spot, $/g, purchase price | — | CM | **KEEP** | Read-only cost assumptions (allowed). |
| `/ayarlar/shipstation` | Jade | sync + counts | — | CM | **KEEP** | Real postage. Drop the 5 count tiles. |
| `/ayarlar/shopier` | **Seselka** | connection, orders | — | I | **KEEP** | Seselka's only platform. Was DELETE in v1 — wrong. |
| `/anahtar-kelime` | EON+Jade | search volume, competition, CPC | — | — | **KEEP+FLAG** | `keywordResearch` OFF for EON. |
| `/seo-etiketleri` | **Jade only** | 13-tag proposals, measure loop | push tags | — | **KEEP+FLAG** | `seoTagPush` already exists; OFF for EON. |
| `/seo-yardimcisi` + listing panel 08 | EON+Jade | generated title/tags | — | — | **KEEP+FLAG** | Same flag. |
| `/sepet-kurtarma` (3 routes) | **Jade only** | lapsed customers, risk value | reach out | — | **KEEP+FLAG** | `buyerFollowup` OFF for EON. |
| `/yorumlar` + `[id]/duzenle` | **Jade only** (3,012) | rating, awaiting reply | rating ≤3 → respond | C | **KEEP+FLAG** | Keep ≤3-star rule for both; AI reply drafting OFF for EON. |
| `/yildiz-satici` | **Jade only** | response rate, on-time ship | on-time < target | — | **KEEP+FLAG** | `starSeller` already exists. |
| `/gorsel-uretim` + `/galeri` | **Jade only** (171) | produced count | — | — | **KEEP+FLAG** | `jadeGoldOnly` already set in nav. |
| `/tasarimlar` + `/eksik-agirlik` | EON+Jade | listings, missing grams | fill gram | CM | **MERGE** | → Screen 3 gap filter. Drop "kelimesiz" KPI. |
| `/tasarimlar/iyilestir` | EON+Jade | tags n/13, title length, images | edit listing | C | **MERGE** | → Screen 4. See §5 rule 4 direction bug. |
| `/tasarimlar/listing/[id]` | EON+Jade | 8 panels | mixed | mixed | **MERGE** | Keep 02/04/06/07 → Screen 3 detail. Panels 02B, 05 → flag. |
| `/tasarimlar/pano`, `/yeni`, `[id]/duzenle` | EON+Jade | design counts | — | — | **KEEP** | Both shops have rows. Not a screen. |
| `/panel` trend, KPI quad, orders+AOV | EON+Jade | revenue/cost/orders/AOV | — | R/AOV | **MERGE** | → Screen 1. |
| `/panel` Uyarı Merkezi (~20 generators) | EON+Jade | ranked alerts + cost-of-inaction | yes | mixed | **MERGE** | → Screen 4. Drop 3 pricing rows. |
| `/panel` top products, Aylık Tanı | EON+Jade | top-5, MoM narrative | — | R | **MERGE** | → Screens 1 & 3. |
| `/analizler/tani` `openFixes` | EON+Jade | MoM diagnosis | −15%/−30% drops | R/C | **MERGE** | → Screen 4. Drop the 813-line prose. |
| `/analizler/aksiyon-plani` matrix | EON+Jade | scenarios triggered | add to tasks | mixed | **MERGE** | → Screen 4. |
| `/analizler` Dönem Geçmişi | EON+Jade | period history | — | R | **MERGE** | → Screen 1 4-week trend. |
| `/satislar` KPI row | EON+Jade | 7 KPIs | — | R/AOV/CM | **MERGE** | 3rd rendering of revenue/orders/AOV. |
| `/raporlar` + `[id]` | EON+Jade | 6 KPIs + tables | — | R | **MERGE** | 5th rendering. Keep export + task linkage. |
| `/maliyetler/altin-maliyet` | EON+Jade | per-item COGS | fill weights | CM | **MERGE** | → Screen 3. Drop `?ons=` what-if. |
| `/listing-onerileri` | EON+Jade | draft/archived counts | — | — | **MERGE** | → Screen 3 filter. |
| `/ayarlar/gunluk-ozet` | EON+Jade | digest recipients | — | I | **MERGE** | Repoint daily → weekly. |
| `/panel` gold ticker, cost pie, activity feed, channels, timeline, sync nag | EON+Jade | — | none | — | **DELETE** | No threshold, no task. |
| `/panel` + `/maliyetler` chrome (SceneCutouts, GoldStream, EditorialCard, CornerMarks, `.idx`, PinBoard) | EON+Jade | — | none | — | **DELETE** | ~25% of `panel/page.tsx`. |
| `/analizler` ShopStat tiles, top-movers | EON+Jade | followers, lifetime sales | none | — | **DELETE** | Vanity. |
| `/analizler` `AutoRefresh intervalMs={60000}` | EON+Jade | — | none | — | **DELETE** | 60s poller on weekly data. Violates "no pollers". |
| `/analizler/aksiyon-plani` InquiryBoard | **none** (0 rows) | open questions | creates a question | — | **DELETE** | `metric_inquiries` empty in all three shops. |
| `/analizler/urunler/liste/[productId]` | EON+Jade | competitor band, suggested price | reprice | — | **DELETE** | Price recommendation + one-click apply. EON rule; Jade keeps the *data* via `keyword_research`, not this screen. |
| `/tasarimlar/varyant-hesapla` | EON | computes prices from weight | — | — | **DELETE** | In-house pricing engine. |
| `/tasarimlar/listing/yeni`, `/etsy-agirlik` | EON | authoring + auto-price | none | — | **DELETE** | Etsy write path + pricing. |
| `/indirimler` | **none** (0 rows) | — | none | — | **DELETE** | `discount_bundles` empty everywhere. |
| `/stok` + `/stok/varyant` | EON+Jade | target vs Etsy qty | push stock | — | **DELETE** as screens | OOS signal already an alert row. |
| `/arsiv` | EON (84) | — | none | — | **MERGE** | `listing_media` is EON's pre-deletion archive; keep the table, drop the console. |
| `/kayitlar` | EON+Jade | audit rows | none | — | **DELETE** as screen | Table stays (§4.4). |
| `/marka-kilavuzu`, `/rehber`, `/yenilikler`, `/ayarlar/buyume-stratejisi`, `/ayarlar/etsy-guncellemeleri` | EON+Jade | — | none | — | **DELETE** | Static prose. |
| `/sosyal` (3 routes) | EON+Jade | post counts | none | — | **DELETE** | Stores zero performance data, so no threshold can fire. |
| `/ayarlar/shopify` | **none** | connection | none | — | **DELETE** | Inert, no keys, no shop connected. |

### 3.2 API routes

| Route | Used by | Verdict | Note |
| --- | --- | --- | --- |
| `cron/etsy-sync` | EON+Jade | **KEEP** | The data spine. Retarget to weekly. |
| `cron/shipstation-sync` | Jade | **KEEP** | Only source of actual postage. |
| `cron/daily-digest` | EON+Jade | **KEEP** | Rename weekly; strip the price-recommendation lens. |
| `etsy/connect`, `etsy/callback` | EON+Jade | **KEEP** | Shrink scopes to read-only once write paths go. |
| `notifications` | EON+Jade | **KEEP** | Already a threshold→task feed. |
| `gold-price` | EON+Jade | **KEEP** | Must become a *persisted weekly* snapshot. |
| `cron/etsy-variants` | EON+Jade | **MERGE** | Into `etsy-sync` — same auth, client, budget. |
| `digest/preview` | EON+Jade | **MERGE** | Into digest. |
| `cron/reprice` | EON only | **DELETE** | Computes + pushes price (§1.5). |
| `cron/keyword-research` | EON+Jade | **DELETE the cron** | Keyword *tables* stay for Jade; the nightly competitor crawl is the real-time/scope problem. |
| `etsy/webhook` | EON+Jade | **DELETE** | Real-time; its own doc says it only cuts latency. |
| `ops/repair-variant-match` | — | **DELETE** | One-shot repair as an endpoint; duplicated in `scripts/`. |
| `gorsel/indir` | Jade | **KEEP+FLAG** | Higgsfield proxy — Jade's studio uses it. Was DELETE in v1; wrong. |
| `shopify/connect`, `shopify/callback` | **none** | **DELETE** | No shop connected. Never validates HMAC despite its doc. |

### 3.3 lib subsystems

| Module | Used by | Verdict | Note |
| --- | --- | --- | --- |
| `lib/etsy` read spine — `client, oauth, endpoints, sync, variants, images, media, reconcile, text, types`, read half of `inventory`, `listing-audit` | EON+Jade | **KEEP** | The verified data surface. |
| `lib/metrics-playbook` (885) | EON+Jade | **KEEP** | **The threshold→task engine. Highest-value asset.** Thresholds move to per-shop config. |
| `lib/ads/meta.ts` (227) | EON+Jade | **KEEP** | Clean pure/impure split. |
| `lib/tasks/schedule.ts` (106) | EON+Jade | **KEEP** | Pure, ≤5/day, forward-only. |
| `lib/shipstation` (568) | Jade | **KEEP** | Actual postage + weights. |
| `lib/csv` | EON+Jade | **KEEP** | Keep sales/costs/ads mappers. **Build the shop-stats traffic mapper.** |
| `lib/digest`, `lib/email` | EON+Jade | **KEEP** | Strip `lenses.ts:117–219` price-recommendation lens. |
| `lib/platform.ts`, `lib/brand.ts`, `lib/actions/session.ts` | all three | **KEEP** | **Shared infrastructure — never delete.** The flag layer §6 builds on. |
| `lib/shopier` (476) | **Seselka** | **KEEP** | Seselka's only platform. Was DELETE in v1 — wrong. |
| `lib/keywords` (342) | EON+Jade | **KEEP+FLAG** | `keywordResearch` OFF for EON. DataForSEO cost is a separate call. |
| `lib/seo/keyword-engine` (665) | EON+Jade | **KEEP+FLAG** | Same flag. |
| `lib/photo-kit` (2,167) | Jade | **KEEP+FLAG** | `jadeGoldOnly`. |
| `lib/pins` (41) | EON (5) | **KEEP+FLAG** | EON-only, decorative; flag rather than delete. |
| `lib/validations` | EON+Jade | **KEEP** | Keep all — every module they validate survives in some shop. |
| `lib/etsy/reprice.ts` (637), `competitor-gram-price.ts` (98), `distribute.ts` (319) | EON | **DELETE** | Price computation; EON-only. |
| `lib/etsy` write paths — `create-listing.ts` (652), `listing.ts`, `weights.ts`, `description-weights.ts` (648) | EON | **DELETE** | Etsy mutation; EON's catalog push is finished. |
| `lib/shopify/client.ts` (57) | **none** | **DELETE** | Inert. |
| `lib/etsy/keyword-research.ts` (1,006) | EON+Jade | **MERGE** | Despite the name it is *competitor price* research. Salvage the comp-set read for Jade; delete `suggested_price_cents`. |

### 3.4 Query modules (50) and scripts

- **KEEP 30** — core tree (`sales, products, listings, costs, metrics, dashboard, reports, reviews, variants, variant-stock, variant-weights, stock, product-metrics, profile, team, audit, timeline, tasks, alerts, data-gaps`), ads (`ads-actions, ads-daily, ads-ledger`), Etsy ops (`etsy, etsy-insights, listing-audit, diagnostics, missing-weights`), plus `shipstation`, `shopier`, `listing-archive`, `listing-images`.
  _Caveat:_ `alerts.ts` emits `below_melt`, `discount_below_melt`, `market_price_position` — three pricing rows to remove for EON.
- **KEEP+FLAG 9** — `keyword-research, keyword-ideas, seo-tags, market-alerts, cart-recoveries, star-seller, designs, design-boards, generated-images, photo-production`.
- **DELETE 8** — `discount-bundles`, `metric-inquiries`, `shopify`, `pins`, `gold-cost`/`gold-settings` price-recommendation halves (assumption read stays), `listing-health` price half.
- **Scripts** — KEEP `dev-supabase-setup.sh`, `fill-weights-from-description.ts`, `cut-pins.mjs` + brand generators (Jade studio). DELETE `eon-push-drafts.ts`, `restore-listing-prices-from-etsy.ts`, `ops-repair-*`, `eon-ghost-bank`, `eon-upload-covers`, `eon-qa/` — spent EON one-shots and write paths.

---

## 4. DELETE list — with the evidence

Only these clear ADDENDUM 1 rule 2 (used by no shop, or EON-only and obsolete).

### 4.1 Zero rows in all three shops
`market_price_decisions` (0/0/0) · `metric_inquiries` + `metric_inquiry_responses` (0/0/0) ·
`discount_bundles` (0/0/0) · `csv_imports` (0/0/0)

### 4.2 EON-only and obsolete under EON's external-pricing rule
`reprice_rules` (EON 4, Jade 0) · `reprice_log` (EON 8, Jade 0) · `cron/reprice` ·
`lib/etsy/reprice.ts` · `/tasarimlar/varyant-hesapla`

### 4.3 No shop connected
`shopify_connection` · `lib/shopify` · `app/api/shopify/*` — no org has a Shopify row.

### 4.4 Two things I will not touch without your word

**`ha_*` — 13 tables from a different application.**
`ha_hotels, ha_guests, ha_departments, ha_shift_reports, ha_handover_items, ha_follow_ups,
ha_hotel_members, ha_reminder_logs, ha_users`, etc. **No migration in this repo creates
them. No line of app code references them.** They appear to belong to a hotel-handover
app sharing this Supabase project — note the `handover-atlas` Vercel project on the same
account. Not Amuletta's to delete. Flagging, not touching.

**`audit_log` — 274,570 rows, 336 MB, the largest object in the database.**
Written by a Postgres trigger on every write (company memory, per `CLAUDE.md`). Shows no
metric and creates no task, so `/kayitlar` as a *screen* goes — but it is the compliance
trail. Recommend: keep the table, delete the screen, add a retention policy. Your call on
the window.

---

## 5. Rules engine — per shop

Thresholds move to per-shop config. v2 numbers are **EON calibration (AOV ~$250)**; Jade
and Seselka inherit neutral defaults and stay silent until you calibrate them.

| # | Rule | Status | Where / gap |
| --- | --- | --- | --- |
| 1 | `contribution_margin < 0` or price below floor | **Rework** | Monthly not per-order; excludes ad cost (§1.4). Floor must come from the xlsx import, not the deleted engine. |
| 2 | ads: 30d, spend >$30, orders 0, favorites <2 | **Exists, rewire** | `lib/ads/meta.ts` + `ads-ledger.ts` + `etsy_listing_stats`. Thresholds differ — align, then per-shop. |
| 3 | views >25 AND favorites 0 (30d) | **Exists** | `etsy_listing_stats`. **1 EON listing fires today.** No CSV needed. |
| 4 | title <110 chars OR tags <13 | **Half exists — direction bug** | `lib/etsy/listing-audit.ts` flags titles that are too **long** (>140 chars, >15 words). A 60-char title passes silently. Tag rule `tags < 13` is correct and reusable. |
| 5 | size scale / style attribute wrong | **Missing** | Attributes fetched, no completeness check. |
| 6 | personalization or half-size → QC gate | **Missing entirely** | Personalization appears only in outbound listing-*creation* code. **Nothing reads the buyer's personalization value off a receipt.** Your highest-value rule (2 of first 5 EON orders shipped with spec errors) must be built, not salvaged. |
| 7 | delivered +7d, no review, no follow-up | **Partly** | `reviews` synced (Jade 3,012, EON 0); delivery from ShipStation (Jade only). Needs a "follow-up logged" field. Panel only checks that Alura *fired*. |
| 8 | gold spot moved >5% since last reprice import | **Missing** | No persisted spot history — `lib/gold-price.ts` is a 1-hour in-process cache with a hardcoded `4088` fallback. Needs `weekly_gold_price` first. |

**Score: 2 usable as-is, 3 need rework, 3 must be built.**

---

## 6. The feature-flag layer already exists

ADDENDUM 1 §4 needs per-shop flags, not deletion. Three mechanisms are already in place:

| Layer | File | What it gates |
| --- | --- | --- |
| Platform capabilities | `lib/platform.ts` | `sync, listingPush, seoTagPush, adsSignals, starSeller, reprice, stockSync` — derived from etsy/shopify/shopier |
| Brand/org identity | `lib/brand.ts` | `getBrandScope`, `isEonActive` |
| Nav gating | `components/layout/nav-items.ts` + `sidebar.tsx:99-101` | `jadeGoldOnly`, `brandBook`, `capability` |

**What's missing:** an explicit per-org feature-flag store not derived from platform or
brand identity. `organizations` already carries `gold_settings jsonb` and
`digest_settings jsonb` — so `feature_flags jsonb` and `rules_config jsonb` follow an
established precedent rather than inventing a mechanism.

Flags PHASE 1 should add: `keywordResearch` (OFF for EON), `buyerFollowup` (OFF for EON),
`externalPricing` (ON for EON — suppresses any in-panel price computation),
`photoStudio` (Jade only).

---

## 7. Per-shop readiness on the four screens

| Screen | EON | Jade Gold | Seselka |
| --- | --- | --- | --- |
| **1 · Weekly summary** | Revenue/AOV real; conversion + visits from 1 manual period row; **shop guard fails (5 orders)** → mostly gray | Full — 10,848 sales, 16,560 cost rows, guard passes | **Empty** — no data at all |
| **2 · Traffic split** | 1 period row, and it has an integrity bug (§8.5) | 2 period rows + 208 ad-days | **Empty** |
| **3 · Product ledger** | 41 products, 300 stat rows, grams 100% complete; **52 of 54 rows gray** | 121 products, 4,172 stat rows, most rows publish | **Empty** — 0 products |
| **4 · Action queue** | 16 tasks; rule 3 fires on 1 listing; margin rule always fires | 42 tasks, 1 decision-log note, 2 ads actions | **Empty** |

Be blunt with yourself about Seselka: it is a connected Shopier account with nothing
behind it. Its four screens will be empty scaffolding until it has products and orders,
and no rule should fire for it.

---

## 8. Gaps PHASE 1 must close

1. **Traffic-source CSV importer does not exist.** `shop_metrics.traffic_sources` is
   hand-typed jsonb. Weakest leg of the tree. `lib/csv/mappers/etsy-ads-daily.ts` is a
   good template (fuzzy header aliasing, `Jul 1, 2026` parsing, TZ-safe, dedupe-by-day).
2. **The pricing-engine xlsx is not in the repo** and `package.json` has **no xlsx parser
   dependency**. Both needed, plus `2026-07-16-eon-pricing-engine.xlsx` itself.
   Jade and Seselka get adapter stubs; their margin columns gray as "cost model pending".
3. **Architecture families do not exist as data.** Meridian / Obelisk / Testament /
   Keystone / Cornice appear only as prose in `public/brand/README.md` and two migrations.
   Screen 3 needs a family column + Wide flag — needs a mapping you supply. **EON only**;
   Jade and Seselka need their own grouping or none.
4. **EON catalog is 41 listings, target is 16.** 26 active + 14 draft + 1 sold_out.
   A data decision, not a code one.
5. **EON's existing traffic row has an integrity bug.** July `traffic_sources` sums to
   **326 across six buckets while `visits` reads 261**, and `etsy_app` and `etsy_ads` are
   both exactly `107` — which looks like a copy error at entry. The importer should
   validate that sources sum to visits and reject rather than absorb it.
6. **New tables:** `weekly_gold_price(date, usd_per_ozt)`, `pricing_engine_import`
   (read-only mirror + timestamp), `weekly_traffic`, `decision_log` (date, hypothesis,
   change, measure date, result — `task_notes` and `ads_actions` are the closest existing
   shapes but neither has a measure-date).

Source mapping is otherwise clean: `etsy_search` → Etsy search ·
`etsy_app + etsy_marketing` → Etsy internal · `etsy_ads` → Ads · `direct + social` → External.

---

## 9. Decisions needed from you

1. **Confirm the §3 per-shop usage table.** ADDENDUM 1 §7 blocks PHASE 4 cleanup until
   you do. Specifically confirm that Jade Gold really does use the keyword/SEO/studio
   stack, and that Seselka is expected to stay empty for now.
2. **Disable the reprice cron immediately** (§1.5) — it can rewrite live Etsy prices while
   we work. The one item I would not wait on.
3. **Gray-box behaviour** (§1.1) — fully gray as specified, or gray + "n of 100"
   distance-to-significance. I recommend the latter.
4. **`ha_*` tables** (§4.4) — confirm they belong to the handover app and who owns them.
5. **`audit_log` retention** (§4.4) — keep table, delete screen, pick a window.
6. **DataForSEO** — Jade uses the keyword tables; does it still need paid live enrichment,
   or are the stored rows enough?
7. **Architecture family mapping** (§8.3) — needed for EON's Screen 3.
8. **The xlsx** (§8.2) — drop it in the repo so PHASE 1 can build the read-only mirror
   against the real sheet.

Nothing is deleted until you approve this list.

---

## 10. Decisions received (2026-07-28) — §3 CONFIRMED

Husam confirmed the per-shop usage table after running the dual-column check
against Jade Gold and Seselka usage. PHASE 4 is unblocked, subject to the riders
below. Answers to §9, in order:

| # | Decision |
| --- | --- |
| 1 | **§3 confirmed.** All 34 DELETE items are zero-row-everywhere, EON-only-and-obsolete, or inert Shopify. Jade Gold does actively use the keyword/SEO/studio stack → KEEP+FLAG as graded. Seselka is a shell by design; it stays empty and **no rule may fire for it**. |
| 2 | **Reprice killed immediately.** Done — see §11. |
| 3 | **Gray + "n of 100"** distance-to-significance approved. |
| 4 | **`ha_*` belongs to handover-atlas** (same repo, second Vercel project), owner Husam. **Freeze: flag, never touch from Amuletta.** |
| 5 | **`audit_log`:** keep table, delete screen, **retention 90 days**. Revisit at the 60-day pricing review. |
| 6 | **DataForSEO:** stored rows are enough — **paid live enrichment OFF**, re-enable on demand only if a concrete Jade task needs fresh volume data. |
| 7 | **Architecture families:** Husam supplies a CSV (`listing_id, family, wide`). **Do not block PHASE 1** — gray the family column until it lands. |
| 8 | **Pricing xlsx** lands at the next desktop session. Importer spec in §12. |

### Riders on PHASE 4 (must hold before the relevant deletion executes)

**(a) `/stok` write path — SETTLED, safe to delete.**
Required check: zero Jade Gold stock-push writes in the last 90 days.
Measured 2026-07-28 against `audit_log` (`action = 'etsy.stock_push'`, the key
written by both `stok/actions.ts` and `stok/varyant/actions.ts`):

| Shop | last 90d | last 180d | all time |
| --- | ---: | ---: | ---: |
| EON | 0 | 0 | 0 |
| Jade Gold | 0 | 0 | 0 |
| Seselka | 0 | 0 | 0 |

Verified as a true zero, not a logging gap: `etsy.*` auditing demonstrably works
on both live shops over the same window (Jade `etsy.sync` 81, `etsy.variant_sync`
7, `etsy.image_upload` 2; EON `etsy.sync` 74, `etsy.listing_create` 29).
`etsy.stock_push` has simply never been written by anyone.
**Conclusion: no flag needed — the `/stok` write path can be deleted outright.**
_Caveat on the definition:_ `logAudit` only fires when `updated > 0 || errors > 0`,
so a push in which every row was skipped leaves no trace. That is the correct
definition of a *write*, so the conclusion stands.

**(b) OAuth scope shrink is EON-only.** When narrowing to read-only, EON only —
**Jade Gold keeps the listing-write scope for `seoTagPush`.** Not yet
implemented; PHASE 4 item.

### PHASE 4 follow-up log

- **Calculator UI lock for EON — DEFERRED** (Husam, 2026-07-28). The in-panel
  price calculators (`components/listing/variant-editor.tsx` anchor-$/g
  propagation, `variant-calculator.tsx`, `listing-composer.tsx`, and
  `/tasarimlar/varyant-hesapla`) still compute suggested prices into **panel**
  fields. They can no longer reach the live shop — every push path is gated on
  `externalPricing` (§11) — so this is cosmetic honesty, not a safety hole.
  Lock them visibly for EON in PHASE 4.
- Remove `reprice_rules`, `reprice_log`, `lib/etsy/reprice.ts` (audit trail kept
  until then).
- Apply the §4 DELETE list; drop the `/kayitlar` screen and add 90-day
  `audit_log` retention.
- Turn DataForSEO live enrichment off in config.

---

## 11. Reprice kill — shipped 2026-07-28

Decision #2, executed ahead of everything else because Husam was hand-entering
verified spot-4090 prices into the live shop the same day. **From this point the
panel may not recompute or overwrite a price.**

| Change | Where | Effect |
| --- | --- | --- |
| Cron schedule removed | `vercel.json` | `/api/cron/reprice` no longer fires (was 10:00 UTC daily) |
| Route dead-ended | `app/api/cron/reprice/route.ts` | Returns 410 and no longer imports the engine, so a leftover scheduler or manual call cannot restart it |
| Per-shop flags | `0119_org_feature_flags.sql` | `organizations.feature_flags` jsonb, following the `gold_settings` / `digest_settings` precedent |
| Flag reader | `lib/feature-flags.ts` | **Fails closed** — an unreadable flag refuses the price write rather than risk overwriting live prices |
| Write gates | 4 server actions | `pushAllPricesToEtsyAction`, `pushListingPricesToEtsyAction`, `applyMarketPrice`, `saveRepriceRule` |

Flags as applied live (verified by query after migration):

| Shop | externalPricing | keywordResearch | buyerFollowup | photoStudio |
| --- | --- | --- | --- | --- |
| EON | **true** | false | false | _(default true)_ |
| Jade Gold | false | true | true | true |
| Seselka | false | _(default true)_ | _(default true)_ | false |

`evaluateRepriceRules()` now has **zero live callers**. Typecheck, eslint and
`npm run build` all pass.

**Deployment order matters:** because the flag reader fails closed, migration
`0119` must be applied **before or with** the deploy. Applied to the live
database on 2026-07-28 and confirmed present before the PR was opened.

---

## 12. Pricing-engine importer spec (PHASE 1)

Supplied by Husam 2026-07-28; the xlsx itself lands at his next desktop session.
The importer mirrors these **read-only** with an import timestamp and never
recomputes them:

| Field | Value / formula |
| --- | --- |
| Spot | one cell |
| Multiplier | 1.55 |
| Thickness standard | 2.0 mm |
| Floor | `(landed + 0.45) / 0.895` |
| Offsite floor | `(landed + 0.45) / 0.745` |
| Engine price | `landed × 1.55` |
| List price | `ceiling(engine / 0.75, 5)` |

The importer must also **validate that traffic sources sum to visits and reject
on mismatch** (§8.5 — EON's July row sums to 326 against a recorded 261).
