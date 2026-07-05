-- 0058 — Güvenlik sertleştirmesi (panel güvenlik denetimi bulguları).
-- Amaç: yetkisiz kişiler/roller mağaza verisine ve Etsy yazma uçlarına erişemesin.

-- ── 1) HIGH: Otomatik üyelik açığı ────────────────────────────────────────
-- handle_new_user() her yeni auth kullanıcısını org'a 'member' yapıyordu.
-- Supabase self-signup varsayılan açık + anon key public olduğundan, yabancı
-- biri /auth/v1/signup ile kaydolup otomatik üye olabiliyordu (tüm veriyi
-- okur, Etsy'ye yazar). Artık YALNIZ ilk kullanıcı (bootstrap) owner olur;
-- sonraki kullanıcılar OTOMATİK üye YAPILMAZ — üyelik yalnız davet/owner ile
-- (inviteMember → organization_members insert). Üyeliksiz kullanıcı
-- requireMembership()'te /login'e döner, current_org_id() null → veri yok.
-- NOT: Ayrıca Supabase Auth panelinden "Enable Signups" KAPATILMALI (config).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_count integer;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  select id into v_org from public.organizations order by created_at limit 1;
  if v_org is null then
    return new;
  end if;

  select count(*) into v_count from public.organization_members;
  -- Yalnız ilk kullanıcı bootstrap owner; sonrakiler davet bekler.
  if v_count = 0 then
    insert into public.organization_members (org_id, user_id, role)
    values (v_org, new.id, 'owner')
    on conflict (org_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

-- ── 2) MEDIUM: security-definer rebuild/match/link fonksiyonları ───────────
-- Bunlar yalnız admin (service_role) istemcisinden çağrılıyor; authenticated'a
-- EXECUTE gereksiz ve p_org_id'yi üyelik kontrolü yapmadan aldıklarından
-- (RLS-bypass) çoklu-org öncesi tenant izolasyon riski. authenticated'tan al.
revoke execute on function public.rebuild_shipstation_costs(uuid) from authenticated;
revoke execute on function public.rebuild_etsy_ledger_costs(uuid) from authenticated;
revoke execute on function public.rebuild_sales_etsy_fees(uuid) from authenticated;
revoke execute on function public.rebuild_sale_item_product_links(uuid) from authenticated;
revoke execute on function public.rebuild_shipstation_order_items(uuid) from authenticated;
revoke execute on function public.rebuild_shipstation_customers(uuid) from authenticated;
revoke execute on function public.rebuild_cogs_estimate(uuid, numeric) from authenticated;
revoke execute on function public.match_variant_weights_from_shipstation(uuid) from authenticated;
revoke execute on function public.link_sale_items_by_sku(uuid) from authenticated;

-- ── 3) LOW: avatars kovası geniş listeleme (LIST) yetkisi ──────────────────
-- Public bucket objeleri zaten /object/public/ ile doğrudan URL'den okunur;
-- "to public" geniş SELECT, anon'un TÜM avatarları enumerasyonla listelemesine
-- izin veriyordu. Kaldır — görüntüleme public URL ile çalışmaya devam eder.
drop policy if exists "avatars_public_read" on storage.objects;
