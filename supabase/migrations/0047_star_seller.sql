-- 0047 — Yıldız Satıcı (Star Seller) dönem anlık görüntüleri
-- ------------------------------------------------------------------
-- Etsy Star Seller API'de yok; değerler Etsy panosundan dönem başına elle
-- girilir (mesaj yanıt hızı, zamanında kargo, ortalama puan, itiraz oranı) ve
-- panel bunları hizmet standardı + Star Seller hedefiyle karşılaştırıp dönem
-- geçmişini tutar. Ortalama puan ayrıca yorumlardan otomatik hesaplanır (çapraz
-- kontrol için); yetkili değeri Etsy'den girilen sayıdır.

create table public.star_seller_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  period_label text not null,               -- ör. "1 May – 31 Tem 2026"
  period_start date,
  period_end date,
  next_chance_on date,                      -- bir sonraki Star Seller şansı
  message_response_rate numeric,            -- % (0–100), 24 saat içinde
  on_time_shipping_rate numeric,            -- % (0–100), takipli zamanında
  avg_review_rating numeric,                -- 0–5
  low_review_count integer,                 -- puanı ≤3 olan yorum sayısı
  case_count integer,                       -- Ödeme hesabından iade edilen itiraz
  order_count integer,                      -- dönem sipariş sayısı (itiraz paydası)
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, period_label)
);
create index on public.star_seller_snapshots (org_id, period_end desc nulls last);

create trigger set_updated_at
  before update on public.star_seller_snapshots
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.star_seller_snapshots
  for each row execute function public.audit_trigger();

alter table public.star_seller_snapshots enable row level security;

create policy "star_seller_select" on public.star_seller_snapshots for select to authenticated
  using (org_id = public.current_org_id());
create policy "star_seller_insert" on public.star_seller_snapshots for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "star_seller_update" on public.star_seller_snapshots for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "star_seller_delete" on public.star_seller_snapshots for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));
