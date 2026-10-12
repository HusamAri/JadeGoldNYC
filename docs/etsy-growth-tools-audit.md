# Etsy Growth Tools × Amuletta Panel — Audit (2026)

**Branch:** `artifact/etsy-growth-tools-audit-b469`  
**Scope:** External seller-tool landscape (2025–2026) vs Amuletta surfaces; number/logic spot-check of growth KPIs; prioritized deepen-not-bloat recommendations.  
**Constraint:** Prefer enhancing existing routes; flag duplication (SEO/listing surfaces already overlap).

---

## 1. External tool categories (2025–2026)

Sources consulted (comparison roundups, not vendor ads alone): ListingBrief, Craftybase blog, ShopFoundry compare, MintTags, ListingLoom, Alura Followup Reminder, Craftific review-policy notes, OrderBridge/eDesk follow-up guides.

| Category | Representative tools | Job-to-be-done |
|---|---|---|
| Keyword research | eRank, Marmalead, Sale Samurai, EverBee KW | Volume / competition / seasonality / long-tail tags |
| Product / niche research | EverBee, EtsyHunt | Estimated sales/revenue on competitor listings |
| Listing optimization / LQS | Alura Listing Helper, Marmalead grades, eRank audit | Title/tags/description/photos checklist + score |
| Listing writing / AI copy | Alura, Marmalead Marma, ShopFoundry, MintTags | Title + 13 tags + description draft |
| Shop / competitor analytics | Crest, eRank shop, EverBee tracked shops | Rank, views, conversion, competitor watch |
| Etsy Ads decisioning | Native Etsy Ads + spreadsheet/CSV tools | ROAS, budget share, pause/scale decisions |
| Review request / follow-up | Alura Followup Reminder, EHunt, OrderBridge, eDesk | Post-delivery message queue (Etsy Messages-safe) |
| Winback / CRM / repeat | Seller CRM, Putler-class, CraftPilot notes | Lapsed buyers, size/style memory, return prompt |
| COGS / inventory | Craftybase | Recipes, materials, true unit cost, stock push |
| Packaging / fulfillment cost | Packagly (packaging ops), Craftybase packaging-in-recipe | Box/kit cost in COGS; not a growth SEO tool |

**Market takeaway:** Sellers usually pair one *research* tool (eRank/EverBee/Marmalead) with one *execution* surface (listing write + ads triage + review follow-up). All-in-ones (Alura) win on breadth; pure research wins on keyword depth. Amuletta’s edge is **owned shop truth** (sales, costs, ads ledger, audit log) — not scraping Etsy’s public search graph.

---

## 2. Panel parity map

| Category | Amuletta today | Gap vs external tools | Duplication risk |
|---|---|---|---|
| Keyword research | `/anahtar-kelime` (rule/AI + optional DataForSEO), `/analizler/urunler/anahtar-kelime` | No live Etsy search-volume overlay like Marmalead/eRank; demand often heuristic | **High** with SEO Yardımcısı / SEO Etiketleri |
| Listing write / SEO draft | `/seo-yardimcisi` (client `generateSeo`, 13 tags + score) | No competitor SERP paste-in; honesty checks are a strength | **High** — overlaps tag push + LQS |
| Tag push + measure | `/seo-etiketleri` (13-tag optimize → Etsy write + baseline views/favs) | Alura/Sale Samurai bulk UX; measure loop is panel-unique | Medium — keep as *execution*, not second research UI |
| Listing audit / LQS | `/tasarimlar/iyilestir` (`scoreListing` 1–100, handbook checks) | Alura has richer UX; panel is handbook-grounded (good) | Medium with SEO Yardımcısı score |
| Listing ideas | `/listing-onerileri` | Product-research depth of EverBee | **High** if expanded as another SEO hub |
| Ads | `/reklamlar` (CSV daily + API ledger + “son 30” signals + triage) | No onsite listing-level spend via API (Etsy limitation — honestly documented) | Low |
| Reviews | `/yorumlar` + response panel | No automated post-delivery review-request queue | Low if built as thin queue on existing Yorumlar |
| Winback | `/sepet-kurtarma` + winback RPCs | Not full CRM; buyer memory documented separately | Medium vs future `/musteriler` — docs already say “no parallel CRM” |
| Buyer memory | `docs/buyer-memory.md` (+ automations) | Implementation incomplete vs Putler/CRM | Keep single profile surface |
| Costs / COGS | `/maliyetler`, gold cost (`lib/gold-cost.ts`), fixed-cost migrations | Craftybase recipe/manufacture depth | Low — deepen costs, don’t clone Craftybase UI |
| Panel KPIs | `/panel` (`getDashboard`) | Profit trust still limited by refunds/COGS coverage (see `docs/veri-denetimi-raporu.md`) | — |
| Reports / analytics | `/raporlar`, `/analizler` | Competitor estimated revenue (EverBee) absent | Prefer enriching Analizler over new modules |
| Packaging | — | Packagly-class ops not present | **Skip** unless packaging cents enter COGS recipes |

---

