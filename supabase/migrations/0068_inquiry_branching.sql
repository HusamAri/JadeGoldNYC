-- 0068 — Soru çatallanması + anlık mod.
-- (1) Anlık mod: çözülme artık üye sayısını BEKLEMEZ — ilk yanıt soruyu
--     'review'a çeker (uygulama katmanında); yanıtlar anlık eklenir/güncellenir.
-- (2) Çatallanma: incelemedeki yanıtlar farklı bir senaryoya işaret ediyorsa
--     soru, sonuç yorumları not edilerek o senaryoya çatallanır; senaryo
--     panoda "ekip girdisiyle tetiklendi" olarak görünür.

alter table public.metric_inquiries
  add column if not exists branched_to_scenario text,
  add column if not exists branch_note text;
