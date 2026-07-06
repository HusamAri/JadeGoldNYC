-- 0060 — Altın maliyeti (COGS) set-tabanlı yeniden inşası + geçmişe dönük backfill.
--
-- Sorun: 10.805 satıştan yalnız 6'sında otomatik altın maliyeti vardı → panelde
-- "maliyet 0" (imkânsız). Kök neden: lib/gold-cost-entry.ts ağırlığı
-- `products.weight_grams`'tan okuyordu ama o alan neredeyse boş (118 üründe 1).
-- Gerçek ağırlıklar VARYANT düzeyinde (`product_variants.weight_grams`, SKU'ya
-- bağlı) tutuluyor; satış kalemleri (`sale_items`) de SKU taşıyor. Ayrıca
-- satış×kalem üzerinde Node döngüsü 10 binlerce satışta 40sn cron bütçesine
-- sığmıyor. Çözüm: SKU → product_variants.weight_grams üzerinden çözen,
-- idempotent, KÜME-tabanlı tek deyimlik bu fonksiyon.
--
-- Formül lib/gold-cost.ts calculateGoldCost ile birebir:
--   saf_gram_usd   = ons_fiyat / 31.1035
--   ayar_gram_usd  = saf_gram_usd * saflık            (14K=0.585, 10K=0.416)
--   alim_gram_usd  = alim_cent_gram / 100             (org gold_settings ya da 10100/6500)
--   iscilik_gram   = max(0, alim_gram_usd - ayar_gram_usd)
--   malzeme_cent   = round(ayar_gram_usd  * gram * 100)   -- birim başına, sonra × adet
--   iscilik_cent   = round(iscilik_gram   * gram * 100)
-- Ayar (10K/14K) ürün başlığı/varyant adından tespit edilir.
--
-- İdempotent: `source='gold_auto'` kaydı olan satış atlanır (çift yazılmaz).
-- Ağırlık/ayar sonradan girildikçe sonraki çağrıda kendiliğinden dolar.

create or replace function public.rebuild_gold_costs(
  p_org_id uuid,
  p_gold_price_per_ounce numeric
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_troy    numeric := 31.1035;
  v_pure    numeric := p_gold_price_per_ounce / 31.1035;  -- saf altın USD/gram
  v_pur14   integer;
  v_pur10   integer;
  v_cat_mal uuid;
  v_cat_isc uuid;
  v_inserted integer := 0;
begin
  -- Org özel alım fiyatları (yoksa varsayılan 14K=101$/g, 10K=65$/g).
  select
    coalesce((gold_settings ->> 'purchase_price_14k_cents')::int, 10100),
    coalesce((gold_settings ->> 'purchase_price_10k_cents')::int, 6500)
  into v_pur14, v_pur10
  from public.organizations where id = p_org_id;
  v_pur14 := coalesce(v_pur14, 10100);
  v_pur10 := coalesce(v_pur10, 6500);

  select id into v_cat_mal from public.cost_categories
    where org_id = p_org_id and key = 'malzeme' limit 1;
  select id into v_cat_isc from public.cost_categories
    where org_id = p_org_id and key = 'iscilik' limit 1;

  with resolvable as (
    select
      si.sale_id,
      s.order_date::date                          as order_date,
      coalesce(si.quantity, 1)                    as qty,
      coalesce(p.title, pv.name, si.title, '')    as title_text,
      pv.weight_grams::numeric                    as w,
      case
        when coalesce(p.title, '') ~* '\y14\s*k' or coalesce(pv.name, '') ~* '\y14\s*k' then '14K'
        when coalesce(p.title, '') ~* '\y10\s*k' or coalesce(pv.name, '') ~* '\y10\s*k' then '10K'
      end                                         as karat
    from public.sale_items si
    join public.sales s
      on s.id = si.sale_id and s.status <> 'cancelled'
    join public.product_variants pv
      on pv.org_id = si.org_id and pv.sku = si.sku and pv.weight_grams > 0
    left join public.products p
      on p.id = pv.product_id
    where si.org_id = p_org_id
      -- idempotent: gold_auto kaydı olan satışları atla
      and not exists (
        select 1 from public.costs c
        where c.sale_id = si.sale_id and c.source = 'gold_auto'
      )
  ),
  priced as (
    select
      r.*,
      (v_pure * case r.karat when '14K' then 0.585 when '10K' then 0.416 end)            as ayar_gram,   -- USD/g
      ((case r.karat when '14K' then v_pur14 when '10K' then v_pur10 end) / 100.0)       as alim_gram    -- USD/g
    from resolvable r
    where r.karat is not null and r.w > 0
  ),
  rows as (
    select
      p.sale_id, p.order_date, p.qty, p.title_text, p.karat, p.w,
      (round(p.ayar_gram * p.w * 100))::int * p.qty                                        as gold_cents,
      (round(greatest(0, p.alim_gram - p.ayar_gram) * p.w * 100))::int * p.qty             as labor_cents
    from priced p
  ),
  ins as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date, vendor, sale_id, source, notes)
    select
      p_org_id, v_cat_mal,
      'Altin malzeme — ' || karat || ' ' || w || 'g × ' || qty || ' (' || left(title_text, 60) || ')',
      gold_cents, 'USD', order_date, 'Altin Tedarik', sale_id, 'gold_auto',
      'Ons: $' || p_gold_price_per_ounce || ' | Ayar: ' || karat || ' | Agirlik: ' || w || 'g | Adet: ' || qty
    from rows
    union all
    select
      p_org_id, v_cat_isc,
      'Iscilik — ' || karat || ' ' || w || 'g × ' || qty || ' (' || left(title_text, 60) || ')',
      labor_cents, 'USD', order_date, 'Altin Tedarik', sale_id, 'gold_auto',
      'Iscilik (alim - piyasa) | Ayar: ' || karat
    from rows
    returning 1
  )
  select count(*) into v_inserted from ins;

  return v_inserted;
end;
$$;

-- Sertleştirme (0058 dersi): p_org_id'yi üyelik kontrolü yapmadan alır ve
-- RLS-bypass eder. Otomatik senkron (service_role) ve rol-korumalı server
-- action (admin client → service_role) çağırır. Supabase default privileges
-- authenticated'a DOĞRUDAN grant verdiğinden public/anon + authenticated'tan al.
revoke all on function public.rebuild_gold_costs(uuid, numeric) from public, anon;
revoke execute on function public.rebuild_gold_costs(uuid, numeric) from authenticated;
grant execute on function public.rebuild_gold_costs(uuid, numeric) to service_role;
