-- 0111 — competitor_variant_match (0107 prod'a hiç uygulanmamıştı; idempotent tekrar)
-- ------------------------------------------------------------------
-- Prod hata: PGRST205 "Could not find the table 'public.competitor_variant_match'"
-- 0107 ile aynı içerik; create if not exists / add column if not exists.

alter table public.competitor_watch
  add column if not exists image_url text;

create table if not exists public.competitor_variant_match (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  our_sku text not null,
  competitor_listing_id bigint not null,
  competitor_product_id bigint,
  competitor_label text,
  competitor_size text,
  competitor_karat text,
  price_cents integer,
  currency text not null default 'USD',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, product_id, our_sku, competitor_listing_id)
);

create index if not exists competitor_variant_match_product_idx
  on public.competitor_variant_match (org_id, product_id);

alter table public.competitor_variant_match enable row level security;

do $$ begin
  create policy "competitor_variant_match_all" on public.competitor_variant_match
    for all to authenticated
    using (org_id = public.current_org_id())
    with check (org_id = public.current_org_id());
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
