# EON Sayfa İyileştirme ve İspanyolca Katman, Yol Haritası

Tarih: 2026-08-13. Planlama: Fable. Uygulama: Opus (Amuletta üzerinden, insan onaylı Etsy push).
Girdiler: `2026-08-13-eon-etsy-denetim.md`, `2026-08-13-eon-alura-upgrade-plani.md`,
`2026-08-12-eon-strateji-devir-code.md` (APPENDIX A dahil). Bu dosya uygulama fazının
tek referansıdır; çelişki çıkarsa canlı veri kazanır.

## 0. Denetim raporuna dört veri notu (uygulamadan önce karara bağlanmalı)

Denetim büyük oranda doğru ve uygulanabilir. Dört noktada canlı veri ya da devir
dosyasıyla çelişiyor.

**0.1 "Fiyat motoru yüzde 8.5 bayat" iddiası yanlış görünüyor.** Denetim, canlı fiyatları
16 Temmuz tarihli 4.033 dolar motor tabanına kıyaslıyor. Oysa canlı çapalar (640 / 660 /
1220 dolar liste fiyatları) yalnız yaklaşık 4410 dolar taban ile çözülüyor; devir dosyası
bunu üç bağımsız yoldan doğrulamıştı. Bugünkü spot 4.375,77. Yani canlı fiyatlar güncel
spotun altında değil, hafif üstünde. Acil reprice yok. Bu, devir dosyasındaki 5. geri
dönüşün (yanlış bayat fiyat alarmı) tekrarıdır. Aksiyon: motor tabanı 4410 kabul edilir,
spot yüzde ±5 hareket kapısı kurulur, reprice yalnız kapı tetiklenince gündeme gelir.

**0.2 Sipariş #2 için "yanlış ürün sevki" hipotezi zayıf.** Denetim, SKU (14K White) ile
listing (10K Hammered) çelişkisinden yanlış sevk ihtimali çıkarıyor. APPENDIX A bunun bir
yeniden adlandırma artığı olduğunu gösterdi: sipariş anında Etsy SKU'su henüz eski
önekteydi; satırın product_id ve etsy_listing_id alanları doğru hammered listing'i
gösteriyor. Alıcı hammered sayfasından aldı. Yanlış sevk kanıtı yok; iade nedeni alıcıya
sorulur, varsayılmaz.

**0.3 Sale çelişkisi (26 Ağustos).** Devir dosyası: yüzde 25 sale çapa mimarisidir,
26 Ağustos yenilemesi zorunlu, düşerse görünür fiyatlar yüzde 33 zıplar ve reklam testi
kirlenir. Denetim: 28 Ağustos'ta uzatma, tam fiyata geç. İkisi aynı anda uygulanamaz.
Uzlaştırma önerisi: 26 Ağustos'ta BİR KEZ daha yenile (test 1 Eylül'e temiz gelsin, fiyat
şoku olmasın); 1 Eylül gözden geçirmesinde denetimin 2. önerisine geçilir: taban fiyatlar
motor fiyatına çekilir ve sürekli indirim kaldırılır. Görünür fiyat değişmez, mimari
dürüstleşir, About vaadiyle çelişki biter, 24 Kasım Cyber penceresi gerçek indirim olur.
Bu bir toplu fiyat yazımıdır: insan onaylı, canary'li, read-back doğrulamalı.

**0.4 Reklam atıf çelişkisi.** Devir dosyası (Etsy CSV, 12 Tem - 11 Ağu): 2 atfedilen
sipariş, 800 dolar gelir, ROAS 3.49x. Denetim: tüm zamanlar 0 atfedilen sipariş. İkisi
aynı panodan gelemez; olası açıklama iade edilen siparişlerin atıftan düşmesi. 1 Eylül
reklam verdikti bu sayıya bağlı: karar günü taze Ads CSV çekilmeden verdikt verilmez.

## 1. Alura Strategy Advisor kararı (13 Ağustos ekranı)

Önerilen kural: "spend > 10 dolar ve ROAS < 4.9x, veya spend > 10 dolar ve 0 sipariş →
durdur". **"Use this strategy" ŞİMDİ BASILMAZ.** Üç gerekçe:

