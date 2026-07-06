# Vault — Project Knowledge Log (Jade Gold NYC Panel)

Cross-session institutional/technical memory: what we learned, how we built it,
which tools/agents were useful. (In this ephemeral env, persistence = committing this file.)

---

## 1. Branding

**A full brand system already lives in `public/brand/`** (generated with Higgsfield/Recraft AI):
- **Logos** (`logo/`, transparent SVG): `logo-primary`, `logo-wordmark`, `logo-stacked`, `monogram-jg`,
  `logo-arch`, `seal-badge` (circular stamp). **2026-07 refresh**: swapped in the user's new Higgsfield set —
  monogram is now the "butterfly" interlocking-loops emblem, plus a new arch monogram. Marks baked to one
  antique gold **`#9A7A33`**; wordmark "NYC" changed charcoal→gold so it survives dark mode.
- **Theme-adaptive in-app mark**: `components/layout/logo.tsx` no longer uses `next/image` — it paints
  `monogram-jg.svg` + `logo-wordmark.svg` as CSS `mask-image` filled with `bg-brand-mark` (new `--brand-mark`
  token in `globals.css`: deep gold in light, bright gold in dark) → the sidebar/topbar/login mark inherits the
  theme gold like `currentColor` (≥AA both themes). Brand-asset backings (favicon/apple/OG) stay charcoal+gold.
- **Icons** (`icons/`): 8 line icons (chain, loupe, diamond, ring, skyline, column, shield, monogram).
- **Gallery** (`gallery/`): real product shots, WebP, 4 groups (light/dark/model/nyc).
- **Guidelines board**: `public/brand/jade-gold-nyc-guidelines.html`, generator
  `scripts/build-brand-guidelines.mjs` (`node scripts/build-brand-guidelines.mjs`), fixed canvas 1728×1152, self-contained.
- **Registry**: `lib/brand-assets.ts` (`BRAND_GALLERY`, `BRAND_LOGIN_HERO`).

**Palette:** Gold `#B89347` · Ivory `#F2EFE6` · Stone `#A39F94` · Jade `#3F4A44` · Charcoal `#131313`.
**Typography:** Meno Banner (Didone display) + ITC Avant Garde Gothic (geometric sans).

**Logo placement in the app** (`components/layout/logo.tsx` renders the real monogram):
- sidebar, mobile topbar, login, favicon (`app/icon.svg`), apple-icon (`app/apple-icon.tsx`),
  OG share card (`app/opengraph-image.tsx`), 404 (`app/not-found.tsx`),
  loading (`app/loading.tsx`), branded PDF (`components/report-export.tsx`).

**Design principles (from research + practice):**
- Two versions: **wordmark** in wide space, **monogram** in tight space. Restraint + whitespace + ≥40px targets.
- Guidelines board redesign: kill logo inflation → **faint "cold stamp" watermark** (opacity ~.035, monochrome,
  parked in a dead corner, clear of copy), **corner hallmarks**, **≤2 marks per panel**, dark ink on light cards (AA+).
- `next/og` generates apple-icon + OG at build time (self-contained, no CDN).
  **Prod needs `NEXT_PUBLIC_SITE_URL`** for absolute OG URLs (otherwise `metadataBase` falls back to localhost).

---

## 2. Technical / Architecture

**ShipStation integration** (mirrors the Etsy pattern):
- Legacy API `ssapi.shipstation.com`, **HTTP Basic auth** (`SHIPSTATION_API_KEY/SECRET`), **40 req/min** limit.
- Tables: `shipstation_{orders,shipments,products,order_items,carriers,customers}` + `shipstation_connection`
  (resumable sync cursor). Migrations `0029`–`0031`.
