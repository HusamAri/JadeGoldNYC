-- 0056 — match_variant_weights_from_shipstation için grant sıkılaştırması
-- (Devin #103 güvenlik bulgusu). security definer fonksiyonu 0055'te REVOKE/GRANT
-- olmadan tanımlanmıştı; Postgres'te public varsayılan execute'e sahip olduğundan
-- anon rolü PostgREST üzerinden fonksiyonu keyfi p_org_id ile çağırıp RLS'i
-- atlayan UPDATE tetikleyebilirdi. 0031/0014 desenine hizalanır.

revoke all on function public.match_variant_weights_from_shipstation(uuid) from public, anon;
grant execute on function public.match_variant_weights_from_shipstation(uuid) to authenticated, service_role;
