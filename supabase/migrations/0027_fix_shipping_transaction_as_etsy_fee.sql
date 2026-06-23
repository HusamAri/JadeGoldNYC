-- Codex P2: shipping_transaction (+ refund) = alıcının ödediği kargo üzerine
-- alınan Etsy işlem ücretidir, postaj değil. kargo yerine etsy_ucretleri'ne
-- taşı; yalnız shipping_label% gerçek postaj/kargo etiketi maliyetidir.
create or replace function public.rebuild_etsy_ledger_costs(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.costs where org_id = p_org_id and source = 'etsy_ledger';

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
  insert into public.costs
    (org_id, category_id, amount_cents, currency, cost_date, vendor, source, description)
  select
    p_org_id, cc.id, a.cost_cents, a.currency, a.m, 'Etsy', 'etsy_ledger',
    'Etsy ' || cc.label_tr || ' (' || to_char(a.m, 'YYYY-MM') || ')'
  from agg a
  join public.cost_categories cc
    on cc.org_id = p_org_id and cc.key = a.cat_key;

  get diagnostics n = row_count;
  return n;
end;
$$;
