-- 0009 — CSV içe aktarma toplu işleri
-- ------------------------------------------------------------------

create table public.csv_imports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  module text not null check (module in ('sales', 'costs')),
  filename text,
  file_path text,
  mapping_template text,
  status text not null default 'pending'
    check (status in ('pending', 'previewed', 'committed', 'failed')),
  row_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  error_log jsonb,
  raw_preview jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);
create index on public.csv_imports (org_id, created_at desc);

-- sales.csv_import_id yabancı anahtarını şimdi bağla.
alter table public.sales
  add constraint sales_csv_import_id_fkey
  foreign key (csv_import_id) references public.csv_imports(id) on delete set null;
