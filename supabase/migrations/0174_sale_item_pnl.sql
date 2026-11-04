-- 0174 — Satış & Maliyet Takibi: kalem-başı maliyet türleri, iadeler, gönderiler,
--        kargo etiketi bağlama ve kalem-başı kâr/zarar görünümü (sale_item_pnl)
-- ---------------------------------------------------------------------------
-- Amaç (kullanıcı talebi, Excel "etsy-satis-maliyet-takip" deseni): her satılan
-- kalemde altın / işçilik / taş (varsa) / paketleme maliyeti ELLE girilebilsin,
-- Etsy'den gelen iade + kargo etiketi (gidiş ve İADE etiketi) + ücretler aynı
-- satırda görünsün ve kalem başına net kâr tek yerden okunsun.
--
-- Muhasebe kuralları (docs/satis-maliyet-takip.md):
--  * Gelir = ürün + alıcının ödediği kargo − indirim. VERGİ GELİR DEĞİLDİR
--    (Etsy marketplace facilitator olarak toplar ve öder; 1099-K dışıdır).
--  * İade = kontra gelir (Schedule C "Returns and allowances"); maliyet değil.
--  * COGS = altın + işçilik + taş + paketleme (ürüne fiziksel olarak giren);
--    iade edilen ürün stoğa dönerse `recovered_cents` ile COGS geri çevrilir
--    (hurda/eritme değeri de aynı alana yazılır).
--  * Etsy ücretleri (işlem, işleme, offsite ads, listing) + kargo etiketleri =
--    SATIŞ GİDERİ (COGS değil). İade kargo etiketi de satış gideridir, siparişe
--    bağlanır.
--  * Elle girilen kalem maliyeti, motorun ürettiği otomatik satırı (gold_auto /
--    listing_fixed) AYNI TÜRDE ezer: görünüm `manual` varsa onu, yoksa otomatiği
--    okur. Otomatik satır silinmez (iz kalır), çift sayılmaz.
--
-- Tek doğruluk kaynağı `costs` kalır (işletme kârı RPC'si, Maliyetler listesi,
-- audit trigger'ı ve taraf trigger'ı olduğu gibi çalışır); yeni kolonlar
-- türü (`cost_kind`) ve dış anahtarı (`external_key`) taşır.

-- ── 1) costs: maliyet türü + dış anahtar ──────────────────────────────────
alter table public.costs
  add column if not exists cost_kind text
    check (cost_kind in (
      'gold', 'labor', 'gem', 'packaging',
      'shipping_label', 'return_label', 'other'
    ));

comment on column public.costs.cost_kind is
  'Kalem-başı maliyet türü: gold | labor | gem | packaging | shipping_label | return_label | other. NULL = türsüz (aylık özet vb.).';

-- Dış kayıt anahtarı — idempotent bağlama: "ledger:<entry_id>" (Etsy ledger
-- kargo etiketi), "ss:<shipment_id>" (ShipStation gönderisi).
alter table public.costs
  add column if not exists external_key text;

create unique index if not exists costs_external_key_uq
  on public.costs (org_id, external_key)
  where external_key is not null;

-- Elle girilen kalem maliyeti: kalem × tür tekil (upsert anahtarı).
create unique index if not exists costs_manual_item_kind_uq
  on public.costs (sale_item_id, cost_kind)
  where source = 'manual' and sale_item_id is not null and cost_kind is not null;

create index if not exists costs_sale_item_kind_idx
  on public.costs (sale_item_id, cost_kind)
  where sale_item_id is not null;

-- Kaynak sözlüğü: önceki migration'lar farklı alt kümeler bıraktı (0109
-- listing_fixed; canlıda 'invoice' da var). Hepsinin birleşimi.
alter table public.costs drop constraint if exists costs_source_check;
alter table public.costs add constraint costs_source_check
  check (source = any (array[
    'manual'::text, 'csv'::text, 'etsy'::text, 'etsy_ledger'::text,
    'shipstation'::text, 'gold_auto'::text, 'listing_fixed'::text,
    'invoice'::text
  ]));

-- Geriye dönük tür ataması BİLEREK yapılmaz: costs'ta audit trigger'ı var,
-- on binlerce motor satırını UPDATE etmek Kayıtlar'a o kadar gürültü yazar
-- (0054 dersi). Eski motor satırlarının türü görünümde kategoriden türetilir
-- (malzeme→gold, iscilik→labor); motorlar bundan sonra cost_kind'ı kendisi yazar.

