-- 0065 — Üretilen Görseller: Higgsfield'da üretilen AI görsellerinin panelde
-- gösterimi. Panel yalnızca URL + meta saklar (görsel baytları Higgsfield
-- CDN'inde kalır) → siteye depolama/bant genişliği yükü binmez; thumbnail'lar
-- tarayıcıda tembel (lazy) yüklenir, tam görsel yalnız indirme anında çekilir.

create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint,          -- opsiyonel: hangi listing için üretildi
  title text,                      -- gösterim etiketi (ürün adı vb.)
  source_url text not null,        -- Higgsfield tam görsel (indirilecek)
  thumb_url text,                  -- küçük önizleme (lazy gösterim); yoksa source
  ref_url text,                    -- referans (input) görseli
  prompt text,
  model text,
  aspect_ratio text,
  kind text,                       -- flat / model / concept (opsiyonel etiket)
  external_id text,                -- Higgsfield generation id (izlenebilirlik)
  is_selected boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (org_id, source_url)      -- aynı görsel iki kez eklenmesin
);

create index if not exists generated_images_org_idx
  on public.generated_images(org_id, created_at desc);
create index if not exists generated_images_listing_idx
  on public.generated_images(org_id, etsy_listing_id);
create index if not exists generated_images_selected_idx
  on public.generated_images(org_id, is_selected);

alter table public.generated_images enable row level security;

-- Org üyeleri kendi org'larında okur/yazar (tüm CRUD). current_org_id() paneldeki desen.
create policy "generated_images_all" on public.generated_images for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
