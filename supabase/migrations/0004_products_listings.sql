-- 0004 — Ürünler / Etsy listeleri
-- ------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_listing_id bigint,
  sku text,
  title text not null,
  status text,
  price_cents integer,
  currency text not null default 'USD',
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, etsy_listing_id)
);
create index on public.products (org_id);

create trigger set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();
