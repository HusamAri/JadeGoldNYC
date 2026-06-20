-- 0001 — Eklentiler ve ortak yardımcı fonksiyonlar
-- ------------------------------------------------------------------

create extension if not exists pgcrypto;

-- updated_at kolonunu her güncellemede otomatik tazeler.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
