# Satış & Maliyet Takibi — muhasebe kuralları ve veri modeli

_2026-11-04 · Excel "etsy-satis-maliyet-takip" yüzeyinin panel karşılığı
(`/satislar/maliyet`, satış detayı, listing detayı "Satışlar & maliyet tarihçesi").
Migration `0174_sale_item_pnl.sql`, görünüm `sale_item_pnl`._

## Ne yapar

- **Satılan kalemler Etsy'den gelir** (`getShopReceipts`, gömülü transactions).
  Panel artık receipt gövdesinin tamamını aynalar: `refunds[]` → `sale_refunds`,
  `shipments[]` → `sale_shipments`, `total_price / vat / gift_wrap / is_gift /
  message_from_buyer / payment_method / shipped` → `sales`; kalemde
  `shipping_cost / variations / shipped_timestamp / kuponlar` → `sale_items`.
- **Her kalemde dört COGS alanı elle girilir:** altın, işçilik, taş (varsa),
  paketleme. Elle giriş `costs` tablosuna `source='manual'` + `cost_kind` ile
  yazılır; AYNI türdeki otomatik motor satırını (gram × ayar: `gold_auto`)
  görünümde ezer ve motor o kaleme bir daha dokunmaz. Boş bırakıp çıkmak elle girişi siler; motor değeri geri gelir.
  Sınır: motor satırı silinmez, bu yüzden İşletme Karı ve taraf toplamları
  ikisini birden sayar; `cogs_source_conflict` (0179) bunu gösterir.
- **İade** Etsy'den (receipt.refunds) okunur ve kalemlere satır toplamı payıyla
  dağıtılır. Eski iadeli siparişler (bu sürümden önce okunmuş) için
  "İade verisini çek" butonu / cron `payments` fazı receipt'i tek tek yeniden
  okur (`refunds_synced_at`). Okunana kadar tutar **"bilinmiyor"** gösterilir,
  0 uydurulmaz.
- **Kargo etiketleri** siparişe bağlanır: ShipStation gönderisi `order_number =
  receipt_id` ile KESİN; Etsy ledger `shipping_labels` kaydı ise zaman
  eşleşmesiyle (ledger anı ↔ kalem `shipped_at`, ±15 dk, tek aday). **İade
  etiketi** (`shipping_labels_usps_return`) alıcı paketi taratınca kesildiği için
  zamanla eşleşmez → satış detayından elle bağlanır (adaylar ±45 gün, yakınlık
  sırası). Bağlanan kayıt aylık "Etsy kargo (YYYY-MM)" özetinden DÜŞER
  (çift sayım yok); bağ çözülünce geri döner.
- **Tek satırda her şey:** satış · indirim · kargo geliri · iade · net gelir ·
  Etsy ücreti · etiket · iade etiketi · altın · işçilik · taş · paket · COGS ·
  toplam maliyet · net kâr · marj. CSV dışa aktarım aynı kolonları verir.
- **Ürün sayfası:** listing detayında satış kalemleri + birim maliyet tarihçesi
  (işçilik/altın/taş çizgisi) + "işçilik değişimi" rozeti (son satış − önceki).

## Muhasebe kuralları (araştırma özeti)

Kaynaklar: IRS Pub 334 / Pub 538 / Schedule C talimatları, Etsy Help (sales tax,
1099-K, refund, chargeback), Etsy OpenAPI 3.0 (canlı JSON), accountingtools.

