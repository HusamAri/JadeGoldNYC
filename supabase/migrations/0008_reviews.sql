-- 0008 — Tüketici yorumları
-- ------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  etsy_review_id text,
  product_id uuid references public.products(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  rating integer check (rating between 1 and 5),
  review_text text,
  language text,
  buyer_name text,
  review_date timestamptz,
  source text not null default 'manual' check (source in ('manual', 'csv', 'etsy')),
  status text not null default 'yeni',
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, etsy_review_id)
);
create index on public.reviews (org_id);
create index on public.reviews (rating);

create trigger set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