-- ── 2) Kategori: Taş (gem) — değişken maliyet ─────────────────────────────
insert into public.cost_categories (org_id, key, label_tr, is_system)
select o.id, 'tas', 'Taş / Gem', true
from public.organizations o
where not exists (
  select 1 from public.cost_categories cc where cc.org_id = o.id and cc.key = 'tas'
);

-- ── 3) sales: Etsy receipt'in panelde olmayan alanları + iade özeti ───────
alter table public.sales
  add column if not exists refunded_cents integer not null default 0,
  add column if not exists refund_count integer not null default 0,
  add column if not exists last_refund_at timestamptz,
  add column if not exists refunds_synced_at timestamptz,
  add column if not exists total_price_cents integer,
  add column if not exists vat_cents integer not null default 0,
  add column if not exists gift_wrap_cents integer not null default 0,
  add column if not exists is_gift boolean,
  add column if not exists needs_gift_wrap boolean,
  add column if not exists message_from_buyer text,
  add column if not exists payment_method text,
  add column if not exists is_paid boolean,
  add column if not exists is_shipped boolean,
  add column if not exists shipped_at timestamptz,
  add column if not exists etsy_updated_at timestamptz,
  add column if not exists buyer_user_id bigint,
  add column if not exists ship_city text,
  add column if not exists ship_state text;

comment on column public.sales.refunded_cents is
  'Etsy receipt.refunds[] toplamı (cent). Kontra gelir; maliyet değil.';
comment on column public.sales.refunds_synced_at is
  'receipt.refunds[] en son ne zaman Etsy''den okundu. NULL = iade verisi henüz çekilmedi (durum iade olsa bile tutar BİLİNMİYOR).';

-- ── 4) sale_items: transaction'ın kalan alanları + iade/geri kazanım ──────
alter table public.sale_items
  add column if not exists shipping_cost_cents integer not null default 0,
  add column if not exists is_digital boolean,
  add column if not exists variations jsonb,
  add column if not exists etsy_product_id bigint,
  add column if not exists paid_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists expected_ship_date date,
  add column if not exists buyer_coupon_cents integer not null default 0,
  add column if not exists shop_coupon_cents integer not null default 0,
  add column if not exists returned_at timestamptz,
  add column if not exists recovered_cents integer not null default 0
    check (recovered_cents >= 0),
  add column if not exists return_note text;

comment on column public.sale_items.recovered_cents is
  'İade edilen ürünün geri kazanılan değeri (stoğa dönüş = orijinal maliyet; hurda = eritme değeri). COGS''tan düşülür.';

create index if not exists sale_items_shipped_at_idx
  on public.sale_items (org_id, shipped_at)
  where shipped_at is not null;

-- ── 5) sale_refunds — receipt.refunds[] aynası ────────────────────────────
create table if not exists public.sale_refunds (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  amount_cents integer not null,
  currency text not null default 'USD',
  refunded_at timestamptz not null,
  reason text,
  note_from_issuer text,
  status text,
  created_at timestamptz not null default now(),
  -- Etsy ShopRefund'ın kimliği yok; (sipariş, an, tutar) doğal anahtardır.
  unique (sale_id, refunded_at, amount_cents)
);
create index if not exists sale_refunds_org_date_idx
  on public.sale_refunds (org_id, refunded_at desc);

alter table public.sale_refunds enable row level security;
drop policy if exists "sale_refunds_select" on public.sale_refunds;
create policy "sale_refunds_select" on public.sale_refunds for select to authenticated
  using (org_id = public.current_org_id());
drop policy if exists "sale_refunds_write" on public.sale_refunds;
create policy "sale_refunds_write" on public.sale_refunds for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- ── 6) sale_shipments — receipt.shipments[] aynası ────────────────────────
create table if not exists public.sale_shipments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  receipt_shipping_id bigint,
  carrier_name text,
  tracking_code text,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists sale_shipments_receipt_shipping_uq
  on public.sale_shipments (receipt_shipping_id)
  where receipt_shipping_id is not null;
create index if not exists sale_shipments_sale_idx on public.sale_shipments (sale_id);

alter table public.sale_shipments enable row level security;
drop policy if exists "sale_shipments_select" on public.sale_shipments;
create policy "sale_shipments_select" on public.sale_shipments for select to authenticated
  using (org_id = public.current_org_id());
