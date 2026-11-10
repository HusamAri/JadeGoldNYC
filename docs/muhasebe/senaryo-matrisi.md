# Muhasebe senaryo matrisi: Etsy'den gelmeyen bilgi

_2026-11-09 · ölçümler canlı Supabase'de 2026-11-08 ve 2026-11-09 · canlı kontroller `accounting_checks` (0178, 0181) · üreteç `kaynak/render.py`_

## Neden bu belge

Sahibin isteği: Etsy API'sinin hiç vermediği ya da eksik verdiği her bilgi (maliyet, iade, reklam, kargo, Etsy Payments) için muhasebe doğru tutulabilsin. Her senaryoda bilginin girileceği bir alan ve bozulduğunda haber veren bir kontrol döngüsü olsun. Bu belge 6 boyutta yazılan 88 senaryonun kod ve canlı veriyle çürütülmüş, birleştirilmiş ve önceliklendirilmiş halidir: 44 kanonik senaryo ve tamlık eleştirmeninin bulduğu 5 ek senaryo. Kontrol döngülerinin canlıda olanları Uyarı Merkezi'ne düşer.

## Nasıl okunur

- **Şerit:** A panel alanı (migration ve ekran), B senkron ya da motor kodu, C kontrol döngüsü (eşitlik, uyarı, kadans), D sahip rutini (aylık CSV, elle giriş), E kabul edilen sınır.
- **Öncelik:** P0 yanlış kar, zarar ya da vergi rakamı; P1 sahibin kararını bozar; P2 eksik ama sınırlı; P3 hijyen.
- **Efor:** S yarım günden az, M 1 ile 2 gün, L 2 günden fazla.
- **Kimlik:** bölüm öneki ve sıra (GEL-01). Kaynak senaryo kimlikleri (LED, REF, REK, KRG, PAY, COGS, EK) ayrıntı dosyalarında durur.
- **K1..K14:** `accounting_checks` kontrol numaraları (aşağıdaki tablo).
- **Ayrıntı:** her bölümün dosyası `senaryolar/` altında; elle koşulabilir sorgular `kontrol-donguleri.sql`; ham analiz ve çürütme kayıtları `kaynak/` (otomatik okunmaz).

## Muhasebe modeli tek sayfa

- **Gelir:** ürün, alıcının ödediği kargo ve hediye paketi, eksi indirim. Kaynak `sales.item_total_cents` (Etsy subtotal, indirim sonrası) + `shipping_cents` + `gift_wrap_cents`; indirim ikinci kez düşülmez.
- **Vergi emaneti:** alıcıdan toplanan satış vergisi ve VAT gelir değildir; Etsy marketplace facilitator olarak toplar ve öder. `sales.grand_total_cents` vergiyi içerir ve kar hesabında kullanılmaz. Vergi iadesi de gelirden düşülmez.
- **İade:** kontra gelirdir (Schedule C satır 2). Sipariş görünümünde siparişe, dönem görünümünde iade tarihine yazılır: iadelerin yüzde 36'sı sipariş ayından sonra, yüzde 4,3'ü sonraki yılda gelir.
- **Satılan malın maliyeti (COGS):** altın, işçilik, taş ve paketleme, eksi geri kazanılan (stoğa dönen ya da hurdaya giden parça). Tanıma anı ürünün alıcıya geçmesidir: iptal edilip kargolanmayan siparişin COGS'u yoktur. Kaynak önceliği elle, sonra fatura, sonra motor tahmini.
- **Satış giderleri:** Etsy işlem, işleme, listing ve Offsite Ads ücreti, gidiş ve iade etiketi, Etsy Ads ve Etsy dışı reklam. COGS değildir.
- **Katkı marjı ve İşletme Karı:** katkı = net gelir - COGS - değişken satış gideri; İşletme Karı = katkı - sabit gider (abonelik, yazılım, kira).
- **Nakit katmanı ayrıdır:** DISBURSE2 payout, RECOUP karttan ya da bankadan, billing_payment karttan tahsil, ADYENBALANCE_REVERSAL geri dönen payout (PAYMENT_GROSS bu katmanda değildir: 0178 sözlüğünde 'tahsilat' sınıfıdır, tahakkuk görünümünde gelir sales tablosundan kurulur ve PAYMENT_GROSS ikinci kez sayılmaz, nakit esasında ve vergi paketinde gelir PAYMENT_GROSS eksi vergidir, NAK-03 satır 1). Bunlar kara girmez; ledger kimliği (açılış + toplam tutar = son bakiye) nakdi doğrular.
- **Dönem:** kapanan ayın rakamı kilitlenir; sonradan gelen iade ve düzeltme yeni aya yazılır (NAK-02).

## Ölçülen temel gerçekler

