-- 0120 — Fiyat motoru SALT-OKUNUR aynası (Amuletta PHASE 1).
--
-- Fiyat panelin DIŞINDA belirlenir (EON fiyat motoru xlsx). Panel fiyat
-- HESAPLAMAZ/ÖNERMEZ (0119 `externalPricing`); yalnız motorun çıktısını
-- içe aktarıp OKUR. Bu tablolar bu yüzden bir AYNA'dır:
--
--   * Elle DÜZENLENMEZ. Kaynak dosya değişince yeniden içe aktarılır
--     (`scripts/import-pricing-engine.ts`), satırlar tazelenir.
--   * Panel bu değerlerden yeni fiyat TÜRETMEZ; katkı marjı hesabında
--     `landed_cents` (maliyet) ve zemin kontrolünde `floor_cents` okunur.
--   * Her içe aktarım kaynak dosyanın SHA-256'sını ve spot'u saklar →
--     "hangi fiyat hangi varsayımla üretildi" geriye dönük yanıtlanabilir
--     (0119 sonrası fiyatın tek doğruluk kaynağı budur).
--
-- Kaynak: 2026-07-28-eon-etsy-giris-grid-spot4090-v2.xlsx
-- (2026-07-16 sürümünün yerine geçti; o dosya repo'ya hiç girmedi).

create table if not exists public.pricing_engine_import (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  -- Köken: hangi dosya, hangi bayt dizisi. Aynı sha tekrar yüklenirse
  -- içe aktarımın gerçekten değiştiğini/değişmediğini söyleyebilelim.
  source_filename text not null,
  source_sha256 text not null,

  -- ASM!B2 — spot değişince motorun TÜM çıktısı değişir; ayrı kolonda
  -- tutulur ki "spot %5 oynadı mı" kuralı (PHASE 3) buradan okusun.
  spot_usd_per_ozt numeric(12,4) not null,
  -- ASM sayfasının tamamı (fire, işçilik, paket, kargo, çarpan, saflıklar,
  -- Etsy kesinti oranı, offsite oranı, milgrain işçiliği…). Şema değişmeden
  -- yeni varsayım eklenebilsin diye jsonb.
  assumptions jsonb not null default '{}'::jsonb,

  row_count integer not null default 0,
  imported_at timestamptz not null default now(),
  imported_by uuid references auth.users(id),
  notes text
);

comment on table public.pricing_engine_import is
  'Fiyat motoru xlsx icin salt-okunur ayna basligi (spot + varsayimlar + dosya hash). Elle duzenlenmez; kaynak degisince yeniden ice aktarilir.';

create index if not exists pricing_engine_import_org_idx
  on public.pricing_engine_import (org_id, imported_at desc);

create table if not exists public.pricing_engine_row (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.pricing_engine_import(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,

  -- Izgara anahtarı. `profile`: 'standard' = 10K/14K/18K sayfaları (Dome
  -- gramları; GIRIS-SIRASI kararına göre Flat/Beveled/Knife AYNI gramı
  -- kullanır), 'milgrain' = MILGRAIN-14K (tek fark: işçilik 40).
  karat text not null check (karat in ('10K', '14K', '18K')),
  profile text not null default 'standard' check (profile in ('standard', 'milgrain')),
  width_mm numeric(5,2) not null,
  size_us numeric(5,2) not null,
  grams numeric(8,3) not null,

  -- Para DAİMA tam sayı cent (CLAUDE.md). Motorun kolonları:
  --   landed        = ROUND(gram*spot/g*saflik*(1+fire) + iscilik + paket + kargo, 2)
  --   engine        = ROUND(landed * carpan, 0)
  --   list          = CEILING(engine / 0.75, 5)      ← Etsy'ye GİRİLEN fiyat
  --   sale          = list * 0.75                    ← kalıcı %25 indirimle görünen
  --   floor         = ROUND((landed + 0.45) / (1 - etsy_fee), 0)
  --   offsite_floor = ROUND((landed + 0.45) / (1 - etsy_fee - offsite), 0)
  landed_cents bigint not null,
  engine_cents bigint not null,
  list_cents bigint not null,
  sale_cents bigint not null,
  floor_cents bigint not null,
  offsite_floor_cents bigint not null,

  -- Motorun kendi KONTROL kolonu: görünen sale zeminin altına düşmüyor mu.
  -- false satır varsa içe aktarım REDDEDİLİR (script), burada da izlenir.
  kontrol_ok boolean not null,

  currency text not null default 'USD'
);

comment on table public.pricing_engine_row is
  'Fiyat motoru izgarasinin satir aynasi (karat x profil x genislik x beden). Salt-okunur; panel bundan yeni fiyat turetmez.';

-- Aynı içe aktarımda ızgara hücresi tekil.
create unique index if not exists pricing_engine_row_cell_idx
  on public.pricing_engine_row (import_id, karat, profile, width_mm, size_us);

-- Varyant eşlemesi bu eksenden okur (katkı marjı: landed → maliyet).
create index if not exists pricing_engine_row_lookup_idx
  on public.pricing_engine_row (org_id, karat, profile, width_mm, size_us);

alter table public.pricing_engine_import enable row level security;
alter table public.pricing_engine_row enable row level security;

-- Okuma: org üyeliği. YAZMA POLİTİKASI YOK — bu bir ayna; yazma yalnız
-- service-role ile (import script'i) yapılır. Böylece panelden elle
-- düzenleme yapısal olarak imkânsız.
drop policy if exists pricing_engine_import_select on public.pricing_engine_import;
create policy pricing_engine_import_select on public.pricing_engine_import
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = pricing_engine_import.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists pricing_engine_row_select on public.pricing_engine_row;
create policy pricing_engine_row_select on public.pricing_engine_row
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = pricing_engine_row.org_id and m.user_id = auth.uid()
    )
  );

-- En güncel içe aktarımın satırları — tüketiciler bunu okur, "hangi import"
-- sorusunu her sorguda çözmek zorunda kalmaz.
create or replace view public.pricing_engine_current as
select r.*, i.spot_usd_per_ozt, i.imported_at, i.source_filename
from public.pricing_engine_row r
join public.pricing_engine_import i on i.id = r.import_id
where i.id = (
  select i2.id from public.pricing_engine_import i2
  where i2.org_id = r.org_id
  order by i2.imported_at desc
  limit 1
);

comment on view public.pricing_engine_current is
  'Org basina EN GUNCEL fiyat motoru ice aktariminin satirlari (+ spot ve zaman damgasi).';
