-- ShipStation gönderi maliyetlerini (postaj + sigorta, iptal hariç) aylık
-- özetleyip costs'a yazar (Kargo, source='shipstation', idempotent).
alter table public.costs drop constraint if exists costs_source_check;
alter table public.costs add constraint costs_source_check
  check (source = any (array['manual','csv','etsy','etsy_ledger','shipstation']));

create or replace function public.rebuild_shipstation_costs(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.costs where org_id = p_org_id and source = 'shipstation';

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
  insert into public.costs
    (org_id, category_id, amount_cents, currency, cost_date, vendor, source, description)
  select
    p_org_id, cc.id, a.cost_cents, a.currency, a.m, 'ShipStation', 'shipstation',
    'ShipStation postaj (' || to_char(a.m, 'YYYY-MM') || ')'
  from agg a
  join public.cost_categories cc on cc.org_id = p_org_id and cc.key = 'kargo';

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.rebuild_shipstation_costs(uuid) from public, anon;
grant execute on function public.rebuild_shipstation_costs(uuid) to authenticated, service_role;
