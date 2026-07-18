-- 0100 — Anahtar kelime araştırma katmanı (talep verisi + AI/kural adayları).
-- ------------------------------------------------------------------
-- Aday anahtar kelimeler ve (bağlıysa) gerçek arama hacmi/rekabet metrikleri.
-- Kaynaklar: rule (ücretsiz kural motoru), ai (Gemini), dataforseo/google_ads
-- (talep API'si), etsy, manual. Kullanıcı beğendiklerini 'selected' yapar ve
-- listing SEO akışına taşır. Platformdan bağımsız (Etsy + ileride Shopify).

create table if not exists public.keyword_ideas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  seed text,                       -- adayı üreten tohum sorgu
  keyword text not null,
  source text not null default 'rule'
    check (source in ('rule', 'ai', 'dataforseo', 'google_ads', 'etsy', 'manual')),
  search_volume int,               -- aylık arama (talep kaynağı bağlanınca dolar)
  competition numeric,             -- 0..1 (bağlanınca dolar)
  cpc_cents int,                   -- tahmini tıklama başı maliyet
  trend jsonb,                     -- aylık seri (opsiyonel)
  score numeric,                   -- panel fırsat skoru (kural bazlı, hep dolu)
  status text not null default 'candidate'
    check (status in ('candidate', 'selected', 'rejected')),
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists keyword_ideas_org_idx
  on public.keyword_ideas(org_id, created_at desc);
create index if not exists keyword_ideas_product_idx
  on public.keyword_ideas(product_id, status);
-- Aynı anahtar kelime bir ürün/tohum bağlamında iki kez saklanmasın.
create unique index if not exists keyword_ideas_uniq
  on public.keyword_ideas(org_id, coalesce(product_id, '00000000-0000-0000-0000-000000000000'::uuid), keyword);

alter table public.keyword_ideas enable row level security;

create policy "keyword_ideas_all" on public.keyword_ideas for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- Şirket hafızası: create/update/delete audit_log'a otomatik yazılsın.
create trigger audit after insert or update or delete on public.keyword_ideas
  for each row execute function public.audit_trigger();
