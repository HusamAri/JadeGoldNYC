# Panel sadeleştirme planı (2026-08-11)

**Direktif:** Panel yalnız **listing yükleme + maliyet/kâr takibi** aracı olsun.
Etsy'nin kendi arayüzünde yapılması ZOR olan işler kalır (toplu listing
oluşturma, binlerce varyanta gözetimli fiyat itişi, maliyet/kâr — Etsy'de hiç
yok); gerisi gider. Hem EON hem Jade hem gelecek sektörler için sade,
kullanıcıya hitap eden yapı. Güvenilir çalışmayan hiçbir otomasyon kalmaz
(örn. altın oto-takibi — cron 2026-08-11'de söküldü, PR #344).

## Neden

Son haftalarda çıkan hataların ortak kökü: panelin yüzey alanı büyüdükçe
(24 modül, 7 cron, 3 fiyat motoru kalıntısı) hiçbir parça tam güvenilir
değil. Küçük ve doğru > büyük ve kırılgan.

## Hedef bilgi mimarisi (4 bölüm, ~8 sayfa)

| Bölüm | Sayfa | İş |
| --- | --- | --- |
| Panel | `/panel` | Tek bakışta: satış, maliyet, kâr (başka hiçbir şey) |
| Listeler | `/tasarimlar` (+ `/listing-onerileri` birleşik) | Listing oluştur → Etsy'ye taslak gönder → durum izle; `/arsiv` (silmeden önce medya koruması) alt sekme |
| Maliyet & Kâr | `/maliyetler` + `/satislar` + sade kâr raporu | Maliyet girişi (elle + ShipStation/Etsy ücret senkronu), satış aynası, listing-başına kâr |
| Sistem | `/ayarlar`, `/kayitlar` | Bağlantılar (Etsy/Shopify/platform), denetim izi |

**Fiyat (`/fiyat`) kalır ama küçülür:** yalnız gözetimli toplu itiş
(dry-run → onay → tek itiş, CAS kilidi). Spot ELLE girilir; otomatik spot
çekme/endeks/karşılaştırma UI'ları gider. Gerekçe: 7.475 varyantı Etsy'de
elle fiyatlamak imkânsız — bu tam "Etsy'de yapması zor" sınıfı.

## KALDIRILACAKLAR (Faz 0'da nav'dan, Faz 1'de koddan)

Sayfalar: `/reklamlar`, `/anahtar-kelime`, `/seo-yardimcisi`,
`/seo-etiketleri`, `/ai-istihbarat`, `/analizler` (+`/tani`),
`/yildiz-satici`, `/sepet-kurtarma`, `/sosyal`, `/gorevler`,
`/marka-kilavuzu`, `/yenilikler`, `/rehber` (sadeleşince tek sayfa yeniden
yazılır), `/yorumlar`, `/stok`, `/indirimler`, `/gorsel-uretim`
(son üçü kullanıcı onayına bağlı — aşağıda).

Cron'lar: `keyword-research`, `daily-digest` gider; `gold-reprice` ve
`reprice` zaten ölü. **Kalır:** `etsy-sync`, `etsy-variants`,
`shipstation-sync` (çekirdeğin veri damarları: satış/maliyet/listing aynası).

Lib: `lib/seo/*`, `lib/ads*`, keyword-research, reprice kalıntıları,
growth-roadmap, digest. `lib/pricing*` küçülür (motor + gözetimli itiş kalır).

DB: İLK TURDA HİÇBİR TABLO DROP EDİLMEZ — yalnız yazan kod gider (veri kaybı
riski sıfır; tablo temizliği ayrı, acele etmeyen bir faz).

## Sektör-nötrlük ilkesi

Çekirdek şema zaten nötr: listing + varyant + cent-para + maliyet + satış.
Altına özel her şey (gram, karat, spot) EON'un fiyat motoru adaptöründe
yaşar; yeni sektör = yeni adaptör (veya adaptörsüz, yalnız çekirdek).
`capability`/`jadeGoldOnly` bayrak deseni zaten var — org'a göre yüzey.

## İki uçtan uca döngü (panelin var olma sebebi)

Kalan her sayfa bu iki döngünün bir adımıdır; hiçbir sayfa döngü dışı iş
taşımaz:

**1. Listing döngüsü** — `Listeler` bölümü:
`oluştur (panel/paket) → Etsy'ye taslak gönder (ops/UI) → gece senkronu
read-back doğrular → aktivasyon → silinecekse önce arşiv (medya koruması)`.
Döngünün sağlığı panel ana sayfasında tek satırda görünür: "bekleyen taslak /
gönderilen / senkron farkı".

**2. Kâr döngüsü** — `Maliyet & Kâr` bölümü:
`satış aynası (etsy-sync) → maliyet girişi (elle + shipstation/etsy ücretleri)
→ listing-başına kâr → sapma varsa gözetimli fiyat itişi (/fiyat, dry-run →
onay → tek itiş)`. Ana sayfada tek satır: "bu ay satış / maliyet / kâr".

Döngü ilkesi (second-brain derslerinden): dış sisteme yazılan her şey AYNI
turda read-back ile doğrulanır; hiçbir yazma zamanlanmış/gözetimsiz olamaz.

## Fazlar

- **Faz 0 — Nav sadeleştirme (geri dönüşü kolay):** kaldırılacak sayfalar
  nav'dan çıkar, rotalara 410/yönlendirme; kullanıcı yeni yüzeyi hemen görür.
- **Faz 1 — Kod sökümü: YAPILDI (2026-08-11).** 102 dosya / 19.682 satır
  silindi; typecheck 0 hata, lint temiz, build 78 sayfa yeşil.
  - Rotalar: reklamlar · anahtar-kelime · seo-yardimcisi · seo-etiketleri ·
    ai-istihbarat · analizler(+tani/urunler/aksiyon-plani) · yildiz-satici ·
    sepet-kurtarma · gorevler · yenilikler · marka-kilavuzu
  - Cron: `keyword-research` + `daily-digest` (vercel.json + rotalar)
  - Bileşen: action-plan/ ads/ keywords/ seo/ tasks/ + 13 tekil bileşen
  - Lib: 10 sorgu modülü, keywords/ seo/ metrics-playbook/, 3 validation,
    product-performance, ai-cost-catalog (her biri TEK TEK yetim doğrulandı —
    `lib/supabase/client` ve `pricing-engine/parse` göreli import taşıdığı
    için ilk taramada YANLIŞ yetim göründü, silinmedi)
  - **Kurtarılan:** `VariantMatrix` silinen "Rakip & benzerler" panelinin
    İÇİNDEYDİ; çekirdek olduğu için Varyantlar paneline taşındı (katlı).
    `MarketPositionCard` + `RepriceRuleCard` bilinçli düştü (rakip araştırma /
    emekli reprice). `report-tier-table` salt-okunur duruma indi.
  - Tartışmalı üçe (stok · indirimler · gorsel-uretim/yorumlar/sosyal)
    DOKUNULMADI — onay bekliyor.
- **Faz 2 — Çekirdek sayfaların sadeleştirilmesi:** panel/maliyet/kâr
  yüzeyleri "özet + detay" desenine indirgenir; rehber yeniden yazılır.
- **Faz 3 — DB temizliği (ayrı karar):** kullanılmayan tablolar için
  arşiv/drop migration — ancak Faz 1-2 canlıda bir süre sorunsuz yaşadıktan
  sonra.

## Kullanıcı onayı bekleyen üç karar

1. **/stok** — çekirdeğe girer mi? (made-to-order modelde stok anlamı zayıf;
   önerim: KALDIR)
2. **/indirimler** — indirimli fiyat kâr hesabına giriyor; ayrı sayfa yerine
   Maliyet & Kâr içinde tek alan olarak mı yaşasın? (önerim: sayfayı kaldır,
   kâr hesabındaki indirim payını koru)
3. **/gorsel-uretim + /yorumlar + /sosyal** — Jade tarafı bunları kullanıyor
  mu? (önerim: ÜÇÜNÜ de kaldır; görsel işleri panel dışında zaten daha iyi)
