-- Adım 1 (ham veri): Etsy ödeme hesabı ledger kayıtları. Ücret türlerini
-- (komisyon, reklam/prolist, offsite, işleme) Etsy net etiketlemediğinden önce
-- ham çekilir; gerçek ledger_type/reference_type dağılımı görülüp Adım 2'de
-- costs'a kesin eşlenecek. Finansal yorum YOK — yalnız ham kayıt.
create table if not exists public.etsy_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entry_id bigint not null unique,
  ledger_id bigint,
  ledger_type text,
  reference_type text,
  reference_id text,
  description text,
  amount_cents bigint,
  currency text,
  balance_cents bigint,
  created_timestamp bigint,
  entry_date timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists etsy_ledger_entries_org_date_idx
  on public.etsy_ledger_entries (org_id, entry_date desc nulls last);
create index if not exists etsy_ledger_entries_type_idx
  on public.etsy_ledger_entries (ledger_type, reference_type);

alter table public.etsy_ledger_entries enable row level security;
create policy "etsy_ledger_entries_select" on public.etsy_ledger_entries
  for select to authenticated using (org_id = public.current_org_id());

-- Senkron ilerleme sayacı (ham ledger fazı).
alter table public.etsy_connection
  add column if not exists sync_ledger integer not null default 0;
