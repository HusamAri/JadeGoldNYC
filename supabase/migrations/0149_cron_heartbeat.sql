-- 0149 — Cron nabzı (cron_run): zamanlanmış işin KOŞUP KOŞMADIĞINI ölç
-- ------------------------------------------------------------------
-- NEDEN (vaka 2026-09-12): `/api/cron/etsy-sync` 2026-08-12 07:07'den beri hiç
-- tetiklenmedi. Bir AY boyunca kimse görmedi. Görülmemesinin sebebi şuydu:
-- "cron koştu mu?" sorusunun panelde CEVABI YOKTU. Elde yalnız dolaylı kanıt
-- vardı — `etsy_shop_snapshots.snapshot_date`. O da ayrımı yapamıyor:
--
--   cron koştu, çekecek yeni veri yoktu   → yeni satır yok
--   cron HİÇ koşmadı                      → yeni satır yok
--
-- İkisi aynı görünüyor. Ayrımı ancak yazım SAATİ ele veriyordu (06:0x = cron,
-- 13:21 = insanın elle tetiklediği senkron) ve bunu görmek için kimsenin
-- koşmadığı bir forensik sorgu gerekiyordu. Bu tablo o sorguyu gereksiz kılar:
-- her koşu, SONUCUNDAN BAĞIMSIZ olarak buraya bir satır bırakır. Böylece
-- "iş yok" ile "iş çalışmıyor" nihayet ayrı iki durum olur (reponun kendi
-- dersi: "'eşleşme yok' ile 'iş yok' ayrı sonuçlardır").
--
-- Tablo BİLEREK org'suzdur: cron global koşar, org'lar üzerinde döner. Org
-- başına sonuç `detail` içinde taşınır.
--
-- Audit trigger'sız (alert_state / etsy_connection deseni): günde birkaç kez
-- yazılan yüksek-hızlı vekil durum, audit_log'u doldurmasın.

create table if not exists public.cron_run (
  id uuid primary key default gen_random_uuid(),
  -- Cron'un vercel.json'daki yolu (ör. "/api/cron/etsy-sync") — kimlik budur,
  -- rota adı değil: vercel.json değişirse burada da görünür.
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  -- Koşunun kendi değerlendirmesi. Hata YUTULMAZ: bir org patlarsa false.
  ok boolean,
  -- İşlenen hedef sayısı. 0 tek başına BAŞARI DEĞİLDİR — "bağlı org yok" da
  -- 0 döner ve bu sessiz bir kusurdur; rota bunu ok=false olarak işaretler.
  target_count integer,
  detail jsonb
);

create index if not exists cron_run_job_started_idx
  on public.cron_run (job, started_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────
-- Sistem sağlığı verisi, org'a ait değil: giriş yapmış herkes OKUR.
-- Yazan yalnız service-role'dur (cron rotaları admin istemciyle çağırır ve
-- RLS'i atlar), bu yüzden authenticated için insert/update politikası YOK.
alter table public.cron_run enable row level security;
drop policy if exists "cron_run_read" on public.cron_run;
create policy "cron_run_read" on public.cron_run
  for select to authenticated
  using (true);

-- ── Kurulum mührü ────────────────────────────────────────────────────
-- Uyarı merkezi "hiç nabız yok" durumunu alarma çevirir. Ama bu tablo daha
-- YENİ kurulduysa nabzın yokluğu doğaldır (ilk cron henüz koşmamıştır) ve o
-- an alarm vermek YANLIŞ ALARM olur — yanlış alarm gerçek alarmdan pahalıdır.
-- Bu satır kurulum anını damgalar; uyarı, nabzı bu damgaya göre değerlendirir.
insert into public.cron_run (job, started_at, finished_at, ok, target_count, detail)
select '_install', now(), now(), true, 0,
       jsonb_build_object('note', '0149 cron nabzi kuruldu')
where not exists (select 1 from public.cron_run where job = '_install');
