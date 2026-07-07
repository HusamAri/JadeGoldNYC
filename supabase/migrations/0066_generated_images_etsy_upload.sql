-- 0066 — Üretilen görsellerin Etsy'ye yüklenme durumu. Panelde seçilen görsel
-- Etsy listing'ine ürün fotoğrafı olarak yüklendiğinde işaretlenir; tekrar
-- yükleme ve "hangisi mağazada" görünürlüğü için.

alter table public.generated_images
  add column if not exists etsy_uploaded_at timestamptz,
  add column if not exists etsy_image_id bigint;
