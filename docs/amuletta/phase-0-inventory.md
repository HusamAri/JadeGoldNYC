# Amuletta PHASE 0 — Inventory (no code)

> **⚠️ SUPERSEDED — do not action the DELETE list in this file.**
> This pass graded the panel as a **single-shop (EON)** product. **ADDENDUM 1
> (multi-tenant correction)** overrides it: Amuletta serves **three** shops — EON,
> Jade Gold, Seselka — and the DELETE list may only contain items used by **no**
> shop, or EON-only obsolete items. Anything Jade Gold or Seselka uses is KEEP or
> KEEP+FLAG. The Alura and external-pricing boundaries are **EON-only feature
> flags, not code deletions.**
>
> Measured per-shop counts already overturn a large part of §2.3 — e.g. Jade Gold
> has **62** `keyword_research` rows (more than EON's 44), **19**
> `seo_tag_optimizations`, **171** `generated_images`, **64** `photo_production`.
> The corrected, per-shop-attributed inventory lives in
> **`phase-0-inventory-multitenant.md`**. This file is retained only as the
> single-shop reading and for the measurements in §1, §4.5 and §5, which stand.

_Scan date: 2026-07-28 · Repo `JadeGoldNYC` · Live DB `sewbrqflcrlgczilrusw` · Org EON `9d0336c0-…`_

Graded against **THE ONE RULE**: _a metric may exist in the panel only if crossing a
threshold creates a concrete task._
Allowed tree: `Revenue = Visits × Conversion × AOV`; `Visits = Etsy search + Etsy internal + Ads + External`; plus `Contribution margin per order`.

**Nothing in this document has been deleted or changed. Awaiting approval.**

---

## 0. Verdict at a glance

| | Screens/routes | API routes | lib subsystems | Query modules | DB tables |
| --- | ---: | ---: | ---: | ---: | ---: |
| KEEP | 11 | 6 | 9 | 28 | 26 |
| MERGE | 14 | 2 | 3 | 0 | 6 |
| DELETE | 49 | 8 | 12 | 19 | 27 |

(DB row excludes the 13 `ha_*` tables, which belong to another application — see §4.5.)

**74 dashboard routes → 4 screens.** Roughly **19,000 lines** of route/component code
and **6,500 lines** of backend are removal candidates, of which **~11,000 lines are
hard scope violations** (pricing engine, keyword research, messaging, real-time).

Dropped external dependencies: DataForSEO, Gemini keyword expansion, Higgsfield.
Crons: 6 → 1 weekly.

---

## 1. Five findings that change the plan

These are the things worth reading before approving anything.

### 1.1 The sample-size guard grays out almost the entire panel — today

Measured against live EON data:

| Guard | Threshold | Reality | Result |
| --- | --- | --- | --- |
| Listing level | ≥ 100 views | **2 of 54** listings qualify | 52 rows gray |
| Shop level | ≥ 10 orders / trailing 7d | **5 orders lifetime** | every shop card gray |

July 2026 actuals: **261 visits · 5 orders · 1.92% conversion · $1,356.29 revenue ·
$271.26 AOV · $116.12 ad spend.** Max views on any listing: 148. Average: 10.

This is the guard behaving correctly, not a bug — but it means at launch the panel
shows **one live number (contribution margin, which always fires) and 6 gray boxes.**
Worth confirming you want that, because it is the honest reading of the data and it is
also a panel that looks empty. Options: (a) ship it gray as specified, (b) show the
gray value with a "n of 100" progress affordance so the operator sees the distance to
significance. Recommend (b) — same honesty, non-zero information.

### 1.2 Per-listing views and favorites ARE available from the API

The spec lists traffic as CSV-only. That is correct for **traffic by source** and
**search terms**, but `views` and `num_favorers` are fields on the Etsy **listing**
resource, and this repo already snapshots them daily into `etsy_listing_stats`
(54 listings × 15 days, populated by `lib/etsy/sync.ts`).

This matters because two of your eight rules depend on exactly these fields:

- `views > 25 AND favorites = 0` → "first photo or price mismatch"  ← **1 listing fires today**
- `spend > $30 AND orders = 0 AND favorites < 2` → "pause ad"

So those two rules need **no CSV import at all**. Recommend keeping the daily snapshot
(it is the only Visits-shaped signal the API gives) but reading it weekly.

### 1.3 Etsy Ads spend is in the ledger — the Ads CSV is partly redundant

`etsy_ledger_entries` (already synced, 205 rows for EON) carries real money:

| ledger_type | EON | meaning |
| --- | ---: | --- |
| `PAYMENT_GROSS` | +$1,356.29 | gross revenue |
| `transaction` | −$81.88 | Etsy transaction fee |
| `PAYMENT_PROCESSING_FEE` | −$41.94 | processing |
| `shipping_labels` | −$28.18 | postage |
| `prolist` | −$114.58 | **onsite Etsy Ads spend** |
| `tier_2_subscription` | −$120.00 | Etsy Plus |
| `offsite_ads_fee` | (745 rows shop-wide) | **the 15% offsite fee** |

Every cash term in your contribution-margin formula except gold/labor/packaging is
already in this table, per order, from the API. The Ads CSV is still needed for
**clicks and per-listing attribution**, but not for spend.

### 1.4 Contribution margin exists once, and it is wrong in one specific way

`operating_profit_monthly` (migration `0097`) is the only correct variable/fixed split
in the repo. But it classifies cost category `reklam` as **fixed** — and both
`offsite_ads_fee` and `prolist` land in `reklam`. Offsite Ads is a **per-order 15%
variable fee**. So contribution margin today **excludes ad cost entirely and
overstates per-order profitability.**

Also: `PAYMENT_PROCESSING_FEE` is deliberately excluded from per-order fees (migration
`0040`) because its `reference_id` doesn't map to a receipt — it only lands in
aggregates. Per-order fee is therefore real but incomplete.

Good news: all three ingredients for a true per-order margin already exist per order
(`sales.etsy_fees_cents`, gold COGS from `0060`/`0061`, ShipStation actual postage).
Nothing joins them yet. **This is one join plus one `is_fixed` correction**, not a build.

Also verified: **10,668 of 10,668 EON variants have `weight_grams`.** The COGS input is
100% complete — no backfill needed.

### 1.5 The panel contains a second pricing engine, wired to a cron

This is the largest scope violation and it is not dormant:

`app/api/cron/reprice` → `evaluateRepriceRules()` → anchors to a competitor `$/gram`
band → computes a target price → in `mode='otomatik'` **PUTs it to live Etsy inventory**
and mirrors it into `products.price_cents`. No human in the loop.

Price computation also lives in: `lib/etsy/keyword-research.ts` (`suggested_price_cents`),
`competitor-gram-price.ts`, `distribute.ts`, `/tasarimlar/varyant-hesapla`,
`VariantEditor`, `RepriceRuleCard`, `discount-bundles.ts`, and a one-click
**"Önerilen fiyatı uygula"** button on `/analizler/urunler/liste/[productId]`.

Under the boundary "Amuletta never computes a recommended price", all of it goes.
**Recommend disabling the reprice cron first, before anything else**, since it can
mutate the live shop while we work.

---

## 2. Screens — KEEP / MERGE / DELETE

### 2.1 KEEP (11) — these become the four screens

| Route / surface | Metric | Task it creates | Target screen |
| --- | --- | --- | --- |
| `/analizler` 6 KPI cards | Conversion, Visits, Orders, Revenue, AOV | conv <1%, visits −15% | **1 · Weekly summary** |
| `/analizler` alerts (`lib/performance.ts`) | 6 hard numeric thresholds | all six | **4 · Action queue** |
| `/analizler` Trafik Kaynakları | visits per source | source share shift | **2 · Traffic split** |
| `/analizler/yeni` + `[id]/duzenle` | — (input form) | weekly data entry | input to 1 & 2 |
| `/analizler/urunler` table | views, orders, conv, revenue, ad spend, ROAS | zero-sales, ad-waste | **3 · Product ledger** |
| `/analizler/urunler/yeni` + `[id]/duzenle` | — (input form) | per-listing entry | input to 3 |
| `/maliyetler` OperatingProfitCard | contribution, EBITDA, breakeven | breakeven not met | **1 · Weekly summary** |
| `/reklamlar` §01+§02 (CSV + ledger) | ad spend, ROAS, offsite fee | ROAS <1 | **2 · Traffic split** + margin |
| `/reklamlar` §04 signal cards | spend + organic context + reason | pause / reduce / increase | **4 · Action queue** |
| `/reklamlar` §05 action queue | before/after spend + ROAS per decision | — (it IS the log) | **4 · Decision log** |
| `/gorevler` + `[id]` + `yeni` + `duzenle` | open P0 count | work the P0 | **4 · Action queue** |

Plus non-screen keeps: `/satislar` order table (raw record, drill-down),
`/satislar/ice-aktar` + `/reklamlar/ice-aktar` (CSV spine), `/maliyetler` cost ledger
(input), `/ayarlar` + `/ayarlar/{etsy,profil,ekip,altin,shipstation}` (plumbing +
read-only cost assumptions).

**Screens 1 and 2 are ~70% built already** — they just live behind a route named
"analizler" while `/panel`, the landing page, shows none of the tree.

### 2.2 MERGE (14)

| Route / surface | Into | Why |
| --- | --- | --- |
| `/panel` trend chart, KPI quad, orders+AOV | Weekly summary | same numbers, weekly cadence |
| `/panel` Uyarı Merkezi (~20 generators) | Action queue | already threshold→task→href shaped; drop 3 pricing rows |
| `/panel` top products | Product ledger | full ledger supersedes arbitrary top-5 |
| `/panel` Aylık Tanı summary | Weekly summary headline | second rendering of same signal |
| `/analizler/tani` `openFixes` | Action queue | real thresholds buried in an 813-line narrative |
| `/analizler/aksiyon-plani` scenario matrix | Action queue | closest existing thing to screen 4 |
| `/analizler` Dönem Geçmişi | Weekly summary (4-week trend) | it is the trend data source |
| `/analizler` daily views chart | Traffic split (proxy row) | views ≠ visits; keep as fallback |
| `/satislar` KPI row | Weekly summary + margin | 3rd rendering of revenue/orders/AOV |
| `/raporlar` ReportExport | Weekly summary (export button) | the one useful piece of that route |
| `/raporlar/[id]` report→task linkage | Decision log | seed of hypothesis→result tracking |
| `/maliyetler/altin-maliyet` per-item COGS | Product ledger | correct COGS feed; drop the `?ons=` what-if |
| `/reklamlar` §03, §06, daily tables | one Ads row + ledger column | three parallel ad-spend truths on one page |
| `/tasarimlar` + `/tasarimlar/eksik-agirlik` | Product ledger (gap filter) | gram completeness gates margin |
| `/ayarlar/gunluk-ozet` | Weekly summary delivery | repoint daily → weekly |

### 2.3 DELETE — scope violations (18 routes)

| Route | Boundary breached |
| --- | --- |
| `/anahtar-kelime` (+ DataForSEO, Gemini) | keyword research → Alura |
| `/seo-etiketleri` | tag mining + rank tracking → Alura |
| `/seo-yardimcisi` + listing panel 08 | tag/title generation → Alura |
| `/analizler/urunler/anahtar-kelime` | keyword CSV → Alura |
| `/analizler/urunler/liste/[productId]` | competitor mining **and** price recommendation (worst offender) |
| `/tasarimlar/varyant-hesapla` | computes prices from weight × purchase price |
| `/tasarimlar/listing/[id]` panels 02B, 05, 08 | discount sim, reprice rule, $/gram, keyword panel |
| `/tasarimlar/listing/yeni` | authoring + auto-price-from-weight |
| `/panel` Pazar Fiyat Uyarıları | competitor mining + reprice recommendation |
| `/panel` En İyi Müşteriler | feeds buyer follow-up → Alura |
| `/sepet-kurtarma` (3 routes) | buyer win-back outreach → Alura |
| `/yorumlar/[id]/duzenle` (`generateReviewReply`) | AI-drafts buyer messages → Alura |
| `/sosyal` (3 routes) | posting calendar + hashtag authoring, zero performance data |
| `/gorsel-uretim` (2 routes) | AI image generation |
| `/indirimler` | promotional pricing config |
| `/analizler` `AutoRefresh intervalMs={60000}` | 60-second poller on manually-entered weekly data |
| `/reklamlar` AdsTriageDialog | search-term triage → Alura |
| `/ayarlar/{shopier,shopify}` | non-Etsy channels, outside the tree |

### 2.4 DELETE — no metric, no task (31 routes)

`/raporlar` summary+tables (5th rendering of the panel KPI block, identical
`getDashboard()` call) · `/panel` gold ticker, cost pie, activity feed, sales-channel
card, timeline, sync nag · `/panel` + `/maliyetler` decorative chrome (SceneCutouts,
GoldStream, EditorialCard, CornerMarks, `.idx` rows, PinBoard stickers — ~25% of
`panel/page.tsx`) · `/analizler` ShopStat vanity tiles (followers, lifetime sales),
top-movers · `/analizler/aksiyon-plani` InquiryBoard · `/satislar` monthly charts,
country revenue · `/maliyetler` bearer editor · `/stok` + `/stok/varyant` ·
`/arsiv` · `/kayitlar` (as a screen; table stays) · `/listing-onerileri` (→ ledger
filter) · `/tasarimlar/{pano,yeni,[id]/duzenle,etsy-agirlik}` · `/yorumlar` +
`/yorumlar/yeni` (keep only the ≤3-star rule) · `/yildiz-satici` · `/marka-kilavuzu` ·
`/rehber` · `/yenilikler`

> `/rehber` is **445 lines of instructions for 20 screens**, and its own docstring says
> _"Birçok güçlü özellik var ama kimse nasıl kullanılacağını bilmiyor."_ That file is the
> strongest existing argument for the four-screen target — deleting the screens deletes
> the need for the manual.

---

## 3. Backend

### 3.1 API routes (16)

| Verdict | Routes |
| --- | --- |
| **KEEP** | `cron/etsy-sync` (the data spine), `cron/shipstation-sync`, `etsy/connect`, `etsy/callback`, `notifications` (already a threshold→task feed), `cron/daily-digest` → rename weekly |
| **MERGE** | `cron/etsy-variants` → into `etsy-sync`; `digest/preview` → into digest; `gold-price` → becomes a weekly **persisted** snapshot |
| **DELETE — violation** | `cron/reprice` (computes + pushes price), `cron/keyword-research`, `etsy/webhook` (real-time; its own doc says it only cuts latency), `shopify/connect`, `shopify/callback` |
| **DELETE — dead** | `ops/repair-variant-match` (one-shot repair masquerading as an endpoint, duplicated in `scripts/`), `gorsel/indir` (Higgsfield proxy) |

### 3.2 `lib/etsy` — split the read spine from the write paths

**KEEP (read = the verified data surface):** `client`, `oauth`, `endpoints`, `sync`,
`variants`, `images`, `media`, `reconcile`, `text`, `types`, read half of `inventory`,
and `listing-audit` (pure quality checks, feeds Conversion tasks).

**DELETE — violation:** `reprice.ts` (637), `keyword-research.ts` (1006),
`competitor-watch.ts` (355), `competitor-gram-price.ts` (98), `distribute.ts` (319).

**DELETE — Etsy write paths:** `create-listing.ts` (652), `listing.ts` (description
PATCH), `weights.ts`, `description-weights.ts` (648), `arsiv` listing delete,
`gorsel-uretim` image upload, `EtsyPushButton`.

`lib/etsy/sync.ts` runs 6 phases — receipts+transactions → listings → listings_all →
reviews → **ledger** → extras (shop snapshot, sections, shipping profiles, listing
views/favorites). Every phase maps to the verified data surface. This file stays.

### 3.3 Other lib subsystems

| KEEP | MERGE / surgery | DELETE |
| --- | --- | --- |
| `metrics-playbook` (885 — **the threshold→task engine, highest-value asset**) | `digest` (strip the `suggested_price_cents` lens, `lenses.ts:117–219`) | `keywords` (342) — Alura |
| `ads/meta.ts` (227 — clean pure/impure split, thresholds in one place) | `csv` (keep sales/costs/ads; **delete `etsy-keywords.ts`**; **build the shop-stats traffic mapper**) | `seo/keyword-engine.ts` (665) — Alura |
| `tasks/schedule.ts` (106 — pure, ≤5/day, forward-only) | `gold-cost`/`gold-settings` → read-only assumptions only | `photo-kit` (2,167) |
| `shipstation` (568 — actual postage + weights) | | `pins` (41), `shopier` (476), `shopify` (57) |
| `email` (184), `actions/session.ts` | | `actions/pins.ts` |

### 3.4 `lib/db/queries` (50 modules)

- **KEEP 20** — core tree: `sales, products, listings, costs, metrics, dashboard, reports, reviews, variants, variant-stock, variant-weights, stock, product-metrics, profile, team, audit, timeline, tasks, alerts, data-gaps`.
  _Caveat:_ `alerts.ts` emits `below_melt`, `discount_below_melt`, `market_price_position` — those three rows are pricing and must be removed.
- **KEEP 3 ads** — `ads-actions`, `ads-daily`, `ads-ledger` (highest-fidelity ad cost, needs no CSV, already joins offsite fee → receipt → sale).
- **KEEP 5 Etsy ops** — `etsy`, `etsy-insights`, `listing-audit`, `diagnostics`, `missing-weights`.
- **DELETE 7 — violation** — `keyword-research`, `keyword-ideas`, `market-alerts`, `seo-tags`, `discount-bundles`, plus salvage-then-delete `listing-health` (mixes real health signals with `suggested_price_cents`).
- **DELETE 12** — `designs`, `design-boards`, `generated-images`, `photo-production`, `pins`, `social`, `cart-recoveries`, `listing-archive`, `listing-images`, `star-seller`, `shopier`, `shopify`.
- **Second look before deleting:** `metric-inquiries` (the "ask the team" branch of the playbook) — it creates a *question*, not a task, so by the rule it goes; flagging because it was deliberate design.

### 3.5 Scripts

KEEP `dev-supabase-setup.sh` (required to run the app), `fill-weights-from-description.ts`
(one-shot, feeds COGS). DELETE the rest — `eon-push-drafts.ts` and
`restore-listing-prices-from-etsy.ts` are Etsy write/pricing paths; `eon-qa/` (5 Python),
`eon-ghost-bank`, `eon-upload-covers`, `ops-repair-*` are spent one-shots; the four
brand/creative `.mjs` generators carry no metric.

---

## 4. Database — 72 tables

### 4.1 KEEP (18)
`organizations, organization_members, profiles, org_invites, platform_admins` (tenancy) ·
`products, product_variants` (catalog + grams) · `sales, sale_items` (revenue) ·
`etsy_connection, etsy_ledger_entries, etsy_listing_stats, etsy_shop_snapshots` (API spine) ·
`costs, cost_categories` (COGS) · `shop_metrics, product_metrics` (weekly batch) ·
`tasks` (action queue)

### 4.2 MERGE / rework (6)
`ad_daily_stats` + `ads_actions` → ads row + decision log · `task_notes` → decision-log
entries · `csv_imports` → weekly import ledger · `alert_state` → rule-fire dedupe ·
`reviews` → keep only for the ≤3-star and no-review rules

### 4.3 DELETE — scope violations (11)
`keyword_research, keyword_ideas, seo_tag_optimizations, competitor_prices,
competitor_watch, competitor_variant_match, market_price_alerts, market_price_decisions,
latest_market_decision, reprice_rules, reprice_log`

### 4.4 DELETE — outside the tree (16)
`designs, design_boards, design_collections, design_pins, design_pin_comments,
generated_images, photo_production, pins, pin_stickers, discount_bundles,
star_seller_snapshots, cart_recoveries, metric_inquiries, metric_inquiry_responses,
shopier_connection, etsy_oauth_states`(keep if OAuth stays)

### 4.5 Two things I will not touch without your word

**`ha_*` — 13 tables from a different application.**
`ha_hotels, ha_guests, ha_departments, ha_shift_reports, ha_handover_items,
ha_follow_ups, ha_hotel_members, ha_reminder_logs, ha_users`, etc. **No migration in
this repo creates them. No line of app code references them.** They appear to be a
hotel-handover app sharing this Supabase project. They are not Amuletta's to delete —
confirm with whoever owns that app first. Flagging, not touching.

**`audit_log` — 274,570 rows, 336 MB, the largest object in the database.**
It is written by a Postgres trigger on every create/update/delete (company memory, per
`CLAUDE.md`). By the ONE RULE it shows no metric and creates no task, so `/kayitlar` as a
*screen* goes. But it is also the compliance trail, and it is 336 MB. Recommend: keep the
table, delete the screen, add a retention policy. Your call on retention window.

### 4.6 New tables PHASE 1 needs
`weekly_gold_price(date, usd_per_ozt)` — **nothing persists spot today**;
`lib/gold-price.ts` only holds a 1-hour in-process cache with a hardcoded `4088`
fallback. A cost snapshot at order time cannot be reconstructed. ·
`pricing_engine_import` (read-only xlsx mirror + import timestamp) ·
`weekly_traffic` (shop-stats CSV) · `decision_log` (date, hypothesis, change, measure
date, result) — `ads_actions` is the closest existing shape but is ads-only and has no
measure-date.

---

## 5. Rules engine — what exists vs. what must be built

| # | Rule | Status | Where / gap |
| --- | --- | --- | --- |
| 1 | `contribution_margin < 0` or price below floor | **Rework** | `operating_profit_monthly` is monthly, not per-order, and excludes ad cost (§1.4). Floor logic exists but inside the pricing engine being deleted — floor must come from the xlsx import. |
| 2 | ads: 30d, spend >$30, orders 0, favorites <2 | **Exists, needs rewiring** | `lib/ads/meta.ts` + `ads-ledger.ts` have spend and orders; favorites from `etsy_listing_stats`. Thresholds differ — align to spec. |
| 3 | views >25 AND favorites 0 (30d) | **Exists** | `etsy_listing_stats`. **1 EON listing fires today.** No CSV needed. |
| 4 | title <110 chars OR tags <13 | **Half exists — direction bug** | `lib/etsy/listing-audit.ts` flags titles that are too **long** (>140 chars, >15 words). A 60-char title passes silently today. Tag rule `tags < 13` is correct and reusable as-is. |
| 5 | size scale attribute missing / style attribute wrong | **Missing** | Attributes are fetched but no completeness check exists. |
| 6 | receipt has personalization or half-size note → QC gate | **Missing entirely** | Grep across the repo finds personalization only in outbound listing-**creation** code. **Nothing reads the buyer's personalization value off a receipt.** Your highest-value rule (2 of first 5 orders shipped with spec errors) has zero implementation — it must be built, not salvaged. |
| 7 | delivered +7d, no review, no follow-up logged | **Partly** | `reviews` synced; delivery date from ShipStation. "Follow-up logged" needs a field — and note the follow-up itself is Alura's, so the panel only checks that it *fired*. |
| 8 | gold spot moved >5% since last reprice import | **Missing** | No persisted spot history (§4.6). Needs `weekly_gold_price` first. |

**Score: 2 usable as-is, 3 need rework, 3 must be built.**

---

## 6. Gaps PHASE 1 must close

1. **Traffic-source CSV importer does not exist.** `shop_metrics.traffic_sources` is a
   hand-typed jsonb. This is the weakest leg of the tree — Revenue/AOV/margin are
   API-served, Visits is not. `lib/csv/mappers/etsy-ads-daily.ts` is a good template
   (fuzzy header aliasing, `Jul 1, 2026` date parsing, TZ-safe, dedupe-by-day, upsert).
2. **The pricing-engine xlsx is not in the repo** and there is **no xlsx parser
   dependency** in `package.json`. Both need adding, plus the file itself
   (`2026-07-16-eon-pricing-engine.xlsx`).
3. **Architecture families do not exist as data.** Meridian / Obelisk / Testament /
   Keystone / Cornice appear only as prose in `public/brand/README.md` and two
   migrations. Screen 3 requires a family column + Wide flag per listing — needs a
   mapping you supply.
4. **Catalog is 41 listings, target is 16.** EON currently has 26 active + 14 draft +
   1 sold_out (non-archived). The lock-down to 16 is a data decision, not a code one.
5. **Existing traffic data has an integrity problem.** July `traffic_sources` sums to
   **326 across six buckets while `visits` reads 261**, and `etsy_app` and `etsy_ads`
   are both exactly `107` — which looks like a copy error at entry. The importer should
   validate that sources sum to visits and reject rather than absorb the discrepancy.

Mapping the six existing buckets onto your four sources is otherwise clean:
`etsy_search` → Etsy search · `etsy_app + etsy_marketing` → Etsy internal ·
`etsy_ads` → Ads · `direct + social` → External.

---

## 7. What I recommend deciding now

1. **Disable the reprice cron immediately** (§1.5) — it can rewrite live Etsy prices
   while we work. This is the one item I would not wait on.
2. **Gray-box behaviour** (§1.1) — ship fully gray as specified, or gray + "n of 100"
   distance-to-significance. I recommend the latter.
3. **`ha_*` tables** (§4.5) — confirm they belong to another app and who owns them.
4. **`audit_log` retention** (§4.5) — keep table, delete screen, pick a window.
5. **Architecture family mapping** (§6.3) — needed for screen 3.
6. **The xlsx** (§6.2) — drop `2026-07-16-eon-pricing-engine.xlsx` in the repo so
   PHASE 1 can build the read-only mirror against the real sheet.

Nothing is deleted until you approve this list.
