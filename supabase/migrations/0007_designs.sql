-- 0007 — Marka / ürün tasarımları (Storage referansları)
-- ------------------------------------------------------------------

create table public.designs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'taslak',
  product_id uuid references public.products(id) on delete set null,
  storage_bucket text not null default 'designs',
  storage_path text,
  thumbnail_path text,
  tags text[],
  version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.designs (org_id);

create trigger set_updated_at
  before update on public.designs
  for each row execute function public.set_updated_at();
