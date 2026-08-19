# Second Brain — kendi iyi uygulamalarımızdan çıkan dersler

Bu dosya CLAUDE.md üzerinden her oturumda yüklenir. **Protokol:** her uçtan uca
işin sonunda, o işte işe yaramış iyi uygulamayı/dersi buraya TEK satır-blok
olarak ekle (tarih + ders + neden). Tekrarı olan dersi güçlendir, çürüyeni sil.

Protokolün repo-bağımsız (global) sürümü: `second-brain-lesson` skill'i
(`.claude/skills/second-brain-lesson/SKILL.md`) — ne zaman yazılır, nereye
yazılır, biçim, bakım ve anti-örnekler orada tanımlı. Bu dosya o skill'in bu
repodaki hedefidir.

## Süreç dersleri

- **Aynı gram çok varyanta yayılmışsa fiyatlamadan önce HANGİ örneğin ölçüldüğünü
  bul; orta değerse "breakeven'e çektim, zarar bitti" YANLIŞTIR (2026-08):**
  Love bölümünde `1739245557` (Heart Nugget Ring, 194 satış) 40 varyantının
  40'ı zarardaydı ve yalnız 4 farklı gram taşıyordu — 10 beden (5–9.5) aynı
  gramı ve aynı fiyatı paylaşıyordu. İlk refleks `1520386344` deseni sanıp
  tamamen dışlamaktı; ikinci refleks düz breakeven uygulamaktı. İkisi de yanlış
  olurdu. `weight_source`'a varyant varyant bakınca kritik ayrıntı çıktı: 40
  varyanttan **tam biri** ölçülmüştü (`RHN2-7`, shipstation) ve o **beden 7**,
  yani aralığın ORTASI. Demek ki ilan edilen gram ortalamayı temsil ediyor;
  7.5–9.5 gerçekte daha ağır ve düz breakeven onları zararda BIRAKIRDI —
  üstelik ekran "breakeven altı = 0" diye yeşil gösterirdi, çünkü sorgu da aynı
  eksik gramı kullanıyor. Ölçüm kendi hatasını doğrulayamaz. Çözüm: yüzük
  ağırlığı iç çevreyle ~lineer arttığı için beden 7 → 9.5 = 19,41/17,35 ≈ +%12
  emniyet payı (gram × 1,12) ile breakeven; doğrulama sorgusu da emniyetli
  varsayımla koşuldu (o varsayımla da 0). Kural: (1) bir listing'de gram sayısı
  varyant sayısından azsa hangi eksenin modellenmediğini bul (beden? boy?);
  (2) `weight_source`'a TOPLU değil VARYANT bazında bak — "description,shipstation"
  karışık görünen listingde ölçülmüş olan tek satır hangi noktayı temsil ediyor,
  cevap buradadır; (3) taban eksikse emniyet payı ekle ve payı gerekçesiyle yaz;
  (4) doğrulama sorgusunu iyimser DEĞİL kötümser varsayımla koş; (5) tahminle
  konulan fiyatı "geçici" diye işaretle ve gerçek ölçüm iste — yoksa geçici
  fiyat kalıcı olur.
  **Güçlendirme (2026-08-17, rings turu) — desen tek seferlik değil, ölçüm
  yönü de değişken:** aynı tuzak rings'te 3 listing'de daha çıktı ama ölçümler
  ÜÇ FARKLI hikâye anlattı ve üçü farklı kural gerektirdi: (a) `1219136707`
  (386 satış!) love ile aynı — ölçüm orta bedende, ilan=ortalama → emniyetli
  breakeven ×1,16; (b) `1743975353`'te ölçüm ilan edilenin %23 ÜSTÜNDE
  (`RCZOV-10` 4,38g vs ilan 3,56g) — burada emniyet payı bile yetmez, ölçülen
  değerden beden-ölçekli TABAN kondu ($676 > hedef %20'nin $641'i); (c)
  `1743489483`'te ölçümler bedenle monoton ARTMIYOR (2,76 @ 10,5 < 3,38 @ 7)
  — ağırlık taş/kafa baskın, beden payı GEREKSİZ. Kural: paylaşılan-gram
  listinginde ölçülmüş noktaları bulmak yetmez; ölçümlerin ilan edilenle
  İLİŞKİSİNİ oku (altında mı, üstünde mi, bedenle korelasyonu var mı) ve
  kuralı ona göre seç — tek şablon üç vakada da yanlış olurdu. Yan doğrulama:
  aynı formülü SQL + TS + Python'da bağımsız uygulayıp üçünün aynı satır
  kümesini üretmesi (215/215) transkripsiyon hatasını da sıfırlar.