drop policy if exists "sale_shipments_write" on public.sale_shipments;
create policy "sale_shipments_write" on public.sale_shipments for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- ── 7) Kargo etiketlerini siparişe bağla ──────────────────────────────────
-- Etsy API etiket↔sipariş bağını VERMEZ (ledger shipping_label kaydının
-- reference_id'si etiket id'sidir; etiket ucu yok — docs/satis-maliyet-takip.md).
-- Vekil: (a) gidiş etiketi → ledger anı ile kalemin shipped_at anı aynı
-- pencerede (±15 dk) ve TEK aday ise otomatik bağla; (b) ShipStation
-- gönderisi → order_number = receipt_id ile kesin bağ; (c) iade etiketi
-- (shipping_labels_usps_return) ZAMANLA bağlanamaz (alıcı paketi taratınca
-- kesilir) → elle bağlama (link_cost_to_sale) için açık bırakılır.
-- Bağlanan satır costs'a kalem değil SİPARİŞ seviyesinde yazılır
-- (sale_id dolu, sale_item_id boş); görünüm kalemlere paylaştırır.
create or replace function public.rebuild_sale_shipping_label_costs(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat_kargo uuid;
  v_inserted integer := 0;
  n integer;
begin
  select id into v_cat_kargo from public.cost_categories
    where org_id = p_org_id and key = 'kargo' limit 1;

  -- (a) Etsy ledger gidiş etiketleri — zaman eşleşmesi, tek aday kuralı.
  with labels as (
    select le.entry_id, le.amount_cents, coalesce(le.currency, 'USD') as currency,
           le.entry_date, le.ledger_type
    from public.etsy_ledger_entries le
    where le.org_id = p_org_id
      and le.reference_type = 'shipping_label'
      and le.ledger_type in ('shipping_labels', 'shipping_label_insurance')
      and le.amount_cents is not null and le.amount_cents < 0
      and le.entry_date is not null
      and not exists (
        select 1 from public.costs c
        where c.org_id = p_org_id and c.external_key = 'ledger:' || le.entry_id
      )
  ),
  candidates as (
    select l.entry_id, s.id as sale_id,
           abs(extract(epoch from (si.shipped_at - l.entry_date))) as dist_s
    from labels l
    join public.sale_items si
      on si.org_id = p_org_id
     and si.shipped_at is not null
     and si.shipped_at between l.entry_date - interval '15 minutes'
                           and l.entry_date + interval '15 minutes'
    join public.sales s on s.id = si.sale_id
  ),
  picked as (
    select entry_id, min(sale_id::text)::uuid as sale_id, count(distinct sale_id) as n_sales
    from candidates
    group by entry_id
    having count(distinct sale_id) = 1
  ),
  ins as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date,
       vendor, sale_id, source, cost_kind, external_key, notes)
    select
      p_org_id, v_cat_kargo,
      case when l.ledger_type = 'shipping_label_insurance'
           then 'Etsy kargo sigortası' else 'Etsy kargo etiketi' end
        || ' — sipariş ' || coalesce(s.order_no, s.etsy_receipt_id::text, ''),
      -l.amount_cents, l.currency, l.entry_date::date,
      'Etsy', p.sale_id, 'etsy_ledger', 'shipping_label',
      'ledger:' || l.entry_id,
      'otomatik bağ: ledger anı ↔ kalem shipped_at (±15 dk, tek aday) · ledger_type=' || l.ledger_type
    from picked p
    join labels l on l.entry_id = p.entry_id
    join public.sales s on s.id = p.sale_id
    returning 1
  )
  select count(*) into n from ins;
  v_inserted := v_inserted + coalesce(n, 0);

  -- (b) ShipStation gönderileri — order_number = Etsy receipt id (kesin bağ).
  with ss as (
    select sh.shipment_id, s.id as sale_id, s.order_no, s.etsy_receipt_id,
           (coalesce(sh.shipment_cost_cents, 0) + coalesce(sh.insurance_cost_cents, 0))::integer as cost_cents,
           coalesce(sh.currency, 'USD') as currency,
           coalesce(sh.ship_date, sh.create_date)::date as d,
           sh.carrier_code, sh.service_code
    from public.shipstation_shipments sh
    join public.sales s
      on s.org_id = p_org_id
     and s.etsy_receipt_id is not null
     and sh.order_number = s.etsy_receipt_id::text
    where sh.org_id = p_org_id
      and coalesce(sh.voided, false) = false
      and coalesce(sh.ship_date, sh.create_date) is not null
      and (coalesce(sh.shipment_cost_cents, 0) + coalesce(sh.insurance_cost_cents, 0)) > 0
      and not exists (
        select 1 from public.costs c
        where c.org_id = p_org_id and c.external_key = 'ss:' || sh.shipment_id
      )
  ),
  ins2 as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date,
       vendor, sale_id, source, cost_kind, external_key, notes)
    select
      p_org_id, v_cat_kargo,
      'ShipStation postaj — sipariş ' || coalesce(ss.order_no, ss.etsy_receipt_id::text, ''),
      ss.cost_cents, ss.currency, ss.d,
      'ShipStation', ss.sale_id, 'shipstation', 'shipping_label',
      'ss:' || ss.shipment_id,
      'order_number = receipt_id · ' || coalesce(ss.carrier_code, '') || ' ' || coalesce(ss.service_code, '')
    from ss
    returning 1
  )
  select count(*) into n from ins2;
  v_inserted := v_inserted + coalesce(n, 0);

  return v_inserted;
