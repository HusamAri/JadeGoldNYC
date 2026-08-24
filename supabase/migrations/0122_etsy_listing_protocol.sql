-- 0122 Etsy listing protocol metadata
-- Keeps channel-specific classification and approval data next to the panel draft.

alter table public.products
  add column if not exists product_type text,
  add column if not exists listing_metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_product_type_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_product_type_check
      check (
        product_type is null
        or product_type in (
          'ring',
          'necklace',
          'bracelet',
          'earrings',
          'pendant',
          'anklet',
          'brooch',
          'other'
        )
      );
  end if;
end
$$;

create index if not exists products_listing_metadata_gin
  on public.products using gin (listing_metadata);

comment on column public.products.product_type is
  'Verified product class used to choose Etsy taxonomy and product-specific listing rules.';

comment on column public.products.listing_metadata is
  'Secret-free Etsy protocol metadata: taxonomy, production, parcel, personalization, research and approval.';