1. Kuralın kendi WHY listesi "1 Eylül'e kadar değişiklik minimal" diyor; kuralı bugün
   aktive etmek kendi şartıyla çelişir. Bekleyen kural da bir otomasyondur ve kırmızı
   çizgi gereği son onay insanda kalır.
2. Matematik hatalı: yüzde 25 marjda başabaş ROAS 4x'tir, 6.5x değil. Kuralın kendi alt
   maddesi de bunu itiraf ediyor ("Breakeven ROAS is 4x, but...").
3. 10 dolarlık yargılama penceresi 1,05 dolar tık maliyetinde 9-10 tık demek. Yüzde 1,2
   dönüşümde 10 tıkta beklenen sipariş 0,11; 15 tık koruması geçildiğinde bile İYİ bir
   listing yüzde 83-89 ihtimalle 0 siparişte görünür ve kural onu durdurur. Bu eşikler
   30 dolarlık ürün için kalibredir, 250-680 dolar bandı için değil.

1 Eylül'de taze CSV ile karar: ya reklam tamamen kapanır (4x kuralı tutmuyorsa) ya da
kanıtlı 8'e daraltılmış yeniden test. Yeniden testte stop-loss seçimi bilinçli yapılır:
25 dolar (denetim önerisi, sabır kararı) veya 110 dolar (devir ekonomisi, 450 dolar
bandın gerçek toleransı). 25 dolar istatistik değildir, bunu bilerek seçilmeli.

## 2. Fazlar

**Faz 0, veri onarımı (Opus, yalnız DB, hemen):** çift COGS kuralı (siparişte fatura
kaydı varsa gold_auto satırı pasif/işaretli), 21 bağlantısız maliyet satırının eşlenmesi,
fatura görsellerinin receipt_url alanına bağlanması, #1 siparişin faturası gelince model
satırının değişimi. Kabul ölçütü: sipariş bazlı net tablo denetim Bölüm 2 ile birebir;
toplam COGS 2.294,80 dolar. Etsy'ye hiçbir yazma yok.

**Faz 1, kanama durdurma (kullanıcı, Etsy UI, 48 saat):** 4 iade sahibine değişim /
yeniden yapım teklifi, #10 kısmi iadesi (yorum riski), reklamın elle kanıtlı 8'e
daraltılması, buyer offer tavanı kararı. Panel karışmaz, plan yalnız takvimler.

**Faz 2, portföy kararı (kullanıcı onayı):** 40 → 16-18 konsolidasyon. KURAL: İspanyolca
üretim bu onaydan önce başlamaz; emekli olacak yaklaşık 20 listing'i çevirmek işin
yarısını çöpe atar.

**Faz 3, İngilizce revizyon (Opus + Alura):** hayatta kalanlarda başlık/tag revizyonu
(denetim Bölüm 6 kalıpları: Personalized / Engraved / Heirloom / mens boşlukları), Alura
ile doğrulanmış aile × 13 tag matrisi. KURAL: listing başına TEK düzenleme geçişi;
İngilizce revizyon ile İspanyolca çeviri aynı geçişte gider, 7-14 günlük oturma maliyeti
bir kez ödenir.

**Faz 4, İspanyolca katman:**

- **4a. Keyword araştırması.** Hedef kitle ABD Latino; dil Latin Amerika İspanyolcası
  (İspanya kullanımları değil: Meksika kökenli çoğunluk "argollas de matrimonio" der,
  İspanya "alianzas" der; ABD pazarında ilki geçerli). Kaynak: Etsy İspanyolca
  autocomplete + Alura kotası (500 arama/gün). Tohum adaylar (ölçülmeden yayınlanmaz):
  argollas de matrimonio, argollas de boda, anillo de bodas oro, oro macizo 10k,
  grabado personalizado, grabado gratis, para él, para ella, regalo de aniversario.
  Çıktı: aile × 13 İspanyolca tag matrisi + başlık kalıbı.
