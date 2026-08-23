-- 0148 — PIRLANTA (TAŞ) MALİYETİ
--
-- ## Neden
--
-- Fiyat motoru yalnız SOLİD ALTIN alyans için kuruldu:
--   altın gramı × saflık × spot × fire + işçilik + paketleme + kargo
-- Taş diye bir girdi YOK. Repodaki her "diamond" kelimesi "Diamond Cut", yani
-- yüzey dokusu (bkz. lib/gold-cost.ts sussuz/süslü ayrımı) — takılmış taş değil.
--
-- Eylül'de tek taş (solitaire) pırlantalı modeller açılıyor. Bu tablolar
-- olmadan pırlantalı bir ürün fiyatlanırsa TAŞIN BEDELİ FİYATA HİÇ GİRMEZ ve
-- üstüne mağaza indirimi biner. Daha kötüsü: mevcut güvenlik ağı bunu YAKALAMAZ.
-- Uyarı merkezindeki "eritme-altı" alarmı altının HURDA değerine bakar; taş
-- bedeli kadar eksik fiyatlanmış bir yüzük altın-eritmenin rahatça üstünde
-- kalır, ekran yeşil yanar ve her satışta taşın parası verilir. Sessizce
-- "başarı" dönen kod, hiç çalışmayandan tehlikelidir (second-brain deseni).
--
-- ## Neden FORMÜL değil TABLO
--
-- Pırlanta fiyatı karatla DOĞRUSAL ARTMAZ: 2ct, 1ct'nin iki katı değil ~üç-dört
-- katıdır ve 1,00 / 1,50 / 2,00 ct eşiklerinde sıçrar. Ayrıca aynı karat, renk
-- ve berraklığa göre iki katı fiyat olabilir. Bu yüzden maliyet bir çarpanla
-- türetilemez; piyasadan okunan bir FİYAT KİTABI satırı olarak durur.
--
-- ## Kapsam
--
-- Bu migration yalnız VERİ MODELİ kurar. Hiçbir fiyat yazmaz, hiçbir ürünü
-- değiştirmez, Etsy'ye dokunmaz. Fiyat kitabı satırlarını insan girer.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) FİYAT KİTABI — (köken, şekil, karat bandı, renk, berraklık) → maliyet
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.diamond_price_book (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  -- 'lab' | 'natural'. Aynı karatta 5-10 kat fark yaratır; ASLA varsayılmaz.
  origin       text not null check (origin in ('lab', 'natural')),
  shape        text not null,               -- oval | emerald | pear | round …
  carat_from   numeric(5,2) not null check (carat_from > 0),
  carat_to     numeric(5,2) not null check (carat_to > 0),
  color        text not null,               -- ör. 'F-G'
  clarity      text not null,               -- ör. 'VS1-VS2'
  cost_cents   integer not null check (cost_cents > 0),
  -- Fiyatın nereden geldiği (tedarikçi adı / teklif tarihi). Kalibrasyonun
  -- kaynağı yazılmazsa altı ay sonra kimse sayının nereden geldiğini bilmez.
  source       text,
  note         text,
  effective_from date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint diamond_price_book_carat_order check (carat_to >= carat_from)
);

-- Aynı org + köken + şekil + kalite için karat bandı tekildir; iki satır aynı
-- karatı kapsarsa hangisinin seçileceği belirsiz olur ve fiyat sessizce oynar.
create unique index if not exists diamond_price_book_band_uidx
  on public.diamond_price_book (org_id, origin, shape, color, clarity, carat_from, carat_to);

create index if not exists diamond_price_book_lookup_idx
  on public.diamond_price_book (org_id, origin, shape, carat_from, carat_to);

alter table public.diamond_price_book enable row level security;

drop policy if exists diamond_price_book_select on public.diamond_price_book;
create policy diamond_price_book_select on public.diamond_price_book
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = diamond_price_book.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists diamond_price_book_write on public.diamond_price_book;
create policy diamond_price_book_write on public.diamond_price_book
  for all using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = diamond_price_book.org_id and m.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.organization_members m
      where m.org_id = diamond_price_book.org_id and m.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 2) ÜRÜN SEVİYESİ TAŞ KÜNYESİ
--
-- Şekil/renk/berraklık/köken ürünün TAMAMI için sabittir (bir listing = bir
-- model). Karat ise varyanttan varyanta değişir (1ct / 1,5ct / 2ct) — o yüzden
-- aşağıda, varyantta durur. Aynı ayrım gram için de geçerli.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.products
  add column if not exists stone_shape       text,
  add column if not exists stone_color       text,
  add column if not exists stone_clarity     text,
  add column if not exists stone_origin      text,
  -- Tek taş (solitaire) = 1. Fiyatın DETERMİNİSTİK olduğu tek durum budur:
  -- taş sayısı 1'den büyük olunca (mix/pavé) maliyet modeli taş taş değişir.
  add column if not exists stone_count       integer,
  -- Taş takma (setting) ücreti — taş başına. Kendi atölyemizde takılırsa bu
  -- kalem maliyetten çıkıp MARJA döner; o gün bu alan 0 yazılır, silinmez.
  add column if not exists setting_fee_cents integer,
  -- Döküm (casting) — modele ve ayara bağlı, parça başına.
  add column if not exists casting_fee_cents integer;

