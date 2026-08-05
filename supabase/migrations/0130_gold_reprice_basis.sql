-- 0130: Altın-endeksli fiyatlama tabanı + toplu uygulama RPC'leri.
--
-- Karar (2026-08-05): fiyatlar altın spotuna endekslenir; spot taban değişince
-- EON formül-yeniden-hesap, Jade metal-maliyet-delta ile güncellenir
-- (lib/pricing/gold-index.ts + app/api/ops/gold-reprice). Bu tablo her org'un
-- SON uygulanmış spot tabanını taşır — bir sonraki koşu farkı buna göre ölçer.
--
-- v4 grid (docs/eon/pricing/2026-07-29-...-spot4090-v4.xlsx) tabanı $4090/ozt;
-- her iki org da bu dönemin fiyatlarını taşıdığı için ikisi de 4090'dan başlar.

create table if not exists public.gold_reprice_basis (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  spot_per_ozt numeric(10, 2) not null check (spot_per_ozt > 0),
  source text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists gold_reprice_basis_org_created
  on public.gold_reprice_basis (org_id, created_at desc);

alter table public.gold_reprice_basis enable row level security;

-- Okuma: org üyeliği. YAZMA POLİTİKASI YOK — taban yalnız service-role
-- (reprice rotası) tarafından yazılır; panelden elle düzenlenemez.
drop policy if exists gold_reprice_basis_select on public.gold_reprice_basis;
create policy gold_reprice_basis_select on public.gold_reprice_basis
  for select using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = gold_reprice_basis.org_id and m.user_id = auth.uid()
    )
  );

-- Tohum: her iki org 4090 tabanından başlar (idempotent).
insert into public.gold_reprice_basis (org_id, spot_per_ozt, source, note)
select o.id, 4090, 'v4-grid',
       '2026-07-29 v4 grid tabanı (ilk tohum)'
from public.organizations o
where o.name in ('EON', 'Jade Gold NYC')
  and not exists (
    select 1 from public.gold_reprice_basis b where b.org_id = o.id
  );

-- Toplu fiyat uygulaması: [{"id": "<uuid>", "cents": 12345}, ...] listesini tek
-- statement'ta işler (11k varyantı satır-satır REST update'lemek yerine).
-- Yalnız gerçekten değişen satırlara dokunur (audit trigger gürültüsü azalır).
create or replace function public.gold_reprice_apply(p_org uuid, p_pairs jsonb)
returns integer
language plpgsql
as $$
declare
  n integer;
begin
  with x as (
    select (e->>'id')::uuid as id, (e->>'cents')::int as cents
    from jsonb_array_elements(p_pairs) e
  )
  update public.product_variants v
  set price_cents = x.cents
  from x
  where v.id = x.id
    and v.org_id = p_org
    and x.cents > 0
    and v.price_cents is distinct from x.cents;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Çapa tazeleme: dokunulan ürünlerin products.price_cents = en düşük varyant.
create or replace function public.gold_reprice_refresh_anchors(p_org uuid)
returns integer
language plpgsql
as $$
declare
  n integer;
begin
  update public.products p
  set price_cents = m.min_cents
  from (
    select product_id, min(price_cents) as min_cents
    from public.product_variants
    where org_id = p_org and price_cents is not null and price_cents > 0
    group by product_id
  ) m
  where p.id = m.product_id
    and p.org_id = p_org
    and p.price_cents is distinct from m.min_cents;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Bu RPC'ler yalnız service-role içindir (0058 sertleştirme deseni).
revoke execute on function public.gold_reprice_apply(uuid, jsonb)
  from public, anon, authenticated;
revoke execute on function public.gold_reprice_refresh_anchors(uuid)
  from public, anon, authenticated;
