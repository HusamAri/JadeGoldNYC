-- 0099 — Listing çoklu görsel yönetimi (EON marka görselleri).
-- ------------------------------------------------------------------
-- Bir ürün/listing'e panelden birden çok görsel bağlanabilir, sıralanabilir
-- ve çıkarılabilir. Kaynak: yükleme (Storage), Google Drive veya URL.
-- `products.image_url` tek KAPAK göstericisi olarak kalır; bu tablo galeridir.
--
-- Görsel baytları public `listing-images` bucket'ında org klasörü altında
-- (path: <org_id>/...). Bucket public-OKUMA; yazma yalnız org üyesi.

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,                 -- görüntülenecek public URL
  storage_path text,                 -- listing-images bucket yolu (yüklemede dolu)
  source text not null default 'upload'
    check (source in ('upload', 'drive', 'url')),
  drive_file_id text,                -- Google Drive'dan geldiyse dosya kimliği
  alt text,
  position int not null default 0,   -- galeri sırası (küçük = önce)
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_product_idx
  on public.listing_images(product_id, position);
create index if not exists listing_images_org_idx
  on public.listing_images(org_id, created_at desc);
-- Aynı Drive dosyası bir ürüne iki kez bağlanmasın (idempotent içe aktarma).
create unique index if not exists listing_images_drive_uniq
  on public.listing_images(product_id, drive_file_id)
  where drive_file_id is not null;

alter table public.listing_images enable row level security;

-- Org üyeleri yalnız kendi org'larında okur/yazar (current_org_id() paneldeki desen).
create policy "listing_images_all" on public.listing_images for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- Şirket hafızası: create/update/delete audit_log'a otomatik yazılsın.
create trigger audit after insert or update or delete on public.listing_images
  for each row execute function public.audit_trigger();

-- Public bucket + org-klasörü bazlı yazma (okuma public URL ile).
insert into storage.buckets (id, name, public)
  values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

create policy "listing_images_obj_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy "listing_images_obj_update" on storage.objects for update to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = public.current_org_id()::text);
create policy "listing_images_obj_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = public.current_org_id()::text);