| Konu | Kural | Panelde |
| --- | --- | --- |
| Gelir | Ürün + alıcının ödediği kargo − indirim. **Vergi gelir değildir**: Etsy marketplace facilitator olarak toplar ve öder; 1099-K dışıdır. | `gross_revenue_cents` vergisiz; `tax_alloc_cents` ayrı gösterilir. `sales.grand_total` vergi içerir (Etsy "Genel toplam"), kâr hesabında kullanılmaz. |
| İade | Kontra gelir (Schedule C satır 2 "Returns and allowances"), maliyet değil. | `refund_alloc_cents` net gelirden düşer. |
| COGS | Ürüne fiziksel olarak giren: metal, taş, bağlantı/döküm/kaplama işçiliği, paketleme. Tanıma anı: ürün alıcıya geçince. Küçük işletme istisnası (§471(c), ≤ 31 M$ ciro) malzemeyi "kullanıldığı yıl" gider yazmaya izin verir → fiilen satış anında COGS. | `gold + labor + gem + packaging − recovered`. Kalem tarihi = sipariş tarihi. |
| Metal maliyetleme | Fungible altın için ağırlıklı ortalama; değerli taş ve ısmarlama parçada özgül tanımlama. | Motor: gram × ayar alım fiyatı (org ayarı). Elle giriş gerçek alım değerini yazar (özgül tanımlama). |
| Satış giderleri | Etsy işlem/işleme/listing/offsite ads ücreti, gidiş etiketi, iade etiketi, reklam: COGS DEĞİL. | `etsy_fees_alloc`, `shipping_label`, `return_label`, `other`. Katkı marjı için net gelirden düşer. |
| İade edilen ürün | Stoğa dönerse COGS orijinal maliyetle geri çevrilir; satılamazsa hurda/eritme değeri (Pub 538: hammadde hurda değerinin altına inmez). | Kalemde "Ürün geri geldi" + `recovered_cents`; COGS'tan düşer. |
| Chargeback | Banka karar verir; Etsy Purchase Protection ≤ 250 $ karşılayabilir, fazlası satıcıda. Kaybedilen chargeback = satış iadesi + varsa ücret. | Ledger `CHARGEBACK_DEBIT` aylık özette; sipariş bağı elle (`link_ledger_entry_to_sale`, tür `other`). |
| Marj tanımı | Brüt marj = net gelir − COGS. Katkı marjı = − değişken satış giderleri. Net kâr = − sabit gider. | Kalem satırı katkı marjını verir ("net kâr"). İşletme seviyesi (sabit gider) `/maliyetler` İşletme Kârı kartında. |

## Etsy API sınırları (dürüstçe)

- `ShopReceipt`'te `adjusted_grandtotal` yoktur; iade sonrası tutar `Payment`
  nesnesindedir (`getShopPaymentByReceiptId`). Panel iadeyi `refunds[]`
  toplamından alır.
- Ledger etiket kaydı (`shipping_labels`, `reference_type=shipping_label`)
  **etiket id'si** taşır, receipt id değil; etiket ucu yoktur. Bu yüzden zaman
  eşleşmesi + ShipStation kesin bağı + elle bağlama üçlüsü kuruldu.
- İade etiketi için ayrı resmî tür belgelenmemiştir; canlı ledger'da
  `shipping_labels_usps_return` olarak görünür (Jade: 225 kayıt).
- `ledger_type` için Etsy resmî enum yayınlamadı; sözlük canlı veriden
  türetildi ve 0178'den beri tabloda yaşar (`etsy_ledger_type_classes`, 57 tür,
  muhasebe sınıfı + sipariş ücreti bayrağı). Yeni tür gelince
  `ledger_type_unknown` kontrolü yanar.
- **İade satırının kimliği (ölçüm 2026-11-08):** `REFUND_GROSS` ve
  `REFUND_PROCESSING_FEE` satırlarının `reference_id`'si `payment_adjustment`
  kimliğidir; receipt ya da payment id ile 0/1.922 eşleşir. Siparişe köprü, aynı
  saniyede yazılan tek `sales_tax_refund` satırıdır (reference = receipt id):
  Jade'de 1.690/1.922 iade böyle tek siparişe bağlanır. `transaction_refund`
  aynı saniyede yazılmaz; işlem ücreti iadesi sonradan gelir.
- **İşleme ücreti kuralı (ölçüm):** `PAYMENT_PROCESSING_FEE` 10.277/10.277
  ödemede tam olarak %3 + $0,25. Tam iadede ücretin tamamı geri gelir
  (1.488/1.488), kısmi iadede yalnız %3 gelir ve $0,25 satıcıda kalır (184/203).
- **İade zamanı (ölçüm):** iadelerin %36'sı sipariş ayından sonraki bir ayda,
  %4,3'ü sonraki yılda gelir (medyan 8,9 gün, p90 31,5 gün). Dönem görünümünde
  iade, iade tarihine yazılmalıdır; sipariş satırındaki pay dağıtımı bunu
  göstermez.

## Veri modeli

- `costs.cost_kind` (`gold|labor|gem|packaging|shipping_label|return_label|other`),
  `costs.external_key` (`ledger:<entry_id>` | `ss:<shipment_id>`, org içinde tekil).
- Elle kalem maliyeti tekilliği: `(sale_item_id, cost_kind) where source='manual'`.
- `sale_refunds (sale_id, refunded_at, amount_cents)` tekil; `sale_shipments
  (receipt_shipping_id)` tekil.