- **Parça-içi tutarlılık isteyen talimat SADECE parça-içi tutarlılık üretir;
  küme-geneli değişmezler workflow BİTTİKTEN sonra tüm sette KODLA ölçülür
  (2026-08):** 13 listing'lik İspanyolca metin üretimi 4 aileye bölünüp her
  aileye "aynı ailedeki listing'ler birbirinden ayrışsın" dendi. Adversarial
  denetçi katmanı gerçekten güçlü çalıştı — canlı kaynaktan kaybolan 86 satırlık
  gram tablosunu, iki beyaz dome başlığının ilk 49 karakterinin aynı olduğunu,
  beden tavsiyesi cümlesindeki anlam bozan çeviri hatasını (`Los anchos calzan`
  vs `Los anillos más anchos calzan`) ve elmas iması taşıyan terminolojiyi
  yakaladı. Ama HİÇBİRİ tek bir şeyi görmedi: 13 metnin 10'u `tú`, 2'si `usted`
  yazılmıştı. Her metin KENDİ İÇİNDE tutarlıydı, her aile kendi içinde
  tutarlıydı, biçim kapısı (uzunluk/emoji/entity/tekrar) tertemiz geçti — çünkü
  hitap ne bir aile içi ne de biçimsel bir özellik; MAĞAZA GENELİ bir marka
  niteliği ve hiçbir ajanın görüş alanında değildi. Bulan tek şey, workflow
  sonrası tüm sette koştuğum 10 satırlık regex sayacı oldu. Kural: (1) çok
  ajanlı üretimde "her ajan kendi partisinde tutarlı olsun" demek yetmez —
  kümenin TAMAMINA uygulanan değişmezleri (hitap, kuyruk bloğu metni,
  terminoloji, ölçü birimi biçimi) ayrı bir kod geçişinde say; (2) bu sayaç
  ajanın raporuna değil ham metne bakmalı — ajanlar kendi çıktılarını "ayrıştı"
  diye onaylamıştı ve bu iddia iki listing için YANLIŞTI; (3) "0 biçim ihlali"
  teslim değildir, yalnız aklına gelen ihlallerin yokluğudur. Yan ders: büyük
  metni MCP SQL'iyle elle taşırken satır başına `length()` checksum'ı koş —
  14 açıklamada 14/14 birebir tuttu, tek karakterlik sapma anında görünürdü.
  **Güçlendirme (2026-08-15) — kök neden ölçüm eksikliği DEĞİL, BELGE eksikliği:**
  aynı 13 metinde ikinci tur ölçüm koşuldu ve drift beklenenden genişti: marka
  kuyruğunun **beş bölümü de** dörde ayrışmıştı, ölçü birimi ikiye (`2 mm` /
  `2mm`), karat büyük/küçük harfi ikiye, üstelik `banda` anglisizmi kalmıştı
  (İspanyolcada `banda ancha` = "geniş bant internet"). Sebep: repoda
  **İngilizce** ses tonu belgeliydi ama **İspanyolca karşılığı hiç yazılmamıştı**
  — yani her ajan her turda sesi yeniden icat ediyordu. Sayaç koşmak sapmayı
  GÖRÜR ama ÜRETMESİNİ engellemez. Kural: çok ajanlı üretimden ÖNCE o dilin/
  yüzeyin ses tonu belgesi yazılır (kanonik bloklar kelimesi kelimesine, biçim
  değişmezleri, yasak liste, doğrulama sayaçları); belge yoksa ilk iş odur.
  Kanonik metin tahminle ya da "çoğunluk kazansın" ile seçilmez — VAR OLAN
  KAYNAKTAN türetilir (burada canlı İngilizce marka kuyruğu, 919 kr, bölüm
  bölüm eşlendi; "çoğunluk" 1025'lik varyantı seçtirirdi ve yanlış olurdu).
  **Güçlendirme-2 — sayacın girdisi ÜRÜNÜN KENDİSİ olmalı, dökümü değil:**
  yasak-token taraması önce `docs/.../es/*.md` dosyalarında koşuldu,
  `alianza` 6 / `diamant` 9 / `hipoalerg` 1 verdi — hepsi SAHTE, çünkü o
  dosyalar denetçi notlarını da taşıyor ve denetçi notu birebir "yasak-token
  taraması temiz (diamant/alianza/✓/•/hipoalerg/reciclad yok)" cümlesini
  içeriyordu. Sayaç DB'nin `description` alanına taşınınca hepsi 0 çıktı.
  Yorum/rapor/denetçi notu taşıyan hiçbir yüzey ölçüm yüzeyi değildir.
  **Güçlendirme-3 — belgeyi korpusa uydur, korpusu belgeye değil:** ilk taslak
  "gövdede `gratis` kullanma" diye kural yazmıştı; ölçüm 5 gövdenin `gratis`,
  12'sinin `sin costo` kullandığını ve `grabado gratis`'in keyword matrisinde
  tag adayı olduğunu gösterdi → kural revize edildi. Yazdığın her kuralı yazar
  yazmaz korpusta SAY; uymuyorsa ya kural yanlıştır ya da borç yarattın, ikisini
  de bilerek seç. Ayrıca iki dil BİLEREK ayrışabilir: ölçü birimi İngilizcede
  bitişik (374 bitişik / 17 boşluklu ölçüldü), İspanyolcada boşluklu (RAE) —
  bunu belgeye YAZ, yoksa biri "tutarsızlık" sanıp eşitler. Son ders: sayaç
  yeşilken gözle okunan TEK metin iki gerçek kusuru daha yakaladı (`gratis`
  çelişkisi + kalan `banda`); repo⇄DB eşitliği için `length()` değil **MD5**
  kullan — büyük/küçük harf değişimi uzunluğu değiştirmez.

- **Teslimat FORMATI kullanıcının aracına göre seçilir; "açar" ≠ "istenen" ve
  format kısıtı ilan edilmeden ARAÇLA sınanır (2026-08):** Kullanıcı "numbers
  dosyası" istedi, ben XLSX ürettim; gerekçeyi (".numbers kapalı format,
  üretilemiyor") yalnız PR gövdesine yazdım, KULLANICIYA söylemedim — üç tur
  sonra "i asked a numbers file not excel" diye geri geldi. İki ayrı kusur:
  (1) kısıtı varsayımla ilan ettim, denemedim; (2) denemiş olsam bile
  söylemediğim gerekçe yok hükmünde. Sonradan gerçekten denendi ve kısıt
  DOĞRULANDI ama artık kanıtla: `numbers-parser` 4.19 .numbers YAZAR (çok sekme,
  stil, marka rengi, hücre biçimi) ama formül yazamaz — `=A2*106` düz TextCell
  olarak iniyor (`is_formula: False`), kütüphanenin kendi README'si "Formulas
  cannot be written to a document" diyor. **Elenen adaylar (aynı yol iki kez
  denenmesin):** Aspose.Cells pazarlama sayfası ".numbers kaydet" diyor ama
  kendi dokümanı "can read Numbers spreadsheets, but it does not support
  writing to them" — pazarlama sayfasına güvenme, docs'a bak. GitHub'daki üç
  Numbers aracı (Digits, apple-numbers-mcp, apple-numbers-automation) formülü
  gerçekten yazar ÇÜNKÜ hepsi AppleScript/JXA ile Numbers.app'i sürüyor → macOS
  şart, bu Linux konteynerde çalışmaz. Sonuç: **formüllü .numbers yalnız
  Numbers.app üretebilir.** Pratik yol XLSX üret → kullanıcı Mac'te açıp
  "Farklı Kaydet" ile .numbers'a çevirir (formüller native'e dönüşür), bu yüzden
  formüller Numbers'ın da bildiği ortak fonksiyonlarla (`IF`/`OR`/`ROUNDUP`)
  sınırlı tutulur — Excel'e özgü fonksiyon kullanılmaz. Kalıcı çözüm:
  kullanıcının Mac'ine Numbers MCP sunucusu kurulur, o zaman formül doğrudan
  yazılır. Kural: kullanıcı bir araç/format söylediyse o araç ANA hedeftir;
  üretemiyorsan kısıtı KANITLA ve AYNI TURDA kullanıcıya söyle, sessizce
  muadiline geçme.

