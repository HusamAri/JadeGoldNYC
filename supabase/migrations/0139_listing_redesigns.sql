-- 0139 — Listing yeniden tasarımı (grup bazlı): öneri → onay → Etsy'ye gönder → ölç
--
-- NEDEN AYRI TABLO: `products` bir AYNADIR. `lib/etsy/sync.ts` her senkronda
-- title/description/tags/materials alanlarını Etsy'den EZER; reconcile görünmeyen
-- satırı siler. Bu yüzden hazırlanan içerik products'ta yaşayamaz — ömrü bir
-- senkron döngüsüdür. 0083 (seo_tag_optimizations) bu problemi tag için çözdü;
-- bu tablo aynı deseni tüm listing gövdesine (açıklama + tag + materyal) taşır.
--
-- BAŞLIK: `proposed_title` üretilir ama ASLA otomatik gönderilmez (kullanıcı
-- kararı 2026-08-13). Panelde Etsy Copy Card ile elle yapıştırılır; canlı
-- başlık satan listing'in en kırılgan SEO parçasıdır. Bu yüzden `pushed_title`
-- kolonu YOKTUR — gönderilmeyen alanın "gönderildi" kaydı da olmaz.
--
-- TAG SAHİPLİĞİ: 0083 ile aynı alanı (canlı 13 tag) yazar. Çakışmayı önlemek
-- için kural: bir listing için redesign satırı 'pushed' olduğunda o listing'in
-- seo_tag_optimizations satırı artık yeni öneri üretmez (tarihçe olarak kalır).
-- Tek yazar ilkesi — iki modül aynı alanı sırayla ezerse hangi setin canlı
-- olduğu belirsizleşir.
--
-- RLS: org üyeleri okur/düzenler; push alanları (baseline/pushed_*) server
-- action tarafından yazılır. Audit trigger EKLENMEZ (0083 gerekçesi: toplu seed
-- spam'ı); semantik olaylar logAudit ile 'etsy.redesign_push' olarak yazılır.

create table if not exists public.listing_redesigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint not null,
  chapter text
    check (chapter is null or chapter in
      ('protection', 'faith', 'love', 'legacy', 'chains', 'earrings', 'rings')),

  -- Geri-alma verisi: öneri üretildiği andaki CANLI değerler ────────────────
  old_title text,
  old_description text,
  old_tags text[],
  old_materials text[],

  -- Öneri ────────────────────────────────────────────────────────────────────
  proposed_title text,        -- yalnız elle kopyalama için; push edilmez
  proposed_description text,
  proposed_tags text[],
  proposed_materials text[],

  rationale text,             -- neden bu değişiklik (insan-okur)
  confidence text,            -- dusuk | orta | yuksek
  qa_report jsonb not null default '{}'::jsonb,  -- gate çıktısı: {status, errors[], warnings[]}

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'pushed', 'rejected', 'failed')),

  -- Push anı baseline (measure loop: 14/30 gün sonra etki ölçümü) ────────────
  baseline_views integer,
  baseline_favs integer,
  baseline_captured_at timestamptz,
  pushed_at timestamptz,
  pushed_by uuid references auth.users(id) on delete set null,
  pushed_description text,    -- gerçekten Etsy'ye giden gövde (öneri sonradan düzenlenebilir)
  pushed_tags text[],
  error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, etsy_listing_id)
);

create index if not exists listing_redesigns_org_status_idx
  on public.listing_redesigns (org_id, status);
create index if not exists listing_redesigns_org_chapter_idx
  on public.listing_redesigns (org_id, chapter);

create or replace function public.touch_listing_redesigns()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_listing_redesigns on public.listing_redesigns;
create trigger trg_touch_listing_redesigns
  before update on public.listing_redesigns
  for each row execute function public.touch_listing_redesigns();

alter table public.listing_redesigns enable row level security;

create policy "listing_redesigns_select" on public.listing_redesigns
  for select to authenticated
  using (org_id = public.current_org_id());

create policy "listing_redesigns_insert" on public.listing_redesigns
  for insert to authenticated
  with check (org_id = public.current_org_id());

create policy "listing_redesigns_update" on public.listing_redesigns
  for update to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
