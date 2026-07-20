# Etsy API kapsamı — panelin çekebildiği ve çekemediği veriler

_2026-07-20 · Canlı OAS (76 uç) + resmi geliştirici tartışmaları ile doğrulandı.
Amaç: "bu veri panele gelir mi?" sorusuna tek bakışta, dürüst cevap._

## API'nin VERDİĞİ ve panelin çektiği veriler

| Veri | Etsy ucu | Panelde nereye yazılır | Nerede görünür |
| --- | --- | --- | --- |
| Siparişler + kalemler | `getShopReceipts` (gömülü transactions) | `sales`, `sale_items` | Satışlar, Panel KPI |
| Listingler (fiyat, etiket, stok, **ömür boyu views/favori**) | `getListingsByShop` (tüm state'ler) | `products` | Listing Komuta Merkezi |
| Listing görüntülenme GÜNLÜK serisi | yok — API yalnız ömür boyu toplam verir; senkron her gün fotoğraflar | `etsy_listing_stats` (org, listing, gün) | Analizler grafiği, listing detay "Görüntülenme trendi" |
| Yorumlar | `getReviewsByShop` | `reviews` | Yorumlar |
| Ödeme ledger'ı (komisyon, **Etsy Ads günlük ücreti `prolist`**, **Offsite Ads sipariş ücreti `offsite_ads_fee`**, kargo etiketi) | `getShopPaymentAccountLedgerEntries` | `etsy_ledger_entries` → `costs` (reklam/kargo/etsy_ucretleri) + `sales.etsy_fees_cents` | Maliyetler, Reklamlar "Etsy API (ledger)" bölümü |
| Mağaza sağlık fotoğrafı (favori, puan, aktif listing, toplam satış) | `getShop` | `etsy_shop_snapshots` | Analizler |
| Bölümler, kargo profilleri | `getShopSections`, `getShopShippingProfiles` | `etsy_shop_sections`, `etsy_shipping_profiles` | Listing oluşturma akışı |
| Sipariş yaşam döngüsü sinyali | webhooks (`order.paid/canceled/shipped/delivered`) | `/api/etsy/webhook` → API geri çekme | Satışlar (saniyelik tazelik) |

## API'nin VERMEDİĞİ veriler (sınır + vekil)

| İstenen | Durum | Vekil (panel çözümü) |
| --- | --- | --- |
| **Trafik kaynağı kırılımı** (sosyal medya, website, Etsy arama, direkt) | API'de YOK — yalnız Etsy Stats ekranı; CSV dışa aktarımı da yok | Arama terimleri: Etsy Stats CSV içe aktarımı (`lib/csv/mappers/etsy-keywords.ts`). Offsite Ads atıflı sipariş/ciro: ledger (`ads-ledger.ts`). Sosyal trafiğin üretim tarafı: Sosyal modülü. |
| **Listing bazlı Etsy Ads istatistiği** (tık, harcama, reklam geliri, ROAS) | API'de YOK (resmi tartışmalarda net; scraping ToS ihlali) | Mağaza geneli harcama: ledger `prolist` (otomatik). Listing bazlı: Analizler → Ürün performansı'na "son 30" etiketli elle giriş (Etsy Ads ekranından). |
| Reklam kontrolü (bütçe, aç/kapat) | API'de YOK | Reklamlar aksiyon kuyruğu: karar panelde, uygulama Etsy panosunda elle + "Yapıldı" işareti. |
| Ziyaret (visit) / dönüşüm oranı | API'de YOK | Dönüşüm vekili: sipariş ÷ görüntülenme artışı (aynı kapsanan aralık) — listing detay "Görüntülenme trendi" kartı. |
| Görüntülenme tarihçesi | API yalnız anlık ömür-boyu toplam verir | Panel her senkron günü fotoğraflar; seri panelde birikir (fark = günlük görüntülenme). |

## Kurulan bağlamlar (veri → karar)

- **Organik ilgi ↔ satış:** görüntülenme artışı + aynı aralıktaki sipariş →
  dönüşüm vekili (listing detay). Yüksek görüntülenme + sıfır sipariş =
  fiyat/görsel/varyant sorunu sinyali.
- **Reklam ↔ organik:** Reklamlar sinyal kartlarında elle girilen "son 30"
  reklam metriklerinin yanına organik trend (fotoğraf farkı) + dönüşüm +
  fiyat/stok bağlamı eklenir — kapat/azalt/artır kararı tek ekranda.
- **Offsite Ads atfı:** ledger ücret kaydı → sipariş → kalem zinciriyle
  hangi listinglerin offsite reklamdan sipariş getirdiği (Reklamlar API bölümü).
- **Maliyet gerçeği:** ledger'ın reklam/komisyon/kargo kalemleri Maliyetler'e
  aylık; kâr hesabı reklam harcamasını otomatik içerir.

## Kural

Her yüzey veri penceresini ve kaynağını etikette söyler: "API (ledger) ·
gerçek takvim penceresi" ile ""son 30" etiketli elle giriş" ayrı şeylerdir ve
ekranda ayrı yazılır. API sınırı gizlenmez, ilan edilir; vekili kurulur.