- **Dış araçtan gelen tam-repo kopyasını "Only in" listesiyle DEĞİL git-geçmişi
  triyajıyla ayıkla (2026-08):** AI Studio'da geliştirilen zip eski main'den
  çatallanmıştı; düz `diff -rq` "Only in zip" listesi yeni işi eski-taban
  artıklarıyla (silinen alert-board-3d, taşınan 0108 migration) karıştırıyordu.
  Yöntem: şüpheli her dosya için `git log --all -- <dosya>` — geçmişte İZİ OLAN
  dosya eski-taban kalıntısıdır, alınmaz; izi olmayan gerçekten yeni iştir.
  Ayrıca dış üreticinin kendi build logunu oku (build_final.log kırıktı → "çalışan
  kod taşıyorum" varsayma) ve auth'suz gelen API rotasına üyelik kapısı ekle
  (AI Studio tek kullanıcılı düşünür, panel çok kiracılı — ücretli Gemini ucu
  anonim çağrıya açık kalıyordu). Sonuç: 18 "yeni" dosyadan 8'i alındı, PR #341.
  (2026-07):** Etsy 2025 listing-create sözleşmesi 5 yerde değişti; her düzeltme
  bir sonraki 400'ü açtı — (1) create'te `readiness_state_id` ZORUNLU, (2) hesaplı
  kargo profili `item_weight`+boyut ister → sabit/manuel profil TERCİH + paket
  ölçüsü, (3) legacy `is_personalizable/personalization_*` DEPRECATED → ayrı
  `/listings/{id}/personalization` ucu, (4) envanter PUT her offering'de
  `readiness_state_id` + `?legacy=false` + `readiness_state_on_property=[]`. Kural:
  eğitim verisi bayat olabilir — dış API'yi CANLI hata metniyle sür; her create
  alanı değişmiş olabilir; migration/tutorial dokümanını fetch'le teyit et; ilk
  canlı gönderimi TEK listing'de dene (kısmi başarı orphan taslak bırakır: create
  başarılı + envanter patlar → panelde etsy_listing_id yazılmaz → retry duplicate
  açar; kullanıcı orphan'ları elle siler).
- **Ücretsiz kargo = bedel fiyata gömülür (2026-07):** "free shipping" satıcının
  postayı üstlenmesidir → her varyant fiyatına sabit kargo payı (\$10; yüzük hafif,
  kargo ~sabit) eklenir. Ayrıca profil ABD'de ücretsiz olmalı yoksa alıcı çift öder
  (fiyattaki pay + checkout postası). Metod: `SHIPPING_ALLOWANCE_CENTS` hem üretici
  Python'da hem MASTER SQL fiyat formülünde (`*500 + 1000`) — ikisi ayrı yer, ikisini
  de güncelle (yıldız ayrı UPDATE'le girmişti, master eksik kalmıştı; yakalandı).
- **Büyük seed'i idempotent migration + tek uygulama ile bas, sadakati uzunlukla
  doğrula (2026-07):** ~120KB metin MCP execute_sql'e elle parça parça yapıştırmak
  token-israfı + hata riski. Doğru: kendi kendine yeten idempotent migration
  (`0100`: staging IF NOT EXISTS, metin on-conflict upsert, master NOT EXISTS ile
  zaten-canlı yıldızı atlar, cleanup) tek/az çağrıda uygula; SONRA her açıklamanın
  DB uzunluğunu kaynak JSON ile karşılaştır (reprodüksiyon drift'i yakalar — 38/39
  birebir, yıldız eski koşudandı → kanonik sürümle eşitlendi).


- **Dış sisteme yazdığını AYNI turda geri okuyarak doğrula; tek yönlü ayna sessizce
  geri alır (2026-08):** 30 EON listing'ine başlık+tag itildi (07-31 09:23), API
  200 döndü, "gönderildi" denip kapatıldı. Ertesi sabahki senkrondan sonra 23
  başlık eskiye dönmüştü. Teşhis, senkronun aynı satırda taşıdığı ÇELİŞKİDEN
  çıktı: tag'ler YENİ, başlıklar ESKİ — ikisi de Etsy'den geldiğine göre itiş
  çalışmış ama başlıklar sonradan geri alınmıştı. Kanıt: 3 taslakta Etsy
  `last_modified` = tam 09:23 ve başlıklar 123-130 kr duruyor; ezilen 26'da
  `last_modified` = 20:56-22:28 ve o pencerede panelden Etsy'ye HİÇ yazma yok
  (audit_log boş) → değişiklik dış taraftan (kullanıcının Etsy editöründe geç
  saatte çalışması). Yan hasar: "dış sistem tek doğruluk kaynağı" kuralıyla
  çalışan senkron eski başlıkları panele de yazdı, panel önerilen başlıkları
  KAYBETTİ; kurtaran tek şey metinlerin `docs/eon/seo/...` dosyasında yaşıyor
  olmasıydı. Kural: (1) dış yazmadan sonra aynı turda read-back doğrulaması yap,
  "200 OK" teslim sayılmaz; (2) panel-üretimi metin mutlaka repoda bir kaynak
  dosyada yaşasın — ayna onu her an ezebilir; (3) itiş ile kullanıcının dış
  sistemdeki elle düzenlemesi çakışırsa sıra kritik: önce elle düzenleme bitsin,
  sonra push.
- **"Aynı ürün" teşhisini ilan etmeden kullanıcıya doğrulat; geri-dönüşü zor
  aksiyon önerisi kanıt ister (2026-08):** Panelde "0 varyant" görünen iki
  listing'e bakıp "çift listing → eskisini kapat" teşhisi kurdum; kullanıcı
  düzeltti: kopya, Etsy'de "copy listing" ile üretilmiş FARKLI renk (sarı vs
  rose) — kök neden SKU tekilliğiydi (`product_variants (org_id, sku)`), kopya
  kaynağın SKU'larını miras alınca sahiplik her senkronda el değiştiriyor ve
  kopya listelerden gizleniyor. Yan hasar: ping-pong sırasında sahibi görünen
  kopyaya toplu SEO push'unda YANLIŞ RENK başlığı yazıldı. Kural: (1) iki kaydın
  aynı varlık olduğu iddiası DB deseninden DEĞİL kullanıcıdan/ürün kanıtından
  doğrulanır; (2) kapatma/silme önerisi ancak bu doğrulamadan sonra verilir;
  (3) çakışmanın kalıcı çözümü kaydı silmek değil kimliği ayırmak (SKU önek
  değiştirme aracı) — dış sistemde de yaz, panel aynası kendiliğinden düzelir.
- **Paralel iş kolu kontrolü (2026-07):** Bir özellik kurmadan ÖNCE `git fetch` +
  `origin/main`'i incele — aynı özellik paralel oturumda çoktan (hatta daha iyi)
  eklenmiş olabilir. Vaka: $/gram pazar motoru iki kez yazıldı; main'deki üstündü,
  bizimki geri çekildi. Kural: motor/altyapı işine başlamadan main'de sembol taraması.
  Güçlendirme (2026-07): kural VERİ müdahaleleri için de geçerli — kullanıcı "başka
  oturumda ilerliyorum" dediği anda o iş koluna ait geri-dönüşü zor DB operasyonları
  (SKU yeniden adlandırma, silindi-işaretleme) durdurulur; yalnız kendi dalının işi yapılır.
  Güçlendirme-2 (2026-07): "X'i geri getir/kur" istenince de önce main taranır —
  "Shopify bağlantısını getir" istendi; lib/shopify + lib/shopier + migration'lar
  paralel oturumda ÇOKTAN inmişti; eksik olan yalnız uyarlama katmanıydı
  (getActivePlatform + yetenek-bazlı nav/caption). Sıfırdan kurmak çift iş olurdu.
  Güçlendirme-3 (2026-08): fetch YALNIZ main'e değil KENDİ DALINA da yapılır, ve
  turun BAŞINDA. Vaka: uzun turda yerel dal bayatladı; `origin/<dal>` 40+ commit
  ileri gitmişti ve tam yapmak üzere olduğum iki iş (bayat 140-karakter başlık
  hedefinin güncel rehberlikle değişimi `a210272`, TTG başlıklarının canlı Etsy
  metniyle eşitlenmesi `78e693b`) ÇOKTAN merge edilmişti — bir web araştırması +
  bir workflow boşa koştu. Daha kötüsü: karar da revize edilmişti (`94124b8`
  "milgrain dokunulmaz, hammered 4mm'den başlar"), yani bayat daldan okuduğum
  runbook'a dayanıp kullanıcıya YANLIŞ durum raporladım. Belirti: push
  "fetch first" ile reddedilirse dal bayat demektir — o an kod yazmayı bırak,
  `git log HEAD..origin/<dal>` ile neyin değiştiğini oku. Kural: (1) tur başında
  ve her uzun beklemeden sonra kendi dalını fetch'le; (2) "şu işi yapacağım"
  demeden önce o işin sembolünü/commit mesajını uzak dalda ara; (3) kullanıcının
  sözlü kararı ile repodaki revize karar çelişirse SEÇME — çelişkiyi göster ve
  sor (geri-dönüşü zor dış-sistem işinde bu şart).
- **Kanıtla, varsayma (2026-07):** "İzin kapalı", "veri yok" gibi durum iddialarını
  DB'den SQL ile doğrula. Vaka: Etsy yazma izni "kapalı" sanılıyordu; `etsy_write_enabled`
  sorgusu `true` döndü — bir adım boşa planlanmıştı.
  Güçlendirme (2026-08): kural KULLANICININ teşhisi için de geçerli — "başlıklar
  artık Etsy'de kabul görmüyor" denince kaynağa gidildi (canlı OpenAPI spec +
  Seller Handbook + changelog): reddeden yeni kural YOK, repodaki 104 başlıkta
  0 sert-kural ihlali. Gerçek olay farklıydı: (a) Etsy'nin Ağu-2025 TAVSİYESİ
  kısaldı (zorunluluk değil; eski başlıklar cezalandırılmıyor), (b) alıcı
  uygulaması başlığı ~70 kr'a AI ile kısaltıp GÖSTERİYOR — başlık değişmiyor.
  Şikâyeti olduğu gibi kabul edip 104 başlığı yeniden yazmak boşa iş olurdu.
  Asıl bulgu araştırma sırasında çıktı: PANELİN KENDİ denetim kuralı dış
  platformun eski rehberliğini donduruyordu (`TITLE_MIN_LENGTH=110` "bütçeyi
  doldur" derken aynı dosyadaki `title_long` >15 kelimeyi kusur sayıyordu —
  ikisi aynı anda sağlanamaz). Kural: dış platformun rehberliğini kodlayan
  eşik/metin bir TARİH taşımalı; platform kuralı değiştiğinde panel sessizce
  ters sinyal üretmeye devam eder ve kimse fark etmez.
  **Güçlendirme-2 (2026-08-17, Greek Key) — teşhis çürüse bile içindeki HAM
  VERİYİ ayıkla:** "Greek fiyatları çok düşük, acil yükselt" dendi; ölçüm dört
  yönden çürüttü ($/gram katalogdan +%1..%4,9 üstte, spot güncel, dış emsalin
  üstünde, zarar yok). Şikâyeti kabul edip körlemesine zam yapmak yanlış olurdu
  — ama teşhisi "çürüdü" deyip kapatmak DA yanlış olurdu: kullanıcıya "neye
  baktın?" diye sorunca ham veri çıktı ("işçilik min $60") ve o veri GERÇEK
  bir formül kusurunu açtı — config el-işi işçiliği $40 taşıyordu, Tamsan
  fatura kalibrasyonu $74 diyordu; fiyatlar formüle göre doğru, formülün
  GİRDİSİ gerçeğin yarısıydı. Kural: kullanıcı teşhisi ile getirdiği ham veri
  ayrı ayrı sınanır; teşhis yanlışken veri doğru olabilir ve asıl iş oradadır.