alter table public.products
  drop constraint if exists products_stone_origin_chk;
alter table public.products
  add constraint products_stone_origin_chk
  check (stone_origin is null or stone_origin in ('lab', 'natural'));

alter table public.products
  drop constraint if exists products_stone_count_chk;
alter table public.products
  add constraint products_stone_count_chk
  check (stone_count is null or stone_count >= 0);

-- ─────────────────────────────────────────────────────────────────────────
-- 3) VARYANT SEVİYESİ KARAT + ÇÖZÜLMÜŞ TAŞ MALİYETİ
--
-- `stone_cost_cents` fiyat kitabından ÇÖZÜLÜR ama satırda SAKLANIR: kitap
-- sonradan güncellenince geçmiş maliyet kaymasın (fatura kalibrasyonu dersi —
-- gerçek değer, sonradan üretilen tahminin üstüne yazılmaz).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.product_variants
  add column if not exists stone_carat       numeric(5,2),
  add column if not exists stone_cost_cents  integer,
  -- 'price_book' | 'invoice' | 'manual'. Kaynağı bilinmeyen maliyet, maliyet
  -- değil tahmindir; 'invoice' olan satır otomatik çözümle EZİLMEZ.
  add column if not exists stone_cost_source text;

alter table public.product_variants
  drop constraint if exists product_variants_stone_carat_chk;
alter table public.product_variants
  add constraint product_variants_stone_carat_chk
  check (stone_carat is null or stone_carat > 0);

alter table public.product_variants
  drop constraint if exists product_variants_stone_cost_chk;
alter table public.product_variants
  add constraint product_variants_stone_cost_chk
  check (stone_cost_cents is null or stone_cost_cents >= 0);

create index if not exists product_variants_stone_idx
  on public.product_variants (org_id, product_id)
  where stone_carat is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) TAŞ DAHİL MALİYET GÖRÜNÜMÜ
--
-- Varyant başına "bu satırın gerçek maliyeti ne" sorusunun TEK cevabı.
-- Altın tarafını panelin kendi alanlarından okur; taş/takma/döküm bu
-- migration'ın alanlarından gelir. Taşsız ürünlerde taş kalemleri 0'dır,
-- yani görünüm tüm katalog için güvenle kullanılabilir.
-- ─────────────────────────────────────────────────────────────────────────

create or replace view public.variant_stone_cost as
select
  v.id                as variant_id,
  v.org_id,
  v.product_id,
  v.sku,
  v.price_cents,
  -- Altın tarafı maliyeti için gerekli: taban = altın + taş + takma + döküm.
  -- Gram olmadan taban HESAPLANAMAZ, o satır "karar verilemedi" sayılır.
  v.weight_grams,
  v.stone_carat,
  coalesce(v.stone_cost_cents, 0)                                as stone_cost_cents,
  coalesce(p.setting_fee_cents, 0) * coalesce(p.stone_count, 0)  as setting_cost_cents,
  coalesce(p.casting_fee_cents, 0)                               as casting_cost_cents,
  coalesce(v.stone_cost_cents, 0)
    + coalesce(p.setting_fee_cents, 0) * coalesce(p.stone_count, 0)
    + coalesce(p.casting_fee_cents, 0)                           as stone_side_cost_cents,
  -- Ayar (10K/14K/18K) başlıktan okunur; SKU'da her zaman bulunmuyor.
  p.title as product_title,
  p.stone_shape,
  p.stone_color,
  p.stone_clarity,
  p.stone_origin,
  p.stone_count,
  -- Künye eksikse fiyat GÜVENİLMEZ: taşlı ilan edilmiş ama maliyeti
  -- girilmemiş satır, tam da sessizce zarara satan satırdır.
  (v.stone_carat is not null and coalesce(v.stone_cost_cents, 0) = 0) as stone_cost_missing
from public.product_variants v
join public.products p on p.id = v.product_id and p.org_id = v.org_id;

comment on view public.variant_stone_cost is
  'Varyant başına taş+takma+döküm maliyeti. stone_cost_missing=true olan satır taşlı ilan edilmiş ama maliyeti girilmemiştir — fiyatı güvenilmez.';

comment on table public.diamond_price_book is
  'Pırlanta fiyat kitabı. Karatla doğrusal olmayan taş maliyeti; formülle türetilmez, piyasadan okunup satır olarak girilir.';