- Sync phases: **orders → products → carriers → shipments**; page-cursor, time-budgeted (~50s), domino.
- **Rate limit**: on 429, if `X-Rate-Limit-Reset` is short AND fits the action deadline → wait+retry; else **pause**
  (never sleep past the server action's 60s).
- **Items + customers without API**: extracted from `orders.raw` via SQL
  (`rebuild_shipstation_order_items`, `rebuild_shipstation_customers`).
- **Costs**: postage → Costs/Shipping (`rebuild_shipstation_costs`, `source='shipstation'`).
- **Daily cron** (`vercel.json`): Etsy 06:00, ShipStation 07:00 → the panel keeps itself current.

**Gold COGS auto-computation** (2026-07):
- Source of weight = **`product_variants.weight_grams` by SKU** (NOT `products.weight_grams`). `sale_items.sku` joins to it.
- Formula lives in `lib/gold-cost.ts` (`calculateGoldCost`): melt value at karat purity + labor = max(0, purchase − melt).
  Because purchase price is a fixed per-gram floor (14K 101¢/g, 10K 65¢/g) and gold market value is below it, **total COGS
  is insensitive to the exact spot price** — the oz price only shifts the material/labor split. Default oz used: 4088.
- **`rebuild_gold_costs(org, oz_price)` RPC** (migration `0060`): set-based, idempotent (skips sales that already have a
  `gold_auto` cost). Node per-sale loop can't do 10k sales in a 40s cron → the bulk path (sync, cron, "Geriye Dönük
  Hesapla") calls this RPC via `rebuildGoldCostsBulk`. Real-time single-sale path (manual/CSV) uses the fixed JS.

**Etsy review status sync** (2026-07, migration `0059`): Etsy Open API v3 review object **does NOT expose the shop's
reply** (no reply text, no "replied" flag) → panel is the source of truth for reply tracking. Fixes: (1) sync no longer
clobbers panel-set `status`/`response_text` (upsert omits those cols → new rows default 'yeni', existing preserved);
(2) captures `etsy_updated_at` and `reconcile_reviews_after_sync(org)` resurfaces a review to 'yeni' if the buyer edited
it on Etsy after we replied.

**SECURITY — security-definer function grants** (migrations `0056`/`0057`/`0058`/`0059`/`0060`): any SQL function that
takes `p_org_id` without a membership check + `security definer` = RLS-bypass. **Restrict to `service_role`.** ⚠️ Gotcha:
Supabase **default privileges grant EXECUTE to `authenticated` DIRECTLY**, so `revoke ... from public, anon` is NOT
enough — you must **also `revoke execute ... from authenticated`**. Always verify with `has_function_privilege(...)`.
0058 also: only the FIRST user becomes owner (`handle_new_user`), no auto-membership; dropped `avatars_public_read`.
Two config items only the user can do: Supabase Auth → disable "Enable Signups" + enable leaked-password protection.

**General patterns:**
- **Migration flow**: apply live via Supabase MCP (`apply_migration`/`execute_sql`) **and** commit a `supabase/migrations/NNNN_*.sql` file.
- **Money**: always integer **cents** + currency.
- **Branch flow**: current dev branch `claude/higgsfield-videos-9q2lwp`; PRs **merged** to main; after merge restart the
  branch from `origin/main` (keep name) + new commit (`--force-with-lease` if it only carries merged history).
- **Verified commits**: `git config user.email noreply@anthropic.com && user.name Claude`.
- **Inert-until-keys**: integrations stay dormant until keys exist; build the scaffold first, deploy,
  let the user sync, then **inspect raw data in Supabase → refine the mapping** (proven on Etsy + ShipStation).
- **Sandbox limits**: `.env.local` has PLACEHOLDER `ETSY_API_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` → can't call Etsy live
  or use service role from the sandbox; all DB writes go through **Supabase MCP**; Etsy-write features run in prod only.

---

## 3. Data Findings (Jade Gold NYC)

- **Sales**: `sales` ~10,805 receipts, **2022-03 → 2026-07**, item revenue **$2.79M**.
- **ShipStation**: 2,542 orders · 1,833 shipments · 2,645 line items (886 SKUs) · 2,196 customers · 2,541 products.
- **Shipping (postage)**: Etsy ledger $3,901 + ShipStation $12,502 = **$16,404** (distinct periods, no overlap).
- **Karat**: **99.9%** of line items have 10K/14K in the name. 14K $1.14M / 10K $0.88M (≈**56/44** mix).
- **Gold weight NOW EXISTS at the VARIANT level** (`product_variants.weight_grams`, keyed by SKU; user fills it via
  the "Eksik Ağırlık" page). ⚠️ **UPDATE (2026-07): earlier "auto COGS not possible" is OBSOLETE.** COGS is now
  auto-computed from **SKU → `product_variants.weight_grams` × karat × gold price** (melt value + labor-to-purchase).
  Coverage grows as weights are filled: at 170/2541 variants weighed → **1,432 items / 1,411 sales** priced (~**$429K** COGS),
  i.e. **6 → 1,417 sales (0.06%→13.1%)** after backfill. `products.weight_grams` is a dead end (1/118 filled) — never use it as primary.
  ShipStation `defaultCost` is empty (0/2541).
- **Carriers**: Stamps.com, UPS, FedEx, GlobalPost.
- **Cost categories** (`cost_categories.key`): `malzeme, kargo, etsy_ucretleri, reklam, iscilik, paketleme, yol_ulasim, diger`.
- **Cost sources** (`costs.source`): `manual, csv, etsy, etsy_ledger, shipstation, cogs_estimate`.
- Net margin (full for 2024+; ads/fees partial for 2022-24): Ads $83K · Etsy Fees $77K · Shipping $16K.

---

## 4. Skills / Tools / Agents That Worked

- **`design-agent`** ⭐ — brand-asset placement + design polish; enforces the brand system + WCAG AA.
  Used for logo placement, guidelines redesign, site-wide logo. *Note: can hit a session limit on long jobs and
  stop after editing the script but before regenerating output → I finished it with `node …`.*
- **Orchestrator pattern** — main loop = orchestrator (research/discovery/brief/verify),
  `design-agent` = executor. Ground the brief with `WebSearch` playbook research.
- **Supabase MCP** (`execute_sql`, `apply_migration`) — live DB inspection + migrations. Inspecting raw `raw jsonb`
  before building the mapping is high-value.
- **Vercel MCP** (`list_deployments`, `get_runtime_logs`) — diagnose "X is gone/broken" complaints:
  is the data intact + deploy healthy + any runtime errors? ("shipstation gitmiş" → all healthy, it was browser cache.)
- **GitHub MCP** — open/merge PRs. *Occasionally disconnects then reconnects (retry); a draft PR needs
  `update_pull_request(draft:false)` before merge.*
- **Codex auto-review** — catches real bugs; e.g. `window.open(…, "noopener,noreferrer")` returns **null** →
  PDF export silently does nothing. Take its P2s seriously.

---

_Last updated: 2026-07 session (gold COGS from variant SKU weight + backfill · Etsy review status sync · security
hardening 0056–0060 · new Higgsfield logo set + theme-adaptive mark · Framer Motion panel-wide · missing-data notices)._
