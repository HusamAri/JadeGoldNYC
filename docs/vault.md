# Vault — Project Knowledge Log (Jade Gold NYC Panel)

Cross-session institutional/technical memory: what we learned, how we built it,
which tools/agents were useful. (In this ephemeral env, persistence = committing this file.)

---

## 1. Branding

**A full brand system already lives in `public/brand/`** (generated with Higgsfield/Recraft AI):
- **Logos** (`logo/`, transparent SVG, antique gold `#B89347`): `logo-primary`, `logo-wordmark`,
  `logo-stacked`, `monogram-jg` (interlocking JG), `seal-badge` (circular stamp).
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

**General patterns:**
- **Migration flow**: apply live via Supabase MCP (`apply_migration`) **and** commit a `supabase/migrations/NNNN_*.sql` file.
- **Money**: always integer **cents** + currency.
- **Branch flow**: develop on `claude/serene-knuth-js7wvl`; **squash-merge** PRs; after merge
  `git reset --hard origin/main` + new commit (`--force-with-lease` if diverged).
- **Verified commits**: `git config user.email noreply@anthropic.com && user.name Claude`.
- **Inert-until-keys**: integrations stay dormant until keys exist; build the scaffold first, deploy,
  let the user sync, then **inspect raw data in Supabase → refine the mapping** (proven on Etsy + ShipStation).

---

## 3. Data Findings (Jade Gold NYC)

- **Sales**: `sales` 10,794 receipts, **2022-03 → 2026-06**, item revenue **$2.79M**.
- **ShipStation**: 2,542 orders · 1,833 shipments · 2,645 line items (886 SKUs) · 2,196 customers · 2,541 products.
- **Shipping (postage)**: Etsy ledger $3,901 + ShipStation $12,502 = **$16,404** (distinct periods, no overlap).
- **Karat**: **99.9%** of line items have 10K/14K in the name. 14K $1.14M / 10K $0.88M (≈**56/44** mix).
- **No gold weight (grams) and no cost data ANYWHERE** → melt-value-based auto COGS is **not possible**.
  ShipStation `defaultCost` is empty (0/2541). **COGS is waiting on a real cost list (SKU→cost).**
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

_Last updated: 2026-06 session (ShipStation integration + costs + cron + site-wide logo + guidelines redesign)._
