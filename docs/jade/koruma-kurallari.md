# Koruma kuralları — "satanı bozma" sözleşmesi

Jade Gold canlı bir mağaza: 121 listing, 9.170 satış, $2.49M ömür-boyu ciro.
Bu iş kolunun birinci kuralı üretmek değil **bozmamak**. Aşağıdakiler öneri
değil, kapıdır: sağlanmayan bir değişiklik `approved` olamaz.

## 1. Dokunulmazlar

**Hero listingler** (ömür-boyu ciro top-10 veya son 90 günde aktif satan):

- Başlığın **ilk 40 karakteri** değişmez. Etsy'nin arama eşleşmesi burada
  yoğunlaşır; satan bir başlığın önünü değiştirmek sıralamayı sıfırlar.
- Tag setinin **kökü** (satışa bağlı, mağaza-içi tekil olan tag'ler) değişmez;
  yalnız boş slot doldurulur veya kanıtlanmış ölü tag değiştirilir.
- Fiyat bu iş kolunda değişmez — fiyat ayrı bir karar yüzeyidir (reprice motoru).

Bu listinglerde yapılabilecek olan: **ekleme niteliğinde** iyileştirme —
ölçek karesi, ölçü/beden netliği, açıklama okunabilirliği, eksik foto.

## 2. Başlık asla otomatik gönderilmez

Panelde canlı listing'e başlık yazan bir yol **yok** ve bilinçli olarak
eklenmedi (karar: 2026-08-13). Başlık değişikliği gerekiyorsa panel öneriyi
üretir, insan **Etsy Copy Card**'dan elle yapıştırır. `listing_redesigns`
tablosunda bu yüzden `pushed_title` kolonu yoktur.

## 3. Dalga kuralı

```
canary (1 listing) → 48 saat gözlem → bölümün kalanı
```

- Canary bölümün **en az riskli** listing'idir (düşük ciro, düşük trafik) —
  asla hero.
- 48 saat içinde görüntülenme/favori çöküşü varsa dalga durur, geri alınır.
- Bir dalga bir bölümdür. İki bölüm aynı anda çalışılmaz: bir şey bozulursa
  hangi değişikliğin bozduğu ayırt edilemez.

## 4. Ölçüm zorunlu

Push anında `baseline_views` / `baseline_favs` yakalanmadan hiçbir satır
`pushed` işaretlenmez. 14. ve 30. günde karşılaştırılır. Ölçülmeyen değişiklik
yapılmamış sayılır — iyileşme mi bozulma mı olduğu bilinemez.

## 5. Tek yazar ilkesi

Canlı 13 tag'i iki modül birden yazabilir: `seo_tag_optimizations` (0083) ve
`listing_redesigns` (0139). Kural: bir listing için redesign satırı `pushed`
olduğunda o listing'in SEO-tag satırı **yeni öneri üretmez** (tarihçe kalır).
İki modül aynı alanı sırayla ezerse hangi setin canlı olduğu belirsizleşir.

## 6. Açıklama gönderirken ağırlık bloğu korunur

`products.description` içindeki beden→gram bloğu (`lib/etsy/weights.ts`)
Etsy'de yaşar ve HTML yorum marker'ları Etsy tarafından silinir. Açıklama
gönderen her yol **önce canlı gövdeyi taze okumalı**, `injectWeightBlock`
ile blok tek kopya kalacak şekilde birleştirmeli. Aksi halde blok ya kaybolur
ya çoğalır (2026-08'de 158 listingde yaşandı).

## 7. Geri alma yolu

Her staging satırı `old_title` / `old_description` / `old_tags` /
`old_materials` taşır — bunlar öneri üretildiği andaki **canlı** değerlerdir.
Birincil geri alma budur. Yedek: `audit_log` diff'leri
(`restoreVariantPricesFromAudit` çalışan bir referans uygulamadır).

## 8. Silme yok, pasifleştirme var

Kill kararı verilen listing **silinmez**: arşiv deseni kullanılır
(`products.archived_at` / `etsy_deleted_at`). Silme geri dönüşsüzdür ve
geçmiş satış izini kırar. Ayrıca Etsy'den silmeden önce medya
`listing_media`'ya arşivlenmiş olmalıdır.

## 9. Kapsam disiplini

Bölüm çalışması yalnız **aktif, arşivlenmemiş, Etsy'de var olan** listingleri
kapsar. Taslak/expired listingler ayrı karar ister; sessizce dahil edilmez.
