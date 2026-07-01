-- 0032 — Görevler (Tasks) + görev notları (ekip görev yönetimi)
-- ------------------------------------------------------------------
-- Etsy turnaround planındaki işleri panelde yönetilebilir görevlere çevirir:
-- durum (yapılacak/devam/tamam), öncelik (P0–P3), şerit (A/B/owner),
-- kullanıcıya atama (assignee) ve göreve iş birliği notları (task_notes).

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo'
    check (status in ('todo', 'doing', 'done')),
  priority text not null default 'P1'
    check (priority in ('P0', 'P1', 'P2', 'P3')),
  lane text check (lane in ('A', 'B', 'owner')),
  assignee_id uuid references auth.users(id) on delete set null,
  effort text,
  due_date date,
  sort_order integer not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tasks (org_id, status);
create index on public.tasks (org_id, priority);
create index on public.tasks (assignee_id);

create table public.task_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  body text not null,
  author_id uuid references auth.users(id) on delete set null,
  author_label text,
  created_at timestamptz not null default now()
);
create index on public.task_notes (task_id, created_at desc);

create trigger set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger audit after insert or update or delete on public.tasks
  for each row execute function public.audit_trigger();
create trigger audit after insert or update or delete on public.task_notes
  for each row execute function public.audit_trigger();

alter table public.tasks enable row level security;
alter table public.task_notes enable row level security;

-- tasks: org üyeleri görür/ekler/günceller; silmeyi owner/admin yapar.
create policy "tasks_select" on public.tasks for select to authenticated
  using (org_id = public.current_org_id());
create policy "tasks_insert" on public.tasks for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "tasks_update" on public.tasks for update to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy "tasks_delete" on public.tasks for delete to authenticated
  using (org_id = public.current_org_id() and public.current_org_role() in ('owner', 'admin'));

-- task_notes: org üyeleri görür/ekler; yazarı veya owner/admin siler.
create policy "task_notes_select" on public.task_notes for select to authenticated
  using (org_id = public.current_org_id());
create policy "task_notes_insert" on public.task_notes for insert to authenticated
  with check (org_id = public.current_org_id());
create policy "task_notes_delete" on public.task_notes for delete to authenticated
  using (
    org_id = public.current_org_id()
    and (author_id = auth.uid() or public.current_org_role() in ('owner', 'admin'))
  );

-- Seed: 90 günlük turnaround planındaki 14 görev (yalnızca ilk kez; boşsa).
insert into public.tasks (org_id, title, description, status, priority, lane, effort, sort_order)
select o.id, t.title, t.description, 'todo', t.priority, t.lane, t.effort, t.sort_order
from (select id from public.organizations order by created_at limit 1) o
cross join (
  values
    (1, 'Trafik düşüşünü (-56%) teşhis et',
       '12 aylık Stats trendi; kaldırılan/süresi geçen ürünler, sıralama kayıpları, reklam/politika değişikliklerini kontrol et.',
       'P0', 'A', '½ gün'),
    (2, 'Tükendi görünen made-to-order varyantları stokla',
       '118 üründe; gerçekçi made-to-order adetleri gir. Görüntülenen ürünlerde dönüşümü doğrudan yükseltir.',
       'P0', 'A', '1 gün'),
    (3, 'Otomatik sepet kurtarma tekliflerini aç',
       '48 saatten eski sepetlere ücretsiz kargo / % indirim teklifi. ~$5k/ay geri kazanım potansiyeli.',
       'P0', 'B', '2 saat'),
    (4, 'Sıfır satışlı 2 yüksek görüntülemeli üründe CRO',
       'Küba zincir kolye + nugget yüzük · fiyat / ilk foto / varyant / güven sinyalleri.',
       'P0', 'B', '½ gün'),
    (5, 'Etsy SEO revizyonu',
       'Başlıkları alıcı ifadeleriyle yaz, 13 etiketin tümünü doldur, her niteliği tamamla, Necklace/Chain kategori ayrımını düzelt.',
       'P1', 'A', '1 hafta'),
    (6, 'Foto & video yükseltme (ilk 20 ürün)',
       'Ölçek/model çekimleri, altın damga yakın planı, kısa video · marka kamera spesifikasyonu.',
       'P1', 'B', '1 hafta'),
    (7, 'Sosyal medyayı aktive et — Instagram + Pinterest',
       '3 saniyelik kancalı reels, okunur başlıklar, bio''da mağaza linki. 39 → 500+ ziyaret/ay hedefi.',
       'P1', 'B', 'sürekli'),
    (8, 'Mağaza politikalarını güncelle',
       'İade, hazırlık süresi, ölçü rehberi, altın bakımı, orijinallik/damga notu.',
       'P1', 'A', '2 saat'),
    (9, 'Rose Gold kazananı klonla + haftalık ürün kadansı',
       'Renk/ölçü varyasyonları; ince kategorileri (Necklace, Earrings) genişlet.',
       'P2', 'A', 'sürekli'),
    (10, 'Fiyat psikolojisi testi',
       'Spot-kritik olmayan SKU''larda yuvarlak eşikler ($155 vs $150.93) + ''canlı altına göre fiyat'' notu.',
       'P2', 'B', '½ gün'),
    (11, 'Puan savunması',
       'Satış sonrası teşekkür + proaktif kargo bildirimleri; son 4★ altı nedenleri kapat.',
       'P2', 'B', 'sürekli'),
    (12, 'NYC / NJ marka mesajını hizala',
       'Marka ''New York'' derken gönderi West New York, NJ''den — hikâyeyi netleştir.',
       'P2', 'B', '1 saat'),
    (13, 'Tekrar alan müşteri programı',
       'Kargo sonrası teşekkür teklifi; mevcut %17,5 tekrar oranını büyüt.',
       'P3', 'B', 'sürekli'),
    (14, 'Etsy Ads + Offsite Ads ROAS incelemesi',
       'Kaybedenleri kes, kazananları (Rose Gold formülü) ikiye katla.',
       'P3', 'A', 'aylık')
) as t(sort_order, title, description, priority, lane, effort)
where not exists (select 1 from public.tasks where org_id = o.id);
