-- 0017 — Sepet kurtarma (terk edilen sepetler + geri kazanım takibi)
-- ------------------------------------------------------------------

create table public.cart_recoveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  buyer_name text,
  buyer_email text,
  cart_value_cents bigint,
  item_summary text,
  abandoned_at date,
  status text not null default 'yeni'
    check (status in ('yeni', 'iletildi', 'kazanildi', 'kayip')),
  action_taken text,
  incentive text,
  recovered_value_cents bigint,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.cart_recoveries (org_id, abandoned_at desc nulls last);
create index on public.cart_recoveries (status);

create trigger set_updated_at
  before update on public.cart_recoveries
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.cart_recoveries
  for each row execute function public.audit_trigger();

alter table public.cart_recoveries enable row level security;

create policy "cart_recoveries_select" on public.cart_recoveries for select to authenticated
  using (org_id = public.current_org_id());
create policy "cart_recoveries_insert" on public.cart_recoveries for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "cart_recoveries_update" on public.cart_recoveries for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "cart_recoveries_delete" on public.cart_recoveries for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));
