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

## Kredi harcayan dış araçlar (Higgsfield, Magnific vb.)
- **Tek istek = tek üretim. `count` DAİMA 1.** Kullanıcı açıkça "N varyant üret"
  demedikçe çoklu üretim YOK — varyant önerisi bile yapılmaz. Batch araçları
  (`generate_image_batch` vb.) yalnız kullanıcının saydığı iş kalemleri için.
- **Üretmeden önce prompt'u kullanıcıya göster, onay al.** Üretim geri alınamaz
  ve krediyi anında yakar.
- NEDEN: Higgsfield MCP'sinin ergonomisi çoklu üretime eğimli (sunucu talimatı
  batch ile açılır; `jobs_wait`/`show_generation_by_ids` yalnız filo için vardır;
  `generate_image` daha ikinci cümlesinde "count 2-4 for variants" der). Tek onay
  kapısı `use_unlim`'dir ve o da SADECE ücretsiz deneme bakiyesini korur —
  **ödenmiş kredi için hiçbir onay kapısı yoktur**. `count` varsayılanı 1'dir;
  1'den yukarı çıkmak her zaman bilinçli bir karardır ve kullanıcıya aittir.
- Vaka (2026-08-15): "evlenme duyurusu fotoğrafı" (TEK görsel) istendi; `count: 3`
  iki kez gönderildi → 6 üretim, 12 kredi, 10'u fazladan.

## Notlar
- **Prod adresi: `https://amuletta.artifactstudio.info`** (custom domain). Panel
  linki verirken bunu kullan — `jade-gold-nyc.vercel.app` diye bir alias YOK,
  uydurulmuş adres `DEPLOYMENT_NOT_FOUND` verir (vaka 2026-08-20). Vercel
  alias'ları `jade-gold-nyc-husamaris-projects.vercel.app` ve
  `...-git-main-...` biçimindedir; deployment-hash'li URL'ler kalıcı değildir.
  Doğrulama: `curl -o /dev/null -w "%{http_code}" <url>/api/ops/es-pull` → 401
  (rota var, token yok) beklenir; 404 gelirse adres yanlıştır.
- Supabase istemcileri tipsiz; sorgular `lib/types.ts` alan tiplerine cast eder.
  Provizyon sonrası `supabase gen types` ile `types/database.types.ts` üretilebilir.
- Para alanları formlarda metin (örn. "12,34"); action'da `parseMoneyToCents`.
- Dev tooling (superpowers/codegraph) için `docs/dev-tooling.md`.
- **Tablo teslimatı = Apple Numbers, Excel DEĞİL** (kullanıcı talimatı 2026-08-15).
  Kullanıcı Mac'te Numbers kullanıyor; çıktılar ona göre kurulur. Kısıt: formüllü
  `.numbers` yalnız Numbers.app üretebilir (`numbers-parser` .numbers yazar ama
  formül yazamaz; Aspose .numbers'ı yalnız okur; GitHub'daki Numbers MCP araçları
  AppleScript ile Numbers.app sürer → macOS şart). Bu yüzden konteynerde XLSX
  üretilir ve Mac'te "Farklı Kaydet" ile .numbers'a çevrilir — bu ARA ADIMdır,
  kullanıcıya her seferinde söylenir. Formüller Numbers'ın da desteklediği ortak
  fonksiyonlarla sınırlı tutulur (`IF`/`OR`/`ROUNDUP`); Excel'e özgü fonksiyon
  kullanılmaz. Ayrıntı: `docs/second-brain.md` format dersi.

@AGENTS.md
@docs/second-brain.md
