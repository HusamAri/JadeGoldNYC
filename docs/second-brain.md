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
- **Snapshot'lı metrikte önce dedupe (2026-07):** Aynı dönem etiketi birden çok
  anlık görüntü taşıyabilir — sayı/toplamdan önce ürün başına EN GÜNCEL kayıt
  seçilir; yoksa çift sayılır (LCC metrik dersiyle aynı kök).