- **İki sistem aynı değeri üretmek zorundaysa formül "eşdeğer" değil BİREBİR
  olmalı — ara yuvarlama dahil (2026-08-17):** Greek fiyatlarını SQL'de
  `ceil(x/0.75/5)*5` ile bastım; motor `ceil(round(x)*4/15)*5` kullanıyor —
  matematiksel olarak "aynı" görünen iki ifade (1/0.75 = 4/3) ara
  `roundHalfUp` + troy sabiti farkı (31.1035 vs 31.1034768) yüzünden
  **115/1750 satırda** 5$ hücre kaymasına düştü. Tehlike sessizdi: motor o
  satırları sonsuza dek "taban-uyumsuz" diye atlayacaktı ve hiçbir test
  kırmızı yanmayacaktı. Yakalatan şey, basmadan önce koşulan bit-uyum
  sayacıydı (`formül(DB girdisi) == DB fiyatı` filtresi, 0 olmalı). Kural:
  (1) bir değeri sonradan TANIYACAK sistemin formülü neyse üretimde o formül
  kullanılır — kendi "eşdeğer" türevin değil; (2) basım sonrası bit-uyum
  sayacı koş (0 sapan) ve formülü bağımsız dille (TS harness, 40/40) çapraz
  doğrula; (3) yuvarlama basamağı olan her formülde ara yuvarlamaların yeri
  sözleşmenin parçasıdır, dokümante et. Yan ders: motor "DB == hedef" satırı
  basmaz — panel doğru/dış sistem eski kaldığında o uyumsuzluğu hiçbir akış
  göremiyordu; doğruluk kaynağı DB olan durumlar için ayrı bir DB→Etsy
  senkron rotası (ops price-sync: token CAS + listings zorunlu + kuru
  varsayılan + aynı-tur read-back) eklendi.
- **Gerçek render ile doğrula (2026-07):** UI değişikliği "kod doğru görünüyor" ile
  bitmez — Playwright screenshot + `getComputedStyle` ile canlı doğrula. Vaka: dark-mode
  motion "bozuk" sanılıyordu; ölçüm hepsinin `running` olduğunu gösterdi, asıl iş başkaydı.
- **Çok açılı review + kanıtlı doğrulama (2026-07):** Kendi işini gözden geçirirken
  bağımsız açılardan bulucular çalıştır (satır-satır, silinen-davranış, cross-file,
  reuse/verim/altitude/konvansiyon), bulguları kod/migration kanıtıyla doğrula, sonra
  düzelt. Vaka: 8 açı; "overcount" adayı view DDL'iyle çürütüldü, "50'de doyan sayaç"
  gerçek çıktı.
- **Checkpoint erken commit (2026-07):** Konteyner geçici — iş biriktirmeden anlamlı
  her adımda commit at. Push kilitliyse bile local commit işi korur.
- **Performans: tahmin değil bisection (2026-07):** "Sayfa ağır"da önce prod build
  + FPS ölç, sonra şüphelileri CANLI sayfada tek tek kapat/aç (`getAnimations()`
  pause/play, injected CSS) ve her adımda ölç. Vaka: sezgisel şüpheli backdrop-filter
  masumdu (kapatınca 5 FPS); gerçek katiller tam-viewport blur zemin süzülmesi +
  CPU-rasterize `url(#svg)` backdrop çıktı — 4→60 FPS. Ek ders: her aile tek başına
  ucuz olsa da eşzamanlı hasar bölgeleri süperadditif; ambient animasyonu bölgesel tut.
- **API sınırını kabul et, vekilini kur (2026-07):** Dış API bir alanı hiç
  vermiyorsa (Etsy yorum yanıtı) o alanda panel tek doğruluk kaynağı İLAN edilir ve
  akış ona göre kurulur (0059 deseni) — "senkronlarız" diye söz verme; en yakın
  sinyalle (update_timestamp) telafi kur.
- **Yeni dış uç ÇAĞRILMADAN yazılmaz; hayali yedeklilik güvenlikten kötüdür
  (2026-08):** Altın spot çekicisini "iki bağımsız kaynak + ≤%2 çapraz
  doğrulama" diye kurdum ve İKİSİNİ DE hiç çağırmadım. Kullanıcı "gösterge
  çalışmıyor mu?" diye sorunca curl attım: stooq URL'i **404** (sembol yok),
  yani o kaynak hiç çalışmamıştı; kod sessizce tek kaynağa düşüyordu ve
  tsc/lint/build üçü de temiz geçiyordu çünkü bu bir ÇALIŞMA ZAMANI
  sözleşmesi. Daha kötüsü: kod, kart metni ve runbook "çift kaynak doğrulanır"
  diye YANLIŞ bir güvenlik vaadi yayıyordu. Sondaj sonucu ücretsiz/anahtarsız
  ikinci kaynak yok (goldprice.org 403, frankfurter XAU yok, exchangerate
  anahtar ister). Kural: (1) dış uç eklerken ÖNCE `curl` at, yanıt şeklini
  gözle gör, çalışmayanı hiç yazma; (2) elenen adayları koda yorum olarak
  yaz (aynı yol iki kez denenmesin); (3) kuramadığın güvenceyi İLAN ETME —
  tek kaynak kaldıysa savunmayı gerçekten var olana kur (tazelik + mutlak
  aralık + adım kapısı); (4) dış çağrı başarısızsa SEBEBİ yüzeye çıkar,
  "alınamadı" demek kullanıcıyı da seni de kör bırakır.
- **OAuth token'ı client'ına bağlıdır; tek-seferlik ops işini panel rotası yap (2026-07):**
  Etsy access/refresh token'ları üretildikleri app'in (client) bağlamına kilitlidir —
  lokal env farklı keystring'le 401 invalid_token alır, yapısaldır, düzelmez. Çözüm:
  işi production env'de koşan GEÇİCİ korumalı rotaya taşı (çift katman: CRON_SECRET
  URL token'ı + admin oturumu; tek kullanımlık confirm; başarıda kalıcı 410 + audit;
  sha kilidi yanlış grid'i reddeder). İki tuzak canlıda yakalandı: (1) `searchParams`
  form-decode'u `+` içeren secret'ı sessizce kırar — ham query ile de karşılaştır;
  (2) read-modify-write confirm tüketimi atomik değil — çift dokunma 3 eşzamanlı POST
  koşturdu (idempotent hedefler kurtardı); tek-kullanımlık onay koşullu UPDATE
  (compare-and-swap) ile tüketilmeli, buton submit'te disable edilmeli.
  Doğrulama (2026-07-30, v4 turu): CAS + buton kilidi uygulandı → aynı akışta
  audit'e TEK reprice satırı düştü; kilit canlıda kanıtlandı.

## Ürün/UX dersleri

- **Aksiyon sinyali ana sayfada flaglenir (2026-07):** Kullanıcının aksiyon alması
  gereken hiçbir bilgi alt sayfada gömülü kalamaz — Uyarı Merkezi'ne bağla
  (3 önem derecesi + bedele göre sıralı). Vaka: "Pasife düştü" yalnız Etsy senkron
  kartındaydı; kimse görmüyordu.
- **Özet + detay ikilisi (2026-07):** Merkez/özet satırı detay yüzeyini SİLMEZ —
  listing-başına karar akışı (sapma %, düzenle linki) ayrı kartta yaşamaya devam eder.
  Konsolidasyon = bilgi kaybı değil.
- **İnsancıl, sonuç-odaklı metin (2026-07):** Her uyarı üç parça anlatır: ne oldu +
  aksiyon alınmazsa ne olur (bedel/sonuç) + ne yap. "X eksik" değil, "X eksik → şu
  parayı kaybediyorsun → şunu yap".

## Teknik desenler

