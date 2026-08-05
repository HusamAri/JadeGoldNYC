-- 0126 — FAZ 5: fiyat panele geri dönüyor (tek kol = spot, kuru onaylı itiş)
-- ---------------------------------------------------------------------------
-- `externalPricing` GEÇİCİ bir durumdu: aynı anda iki arıza kapatılmıştı —
-- (1) Etsy'ye programlı yazan gözetimsiz bir cron, (2) doğrulanmış motorla
-- örtüşmeyen bir panel fiyat hesabı. İkisi de düzeltildi; bu migration
-- fiyatın panele KURALLI biçimde dönmesi için gereken iki tabloyu kurar.
--
-- KALICI KURALLAR (bayrak kalksa da geçerli):
--   * Etsy'ye programlı/gözetimsiz yazma YOK. Onayı insan verir.
--   * Elle yazılan fiyat YOK. Her fiyat motor fonksiyonundan türer.
--   * Her itişin ÖNÜNDE yetkili bir kuru-çalıştırma farkı durur.
--   * Her itiş audit_log'a yazılır.

-- ── pricing_config — motorun ayarlanabilir girdileri ──────────────────────
-- Org başına TEK satır. `spot_usd_per_ozt` arayüzdeki tek düzenlenebilir
-- fiyat girdisidir; kalan alanlar AYAR'dır ve yalnız onaylı ayar ekranından
-- değişir (audit_log'a yazılır). Fiyat kolonu YOK — hiçbir yerde elle fiyat
-- girilmez, her fiyat bu girdilerden türetilir.
create table if not exists public.pricing_config (
  org_id uuid primary key references public.organizations(id) on delete cascade,

  -- TEK KOL. Değişince her varyant kendi gramı, saflığı, genişlik çarpanı ve
  -- işçilik sınıfından yeniden hesaplanır.
  spot_usd_per_ozt numeric(12,4) not null default 4090,

  -- Ayarlar (motor sabitleri). Varsayılanlar üç altın değeri ve canlı
  -- siparişi birebir üreten v4 varsayımlarıdır — değiştirmeden önce
  -- lib/pricing-engine/eon-cost.ts kapısını yeniden koştur.
  fire_factor numeric(6,4) not null default 1.07,
  labor_usd numeric(10,2) not null default 30,
  labor_handfinished_usd numeric(10,2) not null default 40,
  packaging_usd numeric(10,2) not null default 8,
  shipping_usd numeric(10,2) not null default 22,
  multiplier_narrow numeric(6,4) not null default 1.55,
  multiplier_wide numeric(6,4) not null default 2.00,
  wide_band_min_mm numeric(5,2) not null default 8,
  sale_rate numeric(6,4) not null default 0.75,

  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),

  constraint pricing_config_positive check (
    spot_usd_per_ozt > 0 and fire_factor > 0 and labor_usd >= 0
    and labor_handfinished_usd >= 0 and packaging_usd >= 0 and shipping_usd >= 0
    and multiplier_narrow > 0 and multiplier_wide > 0 and wide_band_min_mm > 0
    and sale_rate > 0 and sale_rate <= 1
  )
);

comment on table public.pricing_config is
  'Fiyat motorunun girdileri. spot_usd_per_ozt arayuzdeki TEK duzenlenebilir alan; kalani ayar ekranindan onayla degisir. Elle fiyat kolonu YOKTUR.';

-- ── pricing_runs — kuru çalıştırma → onay → itiş, tek kayıtta ─────────────
-- Aynı satır hem EŞZAMANLILIK KİLİDİ hem de tam farkın saklandığı yerdir.
-- audit_log 90 günlük saklamaya tabi; tam fark (yüzlerce satır) burada durur
-- ve audit satırı bu kaydın id'sini taşır.
create table if not exists public.pricing_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,

  -- dry_run  : fark hesaplandı, onay bekliyor
  -- approved : insan onayladı, itiş sırada (kilit AKTİF)
  -- running  : itiş sürüyor (kilit AKTİF)
  -- done     : itiş bitti
  -- failed   : itiş hata ile bitti
  -- cancelled: onaylanmadan atıldı / eskidi
  status text not null default 'dry_run'
    check (status in ('dry_run','approved','running','done','failed','cancelled')),

  -- Bu koşunun kullandığı spot ve AYAR ANLIK GÖRÜNTÜSÜ. Ayar sonradan
  -- değişse bile "bu fiyat hangi varsayımla üretildi" geriye dönük yanıtlanır.
  spot_usd_per_ozt numeric(12,4) not null,
  config jsonb not null default '{}'::jsonb,

  -- Kapsam: tek listing (product_id doluysa) ya da org geneli.
  product_id uuid references public.products(id) on delete set null,

  -- TAM FARK. Satır başına: sku, listing, genişlik, beden, gram, mevcut canlı
  -- Etsy fiyatı, hesaplanan fiyat, delta, zemin, zemin_altinda, haric.
  rows jsonb not null default '[]'::jsonb,

  total_rows integer not null default 0,
  changed_rows integer not null default 0,
  below_floor_rows integer not null default 0,
  excluded_rows integer not null default 0,
  unknown_rows integer not null default 0,
  updated_rows integer not null default 0,
  skipped_rows integer not null default 0,
  error_rows integer not null default 0,
  error text,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz
);

comment on table public.pricing_runs is
  'Fiyat itisinin tam kaydi: kuru calistirma farki, onay, sonuc. Ayni satir eszamanlilik kilidi olarak da kullanilir (asagidaki tekil indeks).';

create index if not exists pricing_runs_org_idx
  on public.pricing_runs (org_id, created_at desc);

-- EŞZAMANLILIK KİLİDİ (5c). Org başına AYNI ANDA en fazla bir onaylı/koşan
-- itiş olabilir; ikinci onay veritabanı seviyesinde reddedilir. v3 itişindeki
-- üç-tıklama yarışı zararsızdı ama bir daha mümkün olmamalı — bu kilit
-- uygulama katmanındaki kontrolün ALTINDA ikinci savunma hattıdır.
create unique index if not exists pricing_runs_one_active_per_org
  on public.pricing_runs (org_id)
  where status in ('approved','running');

alter table public.pricing_config enable row level security;
alter table public.pricing_runs enable row level security;

-- Okuma: org üyeliği. YAZMA POLİTİKASI YOK — yazma yalnız server action'lar
-- (service-role, org kilidi + rol kontrolü) üzerinden yapılır. Böylece
-- doğrudan Data API'den fiyat/ayar değiştirmek yapısal olarak imkânsızdır.
drop policy if exists pricing_config_select on public.pricing_config;
create policy pricing_config_select on public.pricing_config
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = pricing_config.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists pricing_runs_select on public.pricing_runs;
create policy pricing_runs_select on public.pricing_runs
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = pricing_runs.org_id and m.user_id = auth.uid()
    )
  );
