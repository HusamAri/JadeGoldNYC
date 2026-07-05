-- 0052 — product_variants: panel konvansiyonlarına hizala (Devin #99 bulguları).
-- 0051 tabloyu hızlıca eklemişti; çekirdek katalog tablosu olarak eksik olan
-- standart parçalar tamamlanıyor:
--   1) currency (para = cent + currency; products deseni)
--   2) set_updated_at trigger'ı (updated_at güncellensin)
--   3) audit_trigger (şirket hafızası — create/update/delete audit_log'a)
--   4) RLS: silme yalnız owner/admin (0012 çekirdek tablo deseni), diğer CRUD org üyesi

-- 1) Para birimi (varsayılan USD; üründen bağımsız sorgularda belirsizlik olmasın)
alter table public.product_variants
  add column if not exists currency text not null default 'USD';

-- 2) updated_at otomatik güncelleme
drop trigger if exists set_updated_at on public.product_variants;
create trigger set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- 3) Denetim logu (etsy_connection dışındaki çekirdek tablolarda zorunlu)
drop trigger if exists audit on public.product_variants;
create trigger audit
  after insert or update or delete on public.product_variants
  for each row execute function public.audit_trigger();

-- 4) RLS'i çekirdek tablo desenine böl: select/insert/update org üyesi; delete owner/admin
drop policy if exists "product_variants_all" on public.product_variants;
create policy "product_variants_select" on public.product_variants for select to authenticated
  using (org_id = public.current_org_id());
create policy "product_variants_insert" on public.product_variants for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "product_variants_update" on public.product_variants for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "product_variants_delete" on public.product_variants for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));