- **Maliyet modeli gerçek faturayla kalibre edilir ve kalibrasyon TEDARİKÇİNİN
  org'una kilitlenir (2026-08):** Dört gerçek Tamsan faturası (9 satır, $2.040)
  panelin otomatik maliyetiyle karşılaştırıldı: model toplamda %13,5, küçük
  yüzükte %38'e kadar EKSİKTİ. Kök neden yapısal: işçilik GRAMA oranlıydı
  (~$10/g) ama üretici PARÇA başına alıyor ($54 düz / $74 süslü) — gram azalınca
  model çöküyor. Kalibrasyon medyan-uyumla yapıldı (toplam sapma −%2,2; satır
  ±%15 — fatura fiyatlaması birebir formül değil, bunu vaat etme). İki kural:
  (1) satır-satır eşleştir ve geçmişi GERÇEK değere çek (source='invoice';
  otomatik tahmin fatura kaydının üstüne yazamaz), toplamların birebir tuttuğunu
  SQL ile göster; (2) kalibrasyon O TEDARİKÇİYLE çalışan org'a bayrakla kilitlenir
  (gold_settings.labor_model) — ilk uygulamada globaldi, kullanıcı yakaladı:
  Tamsan EON'un üreticisi, Jade'in değil; farklı tedarikçili org'a başka orgun
  fatura verisiyle kalibre model uygulamak yeni bir yanlışlık üretir.
  **Güçlendirme (2026-08-18) — AYNI fatura İKİ sabit üretir; biri diğerinin
  yerine yazılamaz:** 5. fatura gelince kapsam COGS modelinden FİYAT motoruna
  genişledi ve tuzak buradaydı. COGS modeli `melt + işçilik`, fiyat motoru
  `melt×1,07 + işçilik` hesaplıyor — fire payı farklı yerde durduğu için aynı
  11 satırdan düz işçilik COGS'ta **$54**, motorda **$38** çıkıyor. İkisi aynı
  toplam maliyeti üretir ama sayı kopyalanırsa fiyat bozulur. Kural: bir
  sabiti başka dosyaya taşımadan önce O DOSYANIN formülünü oku ve türetmeyi
  onun fire/yuvarlama sözleşmesiyle yeniden yap; belgeye iki sütunu yan yana
  yaz. **Yan bulgu — "yüzdelik bağ var mı?" sorusu korelasyonla cevaplanır:**
  işçilik/melt oranı %21-88 arasında savruluyordu (yüzde olsaydı dar bantta
  toplanırdı); işçilik-gram korelasyonu düzde r=0,23 (parça başı sabit),
  süslüde r=0,97 (boyutla artıyor). Yani metal spota endeksli, işçilik değil —
  ve bu ayrım tek bir medyana bakarak görülmezdi. **İkinci yan bulgu:** ölçüm
  motorun düz kademesini $30 gösterdi ama gerçek $38'di; yani bir önceki tur
  yalnız el-işi kademesini düzeltmiş, düz kademeyi hiç sınamamıştı — bir
  parametreyi kalibre ederken AYNI ailenin diğer parametrelerini de aynı
  veriyle sına, yoksa yarısı bayat kalır.


- **Dış API kotası körlemesine harcanmaz: sağlayıcı bütçeyi her cevapta söylüyorsa
  KAYDET ve işleri rezervle KAPILA (2026-08):** Etsy günlük kotası doldu (429
  "Exceeded daily rate limit") ve üç iş aynı gün çarpıştı: altın endeksi (136
  listing, sabah), toplu SEO (56 hata) ve kullanıcının panel itişi (0 yazım).
  Üç kusur birden görünür oldu: (1) Etsy her cevapta kalan kotayı header'da
  bildiriyordu (x-limit-per-day / x-remaining-today) ama kimse OKUMUYORDU;
  (2) 429'da kör 1,2sn bekle-yeniden-dene vardı — SANİYELİK limitte doğru,
  GÜNLÜK limitte yalnız kotasız istek zinciri üretir (ikisi gövde metninden
  ayrılır: "daily"); (3) toplu akışlar ilk günlük-429'dan sonra kalan hedefleri
  denemeye devam ediyordu. Çözüm üç katman (0134): istemci her cevaptan kotayı
  DB'ye yazar (10sn sıkıştırma; kota <500 ise her cevapta) → zamanlanmış büyük
  tüketici (altın endeksi) koşmadan ÖNCE rezerv kontrolü yapar (<1500 →
  "quota-deferred", taban ilerlemediği için delta kaybolmaz; force insan aşar)
  → interaktif akış ilk günlük-429'da devre keser (nextIndex korunur, kullanıcıya
  "kota 00:00 UTC'de sıfırlanır" denir). Kural: paylaşılan-kotalı dış API'de
  her tüketici işin başında "bütçem var mı?" diye bakmalı; kota sinyali zaten
  gelen cevapların içindeyse telemetri BEDAVADIR, kurmamak tercihtir.
- **audit_log.entity_id UUID'dir ve logAudit hatayı bilerek yutar — metin kimlik
  SESSİZCE kaybolur (2026-08):** "panel-push-0" ve Etsy listing numarası gibi
  metinler log_audit RPC'sinde düştü; iş başarılı görünürken şirket hafızasına
  hiç iz kalmadı. Kural: UUID olmayan kimlik entityId'ye geçirilmez (null +
  kimlik summary metninde); "log yazıldı" varsayımı da denetime dahil —
  ilk koşudan sonra audit satırını SQL'le bir kez gör.


