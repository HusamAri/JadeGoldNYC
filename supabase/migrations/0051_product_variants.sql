-- 0051 — Ürün varyant kataloğu (SKU bazlı).
-- Bir Etsy listing'i birden çok varyanttan oluşur (beden/uzunluk vb.), her
-- varyantın kendi SKU'su ve kendi gramajı vardır. Bu tablo o varyantları tutar:
--   • SKU → varyant (org bazlı benzersiz)
--   • product_id → bağlı Etsy listing'i (panel products tablosu)
--   • weight_grams → varyantın altın gramajı (ShipStation internalNotes'tan
--     eşlenir; Etsy'de ağırlık alanı yok)
--   • properties → Etsy property_values (beden/renk) — Etsy envanter sync doldurur
--
-- Amaç: satış sonrası analiz. sale_items.sku zaten var; SKU→varyant→gram ile
-- satılan altın ağırlığı, altın maliyeti ve "çok satan varyant" analizleri çıkar.

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  product_id uuid references public.products(id) on delete set null,
  etsy_listing_id bigint,
  etsy_product_id bigint,
  name text,
  properties jsonb,
  price_cents integer,
  quantity integer,
  weight_grams numeric,
  weight_source text, -- 'shipstation' | 'etsy' | 'manual'
  active boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_variants_org_sku_key
  on public.product_variants(org_id, sku);
create index if not exists product_variants_product_idx
  on public.product_variants(product_id);
create index if not exists product_variants_listing_idx
  on public.product_variants(org_id, etsy_listing_id);

alter table public.product_variants enable row level security;

drop policy if exists "product_variants_all" on public.product_variants;
create policy "product_variants_all" on public.product_variants for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
