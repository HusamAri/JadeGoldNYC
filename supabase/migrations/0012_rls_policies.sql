-- 0012 — Row Level Security politikaları
-- ------------------------------------------------------------------
-- Genel kural: üyeler yalnız kendi org'larının verisini görür/yazar.
-- Silme yalnız owner/admin. audit_log append-only. etsy_* yalnız service-role.

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.audit_log enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.cost_categories enable row level security;
alter table public.costs enable row level security;
alter table public.designs enable row level security;
alter table public.reviews enable row level security;
alter table public.csv_imports enable row level security;
alter table public.etsy_connection enable row level security;
alter table public.etsy_oauth_states enable row level security;

-- organizations
create policy "org_select" on public.organizations for select to authenticated
  using (id = public.current_org_id());

-- organization_members
create policy "members_select" on public.organization_members for select to authenticated
  using (org_id = public.current_org_id());
create policy "members_manage" on public.organization_members for all to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() = 'owner')
  with check (org_id = public.current_org_id() and public.current_org_role() = 'owner');

-- audit_log: okuma + ekleme; güncelleme/silme YOK (append-only)
create policy "audit_select" on public.audit_log for select to authenticated
  using (org_id = public.current_org_id());
create policy "audit_insert" on public.audit_log for insert to authenticated
  with check (org_id = public.current_org_id());

-- Çekirdek veri tabloları için standart üye politikaları.
-- products
create policy "products_select" on public.products for select to authenticated
  using (org_id = public.current_org_id());
create policy "products_insert" on public.products for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "products_update" on public.products for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "products_delete" on public.products for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- sales
create policy "sales_select" on public.sales for select to authenticated
  using (org_id = public.current_org_id());
create policy "sales_insert" on public.sales for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "sales_update" on public.sales for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "sales_delete" on public.sales for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- sale_items
create policy "sale_items_select" on public.sale_items for select to authenticated
  using (org_id = public.current_org_id());
create policy "sale_items_insert" on public.sale_items for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "sale_items_update" on public.sale_items for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "sale_items_delete" on public.sale_items for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- cost_categories
create policy "cost_categories_select" on public.cost_categories for select to authenticated
  using (org_id = public.current_org_id());
create policy "cost_categories_insert" on public.cost_categories for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "cost_categories_update" on public.cost_categories for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "cost_categories_delete" on public.cost_categories for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- costs
create policy "costs_select" on public.costs for select to authenticated
  using (org_id = public.current_org_id());
create policy "costs_insert" on public.costs for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "costs_update" on public.costs for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "costs_delete" on public.costs for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- designs
create policy "designs_select" on public.designs for select to authenticated
  using (org_id = public.current_org_id());
create policy "designs_insert" on public.designs for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "designs_update" on public.designs for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "designs_delete" on public.designs for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- reviews
create policy "reviews_select" on public.reviews for select to authenticated
  using (org_id = public.current_org_id());
create policy "reviews_insert" on public.reviews for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "reviews_update" on public.reviews for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "reviews_delete" on public.reviews for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- csv_imports
create policy "csv_imports_select" on public.csv_imports for select to authenticated
  using (org_id = public.current_org_id());
create policy "csv_imports_insert" on public.csv_imports for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "csv_imports_update" on public.csv_imports for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- etsy_connection ve etsy_oauth_states: authenticated için politika YOK.
-- (RLS açık + politika yok = authenticated erişemez; yalnız service-role bypass eder.)