- **Kendi ürettiğin metni ezmeden önce CANLI hâlini oku; senkronun yönü "repo → DB"
  diye varsayılmaz (2026-08):** TTG başlıklarını Etsy rehberliğine uydurmak için
  üretici + migration'ı yeni metne çevirdim. DB'ye yazmadan önce canlı satırı
  sorguladım: üç listing paralel bir oturumda Etsy'ye ÇIKMIŞ (4550516268 /
  4550506421 / 4550506827, 175'er varyant) ve başlıkları ZATEN kısa forma
  çevrilmişti — üstelik canlı metin benimkinden İYİYDİ (iki rengi de adlandırıyor:
  "Solid Yellow and White Gold"; benimki yalnız "Solid Gold" diyordu). Yazsaydım
  iyiyi kötüyle değiştirirdim; UPDATE'in 0 satır etkilemesi tasarım değil ŞANStı
  (`products.sku` NULL, eşleşme varyant SKU'sunda). İkinci kat: paralel oturum
  panelin denetim eşiğini de (`TITLE_MIN_LENGTH` 110→40) düzeltmişti ama ÜRETİLMİŞ
  metni (generator + `0127-0129` migration) eski uzun başlıkla bırakmıştı — yani
  kuralı düzeltmek üretilmiş çıktıyı düzeltmez, ikisi ayrı iştir. Kural: (1) repo⇄DB
  metin senkronunda önce canlıyı OKU, iyi olanı kaynak say, repoyu ona eşitle;
  (2) bir politika/eşik değiştiğinde o politikayla üretilmiş ARTEFAKTLARI ayrıca tara;
  (3) eşitleme sonrası diff'in yalnız hedef satırlara dokunduğunu kanıtla
  (`git diff -U0 -- <yol> | grep -E "^[+-][^+-]" | grep -vc "<hedef>"` = 0).


- **Bütünlük bayrağı tüm veri şekillerini kapsar (2026-07):** "Künye tam" gibi
  eksiksizlik sinyali, alanın yalnız BİR taşıyıcısını sayarsa diğer şekli sessizce
  boş geçer. Vaka: gram bütünlüğü SADECE varyant-başına ölçülüyordu; varyantsız
  tek-parça listing'de `missing_weights=0` çıkıp gramsız 107/108 listing "künye tam"
  görünüyordu. Kural: bayrağı hem varyantlı (per-varyant) hem varyantsız (ürün
  seviyesi `products.weight_grams`) yola göre kur; SQL ile kaç kaydın hangi şekle
  düştüğünü doğrula. Ek: bayrağı flagleyince aynı ekranda düzeltme girişini de sun
  (varyantsız boş durumda ürün gramajı input'u) — "action sinyali + ne yap" dersi.
- **Sayı, display-limit'li sorgudan türetilmez (2026-07):** `getX(limit=50).length`
  50'de doyar — başlık/sayaç için ayrı tam sayım (`count: exact` veya dar-kolon tam
  çekim) kullan.
- **Meta veri kaynağında taşınır (2026-07):** severity/tone gibi nitelikler üreten
  modülün tipinde alan olarak durur; dışarıda string-key eşleme haritası kurma
  (yeni anahtar sessizce yanlış sınıfa düşer).
- **Para daima cent + currency (CLAUDE.md kuralı):** costCents gibi toplamlar kur
  bilgisiyle taşınır; farklı kurlar tek sayıya toplanmaz; formatta kur hardcode edilmez.
- **Sorgu `.error` yutulmaz (2026-07):** `count ?? 0` deseninde hata sessizce
  "her şey yolunda"ya dönüşür — en azından `console.error` ile yüzeye çıkar.
- **Kısmi destekli CSS yerine kompozisyon (2026-07):** `mask-composite` gibi kısmi
  destekli özellik yerine iç içe elemanlarda ayrı maskeler (doğal kesişim) kullan.
- **OAuth callback = kalıcı domain (2026-07):** Redirect URI asla hash'li deployment
  URL'i (`*-abc123.vercel.app`) olamaz — deployment silinince akış kırılır
  (DEPLOYMENT_NOT_FOUND). Daima custom domain, env + sağlayıcı kaydı birebir aynı.
- **Saf motoru bağımsız derle-çalıştır ile kanıtla (2026-07):** İçe aktarmasız saf
  fonksiyon motorunu (ör. `lib/seo/keyword-engine`) commit'ten önce dosyayı kopyalayıp
  test harness ekleyerek `tsc`+`node` ile birkaç senaryoda çalıştır. Vaka: SEO üreticide
  "silver silver ring" (metal ikilenmesi), zincirsiz+unisex'te 13'e ulaşmama ve yüzükte
  "real gold **chain**" — üçü de yalnız gerçek çıktı görülünce yakalandı, tsc/lint bunları
  görmez. Güçlendirme (2026-07): görev-yayma motorunda canlı test, ileri-gün
  taşmasının BUGÜNE çekildiğini gösterdi (kullanıcının verdiği ileri tarih öne
  alınmaz — yalnız ileri itilir); kural assert'te değil ÇIKTIDA görünür oldu.
  Güçlendirme-2 (2026-07): girdi uzayı küçükse nokta senaryosu yerine TAM
  KOMBİNATORİK süpürme koş (SEO motoru: 2520 kombinasyon × 5 invariant) —
  "13'e ulaşmama" bug'ı yalnız dar bir kombinasyonda (zincirsiz+kaplama+classic)
  çıkıyordu; el senaryoları o hücreye denk gelmemişti, süpürme geldi.
  Güçlendirme-3 (2026-08): **süpürme YEŞİL + çıktı BOZUK aynı anda olabilir** —
  invariant yalnız aklına geleni ölçer. Başlıktan kelime-tekrarını silmek için
  öbek içinden kelime söken dedup yazdım; "kelime tekrarı yok" testi 8.505
  kombinasyonda temiz geçti ama gerçek çıktı `Real Layering` gibi anlamsız
  parçalardı (ifadenin ortasından kelime çıkınca gramer ölüyor). Kural: her
  süpürme koşusunda invariant sayacının YANINDA birkaç ham çıktı satırı bas ve
  GÖZLE oku; "0 fail" tek başına teslim değil. İkinci tur aynı desenle gerçek
  bir tekrarı da yakaladı (stil "snake" iken ikincil isim de "snake chain").
- **İsim yanıltır, kaynağı oku (2026-07):** Yeni "keyword/SEO" modülü kurmadan önce
  mevcut `keyword-research.ts`'i açtım — adı "keyword" ama işi RAKİP FİYAT araştırması.
  Çakışma sandığım şey tamamlayıcı çıktı. Kural: sembol adına göre "var/yok" deme, dosyayı aç.
- **Multi-tenant kilidi (2026-07):** Org verisi okuyan her fonksiyon `org_id`
  parametre sözleşmesini UYGULAR (`.eq("org_id", orgId)`) — RLS'in aktif-org
  varsayımına yaslanmaz; iki org'lu kullanıcıda karışır.
- **Marka görselleri org'a aittir (2026-07):** Ortak UI'daki ürün görselleri ve
  marka imzaları ("Jade Gold · NYC" kuyruğu, cutout seti) hardcode edilemez —
  aktif org'dan çözülür (OrgMark, BRAND_KIND çevirisi); yeni org nötr düşer.
- **Fiyat girdisi ile ürün spesifikasyonu çelişiyorsa itiş BLOKE, takip işi değil
  (2026-07):** EON grid'i `Kalinlik = 2.0mm` ilan ederken listing metinleri 1.5mm
  anlatıyordu; bu çelişki "ayrı iş kalemi" diye ertelendi ve fiyat 26 listing /
  7.150 varyantta CANLIYA basıldı. Sonra nihai karar 1.5mm çıktı → 1.5mm yüzük
  2.0mm'nin %72'si ağırlığında, yani canlı fiyatlar ort **%25 yüksek**
  (min %15, max %37). Kural: fiyatın girdi varsayımı (kalınlık/gram tablosu) ile
  ürünün ilan edilen spesifikasyonu AYNI turda uzlaştırılmadan itiş yapılmaz.
  Ek ders: etki hesaplarken önce FORMÜLÜ kanıtla — ilk denemede landed(USD) ile
  engine(cent) birimlerini karıştırıp "$10'luk altın yüzük" üretmiştim; 822/822
  sapma bunu ele verdi. Delta bildirmeden önce formülün canlı veriyi SIFIR
  sapmayla ürettiğini doğrula.
- **3D'yi malzemeye göre yerleştir: cam eğilmez, ÜRÜN eğilir (2026-07):**
  "Siteye 3D derinlik kat" istendiğinde refleks KPI/kart eğmektir; ölçüm bunun
  yanlış olduğunu söylüyor — o yüzeyler `backdrop-filter` taşır, döndürmek
  bulanık zemini her karede yeniden rasterize eder (bu repoda FPS'i 4'e düşüren
  mekanizma) ve `perspective` için gereken `contain:paint` camın arkadaki
  ambiyansı örneklemesini kesip kartı DÜZLEŞTİRİR. Doğru hedef: cam olmayan,
  düz `<img>` taşıyan ÜRÜN yüzeyleri (listing ızgarası, tasarım panosu, üretilen
  görsel galerisi). Mücevher panelinde bu üstelik marka-doğru: altın açıyla ışık
  yakar, yüzük fotoğrafının imlece göre <=5deg eğilip üzerinde speküler ışık
  gezmesi süs değil, ürünün "elde çevrilen nesne" gibi davranmasıdır. Mimari:
  bileşenler sunucu tarafında kalsın diye TEK delege rAF-kısıtlı `pointermove`
  dinleyicisi yalnız `--tx/--ty/--gx/--gy` custom property'si yazar, dönüşü CSS
  yapar (InkOriginListener ile aynı desen). Doğrulama = `matrix3d(...)` görmek +
  imleç karşı köşeye gidince işaretin TERSİNE dönmesi + sahneden çıkınca
  `matrix(1,0,0,1,0,0)`'a sıfırlanması; reduced-motion'da `transform:none`.
- **Tailwind v4'te translate/scale AYRI CSS özelliğidir — elle yazılan
  `transition-[...]` listesinde `transform` demek hareketi ÖLDÜRÜR (2026-07):**
  v4, `hover:-translate-y-0.5`i `translate`, `active:scale-[0.97]`yi `scale`
  özelliğine basar (v3'teki tek `transform` matrisi DEĞİL). Geçiş listesi
  `transition-[...,transform]` derse bu ikisi geçişe hiç girmez → kalkma/basma
  anında sıçrar, özenle yazılmış süre/easing token'ları ölü kod olur. Vaka: tüm
  "asimetrik basma fiziği" turu (buton + 8 bileşen daha, 9 çağrı yeri) fiilen
  çalışmıyordu; typecheck/lint/build ÜÇÜ de temiz geçti, tasarım review'ü de
  görmedi — yalnız canlı `getComputedStyle` yakaladı. Kural: (1) elle
  `transition-[...]` yazarken translate/scale/rotate'i AYRI AYRI listele
  (Tailwind'in kendi `transition-transform` utility'si zaten
  `transform,translate,scale,rotate`a açılır, onu kullanmak daha güvenli);
  (2) süre/easing listelerinin öğe sayısı özellik sayısıyla eşleşmeli;
  (3) doğrulama = basış anında ARA değer görmek (`translate: -0.518px`,
  `scale: 0.9778`) — son değeri görmek geçişin ÇALIŞMADIĞI anlamına gelir.
  Tarama: `grep "transition-\[" | grep transform` + aynı satırda durum-önekli
  (hover:/active:/group-hover:) translate|scale ara.
- **Tailwind v4: utility, @layer components'ı ezer — "kozmetik" shadow-none gölgeyi siler (2026-07):**
  `.nm-pressed` gibi bileşen sınıfının yanına yazılan `shadow-none` utility'si
  KAZANIR ve bileşenin box-shadow'unu tamamen siler (iki yerde nm-* yüzeyi düz
  karta dönmüştü). Kural: bileşen-sınıflı öğeye aynı özelliği ezen utility ekleme;
  eklenmişse muhtemelen yanlışlıkladır, kaldır ve görsel farkı kontrol et.
- **Negatif z-index kabından çocuk öne çıkamaz (2026-07):** `-z-*` konumlu kap
  stacking context'tir; "önde duracak" öğe için KARDEŞ pozitif-z kap gerekir.
- **Metadata rotaları auth'tan muaf (2026-07):** proxy/middleware matcher'ı
  `/apple-icon`, `/manifest.webmanifest`, OG/Twitter görsellerini login'e
  yönlendirmemeli — sosyal botlar ve iOS 307'yi takip edip görseli kaybeder.
- **Vekil durum no-op yolda da eşitlenir (2026-07):** Uzak durumun yerel vekiline
  ("products.description = Etsy açıklaması" gibi) dayanan güncel/bekliyor ayrımında,
  uzak taraf zaten günceldeyken DE vekili eşitle — yoksa bayat vekil, öğeyi sonsuza
  dek "bekliyor" listesinde bırakır (Etsy ağırlık gönderiminin unchanged yolu).
- **JSX'te ifade↔kelime boşluğu `{" "}` ile sabitlenir (2026-07):** `{sayı} kelime`
  bitişik ("54listing") render edilebilir — sayaç metinlerinde boşluğu açık `{" "}`
  olarak yaz. Kaynak koddaki boşluğa güvenme; gerçek render ölçümü yakaladı.
- **AI ikon sayfası: kesmeden önce gerçek grid'i say (2026-07):** Üretilen
  sayfa istenen ızgaraya (6×5) uymayabilir (6×6 + tekrar hücreler çıktı) —
  kesme script'ine geçmeden görseli aç, satır/sütunu say, hücre→anahtar
  eşlemesini elle kur; körlemesine dilimleme yanlış ikonları yerleştirir.
- **Animasyonlu öğede Playwright hover (2026-07):** Sürekli süzülen (infinite
  animation) öğede `hover()`/`scrollIntoViewIfNeeded()` "element is not stable"
  ile takılır — `evaluate(scrollIntoView)` + `mouse.move(bbox merkezi)` kullan,
  önce kaplayan overlay'leri (Neler Yeni popup'ı) kapat; computed-style okuması
  yanıltabilir, son hakem hover anındaki ekran görüntüsüdür.
