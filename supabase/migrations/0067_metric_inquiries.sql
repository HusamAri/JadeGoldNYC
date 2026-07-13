-- 0067 — Metrik Soruları: aksiyon planı senaryolarının ekipten girdi istemesi.
-- Veride olmayan bilgi (Etsy Stats ekran verisi), görsel kontrol, görüş ya da
-- oylama panel üzerinden ekibe sorulur. Çözülme kuralı:
--   * kind='data'  → TEK giriş yeter (objektif veri kişiye göre değişmez);
--     ilk yanıt soruyu 'review'a çeker ve data_value'ya yazılır.
--   * kind='opinion' | 'vote' | 'visual' → TÜM org üyeleri yanıtlayınca
--     'review'a çekilir (uygulama katmanında sayılır).
-- 'review' = incelemeye geri düştü; senaryo değerlendirmesi bunu tüketir ve
-- kapatan kişi 'resolved' yapar.

create table if not exists public.metric_inquiries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id text,                -- playbook senaryo anahtarı (opsiyonel bağ)
  title text not null,
  body text,
  kind text not null check (kind in ('data','visual','opinion','vote')),
  options jsonb,                   -- vote için seçenekler: ["Evet","Hayır",...]
  status text not null default 'open'
    check (status in ('open','review','resolved')),
  data_value text,                 -- kind='data' girişinin sonucu
  created_by uuid,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists metric_inquiries_org_idx
  on public.metric_inquiries(org_id, status, created_at desc);

create table if not exists public.metric_inquiry_responses (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.metric_inquiries(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  author_name text,
  body text,                       -- serbest görüş / veri değeri
  option text,                     -- vote seçimi
  created_at timestamptz not null default now(),
  unique (inquiry_id, user_id)     -- kişi başına tek yanıt (güncellenebilir)
);
create index if not exists metric_inquiry_responses_inquiry_idx
  on public.metric_inquiry_responses(inquiry_id, created_at);

alter table public.metric_inquiries enable row level security;
alter table public.metric_inquiry_responses enable row level security;

create policy "metric_inquiries_all" on public.metric_inquiries
  for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
create policy "metric_inquiry_responses_all" on public.metric_inquiry_responses
  for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
