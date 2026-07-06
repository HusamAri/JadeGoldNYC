-- 0064 — AI Görsel Üretim: listing başına "üretildi/tamamlandı" durumu.
-- Görsel Üretim Kiti'ndeki her aktif listing için üretimin tamamlanıp
-- tamamlanmadığını işaretlemek üzere hafif bir durum tablosu. Etsy listing
-- kimliği ile anahtarlanır (kit verisi statik olduğundan products'a FK yok);
-- org başına tekildir. Yüksek-çokluk toggle durumu olduğundan audit trigger'a
-- BİLEREK bağlanmaz (denetim logunu şişirmemek için).

create table if not exists public.photo_production (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint not null,
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid,
  updated_at timestamptz not null default now(),
  unique (org_id, etsy_listing_id)
);

create index if not exists photo_production_org_idx
  on public.photo_production(org_id, done);

alter table public.photo_production enable row level security;

-- Org üyeleri kendi org'larında okur/yazar (tüm CRUD). current_org_id() paneldeki desen.
create policy "photo_production_all" on public.photo_production for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