| Ölçüm | Değer | Anlamı |
| --- | --- | --- |
| İade satırının kimliği | REFUND_GROSS ve REFUND_PROCESSING_FEE reference_id = payment_adjustment; receipt ya da payment id ile 0/1.922 eşleşme | Bu satırları payment ya da receipt id ile birleştiren her sorgu sıfır döner. |
| API'siz iade köprüsü | 1.922 iadenin 1.690'ında aynı saniyede tek sales_tax_refund (reference = receipt); bağlanan tutar $608.713,70 / $701.506,62 | İade siparişe API çağrısı olmadan bağlanır; vergisiz siparişte bu köprü yoktur. |
| Kalem ve Offsite bağı | transaction_refund 1.958/1.958 kaleme; Offsite 'etsy' satırı 369/369, Offsite iadesi 156/156 receipt'e eşleşir | Offsite ücreti ve iadesi siparişe bağlanabilir. |
| İşleme ücreti kuralı | 10.277/10.277 ödemede yüzde 3 + $0,25; köprülü 1.690 iadede tam iadenin tamamı geri gelir (1.487/1.487), kısmi iadede çoğunlukla yalnız yüzde 3 (184/203) | İade işleme ücreti siparişe bu kuralla yazılır. |
| İade zamanı | 1.901 iadeli siparişin 687'si (yüzde 36) sonraki ayda, 82'si (yüzde 4,3) sonraki yılda; medyan 8,9 gün, p90 31,5 gün | Dönem görünümü iadeyi iade tarihine yazmalı. |
| İptal statüsü | İadeli 1.901 siparişin 1.388'i cancelled | İptal çoğunlukla tahsil edilip iade edilmiş siparişlerdir. |
| Ledger kimliği | 4 Etsy org'unda toplam tutar = son bakiye (açılış 0) | Ledger'da boşluk yok; günlük ucuz kontrol (K1). |
| Aynı saniyede çok satır | Jade son 91 gün: 39 gün sonu son saniyesi çok satırlı; 0178 kuralı 13 günde sahte kırılma verirdi, 0181 kuralı 0 | K1 açılış ve kapanışı ilk ve son saniyedeki zincir ucundan seçer; uç tekil değilse o saniyenin adayları denenir. |
| Ücret kapsamı | Jade canlı 8.314 siparişin 7.461'inde etsy_payment_id boş | Sipariş ücreti motoru işleme ücretini siparişe bağlayamıyor (K4). |
| having tuzağı | Net maliyeti 0 ya da altı olan ay aylık özetten düşer: Jade 2 ay $10,08, Artifact 1 ay $5,70 | Kredi ayları sessizce kaybolur (SIS-01). |
| Eşlenmeyen ledger türleri | Jade 25.657 satır, 16 tür, net +$437.541,33 | Çoğu gider değil nakit ve emanettir; sözlük bunları sınıflar. |
| Offsite oranı | Jade receipt tipli ücretlerde ortalama yüzde 12,04 ve 15 tavan (tüm 757 ücrette 34 tavan); EON 6/6, Artifact 1/1 tavanda | Oran ve tavan org ayarı olmalı (RKL-04). |
| İptal siparişte COGS | Jade 815 iptal siparişte $414.892,48 motor maliyeti; kargo kanıtı olmayan ve kanıtın aranabildiği 516 sipariş $280.517,60, bunun 319'u hiç tahsil edilmedi ($162.391,17); kargo kaydı tutulmayan dönemde 225 sipariş $98.964,40 bilinmiyor | Geçmiş yılların karı bu tutar kadar düşük; İşletme Karı kartının 6 aylık penceresine düşen kısım $8.785,66 (K5, MAL-02). |
| Etsy kargo kaydı boştu | sale_shipments 5 org'da 0 satır: 0174'ün kısmi tekil indeksi senkron upsert'ünü her seferinde 42P10 ile düşürüyordu | 0181 indeksi düzeltti; receipt yeniden okundukça gönderi kaydı dolar (SEV-01, MAL-02). |
| ShipStation çift sayım | Jade ShipStation gider satırları $24.882,40, iptal edilmemiş gönderilerin postaj ve sigorta toplamı $12.605,14 | İşletme Karı'nda $12.277,26 fazla kargo gideri (K13, SEV-02). |
| Kaynak çakışması | EON 10 kalemde motor maliyeti fatura ya da elle maliyetin yanında duruyor: $2.297,32 | İşletme Karı'nda hayalet maliyet (K14, MAL-01). |
| Vergi gelirde | Jade iptal dışı satış vergisi $141.721,03 (tüm dönem) panel kar kartı gelirinde; operating_profit_monthly'nin 6 aylık penceresinde $6.456,86 | Panel kar kartı ve İşletme Karı vergiyi kar sayıyor (GEL-01). |
| etsy_connection okunamaz | RLS açık, politika yok | security invoker bir kontrol bu tabloya dayanırsa oturumda hep yeşil kalır; K12 yalnız ledger, satış ve mağaza fotoğrafı (etsy_shop_snapshots) verisine bakar; üç tablonun da org süzgeçli select politikası var. |

