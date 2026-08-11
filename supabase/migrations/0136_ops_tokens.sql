-- 0136 — Tek kullanımlık ops token'ları.
--
-- Neden: geçici ops rotaları (SKU ayrıştırma gibi) PRODUCTION'da koşmak
-- zorunda (Etsy OAuth oradaki app'e kilitli) ama tetikleyen taraf CRON_SECRET
-- env'ine erişemeyebilir. Bu tablo DB-tabanlı, tek kullanımlık, süreli token
-- doğrulaması sağlar: token'ı servis rolü üretip HASH'ini yazar, rota SHA-256
-- karşılaştırmasını CAS (koşullu UPDATE ... returning) ile yapar — çift
-- kullanım yapısal olarak imkânsız (tek-kullanımlık onay dersi, second-brain).
--
-- RLS açık + hiç policy yok → yalnız service role okur/yazar; üyelere kapalı.

create table if not exists public.ops_tokens (
  id uuid primary key default gen_random_uuid(),
  purpose text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ops_tokens_lookup
  on public.ops_tokens (purpose, token_hash) where used_at is null;

alter table public.ops_tokens enable row level security;
