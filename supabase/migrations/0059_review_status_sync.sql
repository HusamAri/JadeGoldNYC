-- 0059 — Yorum durumu senkronu (Etsy ↔ panel).
-- Talep: "Etsy'de yorumların durumlarını da panelde update et. Etsy üzerinden
-- yanıtlanan yorumların da panelde güncellenmesi lazım."
--
-- Etsy Open API v3 yorum nesnesi mağaza yanıtını (reply) AÇMAZ — yanıt metni de,
-- "yanıtlandı" bayrağı da API'de yok (yanıt yalnız Etsy sitesinde görünür). Bu
-- yüzden panel, yanıt takibinin TEK doğruluk kaynağıdır. Bunun iki sonucu var:
--   1) Senkron, panelde işaretlenen durumu (yanitlandi/isaretli) ve yanıt
--      taslağını EZMEMELİ. (Bkz. lib/etsy/sync.ts upsertReviewsPage — artık
--      status/response_text/responded_at/internal_note gönderilmiyor.)
--   2) Etsy'nin verdiği tek "değişiklik" sinyali update_timestamp'tir: alıcı,
--      biz yanıtladıktan SONRA yorumunu Etsy'de değiştirirse yanıtımız artık
--      geçersizdir → yorumu panelde tekrar "yeni"ye çekip gözden geçirtiriz.

-- Etsy'deki son güncelleme zamanı (alıcı düzenlemesi tespiti için).
alter table public.reviews
  add column if not exists etsy_updated_at timestamptz;

-- Senkron sonrası uzlaştırma: yanıtımızdan SONRA Etsy'de güncellenen yorumları
-- tekrar "yeni"ye çek (durum senkronu). Idempotent — not tek sefer eklenir.
create or replace function public.reconcile_reviews_after_sync(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with resurfaced as (
    update public.reviews r
    set
      status = 'yeni',
      internal_note = case
        when coalesce(r.internal_note, '') like '%[Etsy güncellendi]%'
          then r.internal_note
        else trim(both E'\n ' from
          coalesce(r.internal_note, '') || E'\n' ||
          '[Etsy güncellendi] Alıcı, yanıtınızdan sonra yorumu Etsy''de değiştirdi; tekrar gözden geçirin.')
      end
    where r.org_id = p_org_id
      and r.status = 'yanitlandi'
      and r.responded_at is not null
      and r.etsy_updated_at is not null
      and r.etsy_updated_at > r.responded_at
    returning 1
  )
  select count(*) into v_count from resurfaced;
  return v_count;
end;
$$;

-- Sertleştirme (0058 dersi): p_org_id'yi üyelik kontrolü yapmadan alır ve
-- RLS-bypass eder; yalnız senkron (service_role) çağırır. Supabase default
-- privileges yeni fonksiyona authenticated'a DOĞRUDAN EXECUTE verdiğinden
-- "public, anon"tan revoke yetmiyor — authenticated'tan da AYRICA al.
revoke all on function public.reconcile_reviews_after_sync(uuid) from public, anon;
revoke execute on function public.reconcile_reviews_after_sync(uuid) from authenticated;
grant execute on function public.reconcile_reviews_after_sync(uuid) to service_role;
