-- 0055 — ShipStation gramajlarını SKU eşleşen varyantlara yazan RPC.
-- internalNotes'tan sayıyı ayıklar (ör. "5.7 gr" → 5.7), SKU'su eşleşen
-- product_variants satırına yazar. Yalnız weight_grams BOŞ olanları doldurur —
-- elle girilmiş / önceki değerleri EZMEZ. Etsy varyant senkronu sonrası çağrılır.

create or replace function public.match_variant_weights_from_shipstation(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with g as (
    select
      sku,
      nullif(
        replace(
          (regexp_match(nullif(trim(raw->>'internalNotes'), ''), '([0-9]+(?:[.,][0-9]+)?)'))[1],
          ',', '.'
        ), ''
      )::numeric as grams
    from public.shipstation_products
    where org_id = p_org_id and sku is not null and sku <> ''
  )
  update public.product_variants pv
    set weight_grams = g.grams,
        weight_source = 'shipstation',
        updated_at = now()
  from g
  where pv.org_id = p_org_id
    and pv.sku = g.sku
    and g.grams is not null
    and pv.weight_grams is null;

  get diagnostics n = row_count;
  return n;
end;
$$;