- **Gün-anahtarı hangi takvimse pencere de o takvimde (2026-07):** Gruplama
  anahtarı mağaza saat dilimine (NY) geçirilirken sorgu pencereleri UTC gün
  sınırında bırakılırsa kenar kayar — "Bugün" NY-dünün akşamını sayar, NY-bugünün
  akşamını kaçırır; KPI ile trend farklı takvim anlatır. Kural: pencere üretimi
  (resolvePeriod) ve gün-anahtarı (dayKeyNY) TEK takvim çerçevesinden türesin;
  DST kenarlarını gerçek çalıştırmayla test et (nyDayStartUtc/nyDayEndUtc).
- **Türetilmiş metrik hangi kümeden kurulduysa sayacı da o küme (2026-07):**
  Band rakip setinden kurulurken result_count organik sayıyı taşıyınca reprice
  eşiği ve UI kapısı yanlış kümeye baktı (comp-set'li ürün "rakip az" diye
  atlandı). Kural: bir metriğin kaynağı koşula göre değişiyorsa, kaynak kümenin
  boyutu AYRI alanda (band_result_count) taşınır; tüketiciler onu okur.
- **SQL coalesce ≠ JS || (2026-07):** Gelir semantiği "grand_total || item_total"
  RPC'ye coalesce ile taşınınca sıfır-kenarı ayrıştı (JS sıfırda da düşer, SQL
  yalnız NULL'da). Kural: JS `||` davranışını SQL'e taşırken nullif(x,0) kullan;
  iki yüzeyin eşitliğini kenar değerle (0, NULL) doğrula.
- **Snapshot'lı metrikte önce dedupe (2026-07):** Aynı dönem etiketi birden çok
  anlık görüntü taşıyabilir — sayı/toplamdan önce ürün başına EN GÜNCEL kayıt
  seçilir; yoksa çift sayılır (LCC metrik dersiyle aynı kök).
- **Webhook = sinyal, veri değil (2026-07):** Webhook gövdesi asla doğrudan DB'ye
  yazılmaz — imza doğrula (HMAC + timestamp penceresi), id çöz, veriyi API'den
  OAuth'la taze çek, idempotent upsert; günlük cron uzlaştırması emniyet ağı kalır.
- **Artımlı senkron pencereyi LAST_MODIFIED ile açar (2026-07):** `min_created`
  penceresi, durumu SONRADAN değişen kaydı (iptal/kargo) yapısal olarak kaçırır —
  Etsy sipariş durumları bu yüzden yıllarca bayat kalmıştı; `min_last_modified` kullan.
- **Statü asla hardcode yazılmaz (2026-07):** Kaynak API'nin durum alanı eşlenmeden
  sabit değer basmak ("completed") tüm downstream filtreleri ölü koda çevirir; yazım
  farkları ('canceled' vs 'cancelled') tek sözlükte sabitlenir (0080 vakası).
- **Dışa çıkan görselden köken meta verisi sök (2026-07):** Etsy'ye yüklenen ya
  da indirilen ürün fotoğrafı üreteç etiketi taşımamalı (Higgsfield PNG `tEXt
  hf-job-id`). Çıkış noktalarında (upload action + indirme proxy) chunk-bazlı
  strip; renk/derinlik chunk'ları korunur. UYARI: piksele gömülü SynthID
  filigranı meta veri DEĞİLDİR, sökülemez — "tamamen temiz" diye vaat etme.
- **Türetilebilir alanı gönderme, anahtarı hiç gönderme, ağırlıklı checksum'la doğrula
  (2026-07):** 858 satırlık ızgarayı MCP ile basarken tam metin ~130KB'dı. Üçlü kısaltma:
  (1) veri tam KARTEZYEN ise (3 karat × 2 profil × 11 genişlik × 13 beden) anahtarları
  `generate_series` + `row_number()` ile SQL'de üret — anahtar transkripsiyon riski SIFIR;
  (2) formülü 858 satırda birebir doğrulanan kolonları (engine/list/sale) SQL'de türet,
  yalnız doğrulanamayanları (floor/offsite: 7 ve 78 satırda kenar sapması) açık gönder;
  → 22KB, 4 parça. (3) Doğrulama SADECE toplam olmasın: kolon toplamı satır KAYMASINI
  yakalamaz — `sum(i * kolon)` konum-ağırlıklı checksum + kaynağın kendi altın satırları
  şart. Parça byte uzunluğunu da karşılaştır (yazım hatasını anında yakalar).
- **Büyük MCP SQL'i parça + yeniden-kurgu ile yaz (2026-07):** execute_sql metni
  elle üretildiğinden 37KB tek statement'ta transkripsiyon hatası (UUID'de boşluk)
  girdi. Çözüm: tekrarlı URL önekini SQL'de `||` ile yeniden kur, kısa token'ları
  ~6KB'lık parçalarda gönder, sonda `count`la doğrula.
- **Ebeveyn-id gerektiren alt-varlığı oluşturma formuna taşı (2026-07):** Alt
  varlık (tasarım görseli/panosu) yükleme `design_id` istediği için yalnız KAYIT
  sonrası (düzenle sayfası) eklenebiliyordu. Çözüm: yeni-kayıt formunda görseli
  istemcide TUT, submit'te önce `createDesign` → dönen id ile `createBoard`'ı
  ard arda çağır (tek akış). Yükleme hata verse bile ebeveyn korunur; kullanıcıyı
  düzenle sayfasına al ki tekrar denesin — mevcut upload action'ı yeniden kullan.