## Kontrol döngüleri: canlıda

`accounting_checks(org)` her kontrolü tek satır döner; başarısız satır Uyarı Merkezi'nde görünür, yeşile dönen Görevler'e "Çözüldü" izi bırakır. Değerler 2026-11-09 canlı çıktısıdır (5 org).

| No | Anahtar | Eşitlik | Bugün | Senaryo |
| --- | --- | --- | --- | --- |
| K1 | `ledger_balance_break` | açılış + toplam tutar = kapanış; açılış ve kapanış ilk ve son saniyedeki zincir ucundan seçilir (aynı saniyedeki satır sırası API'den gelmez) | 5 org tutuyor | SIS-02 |
| K2 | `refund_backlog` | iadeli ve 2 günden eski siparişte iade tutarı okunmuş (refunds_synced_at dolu) | Jade 567 sipariş, $188.109,29 | IAD-01 |
| K3 | `refund_status_mismatch` | ledger iade sinyali olan sipariş iade ya da iptal statüsünde ve okunan tutar köprülü ledger tutarından en çok $1 farklı; sinyal aynı saniye vergi köprüsü, siparişin vergi iadesi ya da vergisiz siparişte işlem ücreti iadesi | EON 4 sipariş, $2.448,80; Jade 5 sipariş, $1.803,65 | IAD-01 |
| K4 | `order_fee_gap` | siparişe ait ledger ücretleri toplamı = sales.etsy_fees_cents toplamı (tolerans $5 ya da yüzde 0,2) | Jade $60.336,42; EON $192,52; Artifact $126,75; Ophir $37,44 | UCR-01, UCR-02, UCR-03, UCR-04 |
| K5 | `cancelled_order_cogs` | kargo kanıtı olmayan iptal siparişte satış maliyeti 0; tahsil edilmiş siparişte yalnız kanıtın aranabildiği dönemde (ShipStation penceresi ya da kargo bilgisiyle okunmuş receipt) | Jade 516 sipariş, $280.517,60 | MAL-02 |
| K6 | `ledger_type_unknown` | her ledger türü etsy_ledger_type_classes sözlüğünde | 5 org tutuyor | SIS-01 |
| K7 | `ledger_cost_drift` | son 12 tam ayda aylık ledger gideri (ücret, reklam, kargo, abonelik) = etsy_ledger gider satırları (tolerans $1) | Artifact 1 ay, $29,00; Ophir 1 ay, $29,00; Jade 1 ay, $9,73 | SIS-01 |
| K8 | `ads_spend_unmeasured` | son Etsy Ads harcama günü (ledger günü eksi 1) ile son CSV günü arası en çok 14 gün; tutar yarım son CSV gününü de sayar | Jade $4.706,21; EON $595,26; Ophir $362,77; Artifact $309,96 | RKL-01 |
| K9 | `shipstation_sync_failing` | bağlı ShipStation son 3 günde hatasız senkronlandı | Jade yanıyor | SEV-03 |
| K10 | `labels_unlinked` | son 90 günde her Etsy etiketi bir siparişe bağlı | EON 55 etiket, $424,18; Jade 14 etiket, $106,56; Ophir 3 etiket, $30,94; Artifact 1 etiket, $5,70 | SEV-01 |
| K11 | `chargeback_unlinked` | her CHARGEBACK_DEBIT bir siparişe bağlı | Jade 2 ters ibraz, $595,65 | IAD-04 |
| K12 | `ledger_stale` | sipariş tarihi ledger'ın son kaydından 3 günden sonra olan ve panele en az bir gün önce yazılmış Etsy satışı yok; ledger'ın son kaydına kadarki 30 günün en az 20'sinde ledger kaydı alan mağazada mağaza fotoğrafı ledger'ın son kaydından en çok 5 gün ileride | 5 org tutuyor | SIS-02 |
| K13 | `postage_double_count` | ShipStation gider satırları toplamı = iptal edilmemiş gönderilerin postaj ve sigorta toplamı (tolerans $1) | Jade $12.277,26 | SEV-02 |
| K14 | `cogs_source_conflict` | elle ya da faturayla maliyetlenmiş kalemde aynı türde motor (gold_auto) satırı yok | EON 10 kalem, $2.297,32 | MAL-01 |

## Senaryolar

### 1. Gelir ve vergi emaneti

Gelirin tek tanımı, Etsy'nin topladığı vergi emanetinin gelirden ayrılması ve yıllık 1099-K brüt mutabakatı. Satış kalemi, kargo ve hediye paketi gelir, satış vergisi ile VAT emanet sayılır. Ayrıntı: [senaryolar/01-gelir.md](senaryolar/01-gelir.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| GEL-01 | Gelir tek tanıma iner: vergi emaneti ve iadedeki vergi gelirden ayrılır | P0 | M | A, B, C | öneri: `sales_tax_mismatch` |
| GEL-02 | 1099-K brüt tutarı ile panel brütünün yıllık mutabakatı | P1 | S | A, C, D | öneri: `tax_form_mismatch` |
| GEL-03 | Etsy dışı satış (elle giriş, Shopier, receipt kimliksiz CSV): tahsilat kanalı, kanal ücreti, kalem satırı ve satıcının beyan edeceği satış vergisi | P3 | M | A, C, D, E | öneri: `non_etsy_sale_incomplete` |

### 2. İade, iptal ve chargeback

İadenin kontra gelir olarak okunup siparişe bağlanması, iptal siparişin tahsilat durumu, kısmi iadenin kaleme dağıtımı, chargeback ve Etsy dışı iade. Ayrıntı: [senaryolar/02-iade.md](senaryolar/02-iade.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| IAD-01 | İade kontra geliri: ledger köprüsü ve tam receipt yeniden okuması (iade tutarı panelde yok) | P0 | M | A, B, C | canlı: K2 `refund_backlog`, K3 `refund_status_mismatch` |
| IAD-02 | İptal siparişin tahsilat durumu: hiç tahsil edilmedi, tahsil edilip iade edildi ya da para satıcıda kaldı | P1 | M | A, B, C, D | öneri: `cancelled_settlement_open` |
| IAD-03 | Kısmi iade hangi kaleme ait: pay dağıtımı yerine ledger transaction_refund ağırlığı | P2 | M | A, C | öneri: `partial_refund_unattributed` |
| IAD-04 | Chargeback (CHARGEBACK_DEBIT): kontra gelir, sipariş bağı ve itiraz sonucu | P2 | M | A, B, C, D | canlı: K11 `chargeback_unlinked` |
| IAD-05 | Etsy dışı iade (havale, PayPal, nakit, mağaza kredisi): kaynak, yöntem ve denetim izi | P3 | S | A, C, D | öneri: `manual_refund_no_ref` |
| IAD-06 | Açık dönem iade karşılığı: son 30 günün ve yeni kapanan ayın karı henüz gelmemiş iade ve iptalleri taşımıyor | P2 | M | A, B, C, D | öneri: `refund_reserve_drift` |

### 3. Etsy ücretleri ve kredileri

Sipariş bazlı Etsy ücretleri (işleme, iade işleme, Offsite Ads, kargo işlem) ile Etsy kredilerinin doğru siparişe ve doğru sınıfa yazılması. Ayrıntı: [senaryolar/03-ucret.md](senaryolar/03-ucret.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| UCR-01 | İşleme ücreti (PAYMENT_PROCESSING_FEE) siparişe API'siz ledger köprüsüyle bağlanır | P1 | S | A, B, C | canlı: K4 `order_fee_gap` |
| UCR-02 | İade işleme ücreti (REFUND_PROCESSING_FEE) siparişe bağlanmıyor; tam iadede yüzde 3 + $0,25, kısmide yalnız yüzde 3 | P1 | M | A, B, C | canlı: K4 `order_fee_gap` |
| UCR-03 | Offsite Ads ücreti ve iadesi sipariş ücretine girmiyor (reference_type ve tür filtresi) | P1 | S | A, B, C | canlı: K4 `order_fee_gap` |
| UCR-04 | Kargo işlem ücreti (shipping_transaction) ve iadesi sipariş ücretine girmiyor | P2 | S | B, C | canlı: K4 `order_fee_gap` |
| UCR-05 | Etsy kredileri (Etsy Plus, Share & Save, seller_credit, MISC_CR_SL): sınıf ve sebep | P2 | M | A, B, C, D | öneri: `ledger_credit_unclassified` |

### 4. Reklam

Etsy Ads harcamasının defter (ledger) ve analitik (CSV) kaynağı, ROAS başa baş kararı, Offsite oranı, reklam gider sınıfı ve Etsy dışı reklam. Ayrıntı: [senaryolar/04-reklam.md](senaryolar/04-reklam.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| RKL-01 | Etsy Ads CSV yükleme yolu, tazelik ve ledger mutabakatı (bir günlük kayma, yalnız tam ay) | P1 | M | A, B, C, D | canlı: K8 `ads_spend_unmeasured` |
| RKL-02 | ROAS başa baş eşiği kalem karından türer, Etsy atfı düzeltilir | P1 | M | A, C | öneri: `ads_below_breakeven` |
| RKL-03 | Listing düzeyi Etsy Ads istatistiği tarihsiz ve bayat; EON'da günlük CSV listing tablosuna yanlış eşlenmiş | P2 | M | A, B, C, D | öneri: `ads_listing_stats_stale` |
| RKL-04 | Offsite Ads oranı (yüzde 12 ya da 15), $100 tavanı ve kayıt politikası org ayarında yok | P2 | S | A, C, D | öneri: `offsite_rate_mismatch` |
| RKL-05 | Reklam gider sınıfı: Offsite değişken, Etsy Ads isteğe bağlı sabit; org'lar arası is_fixed ve iki yüzey köprüsü | P2 | S | A, B, C | öneri: `cost_class_inconsistent` |
| RKL-06 | Etsy dışı reklam (Meta, Pinterest, Google, TikTok): kampanya, platform ve listing atfı | P3 | M | A, C, D | öneri: `external_ads_unreconciled` |

### 5. Kargo ve sevkiyat

Gidiş ve iade etiketinin siparişe bağlanması, ShipStation çift sayımı ve kopukluğu, kaynak dışı etiket, etiket iadesi, sigorta, ücretsiz kargo payı ve ön ödemeli postaj. Ayrıntı: [senaryolar/05-kargo.md](senaryolar/05-kargo.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| SEV-01 | Etsy gidiş ve iade etiketi siparişe bağlanmıyor: shipped_at ve iade tarihi geriye dönük boş | P1 | M | A, B, C, D | canlı: K10 `labels_unlinked` |
| SEV-02 | ShipStation postajı çift sayılıyor: aylık özet ve siparişe bağlı satır birlikte toplanıyor | P0 | S | B, C | canlı: K13 `postage_double_count` |
| SEV-03 | ShipStation 401 ile 121 gündür kopuk: cron nabzı ok=true, ayar sayfası hatayı göstermiyor | P1 | S | B, C, D | canlı: K9 `shipstation_sync_failing` |
| SEV-04 | Ledger ve ShipStation dışı etiket (gişe, Pirate Ship) ile satıcının üstlendiği gümrük için giriş yolu yok | P1 | M | A, C, D, E | öneri: `orders_without_label_cost` |
| SEV-05 | Etiket iadesi (void) ve sigorta iadesi bağlı siparişe dönmüyor; having bağ kurulunca krediyi siler | P1 | S | B, C | öneri: `label_refund_unapplied` |
| SEV-06 | Kargo sigortası primi ayrı görünmüyor; yüksek değerli gönderi sigortasız ve imzasız gidiyor | P2 | M | A, B, C | öneri: `uninsured_high_value_shipment` |
| SEV-07 | Ücretsiz kargo payı ile gerçek etiket arasındaki kayma: pricing_config.shipping_usd ile repo sabiti çelişiyor | P1 | S | B, C, D | öneri: `shipping_allowance_drift` |
| SEV-08 | Ön ödemeli postaj bakiyesi (Stamps.com, ShipStation cüzdanı): yükleme gider değil avans | P3 | S | A, C, D | öneri: `postage_funding_mismatch` |

### 6. COGS ve stok

Satılan malın maliyeti: kaynak önceliği, iptal ve iade sonrası maliyet, maliyetsiz kalem, ayar, tarihsel altın alım fiyatı, işçilik, taş, paketleme, satışsız stok çıkışı ve gerçek maliyetin fiyat tabanına dönüşü. Ayrıntı: [senaryolar/06-maliyet.md](senaryolar/06-maliyet.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| MAL-01 | Aynı kalemde üç maliyet kaynağı: invoice ve manual satırı varken gold_auto da sayılıyor | P0 | S | A, B, C | canlı: K14 `cogs_source_conflict` |
| MAL-02 | İptal edilen siparişte hayalet COGS: gelir dışlanıyor, maliyet kalıyor | P0 | M | A, B, C | canlı: K5 `cancelled_order_cogs` |
| MAL-03 | Maliyetsiz kalem tespiti sipariş düzeyinde ve 90 günlük: tarihsel ve etiket bağlı siparişler görünmüyor | P1 | S | B, C, D | öneri: `uncosted_sale_items` |
| MAL-04 | Ayar bugünkü ilan başlığından çözülüyor: 18K kalem atlanıyor, 10K satış 14K maliyetleniyor | P1 | S | B, C, D | öneri: `karat_mismatch` |
| MAL-05 | Tarihsel altın alım fiyatı yok: 2022-2025 satışları 2026-07 alım fiyatıyla maliyetlenmiş | P1 | M | A, B, C, D, E | öneri: `cogs_price_basis_stale` |
| MAL-06 | İşçilik standart maliyeti ve varyans: EON'un parça başı modeli hiç çalışmamış | P1 | M | A, B, C, D | öneri: `labor_variance_high` |
| MAL-07 | Taş maliyeti fiyat kitabında var, satış anında COGS'a yazılmıyor | P2 | M | A, B, C, D | öneri: `gem_cogs_missing` |
| MAL-08 | Paketleme: kutu alımı sabit gider yazılıyor, sipariş başı tüketim hiç yazılmıyor | P2 | S | A, B, C, D | öneri: `packaging_cogs_missing` |
| MAL-09 | İade edilen ya da kaybolan ürünün akıbeti: stoğa dönüş, hurda, kayıp tazminatı, alıcıda kalma | P1 | M | A, B, C, D | öneri: `return_disposition_missing` |
| MAL-10 | Satışsız stok çıkışı: numune, hediye, influencer, kayıp, yeniden yapım ve garanti | P3 | M | A, C, D | öneri: `stock_out_without_purpose` |
| MAL-11 | Gerçek maliyet girişi fiyat tabanını tetiklemiyor; indirim ve ücret parametresi iki kaynakta | P1 | S | A, B, C | öneri: `price_below_actual_cost` |
| MAL-12 | Stoğa dönen iade parçası: taşıma değeri, yeniden satışta stoktan tüketim ve yıl sonu stok | P2 | L | A, B, C, D | öneri: `return_stock_unvalued` |

### 7. Sabit ve Etsy dışı giderler

Etsy dışı sabit ve tedarikçi giderleri: abonelikler, tedarikçi faturası başlığı ve kur, ortaklık taraf mutabakatı. Ayrıntı: [senaryolar/07-gider.md](senaryolar/07-gider.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| GDR-01 | Abonelik ve tekrarlayan sabit giderler: üretici yok, Etsy Plus değişken sepette | P2 | M | A, B, C, D | öneri: `fixed_cost_month_missing` |
| GDR-02 | Tedarikçi faturası başlığı, kalemlere dağıtım ve kur; canlı İşletme Karı 0109 yerine 0097 gövdesiyle | P2 | M | A, B, C, D | öneri: `invoice_unallocated` |
| GDR-03 | Taraf (H, Y, I): kim katlanır ile kim ödedi ayrımı ve ay sonu ortak mutabakatı | P2 | S | A, B, C, D | öneri: `bearer_unassigned` |

### 8. Nakit, payout ve dönem kapanışı

Etsy ödeme hesabından bankaya ve karttan Etsy'ye nakit akışı, rezerv, ay kapanışı, dönem kilidi ve düzeltme kaydı. Ayrıntı: [senaryolar/08-nakit.md](senaryolar/08-nakit.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| NAK-01 | Etsy ödeme hesabı nakit mutabakatı: payout, geri dönen payout, RECOUP, kart ödemesi ve rezerv | P2 | L | A, C, D, E | öneri: `payout_unmatched` |
| NAK-02 | Ay kapanışı: dönem kilidi, düzeltme kaydı, iadenin raporlandığı ay ve raporlama esası | P1 | M | A, B, C, D | öneri: `closed_period_drift` |
| NAK-03 | Yıl sonu muhasebeci paketi: vergi formu satır eşlemesi, 1099-K köprüsü ve XLSX üzerinden Numbers teslimi | P1 | L | A, B, C, D, E | öneri: `tax_package_unreconciled` |

### 9. Sistem bütünlüğü ve ledger sözlüğü

Ledger sözlüğünün aylık gider özetine bağlanması, bakiye zinciri ve aylık ekstreyle ledger eksiksizliği. Ayrıntı: [senaryolar/09-sistem.md](senaryolar/09-sistem.md)

| ID | Senaryo | Öncelik | Efor | Şerit | Kontrol |
| --- | --- | --- | --- | --- | --- |
| SIS-01 | Aylık ledger özeti sözlüğü okumuyor: having ile düşen ay, eşlenmeyen tür ve bayat özet | P1 | M | A, B, C | canlı: K6 `ledger_type_unknown`, K7 `ledger_cost_drift` |
| SIS-02 | Ledger bakiye zinciri ve tazeliği: K1 0181 ile düzeldi, aylık ekstre ikinci kaynak | P2 | S | A, B, C, D | canlı: K1 `ledger_balance_break`, K12 `ledger_stale` |
| SIS-03 | Finansal denetim izi: 90 günlük saklama kararı, silinen iz ve audit trigger'sız finansal ayar tabloları | P2 | M | A, B, C, D, E | öneri: `audit_trail_gap` |

Toplam 49 senaryo: P0 5, P1 21, P2 18, P3 5.

## Uygulama sırası

Her adımın eforu parantez içinde yazılıdır (S yarım günden az, M 1 ile 2 gün; adım senaryonun yalnız bir parçasını kapsıyorsa efor bölüm tablosundakinden küçük olabilir); önce yanlış kar ya da vergi rakamı üretenler (P0), sonra karar bozanlar. Kontrol döngüsü olan adımda yeşile dönen kontrol işin bittiğinin kanıtıdır.

1. **SEV-02 (B, S):** `rebuild_sale_shipping_label_costs` sonunda aynı işlemde `rebuild_shipstation_costs` ve `rebuild_etsy_ledger_costs` koşsun; Jade için tek seferlik koşu. K13 yeşile döner, İşletme Karı'ndan $12.277,26 fazla gider çıkar.
2. **MAL-01 (B, S):** kaynak önceliği elle, fatura, motor her yüzeyde: `rebuild_gold_costs` faturalı kalemi atlar, elle ya da faturalı kalemin motor satırı geçersiz sayılır (`operating_profit_monthly` ve taraf toplamları dahil), 18 EON fatura satırına tür yazılır. K14 yeşile döner.
3. **MAL-02 (B, M):** motor yeni yazımda iptali zaten atlar (0174:567, lib/gold-cost-entry.ts:77 ve :382), kalan iş sipariş sonradan iptal olunca duran motor satırıdır: kanıtsız iptal maliyeti önce hiç tahsil edilmemiş 319 siparişte geçersiz sayılır; tahsil edilip iade edilmiş siparişlerde geçersiz sayma, 5. adımın receipt okuması kargo bilgisini doldurduktan sonra sahip onayıyla yapılır, çünkü o okuma kanıtın aranamadığı kovadaki 225 siparişi ($98.964,40) sınıflar ve kargolanmamış çıkanlar K5'e girer. K5 bu adımda küçülür, 5. adımdan sonraki ikinci geçişle tahsil edilip iade edilmemiş kargosuz 1 iptal ($346,43) dışında sıfıra iner; o sipariş iki geçişin de kapsamında değildir ve tahsilat durumu kararını (IAD-02, 11. adım) bekler.
4. **GEL-01 (B, M):** `operating_profit_monthly` ve panel kar kartı geliri vergisiz kurar. İadeyi iade tarihinde düşmek iade tutarını ve tarihini ister: Jade'de bugün sale_refunds 2 satır ve 567 iade statülü sipariş okunmamış, bu yüzden bu parça 5. adımdan (IAD-01) sonra kurulur ya da iptal siparişin iadesi ayrılarak ledger REFUND_GROSS köprüsünden vergisiz okunur (iade = -REFUND_GROSS eksi aynı saniyedeki sales_tax_refund; iadedeki vergi emanettir). Köprü yalnız vergili siparişte vardır: köprüsüz iadeler (Jade 1.922 iadenin 232'si) IAD-01'i bekler.
5. **IAD-01 (B, M):** iade kuyruğu statüden bağımsız tüm ledger iade sinyallerini okur ve receipt'i tam yeniden okur; COGS'lu iptaller de kuyruğa girer, böylece kargo bilgisi (is_shipped, gönderi kaydı) dolar. K2 ve K3 sıfıra iner, K5'in "bilinmiyor" kovası küçülür.
6. **UCR-01..04 (B, M):** `rebuild_sales_etsy_fees` işleme ücretini köprüyle, iade işleme ücretini ölçülen kuralla, Offsite 'etsy' satırını ve iadesini, `shipping_transaction` ve `buyer_fee` satırlarını siparişe yazar. K4 toleransa iner.
7. **SEV-03 (D, S):** sahip ShipStation'da yeni API anahtarı üretip Ayarlar'dan yeniden bağlar; ardından senkron 401'de nabzı `ok=false` yazsın (B). K9 yeşile döner.
8. **RKL-01 (A ve B, M):** Etsy Ads CSV yükleme yolu geri gelir (f43068c ile silinen eşleyici), ledger ile CSV d+1 kaymasıyla mutabık. K8 yeşile döner.
9. **SIS-01 (B, S):** `rebuild_etsy_ledger_costs` eşlemesini sözlükten okur, `having` tuzağı kalkar ve kredi sınıfı gider özetine girdiği için K7'nin kapsamına kredi sınıfı eklenir (SIS-01 kontrol döngüsü). K6 yeşil kalır, K7 yeşile döner: bugün Artifact ve Ophir $29,00 açılış ücreti, Jade $9,73 düşen kargo ayı.
10. **SEV-05 ve SEV-01 (B, M):** önce SEV-05'in (c) adımı yayına girer (etiket ve sigorta iadesi aynı reference_id'li bağlı etiketin siparişine negatif satır olarak yazılır), sonra kalem `shipped_at` alanı receipt yeniden okumasıyla dolar ve iade etiketi satış detayından bağlanır. K10 küçülür.
11. **IAD-02 (A, M):** iptal siparişin tahsilat durumu alanı: hiç tahsil edilmedi, tahsil edilip iade edildi, para satıcıda kaldı.
12. **MAL-09 (A, M):** iade ya da kayıp ürünün akıbeti alanı: stoğa döndü, hurda, kayıp tazminatı, alıcıda kaldı.
13. **SEV-04 (A, S):** Etsy ve ShipStation dışı etiket ve gümrük için satış detayında elle giriş.
14. **MAL-05 (A, M):** tarihli altın alım fiyatı tablosu; motor sipariş tarihindeki fiyatı kullanır.
15. **NAK-02 (A ve B, M):** ay kapanışı ve dönem kilidi; kapanan aya düşen sonradan değişiklik yeni aya yazılır.

**Sonraki dalga:** kalan P1, P2 ve P3 senaryolar (GEL-02, IAD-03..05, UCR-05, RKL-02..06, SEV-06..08, MAL-03, MAL-04, MAL-06..08, MAL-10, MAL-11, GDR-01..03, NAK-01, SIS-02 ve ek senaryolar) yukarıdaki bölüm tablolarında öncelik sırasıyla durur.

## Kabul edilen sınırlar

- **SEV-04:** Etsy ve ShipStation dışında alınan etiketin (gişe, Pirate Ship) ve satıcının üstlendiği gümrüğün kaydı hiçbir API'de yok; yalnız elle giriş ya da taşıyıcı dökümü CSV'siyle girer.
- **MAL-05:** 2022 ile 2025 arası satışların gerçek altın alım fiyatı kayıtlı değil; geçmiş yalnız sahibin tedarikçi faturası bulunan yıllar için tarihçeye girilir, belgesi olmayan yıllarda eski maliyet "tarihsiz" işaretlenir.
- **NAK-01:** banka tarafı Etsy'de yok; payout ile banka mutabakatı yalnız sahibin banka dökümüyle yapılır.
- **Etsy dışı satış, yıl sonu paketi ve denetim izi (ek senaryolar):** vergi beyanının ve banka kaydının kendisi panel dışındadır; panel yalnız eşleme, onay ve dondurulmuş dönem rakamını tutar.

## Ayıklananlar

- **KRG-14:** Çürütüldü: etiketli 121 iptal siparişin 120'sinde transaction_refund ShipStation sevkinden sonra yazılmış (ortalama 25,7 gün), kalan 1'inde aynı makbuza sales_tax_refund var; hepsi tahsil edildi, kargolandı ve sonra iade edildi. Etiketli 163 tam iade ya da iptalin hiçbirinde iade sevkten önce gelmedi, void edilebilir etiket kümesi 0 (SQL 2026-11-08); asıl soru ürünün dönüşü, MAL-09'a taşındı.
- **KRG-07:** Para etkisi sıfıra yakın (Jade 17 düzeltme net -$20,60, EON -$1,83; SQL 2026-11-08) ve yeni alan gerektirmiyor: reference_id'si başka hiçbir ledger satırında geçmeyen 11 orphan düzeltmenin aylık özette kalması doğru, eşleşen düzeltmeler SEV-05'in (c) adımıyla aynı yoldan siparişe yazılır; costs.adjusts_external_key ve gold_settings paket ağırlığı önerileri gereksiz (ShipStation weight_oz zaten yazılıyor).

## Kaynaklar

- Kod: `supabase/migrations/0174_sale_item_pnl.sql`, `0178_accounting_checks.sql`, `0181_accounting_checks_fixes.sql`, `lib/db/queries/alerts.ts`, `lib/etsy/sync.ts`, `lib/etsy/refunds.ts`, `lib/gold-cost-entry.ts`, `lib/shipstation/sync.ts`.
- Numara notu: `0181_accounting_checks_fixes.sql` canlıya 2026-11-09'da MCP ile `0179_accounting_checks_fixes` adıyla uygulandı; main 0179 ve 0180 numaralarını EON-FR6'ya verdiği için dosya 0181'e taşındı. Fonksiyon gövdesindeki notlarda ve canlı fonksiyon yorumunda geçen `0179` bu dosyadır; gövde canlıyla bayt bayt aynıdır (md5 `007910a1fb56c9d82a0630bac00825d5`).
- Belgeler: `docs/satis-maliyet-takip.md` (muhasebe kuralları ve dış kaynaklar: IRS Pub 334 ve 538, Schedule C talimatları, Etsy Help, Etsy OpenAPI), `docs/etsy-playbook/INDEX.md`.
- Ham kayıtlar: `docs/muhasebe/kaynak/` (analiz, çürütme, ayıklama, bağımsız ölçümler; otomatik okunmaz).
