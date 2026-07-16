-- 0092 — Reklam aksiyon kuyruğu (karar + takip; Etsy Ads API vekili)
-- ------------------------------------------------------------------
-- GERÇEK KISIT: Etsy Open API v3 reklam (Etsy Ads) kontrolü/verisi SUNMAZ —
-- panel bir listing'in reklamını doğrudan kapatamaz/azaltamaz. "API sınırını
-- kabul et, vekilini kur" deseni (0059 gibi): KARAR panelde verilir ve
-- kalıcı loglanır; uygulama Etsy Reklam panosunda ELLE yapılır. Bu tablo
-- yapıldı/yok sayıldı durumunu ve karar anındaki metrik fotoğrafını tutar ki
-- sonradan "işe yaradı mı?" ölçüm döngüsü kurulabilsin.

create table if not exists public.ads_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  -- önerilen/alınan aksiyon türü
  kind text not null check (kind in ('kapat', 'azalt', 'artir', 'incele')),
  -- sayılarla gerekçe ("$42 harcama, $0 getiri, pay %38" gibi)
  reason text,
  -- karar anındaki fotoğraf: {spend_cents, ads_revenue_cents, roas, share, window_to}
  metric_snapshot jsonb,
  status text not null default 'beklemede'
    check (status in ('beklemede', 'yapildi', 'yok_sayildi')),
  -- yapıldı/yok sayıldı kararını veren kişi + anı (ölçüm döngüsü çapası)
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_actions_org_status_idx
  on public.ads_actions (org_id, status);
create index if not exists ads_actions_product_idx
  on public.ads_actions (org_id, product_id, created_at desc);

create trigger set_updated_at
  before update on public.ads_actions
  for each row execute function public.set_updated_at();

-- Şirket hafızası: reklam kararları da denetim loguna düşer (0011 deseni;
-- satırda token/sır yok, hacim düşük — etsy_connection istisnası geçerli değil).
create trigger audit after insert or update or delete on public.ads_actions
  for each row execute function public.audit_trigger();

alter table public.ads_actions enable row level security;

create policy "ads_actions_select" on public.ads_actions for select to authenticated
  using (org_id = public.current_org_id());
create policy "ads_actions_insert" on public.ads_actions for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "ads_actions_update" on public.ads_actions for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "ads_actions_delete" on public.ads_actions for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));
