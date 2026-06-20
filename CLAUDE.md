# CLAUDE.md — Jade Gold NYC Yönetim Paneli

Jade Gold NYC Etsy mağazası için uçtan uca yönetim/raporlama paneli. Tüm süreçler
(satış, maliyet, analiz, tasarım, yorum) burada işlenir, kalıcı **şirket hafızası**
(denetim logu) olarak loglanır ve raporlanır.

## Stack
- **Next.js 16** (App Router, TS, React 19, Turbopack) — `cookies()`, `params`,
  `searchParams` **async**'tir (`await` edin).
- **Supabase** (Postgres + Auth + Storage + RLS). İstemciler `lib/supabase/`.
- **Tailwind v4** (CSS tabanlı tema, `app/globals.css`) + el ile yazılmış shadcn/ui
  bileşenleri (`components/ui/`). shadcn CLI bu ortamda erişilemiyor — bileşenleri elle ekleyin.
- Kök istek ara katmanı **`proxy.ts`** (Next 16; eski `middleware` konvansiyonu).

## Mimari desenler
- **Auth:** `lib/auth.ts` (`requireUser`/`requireMembership`). `(dashboard)/layout.tsx`
  asıl kapı. `proxy.ts` oturum tazeler + korumalı rotayı `/login`'e yönlendirir.
- **Modül deseni** (Satışlar referans): `app/(dashboard)/<modul>/` içinde
  `page.tsx` (RSC liste) + `actions.ts` (server actions: create/update/delete) +
  `yeni/`, `[id]/`, `[id]/duzenle/`. Okumalar `lib/db/queries/`, doğrulama
  `lib/validations/` (zod). Yeni modül = bu beş parçayı kopyala.
- **Şirket hafızası:** Postgres trigger'ı (`supabase/migrations/0011`) her
  create/update/delete'i `audit_log`'a yazar; `actor_id = auth.uid()`. Semantik
  olaylar (login, csv.import, etsy.*) `lib/audit.ts` `logAudit` → `log_audit` RPC.
  `etsy_connection` BİLEREK trigger'sız (token sızmasın).
- **Para:** her zaman tam sayı **cent** + `currency`. `lib/money.ts`.
- **CSV import:** `lib/csv/` (papaparse + mappers). İstemci ayrıştırır/önizler,
  `commitSalesImport` server action yazar (`onConflict: org_id,etsy_receipt_id`).
- **Etsy:** `lib/etsy/` (OAuth2-PKCE + auto-refresh client + sync). API route'ları
  `app/api/etsy/{connect,callback}`. Kimlik bilgileri girilene kadar inert.

## Komutlar
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck`
- Provizyon: `supabase/migrations/0001..0013` sırayla uygulanır (Supabase SQL/MCP).
  Ayrıntı: `README.md`.

## Notlar
- Supabase istemcileri tipsiz; sorgular `lib/types.ts` alan tiplerine cast eder.
  Provizyon sonrası `supabase gen types` ile `types/database.types.ts` üretilebilir.
- Para alanları formlarda metin (örn. "12,34"); action'da `parseMoneyToCents`.
- Dev tooling (superpowers/codegraph) için `docs/dev-tooling.md`.

@AGENTS.md
