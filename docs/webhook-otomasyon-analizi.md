# Webhook Otomasyon Analizi — sinyalden kesin doğruluğa

_2026-07-14 · Sipariş durumu paritesi + webhook alıcısı (PR #161) işinin devamı
olarak hazırlanan mimari analiz. Amaç: sistemin sinyalleri KENDİLİĞİNDEN görüp
aksiyon alması ve her zincirin "kesin doğruluk kaynağında" bitmesi._

## 1. Temel ilke: webhook SİNYALDİR, veri değil

Bütün otomasyon mimarisi dört katmana oturur; her katmanın tek görevi var:

| Katman | Görev | Bizdeki karşılığı |
| --- | --- | --- |
| **Webhook (push)** | "Bir şey değişti" sinyali — SANİYELER içinde | `/api/etsy/webhook` (canlı) |
| **API geri-çekme (pull)** | Değişen kaydın TAZE ve DOĞRU hali | `EtsyClient` ile `resource_url`'den receipt fetch |
| **Cron uzlaştırma** | Kaçan sinyalleri yakalayan tam tarama | `etsy-sync` (günlük, `min_last_modified` pencereli) |
| **Audit log (hafıza)** | Her değişikliğin kim/ne/ne zaman kaydı | `audit_log` + trigger'lar |

Kural: **webhook gövdesindeki veriye asla güvenilmez ve asla doğrudan DB'ye
yazılmaz.** İmza doğrulanır → id çözülür → veri API'den OAuth'la yeniden
çekilir → idempotent upsert. Webhook düşse bile cron aynı sonuca ulaşır
(eventual consistency); webhook yalnız gecikmeyi dakikalardan saniyelere
indirir. "Kesin doğruluk kaynağı" böylece her zaman API + uzlaştırma çifti
olur, hiçbir zaman tekil bir bildirim olmaz.

## 2. Olay kaynağı envanteri

### 2a. Etsy webhooks (CANLI — alıcı kuruldu, secret bekliyor)
- Olaylar: `order.paid` · `order.canceled` · `order.shipped` · `order.delivered`.
  Kişisel uygulamalara tam erişim; HMAC-SHA256 imza + exponential backoff retry;
  yeni olaylar duyuru kanalından geliyor (listing/review olayları HENÜZ yok).
- Payload yalnız `event_type + resource_url + shop_id` taşır — "sinyal, veri
  değil" ilkesini Etsy'nin kendisi dayatıyor.
- Kurulum: Developer Portal → Webhook portal → endpoint
  `https://<panel-domain>/api/etsy/webhook` + 4 olay; `whsec_…` anahtarı
  Vercel'e `ETSY_WEBHOOK_SECRET`.

### 2b. ShipStation webhooks (KULLANILMIYOR — en değerli boşluk)
- API'den abone olunur: `POST https://ssapi.shipstation.com/webhooks/subscribe`
  (`target_url`, `event`, `store_id?`). Olaylar: `ORDER_NOTIFY`,
  `ITEM_ORDER_NOTIFY`, `SHIP_NOTIFY`, `ITEM_SHIP_NOTIFY`.
- Payload yine `resource_url` verir → aynı dört-katman deseni birebir uygulanır.
- Değer: tartılmış GERÇEK gramaj (`internalNotes`) bugün günlük cron'la
  geliyor; `SHIP_NOTIFY` ile kargolandığı SANİYE yakalanır → varyant ağırlığı
  (`weight_source='shipstation'`, hiyerarşinin tepesi) ve kargo süresi metriği
  anında işlenir.

### 2c. Supabase iç olay veri yolu (KISMEN KULLANILIYOR)
- `audit_log` trigger'ları zaten her tablo değişikliğini yakalıyor — bu bizim
  İÇ webhook'umuz. Üstüne **Database Webhooks** (pg_net) ile kritik insert'ler
  (örn. `sales.status='cancelled'`) panel endpoint'ine POST edilebilir;
  **pg_cron** Vercel Hobby'nin "günde 1 cron" sınırını DB tarafında aşmanın
  meşru yolu (örn. saatlik uyarı yeniden-değerlendirme).

### 2d. Sinyali OLMAYAN kaynaklar (yalnız poll)
- Etsy: yorumlar, yorum yanıtları (API hiç vermiyor — panel tek kaynak),
  listing görüntülenme/favori, ledger. → günlük senkron + `reconcile_reviews_after_sync`.
- Altın spot fiyatı → cron.
- Vercel Hobby: cron başına günde 1 çalıştırma (6-saatlik cron denemesi deploy'u
  düşürdü; ders: gerçek-zamanlılık cron sıklığından değil webhook'tan gelir).

## 3. Otomasyon zincirleri — sinyal → aksiyon → kesin doğruluk

Her zincir "sinyal → otomatik aksiyon(lar) → hangi kaynağın doğrusuyla biter"
biçiminde. ✅ = bugün canlı, 🔜 = küçük ekle canlanır, 🧭 = orta vadeli.

### A. Sipariş yaşam döngüsü ✅ (secret girilince saniyelik)
`order.paid/canceled/shipped/delivered` → receipt geri-çekilir → `sales` +
`sale_items` (SKU'lu) upsert → audit log.
- **Doğruluk:** Etsy `receipt.status` (0080 sözlüğü); ciro filtreleri
  (`<> 'cancelled'`) artık gerçek veriyle çalışıyor.
- Cron aynı şeyi `min_last_modified` penceresiyle günlük uzlaştırır — webhook
  kaçarsa en geç 24 saatte kapanır.

### B. Kargolandı → tartılmış gramaj 🔜 (ShipStation SHIP_NOTIFY)
`SHIP_NOTIFY` → shipment geri-çekilir → `internalNotes` gramajı SKU'suna
yazılır (yalnız boşsa; `weight_source='shipstation'` mevcut değeri ezmez) →
altın maliyeti o satış için yeniden kurulur.
- **Doğruluk:** fiziksel tartı = ağırlık hiyerarşisinin tepesi
  (tartı > açıklama > açıklama-ölçekli > çıkarım). Açıklama motorunun güven
  kapısı da bu hiyerarşiyi kullanıyor.

### C. Düşük stok / tükendi uyarısı 🔜 (zincir A'ya küçük ek)
`order.paid` işlenirken satılan SKU'ların varyant `quantity`'si kontrol edilir;
eşik altı → Uyarı Merkezi'ne kritik kutu ("X varyantı son N adet → şu ciro
riske giriyor → stok gir ya da listing'i pasifle" — insancıl metin ilkesi).
- **Doğruluk:** Etsy inventory API (panel stok verisi Etsy'den senkronlu).

### D. Sipariş → görev üretimi 🧭 (Görevler modülüyle birleşim)
- `order.paid` + kişiselleştirme/varyasyon notu → otomatik "hazırla" görevi
  (termin = kargo profili işlem süresi; ikon/renk skalasıyla çizelgeye düşer).
- `order.delivered` + 3 gün → "yorum iste / takip et" görevi.
- **Doğruluk:** görev tamamlanınca kapatan yine olaydır (shipped/delivered
  webhook'u görevi otomatik "bitti"ye çeker → kırık cam animasyonu çizelgede).

### E. İptal oranı sinyali 🧭
`order.canceled` birikimi → listing başına iptal oranı (mevcut
`listing-health` sinyaliyle aynı kök) → eşik aşımında Uyarı Board'una
"tedarik sorunu" kutusu.
- **Doğruluk:** `sales.status='cancelled'` artık gerçek Etsy durumundan.

### F. Bekçinin bekçisi 🧭 (webhook sağlık izleme)
Günlük cron, son 24 saatte webhook'tan işlenen olay sayısını (audit log'daki
`Etsy Webhook` kayıtları) API'nin `min_last_modified` penceresindeki gerçek
değişiklik sayısıyla karşılaştırır; belirgin açık → "webhook düşmüş olabilir,
portal'ı kontrol et" uyarısı.
- **Doğruluk:** cron'un tam taraması — sinyal katmanı bozulsa da veri katmanı
  kendini kanıtlar.

## 4. Alan-bazlı "kesin doğruluk kaynağı" tablosu

| Veri | Kesin kaynak | Panele akış |
| --- | --- | --- |
| Sipariş durumu | Etsy `receipt.status` | webhook (sn) + günlük cron |
| Satış kalemi/varyant | SKU (listing = SKU klasörü) | transaction.sku → `sale_items.sku` |
| Ağırlık | ShipStation tartısı → açıklama → çıkarım | hiyerarşik `weight_source` |
| Ücret/komisyon | Etsy ledger | günlük cron → `costs` |
| Stok | Etsy inventory | varyant senkronu + (C) zinciri |
| Yorum metni/puanı | Etsy reviews API | günlük cron |
| Yorum YANITI | **Panel** (API vermiyor) | `reconcile_reviews_after_sync` alıcı-düzenlemesini geri bildirir |
| Görev/uyarı durumu | Panel (audit log'lu) | olay zincirleri besler |

## 5. Yol haritası (değer/efor sıralı)

1. **`ETSY_WEBHOOK_SECRET` gir** (10 dk, kod yok) → zincir A saniyelik çalışır.
2. **ShipStation webhook aboneliği + alıcı** (~yarım gün kod) → zincir B;
   `subscribe` çağrısı tek seferlik, alıcı Etsy alıcısıyla aynı desen.
3. **Düşük stok kritik uyarısı** (küçük ek, webhook işleyicisine) → zincir C.
4. **pg_cron ile saatlik uyarı değerlendirme** (Hobby cron sınırını DB'de aş).
5. **Sipariş→görev, delivered→yorum görevi** (Görevler entegrasyonu) → zincir D.
6. **Webhook sağlık bekçisi** (mevcut cron'a ~30 satır) → zincir F.
7. Etsy yeni olay yayınladıkça (listing/review bekleniyor) aynı alıcıya case
   eklemek yeterli — mimari hazır.

## 6. ShipStation veri envanteri — ne var, hangi analiz DOĞRU yorumlanır

Panelde halihazırda senkronlanan tablolar: `shipstation_orders` (sipariş,
durum, toplam), `shipstation_shipments` (kargo: `ship_date`, `carrier_code`,
`service_code`, `shipment_cost_cents`, `insurance_cost_cents`, `voided`,
takip no), `shipstation_order_items` (SKU'lu kalemler), carriers/customers/
products + ham `raw` jsonb (API'nin verdiği her alan saklı: ağırlık,
paket boyutları, depo konumu, etiket bilgisi).

### Güvenle yapılabilecek analizler (kesin kaynaklı)
| Analiz | Kaynak alanlar | Neden güvenilir |
| --- | --- | --- |
| **Kargo kâr sızıntısı** (sipariş başına: alıcıdan alınan kargo − ödenen etiket) | Etsy `shipping_cents` ↔ `shipment_cost_cents` (+sigorta) | Etiket maliyeti ShipStation'ın FATURALANDIĞI tutar — tahmin değil |
| **İşleme süresi** (sipariş → kargo; Star Seller sinyali) | Etsy `order_date` ↔ `ship_date` | İki taraf da kendi kesin zaman damgası |
| **Taşıyıcı/servis maliyet karşılaştırması** (USPS vs UPS vs FedEx, servis bazında $/gönderi) | `carrier_code`, `service_code`, `shipment_cost_cents` | Gerçek ödenen tutarlar; servis seçim optimizasyonuna doğrudan girdi |
| **Gerçek tartı ağırlığı** (varyant gramajı hiyerarşisinin tepesi) | `raw.weight` + `internalNotes` | Fiziksel tartı — bugün varyant dolumunda kullanılıyor |
| **SKU bazlı kargo maliyeti** (hangi ürün ailesi kargoda pahalı) | `shipstation_order_items.sku` × shipment maliyeti | SKU zinciri uçtan uca (Etsy transaction → ShipStation item) |
| **Paket boyutu/desi analizi** | `raw.dimensions`, `raw.weight` | Etiket fiyatlandırmasının gerçek girdileri |

### Dikkat gerektiren yorumlar (yanlış okumaya açık)
- **`voided` etiketler MUTLAKA hariç tutulmalı** — iptal edilen etiket maliyet
  DEĞİLDİR; toplam kargo giderine katılırsa gider şişer. (Mevcut maliyet
  aktarımında filtre var; yeni analizlerde de unutulmamalı.)
- **Çoklu gönderi**: bir sipariş birden çok shipment taşıyabilir (bölünmüş
  paket) — sipariş-başına maliyet `sum(shipments)` ile hesaplanır, ilk kayıtla
  değil.
- **Teslim süresi ≠ ship_date farkı**: ShipStation "teslim edildi"yi etiket
  verisinden bilmez; teslim tarihi ancak Etsy `order.delivered` webhook'undan
  ya da taşıyıcı takip API'sinden gelir. Kargo süresi analizi bu yüzden
  "işleme süresi" (kesin) ve "yol süresi" (yalnız delivered sinyaliyle kesin)
  olarak ayrılmalı.
- **`order_status` ShipStation'ın kendi yaşam döngüsüdür** (awaiting_shipment,
  shipped, cancelled…) — Etsy durumuyla karıştırılmamalı; sipariş durumu
  gerçeği Etsy'dedir, ShipStation operasyon gerçeğidir (etiket/kargo).
- **Para alanları kendi kurunda** — cent + currency kuralı burada da geçerli;
  farklı kurlar tek sayıya toplanmaz.

### ShipStation webhook aboneliği (zincir B'nin tetiği)
`POST /webhooks/subscribe` ile `SHIP_NOTIFY` (kargolandı) ve `ORDER_NOTIFY`
(sipariş içe aktarıldı) olaylarına abone olunur; payload'daki `resource_url`
çekilir (aynı dört-katman desen). Böylece: kargolandığı anda → gerçek etiket
maliyeti + tartı ağırlığı işlenir → kargo kâr sızıntısı ve işleme süresi
metrikleri GÜNCEL kalır; gün sonunu beklemez.

## 7. Sınırlar / dersler

- Etsy webhook seti bugün YALNIZ sipariş yaşam döngüsü; yorum yanıtı hiçbir
  API yüzeyinde yok — orada panel tek doğruluk kaynağı olmak zorunda.
- Vercel Hobby: her cron günde 1 kez; sıklık artırma denemesi deploy'u düşürür
  (yaşandı). Gerçek-zamanlılık ihtiyacı = webhook; ara-sıklık ihtiyacı = pg_cron.
- İmza + 5 dk timestamp penceresi + idempotent upsert olmadan webhook alıcısı
  açılmaz (replay/forge koruması).
