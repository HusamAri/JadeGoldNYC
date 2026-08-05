-- 0122 — Sosyal içerik medya linkleri.
-- Kullanıcı içerik kaydına görsel/video LİNKLERİ yapıştırır (Drive, doğrudan
-- dosya URL'i vb.); panel bu linklerden inline önizleme render eder.
-- Dosya panele YÜKLENMEZ — kaynak dış link, panel yalnız gösterir.

alter table public.social_posts
  add column if not exists media_urls text[] not null default '{}';

comment on column public.social_posts.media_urls is
  'Görsel/video linkleri (sıralı). Doğrudan dosya URL''i, Google Drive linki '
  'veya platform linki; panel türüne göre inline önizler ya da link çipi basar.';