end;
$$;

revoke all on function public.rebuild_sale_shipping_label_costs(uuid) from public, anon;
revoke execute on function public.rebuild_sale_shipping_label_costs(uuid) from authenticated;
grant execute on function public.rebuild_sale_shipping_label_costs(uuid) to service_role;

-- Elle bağlama: bir ledger kaydını (iade etiketi vb.) bir siparişe bağla.
-- Üye yetkisiyle çalışır (security invoker); RLS costs/ledger/sales'i korur.
create or replace function public.link_ledger_entry_to_sale(
  p_entry_id bigint,
  p_sale_id uuid,
  p_kind text default 'return_label'
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_org uuid;
  v_cat uuid;
  v_id uuid;
  le record;
  s record;
begin
  if p_kind not in ('shipping_label', 'return_label', 'other') then
    raise exception 'geçersiz tür: %', p_kind;
  end if;
  select * into le from public.etsy_ledger_entries where entry_id = p_entry_id;
  if not found then raise exception 'ledger kaydı bulunamadı'; end if;
  select * into s from public.sales where id = p_sale_id;
  if not found then raise exception 'sipariş bulunamadı'; end if;
  if s.org_id <> le.org_id then raise exception 'org uyuşmazlığı'; end if;
  v_org := s.org_id;
  select id into v_cat from public.cost_categories
    where org_id = v_org and key = 'kargo' limit 1;

  insert into public.costs
    (org_id, category_id, description, amount_cents, currency, cost_date,
     vendor, sale_id, source, cost_kind, external_key, notes, created_by)
  values (
    v_org, v_cat,
    case p_kind when 'return_label' then 'Etsy İADE kargo etiketi'
                when 'shipping_label' then 'Etsy kargo etiketi'
                else 'Etsy ledger kaydı' end
      || ' — sipariş ' || coalesce(s.order_no, s.etsy_receipt_id::text, ''),
    -coalesce(le.amount_cents, 0), coalesce(le.currency, 'USD'), le.entry_date::date,
    'Etsy', p_sale_id, 'etsy_ledger', p_kind, 'ledger:' || le.entry_id,
    'elle bağlandı · ledger_type=' || coalesce(le.ledger_type, ''), auth.uid()
  )
  on conflict (org_id, external_key) where external_key is not null
  do update set sale_id = excluded.sale_id, cost_kind = excluded.cost_kind,
                description = excluded.description, notes = excluded.notes
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.link_ledger_entry_to_sale(bigint, uuid, text) from public, anon;
grant execute on function public.link_ledger_entry_to_sale(bigint, uuid, text) to authenticated, service_role;

-- ── 8) Aylık özetler: siparişe BAĞLANAN satırı aylık toplamdan düş ───────
-- 0025/0054 aylık kargo özeti + yeni sipariş-başı etiket satırları aynı
-- parayı iki kez sayardı. Bağlanan ledger/ShipStation kayıtları aylık
-- toplamdan çıkarılır; bağlanamayan (iade etiketi vb.) aylıkta kalır.
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
    from public.etsy_ledger_entries le
    where le.org_id = p_org_id
      and le.entry_date is not null
      and le.amount_cents is not null
      -- Siparişe bağlanmış etiket satırı aylık özete GİRMEZ (çift sayım).
      and not exists (
        select 1 from public.costs c
        where c.org_id = p_org_id and c.external_key = 'ledger:' || le.entry_id
      )
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
     and c.external_key is null
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
      and c.external_key is null
      and c.category_id is not distinct from n.category_id
      and c.currency = n.currency
      and c.cost_date = n.cost_date
      and c.amount_cents = n.amount_cents
  );

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.rebuild_etsy_ledger_costs(uuid) from public, anon;
grant execute on function public.rebuild_etsy_ledger_costs(uuid) to authenticated, service_role;

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
    from public.shipstation_shipments sh
    where sh.org_id = p_org_id
      and sh.ship_date is not null
      and coalesce(sh.voided, false) = false
      -- Siparişe bağlanmış gönderi aylık özete GİRMEZ (çift sayım).
      and not exists (
        select 1 from public.costs c
        where c.org_id = p_org_id and c.external_key = 'ss:' || sh.shipment_id
      )
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
     and c.external_key is null
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
      and c.external_key is null
      and c.category_id is not distinct from n.category_id
      and c.currency = n.currency
      and c.cost_date = n.cost_date
      and c.amount_cents = n.amount_cents
  );

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.rebuild_shipstation_costs(uuid) from public, anon;
grant execute on function public.rebuild_shipstation_costs(uuid) to authenticated, service_role;