- **Silmeden önce dış medyayı Storage'a KALICI çek (2026-07):** Etsy'de listing
  silinecekse, canlı-fetch (getListingImages) yetmez — silince kaybolur. Video ise
  panelde hiç saklanmıyordu. Çözüm: `listing_media` tablosu + özel bucket
  (`listing-archive`, org-klasörü RLS); server action Etsy CDN'inden baytı çekip
  bucket'a yükler, idempotent upsert eder (org+listing+kind+media_id). Etsy auth
  yalnız canlı app'te çalıştığı için pull uygulama içinden tetiklenir; migration
  MCP ile önceden uygulanır ki preview'da hazır olsun.
- **Teslimat repo'ya inmeden iş bitmiş sayılmaz (2026-07):** Scratchpad/Drive'a bırakılan
  çıktı ekip için görünmezdir ve konteynerle ölür — kullanıcı haklı olarak "repo olarak
  kimse bir şey yapmaz ki" dedi. Kural: uçtan uca işin karar/paket/runbook artefaktları
  repo'da yaşar (`docs/<işkolu>/` + README runbook); Drive/scratchpad yalnız kopya/aracı.
- **Dış silmeyi arşiv-önce + scope-check ile geçitle (2026-07):** Canlı Etsy
  listing'i silmek geri alınamaz; önce medya `listing_media`'ya arşivlenmemişse
  silme REDDEDİLİR (kayıp önlenir), yalnız owner/admin, iki adımlı UI onayı ve
  `listings_d` yoksa Etsy 403 → yeniden-bağlan sinyali. Panel kaydı SİLİNMEZ:
  `products.etsy_deleted_at` işaretlenir (geriye dönük iz korunur), 404 idempotent.
- **Gömülü prose regex ile temizlenmez, yeniden yazılır (2026-07):** 39 açıklamadan
  "iki kalınlık" dilini sökmek gerekti; kalınlık cümleleri (131 varyant) genişlik
  rehberliğiyle iç içe örülüydü → regex düzyazıyı bozardı. Çözüm: LLM ile yeniden
  yaz, sonra KOD-tabanlı doğrulama koş (leak sayacı SQL: `ilike '%2.0mm%'`, `%two
  thick%`, `%whole US%` = 0; `%whole and half%` = 39). Ders: yapısal token (SKU,
  property) regex'le; anlam taşıyan prose yeniden-yazımla değişir; ikisini de canlı
  sayaçla doğrula, "kod doğru görünüyor" ile bitirme.
- **Geri-dönüşü zor katalog transform'unu üretici+migration+canlı-sayaç üçlüsüyle bitir (2026-07):**
  EON v2→v3 (yarım beden ekle, 2.0mm kaldır) DB'ye MCP ile parçalı uygulandı;
  ama iş "repo'ya inmeden bitmez" (önceki ders). Kural: (1) saf üretici
  (`gen_catalog_v3.py`, yalnız gram tablosu okur, iç assert'lerle 10.725/275/SKU
  tekilliği) ÜRETİMİ tek kaynakta tutar; (2) `0101` migration canlıya uygulanan
  SQL'in AYNISINI taşır (preview provizyonu + kayıt) — Bölüm A varyant transform,
  Bölüm B 39 metin UPDATE; (3) üretici çıktısı canlı DB ile birebir çapraz-doğrulanır
  (örneklem gram/fiyat + global min/max = DB). Ek: iki metin batch'ini `cat`'lerken
  dosya sonu newline'ı yoksa son+ilk statement tek satıra yapışır (`grep -c '^update'`
  39 yerine 38 verdi) → araya `printf '\n'` koy, sayımla doğrula.
- **"Breakeven üstü" ≠ "kârlı" — marjı ayrı kanıtla (2026-07):** Kullanıcı "ama kârla
  satıyoruz değil mi?" diye sordu; breakeven kontrolü yalnız melt tabanını (ham metal
  + %10) geçtiğini gösterir. Gerçek kâr = satış − HAM altın maliyeti (breakeven×0.90)
  − kargo payı; ayrı SQL ile hesapla (min/ort/max marj + zararına satan sayısı = 0).
  Ayrıca dürüst ol: bu marj metal+kargo üstüdür, Etsy ücreti (~%9-10) + işçilik
  düşülmemiştir — "kârlı" derken kapsamı söyle. Vaka: min %24.9 (yıldız, dar genişlik),
  ort %35.7; 0 zararına.
- **Yüzey silerken kabın İÇİNDEKİ çekirdeği kaybetme; yetim taraması import
  biçimine kör olmasın (2026-08):** Panel sadeleştirmesinde 11 rota + 2 cron +
  yetim kod söküldü (-19.7k satır). İki tuzak çıktı. (1) "Rakip & benzerler"
  panelini bütün olarak silince İÇİNDEKİ `VariantMatrix` de gitti — o çekirdek
  bir bileşendi, rakip yüzeyiyle aynı panelde durması eski gruplamanın
  kalıntısıydı. Tek sinyal lint'in "kullanılmayan import" uyarısıydı;
  typecheck ve build TEMİZ geçiyordu çünkü silinen JSX kimseyi kırmıyor.
  Kural: bir kabı silmeden önce içindekileri TEK TEK sınıflandır (kalacak /
  gidecek / taşınacak); silme sonrası lint'in unused-import listesi kayıp
  çekirdek için erken uyarıdır, sıfırlanana kadar bitmiş sayma. (2) Yetim
  modül taraması `@/lib/<yol>` desenine bakınca `lib/supabase/client` ve
  `pricing-engine/parse` YETİM göründü — ikisi de göreli import (`./parse`)
  ile çağrılıyordu; silinseydi prod kırılırdı. Kural: yetim iddiası için
  arama deseni tüm import biçimlerini kapsamalı (mutlak + göreli + dizin
  index'i), ve her aday tek tek doğrulanmalı — toplu silme yok.
- **Aynı commit iki projede farklı sonuç veriyorsa hata kodda DEĞİLDİR
  (2026-08):** PR CI'ında `handover-atlas` FAILED, `jade-gold-nyc` SUCCESS —
  aynı sha. Log: `next/font/google` build sırasında fonts.gstatic.com'dan
  woff2 çekiyor ve 404 aldı. İlk teşhisim "bayat build cache rotasyona uğramış
  URL taşıyor" idi; başarılı build'in logunu okuyunca ÇÜRÜDÜ — o da cache geri
  yüklemişti. Gerçek sebep: 45 sn arayla koşan iki build'den biri geçici CDN
  hatası yedi. Kural: (a) çok-projeli repoda tek proje kırmızıysa önce AYNI
  commit'in diğer projedeki sonucuna bak — ayrışma varsa kodu suçlama;
  (b) teşhisi ilan etmeden önce KARŞI örneğin logunu da oku (başarılı koşu
  teoriyi çürütebilir); (c) çare yeniden deneme. Yapısal çözüm istenirse
  build-time font indirmeyi kaldır (self-host) — ağ bağımlılığı olan her
  build adımı er geç kırmızı verir.
- **Konteyner geri düşerse "kodu okudum" kanıt değildir — iddiadan önce dosyanın
  HANGİ commit'te olduğunu doğrula (2026-08):** Fiyat motorunun profil
  desenlerini `grep`le okuyup "satin ve two-tone yok, 11 canlı listing
  fiyatlanamıyor" diye rapor edecektim; ayrıca o listeyi kopyalayıp node ile
  koşturup `null` çıktısını "kanıt" saydım. Gerçekte konteyner o an eski bir
  ağaca (ae42d5e) geri düşmüştü; güncel `main`'de iki desen de VARDI ve 42
  canlı başlığın 42'si profil çözüyordu. Yani hem okuma hem "bağımsız test"
  aynı bayat kaynaktan besleniyordu — test doğrulamıyor, yanılgıyı
  pekiştiriyordu. Kural: (1) bu repoda her tur `git fetch` + `git rev-parse
  HEAD` ile origin'i karşılaştır, eşit değilse ÖNCE reset et, sonra oku;
  (2) "X yok" gibi eksiklik iddiaları en kırılgan iddialardır — dosyayı
  reset SONRASI yeniden aç; (3) kaynaktan kopyalanan harness testi, kaynak
  bayatsa bağımsız değildir; testin girdisini üreten dosyanın sürümünü de
  doğrula. Yakalayan şey: aynı bloğu Edit ile değiştirmeye çalışınca
  "String to replace not found" alması oldu.
