-- 0081 — Listing medya arşivi. EON gibi mağazalardaki listinglerin görsel ve
-- VİDEOLARINI panele KALICI çeker: Etsy'de listing silinse bile medya panelde
-- kalır (geriye dönük arşiv). Bytes özel Storage bucket'ında ('listing-archive',
-- org-klasörü RLS), meta veri burada. Listing METNİ zaten `products`'ta durur.

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint not null,
  kind text not null check (kind in ('image', 'video')),
  etsy_media_id bigint,             -- listing_image_id / video_id (idempotency + izlenebilirlik)
  rank int,
  storage_path text not null,       -- 'listing-archive' bucket içindeki yol
  mime text,
  width int,
  height int,
  bytes bigint,
  source_url text,                  -- indirildiği Etsy CDN url'i
  title text,                       -- listing başlığı (arşiv tek başına okunur kalsın)
  created_by uuid,
  created_at timestamptz not null default now(),
  -- Aynı medya iki kez çekilmesin; yeniden arşivleme upsert olur.
  unique (org_id, etsy_listing_id, kind, etsy_media_id)
);

create index if not exists listing_media_org_listing_idx
  on public.listing_media (org_id, etsy_listing_id);

alter table public.listing_media enable row level security;

-- Org üyeleri kendi org'larında okur/yazar (current_org_id() paneldeki desen).
create policy "listing_media_all" on public.listing_media for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- Özel bucket + org-klasörü bazlı erişim (path: <org_id>/...). design-boards deseni.
insert into storage.buckets (id, name, public)
values ('listing-archive', 'listing-archive', false)
on conflict (id) do nothing;

create policy "listing_archive_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'listing-archive'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
create policy "listing_archive_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-archive'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
create policy "listing_archive_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-archive'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
create policy "listing_archive_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-archive'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
