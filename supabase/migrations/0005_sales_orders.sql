-- 0005 — Satışlar (siparişler) ve satış kalemleri
-- ------------------------------------------------------------------

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'csv', 'etsy')),
  etsy_receipt_id bigint,
  order_no text,
  buyer_name text,
  buyer_email text,
  status text not null default 'completed'
    check (status in ('paid', 'completed', 'shipped', 'cancelled', 'refunded')),
  order_date timestamptz not null default now(),
  ship_country text,
  item_total_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  etsy_fees_cents integer not null default 0,
  grand_total_cents integer not null default 0,
  currency text not null default 'USD',
  csv_import_id uuid, -- FK 0009'da eklenir
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Tekilleştirme anahtarı: CSV ve API senkronizasyonu idempotent olur.
  unique (org_id, etsy_receipt_id)
);
create index on public.sales (org_id, order_date desc);
create index on public.sales (status);

create trigger set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  etsy_transaction_id bigint,
  title text,
  sku text,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0,
  line_total_cents integer not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);
create index on public.sale_items (sale_id);
create index on public.sale_items (org_id);
create index on public.sale_items (product_id);
-- Etsy senkronizasyonu için idempotent upsert anahtarı.
create unique index sale_items_etsy_tx_uniq on public.sale_items (etsy_transaction_id)
  where etsy_transaction_id is not null;