-- ── 9) Motorlar: elle girilen kalem maliyeti otomatik üretimi durdurur ────
-- rebuild_gold_costs: kalemde manual gold VEYA labor varsa o kalemi atla
-- (görünüm zaten manual'i okur; motorun tekrar yazması gürültü olur).
create or replace function public.rebuild_gold_costs(
  p_org_id uuid,
  p_gold_price_per_ounce numeric
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pure    numeric := p_gold_price_per_ounce / 31.1035;
  v_pur14   integer;
  v_pur10   integer;
  v_cat_mal uuid;
  v_cat_isc uuid;
  v_inserted integer := 0;
begin
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
      si.id                                       as item_id,
      si.sale_id,
      s.order_date::date                          as order_date,
      coalesce(si.quantity, 1)                    as qty,
      coalesce(p.title, pv.name, si.title, '')    as title_text,
      pv.weight_grams::numeric                    as w,
      coalesce(p.listing_cost_cents, 0)           as listing_cost_cents,
      case
        when coalesce(p.title, '') ~* '\y14\s*k' or coalesce(pv.name, '') ~* '\y14\s*k' or coalesce(si.title, '') ~* '\y14\s*k' then '14K'
        when coalesce(p.title, '') ~* '\y10\s*k' or coalesce(pv.name, '') ~* '\y10\s*k' or coalesce(si.title, '') ~* '\y10\s*k' then '10K'
      end                                         as karat
    from public.sale_items si
    join public.sales s
      on s.id = si.sale_id and s.status <> 'cancelled'
    join public.product_variants pv
      on pv.org_id = si.org_id and pv.sku = si.sku and pv.weight_grams > 0
    left join public.products p
      on p.id = coalesce(si.product_id, pv.product_id)
    where si.org_id = p_org_id
      and not exists (
        select 1 from public.costs c
        where c.sale_item_id = si.id and c.source = 'gold_auto'
      )
      -- Elle girilmiş altın/işçilik varsa motor bu kaleme dokunmaz.
      and not exists (
        select 1 from public.costs c
        where c.sale_item_id = si.id and c.source = 'manual'
          and c.cost_kind in ('gold', 'labor')
      )
  ),
  priced as (
    select
      r.*,
      (v_pure * case r.karat when '14K' then 0.585 when '10K' then 0.416 end)            as ayar_gram,
      ((case r.karat when '14K' then v_pur14 when '10K' then v_pur10 end) / 100.0)       as alim_gram
    from resolvable r
    where r.karat is not null and r.w > 0
  ),
  rows as (
    select
      p.item_id, p.sale_id, p.order_date, p.qty, p.title_text, p.karat, p.w,
      p.listing_cost_cents,
      (round(p.ayar_gram * p.w * 100))::int * p.qty                                        as gold_cents,
      (round(greatest(0, p.alim_gram - p.ayar_gram) * p.w * 100))::int * p.qty             as labor_cents
    from priced p
  ),
  ins as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date, vendor, sale_id, sale_item_id, source, cost_kind, notes)
    select
      p_org_id, v_cat_mal,
      'Altin malzeme — ' || karat || ' ' || w || 'g × ' || qty || ' (' || left(title_text, 60) || ')',
      gold_cents, 'USD', order_date, 'Altin Tedarik', sale_id, item_id, 'gold_auto', 'gold',
      'Ons: $' || p_gold_price_per_ounce || ' | Ayar: ' || karat || ' | Agirlik: ' || w || 'g | Adet: ' || qty
    from rows
    union all
    select
      p_org_id, v_cat_isc,
      'Iscilik — ' || karat || ' ' || w || 'g × ' || qty || ' (' || left(title_text, 60) || ')',
      labor_cents, 'USD', order_date, 'Altin Tedarik', sale_id, item_id, 'gold_auto', 'labor',
      'Iscilik (alim - piyasa) | Ayar: ' || karat
    from rows
    where listing_cost_cents <= 0
    returning 1
  )
  select count(*) into v_inserted from ins;

  return v_inserted;
