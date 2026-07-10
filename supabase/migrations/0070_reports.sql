-- 0070 — Kayıtlı raporlar (Raporlar arşivi) + Görevler bağlantısı
-- ------------------------------------------------------------------
-- Şimdiye kadar `/raporlar` yalnız canlı, dönem-bazlı bir Kâr/Zarar görünümüydü —
-- serbest biçimli analiz raporlarını (ör. fiyat/indirim analizi) tarihli olarak
-- saklayacak bir arka uç yoktu. Bu migration onu ekler.
--
-- Bir rapordan çıkan aksiyonlar `tasks` tablosuna GERÇEK satır olarak eklenir ve
-- `tasks.report_id` ile rapora bağlanır. Durum tek yerde tutulur (tasks.status);
-- hem Görevler hem Raporlar aynı satırı okur, birinde değişen her yerde görünür.
-- Aksiyon Planı'nın (metrik senaryoları) eski "sadece metinle bağla" deseninin
-- aksine burada gerçek bir foreign key var.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text not null default 'genel',
  summary text,
  -- Yapılandırılmış içerik: bulgular, istatistik kartları, zaman serisi/YoY
  -- grafik verisi, kademeli (tier) aksiyon listeleri. Rapor sayfası bunu okuyup
  -- panelin kendi bileşenleriyle (KpiCard, Recharts) render eder — donmuş HTML
  -- gömülmez, böylece tema/erişilebilirlik panelin geri kalanıyla tutarlı kalır.
  content jsonb not null default '{}'::jsonb,
  report_date date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.reports (org_id, report_date desc);

create trigger set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.reports
  for each row execute function public.audit_trigger();

alter table public.reports enable row level security;

create policy "reports_select" on public.reports for select to authenticated
  using (org_id = public.current_org_id());
create policy "reports_insert" on public.reports for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "reports_update" on public.reports for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "reports_delete" on public.reports for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- Görev ↔ kaynak rapor: bir görev en fazla bir raporun ürünüdür (nullable —
-- elle eklenen görevler etkilenmez). Rapor silinirse görev kalır, bağı düşer.
alter table public.tasks
  add column report_id uuid references public.reports(id) on delete set null;
create index on public.tasks (report_id);