## 3. Prioritized recommendations (max 5)

1. **Deepen Listing İyileştirme as the single “listing health” hub**  
   Keep LQS + handbook findings; deep-link into SEO Etiketleri (push) and SEO Yardımcısı (draft) instead of adding a sixth SEO page. Kill parallel score widgets if they diverge.

2. **Ads: improve decision quality, not new Ads modules**  
   Keep triage + ledger + CSV; add clearer “organic vs paid” before/after on action rows. Do not promise listing-level onsite spend (API gap).

3. **Review follow-up as a thin queue on `/yorumlar`**  
   Highest Alura-parity growth lever missing: post-delivery “ask once” checklist with Etsy Messages compliance. Do **not** invent off-platform email automation.

4. **Buyer memory → winback handoff (existing docs)**  
   Finish buyer profile facts (size/style/gift) and link from Geri Kazanım; do not embed CRM into sepet-kurtarma.

5. **Keyword demand: one enrichment path**  
   If DataForSEO (or similar) is on, surface volume only inside `/anahtar-kelime` and feed SEO Yardımcısı — avoid a second “research console.”

**Explicit non-goals (bloat / duplication):** Packagly clone, EverBee Chrome overlay, second LQS page, Automations UI (auth blocked), parallel CRM on winback.

---

## 4. Number / logic verification

### Method
- Static formula review of `lib/money.ts`, `lib/gold-cost.ts`, `lib/etsy/listing-audit.ts`, `lib/ads/meta.ts`, `lib/seo/keyword-engine.ts`, `lib/db/queries/{dashboard,ads-actions,seo-tags,cart-recoveries,listing-audit}.ts`
- Executable spot-check via `tsx` (log: `/opt/cursor/artifacts/growth-math-spotcheck.log`)
- `npm run typecheck` + `npm run lint` — both clean on this branch
- Local Supabase not required for pure-function checks; prior DB reconciliation remains in `docs/veri-denetimi-raporu.md`

### Results

| Surface | Check | Result |
|---|---|---|
| Money | `parseMoneyToCents("12,34")`→1234; TR/US formats; `formatMoney` | **PASS** |
| Gold cost | 14K @ $2650/oz × 5g: melt + labor = purchase; 18K derive = melt18 + 14K labor premium | **PASS** |
| LQS | Penalties sum → score; `"gold"≈"golds"` duplicate; `2/13 tag`; avg round | **PASS** |
| Ads signals | bosa / bütçe yiyen / fırsat mutually exclusive; share÷total; spend≤0 skipped | **PASS** |
| SEO Yardımcısı | 13 multi-word ≤20-char tags; 8/8 checks with valid `SeoInput` | **PASS** |
| SEO summarize | pending+approved counted as pending; archetype tallies | **PASS** |
| Ads display limits | KPIs from full set; tables `slice` only (`SPEND_TABLE_LIMIT` / ledger / daily) | **PASS** (by code review) |
| Dashboard cents | Revenue/cost/profit integer cents; `fetchAllPages` avoids silent 1000-row truncation | **PASS** (code); **trust caveat** below |
| Winback tiers | `[min,max)` buckets | Label was misleading → **fixed** |

### Known trust caveats (not re-broken here)
`docs/veri-denetimi-raporu.md`: panel↔DB math matches, but profit can be inflated by refunds not reflected + incomplete gold COGS. Growth decisions on *relative* trends remain usable; absolute margin decisions should wait on COGS/refund work.

### Silent-error review
Growth queries generally `console.error` then return empty (ads, winback, seo list). SEO measure-loop product join previously logged nothing on failure → **fixed** (log `getSeoOptimizations products:`).

---

## 5. Bugs found / fixed on this branch

| Issue | Severity | Fix |
|---|---|---|
| Winback tier labels said `90-180` / `180-365` while filter is `[min,max)` (day 180 in second bucket) | Low (UX / off-by-one) | Labels → `90–179` / `180–364` in `sepet-kurtarma/page.tsx` |
| `updateCartRecovery` / `deleteCartRecovery` omitted explicit `org_id` (RLS still protected) | Low (defense-in-depth) | Filter by `m.org_id` |
| SEO pushed-row product views fetch ignored `error` | Low (silent measure gap) | `console.error` in `lib/db/queries/seo-tags.ts` |

No incorrect cent math, LQS penalty math, gold formula, or ads ROAS double-count found in the spot-checked paths.

---

## 6. Evidence pointers

- Spot-check log: `/opt/cursor/artifacts/growth-math-spotcheck.log`
- LQS engine: `lib/etsy/listing-audit.ts` (`scoreListing`, `ETSY_TAG_LIMIT=13`)
- Ads signals: `lib/ads/meta.ts` (`computeAdsSignals`)
- Ads totals: `lib/db/queries/ads-actions.ts` (`getAdsOverview` + `fetchAllPages`)
- Gold: `lib/gold-cost.ts`
- Money: `lib/money.ts`
- Prior KPI audit: `docs/veri-denetimi-raporu.md`
- Buyer memory product intent: `docs/buyer-memory.md`