end;
$$;

revoke all on function public.rebuild_gold_costs(uuid, numeric) from public, anon;
revoke execute on function public.rebuild_gold_costs(uuid, numeric) from authenticated;
grant execute on function public.rebuild_gold_costs(uuid, numeric) to service_role;

create or replace function public.rebuild_listing_fixed_costs(
  p_org_id uuid
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat_isc uuid;
  v_inserted integer := 0;
begin
  select id into v_cat_isc from public.cost_categories
    where org_id = p_org_id and key = 'iscilik' limit 1;

  with resolved as (
    select
      si.id as item_id,
      si.sale_id,
      s.order_date::date as order_date,
      coalesce(si.quantity, 1) as qty,
      coalesce(p.title, pv.name, si.title, '') as title_text,
      p.listing_cost_cents
    from public.sale_items si
    join public.sales s
      on s.id = si.sale_id and s.status <> 'cancelled'
    left join public.product_variants pv
      on pv.org_id = si.org_id and pv.sku = si.sku
    left join public.products p
      on p.id = coalesce(si.product_id, pv.product_id)
    where si.org_id = p_org_id
      and p.listing_cost_cents is not null
      and p.listing_cost_cents > 0
      and not exists (
        select 1 from public.costs c
        where c.sale_item_id = si.id and c.source = 'listing_fixed'
      )
      and not exists (
        select 1 from public.costs c
        where c.sale_item_id = si.id and c.source = 'manual' and c.cost_kind = 'labor'
      )
  ),
  ins as (
    insert into public.costs
      (org_id, category_id, description, amount_cents, currency, cost_date,
       vendor, sale_id, sale_item_id, source, cost_kind, notes)
    select
      p_org_id,
      v_cat_isc,
      'Listing sabit maliyet — × ' || qty || ' (' || left(title_text, 60) || ')',
      listing_cost_cents * qty,
      'USD',
      order_date,
      null,
      sale_id,
      item_id,
      'listing_fixed',
      'labor',
      'products.listing_cost_cents=' || listing_cost_cents || ' × adet ' || qty
    from resolved
    returning 1
  )
  select count(*) into v_inserted from ins;

  return v_inserted;
end;
$$;

revoke all on function public.rebuild_listing_fixed_costs(uuid) from public, anon;
revoke execute on function public.rebuild_listing_fixed_costs(uuid) from authenticated;
grant execute on function public.rebuild_listing_fixed_costs(uuid) to service_role;

-- ── 10) sale_item_pnl — kalem-başı kâr/zarar görünümü ─────────────────────
-- Paylaştırma kuralı: sipariş seviyesindeki tutarlar (indirim, alıcı kargosu,
-- iade, Etsy ücreti, siparişe bağlı etiket maliyeti) kalemlere satır toplamı
-- payıyla dağıtılır; sipariş toplamı 0 ise eşit bölünür. Kalem seviyesindeki
-- maliyetler (gold/labor/gem/packaging) doğrudan okunur; AYNI türde elle giriş
-- varsa otomatik satır (gold_auto/listing_fixed) dikkate alınmaz.
-- security_invoker: çağıranın RLS'i (sales/sale_items/costs) uygulanır.
create or replace view public.sale_item_pnl
with (security_invoker = on) as
with item_base as (
  select
    si.id as sale_item_id,
    si.sale_id,
    si.org_id,
    si.product_id,
    si.etsy_listing_id,
    si.etsy_transaction_id,
    si.title,
    si.sku,
    si.variations,
    si.quantity,
    si.unit_price_cents,
    si.line_total_cents,
    si.shipping_cost_cents,
    si.shipped_at,
    si.returned_at,
    si.recovered_cents,
    si.currency,
    s.order_no,
    s.etsy_receipt_id,
    s.order_date,
    s.status,
    s.buyer_name,
    s.ship_country,
    s.discount_cents,
    s.shipping_cents,
    s.tax_cents,
    s.etsy_fees_cents,
    s.refunded_cents,
    s.refund_count,
    s.refunds_synced_at,
    s.grand_total_cents,
    sum(si.line_total_cents) over (partition by si.sale_id) as sale_line_sum,
    count(*) over (partition by si.sale_id) as sale_item_count
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
),
shares as (
  select
    b.*,
    case
      when b.sale_line_sum > 0 then b.line_total_cents::numeric / b.sale_line_sum
      else 1.0 / greatest(b.sale_item_count, 1)
    end as share
  from item_base b
),
item_costs as (
  select
    x.sale_item_id,
    x.cost_kind,
    sum(x.amount_cents) filter (where x.source = 'manual')  as manual_cents,
    sum(x.amount_cents) filter (where x.source <> 'manual') as auto_cents,
    bool_or(x.source = 'manual') as has_manual,
    max(x.cost_date) filter (where x.source = 'manual') as manual_date
  from (
    select
      c.sale_item_id, c.source, c.amount_cents, c.cost_date,
      -- Eski motor satırlarında (0174 öncesi) cost_kind boş: kategoriden türet.
      coalesce(
        c.cost_kind,
        case
          when c.source in ('gold_auto', 'listing_fixed') and cc.key = 'malzeme' then 'gold'
          when c.source in ('gold_auto', 'listing_fixed') and cc.key = 'iscilik' then 'labor'
        end
      ) as cost_kind
    from public.costs c
    left join public.cost_categories cc on cc.id = c.category_id
    where c.sale_item_id is not null
  ) x
  where x.cost_kind is not null
  group by x.sale_item_id, x.cost_kind
),
item_kinds as (
  select
    sale_item_id,
    coalesce(max(case when cost_kind = 'gold' then coalesce(manual_cents, auto_cents) end), 0) as gold_cents,
    coalesce(max(case when cost_kind = 'labor' then coalesce(manual_cents, auto_cents) end), 0) as labor_cents,
    coalesce(max(case when cost_kind = 'gem' then coalesce(manual_cents, auto_cents) end), 0) as gem_cents,
    coalesce(max(case when cost_kind = 'packaging' then coalesce(manual_cents, auto_cents) end), 0) as packaging_cents,
    coalesce(max(case when cost_kind = 'other' then coalesce(manual_cents, auto_cents) end), 0) as other_item_cents,
    coalesce(max(case when cost_kind = 'shipping_label' then coalesce(manual_cents, auto_cents) end), 0) as item_shipping_label_cents,
    coalesce(max(case when cost_kind = 'return_label' then coalesce(manual_cents, auto_cents) end), 0) as item_return_label_cents,
    bool_or(cost_kind = 'gold' and has_manual) as gold_manual,
    bool_or(cost_kind = 'labor' and has_manual) as labor_manual,
    bool_or(cost_kind = 'gem' and has_manual) as gem_manual,
    bool_or(cost_kind = 'packaging' and has_manual) as packaging_manual,
    bool_or(cost_kind = 'gold') as has_gold,
    bool_or(cost_kind = 'labor') as has_labor,
    bool_or(cost_kind = 'gem') as has_gem,
    bool_or(cost_kind = 'packaging') as has_packaging
  from item_costs
  group by sale_item_id
),
sale_costs as (
  -- Sipariş seviyesinde (kaleme bağlanmamış) maliyetler: etiketler + diğer.
  select
    c.sale_id,
    coalesce(sum(c.amount_cents) filter (where c.cost_kind = 'shipping_label'), 0) as sale_shipping_label_cents,
    coalesce(sum(c.amount_cents) filter (where c.cost_kind = 'return_label'), 0) as sale_return_label_cents,
    coalesce(sum(c.amount_cents) filter (where c.cost_kind is null or c.cost_kind = 'other'), 0) as sale_other_cents
  from public.costs c
  where c.sale_id is not null and c.sale_item_id is null
  group by c.sale_id
)
select
  sh.sale_item_id,
  sh.sale_id,
  sh.org_id,
  sh.product_id,
  sh.etsy_listing_id,
  sh.etsy_transaction_id,
  sh.order_no,
  sh.etsy_receipt_id,
  sh.order_date,
  sh.status,
  sh.buyer_name,
  sh.ship_country,
  sh.title,
  sh.sku,
  sh.variations,
  sh.quantity,
  sh.unit_price_cents,
  sh.line_total_cents,
  sh.currency,
  sh.shipped_at,
  sh.returned_at,
  sh.recovered_cents,
  sh.refunds_synced_at,
  sh.refund_count,
  round(sh.share, 6) as share,
  -- Gelir tarafı (vergi HARİÇ — gelir değildir)
  round(sh.discount_cents * sh.share)::integer                                as discount_alloc_cents,
  round(sh.shipping_cents * sh.share)::integer                                as shipping_income_alloc_cents,
  round(sh.tax_cents * sh.share)::integer                                     as tax_alloc_cents,
  round(sh.refunded_cents * sh.share)::integer                                as refund_alloc_cents,
  (sh.line_total_cents
     - round(sh.discount_cents * sh.share)
     + round(sh.shipping_cents * sh.share))::integer                          as gross_revenue_cents,
  (sh.line_total_cents
     - round(sh.discount_cents * sh.share)
     + round(sh.shipping_cents * sh.share)
     - round(sh.refunded_cents * sh.share))::integer                          as net_revenue_cents,
  -- Satış giderleri
  round(sh.etsy_fees_cents * sh.share)::integer                               as etsy_fees_alloc_cents,
  (coalesce(ik.item_shipping_label_cents, 0)
     + round(coalesce(sc.sale_shipping_label_cents, 0) * sh.share))::integer  as shipping_label_cents,
  (coalesce(ik.item_return_label_cents, 0)
     + round(coalesce(sc.sale_return_label_cents, 0) * sh.share))::integer    as return_label_cents,
  (coalesce(ik.other_item_cents, 0)
     + round(coalesce(sc.sale_other_cents, 0) * sh.share))::integer           as other_cost_cents,
  -- COGS
  coalesce(ik.gold_cents, 0)::integer                                         as gold_cents,
  coalesce(ik.labor_cents, 0)::integer                                        as labor_cents,
  coalesce(ik.gem_cents, 0)::integer                                          as gem_cents,
  coalesce(ik.packaging_cents, 0)::integer                                    as packaging_cents,
  (coalesce(ik.gold_cents, 0) + coalesce(ik.labor_cents, 0)
     + coalesce(ik.gem_cents, 0) + coalesce(ik.packaging_cents, 0)
     - sh.recovered_cents)::integer                                           as cogs_cents,
  -- Toplam maliyet + net kâr
  (round(sh.etsy_fees_cents * sh.share)
     + coalesce(ik.item_shipping_label_cents, 0)
     + round(coalesce(sc.sale_shipping_label_cents, 0) * sh.share)
     + coalesce(ik.item_return_label_cents, 0)
     + round(coalesce(sc.sale_return_label_cents, 0) * sh.share)
     + coalesce(ik.other_item_cents, 0)
     + round(coalesce(sc.sale_other_cents, 0) * sh.share)
     + coalesce(ik.gold_cents, 0) + coalesce(ik.labor_cents, 0)
     + coalesce(ik.gem_cents, 0) + coalesce(ik.packaging_cents, 0)
     - sh.recovered_cents)::integer                                           as total_cost_cents,
  (sh.line_total_cents
     - round(sh.discount_cents * sh.share)
     + round(sh.shipping_cents * sh.share)
     - round(sh.refunded_cents * sh.share)
     - (round(sh.etsy_fees_cents * sh.share)
        + coalesce(ik.item_shipping_label_cents, 0)
        + round(coalesce(sc.sale_shipping_label_cents, 0) * sh.share)
        + coalesce(ik.item_return_label_cents, 0)
        + round(coalesce(sc.sale_return_label_cents, 0) * sh.share)
        + coalesce(ik.other_item_cents, 0)
        + round(coalesce(sc.sale_other_cents, 0) * sh.share)
        + coalesce(ik.gold_cents, 0) + coalesce(ik.labor_cents, 0)
        + coalesce(ik.gem_cents, 0) + coalesce(ik.packaging_cents, 0)
        - sh.recovered_cents))::integer                                       as net_profit_cents,
  -- Kapsam bayrakları (bilinmeyen maliyet sessizce 0 sayılmaz; UI "eksik" der)
  coalesce(ik.has_gold, false)        as has_gold,
  coalesce(ik.has_labor, false)       as has_labor,
  coalesce(ik.has_gem, false)         as has_gem,
  coalesce(ik.has_packaging, false)   as has_packaging,
  coalesce(ik.gold_manual, false)     as gold_manual,
  coalesce(ik.labor_manual, false)    as labor_manual,
  coalesce(ik.gem_manual, false)      as gem_manual,
  coalesce(ik.packaging_manual, false) as packaging_manual,
  (sh.status in ('refunded', 'partially_refunded') and sh.refunds_synced_at is null) as refund_unknown
from shares sh
left join item_kinds ik on ik.sale_item_id = sh.sale_item_id
left join sale_costs sc on sc.sale_id = sh.sale_id;

comment on view public.sale_item_pnl is
  'Kalem-başı K/Z: gelir (vergi hariç) − iade − Etsy ücreti − etiketler − COGS (altın+işçilik+taş+paketleme−geri kazanım). Elle giriş aynı türdeki otomatik satırı ezer. security_invoker=on.';

grant select on public.sale_item_pnl to authenticated, service_role;
