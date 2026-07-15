# Second Brain — kendi iyi uygulamalarımızdan çıkan dersler

Bu dosya CLAUDE.md üzerinden her oturumda yüklenir. **Protokol:** her uçtan uca
işin sonunda, o işte işe yaramış iyi uygulamayı/dersi buraya TEK satır-blok
olarak ekle (tarih + ders + neden). Tekrarı olan dersi güçlendir, çürüyeni sil.

## Süreç dersleri

- **Paralel iş kolu kontrolü (2026-07):** Bir özellik kurmadan ÖNCE `git fetch` +
  `origin/main`'i incele — aynı özellik paralel oturumda çoktan (hatta daha iyi)
  eklenmiş olabilir. Vaka: $/gram pazar motoru iki kez yazıldı; main'deki üstündü,
  bizimki geri çekildi. Kural: motor/altyapı işine başlamadan main'de sembol taraması.
- **Kanıtla, varsayma (2026-07):** "İzin kapalı", "veri yok" gibi durum iddialarını
  DB'den SQL ile doğrula. Vaka: Etsy yazma izni "kapalı" sanılıyordu; `etsy_write_enabled`
  sorgusu `true` döndü — bir adım boşa planlanmıştı.
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
  görmez.
- **İsim yanıltır, kaynağı oku (2026-07):** Yeni "keyword/SEO" modülü kurmadan önce
  mevcut `keyword-research.ts`'i açtım — adı "keyword" ama işi RAKİP FİYAT araştırması.
  Çakışma sandığım şey tamamlayıcı çıktı. Kural: sembol adına göre "var/yok" deme, dosyayı aç.
- **Multi-tenant kilidi (2026-07):** Org verisi okuyan her fonksiyon `org_id`
  parametre sözleşmesini UYGULAR (`.eq("org_id", orgId)`) — RLS'in aktif-org
  varsayımına yaslanmaz; iki org'lu kullanıcıda karışır.
- **Marka görselleri org'a aittir (2026-07):** Ortak UI'daki ürün görselleri ve
  marka imzaları ("Jade Gold · NYC" kuyruğu, cutout seti) hardcode edilemez —
  aktif org'dan çözülür (OrgMark, BRAND_KIND çevirisi); yeni org nötr düşer.
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
