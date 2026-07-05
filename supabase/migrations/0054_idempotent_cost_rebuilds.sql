-- 0054 — Türetilen maliyet rebuild'lerini idempotent yap (audit gürültüsü).
-- rebuild_shipstation_costs / rebuild_etsy_ledger_costs her senkronda
-- "kaynağın TÜM satırlarını sil, baştan yaz" yapıyordu. costs tablosunda audit
-- trigger'ı olduğundan her senkron, değişmemiş aylar için bile toplu
-- "maliyet silindi + oluşturuldu" kaydı üretiyordu (Kayıtlar'da gürültü).
--
-- Çözüm: fark tabanlı (diff) rebuild. Yeni aylık toplamı hesapla; yalnız
-- (kategori, para, tarih, tutar) olarak DEĞİŞEN/kaybolan satırları sil, YENİ
-- olanları ekle. Değişmeyen aylara dokunulmaz → audit'e hiç yazılmaz.
-- rebuild_sales_etsy_fees zaten idempotent (sales.etsy_fees; costs'a yazmaz).

create or replace function public.rebuild_shipstation_costs(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  drop table if exists _new_ss_costs;
  create temp table _new_ss_costs on commit drop as
  with agg as (
    select
      date_trunc('month', ship_date)::date as m,
      coalesce(currency, 'USD') as currency,
      sum(coalesce(shipment_cost_cents, 0) + coalesce(insurance_cost_cents, 0))::bigint as cost_cents
    from public.shipstation_shipments
    where org_id = p_org_id
      and ship_date is not null
      and coalesce(voided, false) = false
    group by 1, 2
    having sum(coalesce(shipment_cost_cents, 0) + coalesce(insurance_cost_cents, 0)) > 0
  )
  select
    cc.id as category_id,
    a.cost_cents as amount_cents,
    a.currency,
    a.m as cost_date,
    'ShipStation'::text as vendor,
    ('ShipStation postaj (' || to_char(a.m, 'YYYY-MM') || ')')::text as description
  from agg a
  join public.cost_categories cc on cc.org_id = p_org_id and cc.key = 'kargo';

  delete from public.costs c
   where c.org_id = p_org_id and c.source = 'shipstation'
     and not exists (
       select 1 from _new_ss_costs n
       where n.category_id is not distinct from c.category_id
         and n.currency = c.currency
         and n.cost_date = c.cost_date
         and n.amount_cents = c.amount_cents
     );

  insert into public.costs
    (org_id, category_id, amount_cents, currency, cost_date, vendor, source, description)
  select p_org_id, n.category_id, n.amount_cents, n.currency, n.cost_date, n.vendor,
    'shipstation', n.description
  from _new_ss_costs n
  where not exists (
    select 1 from public.costs c
    where c.org_id = p_org_id and c.source = 'shipstation'
      and c.category_id is not distinct from n.category_id
      and c.currency = n.currency
      and c.cost_date = n.cost_date
      and c.amount_cents = n.amount_cents
  );

  get diagnostics n = row_count;
  return n;
end;
$$;

create or replace function public.rebuild_etsy_ledger_costs(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  drop table if exists _new_ledger_costs;
  create temp table _new_ledger_costs on commit drop as
  with mapped as (
    select
      case
        when ledger_type ilike 'prolist%'
          or ledger_type ilike 'offsite_ads_fee%' then 'reklam'
        when ledger_type ilike 'shipping_label%' then 'kargo'
        when ledger_type ilike 'transaction%'
          or ledger_type ilike 'shipping_transaction%'
          or ledger_type ilike '%processing_fee%'
          or ledger_type ilike 'listing%'
          or ledger_type ilike 'renew%'
          or ledger_type ilike 'auto_renew%'
          or ledger_type ilike 'buyer_fee%'
          or ledger_type ilike 'tier_%subscription%' then 'etsy_ucretleri'
        else null
      end as cat_key,
      date_trunc('month', entry_date)::date as m,
      coalesce(currency, 'USD') as currency,
      amount_cents
    from public.etsy_ledger_entries
    where org_id = p_org_id
      and entry_date is not null
      and amount_cents is not null
  ),
  agg as (
    select cat_key, m, currency, (-sum(amount_cents))::bigint as cost_cents
    from mapped
    where cat_key is not null
    group by cat_key, m, currency
    having -sum(amount_cents) > 0
  )
  select
    cc.id as category_id,
    a.cost_cents as amount_cents,
    a.currency,
    a.m as cost_date,
    'Etsy'::text as vendor,
    ('Etsy ' || cc.label_tr || ' (' || to_char(a.m, 'YYYY-MM') || ')')::text as description
  from agg a
  join public.cost_categories cc on cc.org_id = p_org_id and cc.key = a.cat_key;

  delete from public.costs c
   where c.org_id = p_org_id and c.source = 'etsy_ledger'
     and not exists (
       select 1 from _new_ledger_costs n
       where n.category_id is not distinct from c.category_id
         and n.currency = c.currency
         and n.cost_date = c.cost_date
         and n.amount_cents = c.amount_cents
     );

  insert into public.costs
    (org_id, category_id, amount_cents, currency, cost_date, vendor, source, description)
  select p_org_id, n.category_id, n.amount_cents, n.currency, n.cost_date, n.vendor,
    'etsy_ledger', n.description
  from _new_ledger_costs n
  where not exists (
    select 1 from public.costs c
    where c.org_id = p_org_id and c.source = 'etsy_ledger'
      and c.category_id is not distinct from n.category_id
      and c.currency = n.currency
      and c.cost_date = n.cost_date
      and c.amount_cents = n.amount_cents
  );

  get diagnostics n = row_count;
  return n;
end;
$$;
