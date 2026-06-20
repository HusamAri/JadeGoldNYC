-- 0006 — Maliyet kategorileri ve maliyetler
-- ------------------------------------------------------------------

create table public.cost_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  label_tr text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, key)
);

create table public.costs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid references public.cost_categories(id) on delete set null,
  description text not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  cost_date date not null default current_date,
  vendor text,
  sale_id uuid references public.sales(id) on delete set null,
  source text not null default 'manual' check (source in ('manual', 'csv', 'etsy')),
  receipt_url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.costs (org_id, cost_date desc);
create index on public.costs (category_id);
create index on public.costs (sale_id);

create trigger set_updated_at
  before update on public.costs
  for each row execute function public.set_updated_at();