- **4b. Çeviri üretimi.** Kelime kelime değil cümle anlamı bazlı; verified facts (devir
  Bölüm 5) dışına tek iddia yok; biçim sınırları: başlık ≤140 karakter, 13 tag, tag ≤20
  karakter; EON ses tonu (ölçülü, hype yok, emoji yok).
- **4c. Depolama.** Yeni `product_translations` tablosu (org_id, product_id, lang,
  title, description, tags, status, pushed_at, source). Üretilen metin DB + repoda
  yaşar; ayna ezerse kaynak kaybolmaz (second brain kuralı).
- **4d. Push.** Etsy v3 listing translation uçları (createListingTranslation /
  updateListingTranslation; dil başına title + description + tags taşıdığı varsayımı
  CANLI doğrulanmadan koda güvenilmez, eğitim verisi bayat olabilir). Önkoşul: shop dil
  ayarında İspanyolca ekli mi kontrolü. İlk push TEK listing canary, Etsy UI'da gözle
  teyit, aynı turda read-back, sonra batch. Not: Etsy bugün zaten makine çevirisi
  gösteriyor; bu işin değeri kaliteyi ve İspanyolca keyword kontrolünü ele almak.

**Faz 5, 18K yayınları (Eylül):** 13 draft doğuştan çift dilli çıkar (create +
translation aynı işlemde). Denetimin Q4 takvimi aynen geçerli.

## 3. Hata kontrol loopları (dynamic workflow, uygulama fazında)

Listing başına pipeline: üretici ajan → adversarial doğrulayıcı (fact ihlali avı:
verified facts dışı iddia, yasak vaat, yanlış karat/renk) → biçim kapısı (karakter ve
tag sayaçları, hedef: 0 ihlal) → akıcılık ajanı (İspanyolcada çeviri kokusu avı, ana dil
ölçütü) → dedup bariyeri (iki listing aynı 13 tag setini paylaşamaz) → insan onayı →
canary push → aynı turda read-back → batch → 24 saat drift kontrolü (loop; senkron
ezmesine karşı) → haftalık mutabakat.

Sayaç kuralları: N listing girdi = N onaylı çıktı; read-back'te alan alan eşitlik;
drift bulunursa otomatik düzeltme YOK, rapor + insan kararı. Hiçbir adım Etsy'ye
gözetimsiz yazmaz; externalPricing ve insan onayı mimarisi aynen korunur.

## 4. Zaman çizelgesi (Q4 takvimiyle hizalı)

| Tarih | İş |
|---|---|
| 14-28 Ağu | Faz 0 + Faz 2 kararı + 4a keyword araştırması (çeviriden bağımsız başlar) |
| 26 Ağu | Sale yenileme (öneri: yenile; gerekçe 0.3) |
| 1 Eyl | Üçlü karar + taban fiyat mimarisi kararı + reklam verdikti (taze CSV ile) |
| 1-15 Eyl | Faz 3 + Faz 4 birleşik düzenleme dalgası; 18K yayınları çift dilli başlar |
| 1 Kas | İspanyolca katman + holiday keyword rötuşları biter |
| 10 Kas | Edit freeze; İspanyolca dahil metin düzenlemesi yok |

## 5. Kullanıcıdan gerekenler

1. Bu planın onayı (uygulama Opus ile başlar)
2. Faz 2 listesi onayı (KORU 8 + DÜZELT 5 çekirdeği İspanyolca hedef seti olsun mu)
3. Listing CSV export (tag kör noktası, denetim Bölüm 6)
4. Tamsan fatura görselleri (receipt_url için)
5. Shop dil ayarı teyidi (İspanyolca ekli mi, bugüne kadar ne çevrildi)
6. 26 Ağustos sale kararı

## 6. Kayıt durumu

Denetim + Alura planı + bu yol haritası repoda `docs/eon/strategy/` altında. Google
Drive yüklemesi BEKLİYOR: Drive bağlayıcısı bu oturumda şu an kopuk; bağlantı gelince
üç dosya `05-strategy-sessions` klasörüne (1IGq8bc_heYqZGnjCVlQ4WOY4oCeS1wZb)
yüklenecek. Dosyalar vault frontmatter taşıyor, vault'a olduğu gibi düşebilir.
