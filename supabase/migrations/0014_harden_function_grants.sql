-- 0014 — Fonksiyon yetkilerini sıkılaştır (güvenlik danışmanı uyarıları)
-- ------------------------------------------------------------------
-- SECURITY DEFINER fonksiyonları RPC yüzeyinden kaldırır / yalnız gereken
-- rollere kısıtlar ve set_updated_at için sabit search_path tanımlar.

alter function public.set_updated_at() set search_path = public;

-- Trigger fonksiyonları doğrudan çağrılamamalı (trigger olarak yine de çalışır).
revoke all on function public.audit_trigger() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Yardımcı / RPC fonksiyonları: anon ve public erişimini kaldır.
revoke execute on function public.current_org_id() from public, anon;
revoke execute on function public.current_org_role() from public, anon;
revoke execute on function public.etsy_connection_status(uuid) from public, anon;
revoke execute on function public.log_audit(uuid, text, text, uuid, text, jsonb, text, text)
  from public, anon;

-- Gerekli rollere açık izinler.
grant execute on function public.current_org_id() to authenticated;
grant execute on function public.current_org_role() to authenticated;
grant execute on function public.etsy_connection_status(uuid) to authenticated;
grant execute on function public.log_audit(uuid, text, text, uuid, text, jsonb, text, text)
  to authenticated, service_role;
