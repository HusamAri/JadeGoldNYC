# 03 SEO: başlık, tag, attribute, kategori, açıklama
Kaynak: `source/03-*.txt` (M3), `source/04-*.txt` (M4), okuma 2026-10-22. [S#] modülün kendi kaynak numarası.

## Kurallar
- Başlık: ürün adı (noun) BİR kez; önce 3 nesnel tanımlayıcı (renk/metal, ayar, ölçü) + 1 ayırt edici; **<15 kelime** [M3 S13 2026-04-27].
- Başlıkta YOK: kelime/öbek tekrarı, öznel sıfat (perfect, beautiful), fiyat/kargo/indirim/"free", keyword yığını, gerekmedikçe alıcı/hediye/occasion öbeği ("for Him and Her", "gift for him") [M3 S13].
- Kelimenin başlıktaki yeri sıralamayı etkilemez; öne almak mobil tıklama içindir [M3 S11 2025-08-26]. 140 kr sert sınır, en çok 3 BÜYÜK harf kelime, `$ ^ \`` yasak: UNVERIFIED [M3 S20].
- Kardeş listing'lere aynı ya da neredeyse aynı başlık verilmez (kannibalizasyon) [M3 S18].
- Başlıktan çıkan anahtar kelime silinmez, tag/attribute/açıklamaya taşınır [M3 S19].
- Başlık değişikliği: önce CSV/önce-hâli kaydı, çok satanlara dokunma, küçük parti, tek değişken, 1-3 ay izle; eski uzun başlık cezalandırılmaz, yeniden yazmak isteğe bağlı [M3 S18, S19 2025-08-27].
- Tag: 13'ü de dolu, ≤20 kr, çok kelimeli; tekrar, çoğul, yanlış yazım, başka dil, kategori/attribute değerinin AYNISI yok (uzun öbek içinde kelimesi olabilir); ne olduğu / nasıl yapıldığı / kimin için karışık; 30-60 günde 0 gösterim alan tag değişir [M3 S11, S12, §4].
- Kategori: en özel alt kategori [M3 S11]. Attribute: ilgili HER alan dolu, boş attribute filtreli aramadan düşürür [M3 S11; S21 3. taraf 2026-07-09].
- Etsy LLM'i attribute'u başlık/açıklama/fotoğraftan çıkarır: metal, ayar, genişlik, beden aralığı düz yazıyla geçsin [M3 S5 2025-10-13].
- Açıklama: anahtar kelime ilk cümlelerde doğal dille; başlık kopyası ya da kelime listesi yok [M3 S12]. İlk ~160 kr önizleme (3. taraf): ürün, ayar, kişiselleştirme, made to order [M4 S18].
- Alt text ≤250 kr, fotoğrafta GÖRÜNENİ anlatır; mağaza adı/başlık/tag/SKU SEO katkısı yok [M3 S14].
- Sıralama girdileri: iade politikası (No returns dahil), mağaza ikonu, ABD kargo ücretsiz ya da <$6, 3 aylık puan/yanıt oranı/case oranı, dönüşüm. Girdi DEĞİL: yenileme, Ads, Star Seller, Etsy Plus [M3 S1 2025-08-26].
- Marketplace Insights haftada 15 arama [M3 S17 2025-09-15]; mağaza başlığı ≤55 kr [M3 S25].

## Panelde açık çelişkiler (2026-10-22)
- EON matrisi 185 başlık (2026-10-21 yazıldı): medyan 23 kelime / 132 kr, 158 "Mens…", 159 "for Him and Her", 105 "Free Engraving", 166 kelime tekrarı, 25 satır başka listing'le aynı başlık. Panelin `lib/etsy/listing-audit.ts:280` `title_long` (>15 kelime) bunların 178'ini işaretliyor. Tag'ler uyumlu. Geri alma kaydı: `audit_log` `etsy.seo_push` `diff.before`. Karar sahibinde.
- by Artifact Studio matrisi 210 başlık (2026-10-22 yazıldı, `docs/artifact-studio/seo/2026-10-21-etsy-keyword/`): medyan 17 kelime, 168'i >15.
- Aynı rehber repoda 2026-08'den beri yazılıydı (`docs/eon/seo/etsy-title-guidance-2026-08.md`: <15 kelime, tekrar yok, alıcı/promosyon dili tag'e); iki matris de okumadan üretildi.
- `docs/eon/seo/2026-10-21-etsy-keyword/RUNBOOK.md` "140 kr, Mens…for Him and Her" ve "Etsy video'yu üstte sıralar" diyor; modül ikisini de desteklemiyor.
- `lib/etsy/create-listing.ts:976` her görsele alt text = başlık; `app/api/ops/gallery-push/route.ts:389` alt text 500 kr'a kadar + makine işareti. Kural: ≤250, görseli anlatan.
- `lib/seo/keyword-engine.ts` <15 kelime geçer, audit >15 işaretler: tam 15'te ayrışıyor.