- `sales.refunded_cents / refund_count / last_refund_at / refunds_synced_at`.
- `sale_items.returned_at / recovered_cents / return_note` (+ Etsy alanları).
- Görünüm `sale_item_pnl` (security_invoker): sipariş seviyesindeki tutarlar
  (indirim, kargo geliri, iade, Etsy ücreti, siparişe bağlı etiket) kalemlere
  `line_total / Σ line_total` payıyla dağıtılır (Σ = 0 ise eşit).
- RPC'ler: `rebuild_sale_shipping_label_costs(org)` (service_role),
  `link_ledger_entry_to_sale(entry_id, sale_id, kind)` (authenticated).
  `rebuild_etsy_ledger_costs` / `rebuild_shipstation_costs` bağlanan kayıtları
  aylık özetten düşer; `rebuild_gold_costs`
  elle gold/labor girilmiş kalemi atlar.

## Çalıştırma sırası (senkron)

1. sales → listings → reviews → ledger → extras → payments (+ iade geri doldurma)
2. `rebuild_sale_shipping_label_costs` → `rebuild_etsy_ledger_costs` →
   `rebuild_sales_etsy_fees` → altın/sabit maliyet motorları → ürün bağ tamiri.

ShipStation senkronu da gönderi bağlamayı aylık özetten önce koşar.

## Kontrol döngüleri (0178, 0179)

`accounting_checks(org)` 14 salt okunur kontrolü tek seferde koşar; başarısız
olanlar Uyarı Merkezi'ne düşer, yeşile dönen Görevler'e "Çözüldü" izi bırakır.
Liste ve eşitlikler: `docs/muhasebe/senaryo-matrisi.md`. Elle koşulabilir
sorgular: `docs/muhasebe/kontrol-donguleri.sql`. 0179 çürütücülerin bulduğu
dört kusuru düzeltti: K1 aynı saniyedeki satır sırasına güveniyordu, K3 iadeyi
tek kaynaktan okuyordu, K5 boş kargo alanını "kargolanmadı" sayıyordu, K8
reklamın bir günlük kaymasını bilmiyordu. Üç kontrol de ekledi: K12 ledger
tazeliği, K13 ShipStation çift sayımı, K14 maliyet kaynağı çakışması. Ayrıca
Etsy kargo kaydı tablosunun (`sale_shipments`) kısmi tekil indeksini tam
indeksle değiştirdi: senkronun upsert'ü 42P10 ile düşüyor, tablo boş kalıyordu.

Bugün bilinen dört motor kusuru kontrollerde görünür, kodda henüz düzeltilmedi:

- `rebuild_sales_etsy_fees` işleme ücreti iadesini payment id ile arar (satır
  payment_adjustment kimliği taşır, dal ölü), `reference_type = 'etsy'` olan
  Offsite Ads satırlarını ve Offsite iadesini saymaz (`order_fee_gap`).
- Altın maliyet motoru iptal edilen siparişe de maliyet yazar ve İşletme Karı
  onu toplar (`cancelled_order_cogs`).
- Siparişe bağlanan ShipStation gönderisi aylık özetten yalnız başarılı
  ShipStation senkronunda düşer; senkron dururken postaj iki kez sayılır
  (`postage_double_count`).
- Elle ya da faturayla girilen kalem maliyetinin yanında motor tahmini de
  durur; `sale_item_pnl` elle olanı öne alır ama İşletme Karı ve taraf
  toplamları ikisini birden toplar (`cogs_source_conflict`).

## Bilinen sınırlar / sonraki adımlar

- Ücret paylaştırması kalemlere satır payıyla yapılır; işlem ücreti aslında
  transaction başına ledger'da vardır (reference_id = transaction_id). Çok
  kalemli siparişlerde kalem başı ücret birebir istenirse `per_transaction`
  CTE'si görünüme taşınabilir.
- İade dağıtımı da pay bazlıdır; kısmi iadenin hangi kaleme ait olduğu
  `Payment.payment_adjustments[].transaction_id` ile öğrenilebilir (henüz
  senkronlanmıyor).
- Ürün başına "standart işçilik" (güncel sabit) henüz yok; tarihçe panelindeki
  son/ortalama işçilik bunun vekilidir. Varyans analizi (standart − gerçek) için
  `product_standard_costs` tablosu sonraki adım.
