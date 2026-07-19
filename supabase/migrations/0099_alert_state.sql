-- 0099 — Uyarı durumu izleme (alert_state) + çözülen uyarı → tamamlanmış görev
-- ------------------------------------------------------------------
-- Uyarı Merkezi (getAlertCenter) her yüklendiğinde o an AÇIK olan uyarıların
-- sabit `key`leri buraya yazılır (last_seen_at tazelenir). Bir sonraki yüklemede
-- daha önce görülmüş bir key ARTIK yoksa (düzeltilip kaybolmuş) → o uyarı
-- ÇÖZÜLDÜ demektir; Görevler'e "Çözüldü: <başlık>" olarak TAMAMLANMIŞ bir görev
-- düşülür ve satır silinir (idempotens: tekrar görev üretilmez; uyarı yeniden
-- belirirse yeniden izlenir). Böylece "şu sorun şu tarihte çözüldü" izi görev
-- geçmişinde kalıcı olur.
--
-- Bu tablo TÜRETİLMİŞ/vekil durumdur (uyarı akışının anlık görüntüsü) ve her
-- panel yüklemesinde upsert'lenir; bilerek AUDIT TRIGGER'SIZ bırakılır —
-- yoksa audit_log yüksek-hızlı vekil yazımlarıyla dolar (etsy_connection
-- deseni). Asıl iz zaten üretilen görevin insert'inde (tasks audit trigger'lı)
-- ve görev geçmişinde kalır.

create table if not exists public.alert_state (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  alert_key text not null,
  title text,
  severity text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  -- Org başına bir key tek satır; yeniden görülme upsert olur (last_seen_at tazelenir).
  unique (org_id, alert_key)
);

create index if not exists alert_state_org_idx on public.alert_state (org_id);

-- ── RLS ──────────────────────────────────────────────────────────────
-- Türetilmiş, düşük riskli durum: org üyeleri okur/yazar/siler
-- (competitor_watch deseni; current_org_id() ile org kilidi).
alter table public.alert_state enable row level security;
create policy "alert_state_all" on public.alert_state
  for all to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
